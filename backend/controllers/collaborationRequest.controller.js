import CollaborationRequest from '../models/collaborationRequest.model.js';
import User from '../models/user.model.js';

// Send a collaboration request (investor -> entrepreneur)
export const sendRequest = async (req, res) => {
  try {
    const { entrepreneurId, message } = req.body;
    const investorId = req.user._id;

    if (req.user.role !== 'investor') {
      return res.status(403).json({ message: 'Only investors can send collaboration requests' });
    }

    const entrepreneur = await User.findById(entrepreneurId);
    if (!entrepreneur || entrepreneur.role !== 'entrepreneur') {
      return res.status(404).json({ message: 'Entrepreneur not found' });
    }

    // Check for duplicate pending request
    const existing = await CollaborationRequest.findOne({
      investorId,
      entrepreneurId,
      status: 'pending',
    });
    if (existing) {
      return res.status(400).json({ message: 'You already have a pending request with this entrepreneur' });
    }

    const request = new CollaborationRequest({ investorId, entrepreneurId, message });
    await request.save();

    const populated = await request.populate([
      { path: 'investorId', select: '-password' },
      { path: 'entrepreneurId', select: '-password' },
    ]);

    res.status(201).json({ message: 'Collaboration request sent', request: populated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get requests received by the logged-in entrepreneur
export const getReceivedRequests = async (req, res) => {
  try {
    const requests = await CollaborationRequest.find({ entrepreneurId: req.user._id })
      .populate('investorId', '-password')
      .sort({ createdAt: -1 });

    res.status(200).json({ requests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get requests sent by the logged-in investor
export const getSentRequests = async (req, res) => {
  try {
    const requests = await CollaborationRequest.find({ investorId: req.user._id })
      .populate('entrepreneurId', '-password')
      .sort({ createdAt: -1 });

    res.status(200).json({ requests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update request status (accept/reject) - only entrepreneur can do this
export const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be accepted or rejected' });
    }

    const request = await CollaborationRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.entrepreneurId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been responded to' });
    }

    request.status = status;
    await request.save();

    const populated = await request.populate([
      { path: 'investorId', select: '-password' },
      { path: 'entrepreneurId', select: '-password' },
    ]);

    res.status(200).json({ message: `Request ${status}`, request: populated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check if investor already sent a request to an entrepreneur
export const checkRequest = async (req, res) => {
  try {
    const { entrepreneurId } = req.params;
    const investorId = req.user._id;

    const request = await CollaborationRequest.findOne({ investorId, entrepreneurId });
    res.status(200).json({ request: request || null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
