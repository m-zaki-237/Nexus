import express from 'express';
import {
  getSubscription,
  createCheckoutSession,
  createPortalSession,
  cancelDemoSubscription,
  handleWebhook,
} from '../controllers/payment.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

// Webhook route using raw body parser
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Authenticated routes
router.get('/subscription', authMiddleware, getSubscription);
router.post('/create-checkout-session', authMiddleware, createCheckoutSession);
router.post('/create-portal-session', authMiddleware, createPortalSession);
router.post('/cancel-demo-subscription', authMiddleware, cancelDemoSubscription);

export default router;
