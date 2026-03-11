const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customerName: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    address: { type: String, required: true },
    items: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            quantity: { type: Number, required: true },
            price: Number
        }
    ],
    totalAmount: { type: Number, required: true },
    prescriptionUrl: String,
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Failed'],
        default: 'Pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
