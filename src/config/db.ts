import { DATABASE_URL } from "./env.config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Simple check without process.env to avoid TypeScript errors
if (!DATABASE_URL) {
  console.warn('WARNING: DATABASE_URL is not defined in environment variables');
}

let pool: pg.Pool | undefined;
let adapter: PrismaPg | undefined;
let prisma: PrismaClient | undefined;

if (DATABASE_URL) {
  pool = new pg.Pool({
    connectionString: DATABASE_URL
  });
  adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  // Create a dummy prisma client for build time
  prisma = new PrismaClient();
}

export default prisma!;