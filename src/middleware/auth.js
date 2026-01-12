import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.ts";

/**
 * Verify JWT token and attach user to request
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from database using Prisma
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        loginStartTime: true,
        loginEndTime: true,
        isActive: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account has been deactivated",
      });
    }

    // Check login time restrictions for employees on every API call
    if (user.role === "employee") {
      const timeCheck = checkLoginTime(user.loginStartTime, user.loginEndTime);

      if (!timeCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: "Session expired: " + timeCheck.message,
          currentTime: timeCheck.currentTime,
          allowedStartTime: user.loginStartTime,
          allowedEndTime: user.loginEndTime,
          code: "OUTSIDE_ALLOWED_TIME",
        });
      }
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired",
      });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Check if user is admin
 */
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }
  next();
};

/**
 * Check if user is within allowed login time (for employees)
 * @param {string|null} loginStartTime - Allowed start time (HH:MM:SS)
 * @param {string|null} loginEndTime - Allowed end time (HH:MM:SS)
 * @returns {Object} { allowed: boolean, message?: string, currentTime?: string }
 */
const checkLoginTime = (loginStartTime, loginEndTime) => {
  if (!loginStartTime || !loginEndTime) {
    return { allowed: true };
  }

  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 8); // HH:MM:SS format

  const start = loginStartTime;
  const end = loginEndTime;

  // Handle overnight shifts (e.g., 22:00 to 06:00)
  if (start > end) {
    // If current time is after start OR before end, it's allowed
    if (currentTime >= start || currentTime <= end) {
      return { allowed: true };
    }
  } else {
    // Normal case: start is before end
    if (currentTime >= start && currentTime <= end) {
      return { allowed: true };
    }
  }

  return {
    allowed: false,
    message: `Login allowed only between ${loginStartTime} and ${loginEndTime}`,
    currentTime,
  };
};

module.exports = {
  authenticateToken,
  isAdmin,
  checkLoginTime,
};
