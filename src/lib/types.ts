import type { Timestamp } from "firebase/firestore";

export type Currency = 'PKR' | 'USD' | 'EUR' | 'GBP';
export type Theme = 'theme-blue' | 'theme-zinc' | 'theme-slate' | 'theme-stone' | 'theme-rose' | 'theme-orange';

export type Payment = {
  id: string;
  amount: number;
  date: string;
};

export type Transaction = {
  id:string;
  productName: string;
  receivable: number;
  payable: number;
  date: string;
  status: 'paid' | 'unpaid' | 'partial';
  payments: Payment[];
};

export type Customer = {
  id:string;
  name: string;
  phoneNumber?: string;
  dateAdded: string;
  lastEdited: string;
  dateRemoved?: string | null;
  transactions: Transaction[];
};

export type SortKey = 'name' | 'netBalance' | 'lastEdited';

export type UserProfile = {
  displayName: string;
  email: string;
  currency: Currency;
  theme: Theme;
  teamId: string | null;
  role: 'owner' | 'member' | null;
};

export type TeamMember = UserProfile & {
  uid: string;
}

export type Invitation = {
  token: string;
  createdAt: string;
  createdBy: string;
}

export type Team = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Timestamp;
  invitations?: Invitation[];
}

export type ActivityLog = {
    id: string;
    action: string;
    timestamp: string;
    userId: string;
    userDisplayName: string;
    details: Record<string, any>;
}
