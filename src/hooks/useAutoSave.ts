import { useCallback, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const MAX_RETRIES = 5;
const BASE_RETRY_DELAY = 2000;

interface AutoSaveOptions<T> {
  /** Ключ запроса для инвалидации */
  queryKey: string[];
  /** Функция создания новой записи */
  createFn: (data: T) => Promise<{ id: string } | null>;
  /** Функция обновления записи */
  updateFn: (id: string, data: Partial<T>) => Promise<void>;
  /** Задержка перед сохранением (мс) */
  debounceMs?: number;
  /** Показывать тост при сохранении */
  showToast?: boolean;
}

interface AutoSaveReturn<T> {
  /** Вызывается при изменении поля */
  handleFieldChange: (field: keyof T, value: any) => void;
  /** Текущий ID записи (null если ещё не создана) */
  currentId: string | null;
  /** Устанавливает ID существующей записи */
  setCurrentId: (id: string | null) => void;
  /** Состояние сохранения */
  isSaving: boolean;
  /** Текущие данные формы */
  formData: Partial<T>;
  /** Обновляет данные формы */
  setFormData: (data: Partial<T>) => void;
}

export function useAutoSave<T extends Record<string, any>>({
  queryKey,
  createFn,
  updateFn,
  debounceMs = 500,
  showToast = false,
}: AutoSaveOptions<T>): AutoSaveReturn<T> {
  const queryClient = useQueryClient();
  const currentIdRef = useRef<string | null>(null);
  const formDataRef = useRef<Partial<T>>({});
  const isSavingRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingUpdateRef = useRef<Partial<T> | null>(null);
  const retryCountRef = useRef(0);
  const unmountedRef = useRef(false);
  const onlineListenerRef = useRef<(() => void) | null>(null);

  const setCurrentId = useCallback((id: string | null) => {
    currentIdRef.current = id;
  }, []);

  const setFormData = useCallback((data: Partial<T>) => {
    formDataRef.current = data;
  }, []);

  // force = true используется при размонтировании: нужно дослать последние
  // изменения, которые ещё лежат в debounce-очереди.
  const performSave = useCallback(async (options?: { force?: boolean }) => {
    const force = options?.force === true;

    if (isSavingRef.current || (unmountedRef.current && !force)) {
      return;
    }

    // Проверяем наличие сети перед отправкой
    if (!navigator.onLine) {
      // Откладываем повторную попытку до восстановления сети.
      // Слушатель регистрируем только один — иначе каждая неудачная попытка
      // добавляла новый и они никогда не снимались.
      if (!onlineListenerRef.current) {
        const onOnline = () => {
          window.removeEventListener("online", onOnline);
          onlineListenerRef.current = null;
          if (!unmountedRef.current) {
            performSave();
          }
        };
        onlineListenerRef.current = onOnline;
        window.addEventListener("online", onOnline);
      }
      return;
    }

    const dataToSave = { ...formDataRef.current, ...pendingUpdateRef.current };
    const savedPending = { ...pendingUpdateRef.current };
    pendingUpdateRef.current = null;

    if (Object.keys(dataToSave).length === 0) return;

    isSavingRef.current = true;

    try {
      if (currentIdRef.current) {
        await updateFn(currentIdRef.current, dataToSave);
      } else {
        const result = await createFn(dataToSave as T);
        if (result?.id) {
          currentIdRef.current = result.id;
        }
      }

      // Успех — сбрасываем счётчик повторов
      retryCountRef.current = 0;
      queryClient.invalidateQueries({ queryKey });

      if (showToast) {
        toast.success("Сохранено", { duration: 1500 });
      }
    } catch (error) {
      console.error("Auto-save error:", error);

      // Возвращаем данные в очередь чтобы не потерять
      pendingUpdateRef.current = {
        ...savedPending,
        ...pendingUpdateRef.current,
      };

      retryCountRef.current += 1;

      if (unmountedRef.current) {
        // Форма уже закрыта: повторять некому, сообщаем один раз.
        toast.error("Не удалось сохранить последние изменения.", { duration: 6000 });
      } else if (retryCountRef.current <= MAX_RETRIES) {
        const delay = Math.min(BASE_RETRY_DELAY * 2 ** (retryCountRef.current - 1), 30000);
        toast.error(`Ошибка сохранения. Повтор через ${Math.round(delay / 1000)} сек...`, {
          duration: delay,
        });

        retryTimerRef.current = setTimeout(() => {
          if (!unmountedRef.current) {
            performSave();
          }
        }, delay);
      } else {
        toast.error("Не удалось сохранить данные. Проверьте подключение к интернету.", {
          duration: 10000,
        });
      }
    } finally {
      isSavingRef.current = false;

      // Если есть новые отложенные изменения (пользователь продолжал вводить), сохраняем
      if (pendingUpdateRef.current && retryCountRef.current === 0) {
        performSave();
      }
    }
  }, [createFn, updateFn, queryClient, queryKey, showToast]);

  const handleFieldChange = useCallback((field: keyof T, value: any) => {
    formDataRef.current = {
      ...formDataRef.current,
      [field]: value,
    };

    pendingUpdateRef.current = {
      ...pendingUpdateRef.current,
      [field]: value,
    };

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(performSave, debounceMs);
  }, [performSave, debounceMs]);

  // Очистка при размонтировании
  useEffect(() => {
    unmountedRef.current = false;

    return () => {
      unmountedRef.current = true;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
      if (onlineListenerRef.current) {
        window.removeEventListener("online", onlineListenerRef.current);
        onlineListenerRef.current = null;
      }
      // Последняя попытка сохранить при уходе со страницы.
      // Нужен force: обычный вызов сразу выходил из-за unmountedRef, поэтому
      // изменения последних debounceMs миллисекунд молча терялись.
      // Новую запись здесь намеренно не создаём (нужен уже существующий id) —
      // иначе закрытие пустой формы плодило бы черновики.
      if (pendingUpdateRef.current && currentIdRef.current && navigator.onLine) {
        performSave({ force: true });
      }
    };
  }, [performSave]);

  return {
    handleFieldChange,
    currentId: currentIdRef.current,
    setCurrentId,
    isSaving: isSavingRef.current,
    formData: formDataRef.current,
    setFormData,
  };
}
