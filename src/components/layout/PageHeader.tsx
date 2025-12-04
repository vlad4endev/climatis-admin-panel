import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface PageHeaderProps {
  title: string;
  description?: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
}

export function PageHeader({ title, description, buttonLabel, onButtonClick }: PageHeaderProps) {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">{description}</p>
          )}
        </div>
        {buttonLabel && onButtonClick && (
          <Button onClick={onButtonClick} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            {isMobile ? buttonLabel.split(' ').slice(-1)[0] : buttonLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
