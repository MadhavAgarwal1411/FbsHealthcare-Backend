import jwt from "jsonwebtoken";
// Fixed: Changed .ts to .js for Node compatibility
import { prisma } from "../lib/prisma.js";

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Access token required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

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
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    if (!user.isActive) {
      return res
        .status(403)
        .json({ success: false, message: "Account has been deactivated" });
    }

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
      return res
        .status(401)
        .json({ success: false, message: "Token has expired" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
    console.error("Auth middleware error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Admin access required" });
  }
  next();
};

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

const checkLoginTime = (loginStartTime, loginEndTime) => {
  if (!loginStartTime || !loginEndTime) {
    return { allowed: true };
  }

  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 8);

  const start = loginStartTime;
  const end = loginEndTime;

  if (start > end) {
    if (currentTime >= start || currentTime <= end) {
      return { allowed: true };
    }
  } else {
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

export { authenticateToken, isAdmin, checkLoginTime };
