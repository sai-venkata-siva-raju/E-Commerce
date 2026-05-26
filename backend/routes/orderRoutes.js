const express = require('express');
const router = express.Router();
const {
    createOrder,
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    deleteOrder,
} = require('../controllers/orderController');
const authenticateToken = require('../middleware/auth');
const requireUser = require('../middleware/user');
const requireAdmin = require('../middleware/admin');

router.post('/', authenticateToken, requireUser, createOrder);
router.get('/my-orders', authenticateToken, requireUser, getUserOrders);
router.get('/:id', authenticateToken, requireUser, getOrderById);
router.put('/:id/status', authenticateToken, requireAdmin, updateOrderStatus);
router.delete('/:id', authenticateToken, requireAdmin, deleteOrder);

module.exports = router;    