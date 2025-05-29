export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  return {
    sensitive: "Logged in only!",
  };
});
