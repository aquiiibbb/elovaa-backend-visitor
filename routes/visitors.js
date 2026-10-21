const express = require('express');
const Visitor = require('../models/Visitor');
const Member = require('../models/Member');
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
    const {
      visitorType = 'inquiry',
      name,
      email,
      phone,
      purpose,
      code,
      course,
      batch,
      position,
      photo
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and Phone number are required.' });
    }

    // Inquiry requires email and purpose
    if (visitorType === 'inquiry') {
      if (!email || !purpose) {
        return res.status(400).json({ message: 'Email and Purpose are required for Inquiries.' });
      }
    }

    const img = parsePhoto(photo);
    if (!img) return res.status(400).json({ message: 'A selfie photo capture is required.' });

    const active = await Visitor.findOne({ phone: phone.trim(), status: 'checked-in' });
    if (active) {
      return res.status(400).json({ message: 'This phone number already has an active check-in. Please check out first.' });
    }

    // Determine fallback purpose by category
    let finalPurpose = purpose || '';
    if (!finalPurpose) {
      if (visitorType === 'student') finalPurpose = 'Class Attendance';
      else if (visitorType === 'teacher') finalPurpose = 'Teacher Lecture';
      else if (visitorType === 'staff') finalPurpose = 'Staff Duty';
      else finalPurpose = 'General Visit';
    }

    const v = await Visitor.create({
      visitorType,
      name: name.trim(),
      email: (email || '').trim().toLowerCase(),
      phone: phone.trim(),
      purpose: finalPurpose.trim(),
      code: (code || '').trim().toUpperCase(),
      course: (course || '').trim(),
      batch: (batch || '').trim(),
      position: (position || '').trim(),
      photo: img,
      hasPhoto: true,
      checkInTime: new Date(),
      status: 'checked-in',
    });

    // Auto-upsert into Member directory for Student, Teacher, and Staff
    if (visitorType !== 'inquiry') {
      try {
        const memberFilter = { type: visitorType, phone: phone.trim() };
        const memberData = {
          type: visitorType,
          name: name.trim(),
          phone: phone.trim(),
          code: (code || '').trim().toUpperCase(),
          course: (course || '').trim(),
          batch: (batch || '').trim(),
          position: (position || '').trim(),
        };
        await Member.findOneAndUpdate(memberFilter, memberData, { upsert: true, new: true });
      } catch (upsertErr) {
        console.warn('Directory auto-upsert error (non-fatal):', upsertErr.message);
      }
    }

    res.status(201).json({
      message: 'Check-in successful',
      visitor: {
        _id: v._id,
        name: v.name,
        visitorType: v.visitorType,
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CHECK OUT
router.post('/checkout', async (req, res) => {
  try {
    const phone = String(req.body.phone || '').trim();
    if (!phone) return res.status(400).json({ message: 'Phone number is required.' });

    const photo = req.body.photo;
    const update = {
      status: 'checked-out',
      checkOutTime: new Date()
    };
    if (photo) {
      const img = parsePhoto(photo);
      if (img) {
        update.checkOutPhoto = img;
        update.hasCheckOutPhoto = true;
      }
    }

    const v = await Visitor.findOneAndUpdate(
      { phone, status: 'checked-in' },
      update,
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
    const query = {};
    if (req.query.type && ['inquiry', 'student', 'teacher', 'staff'].includes(req.query.type)) {
      query.visitorType = req.query.type;
    }
    const list = await Visitor.find(query).select('-photo -checkOutPhoto').sort({ checkInTime: -1 }).limit(2000);
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
