export interface Team {
  id: string;
  name: string;
  leaderId: string;
  leaderName?: string;
  memberIds: string[];
  memberNames?: string[];
  competencies: string;
  notes: string;
  createdAt: Date;
}
