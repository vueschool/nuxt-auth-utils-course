export default defineEventHandler(async (event) => {
  const db = useDb();
  return db.query.users.findMany();
});
