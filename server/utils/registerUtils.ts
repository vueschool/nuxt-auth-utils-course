import { eq } from "drizzle-orm";
export async function throwIfUserExists(email: string) {
  const existingUser = await useDb().query.users.findFirst({
    where: eq(schema.users.email, email),
  });

  if (existingUser) {
    throw createError({
      statusCode: 400,
      statusMessage: "Account already exists. Please login.",
    });
  }
}

export async function registerUser(
  email: string,
  name: string,
  password: string
) {
  const result = await useDb()
    .insert(schema.users)
    .values({
      name,
      email,
      password: await hashPassword(password),
      login: email,
    })
    .returning();

  const newUser = result.at(0);
  if (!newUser) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to register user",
    });
  }
  return newUser;
}
