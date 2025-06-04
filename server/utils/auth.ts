import { eq, and, gt, count, SQL } from "drizzle-orm";

// Brute-force protection constants
// Not exporting these as they are only used by the function below, but can be if needed.
const MAX_FAILED_ATTEMPTS_PER_IP = 10;
const MAX_FAILED_ATTEMPTS_PER_USER = 5;
const ATTEMPT_WINDOW_MINUTES = 2;

/**
 * Retrieves the count of failed login attempts for a given field and value within a specified time window.
 */
async function getFailedAttemptsCount(
  db: any, // Replace 'any' with your actual Drizzle DB type if available
  filterField: SQL,
  filterValue: string | number,
  windowStartTimestamp: number
): Promise<number> {
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
async function recordAttemptAndThrow(
  db: any, // Replace 'any' with your actual Drizzle DB type
  userId: number | null,
  ip: string,
  // 'success' is effectively always false if this function throws, but kept for consistency with table schema
  errorDetails: { statusCode: number; statusMessage: string }
): Promise<never> {
  // Promise<never> indicates this function never returns normally
  await db.insert(schema.loginAttempts).values({
    userId,
    ip,
    timestamp: Math.floor(Date.now() / 1000),
    success: 0, // Attempt leading to an error is considered unsuccessful
  });
  throw createError(errorDetails);
}

export async function checkLoginAttemptsAndAuthenticate(
  ip: string,
  email: string,
  passwordInput: string
): Promise<any> {
  const db = useDb();
  const windowStartTimestamp =
    Math.floor(Date.now() / 1000) - ATTEMPT_WINDOW_MINUTES * 60;

  // 1. Check IP Lockout
  const ipFailedCount = await getFailedAttemptsCount(
    db,
    schema.loginAttempts.ip as unknown as SQL,
    ip,
    windowStartTimestamp
  );
  if (ipFailedCount >= MAX_FAILED_ATTEMPTS_PER_IP) {
    await recordAttemptAndThrow(db, null, ip, {
      statusCode: 429,
      statusMessage:
        "Too many login attempts from this IP. Please try again later.",
    });
    throw new Error(
      "IP Lockout: Should have been handled by recordAttemptAndThrow"
    );
  }

  // 2. Find user
  const user = await db.query.users.findFirst({
    where: eq(schema.users.email, email),
  });

  // 3. Handle user not found
  if (!user) {
    await recordAttemptAndThrow(db, null, ip, {
      // userId is null as user not found
      statusCode: 401,
      statusMessage: "Invalid email or password. Please try again.",
    });
    throw new Error(
      "User Not Found: Should have been handled by recordAttemptAndThrow"
    );
  }
  // From this point, 'user' is guaranteed to be non-null.

  // 4. Check User Lockout (user is non-null here)
  const userFailedCount = await getFailedAttemptsCount(
    db,
    schema.loginAttempts.userId as unknown as SQL,
    user.id, // Safe: user is non-null
    windowStartTimestamp
  );
  if (userFailedCount >= MAX_FAILED_ATTEMPTS_PER_USER) {
    await recordAttemptAndThrow(db, user.id, ip, {
      // Safe: user is non-null
      statusCode: 429,
      statusMessage:
        "Too many login attempts for this account. Please try again later.",
    });
    throw new Error(
      "User Lockout: Should have been handled by recordAttemptAndThrow"
    );
  }

  // 5. Validate User Password existence (user is non-null here)
  if (!user.password) {
    await recordAttemptAndThrow(db, user.id, ip, {
      // Safe: user is non-null
      statusCode: 401,
      statusMessage: "Account not configured for password login.",
    });
    throw new Error(
      "Password Not Set: Should have been handled by recordAttemptAndThrow"
    );
  }
  // From this point, 'user.password' is guaranteed to be a non-empty string.

  // 6. Validate Password
  const isValidPassword = await verifyPassword(user.password!, passwordInput);

  if (!isValidPassword) {
    await recordAttemptAndThrow(db, user.id, ip, {
      // Safe: user is non-null
      statusCode: 401,
      statusMessage: "Invalid email or password. Please try again.",
    });
    throw new Error(
      "Invalid Password: Should have been handled by recordAttemptAndThrow"
    );
  }

  // 7. Record successful attempt (user and user.password are valid)
  await db.insert(schema.loginAttempts).values({
    userId: user.id, // Safe: user is non-null
    ip,
    timestamp: Math.floor(Date.now() / 1000),
    success: 1,
  });

  return user;
}
