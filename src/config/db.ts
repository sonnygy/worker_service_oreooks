import { PrismaClient } from "@prisma/client";
import { DATABASE_URL } from "./env.config";

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

const prisma = new PrismaClient();

export default prisma;