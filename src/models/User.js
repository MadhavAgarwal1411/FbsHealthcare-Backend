import {prisma} from "../lib/prisma.ts";
import bcrypt from "bcryptjs";

/**
 * User Model - Prisma-based
 *
 * Provides clean methods for user CRUD operations with automatic
 * password hashing and secure queries via Prisma ORM.
 */
const User = {
  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Promise<User|null>}
   */
  async findById(id) {
    return prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        loginStartTime: true,
        loginEndTime: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  /**
   * Find user by email (includes password for auth)
   * @param {string} email - User email
   * @returns {Promise<User|null>}
   */
  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  /**
   * Find all users with optional filters
   * @param {Object} options - Query options
   * @returns {Promise<{users: User[], total: number}>}
   */
  async findAll({ role, isActive, limit = 10, offset = 0 } = {}) {
    const where = {};

    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          loginStartTime: true,
          loginEndTime: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  },

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<User>}
   */
  async create({
    name,
    email,
    phone,
    password,
    role = "employee",
    loginStartTime,
    loginEndTime,
  }) {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    return prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role,
        loginStartTime: loginStartTime || null,
        loginEndTime: loginEndTime || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        loginStartTime: true,
        loginEndTime: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  /**
   * Update a user
   * @param {number} id - User ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<User|null>}
   */
  async update(id, updates) {
    // Only allow specific fields to be updated
    const allowedFields = [
      "name",
      "phone",
      "role",
      "loginStartTime",
      "loginEndTime",
      "isActive",
    ];
    const data = {};

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        data[key] = value;
      }
    }

    if (Object.keys(data).length === 0) return null;

    return prisma.user.update({
      where: { id: parseInt(id) },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        loginStartTime: true,
        loginEndTime: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  /**
   * Update user password
   * @param {number} id - User ID
   * @param {string} newPassword - New plain text password
   * @returns {Promise<boolean>}
   */
  async updatePassword(id, newPassword) {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { password: hashedPassword },
    });

    return true;
  },

  /**
   * Verify user password
   * @param {string} plainPassword - Plain text password
   * @param {string} hashedPassword - Hashed password from database
   * @returns {Promise<boolean>}
   */
  async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  },

  /**
   * Delete a user
   * @param {number} id - User ID
   * @returns {Promise<{id: number, email: string}|null>}
   */
  async delete(id) {
    try {
      return await prisma.user.delete({
        where: { id: parseInt(id) },
        select: { id: true, email: true },
      });
    } catch (error) {
      if (error.code === "P2025") return null; // Record not found
      throw error;
    }
  },

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @returns {Promise<boolean>}
   */
  async emailExists(email) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    return !!user;
  },
};

export default User
