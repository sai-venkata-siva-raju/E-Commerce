const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');

const getAllProducts = async (req, res) => {
    // Implementation here
    try {
        const products = await Product.findAll();
        res.json(products);
    } catch (err) {
        console.error('Error fetching products:', err.message);
        res.status(500).json({ message: 'Server error' });
    }   

};

const getProductById = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (err) {
        console.error('Error fetching product:', err.message);
        res.status(500).json({ message: 'Server error' });
    }   
    // Implementation here
};

const createProduct = async (req, res) => {
    try {
        const { name, description, price, stock } = req.body;
        let imageUrl = null;

        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path);
            imageUrl = result.secure_url;
        }

        const newProduct = await Product.create({
            name,
            description,
            price,
            stock,
            imageUrl,
        });

        res.status(201).json(newProduct);
    } catch (err) {
        console.error('Error creating product:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
    // Implementation here
};

const updateProduct = async (req, res) => {
        try {
        const { name, description, price, stock } = req.body;
        const product = await Product.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        let imageUrl = product.imageUrl;
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path);
            imageUrl = result.secure_url;
        }

        await product.update({
            name: name || product.name,
            description: description || product.description,
            price: price || product.price,
            stock: stock || product.stock,
            imageUrl,
        });

        res.json(product);
    } catch (err) {
        console.error('Error updating product:', err.message);
        res.status(500).json({ message: 'Server error' });
    }   
    // Implementation here
};

const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        await product.destroy();
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        console.error('Error deleting product:', err.message);
        res.status(500).json({ message: 'Server error' });
    }   
    // Implementation here
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};