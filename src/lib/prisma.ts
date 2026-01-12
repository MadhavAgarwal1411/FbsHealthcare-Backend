import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../../generated/prisma/client.ts";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`❌ Missing required env var: ${name}`);
  }
  return value;
}

const adapter = new PrismaMariaDb({
  host: required("DATABASE_HOST"),
  user: required("DATABASE_USER"),
  password: required("DATABASE_PASSWORD"),
  database: required("DATABASE_NAME"),
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

export { prisma };
