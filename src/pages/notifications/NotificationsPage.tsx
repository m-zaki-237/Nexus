import React, { useEffect, useState } from 'react';
import { Bell, MessageCircle, UserPlus, DollarSign, CheckCheck, Calendar } from 'lucide-react';
import { Card, CardBody } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

type NotifType = 'collab_request' | 'collab_accepted' | 'collab_rejected' | 'new_message' | 'meeting_request' | 'meeting_accepted';

interface Notification {
  id: string;
  type: NotifType;
  actor: { name: string; avatarUrl?: string };
  content: string;
  time: string;
  unread: boolean;
}

const buildNotifications = (
  collabRequests: any[],
  sentRequests: any[],
  meetings: any[],
  messages: any[],
  currentUserId: string
): Notification[] => {
  const notifs: Notification[] = [];

  // Incoming collaboration requests (entrepreneur sees these)
  collabRequests.forEach(req => {
    const actor = req.investorId;
    if (!actor) return;
    notifs.push({
      id: `collab-${req._id || req.id}`,
      type: 'collab_request',
      actor: { name: actor.name, avatarUrl: actor.avatarUrl },
      content: 'sent you a collaboration request',
      time: req.createdAt,
      unread: req.status === 'pending',
    });
  });

  // Sent requests that got accepted/rejected (investor sees these)
  sentRequests.filter(r => r.status !== 'pending').forEach(req => {
    const actor = req.entrepreneurId;
    if (!actor) return;
    notifs.push({
      id: `sent-${req._id || req.id}`,
      type: req.status === 'accepted' ? 'collab_accepted' : 'collab_rejected',
      actor: { name: actor.name, avatarUrl: actor.avatarUrl },
      content: req.status === 'accepted'
        ? 'accepted your collaboration request'
        : 'declined your collaboration request',
      time: req.updatedAt || req.createdAt,
      unread: false,
    });
  });

  // Pending meeting requests
  meetings.filter(m => m.status === 'pending').forEach(m => {
    const organizerId = m.organizerId?._id || m.organizerId;
    const isOrganizer = organizerId?.toString() === currentUserId;
    const actor = isOrganizer ? m.participantId : m.organizerId;
    if (!actor || typeof actor !== 'object') return;
    notifs.push({
      id: `meeting-${m._id || m.id}`,
      type: isOrganizer ? 'meeting_request' : 'meeting_request',
      actor: { name: actor.name, avatarUrl: actor.avatarUrl },
      content: isOrganizer
        ? `is reviewing your meeting request: "${m.title}"`
        : `requested a meeting: "${m.title}"`,
      time: m.createdAt,
      unread: !isOrganizer,
    });
  });

  // Recent conversations
  messages.slice(0, 3).forEach((conv: any) => {
    const msg = conv.lastMessage;
    if (!msg) return;
    const actor = conv.partner;
    if (!actor) return;
    notifs.push({
      id: `msg-${conv.partnerId}`,
      type: 'new_message',
      actor: { name: actor.name, avatarUrl: actor.avatarUrl },
      content: `sent you a message`,
      time: msg.createdAt || msg.timestamp,
      unread: conv.unreadCount > 0,
    });
  });

  // Sort by time descending
  return notifs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
};

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const currentUserId = (user as any)?._id || user?.id || '';
        const [collabRes, sentRes, meetingsRes, msgsRes] = await Promise.all([
          api.get('/collaboration-requests/received').catch(() => ({ data: { requests: [] } })),
          api.get('/collaboration-requests/sent').catch(() => ({ data: { requests: [] } })),
          api.get('/meetings').catch(() => ({ data: { meetings: [] } })),
          api.get('/messages/conversations').catch(() => ({ data: { conversations: [] } })),
        ]);

        // Enrich message conversations with partner info
        const rawConvs = msgsRes.data.conversations || [];
        const enrichedConvs = await Promise.all(
          rawConvs.slice(0, 5).map(async (c: any) => {
            try {
              const r = await api.get(`/user/${c.partnerId}`);
              return { ...c, partner: r.data.user };
            } catch { return c; }
          })
        );

        const notifs = buildNotifications(
          collabRes.data.requests || [],
          sentRes.data.requests || [],
          meetingsRes.data.meetings || [],
          enrichedConvs,
          currentUserId
        );
        setNotifications(notifs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchAll();
  }, [user]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const getIcon = (type: NotifType) => {
    switch (type) {
      case 'new_message': return <MessageCircle size={16} className="text-primary-600" />;
      case 'collab_request': return <UserPlus size={16} className="text-secondary-600" />;
      case 'collab_accepted': return <DollarSign size={16} className="text-green-600" />;
      case 'collab_rejected': return <UserPlus size={16} className="text-red-500" />;
      case 'meeting_request':
      case 'meeting_accepted': return <Calendar size={16} className="text-accent-600" />;
      default: return <Bell size={16} className="text-gray-600" />;
    }
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Stay updated with your network activity</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" leftIcon={<CheckCheck size={16} />} onClick={markAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Bell size={28} className="text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">No notifications yet</p>
          <p className="text-sm text-gray-400 mt-1">Activity from your network will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notification => (
            <Card
              key={notification.id}
              className={`transition-colors duration-200 ${notification.unread ? 'bg-primary-50 border-primary-100' : ''}`}
            >
              <CardBody className="flex items-start p-4">
                <Avatar
                  src={notification.actor.avatarUrl || ''}
                  alt={notification.actor.name}
                  size="md"
                  className="flex-shrink-0 mr-4"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{notification.actor.name}</span>
                    {notification.unread && (
                      <Badge variant="primary" size="sm" rounded>New</Badge>
                    )}
                  </div>
                  <p className="text-gray-600 mt-0.5 text-sm">{notification.content}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                    {getIcon(notification.type)}
                    <span>
                      {formatDistanceToNow(new Date(notification.time), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
