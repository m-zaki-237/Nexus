import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Phone, Video, Info, Smile, MessageCircle } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';
import api from '../../api/axios';
import { formatDistanceToNow } from 'date-fns';
import { io, Socket } from 'socket.io-client';

interface Conversation {
  partnerId: string;
  lastMessage: any;
  unreadCount: number;
  partner?: any;
}

export const ChatPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [chatPartner, setChatPartner] = useState<User | null>(null);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [socketReady, setSocketReady] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  // Keep a ref to current userId so socket listeners always see the latest value
  const userIdRef = useRef(userId);
  useEffect(() => { userIdRef.current = userId; }, [userId]);

  // ─── Fetch conversations sidebar ────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/messages/conversations');
      const convs: Conversation[] = res.data.conversations || [];
      const enriched = await Promise.all(
        convs.map(async (c) => {
          try {
            const r = await api.get(`/user/${c.partnerId}`);
            return { ...c, partner: r.data.user };
          } catch { return c; }
        })
      );
      setConversations(enriched);
    } catch (err) {
      console.error('fetchConversations error:', err);
    }
  }, []);

  // ─── Setup Socket.IO ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    const socket = io('http://localhost:8000', {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      // Tell the server who we are
      const myId = (currentUser as any)._id || currentUser.id;
      socket.emit('register', myId);
      setSocketReady(true);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      setSocketReady(false);
    });

    // Incoming message from the other person
    socket.on('new_message', (msg: any) => {
      const senderId = msg.senderId?._id?.toString() || msg.senderId?.toString();
      const activeUserId = userIdRef.current;
      // Only add to view if we're in that conversation
      if (senderId === activeUserId) {
        setMessages(prev => {
          // Prevent duplicates by _id
          const msgId = msg._id?.toString();
          if (msgId && prev.some(m => m._id?.toString() === msgId)) return prev;
          return [...prev, msg];
        });
      }
      fetchConversations();
    });

    // Confirmation that OUR message was saved — this is the source of truth for sender
    socket.on('message_sent', (msg: any) => {
      setMessages(prev => {
        const msgId = msg._id?.toString();
        if (msgId && prev.some(m => m._id?.toString() === msgId)) return prev;
        return [...prev, msg];
      });
      fetchConversations();
    });

    socket.on('message_error', ({ error }: { error: string }) => {
      console.error('Message error:', error);
    });

    fetchConversations();

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setSocketReady(false);
    };
  }, [currentUser, fetchConversations]);

  // ─── Load messages when chat partner changes ──────────────────────────────────
  useEffect(() => {
    if (!userId) {
      setChatPartner(null);
      setMessages([]);
      return;
    }

    const load = async () => {
      setLoadingMsgs(true);
      setMessages([]); // clear previous conversation
      try {
        const [partnerRes, msgsRes] = await Promise.all([
          api.get(`/user/${userId}`),
          api.get(`/messages/conversation/${userId}`),
        ]);
        setChatPartner(partnerRes.data.user);
        setMessages(msgsRes.data.messages || []);
      } catch (err) {
        console.error('load chat error:', err);
      } finally {
        setLoadingMsgs(false);
      }
    };

    load();
  }, [userId]);

  // ─── Auto-scroll ──────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Send ─────────────────────────────────────────────────────────────────────
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId || !socketRef.current) return;
    const myId = (currentUser as any)._id || currentUser.id;
    socketRef.current.emit('send_message', {
      senderId: myId,
      receiverId: userId,
      content: newMessage.trim(),
    });
    setNewMessage('');
  };

  if (!currentUser) return null;

  const currentUserId = (currentUser as any)._id?.toString() || currentUser.id;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white border border-gray-200 rounded-lg overflow-hidden animate-fade-in">

      {/* ── Conversations sidebar ── */}
      <div className="hidden md:flex md:flex-col w-72 border-r border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Messages</h2>
          {!socketReady && (
            <span className="text-xs text-amber-500 font-medium">Connecting…</span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">No conversations yet</div>
          ) : (
            conversations.map(conv => {
              const partner = conv.partner;
              const partnerId = conv.partnerId;
              const isActive = userId === partnerId;
              const lastMsg = conv.lastMessage;

              return (
                <div
                  key={partnerId}
                  onClick={() => navigate(`/chat/${partnerId}`)}
                  className={`px-4 py-3 flex cursor-pointer border-l-4 transition-colors ${
                    isActive
                      ? 'bg-primary-50 border-primary-600'
                      : 'hover:bg-gray-50 border-transparent'
                  }`}
                >
                  <Avatar
                    src={partner?.avatarUrl || ''}
                    alt={partner?.name || 'User'}
                    size="md"
                    status={partner?.isOnline ? 'online' : 'offline'}
                    className="mr-3 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {partner?.name || 'Unknown'}
                      </h3>
                      {lastMsg && (
                        <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                          {formatDistanceToNow(new Date(lastMsg.createdAt || lastMsg.timestamp), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    {lastMsg && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">{lastMsg.content}</p>
                    )}
                    {conv.unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center w-4 h-4 text-xs bg-primary-600 text-white rounded-full mt-1">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Main chat area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {chatPartner ? (
          <>
            {/* Header */}
            <div className="border-b border-gray-200 p-4 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center">
                <Avatar
                  src={chatPartner.avatarUrl}
                  alt={chatPartner.name}
                  size="md"
                  status={chatPartner.isOnline ? 'online' : 'offline'}
                  className="mr-3"
                />
                <div>
                  <h2 className="text-base font-semibold text-gray-900">{chatPartner.name}</h2>
                  <p className="text-xs text-gray-500">
                    {chatPartner.isOnline ? 'Online' : 'Offline'}
                    {socketReady
                      ? <span className="ml-2 text-green-500">● connected</span>
                      : <span className="ml-2 text-amber-400">● connecting…</span>}
                  </p>
                </div>
              </div>
              <div className="flex space-x-1">
                <Button variant="ghost" size="sm" className="rounded-full p-2"><Phone size={18} /></Button>
                <Button variant="ghost" size="sm" className="rounded-full p-2"><Video size={18} /></Button>
                <Button variant="ghost" size="sm" className="rounded-full p-2"><Info size={18} /></Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {loadingMsgs ? (
                <div className="text-center py-8 text-sm text-gray-400">Loading messages…</div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="bg-gray-100 p-4 rounded-full mb-3">
                    <MessageCircle size={32} className="text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">No messages yet</p>
                  <p className="text-sm text-gray-400 mt-1">Send a message to start the conversation</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg, idx) => {
                    const senderId = msg.senderId?._id?.toString() || msg.senderId?.toString();
                    const isMe = senderId === currentUserId;
                    const avatar = isMe ? currentUser.avatarUrl : chatPartner.avatarUrl;
                    const name = isMe ? currentUser.name : chatPartner.name;

                    return (
                      <div key={msg._id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {!isMe && (
                          <Avatar src={avatar} alt={name} size="sm" className="mr-2 self-end flex-shrink-0" />
                        )}
                        <div className={`flex flex-col max-w-xs sm:max-w-sm ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`px-4 py-2 rounded-2xl text-sm ${
                            isMe
                              ? 'bg-primary-600 text-white rounded-br-sm'
                              : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100'
                          }`}>
                            {msg.content}
                          </div>
                          <span className="text-xs text-gray-400 mt-1">
                            {formatDistanceToNow(new Date(msg.createdAt || msg.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                        {isMe && (
                          <Avatar src={avatar} alt={name} size="sm" className="ml-2 self-end flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-4 flex-shrink-0 bg-white">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm" className="rounded-full p-2 flex-shrink-0">
                  <Smile size={20} />
                </Button>
                <Input
                  type="text"
                  placeholder={socketReady ? 'Type a message…' : 'Connecting…'}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  fullWidth
                  disabled={!socketReady}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newMessage.trim() || !socketReady}
                  className="rounded-full p-2 w-10 h-10 flex items-center justify-center flex-shrink-0"
                >
                  <Send size={18} />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-gray-100 p-6 rounded-full mb-4">
              <MessageCircle size={48} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-700">Select a conversation</h2>
            <p className="text-gray-500 mt-2">Choose a contact from the left to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};
