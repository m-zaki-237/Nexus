import Document from '../models/document.model.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Multer config - local storage (swap fileUrl for S3 url if using cloud)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/documents';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const { title } = req.body;
    const fileUrl = `/uploads/documents/${req.file.filename}`;

    const doc = new Document({
      title: title || req.file.originalname,
      ownerId: req.user._id,
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });

    await doc.save();
    res.status(201).json({ message: 'Document uploaded', document: doc });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyDocuments = async (req, res) => {
  try {
    const docs = await Document.find({
      $or: [{ ownerId: req.user._id }, { sharedWith: req.user._id }],
    })
      .populate('ownerId', 'name email avatarUrl')
      .populate('sharedWith', 'name email avatarUrl')
      .sort({ createdAt: -1 });

    res.status(200).json({ documents: docs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const shareDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const doc = await Document.findById(id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    if (doc.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!doc.sharedWith.includes(userId)) {
      doc.sharedWith.push(userId);
      await doc.save();
    }

    res.status(200).json({ message: 'Document shared', document: doc });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addSignature = async (req, res) => {
  try {
    const { id } = req.params;
    const { signatureUrl } = req.body;

    const doc = await Document.findById(id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const isOwner = doc.ownerId.toString() === req.user._id.toString();
    const isShared = doc.sharedWith.some(uid => uid.toString() === req.user._id.toString());

    if (!isOwner && !isShared) {
      return res.status(403).json({ message: 'Not authorized to sign this document' });
    }

    doc.signatureUrl = signatureUrl;
    doc.isSigned = true;
    await doc.save();

    res.status(200).json({ message: 'Signature added', document: doc });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Document.findById(id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    if (doc.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete file from disk
    const filePath = doc.fileUrl.replace('/uploads', 'uploads');
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await doc.deleteOne();
    res.status(200).json({ message: 'Document deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
