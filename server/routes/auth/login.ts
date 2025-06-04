export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event);
  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: "Email and password are required.",
    });
  }
  const ip = getRequestIP(event, { xForwardedFor: true }) || "unknown";
  console.log("ip", ip);

  const authenticatedUser = await checkLoginAttemptsAndAuthenticate(
    ip,
    email,
    password
  );

  // If we reach here, login was successful and not blocked.
  await setUserSession(event, { user: authenticatedUser });
  return authenticatedUser;
});
