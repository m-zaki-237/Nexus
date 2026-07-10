import React, { useState } from 'react';
import { User, Lock, Bell, Globe, Palette, CreditCard } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);

  // Profile form state
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [location, setLocation] = useState((user as any)?.location || '');
  const [startupName, setStartupName] = useState((user as any)?.startupName || '');
  const [pitchSummary, setPitchSummary] = useState((user as any)?.pitchSummary || '');
  const [fundingNeeded, setFundingNeeded] = useState((user as any)?.fundingNeeded || '');
  const [industry, setIndustry] = useState((user as any)?.industry || '');
  const [foundedYear, setFoundedYear] = useState((user as any)?.foundedYear || '');
  const [teamSize, setTeamSize] = useState((user as any)?.teamSize || '');
  const [minimumInvestment, setMinimumInvestment] = useState((user as any)?.minimumInvestment || '');
  const [maximumInvestment, setMaximumInvestment] = useState((user as any)?.maximumInvestment || '');
  const [investmentInterests, setInvestmentInterests] = useState(
    ((user as any)?.investmentInterests || []).join(', ')
  );
  const [investmentStage, setInvestmentStage] = useState(
    ((user as any)?.investmentStage || []).join(', ')
  );
  const [portfolioCompanies, setPortfolioCompanies] = useState(
    ((user as any)?.portfolioCompanies || []).join(', ')
  );

  if (!user) return null;

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updates: Record<string, any> = { name, bio, avatarUrl };
      if (user.role === 'entrepreneur') {
        updates.location = location;
        updates.startupName = startupName;
        updates.pitchSummary = pitchSummary;
        updates.fundingNeeded = fundingNeeded;
        updates.industry = industry;
        if (foundedYear) updates.foundedYear = Number(foundedYear);
        if (teamSize) updates.teamSize = Number(teamSize);
      }
      if (user.role === 'investor') {
        updates.minimumInvestment = minimumInvestment;
        updates.maximumInvestment = maximumInvestment;
        updates.investmentInterests = investmentInterests.split(',').map((s: string) => s.trim()).filter(Boolean);
        updates.investmentStage = investmentStage.split(',').map((s: string) => s.trim()).filter(Boolean);
        updates.portfolioCompanies = portfolioCompanies.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      await updateProfile(updates);
    } finally {
      setSaving(false);
    }
  };

  const navItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'language', label: 'Language', icon: Globe },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardBody className="p-2">
            <nav className="space-y-1">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === id
                      ? 'text-primary-700 bg-primary-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} className="mr-3" />
                  {label}
                </button>
              ))}
            </nav>
          </CardBody>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">Profile Settings</h2>
              </CardHeader>
              <CardBody className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar src={user.avatarUrl} alt={user.name} size="xl" />
                  <div>
                    <Input
                      label="Avatar URL"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://..."
                    />
                    <p className="mt-1 text-xs text-gray-500">Paste an image URL for your avatar</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={user.email}
                    disabled
                  />
                  <Input
                    label="Role"
                    value={user.role}
                    disabled
                  />
                  {user.role === 'entrepreneur' && (
                    <Input
                      label="Location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="City, Country"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    className="w-full rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2"
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>

                {/* Entrepreneur-specific fields */}
                {user.role === 'entrepreneur' && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-sm font-semibold text-gray-800">Startup Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="Startup Name" value={startupName} onChange={(e) => setStartupName(e.target.value)} />
                      <Input label="Industry" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. FinTech" />
                      <Input label="Funding Needed" value={fundingNeeded} onChange={(e) => setFundingNeeded(e.target.value)} placeholder="e.g. $500K" />
                      <Input label="Founded Year" type="number" value={foundedYear} onChange={(e) => setFoundedYear(e.target.value)} />
                      <Input label="Team Size" type="number" value={teamSize} onChange={(e) => setTeamSize(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pitch Summary</label>
                      <textarea
                        className="w-full rounded-md border border-gray-300 shadow-sm p-2"
                        rows={3}
                        value={pitchSummary}
                        onChange={(e) => setPitchSummary(e.target.value)}
                        placeholder="Brief description of your startup..."
                      />
                    </div>
                  </div>
                )}

                {/* Investor-specific fields */}
                {user.role === 'investor' && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-sm font-semibold text-gray-800">Investment Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="Min Investment" value={minimumInvestment} onChange={(e) => setMinimumInvestment(e.target.value)} placeholder="e.g. $100K" />
                      <Input label="Max Investment" value={maximumInvestment} onChange={(e) => setMaximumInvestment(e.target.value)} placeholder="e.g. $2M" />
                    </div>
                    <Input
                      label="Investment Interests (comma-separated)"
                      value={investmentInterests}
                      onChange={(e) => setInvestmentInterests(e.target.value)}
                      placeholder="e.g. FinTech, SaaS, AI/ML"
                    />
                    <Input
                      label="Investment Stages (comma-separated)"
                      value={investmentStage}
                      onChange={(e) => setInvestmentStage(e.target.value)}
                      placeholder="e.g. Seed, Series A"
                    />
                    <Input
                      label="Portfolio Companies (comma-separated)"
                      value={portfolioCompanies}
                      onChange={(e) => setPortfolioCompanies(e.target.value)}
                      placeholder="e.g. TechCo, StartupX"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => window.location.reload()}>Cancel</Button>
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">Security Settings</h2>
              </CardHeader>
              <CardBody className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                      <Badge variant="error" className="mt-1">Not Enabled</Badge>
                    </div>
                    <Button variant="outline">Enable</Button>
                  </div>
                </div>
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <Input label="Current Password" type="password" />
                    <Input label="New Password" type="password" />
                    <Input label="Confirm New Password" type="password" />
                    <div className="flex justify-end">
                      <Button>Update Password</Button>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {!['profile', 'security'].includes(activeTab) && (
            <Card>
              <CardBody className="py-12 text-center text-gray-500">
                <p>This settings section is coming soon.</p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
