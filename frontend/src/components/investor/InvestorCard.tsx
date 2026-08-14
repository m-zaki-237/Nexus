import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ExternalLink } from 'lucide-react';
import { Investor } from '../../types';
import { Card, CardBody, CardFooter } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface InvestorCardProps {
  investor: Investor;
  showActions?: boolean;
}

export const InvestorCard: React.FC<InvestorCardProps> = ({
  investor,
  showActions = true,
}) => {
  const navigate = useNavigate();
  const id = (investor as any)._id || investor.id;

  return (
    <Card hoverable className="transition-all duration-300 h-full" onClick={() => navigate(`/profile/investor/${id}`)}>
      <CardBody className="flex flex-col">
        <div className="flex items-start">
          <Avatar
            src={investor.avatarUrl}
            alt={investor.name}
            size="lg"
            status={investor.isOnline ? 'online' : 'offline'}
            className="mr-4"
          />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{investor.name}</h3>
            <p className="text-sm text-gray-500 mb-2">
              Investor{investor.totalInvestments ? ` • ${investor.totalInvestments} investments` : ''}
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {(investor.investmentStage || []).map((stage, i) => (
                <Badge key={i} variant="secondary" size="sm">{stage}</Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <h4 className="text-sm font-medium text-gray-900 mb-1">Investment Interests</h4>
          <div className="flex flex-wrap gap-2">
            {(investor.investmentInterests || []).length > 0
              ? investor.investmentInterests.map((interest, i) => (
                  <Badge key={i} variant="primary" size="sm">{interest}</Badge>
                ))
              : <span className="text-sm text-gray-400">Not specified</span>
            }
          </div>
        </div>

        {investor.bio && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 line-clamp-2">{investor.bio}</p>
          </div>
        )}

        <div className="mt-3 flex justify-between items-center">
          <div>
            <span className="text-xs text-gray-500">Investment Range</span>
            <p className="text-sm font-medium text-gray-900">
              {investor.minimumInvestment && investor.maximumInvestment
                ? `${investor.minimumInvestment} - ${investor.maximumInvestment}`
                : 'Not specified'}
            </p>
          </div>
        </div>
      </CardBody>

      {showActions && (
        <CardFooter className="border-t border-gray-100 bg-gray-50 flex justify-between">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<MessageCircle size={16} />}
            onClick={(e) => { e.stopPropagation(); navigate(`/chat/${id}`); }}
          >
            Message
          </Button>
          <Button
            variant="primary"
            size="sm"
            rightIcon={<ExternalLink size={16} />}
            onClick={() => navigate(`/profile/investor/${id}`)}
          >
            View Profile
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
