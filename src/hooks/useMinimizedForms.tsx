import React, { createContext, useContext, useState, useCallback } from "react";

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
}

const MinimizedFormsContext = createContext<MinimizedFormsContextValue>({
  forms: [],
  minimize: () => {},
  restore: () => undefined,
  close: () => {},
});

export function MinimizedFormsProvider({ children }: { children: React.ReactNode }) {
  const [forms, setForms] = useState<MinimizedForm[]>([]);

  const minimize = useCallback((form: MinimizedForm) => {
    setForms(prev => {
      // Replace if same type already minimized
      const filtered = prev.filter(f => f.id !== form.id);
      return [...filtered, form];
    });
  }, []);

  const restore = useCallback((id: string) => {
    const form = forms.find(f => f.id === id);
    setForms(prev => prev.filter(f => f.id !== id));
    return form;
  }, [forms]);

  const close = useCallback((id: string) => {
    setForms(prev => prev.filter(f => f.id !== id));
  }, []);

  return (
    <MinimizedFormsContext.Provider value={{ forms, minimize, restore, close }}>
      {children}
    </MinimizedFormsContext.Provider>
  );
}

export function useMinimizedForms() {
  return useContext(MinimizedFormsContext);
}
