import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageCircle, Building2, MapPin, UserCircle, BarChart3, Briefcase } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { Investor } from '../../types';

export const InvestorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();

  const [investor, setInvestor] = useState<Investor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvestor = async () => {
      try {
        const res = await api.get(`/user/${id}`);
        setInvestor(res.data.user);
      } catch (error) {
        setInvestor(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchInvestor();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!investor || investor.role !== 'investor') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Investor not found</h2>
        <p className="text-gray-600 mt-2">The investor profile you're looking for doesn't exist or has been removed.</p>
        <Link to="/dashboard/entrepreneur">
          <Button variant="outline" className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const isCurrentUser = currentUser?.id === investor.id;

  const investmentInterests = investor.investmentInterests || [];
  const investmentStage = investor.investmentStage || [];
  const portfolioCompanies = investor.portfolioCompanies || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Profile header */}
      <Card>
        <CardBody className="sm:flex sm:items-start sm:justify-between p-6">
          <div className="sm:flex sm:space-x-6">
            <Avatar
              src={investor.avatarUrl}
              alt={investor.name}
              size="xl"
              status={investor.isOnline ? 'online' : 'offline'}
              className="mx-auto sm:mx-0"
            />

            <div className="mt-4 sm:mt-0 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">{investor.name}</h1>
              <p className="text-gray-600 flex items-center justify-center sm:justify-start mt-1">
                <Building2 size={16} className="mr-1" />
                Investor
                {investor.totalInvestments != null ? ` • ${investor.totalInvestments} investments` : ''}
              </p>

              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
                {investor.location && (
                  <Badge variant="primary">
                    <MapPin size={14} className="mr-1" />
                    {investor.location}
                  </Badge>
                )}
                {investmentStage.map((stage, index) => (
                  <Badge key={index} variant="secondary" size="sm">{stage}</Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 sm:mt-0 flex flex-col sm:flex-row gap-2 justify-center sm:justify-end">
            {!isCurrentUser && (
              <Link to={`/chat/${investor.id}`}>
                <Button leftIcon={<MessageCircle size={18} />}>
                  Message
                </Button>
              </Link>
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
              {investor.bio ? (
                <p className="text-gray-700">{investor.bio}</p>
              ) : (
                <p className="text-sm text-gray-400">No bio provided yet.</p>
              )}
            </CardBody>
          </Card>

          {/* Investment Interests */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Investment Interests</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <h3 className="text-md font-medium text-gray-900">Industries</h3>
                  {investmentInterests.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {investmentInterests.map((interest, index) => (
                        <Badge key={index} variant="primary" size="md">{interest}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 mt-2">No industries specified yet.</p>
                  )}
                </div>

                <div>
                  <h3 className="text-md font-medium text-gray-900">Investment Stages</h3>
                  {investmentStage.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {investmentStage.map((stage, index) => (
                        <Badge key={index} variant="secondary" size="md">{stage}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 mt-2">No investment stages specified yet.</p>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Portfolio Companies */}
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Portfolio Companies</h2>
              <span className="text-sm text-gray-500">{portfolioCompanies.length} companies</span>
            </CardHeader>
            <CardBody>
              {portfolioCompanies.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {portfolioCompanies.map((company, index) => (
                    <div key={index} className="flex items-center p-3 border border-gray-200 rounded-md">
                      <div className="p-3 bg-primary-50 rounded-md mr-3">
                        <Briefcase size={18} className="text-primary-700" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{company}</h3>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No portfolio companies listed yet.</p>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar - right side */}
        <div className="space-y-6">
          {/* Investment Details */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Investment Details</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-500">Investment Range</span>
                  {investor.minimumInvestment != null && investor.maximumInvestment != null ? (
                    <p className="text-lg font-semibold text-gray-900">
                      {investor.minimumInvestment} - {investor.maximumInvestment}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400">Not specified</p>
                  )}
                </div>

                <div>
                  <span className="text-sm text-gray-500">Total Investments</span>
                  {investor.totalInvestments != null ? (
                    <p className="text-md font-medium text-gray-900">{investor.totalInvestments} companies</p>
                  ) : (
                    <p className="text-sm text-gray-400">Not specified</p>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Investment Stats</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Active Investments</h3>
                      <p className="text-xl font-semibold text-primary-700 mt-1">{portfolioCompanies.length}</p>
                    </div>
                    <BarChart3 size={24} className="text-primary-600" />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};