import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, Download, FileText, FileSpreadsheet, File, Loader2 } from "lucide-react";
import { useDocumentAttachments, downloadDocumentAttachment } from "@/hooks/useDocumentAttachments";
import { useToast } from "@/hooks/use-toast";

interface DocumentAttachmentsCompactProps {
  documentId: string;
}

function getFileIcon(fileType: string | null) {
  if (!fileType) return File;
  if (fileType.includes("pdf")) return FileText;
  if (fileType.includes("spreadsheet") || fileType.includes("excel") || fileType.includes("csv")) return FileSpreadsheet;
  if (fileType.includes("word") || fileType.includes("document")) return FileText;
  return File;
}

export function DocumentAttachmentsCompact({ documentId }: DocumentAttachmentsCompactProps) {
  const { toast } = useToast();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { data: attachments = [], isLoading } = useDocumentAttachments(documentId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-xs">Загрузка...</span>
      </div>
    );
  }

  if (attachments.length === 0) {
    return null;
  }

  const handleDownload = async (filePath: string, fileName: string, id: string) => {
    setDownloadingId(id);
    try {
      await downloadDocumentAttachment(filePath, fileName);
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Ошибка скачивания",
        description: "Не удалось скачать файл",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t space-y-1.5">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
        <Paperclip className="h-3 w-3" />
        <span>Файлы ({attachments.length})</span>
      </div>
      {attachments.map((attachment) => {
        const Icon = getFileIcon(attachment.fileType);
        return (
          <div
            key={attachment.id}
            className="flex items-center gap-2 text-xs bg-muted/50 rounded px-2 py-1"
          >
            <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="flex-1 truncate">{attachment.fileName}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(attachment.filePath, attachment.fileName, attachment.id);
              }}
              disabled={downloadingId === attachment.id}
            >
              {downloadingId === attachment.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
