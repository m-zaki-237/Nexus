import React, { useEffect, useState } from 'react';
import { Search, Filter, MapPin } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { InvestorCard } from '../../components/investor/InvestorCard';
import api from '../../api/axios';
import { Investor } from '../../types';

export const InvestorsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvestors = async () => {
      try {
        const res = await api.get('/auth/investors');
        setInvestors(res.data.investors || []);
      } catch (error) {
        console.error(error);
        setInvestors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInvestors();
  }, []);

  // Get unique investment stages, interests, and locations from real data
  const allStages = Array.from(
    new Set(investors.flatMap(i => i.investmentStage || []))
  );
  const allInterests = Array.from(
    new Set(investors.flatMap(i => i.investmentInterests || []))
  );
  const allLocations = Array.from(
    new Set(investors.map(i => i.location).filter(Boolean))
  ) as string[];

  // Filter investors based on search and filters
  const filteredInvestors = investors.filter(investor => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      query === '' ||
      investor.name?.toLowerCase().includes(query) ||
      investor.bio?.toLowerCase().includes(query) ||
      (investor.investmentInterests || []).some(interest =>
        interest.toLowerCase().includes(query)
      );

    const matchesStages =
      selectedStages.length === 0 ||
      (investor.investmentStage || []).some(stage => selectedStages.includes(stage));

    const matchesInterests =
      selectedInterests.length === 0 ||
      (investor.investmentInterests || []).some(interest => selectedInterests.includes(interest));

    const matchesLocation =
      selectedLocations.length === 0 ||
      (investor.location && selectedLocations.includes(investor.location));

    return matchesSearch && matchesStages && matchesInterests && matchesLocation;
  });

  const toggleStage = (stage: string) => {
    setSelectedStages(prev =>
      prev.includes(stage)
        ? prev.filter(s => s !== stage)
        : [...prev, stage]
    );
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const toggleLocation = (location: string) => {
    setSelectedLocations(prev =>
      prev.includes(location)
        ? prev.filter(l => l !== location)
        : [...prev, location]
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find Investors</h1>
        <p className="text-gray-600">Connect with investors who match your startup's needs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Filters</h2>
            </CardHeader>
            <CardBody className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Investment Stage</h3>
                {allStages.length > 0 ? (
                  <div className="space-y-2">
                    {allStages.map(stage => (
                      <button
                        key={stage}
                        onClick={() => toggleStage(stage)}
                        className={`block w-full text-left px-3 py-2 rounded-md text-sm ${
                          selectedStages.includes(stage)
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {stage}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No investment stages available yet.</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Investment Interests</h3>
                {allInterests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {allInterests.map(interest => (
                      <Badge
                        key={interest}
                        variant={selectedInterests.includes(interest) ? 'primary' : 'gray'}
                        className="cursor-pointer"
                        onClick={() => toggleInterest(interest)}
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No investment interests available yet.</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Location</h3>
                {allLocations.length > 0 ? (
                  <div className="space-y-2">
                    {allLocations.map(location => (
                      <button
                        key={location}
                        onClick={() => toggleLocation(location)}
                        className={`flex items-center w-full text-left px-3 py-2 rounded-md text-sm ${
                          selectedLocations.includes(location)
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <MapPin size={16} className="mr-2" />
                        {location}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No locations available yet.</p>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search investors by name, interests, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startAdornment={<Search size={18} />}
              fullWidth
            />

            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <span className="text-sm text-gray-600">
                {filteredInvestors.length} results
              </span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading investors...</div>
          ) : filteredInvestors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredInvestors.map(investor => (
                <InvestorCard
                  key={investor.id}
                  investor={investor}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No investors match your search or filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};