import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event);

  const user = await useDb().query.users.findFirst({
    where: eq(schema.users.email, email),
  });

  // user with email not found
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid email or password. Please try again.",
    });
  }

  // do other things here like:
  // check if the user is verified
  // check if locked (too many attempts)
  // check if user is banned

  // user didn't register with a password so we can't log them in
  if (!user.password) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid email or password. Please try again.",
    });
  }

  const isValid = await verifyPassword(user.password, password);

  // password is incorrect
  if (!isValid) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid email or password. Please try again.",
    });
  }

  // user is logged in! 🎉
  await setUserSession(event, { user });

  return user;
});
