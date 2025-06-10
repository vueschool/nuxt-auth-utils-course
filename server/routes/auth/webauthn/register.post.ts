import { z } from "zod";
import { eq } from "drizzle-orm";

export default defineWebAuthnRegisterEventHandler({
  validateUser: async (user, event) => {
    // If the user is already logged in, check if the email matches the session
    // supports adding a passkey to exisiting account
    const session = await getUserSession(event);
    if (session.user?.email && session.user.email !== user.userName) {
      throw createError({
        statusCode: 400,
        message: "Email not matching curent session",
        statusMessage:
          "Provide the same email as is on your account to add a passkey.",
      });
    }

    const existingUser = await useDb().query.users.findFirst({
      where: eq(schema.users.email, user.userName),
    });
    if (!session?.user && existingUser) {
      throw createError({
        statusCode: 400,
        statusMessage: "Please login to add a passkey to your account.",
      });
    }
    const existingUserWithUsername = existingUser
      ? {
          ...existingUser,
          userName: existingUser?.email,
        }
      : undefined;
    // Validate the user registration object
    const validatedUser = await z
      .object({
        userName: z.string().email(),
        name: z.string(),
        id: z.number().optional(),
      })
      .parseAsync(existingUserWithUsername || user);
    return validatedUser;
  },

  async onSuccess(event, { user, credential }) {
    const db = useDb();

    // Insert the newly registered user into the database
    // If the user already exists, this will do nothing
    // Avoids the user being created twice
    // And is fine because we validated the existing user in the validateUser function.
    const dbUser = await db
      .insert(schema.users)
      .values({
        id: user.id,
        email: user.userName,
        login: user.userName,
        name: user.name,
      })
      .onConflictDoUpdate({
        target: schema.users.id,
        set: {
          name: user.name,
          email: user.userName,
        },
      })
      .returning()
      .get();

    // Insert the credential into the database
    await db.insert(schema.credentials).values({
      userId: dbUser.id,
      id: credential.id,
      publicKey: credential.publicKey,
      counter: credential.counter,
      backedUp: credential.backedUp,
      transports: credential.transports,
    });

    // Set the user session
    const { password: stash, ...userWithoutPassword } = dbUser;
    await setUserSession(event, {
      user: userWithoutPassword,
    });
  },
});
