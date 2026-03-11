const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    name: String,
    category: String,
    price: Number,
    image: String,
    dosage: String,
    requiresPrescription: { type: Boolean, default: false }
}, { _id: false });

const cartSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, index: true },
    items: [cartItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);
