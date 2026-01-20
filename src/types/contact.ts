export interface Contact {
  id: string;
  clientId: string;
  name: string;
  phone: string;
  email: string;
  isMain: boolean;
  notes: string;
  createdAt: Date;
  // Joined field
  clientName?: string;
}
