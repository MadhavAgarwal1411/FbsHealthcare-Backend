import jwt from "jsonwebtoken";
import { User, LoginSession } from "../models/index.js";
// Changed: Named import for checkLoginTime
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
    const existingUser = await User.emailExists(email);

    if (existingUser) {
      return res
        .status(409)
        .json({
          success: false,
          message: "User with this email already exists",
        });
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role,
      loginStartTime,
      loginEndTime,
    });

    res
      .status(201)
      .json({
        success: true,
        message: "User registered successfully",
        data: user,
      });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
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

    const user = await User.findByEmail(email);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Account has been deactivated. Please contact admin.",
        });
    }

    const isPasswordValid = await User.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

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

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );

    await LoginSession.create({ userId: user.id, ipAddress, userAgent });

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
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

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
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const logout = async (req, res) => {
  try {
    await LoginSession.endSession(req.user.id);
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByEmail(req.user.email);
    const isPasswordValid = await User.verifyPassword(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect" });
    }

    await User.updatePassword(req.user.id, newPassword);
    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const authController = { register, login, getProfile, logout, changePassword };
export default authController;
