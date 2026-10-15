const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    purpose: { type: String, required: true, trim: true },
    // Photos stored directly in MongoDB as binary buffer
    photo: {
      type: { data: Buffer, contentType: String },
      select: false,
    },
    hasPhoto: { type: Boolean, default: false },
    checkOutPhoto: {
      type: { data: Buffer, contentType: String },
      select: false,
    },
    hasCheckOutPhoto: { type: Boolean, default: false },
    checkInTime: { type: Date, default: Date.now },
    checkOutTime: { type: Date, default: null },
    status: { type: String, enum: ['checked-in', 'checked-out'], default: 'checked-in' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Visitor', visitorSchema);
