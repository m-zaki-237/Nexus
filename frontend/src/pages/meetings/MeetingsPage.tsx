import React, { useEffect, useState } from 'react';
import {
  Calendar, Clock, Plus, CheckCircle2, XCircle,
  AlertCircle, Users, ChevronRight, Trash2,
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { Meeting, User } from '../../types';
import { format, isPast, isFuture } from 'date-fns';
import toast from 'react-hot-toast';

type MeetingTab = 'upcoming' | 'pending' | 'past';

interface ScheduleForm {
  title: string;
  participantId: string;
  startTime: string;
  endTime: string;
  notes: string;
}

export const MeetingsPage: React.FC = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<MeetingTab>('upcoming');
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [contacts, setContacts] = useState<User[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<ScheduleForm>({
    title: '',
    participantId: '',
    startTime: '',
    endTime: '',
    notes: '',
  });

  const fetchMeetings = async () => {
    try {
      const res = await api.get('/meetings');
      setMeetings(res.data.meetings || []);
    } catch {
      toast.error('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const role = user?.role === 'investor' ? 'entrepreneurs' : 'investors';
      const res = await api.get(`/auth/${role}`);
      setContacts(res.data[role] || []);
    } catch {
      console.error('Failed to fetch contacts');
    }
  };

  useEffect(() => {
    fetchMeetings();
    fetchContacts();
  }, [user]);

  const getOtherParty = (meeting: Meeting): User | null => {
    const currentId = (user as any)?._id || user?.id;
    const organizer = meeting.organizerId as any;
    const participant = meeting.participantId as any;
    const organizerId = organizer?._id?.toString() || organizer?.toString();
    if (organizerId === currentId?.toString()) {
      return typeof participant === 'object' ? participant : null;
    }
    return typeof organizer === 'object' ? organizer : null;
  };

  const isOrganizer = (meeting: Meeting): boolean => {
    const currentId = (user as any)?._id?.toString() || user?.id;
    const organizer = meeting.organizerId as any;
    const organizerId = organizer?._id?.toString() || organizer?.toString();
    return organizerId === currentId;
  };

  const upcoming = meetings.filter(
    m => m.status === 'accepted' && isFuture(new Date(m.startTime))
  );
  const pending = meetings.filter(m => m.status === 'pending');
  const past = meetings.filter(
    m => m.status === 'accepted' && isPast(new Date(m.startTime))
  ).concat(meetings.filter(m => ['rejected', 'cancelled'].includes(m.status)));

  const displayed = tab === 'upcoming' ? upcoming : tab === 'pending' ? pending : past;

  const handleStatusUpdate = async (meetingId: string, status: 'accepted' | 'rejected' | 'cancelled') => {
    try {
      await api.patch(`/meetings/${meetingId}/status`, { status });
      toast.success(`Meeting ${status}`);
      fetchMeetings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update meeting');
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.participantId || !form.startTime || !form.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/meetings', {
        title: form.title,
        participantId: form.participantId,
        startTime: form.startTime,
        endTime: form.endTime,
        notes: form.notes,
      });
      toast.success('Meeting scheduled!');
      setShowScheduleForm(false);
      setForm({ title: '', participantId: '', startTime: '', endTime: '', notes: '' });
      fetchMeetings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to schedule meeting');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (meeting: Meeting) => {
    switch (meeting.status) {
      case 'accepted': return <Badge variant="success">Confirmed</Badge>;
      case 'pending': return <Badge variant="warning">Pending</Badge>;
      case 'rejected': return <Badge variant="error">Declined</Badge>;
      case 'cancelled': return <Badge variant="gray">Cancelled</Badge>;
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-600">Schedule and manage your meetings</p>
        </div>
        <Button leftIcon={<Plus size={18} />} onClick={() => setShowScheduleForm(v => !v)}>
          {showScheduleForm ? 'Cancel' : 'Schedule Meeting'}
        </Button>
      </div>

      {/* Schedule form */}
      {showScheduleForm && (
        <Card className="border-primary-200 bg-primary-50">
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">New Meeting</h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSchedule} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Meeting Title *"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Initial pitch discussion"
                  fullWidth
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Participant *
                  </label>
                  <select
                    className="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 text-sm focus:border-primary-500 focus:ring-primary-500"
                    value={form.participantId}
                    onChange={e => setForm(f => ({ ...f, participantId: e.target.value }))}
                    required
                  >
                    <option value="">Select a person...</option>
                    {contacts.map(c => (
                      <option key={(c as any)._id || c.id} value={(c as any)._id || c.id}>
                        {c.name} — {(c as any).startupName || (c as any).role}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Start Time *"
                  type="datetime-local"
                  value={form.startTime}
                  onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                  fullWidth
                />
                <Input
                  label="End Time *"
                  type="datetime-local"
                  value={form.endTime}
                  onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                  fullWidth
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  className="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 text-sm"
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Agenda or notes for the meeting..."
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowScheduleForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Scheduling...' : 'Schedule Meeting'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Upcoming', count: upcoming.length, icon: Calendar, color: 'primary' },
          { label: 'Pending Response', count: pending.length, icon: AlertCircle, color: 'warning' },
          { label: 'Past Meetings', count: past.length, icon: CheckCircle2, color: 'secondary' },
        ].map(({ label, count, icon: Icon, color }) => (
          <Card key={label} className={`bg-${color}-50 border border-${color}-100`}>
            <CardBody>
              <div className="flex items-center">
                <div className={`p-3 bg-${color}-100 rounded-full mr-4`}>
                  <Icon size={20} className={`text-${color}-700`} />
                </div>
                <div>
                  <p className={`text-sm font-medium text-${color}-700`}>{label}</p>
                  <h3 className={`text-xl font-semibold text-${color}-900`}>{count}</h3>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(['upcoming', 'pending', 'past'] as MeetingTab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3 px-1 border-b-2 text-sm font-medium capitalize ${
                tab === t
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t}
              {t === 'pending' && pending.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs bg-primary-600 text-white rounded-full">
                  {pending.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Meeting list */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading meetings...</div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Calendar size={28} className="text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">No {tab} meetings</p>
            {tab === 'upcoming' && (
              <p className="text-sm text-gray-400 mt-1">
                Schedule a meeting to get started
              </p>
            )}
          </div>
        ) : (
          displayed.map(meeting => {
            const other = getOtherParty(meeting);
            const organizer = isOrganizer(meeting);
            const start = new Date(meeting.startTime);
            const end = new Date(meeting.endTime);

            return (
              <Card key={(meeting as any)._id || meeting.id} className="hover:shadow-md transition-shadow">
                <CardBody>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {other ? (
                        <Avatar
                          src={(other as any).avatarUrl || ''}
                          alt={(other as any).name || 'User'}
                          size="md"
                          status={(other as any).isOnline ? 'online' : 'offline'}
                          className="flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Users size={18} className="text-gray-400" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-gray-900">{meeting.title}</h3>
                          {getStatusBadge(meeting)}
                          {organizer && (
                            <Badge variant="gray" size="sm">Organizer</Badge>
                          )}
                        </div>

                        {other && (
                          <p className="text-sm text-gray-500 mt-0.5">
                            with {(other as any).name}
                          </p>
                        )}

                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {format(start, 'MMM d, yyyy')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {format(start, 'h:mm a')} – {format(end, 'h:mm a')}
                          </span>
                        </div>

                        {meeting.notes && (
                          <p className="text-xs text-gray-400 mt-2 truncate">{meeting.notes}</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {meeting.status === 'pending' && !organizer && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            leftIcon={<XCircle size={14} />}
                            onClick={() => handleStatusUpdate((meeting as any)._id || meeting.id, 'rejected')}
                          >
                            Decline
                          </Button>
                          <Button
                            size="sm"
                            leftIcon={<CheckCircle2 size={14} />}
                            onClick={() => handleStatusUpdate((meeting as any)._id || meeting.id, 'accepted')}
                          >
                            Accept
                          </Button>
                        </>
                      )}
                      {meeting.status === 'pending' && organizer && (
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<Trash2 size={14} />}
                          onClick={() => handleStatusUpdate((meeting as any)._id || meeting.id, 'cancelled')}
                        >
                          Cancel
                        </Button>
                      )}
                      {meeting.status === 'accepted' && isFuture(start) && (
                        <Button
                          size="sm"
                          variant="outline"
                          rightIcon={<ChevronRight size={14} />}
                          onClick={() => handleStatusUpdate((meeting as any)._id || meeting.id, 'cancelled')}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
