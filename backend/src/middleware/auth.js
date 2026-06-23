import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export default async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    const user = await User.findById(decoded.userId).select('role');
    if (user) req.userRole = user.role;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}
