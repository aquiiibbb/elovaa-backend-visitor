const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'elovaa-default-secret-change-me';

const sign = (email) => jwt.sign({ email }, SECRET, { expiresIn: '3650d' });

// Token via Authorization header (Bearer <token>) or query param (?token=<token>)
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.query.token;
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Session expired. Please log in again.' });
  }
}

module.exports = { sign, requireAuth };
