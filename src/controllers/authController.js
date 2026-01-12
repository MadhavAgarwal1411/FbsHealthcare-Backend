import jwt from "jsonwebtoken";
import { User, LoginSession } from "../models/index.js";
import { checkLoginTime } from "../middleware/auth.js";

/**
 * Register a new user (Admin only)
 */
const register = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role = "employee",
      loginStartTime,
      loginEndTime,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.emailExists(email);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Create new user (password is auto-hashed by User model)
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role,
      loginStartTime,
      loginEndTime,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];

    // Find user by email
    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account has been deactivated. Please contact admin.",
      });
    }

    // Verify password
    const isPasswordValid = await User.verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check login time restrictions for employees
    if (user.role === "employee") {
      const timeCheck = checkLoginTime(user.loginStartTime, user.loginEndTime);

      if (!timeCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: timeCheck.message,
          currentTime: timeCheck.currentTime,
          allowedStartTime: user.loginStartTime,
          allowedEndTime: user.loginEndTime,
        });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );

    // Record login session
    await LoginSession.create({
      userId: user.id,
      ipAddress,
      userAgent,
    });

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          loginStartTime: user.loginStartTime,
          loginEndTime: user.loginEndTime,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        loginStartTime: req.user.loginStartTime,
        loginEndTime: req.user.loginEndTime,
        isActive: req.user.isActive,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Logout (invalidate session)
 */
const logout = async (req, res) => {
  try {
    await LoginSession.endSession(req.user.id);

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Change password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findByEmail(req.user.email);

    // Verify current password
    const isPasswordValid = await User.verifyPassword(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    await User.updatePassword(req.user.id, newPassword);

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  logout,
  changePassword,
};
