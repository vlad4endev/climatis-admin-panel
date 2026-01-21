import { supabase } from "@/integrations/supabase/client";

export type LogAction = 'create' | 'update' | 'delete';

export interface LogParams {
  section: string;
  elementId: string;
  elementName: string;
  action: LogAction;
  changes?: Record<string, any>;
}

const SECTION_LABELS: Record<string, string> = {
  clients: 'Контрагенты',
  serviceObjects: 'Объекты',
  contacts: 'Контакты',
  documents: 'Документы',
  requests: 'Заявки',
  estimates: 'Расчёты',
  assignments: 'Наряды',
  invoices: 'Счета',
  tasks: 'Задачи',
  employees: 'Сотрудники',
  teams: 'Бригады',
  spareParts: 'Комплектующие',
  warehouseCategories: 'Категории',
  stockMovements: 'Расход-приход',
  users: 'Пользователи',
};

export function getSectionLabel(section: string): string {
  return SECTION_LABELS[section] || section;
}

export function getActionLabel(action: LogAction): string {
  switch (action) {
    case 'create': return 'Создание';
    case 'update': return 'Редактирование';
    case 'delete': return 'Удаление';
    default: return action;
  }
}

export async function logActivity(params: LogParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('Cannot log activity: no authenticated user');
      return;
    }

    // Get user name from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const { error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        user_name: profile?.full_name || user.email || 'Неизвестный',
        section: params.section,
        element_id: params.elementId,
        element_name: params.elementName,
        action: params.action,
        changes: params.changes || null,
      });

    if (error) {
      console.error('Failed to log activity:', error);
    }
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}
