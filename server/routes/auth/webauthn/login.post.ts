import { eq } from "drizzle-orm";
export default defineWebAuthnAuthenticateEventHandler({
  async allowCredentials(event, userName) {
    const db = useDb();

    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, userName),
      with: {
        credentials: true,
      },
    });

    // If user is found, only allow credentials that are registered
    // The browser will automatically try to use the credential that it knows about
    // Skipping the step for the user to select a credential for a better user experience
    return user?.credentials || [];
  },
  async getCredential(event, credentialId) {
    // Look for the credential in our database
    const credential = await useDb().query.credentials.findFirst({
      where: eq(schema.credentials.id, credentialId),
      with: {
        user: true,
      },
    });

    // If the credential is not found, there is no account to log in to
    if (!credential) {
      throw createError({
        statusCode: 404,
        statusMessage: "Credential not found",
      });
    }

    return credential;
  },
  async onSuccess(event, { credential }) {
    // The credential authentication has been successful
    // Set the user session
    const { password: stash, ...userWithoutPassword } = credential.user;
    await setUserSession(event, {
      user: userWithoutPassword,
    });
  },
});
