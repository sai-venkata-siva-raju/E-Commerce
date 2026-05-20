const express = require('express');
const router = express.Router();

const authenticateToken = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');
const {
    getAdminDashboard,
    getAllUsers,
    updateUserRole,
    deleteUser,
} = require('../controllers/admincontroller');

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/dashboard', getAdminDashboard);
router.get('/users', getAllUsers);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

module.exports = router;
