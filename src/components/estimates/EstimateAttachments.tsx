import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, Upload, Trash2, FileText, FileSpreadsheet, File, Loader2 } from "lucide-react";
import {
  useEstimateAttachments,
  useUploadEstimateAttachment,
  useDeleteEstimateAttachment,
  getAttachmentUrl,
} from "@/hooks/useEstimateAttachments";

interface EstimateAttachmentsProps {
  estimateId: string | undefined;
  readOnly?: boolean;
}

function getFileIcon(fileType: string | null) {
  if (!fileType) return File;
  if (fileType.includes("pdf")) return FileText;
  if (fileType.includes("spreadsheet") || fileType.includes("excel") || fileType.includes("csv")) return FileSpreadsheet;
  if (fileType.includes("word") || fileType.includes("document")) return FileText;
  return File;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

export function EstimateAttachments({ estimateId, readOnly = false }: EstimateAttachmentsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: attachments = [], isLoading } = useEstimateAttachments(estimateId);
  const uploadMutation = useUploadEstimateAttachment();
  const deleteMutation = useDeleteEstimateAttachment();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !estimateId) return;

    Array.from(files).forEach((file) => {
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/csv",
      ];
      
      if (!allowedTypes.includes(file.type)) {
        return;
      }

      uploadMutation.mutate({ estimateId, file });
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = (id: string, filePath: string) => {
    if (!estimateId) return;
    deleteMutation.mutate({ id, filePath, estimateId });
  };

  if (!estimateId) {
    return (
      <div className="bg-form-section p-4 rounded-lg">
        <h3 className="font-semibold text-form-label flex items-center gap-2 mb-3">
          <Paperclip className="h-4 w-4" />
          Прикреплённые документы
        </h3>
        <p className="text-sm text-muted-foreground">
          Сначала сохраните расчёт, чтобы прикрепить документы
        </p>
      </div>
    );
  }

  return (
    <div className="bg-form-section p-4 rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-form-label flex items-center gap-2">
          <Paperclip className="h-4 w-4" />
          Прикреплённые документы
        </h3>
        {!readOnly && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="gap-2"
            >
              {uploadMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Загрузить
            </Button>
          </>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          Нет прикреплённых документов
        </p>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => {
            const Icon = getFileIcon(attachment.fileType);
            const url = getAttachmentUrl(attachment.filePath);
            
            return (
              <div
                key={attachment.id}
                className="flex items-center gap-3 p-2 rounded-md bg-background/50 hover:bg-background/80 transition-colors"
              >
                <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:underline truncate block"
                  >
                    {attachment.fileName}
                  </a>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.fileSize)}
                    {attachment.createdAt && ` • ${new Date(attachment.createdAt).toLocaleDateString("ru-RU")}`}
                  </span>
                </div>
                {!readOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(attachment.id, attachment.filePath)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Допустимые форматы: PDF, Word (DOC, DOCX), Excel (XLS, XLSX, CSV)
      </p>
    </div>
  );
}
