const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema(
  {
    visitorType: {
      type: String,
      enum: ['inquiry', 'student', 'teacher', 'staff'],
      default: 'inquiry',
      index: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
    phone: { type: String, required: true, trim: true, index: true },
    purpose: { type: String, trim: true, default: '' },
    // Specific attributes for Student / Teacher / Staff
    code: { type: String, trim: true, default: '' },
    course: { type: String, trim: true, default: '' },
    batch: { type: String, trim: true, default: '' },
    position: { type: String, trim: true, default: '' },
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
    status: { type: String, enum: ['checked-in', 'checked-out'], default: 'checked-in', index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Visitor', visitorSchema);
