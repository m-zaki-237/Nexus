import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  version: {
    type: Number,
    default: 1,
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'active',
  },
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  signatureUrl: {
    type: String,
    default: '',
  },
  isSigned: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

const Document = mongoose.model('Document', documentSchema);

export default Document;
