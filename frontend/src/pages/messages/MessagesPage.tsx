import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../../components/ui/Avatar';
import { formatDistanceToNow } from 'date-fns';
import api from '../../api/axios';

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await api.get('/messages/conversations');
        const convs = res.data.conversations || [];
        const enriched = await Promise.all(
          convs.map(async (c: any) => {
            try {
              const userRes = await api.get(`/user/${c.partnerId}`);
              return { ...c, partner: userRes.data.user };
            } catch { return c; }
          })
        );
        setConversations(enriched);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, [user]);

  if (!user) return null;

  return (
    <div className="h-[calc(100vh-8rem)] bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Messages</h2>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500 text-sm">Loading...</div>
      ) : conversations.length > 0 ? (
        <div className="overflow-y-auto">
          {conversations.map(conv => {
            const partner = conv.partner;
            const lastMsg = conv.lastMessage;

            return (
              <div
                key={conv.partnerId}
                onClick={() => navigate(`/chat/${conv.partnerId}`)}
                className="px-4 py-3 flex cursor-pointer hover:bg-gray-50 border-b border-gray-100"
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
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(lastMsg.createdAt || lastMsg.timestamp), { addSuffix: false })}
                      </span>
                    )}
                  </div>
                  {lastMsg && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">{lastMsg.content}</p>
                  )}
                  {conv.unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs bg-primary-600 text-white rounded-full mt-1">
                      {conv.unreadCount} new
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="h-full flex flex-col items-center justify-center p-8">
          <div className="bg-gray-100 p-6 rounded-full mb-4">
            <MessageCircle size={32} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-medium text-gray-900">No messages yet</h2>
          <p className="text-gray-600 text-center mt-2">
            Start connecting with entrepreneurs and investors to begin conversations
          </p>
        </div>
      )}
    </div>
  );
};
