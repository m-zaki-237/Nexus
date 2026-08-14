import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MessageCircle, Users, Calendar, Building2, MapPin,
  UserCircle, FileText, DollarSign, Send,
} from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { Entrepreneur } from '../../types';
import toast from 'react-hot-toast';

export const EntrepreneurProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();

  const [entrepreneur, setEntrepreneur] = useState<Entrepreneur | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasRequestedCollaboration, setHasRequestedCollaboration] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/user/${id}`);
        setEntrepreneur(res.data.user);

        // Check if investor already sent a request
        if (currentUser?.role === 'investor' && id) {
          try {
            const checkRes = await api.get(`/collaboration-requests/check/${id}`);
            setHasRequestedCollaboration(!!checkRes.data.request);
          } catch {
            // not sent yet
          }
        }
      } catch {
        setEntrepreneur(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id, currentUser]);

  const handleSendRequest = async () => {
    if (!currentUser || !id || sendingRequest) return;
    setSendingRequest(true);
    try {
      await api.post('/collaboration-requests', {
        entrepreneurId: id,
        message: `I'm interested in learning more about ${entrepreneur?.startupName} and would like to explore potential investment opportunities.`,
      });
      setHasRequestedCollaboration(true);
      toast.success('Collaboration request sent!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send request');
    } finally {
      setSendingRequest(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  if (!entrepreneur || entrepreneur.role !== 'entrepreneur') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Entrepreneur not found</h2>
        <p className="text-gray-600 mt-2">This profile doesn't exist or has been removed.</p>
        <Link to="/dashboard/investor">
          <Button variant="outline" className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const isCurrentUser = currentUser?.id === (entrepreneur as any)._id || currentUser?.id === entrepreneur.id;
  const isInvestor = currentUser?.role === 'investor';
  const teamMembers = (entrepreneur as any).teamMembers as { id: string; name: string; role: string; avatarUrl?: string }[] | undefined;
  const documents = (entrepreneur as any).documents as { id: string; title: string; updatedAt: string; url: string }[] | undefined;

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardBody className="sm:flex sm:items-start sm:justify-between p-6">
          <div className="sm:flex sm:space-x-6">
            <Avatar
              src={entrepreneur.avatarUrl}
              alt={entrepreneur.name}
              size="xl"
              status={entrepreneur.isOnline ? 'online' : 'offline'}
              className="mx-auto sm:mx-0"
            />
            <div className="mt-4 sm:mt-0 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">{entrepreneur.name}</h1>
              <p className="text-gray-600 flex items-center justify-center sm:justify-start mt-1">
                <Building2 size={16} className="mr-1" />
                {entrepreneur.startupName ? `Founder at ${entrepreneur.startupName}` : 'Startup not specified'}
              </p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
                {entrepreneur.industry && <Badge variant="primary">{entrepreneur.industry}</Badge>}
                {entrepreneur.location && (
                  <Badge variant="gray"><MapPin size={14} className="mr-1" />{entrepreneur.location}</Badge>
                )}
                {entrepreneur.foundedYear && (
                  <Badge variant="accent"><Calendar size={14} className="mr-1" />Founded {entrepreneur.foundedYear}</Badge>
                )}
                {entrepreneur.teamSize != null && (
                  <Badge variant="secondary"><Users size={14} className="mr-1" />{entrepreneur.teamSize} members</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 sm:mt-0 flex flex-col sm:flex-row gap-2 justify-center sm:justify-end">
            {!isCurrentUser && (
              <>
                <Link to={`/chat/${(entrepreneur as any)._id || entrepreneur.id}`}>
                  <Button variant="outline" leftIcon={<MessageCircle size={18} />}>Message</Button>
                </Link>
                {isInvestor && (
                  <Button
                    leftIcon={<Send size={18} />}
                    disabled={hasRequestedCollaboration || sendingRequest}
                    onClick={handleSendRequest}
                  >
                    {sendingRequest ? 'Sending...' : hasRequestedCollaboration ? 'Request Sent' : 'Request Collaboration'}
                  </Button>
                )}
              </>
            )}
            {isCurrentUser && (
              <Link to="/settings">
                <Button variant="outline" leftIcon={<UserCircle size={18} />}>Edit Profile</Button>
              </Link>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><h2 className="text-lg font-medium text-gray-900">About</h2></CardHeader>
            <CardBody>
              {entrepreneur.bio
                ? <p className="text-gray-700">{entrepreneur.bio}</p>
                : <p className="text-sm text-gray-400">No bio provided yet.</p>}
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h2 className="text-lg font-medium text-gray-900">Startup Overview</h2></CardHeader>
            <CardBody>
              {entrepreneur.pitchSummary
                ? <p className="text-gray-700">{entrepreneur.pitchSummary}</p>
                : <p className="text-sm text-gray-400">No pitch summary provided yet.</p>}
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Team</h2>
              {entrepreneur.teamSize != null && (
                <span className="text-sm text-gray-500">{entrepreneur.teamSize} members</span>
              )}
            </CardHeader>
            <CardBody>
              {teamMembers && teamMembers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {teamMembers.map(member => (
                    <div key={member.id} className="flex items-center p-3 border border-gray-200 rounded-md">
                      <Avatar src={member.avatarUrl} alt={member.name} size="md" className="mr-3" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{member.name}</h3>
                        <p className="text-xs text-gray-500">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No team members listed yet.</p>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><h2 className="text-lg font-medium text-gray-900">Funding</h2></CardHeader>
            <CardBody>
              <span className="text-sm text-gray-500">Funding Needed</span>
              <div className="flex items-center mt-1">
                <DollarSign size={18} className="text-accent-600 mr-1" />
                {entrepreneur.fundingNeeded
                  ? <p className="text-lg font-semibold text-gray-900">{entrepreneur.fundingNeeded}</p>
                  : <p className="text-sm text-gray-400">Not specified</p>}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h2 className="text-lg font-medium text-gray-900">Documents</h2></CardHeader>
            <CardBody>
              {documents && documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50">
                      <div className="p-2 bg-primary-50 rounded-md mr-3">
                        <FileText size={18} className="text-primary-700" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{doc.title}</h3>
                        <p className="text-xs text-gray-500">Updated {doc.updatedAt}</p>
                      </div>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">View</Button>
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No documents uploaded yet.</p>
              )}

              {!isCurrentUser && isInvestor && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Request access to detailed documents and financials by sending a collaboration request.
                  </p>
                  <Button
                    className="mt-3 w-full"
                    disabled={hasRequestedCollaboration || sendingRequest}
                    onClick={handleSendRequest}
                  >
                    {hasRequestedCollaboration ? 'Request Sent' : 'Request Collaboration'}
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
