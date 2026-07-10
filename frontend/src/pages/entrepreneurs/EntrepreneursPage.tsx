import React, { useEffect, useState } from 'react';
import { Search, Filter, MapPin } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { EntrepreneurCard } from '../../components/entrepreneur/EntrepreneurCard';
import api from '../../api/axios';
import { Entrepreneur } from '../../types';

export const EntrepreneursPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [entrepreneurs, setEntrepreneurs] = useState<Entrepreneur[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntrepreneurs = async () => {
      try {
        const res = await api.get('/auth/entrepreneurs');
        setEntrepreneurs(res.data.entrepreneurs || []);
      } catch (error) {
        console.error(error);
        setEntrepreneurs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEntrepreneurs();
  }, []);

  // Derive real filter options from actual fetched data
  const allIndustries = Array.from(
    new Set(entrepreneurs.map(e => e.industry).filter(Boolean))
  ) as string[];

  const allLocations = Array.from(
    new Set(entrepreneurs.map(e => e.location).filter(Boolean))
  ) as string[];

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries(prev =>
      prev.includes(industry)
        ? prev.filter(i => i !== industry)
        : [...prev, industry]
    );
  };

  const toggleLocation = (location: string) => {
    setSelectedLocations(prev =>
      prev.includes(location)
        ? prev.filter(l => l !== location)
        : [...prev, location]
    );
  };

  const filteredEntrepreneurs = entrepreneurs.filter(entrepreneur => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      entrepreneur.name?.toLowerCase().includes(query) ||
      entrepreneur.startupName?.toLowerCase().includes(query) ||
      entrepreneur.industry?.toLowerCase().includes(query) ||
      entrepreneur.pitchSummary?.toLowerCase().includes(query);

    const matchesIndustry =
      selectedIndustries.length === 0 ||
      (entrepreneur.industry && selectedIndustries.includes(entrepreneur.industry));

    const matchesLocation =
      selectedLocations.length === 0 ||
      (entrepreneur.location && selectedLocations.includes(entrepreneur.location));

    return matchesSearch && matchesIndustry && matchesLocation;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find Startups</h1>
        <p className="text-gray-600">Discover promising startups looking for investment</p>
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
                <h3 className="text-sm font-medium text-gray-900 mb-2">Industry</h3>
                {allIndustries.length > 0 ? (
                  <div className="space-y-2">
                    {allIndustries.map(industry => (
                      <button
                        key={industry}
                        onClick={() => toggleIndustry(industry)}
                        className={`block w-full text-left px-3 py-2 rounded-md text-sm ${
                          selectedIndustries.includes(industry)
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {industry}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No industries available yet.</p>
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
              placeholder="Search startups by name, industry, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startAdornment={<Search size={18} />}
              fullWidth
            />

            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <span className="text-sm text-gray-600">
                {filteredEntrepreneurs.length} results
              </span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading startups...</div>
          ) : filteredEntrepreneurs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredEntrepreneurs.map(entrepreneur => (
                <EntrepreneurCard
                  key={entrepreneur.id}
                  entrepreneur={entrepreneur}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No startups match your search or filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};