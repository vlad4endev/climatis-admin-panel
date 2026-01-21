import { useCallback, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdateRef = useRef<Partial<T> | null>(null);

  const setCurrentId = useCallback((id: string | null) => {
    currentIdRef.current = id;
  }, []);

  const setFormData = useCallback((data: Partial<T>) => {
    formDataRef.current = data;
  }, []);

  const performSave = useCallback(async () => {
    if (isSavingRef.current) {
      return;
    }

    const dataToSave = { ...formDataRef.current, ...pendingUpdateRef.current };
    pendingUpdateRef.current = null;

    if (Object.keys(dataToSave).length === 0) return;

    isSavingRef.current = true;

    try {
      if (currentIdRef.current) {
        // Обновляем существующую запись
        await updateFn(currentIdRef.current, dataToSave);
      } else {
        // Создаём новую запись
        const result = await createFn(dataToSave as T);
        if (result?.id) {
          currentIdRef.current = result.id;
        }
      }

      queryClient.invalidateQueries({ queryKey });
      
      if (showToast) {
        toast.success("Сохранено", { duration: 1500 });
      }
    } catch (error) {
      console.error("Auto-save error:", error);
      toast.error("Ошибка автосохранения");
    } finally {
      isSavingRef.current = false;
      
      // Если есть отложенные изменения, сохраняем их
      if (pendingUpdateRef.current) {
        performSave();
      }
    }
  }, [createFn, updateFn, queryClient, queryKey, showToast]);

  const handleFieldChange = useCallback((field: keyof T, value: any) => {
    // Обновляем локальные данные
    formDataRef.current = {
      ...formDataRef.current,
      [field]: value,
    };

    // Добавляем в очередь на сохранение
    pendingUpdateRef.current = {
      ...pendingUpdateRef.current,
      [field]: value,
    };

    // Отменяем предыдущий таймер
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Устанавливаем новый таймер
    debounceTimerRef.current = setTimeout(performSave, debounceMs);
  }, [performSave, debounceMs]);

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        // Сохраняем перед размонтированием если есть несохранённые изменения
        if (pendingUpdateRef.current && currentIdRef.current) {
          performSave();
        }
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
