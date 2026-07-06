import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageCircle, Users, Calendar, Building2, MapPin, UserCircle, FileText, DollarSign, Send } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { Entrepreneur } from '../../types';

export const EntrepreneurProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();

  const [entrepreneur, setEntrepreneur] = useState<Entrepreneur | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntrepreneur = async () => {
      try {
        const res = await api.get(`/user/${id}`);
        setEntrepreneur(res.data.user);
      } catch (error) {
        setEntrepreneur(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchEntrepreneur();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!entrepreneur || entrepreneur.role !== 'entrepreneur') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Entrepreneur not found</h2>
        <p className="text-gray-600 mt-2">The entrepreneur profile you're looking for doesn't exist or has been removed.</p>
        <Link to="/dashboard/investor">
          <Button variant="outline" className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const isCurrentUser = currentUser?.id === entrepreneur.id;
  const isInvestor = currentUser?.role === 'investor';

  const handleSendRequest = async () => {
    if (!isInvestor || !currentUser || !id || sendingRequest) return;
    setSendingRequest(true);
    try {
      await api.post('/collaboration-requests', {
        entrepreneurId: id,
        message: `I'm interested in learning more about ${entrepreneur.startupName} and would like to explore potential investment opportunities.`,
      });
      setHasRequestedCollaboration(true);
    } catch (error) {
      console.error('Failed to send collaboration request', error);
    } finally {
      setSendingRequest(false);
    }
  };

  // Real team members from backend, if provided
  const teamMembers = (entrepreneur as any).teamMembers as
    | { id: string; name: string; role: string; avatarUrl?: string }[]
    | undefined;

  // Real documents from backend, if provided
  const documents = (entrepreneur as any).documents as
    | { id: string; title: string; updatedAt: string; url: string }[]
    | undefined;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Profile header */}
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
                <Badge variant="primary">{entrepreneur.industry || 'Industry not specified'}</Badge>
                <Badge variant="gray">
                  <MapPin size={14} className="mr-1" />
                  {entrepreneur.location || 'Location not specified'}
                </Badge>
                <Badge variant="accent">
                  <Calendar size={14} className="mr-1" />
                  {entrepreneur.foundedYear ? `Founded ${entrepreneur.foundedYear}` : 'Founding year not specified'}
                </Badge>
                <Badge variant="secondary">
                  <Users size={14} className="mr-1" />
                  {entrepreneur.teamSize != null ? `${entrepreneur.teamSize} team members` : 'Team size not specified'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="mt-6 sm:mt-0 flex flex-col sm:flex-row gap-2 justify-center sm:justify-end">
            {!isCurrentUser && (
              <>
                <Link to={`/chat/${entrepreneur.id}`}>
                  <Button variant="outline" leftIcon={<MessageCircle size={18} />}>
                    Message
                  </Button>
                </Link>

                {isInvestor && (
                  <Button
                    leftIcon={<Send size={18} />}
                    disabled={hasRequestedCollaboration || sendingRequest}
                    onClick={handleSendRequest}
                  >
                    {hasRequestedCollaboration ? 'Request Sent' : 'Request Collaboration'}
                  </Button>
                )}
              </>
            )}

            {isCurrentUser && (
              <Link to="/profile/edit">
                <Button variant="outline" leftIcon={<UserCircle size={18} />}>
                  Edit Profile
                </Button>
              </Link>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - left side */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">About</h2>
            </CardHeader>
            <CardBody>
              {entrepreneur.bio ? (
                <p className="text-gray-700">{entrepreneur.bio}</p>
              ) : (
                <p className="text-sm text-gray-400">No bio provided yet.</p>
              )}
            </CardBody>
          </Card>

          {/* Startup Description */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Startup Overview</h2>
            </CardHeader>
            <CardBody>
              {entrepreneur.pitchSummary ? (
                <p className="text-gray-700">{entrepreneur.pitchSummary}</p>
              ) : (
                <p className="text-sm text-gray-400">No pitch summary provided yet.</p>
              )}
            </CardBody>
          </Card>

          {/* Team */}
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
                  {teamMembers.map((member) => (
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

        {/* Sidebar - right side */}
        <div className="space-y-6">
          {/* Funding Details */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Funding</h2>
            </CardHeader>
            <CardBody>
              <div>
                <span className="text-sm text-gray-500">Funding Needed</span>
                <div className="flex items-center mt-1">
                  <DollarSign size={18} className="text-accent-600 mr-1" />
                  {entrepreneur.fundingNeeded ? (
                    <p className="text-lg font-semibold text-gray-900">{entrepreneur.fundingNeeded}</p>
                  ) : (
                    <p className="text-sm text-gray-400">Not specified</p>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Documents</h2>
            </CardHeader>
            <CardBody>
              {documents && documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                    >
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