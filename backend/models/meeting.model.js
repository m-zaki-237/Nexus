import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  participantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    default: 'pending',
  },
  notes: {
    type: String,
    default: '',
  },
  meetingLink: {
    type: String,
    default: '',
  },
}, { timestamps: true });

// Conflict detection index
meetingSchema.index({ participantId: 1, startTime: 1, endTime: 1 });
meetingSchema.index({ organizerId: 1, startTime: 1, endTime: 1 });

const Meeting = mongoose.model('Meeting', meetingSchema);

export default Meeting;
