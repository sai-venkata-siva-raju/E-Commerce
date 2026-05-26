const express = require('express');
const router = express.Router();
const {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
} = require('../controllers/productController.js');
const authenticateToken = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');    
const multer = require('multer');
const upload   = multer({ dest: 'uploads/' });

router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', authenticateToken, requireAdmin, createProduct);
router.put('/:id', authenticateToken, requireAdmin, updateProduct);
router.delete('/:id', authenticateToken, requireAdmin, deleteProduct);

module.exports = router;

