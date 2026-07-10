import express from 'express';
import { getConversation, getConversations, sendMessage } from '../controllers/message.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/conversations', authMiddleware, getConversations);
router.get('/conversation/:userId', authMiddleware, getConversation);
router.post('/send', authMiddleware, sendMessage);

export default router;
