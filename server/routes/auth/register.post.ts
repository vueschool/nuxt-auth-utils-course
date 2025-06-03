import { eq } from "drizzle-orm";
export default defineEventHandler(async (event) => {
  const { name, email, password } = await readBody(event);

  if (!name || !email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing required fields",
    });
  }

  const existingUser = await useDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  if (existingUser.at(0)) {
    throw createError({
      statusCode: 400,
      statusMessage: "This email is already in use. Please login.",
    });
  }

  const res = await useDb()
    .insert(schema.users)
    .values({
      name,
      email,
      password: await hashPassword(password),
    })
    .returning();

  const newUser = res.at(0);
  if (!newUser) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to register user",
    });
  }

  // do other things here like:
  // require email verification
  // send a welcome email

  await setUserSession(event, {
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      login: newUser.login,
    },
  });

  return res;
});
