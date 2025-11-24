export type ClientType = "legal_entity" | "individual_entrepreneur";

export interface AdditionalContact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface Client {
  id: string;
  companyName: string;
  type: ClientType;
  mainContactName: string;
  phone: string;
  email: string;
  additionalContacts: AdditionalContact[];
  notes: string;
  createdAt: Date;
}
