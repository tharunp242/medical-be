const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: 'rzp_test_SJrQ3uU4puTMrI',
    key_secret: 'WBuMZSe1F5NxNuFxbOQZ8Z2F'
});

const normalizeProductImage = () => '';

const formatProduct = (product) => {
    const payload = product.toObject ? product.toObject() : product;
    return {
        ...payload,
        image: normalizeProductImage()
    };
};

const generateToken = (user) => jwt.sign(
    {
        id: user._id,
        email: user.email,
        role: user.role
    },
    process.env.JWT_SECRET || 'medshop_dev_secret',
    { expiresIn: '7d' }
);

// --- Auth Routes ---
router.post('/auth/register', async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        const normalizedEmail = String(email).toLowerCase();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email: normalizedEmail,
            password,
            phone,
            address,
            role: 'user'
        });

        return res.status(201).json({
            user,
            token: generateToken(user)
        });
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
});

router.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const normalizedEmail = String(email).toLowerCase();
        const user = await User.findOne({ email: normalizedEmail }).select('+password');

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isValidPassword = await user.matchPassword(password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        return res.json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                address: user.address
            },
            token: generateToken(user)
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

router.get('/auth/users/:email', async (req, res) => {
    try {
        const email = String(req.params.email).toLowerCase();
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.json(user);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

// --- Product Routes ---

// Get all products
router.get('/products', async (req, res) => {
    try {
        const { category, search, inStock, requiresPrescription, limit } = req.query;
        const query = {};

        if (category) {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } }
            ];
        }

        if (inStock === 'true') {
            query.stock = { $gt: 0 };
        }

        if (requiresPrescription === 'true') {
            query.requiresPrescription = true;
        } else if (requiresPrescription === 'false') {
            query.requiresPrescription = false;
        }

        const queryBuilder = Product.find(query).sort({ createdAt: -1 });
        if (limit) {
            queryBuilder.limit(Math.min(Number(limit), 200));
        }

        const products = await queryBuilder;
        res.json(products.map(formatProduct));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        return res.json(formatProduct(product));
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
});

// Add a product (Admin)
router.post('/products', async (req, res) => {
    const product = new Product(req.body);
    try {
        const newProduct = await product.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update stock
router.patch('/products/:id/stock', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        const stock = Number(req.body.stock);

        if (Number.isNaN(stock) || stock < 0) {
            return res.status(400).json({ message: 'Stock must be a non-negative number' });
        }

        if (product) {
            product.stock = stock;
            await product.save();
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// --- Order Routes ---

// Create a new order
router.post('/orders', async (req, res) => {
    try {
        const { customerName, email, phone, address, items = [], paymentStatus, prescriptionUrl } = req.body;

        if (!customerName || !email || !address) {
            return res.status(400).json({ message: 'Customer name, email and address are required' });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Order must contain at least one item' });
        }

        const normalizedItems = items.map((item) => ({
            productId: item.productId,
            quantity: Number(item.quantity)
        }));

        const invalidItem = normalizedItems.find((item) => !mongoose.Types.ObjectId.isValid(item.productId) || !Number.isInteger(item.quantity) || item.quantity <= 0);
        if (invalidItem) {
            return res.status(400).json({ message: 'Each order item must have a valid productId and quantity > 0' });
        }

        const productIds = normalizedItems.map((item) => item.productId);
        const products = await Product.find({ _id: { $in: productIds } });
        const productMap = new Map(products.map((product) => [String(product._id), product]));

        if (products.length !== normalizedItems.length) {
            return res.status(400).json({ message: 'One or more products were not found' });
        }

        for (const item of normalizedItems) {
            const product = productMap.get(String(item.productId));
            if (product.stock < item.quantity) {
                return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
            }
        }

        for (const item of normalizedItems) {
            await Product.updateOne(
                { _id: item.productId },
                { $inc: { stock: -item.quantity } }
            );
        }

        const orderItems = normalizedItems.map((item) => {
            const product = productMap.get(String(item.productId));
            return {
                productId: item.productId,
                quantity: item.quantity,
                price: product.price
            };
        });

        const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const order = new Order({
            customerName,
            email: String(email).toLowerCase(),
            phone,
            address,
            items: orderItems,
            totalAmount,
            paymentStatus: paymentStatus || 'Pending',
            prescriptionUrl,
            razorpayOrderId: req.body.razorpayOrderId,
            razorpayPaymentId: req.body.razorpayPaymentId,
            razorpaySignature: req.body.razorpaySignature
        });

        const newOrder = await order.save();
        res.status(201).json(newOrder);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.post('/orders/:id/payment', async (req, res) => {
    try {
        const { paymentStatus = 'Paid', razorpayPaymentId, razorpaySignature } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.paymentStatus = paymentStatus;
        if (razorpayPaymentId) {
            order.razorpayPaymentId = razorpayPaymentId;
        }
        if (razorpaySignature) {
            order.razorpaySignature = razorpaySignature;
        }
        await order.save();

        return res.json(order);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
});

// Get all orders (Admin) or user's orders (if email provided)
router.get('/orders', async (req, res) => {
    try {
        const { email } = req.query;
        let query = {};
        
        // If email is provided, filter by email for regular users
        if (email) {
            query.email = String(email).toLowerCase();
        }
        
        const orders = await Order.find(query)
            .populate('items.productId')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update order status (Admin)
router.patch('/orders/:id/status', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (order) {
            order.status = req.body.status;
            await order.save();
            res.json(order);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// --- Cart Routes ---
router.get('/cart', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ message: 'email is required' });
        }

        const cart = await Cart.findOne({ email: String(email).toLowerCase() });
        if (!cart) {
            return res.json({ email: String(email).toLowerCase(), items: [] });
        }

        return res.json(cart);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

router.put('/cart', async (req, res) => {
    try {
        const { email, items = [] } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'email is required' });
        }

        if (!Array.isArray(items)) {
            return res.status(400).json({ message: 'items must be an array' });
        }

        const normalizedItems = items.map((item) => ({
            productId: item.productId || item._id,
            quantity: Number(item.quantity || 1)
        }));

        const invalid = normalizedItems.find((item) => !mongoose.Types.ObjectId.isValid(item.productId) || !Number.isInteger(item.quantity) || item.quantity <= 0);
        if (invalid) {
            return res.status(400).json({ message: 'Each item must include a valid productId and quantity > 0' });
        }

        const products = await Product.find({ _id: { $in: normalizedItems.map((item) => item.productId) } });
        const productMap = new Map(products.map((product) => [String(product._id), product]));

        if (products.length !== normalizedItems.length) {
            return res.status(400).json({ message: 'One or more products were not found' });
        }

        const enrichedItems = normalizedItems.map((item) => {
            const product = productMap.get(String(item.productId));
            return {
                productId: product._id,
                quantity: item.quantity,
                name: product.name,
                category: product.category,
                price: product.price,
                image: normalizeProductImage(),
                dosage: product.dosage,
                requiresPrescription: product.requiresPrescription
            };
        });

        const cart = await Cart.findOneAndUpdate(
            { email: String(email).toLowerCase() },
            { $set: { email: String(email).toLowerCase(), items: enrichedItems } },
            // `new: true` is deprecated in recent Mongoose versions; use returnDocument: 'after'
            { returnDocument: 'after', upsert: true }
        );

        return res.json(cart);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
});

router.delete('/cart', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ message: 'email is required' });
        }

        await Cart.findOneAndDelete({ email: String(email).toLowerCase() });
        return res.json({ message: 'Cart cleared' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

// --- Razorpay Routes ---

// Create Razorpay Order
router.post('/razorpay/create-order', async (req, res) => {
    try {
        const { amount, currency = 'INR' } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Valid amount is required' });
        }

        const options = {
            amount: Math.round(amount * 100), // Amount in paise
            currency,
            receipt: `receipt_${Date.now()}`,
            payment_capture: 1
        };

        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (err) {
        console.error('Razorpay order creation error:', err);
        res.status(500).json({ message: 'Failed to create Razorpay order', error: err.message });
    }
});

// Verify Razorpay Payment
router.post('/razorpay/verify-payment', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: 'Missing payment verification parameters' });
        }

        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', 'WBuMZSe1F5NxNuFxbOQZ8Z2F')
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            res.json({ 
                success: true, 
                message: 'Payment verified successfully',
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
            });
        } else {
            res.status(400).json({ success: false, message: 'Payment verification failed' });
        }
    } catch (err) {
        console.error('Payment verification error:', err);
        res.status(500).json({ message: 'Payment verification failed', error: err.message });
    }
});

// --- Prescription Analysis Route (Mock) ---
router.post('/analyze-prescription', async (req, res) => {
    try {
        const { text = '', medicines = [] } = req.body || {};
        const normalizedText = String(text)
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        const requestedNames = [...new Set(
            medicines
                .map((name) => String(name).toLowerCase().trim())
                .filter(Boolean)
        )];

        const allProducts = await Product.find({});

        const matchedFromText = normalizedText
            ? allProducts.filter((product) => {
                const productName = String(product.name || '').toLowerCase();
                if (!productName) return false;
                if (normalizedText.includes(productName)) return true;

                const primaryToken = productName.split(' ')[0];
                return primaryToken.length > 4 && normalizedText.includes(primaryToken);
            })
            : [];

        const matchedFromNames = requestedNames.length > 0
            ? allProducts.filter((product) => requestedNames.includes(String(product.name || '').toLowerCase()))
            : [];

        let matchedProducts = [...matchedFromText, ...matchedFromNames]
            .filter((product, index, arr) => arr.findIndex((current) => String(current._id) === String(product._id)) === index)
            .slice(0, 8);

        if (matchedProducts.length === 0) {
            matchedProducts = await Product.find({ requiresPrescription: true }).sort({ stock: -1 }).limit(2);
        }

        const detectedMedicines = matchedProducts.map((product) => ({
            productId: product._id,
            name: product.name,
            price: product.price,
            category: product.category,
            requiresPrescription: product.requiresPrescription,
            dosage: product.dosage || 'As directed',
            frequency: 'As prescribed'
        }));

        res.json({
            detectedMedicines,
            confidence: normalizedText && detectedMedicines.length ? 0.9 : 0.5
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- User Management (Admin) ---
// Get all users (admin)
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}).sort({ createdAt: -1 });
        // User schema excludes password by default (select: false)
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update user role
router.patch('/users/:id/role', async (req, res) => {
    try {
        const { role } = req.body;
        if (!role || !['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.role = role;
        await user.save();
        res.json(user);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a user
router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await user.remove();
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
