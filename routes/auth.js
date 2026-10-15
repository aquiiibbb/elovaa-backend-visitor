const express = require('express');
const { sign, requireAuth } = require('../middleware');

const router = express.Router();

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'elovaabeautyacademy@gmail.com').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'elovaa#012';

// simple brute-force protection: 10 failed attempts / 15 min / IP
const fails = new Map();
const WINDOW = 15 * 60 * 1000;

router.post('/login', (req, res) => {
  const ip = req.ip;
  const now = Date.now();
  const rec = fails.get(ip);
  if (rec && now - rec.first < WINDOW && rec.count >= 10)
    return res.status(429).json({ message: 'Too many failed login attempts. Please try again after 15 minutes.' });

  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    fails.delete(ip);
    return res.json({ token: sign(email), email });
  }

  if (!rec || now - rec.first >= WINDOW) fails.set(ip, { first: now, count: 1 });
  else rec.count += 1;
  res.status(401).json({ message: 'Invalid email or password.' });
});

router.get('/me', requireAuth, (req, res) => res.json({ email: req.user.email }));

module.exports = router;
