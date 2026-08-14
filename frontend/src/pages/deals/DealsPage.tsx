import React, { useState, useEffect } from 'react';
import { Search, Filter, DollarSign, TrendingUp, Users, CheckCircle2, Plus } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

type DealStatus = 'Due Diligence' | 'Term Sheet' | 'Negotiation' | 'Closed' | 'Passed';

interface Deal {
  _id: string;
  entrepreneurId: any;
  investorId: any;
  amount: string;
  equity: string;
  status: DealStatus;
  stage: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_COLORS: Record<DealStatus, 'primary' | 'secondary' | 'accent' | 'success' | 'error'> = {
  'Due Diligence': 'primary',
  'Term Sheet': 'secondary',
  'Negotiation': 'accent',
  'Closed': 'success',
  'Passed': 'error',
};

const STATUSES: DealStatus[] = ['Due Diligence', 'Term Sheet', 'Negotiation', 'Closed', 'Passed'];

export const DealsPage: React.FC = () => {
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<DealStatus[]>([]);

  // Derive real stats from live data
  const totalAmount = deals
    .filter(d => d.status === 'Closed')
    .reduce((sum, d) => {
      const n = parseFloat(d.amount?.replace(/[^0-9.]/g, '') || '0');
      return sum + n;
    }, 0);
  const activeCount = deals.filter(d => !['Closed', 'Passed'].includes(d.status)).length;
  const closedCount = deals.filter(d => d.status === 'Closed').length;

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const res = await api.get('/deals');
        setDeals(res.data.deals || []);
      } catch (err: any) {
        // 404 means route not yet set up — show empty state
        if (err.response?.status !== 404) {
          toast.error('Failed to load deals');
        }
        setDeals([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDeals();
  }, []);

  const toggleStatus = (s: DealStatus) =>
    setSelectedStatus(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );

  const filtered = deals.filter(deal => {
    const name = deal.entrepreneurId?.name || deal.investorId?.name || '';
    const industry = deal.entrepreneurId?.industry || '';
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || name.toLowerCase().includes(query) || industry.toLowerCase().includes(query);
    const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes(deal.status);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investment Deals</h1>
          <p className="text-gray-600">Track and manage your investment pipeline</p>
        </div>
        <Button leftIcon={<Plus size={18} />}>Add Deal</Button>
      </div>

      {/* Live stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-lg mr-3">
                <DollarSign size={20} className="text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Closed</p>
                <p className="text-lg font-semibold text-gray-900">
                  {totalAmount > 0 ? `$${totalAmount.toLocaleString()}` : '—'}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-lg mr-3">
                <TrendingUp size={20} className="text-secondary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Deals</p>
                <p className="text-lg font-semibold text-gray-900">{activeCount}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-accent-100 rounded-lg mr-3">
                <Users size={20} className="text-accent-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Deals</p>
                <p className="text-lg font-semibold text-gray-900">{deals.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg mr-3">
                <CheckCircle2 size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Closed Deals</p>
                <p className="text-lg font-semibold text-gray-900">{closedCount}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-2/3">
          <Input
            placeholder="Search by startup name or industry..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            startAdornment={<Search size={18} />}
            fullWidth
          />
        </div>
        <div className="w-full md:w-1/3 flex items-center gap-2 flex-wrap">
          <Filter size={18} className="text-gray-500 flex-shrink-0" />
          {STATUSES.map(s => (
            <Badge
              key={s}
              variant={selectedStatus.includes(s) ? STATUS_COLORS[s] : 'gray'}
              className="cursor-pointer"
              onClick={() => toggleStatus(s)}
            >
              {s}
            </Badge>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">
            {selectedStatus.length > 0 ? `${selectedStatus.join(', ')} Deals` : 'All Deals'}
          </h2>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading deals...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No deals yet</p>
              <p className="text-sm text-gray-400 mt-1">
                {user?.role === 'investor'
                  ? 'Connect with entrepreneurs and track your investment pipeline here.'
                  : 'When investors make deals with you, they will appear here.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    {['Startup', 'Amount', 'Equity', 'Status', 'Stage', 'Last Activity', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.map(deal => {
                    const startup = deal.entrepreneurId;
                    return (
                      <tr key={deal._id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Avatar
                              src={startup?.avatarUrl || ''}
                              alt={startup?.name || ''}
                              size="sm"
                              className="flex-shrink-0"
                            />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{startup?.name || '—'}</p>
                              <p className="text-xs text-gray-500">{startup?.industry || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">{deal.amount || '—'}</td>
                        <td className="px-4 py-4 text-sm text-gray-900">{deal.equity || '—'}</td>
                        <td className="px-4 py-4">
                          <Badge variant={STATUS_COLORS[deal.status]}>{deal.status}</Badge>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">{deal.stage || '—'}</td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          {new Date(deal.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button variant="outline" size="sm">View</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
