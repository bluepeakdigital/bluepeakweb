function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ ok: false, error: "Forbidden (admin only)" });
  }
  next();
}

module.exports = adminOnly;
