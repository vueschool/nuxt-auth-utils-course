import { db } from "../db/index";
export * as schema from "../db/schema";
export const useDb = () => db;
