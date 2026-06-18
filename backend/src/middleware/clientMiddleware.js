module.exports = function clientMiddleware(req, res, next) {
  if (req.user?.role === 'admin') {
    return res.status(403).json({ message: 'Admin accounts cannot trade, deposit, or withdraw as clients.' });
  }
  return next();
};
