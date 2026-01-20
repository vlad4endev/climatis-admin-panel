export interface AssignedContact {
  id: string;
  name: string;
  phone: string;
  isMain: boolean;
}

export interface ServiceObject {
  id: string;
  clientId: string;
  clientName: string;
  objectName: string;
  address: string;
  accessDescription: string;
  notes: string;
  createdAt: Date;
  assignedContacts?: AssignedContact[];
}
