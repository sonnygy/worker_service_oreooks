import { DATABASE_URL } from "./env.config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

const pool = new pg.Pool({
	connectionString: DATABASE_URL
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;