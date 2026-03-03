import { useNavigate, useLocation } from "react-router-dom";
import { useMinimizedForms } from "@/hooks/useMinimizedForms";
import { Button } from "@/components/ui/button";
import { Maximize2, X, FileText, Calculator, ClipboardList } from "lucide-react";

const ICONS: Record<string, React.ElementType> = {
  document: FileText,
  estimate: Calculator,
  request: ClipboardList,
};

export function MinimizedFormsBars() {
  const { forms, restore, close } = useMinimizedForms();
  const navigate = useNavigate();
  const location = useLocation();

  if (forms.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center">
      {forms.map((form) => {
        const Icon = ICONS[form.type] || FileText;
        const isOnPage = location.pathname === form.route;

        return (
          <div
            key={form.id}
            className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 shadow-lg animate-in slide-in-from-bottom-4 duration-300"
          >
            <Icon className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-medium truncate max-w-[240px]">
              {form.title}
            </span>
            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  restore(form.id);
                  if (!isOnPage) {
                    navigate(form.route, { state: { restoreForm: form } });
                  }
                }}
                title="Развернуть"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => close(form.id)}
                title="Закрыть"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
