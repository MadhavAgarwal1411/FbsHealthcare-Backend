import { prisma } from "../lib/prisma.js";

/**
 * Order Model - Prisma-based
 *
 * Provides clean methods for order CRUD operations,
 * assignment, status updates, and RTO handling.
 */
const Order = {
  /**
   * Find order by ID
   * @param {number} id
   */
  async findById(id) {
    return prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: true,
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        statusLogs: {
          orderBy: { createdAt: "desc" },
        },
        rto: true,
      },
    });
  },

  /**
   * Find order by order number
   * @param {string} orderNumber
   */
  async findByOrderNumber(orderNumber) {
    return prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
      },
    });
  },

  /**
   * Get all orders with filters
   */
  async findAll({
    status,
    paymentStatus,
    assignedToId,
    limit = 10,
    offset = 0,
  } = {}) {
    const where = {};

    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (assignedToId) where.assignedToId = parseInt(assignedToId);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          assignedTo: {
            select: { id: true, name: true },
          },
          createdBy: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, total };
  },

  /**
   * Create a new order
   */
  async create({
    orderNumber,
    customerName,
    customerPhone,
    customerEmail,
    shippingAddress,
    totalAmount,
    createdById,
    items = [],
  }) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerName,
          customerPhone,
          customerEmail,
          shippingAddress,
          totalAmount,
          createdById,
          status: "pending",
          paymentStatus: "pending",
        },
      });

      if (items.length) {
        await tx.orderItem.createMany({
          data: items.map((item) => ({
            orderId: order.id,
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
          })),
        });
      }

      await tx.orderStatusLog.create({
        data: {
          orderId: order.id,
          status: "pending",
          note: "Order created",
        },
      });

      return order;
    });
  },

  /**
   * Assign order to employee
   */
  async assign(orderId, assignedToId) {
    return prisma.$transaction([
      prisma.order.update({
        where: { id: parseInt(orderId) },
        data: { assignedToId: parseInt(assignedToId) },
      }),
      prisma.orderStatusLog.create({
        data: {
          orderId: parseInt(orderId),
          status: "confirmed",
          note: "Order assigned to employee",
        },
      }),
    ]);
  },

  /**
   * Update order status
   */
  async updateStatus(orderId, status, note) {
    return prisma.$transaction([
      prisma.order.update({
        where: { id: parseInt(orderId) },
        data: { status },
      }),
      prisma.orderStatusLog.create({
        data: {
          orderId: parseInt(orderId),
          status,
          note: note || null,
        },
      }),
    ]);
  },

  /**
   * Mark order as delivered
   */
  async markDelivered(orderId) {
    return this.updateStatus(orderId, "delivered", "Order delivered");
  },

  /**
   * Initiate RTO
   */
  async initiateRTO(orderId, reason) {
    return prisma.$transaction([
      prisma.order.update({
        where: { id: parseInt(orderId) },
        data: { status: "rto_initiated" },
      }),
      prisma.rTOOrder.create({
        data: {
          orderId: parseInt(orderId),
          reason,
        },
      }),
      prisma.orderStatusLog.create({
        data: {
          orderId: parseInt(orderId),
          status: "rto_initiated",
          note: reason,
        },
      }),
    ]);
  },

  /**
   * Mark RTO as received
   */
  async markRTOReceived(orderId) {
    return prisma.$transaction([
      prisma.order.update({
        where: { id: parseInt(orderId) },
        data: { status: "rto_received" },
      }),
      prisma.rTOOrder.update({
        where: { orderId: parseInt(orderId) },
        data: { receivedAt: new Date() },
      }),
      prisma.orderStatusLog.create({
        data: {
          orderId: parseInt(orderId),
          status: "rto_received",
          note: "RTO received",
        },
      }),
    ]);
  },

  /**
   * Delete order (admin only)
   */
  async delete(orderId) {
    try {
      return await prisma.order.delete({
        where: { id: parseInt(orderId) },
        select: { id: true, orderNumber: true },
      });
    } catch (error) {
      if (error.code === "P2025") return null;
      throw error;
    }
  },
};

export default Order;
