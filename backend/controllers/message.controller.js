import Message from '../models/message.model.js';
import mongoose from 'mongoose';

// Get conversation between two users
export const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: userId },
        { senderId: userId, receiverId: currentUserId },
      ],
    })
      .populate('senderId', 'name avatarUrl isOnline')
      .populate('receiverId', 'name avatarUrl isOnline')
      .sort({ createdAt: 1 });

    // Mark unread messages as read
    await Message.updateMany(
      { senderId: userId, receiverId: currentUserId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({ messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all conversations for a user (sidebar list)
export const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Find all unique conversation partners
    const sent = await Message.distinct('receiverId', { senderId: currentUserId });
    const received = await Message.distinct('senderId', { receiverId: currentUserId });

    const partnerIds = [...new Set([...sent.map(String), ...received.map(String)])];

    const conversations = await Promise.all(
      partnerIds.map(async (partnerId) => {
        const lastMessage = await Message.findOne({
          $or: [
            { senderId: currentUserId, receiverId: partnerId },
            { senderId: partnerId, receiverId: currentUserId },
          ],
        })
          .populate('senderId', 'name avatarUrl isOnline role')
          .populate('receiverId', 'name avatarUrl isOnline role')
          .sort({ createdAt: -1 });

        const unreadCount = await Message.countDocuments({
          senderId: partnerId,
          receiverId: currentUserId,
          isRead: false,
        });

        return {
          partnerId,
          lastMessage,
          unreadCount,
          updatedAt: lastMessage?.createdAt || new Date(),
        };
      })
    );

    conversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    res.status(200).json({ conversations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send a message (REST fallback, Socket.IO handles real-time)
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user._id;

    const message = new Message({ senderId, receiverId, content });
    await message.save();

    const populated = await message.populate([
      { path: 'senderId', select: 'name avatarUrl isOnline' },
      { path: 'receiverId', select: 'name avatarUrl isOnline' },
    ]);

    res.status(201).json({ message: populated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
