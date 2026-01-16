import { json } from "node:stream/consumers";
import { prisma } from "../lib/prisma.js";

export const createLead = async (req, res) => {
  const { customerName, product, customerPhone, assignedToId, customerQuery } =
    req.body;

  try {
    const newLead = await prisma.lead.create({
      data: {
        customerName,
        product,
        customerPhone,
        customerQuery,
        createdById: parseInt(req.user.id),
        assignedToId: assignedToId ? parseInt(assignedToId) : null,
      },
      include: {
        assignedTo: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
    });
    res.status(201).json({
      success: true,
      data: newLead,
    });
  } catch (error) {
    // Logic to catch the specific Foreign Key error
    if (error.code === "P2003") {
      return res.status(400).json({
        success: false,
        error: "The assigned employee ID does not exist.",
      });
    }

    console.error("Create Lead Error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};