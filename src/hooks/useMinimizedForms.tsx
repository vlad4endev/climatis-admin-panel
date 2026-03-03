import React, { createContext, useContext, useState, useCallback, useRef } from "react";

export interface MinimizedForm {
  id: string;
  type: "document" | "estimate" | "request";
  title: string;
  entityId?: string;
  route: string;
}

interface MinimizedFormsContextValue {
  forms: MinimizedForm[];
  minimize: (form: MinimizedForm) => void;
  restore: (id: string) => MinimizedForm | undefined;
  close: (id: string) => void;
  registerRestoreHandler: (type: string, handler: (formId: string) => void) => void;
  unregisterRestoreHandler: (type: string) => void;
  handleRestore: (form: MinimizedForm) => void;
}

const MinimizedFormsContext = createContext<MinimizedFormsContextValue>({
  forms: [],
  minimize: () => {},
  restore: () => undefined,
  close: () => {},
  registerRestoreHandler: () => {},
  unregisterRestoreHandler: () => {},
  handleRestore: () => {},
});

export function MinimizedFormsProvider({ children }: { children: React.ReactNode }) {
  const [forms, setForms] = useState<MinimizedForm[]>([]);
  const restoreHandlers = useRef<Record<string, (formId: string) => void>>({});

  const minimize = useCallback((form: MinimizedForm) => {
    setForms(prev => {
      const filtered = prev.filter(f => f.id !== form.id);
      return [...filtered, form];
    });
  }, []);

  const restore = useCallback((id: string) => {
    let found: MinimizedForm | undefined;
    setForms(prev => {
      found = prev.find(f => f.id === id);
      return prev.filter(f => f.id !== id);
    });
    return found;
  }, []);

  const close = useCallback((id: string) => {
    setForms(prev => prev.filter(f => f.id !== id));
  }, []);

  const registerRestoreHandler = useCallback((type: string, handler: (formId: string) => void) => {
    restoreHandlers.current[type] = handler;
  }, []);

  const unregisterRestoreHandler = useCallback((type: string) => {
    delete restoreHandlers.current[type];
  }, []);

  const handleRestore = useCallback((form: MinimizedForm) => {
    const handler = restoreHandlers.current[form.type];
    if (handler) {
      handler(form.id);
    }
  }, []);

  return (
    <MinimizedFormsContext.Provider value={{ forms, minimize, restore, close, registerRestoreHandler, unregisterRestoreHandler, handleRestore }}>
      {children}
    </MinimizedFormsContext.Provider>
  );
}

export function useMinimizedForms() {
  return useContext(MinimizedFormsContext);
}
