export default defineEventHandler(async (event) => {
  await setUserSession(event, {
    // User data
    user: {
      login: "atinux",
    },
    // Private data accessible only on server/ routes
    secure: {
      apiToken: "1234567890",
    },
    // Any extra fields for the session data
    loggedInAt: new Date(),
  });
});
