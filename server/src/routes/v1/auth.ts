import { Router } from 'express';
import AuthController from '../../controllers/AuthController';
import { UserController } from '../../controllers/UserController';
import { authenticate } from '../../middleware/auth';

const router = Router();
const userController = new UserController();

// Add debugging middleware for auth routes
router.use((req, res, next) => {
  console.log('Auth routes: Request received:', {
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    body: req.body ? Object.keys(req.body) : 'no body'
  });
  next();
});

// Auth routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.post('/refresh-token', AuthController.refreshToken);

// Change password for the authenticated user
router.put('/change-password', authenticate, userController.changePassword.bind(userController));

export default router;
