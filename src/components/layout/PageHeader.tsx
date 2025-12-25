import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
}

export function PageHeader({ title, description, buttonLabel, onButtonClick }: PageHeaderProps) {

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-wrap items-start sm:items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold truncate">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1 text-sm sm:text-base hidden sm:block">{description}</p>
          )}
        </div>
        {buttonLabel && onButtonClick && (
          <Button onClick={onButtonClick} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{buttonLabel}</span>
            <span className="sm:hidden">{buttonLabel.split(' ').slice(-1)[0]}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
