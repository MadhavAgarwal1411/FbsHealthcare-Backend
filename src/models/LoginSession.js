import prisma from "../lib/prisma.ts";

/**
 * LoginSession Model - Prisma-based
 *
 * Tracks user login history for auditing and security purposes.
 */
const LoginSession = {
  /**
   * Create a new login session
   * @param {Object} sessionData - Session data
   * @returns {Promise<LoginSession>}
   */
  async create({ userId, ipAddress, userAgent }) {
    return prisma.loginSession.create({
      data: {
        userId: parseInt(userId),
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });
  },

  /**
   * Find session by ID
   * @param {number} id - Session ID
   * @returns {Promise<LoginSession|null>}
   */
  async findById(id) {
    return prisma.loginSession.findUnique({
      where: { id: parseInt(id) },
    });
  },

  /**
   * Find all sessions for a user
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<{sessions: LoginSession[], total: number}>}
   */
  async findByUserId(userId, { limit = 20, offset = 0 } = {}) {
    const [sessions, total] = await Promise.all([
      prisma.loginSession.findMany({
        where: { userId: parseInt(userId) },
        orderBy: { loginTime: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.loginSession.count({
        where: { userId: parseInt(userId) },
      }),
    ]);

    return { sessions, total };
  },

  /**
   * Get active sessions for a user
   * @param {number} userId - User ID
   * @returns {Promise<LoginSession[]>}
   */
  async getActiveSessions(userId) {
    return prisma.loginSession.findMany({
      where: {
        userId: parseInt(userId),
        isValid: true,
        logoutTime: null,
      },
      orderBy: { loginTime: "desc" },
    });
  },

  /**
   * End a session (logout)
   * @param {number} userId - User ID
   * @returns {Promise<LoginSession|null>}
   */
  async endSession(userId) {
    // Find the most recent active session
    const session = await prisma.loginSession.findFirst({
      where: {
        userId: parseInt(userId),
        logoutTime: null,
      },
      orderBy: { loginTime: "desc" },
    });

    if (!session) return null;

    return prisma.loginSession.update({
      where: { id: session.id },
      data: {
        logoutTime: new Date(),
        isValid: false,
      },
    });
  },

  /**
   * Invalidate all sessions for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>} Number of sessions invalidated
   */
  async invalidateAllSessions(userId) {
    const result = await prisma.loginSession.updateMany({
      where: {
        userId: parseInt(userId),
        isValid: true,
      },
      data: {
        isValid: false,
        logoutTime: new Date(),
      },
    });

    return result.count;
  },

  /**
   * Get login statistics for a user
   * @param {number} userId - User ID
   * @returns {Promise<Object>}
   */
  async getStats(userId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [totalLogins, loginsLast30Days, loginsLast7Days, lastSession] =
      await Promise.all([
        prisma.loginSession.count({
          where: { userId: parseInt(userId) },
        }),
        prisma.loginSession.count({
          where: {
            userId: parseInt(userId),
            loginTime: { gte: thirtyDaysAgo },
          },
        }),
        prisma.loginSession.count({
          where: {
            userId: parseInt(userId),
            loginTime: { gte: sevenDaysAgo },
          },
        }),
        prisma.loginSession.findFirst({
          where: { userId: parseInt(userId) },
          orderBy: { loginTime: "desc" },
          select: { loginTime: true },
        }),
      ]);

    return {
      total_logins: totalLogins,
      logins_last_30_days: loginsLast30Days,
      logins_last_7_days: loginsLast7Days,
      last_login: lastSession?.loginTime || null,
    };
  },

  /**
   * Delete old sessions (cleanup)
   * @param {number} daysOld - Delete sessions older than this many days
   * @returns {Promise<number>} Number of sessions deleted
   */
  async deleteOldSessions(daysOld = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.loginSession.deleteMany({
      where: {
        loginTime: { lt: cutoffDate },
      },
    });

    return result.count;
  },
};

module.exports = LoginSession;
