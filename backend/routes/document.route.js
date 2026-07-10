import express from 'express';
import {
  uploadDocument,
  getMyDocuments,
  shareDocument,
  addSignature,
  deleteDocument,
  upload,
} from '../controllers/document.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/upload', authMiddleware, upload.single('file'), uploadDocument);
router.get('/', authMiddleware, getMyDocuments);
router.patch('/:id/share', authMiddleware, shareDocument);
router.patch('/:id/sign', authMiddleware, addSignature);
router.delete('/:id', authMiddleware, deleteDocument);

export default router;
