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

const FIELD_LABELS: Record<string, string> = {
  // Common fields
  name: 'Название',
  title: 'Заголовок',
  status: 'Статус',
  notes: 'Примечания',
  comments: 'Комментарии',
  description: 'Описание',
  
  // Documents
  contractNumber: 'Номер договора',
  contract_number: 'Номер договора',
  startDate: 'Дата начала',
  start_date: 'Дата начала',
  endDate: 'Дата окончания',
  end_date: 'Дата окончания',
  contractType: 'Тип договора',
  contract_type: 'Тип договора',
  responseConditions: 'Условия реагирования',
  response_conditions: 'Условия реагирования',
  addedFile: 'Добавлен файл',
  removedFile: 'Удалён файл',
  
  // Clients
  companyName: 'Название компании',
  company_name: 'Название компании',
  mainContactName: 'Контактное лицо',
  main_contact_name: 'Контактное лицо',
  phone: 'Телефон',
  email: 'Email',
  division: 'Подразделение',
  requisites: 'Реквизиты',
  
  // Requests
  requestNumber: 'Номер заявки',
  request_number: 'Номер заявки',
  priority: 'Приоритет',
  type: 'Тип',
  problemDescription: 'Описание проблемы',
  problem_description: 'Описание проблемы',
  desiredDate: 'Желаемая дата',
  desired_date: 'Желаемая дата',
  plannedVisitDate: 'Планируемая дата визита',
  planned_visit_date: 'Планируемая дата визита',
  
  // Estimates
  estimateNumber: 'Номер расчёта',
  estimate_number: 'Номер расчёта',
  estimateDate: 'Дата расчёта',
  estimate_date: 'Дата расчёта',
  engineerComment: 'Комментарий инженера',
  engineer_comment: 'Комментарий инженера',
  
  // Tasks
  assigneeName: 'Исполнитель',
  assignee_name: 'Исполнитель',
  proposedDeadline: 'Предложенный срок',
  proposed_deadline: 'Предложенный срок',
  agreedDeadline: 'Согласованный срок',
  agreed_deadline: 'Согласованный срок',
  
  // Service Objects
  objectName: 'Название объекта',
  object_name: 'Название объекта',
  address: 'Адрес',
  accessDescription: 'Описание доступа',
  access_description: 'Описание доступа',
  
  // Employees
  fullName: 'ФИО',
  full_name: 'ФИО',
  position: 'Должность',
  
  // Spare Parts
  internalArticle: 'Внутренний артикул',
  internal_article: 'Внутренний артикул',
  currentStock: 'Текущий остаток',
  current_stock: 'Текущий остаток',
  minStock: 'Минимальный остаток',
  min_stock: 'Минимальный остаток',
  purchasePrice: 'Закупочная цена',
  purchase_price: 'Закупочная цена',
  retailPrice: 'Розничная цена',
  retail_price: 'Розничная цена',
  unit: 'Единица измерения',
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

function formatValue(value: any): string {
  if (value === null || value === undefined || value === '') {
    return '(пусто)';
  }
  if (typeof value === 'boolean') {
    return value ? 'Да' : 'Нет';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

export function getHumanReadableChanges(changes: Record<string, any> | null): string[] {
  if (!changes || Object.keys(changes).length === 0) {
    return [];
  }

  const descriptions: string[] = [];

  for (const [key, value] of Object.entries(changes)) {
    const fieldLabel = FIELD_LABELS[key] || key;
    
    // Special cases
    if (key === 'addedFile') {
      descriptions.push(`Добавлен файл: ${value}`);
      continue;
    }
    if (key === 'removedFile') {
      descriptions.push(`Удалён файл: ${value}`);
      continue;
    }
    
    // Regular field change
    descriptions.push(`${fieldLabel}: ${formatValue(value)}`);
  }

  return descriptions;
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
