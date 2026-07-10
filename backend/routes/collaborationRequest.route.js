import express from 'express';
import {
  sendRequest,
  getReceivedRequests,
  getSentRequests,
  updateRequestStatus,
  checkRequest,
} from '../controllers/collaborationRequest.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', authMiddleware, sendRequest);
router.get('/received', authMiddleware, getReceivedRequests);
router.get('/sent', authMiddleware, getSentRequests);
router.patch('/:id/status', authMiddleware, updateRequestStatus);
router.get('/check/:entrepreneurId', authMiddleware, checkRequest);

export default router;
