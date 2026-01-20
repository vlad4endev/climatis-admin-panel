export type ClientType = "legal_entity" | "individual_entrepreneur";

export interface Client {
  id: string;
  companyName: string;
  type: ClientType;
  division: string;
  requisites: string;
  notes: string;
  createdAt: Date;
}
