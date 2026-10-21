import prisma from '../config/database.js';

export const requireAuth = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Please log in to continue.',
      });
    }

    // Verify user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      // Destroy stale session
      req.session.destroy(() => {});
      return res.status(401).json({
        success: false,
        error: 'Session expired or user no longer exists.',
      });
    }

    req.userId = user.id;
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export default requireAuth;
