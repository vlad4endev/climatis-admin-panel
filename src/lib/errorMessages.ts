/**
 * Утилита для формирования понятных русскоязычных сообщений об ошибках.
 * Преобразует технические ошибки Supabase/PostgreSQL в читаемый текст.
 */

interface PostgrestError {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}

const ERROR_CODE_MAP: Record<string, string> = {
  "23505": "Запись с такими данными уже существует",
  "23503": "Невозможно выполнить — связанные данные не найдены",
  "23502": "Не заполнены обязательные поля",
  "23514": "Данные не прошли проверку",
  "42501": "Недостаточно прав для выполнения операции",
  "PGRST301": "Сессия истекла — войдите в систему заново",
  "PGRST204": "Запись не найдена",
};

const NETWORK_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  { pattern: /fetch|network|ERR_/i, message: "Нет связи с сервером. Проверьте подключение к интернету" },
  { pattern: /timeout/i, message: "Сервер не отвечает. Попробуйте позже" },
  { pattern: /unauthorized|401/i, message: "Сессия истекла. Войдите в систему заново" },
  { pattern: /forbidden|403/i, message: "Недостаточно прав для выполнения операции" },
  { pattern: /not found|404/i, message: "Запись не найдена или была удалена" },
  { pattern: /conflict|409/i, message: "Конфликт данных — запись была изменена другим пользователем" },
  { pattern: /too many|429/i, message: "Слишком много запросов. Подождите немного" },
  { pattern: /server error|500|502|503/i, message: "Ошибка сервера. Попробуйте позже" },
];

/**
 * Формирует понятное сообщение об ошибке на русском языке.
 * @param error - объект ошибки (Error, PostgrestError или unknown)
 * @param context - контекст операции, например "создании расчёта"
 * @returns Человекопонятное сообщение
 */
export function getErrorMessage(error: unknown, context: string): string {
  // Проверяем PostgrestError (ошибки Supabase)
  const pgError = error as PostgrestError;
  if (pgError?.code && ERROR_CODE_MAP[pgError.code]) {
    return `Ошибка при ${context}: ${ERROR_CODE_MAP[pgError.code]}`;
  }

  // Получаем текст ошибки
  const errorText = pgError?.message || (error instanceof Error ? error.message : String(error || ""));

  // Проверяем паттерны сетевых ошибок
  for (const { pattern, message } of NETWORK_PATTERNS) {
    if (pattern.test(errorText)) {
      return `Ошибка при ${context}: ${message}`;
    }
  }

  // Проверяем специфические ошибки PostgreSQL в тексте
  if (errorText.includes("duplicate key")) {
    return `Ошибка при ${context}: Запись с такими данными уже существует`;
  }
  if (errorText.includes("violates foreign key")) {
    return `Ошибка при ${context}: Связанные данные не найдены или были удалены`;
  }
  if (errorText.includes("violates not-null")) {
    return `Ошибка при ${context}: Не заполнены обязательные поля`;
  }
  if (errorText.includes("row-level security")) {
    return `Ошибка при ${context}: Недостаточно прав. Проверьте, что вы авторизованы`;
  }

  // Общая ошибка с контекстом
  return `Ошибка при ${context}. Попробуйте ещё раз или обратитесь к администратору`;
}
