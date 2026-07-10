import Meeting from '../models/meeting.model.js';

// Check for time conflicts
const hasConflict = async (userId, startTime, endTime, excludeId = null) => {
  const query = {
    $or: [{ organizerId: userId }, { participantId: userId }],
    status: { $in: ['pending', 'accepted'] },
    $or: [
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
    ],
  };
  if (excludeId) query._id = { $ne: excludeId };

  const conflict = await Meeting.findOne({
    $and: [
      { $or: [{ organizerId: userId }, { participantId: userId }] },
      { status: { $in: ['pending', 'accepted'] } },
      { startTime: { $lt: new Date(endTime) } },
      { endTime: { $gt: new Date(startTime) } },
    ],
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  });
  return conflict;
};

export const scheduleMeeting = async (req, res) => {
  try {
    const { title, participantId, startTime, endTime, notes } = req.body;
    const organizerId = req.user._id;

    if (new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    // Conflict detection for both users
    const organizerConflict = await hasConflict(organizerId, startTime, endTime);
    if (organizerConflict) {
      return res.status(409).json({ message: 'You have a conflicting meeting in that time slot' });
    }

    const participantConflict = await hasConflict(participantId, startTime, endTime);
    if (participantConflict) {
      return res.status(409).json({ message: 'The other participant has a conflicting meeting in that time slot' });
    }

    const meeting = new Meeting({
      title,
      organizerId,
      participantId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      notes,
    });
    await meeting.save();

    const populated = await meeting.populate([
      { path: 'organizerId', select: '-password' },
      { path: 'participantId', select: '-password' },
    ]);

    res.status(201).json({ message: 'Meeting scheduled', meeting: populated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyMeetings = async (req, res) => {
  try {
    const userId = req.user._id;
    const meetings = await Meeting.find({
      $or: [{ organizerId: userId }, { participantId: userId }],
    })
      .populate('organizerId', '-password')
      .populate('participantId', '-password')
      .sort({ startTime: 1 });

    res.status(200).json({ meetings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateMeetingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['accepted', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const meeting = await Meeting.findById(id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    const userId = req.user._id.toString();
    const isOrganizer = meeting.organizerId.toString() === userId;
    const isParticipant = meeting.participantId.toString() === userId;

    if (!isOrganizer && !isParticipant) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Only participant can accept/reject; anyone can cancel
    if (['accepted', 'rejected'].includes(status) && !isParticipant) {
      return res.status(403).json({ message: 'Only the invited participant can accept or reject' });
    }

    meeting.status = status;
    await meeting.save();

    const populated = await meeting.populate([
      { path: 'organizerId', select: '-password' },
      { path: 'participantId', select: '-password' },
    ]);

    res.status(200).json({ message: `Meeting ${status}`, meeting: populated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
