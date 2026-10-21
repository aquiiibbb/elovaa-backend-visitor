const express = require('express');
const Member = require('../models/Member');
const { requireAuth } = require('../middleware');

const router = express.Router();
router.use(requireAuth);

// SEARCH member by phone or code (query parameter 'q' and optional 'type')
router.get('/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const type = String(req.query.type || '').trim().toLowerCase();

    if (!q) return res.status(400).json({ message: 'Search query is required' });

    const filter = {
      $or: [
        { phone: q },
        { code: { $regex: `^${q}$`, $options: 'i' } },
        { phone: { $regex: q } }
      ]
    };

    if (type && ['student', 'teacher', 'staff'].includes(type)) {
      filter.type = type;
    }

    const member = await Member.findOne(filter);
    if (!member) {
      return res.status(404).json({ message: 'No member found' });
    }

    res.json(member);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// LIST all members (optionally filtered by type)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.type && ['student', 'teacher', 'staff'].includes(req.query.type)) {
      filter.type = req.query.type;
    }
    const list = await Member.find(filter).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE or UPDATE member
router.post('/', async (req, res) => {
  try {
    const { type, name, phone, code, course, batch, position } = req.body;
    if (!type || !name || !phone) {
      return res.status(400).json({ message: 'Type, Name and Phone are required.' });
    }

    // Try finding existing member by code or phone
    const filter = { type, $or: [{ phone: phone.trim() }] };
    if (code && code.trim()) {
      filter.$or.push({ code: code.trim().toUpperCase() });
    }

    const updateData = {
      type,
      name: name.trim(),
      phone: phone.trim(),
      code: (code || '').trim().toUpperCase(),
      course: (course || '').trim(),
      batch: (batch || '').trim(),
      position: (position || '').trim(),
    };

    const member = await Member.findOneAndUpdate(filter, updateData, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });

    res.status(201).json(member);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE member
router.delete('/:id', async (req, res) => {
  try {
    await Member.findByIdAndDelete(req.params.id);
    res.json({ message: 'Member deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
