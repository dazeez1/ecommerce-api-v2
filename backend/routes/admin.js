const express = require('express');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { adminOnly } = require('../middleware/roleCheck');
const { auth } = require('../middleware/auth');
const { validateRequest, orderStatusUpdateSchema } = require('../middleware/validation');
const router = express.Router();

// Apply auth and admin middleware to all routes
router.use(auth);
router.use(adminOnly);

/**
 * @route   GET /admin/orders
 * @desc    Get all orders with pagination and filtering
 * @access  Admin only
 */
router.get('/orders', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build filter object
    const filter = {};
    if (status) {
      filter.orderStatus = status;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get orders with populated user and product details
    const orders = await Order.find(filter)
      .populate('user', 'firstName lastName email')
      .populate('items.product', 'name price images')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / limit);

    // Calculate order statistics
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$total' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: page,
          totalPages,
          totalOrders,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        statistics: stats,
        filters: {
          status,
          sortBy,
          sortOrder
        }
      }
    });
  } catch (error) {
    console.error('Admin get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

/**
 * @route   GET /admin/orders/:id
 * @desc    Get specific order details
 * @access  Admin only
 */
router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'firstName lastName email phone address')
      .populate('items.product', 'name price images description category');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Admin get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
});

/**
 * @route   PATCH /admin/orders/:id/status
 * @desc    Update order status
 * @access  Admin only
 */
router.patch('/orders/:id/status', validateRequest(orderStatusUpdateSchema), async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if status transition is valid
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [], // Final state
      cancelled: [] // Final state
    };

    if (!validTransitions[order.orderStatus].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${order.orderStatus} to ${status}`,
        validTransitions: validTransitions[order.orderStatus]
      });
    }

    // Update order status
    order.orderStatus = status;
    
    // Add status update to history
    order.statusHistory.push({
      status,
      updatedAt: new Date(),
      updatedBy: req.user.id,
      note: req.body.note || `Status changed to ${status}`
    });

    await order.save();

    // Populate the updated order
    const updatedOrder = await Order.findById(orderId)
      .populate('user', 'firstName lastName email')
      .populate('items.product', 'name price images');

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: updatedOrder
    });
  } catch (error) {
    console.error('Admin update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
});

/**
 * @route   GET /admin/orders/statistics/overview
 * @desc    Get order statistics overview
 * @access  Admin only
 */
router.get('/orders/statistics/overview', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Get various statistics
    const [
      totalOrders,
      todayOrders,
      monthlyOrders,
      yearlyOrders,
      statusStats,
      revenueStats
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startOfDay } }),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.countDocuments({ createdAt: { $gte: startOfYear } }),
      Order.aggregate([
        {
          $group: {
            _id: '$orderStatus',
            count: { $sum: 1 }
          }
        }
      ]),
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' },
            averageOrderValue: { $avg: '$total' },
            totalOrders: { $sum: 1 }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        orders: {
          total: totalOrders,
          today: todayOrders,
          thisMonth: monthlyOrders,
          thisYear: yearlyOrders
        },
        statusBreakdown: statusStats,
        revenue: revenueStats[0] || {
          totalRevenue: 0,
          averageOrderValue: 0,
          totalOrders: 0
        }
      }
    });
  } catch (error) {
    console.error('Admin statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /admin/orders/:id
 * @desc    Delete an order (soft delete by changing status to cancelled)
 * @access  Admin only
 */
router.delete('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Soft delete by cancelling the order
    order.orderStatus = 'cancelled';
    order.statusHistory.push({
      status: 'cancelled',
      updatedAt: new Date(),
      updatedBy: req.user.id,
      note: 'Order cancelled by admin'
    });

    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    console.error('Admin delete order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message
    });
  }
});

module.exports = router;
