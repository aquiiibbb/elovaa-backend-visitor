const express = require('express');
const Visitor = require('../models/Visitor');
const { requireAuth } = require('../middleware');

const router = express.Router();
router.use(requireAuth);

function parsePhoto(dataUrl) {
  const m = /^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/.exec(dataUrl || '');
  if (!m) return null;
  const data = Buffer.from(m[2], 'base64');
  if (data.length > 2 * 1024 * 1024) return null;
  return { data, contentType: m[1] };
}

// CHECK IN
router.post('/checkin', async (req, res) => {
  try {
    const { name, email, phone, purpose, photo } = req.body;
    if (!name || !email || !phone || !purpose)
      return res.status(400).json({ message: 'Name, email, phone, and purpose are required.' });

    const img = parsePhoto(photo);
    if (!img) return res.status(400).json({ message: 'A photo capture is required.' });

    const active = await Visitor.findOne({ phone: phone.trim(), status: 'checked-in' });
    if (active)
      return res.status(400).json({ message: 'This phone number already has an active check-in. Please check out first.' });

    const v = await Visitor.create({ name, email, phone, purpose, photo: img, hasPhoto: true });
    res.status(201).json({ message: 'Check-in successful', visitor: { _id: v._id, name: v.name } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CHECK OUT
router.post('/checkout', async (req, res) => {
  try {
    const phone = String(req.body.phone || '').trim();
    const photo = req.body.photo;
    if (!phone) return res.status(400).json({ message: 'Phone number is required.' });

    const img = parsePhoto(photo);
    if (!img) return res.status(400).json({ message: 'A photo capture is required to check out.' });

    const v = await Visitor.findOneAndUpdate(
      { phone, status: 'checked-in' },
      { 
        status: 'checked-out', 
        checkOutTime: new Date(),
        checkOutPhoto: img,
        hasCheckOutPhoto: true 
      },
      { new: true, sort: { checkInTime: -1 } }
    ).select('-photo -checkOutPhoto');
    if (!v) return res.status(404).json({ message: 'No active check-in found for this phone number.' });
    res.json({ message: 'Check-out successful', visitor: v });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DASHBOARD LIST
router.get('/', async (req, res) => {
  try {
    const list = await Visitor.find().select('-photo -checkOutPhoto').sort({ checkInTime: -1 }).limit(2000);
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CHECK-IN PHOTO
router.get('/:id/photo', async (req, res) => {
  try {
    const v = await Visitor.findById(req.params.id).select('photo');
    if (!v || !v.photo || !v.photo.data) return res.status(404).end();
    res.set('Content-Type', v.photo.contentType);
    res.set('Cache-Control', 'private, max-age=86400');
    res.send(v.photo.data);
  } catch {
    res.status(404).end();
  }
});

// CHECK-OUT PHOTO
router.get('/:id/checkout-photo', async (req, res) => {
  try {
    const v = await Visitor.findById(req.params.id).select('checkOutPhoto');
    if (!v || !v.checkOutPhoto || !v.checkOutPhoto.data) return res.status(404).end();
    res.set('Content-Type', v.checkOutPhoto.contentType);
    res.set('Cache-Control', 'private, max-age=86400');
    res.send(v.checkOutPhoto.data);
  } catch {
    res.status(404).end();
  }
});

module.exports = router;
