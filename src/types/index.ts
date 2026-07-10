export type UserRole = 'entrepreneur' | 'investor';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  bio: string;
  isOnline?: boolean;
  location?: string;
  createdAt: string;
}

export interface Entrepreneur extends User {
  role: 'entrepreneur';
  startupName: string;
  pitchSummary: string;
  fundingNeeded: string;
  industry: string;
  location: string;
  foundedYear: number;
  teamSize: number;
}

export interface Investor extends User {
  role: 'investor';
  investmentInterests: string[];
  investmentStage: string[];
  portfolioCompanies: string[];
  totalInvestments: number;
  minimumInvestment: string;
  maximumInvestment: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatConversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: string;
}

export interface CollaborationRequest {
  id: string;
  // These are populated objects when coming from backend
  investorId: string | Investor;
  entrepreneurId: string | Entrepreneur;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  organizerId: string | User;
  participantId: string | User;
  startTime: string;
  endTime: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  notes?: string;
  meetingLink?: string;
  createdAt: string;
}

export interface Document {
  id: string;
  title: string;
  ownerId: string | User;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  version: number;
  status: 'draft' | 'active' | 'archived';
  sharedWith: (string | User)[];
  signatureUrl?: string;
  isSigned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}
