import { supabase } from "@/integrations/supabase/client";

export type MonitoringEventType = 
  | 'mutation_error'    // Ошибка сохранения/удаления
  | 'query_error'       // Ошибка загрузки данных
  | 'button_click'      // Клик по кнопке
  | 'js_error'          // JS-ошибка в браузере
  | 'page_view';        // Просмотр страницы

export interface MonitoringEvent {
  eventType: MonitoringEventType;
  page: string;
  element?: string;
  message: string;
  details?: Record<string, any>;
}

// Cached user info (shared approach with activityLogger)
let cachedUserId: string | null = null;
let cachedUserName: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getCachedUser(): Promise<{ userId: string; userName: string } | null> {
  const now = Date.now();
  if (cachedUserId && cachedUserName && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return { userId: cachedUserId, userName: cachedUserName };
  }
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    const userId = session.user.id;
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();
    cachedUserId = userId;
    cachedUserName = profile?.full_name || session.user.email || 'Неизвестный';
    cacheTimestamp = now;
    return { userId: cachedUserId, userName: cachedUserName };
  } catch {
    return null;
  }
}

supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT' || event === 'SIGNED_IN') {
    cachedUserId = null;
    cachedUserName = null;
    cacheTimestamp = 0;
  }
});

// Queue for batching events
let eventQueue: MonitoringEvent[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL_MS = 3000;
const MAX_QUEUE_SIZE = 10;

async function flushQueue() {
  if (eventQueue.length === 0) return;
  
  const events = [...eventQueue];
  eventQueue = [];
  flushTimeout = null;

  try {
    const user = await getCachedUser();
    
    const rows = events.map(evt => ({
      user_id: user?.userId || null,
      user_name: user?.userName || null,
      event_type: evt.eventType,
      page: evt.page,
      element: evt.element || null,
      message: evt.message,
      details: evt.details ? JSON.parse(JSON.stringify(evt.details)) : null,
    }));

    await supabase.from('monitoring_logs').insert(rows);
  } catch (err) {
    console.error('Failed to flush monitoring events:', err);
  }
}

function scheduleFlush() {
  if (flushTimeout) return;
  flushTimeout = setTimeout(flushQueue, FLUSH_INTERVAL_MS);
}

export function logMonitoringEvent(event: MonitoringEvent): void {
  eventQueue.push(event);
  if (eventQueue.length >= MAX_QUEUE_SIZE) {
    flushQueue();
  } else {
    scheduleFlush();
  }
}

// Convenience helpers
export function logMutationError(page: string, element: string, error: any): void {
  logMonitoringEvent({
    eventType: 'mutation_error',
    page,
    element,
    message: error?.message || String(error),
    details: {
      stack: error?.stack?.slice(0, 500),
      code: error?.code,
    },
  });
}

export function logQueryError(page: string, queryKey: string, error: any): void {
  logMonitoringEvent({
    eventType: 'query_error',
    page,
    element: queryKey,
    message: error?.message || String(error),
    details: {
      stack: error?.stack?.slice(0, 500),
      code: error?.code,
    },
  });
}

export function logButtonClick(page: string, buttonName: string): void {
  logMonitoringEvent({
    eventType: 'button_click',
    page,
    element: buttonName,
    message: `Нажата кнопка: ${buttonName}`,
  });
}

export function logJsError(error: Error | string, source?: string): void {
  const msg = typeof error === 'string' ? error : error.message;
  const stack = typeof error === 'string' ? undefined : error.stack?.slice(0, 1000);
  logMonitoringEvent({
    eventType: 'js_error',
    page: window.location.pathname,
    element: source,
    message: msg,
    details: { stack },
  });
}

// Flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushQueue();
  });
}
