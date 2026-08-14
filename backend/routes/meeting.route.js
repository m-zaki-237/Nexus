import express from 'express';
import { scheduleMeeting, getMyMeetings, updateMeetingStatus } from '../controllers/meeting.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', authMiddleware, scheduleMeeting);
router.get('/', authMiddleware, getMyMeetings);
router.patch('/:id/status', authMiddleware, updateMeetingStatus);

export default router;
