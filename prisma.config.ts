import { defineConfig } from "prisma/config";
import 'dotenv/config';

// Type declaration for process to avoid TypeScript errors
declare const process: {
  env: {
    DATABASE_URL?: string;
  };
};

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://dummy:password@localhost:5432/db';

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: DATABASE_URL,
  },
});
