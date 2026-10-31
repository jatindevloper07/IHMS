// Role and Authentication Middleware

function requireRole(roles = []) {
  const allowed = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    const roleHeader = req.headers['x-user-role'];

    if (!roleHeader && !authHeader) {
      // For demo mode or unconstrained endpoints, proceed
      return next();
    }

    if (allowed.length > 0 && roleHeader && !allowed.includes(roleHeader)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Role [${roleHeader}] is not authorized to access this resource. Required: [${allowed.join(', ')}]`
      });
    }

    next();
  };
}

module.exports = {
  requireRole
};
