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
      return res.status(400).json({ message: 'Name, email, phone aur purpose zaroori hai' });

    const img = parsePhoto(photo);
    if (!img) return res.status(400).json({ message: 'Camera se photo click karna zaroori hai' });

    const active = await Visitor.findOne({ phone: phone.trim(), status: 'checked-in' });
    if (active)
      return res.status(400).json({ message: 'Is phone number se pehle se check-in hai. Pehle check-out karo.' });

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
    if (!phone) return res.status(400).json({ message: 'Phone number zaroori hai' });

    const v = await Visitor.findOneAndUpdate(
      { phone, status: 'checked-in' },
      { status: 'checked-out', checkOutTime: new Date() },
      { new: true, sort: { checkInTime: -1 } }
    ).select('-photo');
    if (!v) return res.status(404).json({ message: 'Is phone number se koi active check-in nahi mila' });
    res.json({ message: 'Check-out successful', visitor: v });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DASHBOARD LIST
router.get('/', async (req, res) => {
  try {
    const list = await Visitor.find().select('-photo').sort({ checkInTime: -1 }).limit(2000);
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PHOTO
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

module.exports = router;
