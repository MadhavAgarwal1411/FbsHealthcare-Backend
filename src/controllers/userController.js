import { User, LoginSession } from "../models/index.js";

/**
 * Get all users (Admin only)
 */
const getAllUsers = async (req, res) => {
  try {
    const { role, isActive, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { users, total } = await User.findAll({
      role,
      isActive: isActive !== undefined ? isActive === "true" : undefined,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalCount: total,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Get user by ID (Admin only)
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Update user (Admin only)
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, role, loginStartTime, loginEndTime, isActive } =
      req.body;

    // Check if user exists
    const existingUser = await User.findById(id);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Build updates object
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (role !== undefined) updates.role = role;
    if (loginStartTime !== undefined)
      updates.loginStartTime = loginStartTime || null;
    if (loginEndTime !== undefined) updates.loginEndTime = loginEndTime || null;
    if (isActive !== undefined) updates.isActive = isActive;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    const user = await User.update(id, updates);

    res.json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Delete user (Admin only)
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own account",
      });
    }

    const deletedUser = await User.delete(id);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User deleted successfully",
      data: deletedUser,
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Get user login history (Admin only)
 */
const getUserLoginHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Check if user exists
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { sessions, total } = await LoginSession.findByUserId(id, {
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalCount: total,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Get user login history error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Reset user password (Admin only)
 */
const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    // Check if user exists
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await User.updatePassword(id, newPassword);

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset user password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Get user login statistics (Admin only)
 */
const getUserLoginStats = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const stats = await LoginSession.getStats(id);

    res.json({
      success: true,
      data: {
        totalLogins: stats.total_logins,
        loginsLast30Days: stats.logins_last_30_days,
        loginsLast7Days: stats.logins_last_7_days,
        lastLogin: stats.last_login,
      },
    });
  } catch (error) {
    console.error("Get user login stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const userController = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserLoginHistory,
  resetUserPassword,
  getUserLoginStats,
};

export default userController