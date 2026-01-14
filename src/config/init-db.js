import { prisma } from "../lib/prisma.ts";
import User from "../models/User.js";

/**
 * Seed default admin user using Prisma
 */
const seedAdminUser = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: "admin@fbs.com" },
    });

    if (!existingAdmin) {
      // Create admin using User model (handles password hashing)
      await User.create({
        name: "Admin User",
        email: "admin@fbs.com",
        phone: "9999999999",
        password: "admin123",
        role: "admin",
      });

      console.log("✅ Default admin user created (admin@fbs.com / admin123)");
    } else {
      console.log("ℹ️  Admin user already exists");
    }
  } catch (error) {
    console.error("❌ Error seeding admin user:", error);
    throw error;
  }
};

/**
 * Initialize database (seed data)
 * Note: Prisma handles table creation via migrations
 */
const initializeDatabase = async () => {
  if (process.env.SEED_ADMIN === "true") {
    await seedAdminUser();
  }
};

export { initializeDatabase, seedAdminUser };
