const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['student', 'teacher', 'staff'],
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    code: { type: String, trim: true, default: '', index: true },
    course: { type: String, trim: true, default: '' },
    batch: { type: String, trim: true, default: '' },
    position: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Member', memberSchema);
