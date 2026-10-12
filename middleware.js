const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'elovaa-default-secret-change-me';

const sign = (email) => jwt.sign({ email }, SECRET, { expiresIn: '12h' });

// token header (Authorization: Bearer x) ya ?token=x (images ke liye)
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.query.token;
  if (!token) return res.status(401).json({ message: 'Login required' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Session expire ho gaya, dubara login karo' });
  }
}

module.exports = { sign, requireAuth };
