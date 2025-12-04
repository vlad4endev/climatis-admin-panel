export interface TaskChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TaskComment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  assigneeName: string;
  requestId?: string;
  requestNumber?: string;
  proposedDeadline: string;
  agreedDeadline: string;
  status: 'новая' | 'в работе' | 'частично выполнена' | 'выполнена';
  checklist: TaskChecklistItem[];
  comments: TaskComment[];
  createdAt: string;
  createdBy: string;
}
