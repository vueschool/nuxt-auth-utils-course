export default defineOAuthGitHubEventHandler({
  config: {
    emailRequired: true,
  },
  async onSuccess(event, { user, tokens }) {
    const db = useDb();

    if (!user.email) {
      throw createError({
        statusCode: 400,
        statusMessage: "Email in GitHub profile is required",
      });
    }

    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, user.email!),
    });

    if (!existingUser) {
      await db.insert(schema.users).values({
        email: user.email,
        login: user.login,
        name: user.name,
      });
    }

    await setUserSession(event, {
      user: {
        login: user.login,
      },
    });
    return sendRedirect(event, "/admin");
  },
  // Optional, will return a json error and 401 status code by default
  onError(event, error) {
    console.error("GitHub OAuth error:", error);
    return sendRedirect(event, "/");
  },
});
