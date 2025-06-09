import { eq, and, gt, count, SQL } from "drizzle-orm";

// Brute-force protection constants
const MAX_FAILED_ATTEMPTS_PER_IP = 10;
const MAX_FAILED_ATTEMPTS_PER_USER = 5;
const ATTEMPT_WINDOW_MINUTES = 2;

type User = Omit<typeof schema.users.$inferSelect, "password">;
type FailedAttemptsColumn =
  (typeof schema.loginAttempts)["_"]["columns"][keyof (typeof schema.loginAttempts)["_"]["columns"]];

/**
 * Checks login attempts and authenticates a user.
 */
export async function checkLoginAttemptsAndAuthenticate(
  ip: string,
  email: string,
  passwordInput: string
): Promise<User> {
  const db = useDb();
  // 1. Check IP Lockout
  await checkUserLockoutByIpAndThrow(ip);

  // 2. Find user
  const user = await db.query.users.findFirst({
    where: eq(schema.users.email, email),
  });

  // 3. Handle user not found
  if (!user || !user?.password) {
    await recordLoginAttempt(null, ip);
    throw createError({
      // userId is null as user not found
      statusCode: 401,
      statusMessage: "Invalid email or password. Please try again.",
    });
  }

  // 4. Check User Lockout (user is non-null here)
  await checkUserLockoutByUserIdAndThrow(user.id, ip);

  // 5. Validate Password
  const isValidPassword = await verifyPassword(user.password!, passwordInput);

  if (!isValidPassword) {
    await recordLoginAttempt(user.id, ip);
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid email or password. Please try again.",
    });
  }

  // 6. Record successful attempt (user and user.password are valid)
  await db.insert(schema.loginAttempts).values({
    userId: user.id,
    ip,
    timestamp: Date.now(),
    success: 1,
  });

  const { password: stash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Retrieves the count of failed login attempts for a given field and value within a specified time window.
 */
async function getFailedAttemptsCount(
  filterField: FailedAttemptsColumn,
  filterValue: string | number
): Promise<number> {
  const db = useDb();
  const windowStartTimestamp = Date.now() - ATTEMPT_WINDOW_MINUTES * 60 * 1000;

  const result = await db
    .select({ value: count() })
    .from(schema.loginAttempts)
    .where(
      and(
        eq(filterField, filterValue),
        eq(schema.loginAttempts.success, 0), // 0 for false (failed attempts)
        gt(schema.loginAttempts.timestamp, windowStartTimestamp)
      )
    );
  return result[0]?.value || 0;
}

/**
 * Records a login attempt and then throws a structured error.
 */
async function recordLoginAttempt(
  userId: number | null,
  ip: string
): Promise<void> {
  const db = useDb();
  // Promise<never> indicates this function never returns normally
  await db.insert(schema.loginAttempts).values({
    userId,
    ip,
    timestamp: Date.now(),
    success: 0, // Attempt leading to an error is considered unsuccessful
  });
}

async function checkUserLockoutByIpAndThrow(ip: string): Promise<void> {
  const ipFailedCount = await getFailedAttemptsCount(
    schema.loginAttempts.ip,
    ip
  );
  const failed = ipFailedCount >= MAX_FAILED_ATTEMPTS_PER_IP;
  if (failed) {
    await recordLoginAttempt(null, ip);
    throw createError({
      statusCode: 429,
      statusMessage:
        "Too many login attempts from this IP. Please try again later.",
    });
  }
}

async function checkUserLockoutByUserIdAndThrow(
  userId: number,
  ip: string
): Promise<void> {
  const db = useDb();
  const userFailedCount = await getFailedAttemptsCount(
    schema.loginAttempts.userId,
    userId
  );
  if (userFailedCount >= MAX_FAILED_ATTEMPTS_PER_USER) {
    await recordLoginAttempt(userId, ip);
    throw createError({
      statusCode: 429,
      statusMessage:
        "Too many login attempts for this account. Please try again later.",
    });
  }
}
