// Role-based access control middleware
const requireRole = (role) => {
  return (req, res, next) => {
    const userRole = req.user?.role || 'user';
    
    if (userRole !== role && userRole !== 'admin') {
      return res.status(403).json({
        error: `Access denied. This action requires ${role} role.`,
        requiredRole: role,
        userRole,
      });
    }
    
    next();
  };
};

const requireAdmin = (req, res, next) => {
  return requireRole('admin')(req, res, next);
};

module.exports = { requireRole, requireAdmin };
