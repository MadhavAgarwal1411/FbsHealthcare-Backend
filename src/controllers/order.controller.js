import Order from "../models/Orders.js";

/**
 * Create new order
 * Admin / Employee
 */
export const createOrder = async (req, res, next) => {
  try {
    const order = await Order.create({
      ...req.body,
      createdById: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all orders
 * Admin: all orders
 * Employee: only assigned orders
 */
export const getOrders = async (req, res, next) => {
  try {
    const { status, paymentStatus, limit, offset } = req.query;

    const filters = {
      status,
      paymentStatus,
      limit: Number(limit) || 10,
      offset: Number(offset) || 0,
    };

    if (req.user.role === "employee") {
      filters.assignedToId = req.user.id;
    }

    const result = await Order.findAll(filters);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get order by ID
 */
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Employee access guard
    if (
      req.user.role === "employee" &&
      order.assignedToId !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign order to employee
 * Admin only
 */
export const assignOrder = async (req, res, next) => {
  try {
    const { assignedToId } = req.body;

    await Order.assign(req.params.id, assignedToId);

    res.json({
      success: true,
      message: "Order assigned successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update order status
 * Admin / Employee (own orders)
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;

    await Order.updateStatus(req.params.id, status, note);

    res.json({
      success: true,
      message: "Order status updated",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark order delivered
 */
export const markDelivered = async (req, res, next) => {
  try {
    await Order.markDelivered(req.params.id);

    res.json({
      success: true,
      message: "Order marked as delivered",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Initiate RTO
 */
export const initiateRTO = async (req, res, next) => {
  try {
    const { reason } = req.body;

    await Order.initiateRTO(req.params.id, reason);

    res.json({
      success: true,
      message: "RTO initiated",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark RTO received
 */
export const markRTOReceived = async (req, res, next) => {
  try {
    await Order.markRTOReceived(req.params.id);

    res.json({
      success: true,
      message: "RTO marked as received",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete order
 * Admin only
 */
export const deleteOrder = async (req, res, next) => {
  try {
    const deleted = await Order.delete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      message: "Order deleted",
    });
  } catch (error) {
    next(error);
  }
};
