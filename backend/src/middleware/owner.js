export default function ownerMiddleware(req, res, next) {
  if (req.userRole !== 'owner') {
    return res.status(403).json({ error: 'Solo el propietario puede hacer esto' });
  }
  next();
}
