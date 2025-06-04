import { eq } from "drizzle-orm";

export default defineOAuthGitHubEventHandler({
  config: {
    emailRequired: true,
  },
  async onSuccess(event, { user, tokens }) {
    if (!user.email) {
      throw createError({
        statusCode: 500,
        statusMessage: "Github account must have an email address set.",
      });
    }

    const db = useDb();
    let existingUser = await db.query.users.findFirst({
      where: eq(schema.users.email, user.email),
    });

    if (!existingUser) {
      const result = await db
        .insert(schema.users)
        .values({
          email: user.email,
          login: user.login,
          name: user.name,
        })
        .returning();
      existingUser = result.at(0);
    }

    if (!existingUser) {
      throw createError({
        statusCode: 500,
        statusMessage: "Error authenticating with Github",
      });
    }

    const { password, ...userWithoutPassword } = existingUser;
    await setUserSession(event, {
      user: userWithoutPassword,
    });
    return sendRedirect(event, "/");
  },
  // Optional, will return a json error and 401 status code by default
  onError(event, error) {
    console.error("GitHub OAuth error:", error);
    return sendRedirect(event, "/");
  },
});
