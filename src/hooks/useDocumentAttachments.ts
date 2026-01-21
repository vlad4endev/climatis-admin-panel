import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/lib/activityLogger";

export interface DocumentAttachment {
  id: string;
  documentId: string;
  fileName: string;
  filePath: string;
  fileSize: number | null;
  fileType: string | null;
  createdAt: string;
}

export function useDocumentAttachments(documentId: string | undefined) {
  return useQuery({
    queryKey: ["document-attachments", documentId],
    queryFn: async () => {
      if (!documentId) return [];
      
      const { data, error } = await supabase
        .from("document_attachments")
        .select("*")
        .eq("document_id", documentId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((item): DocumentAttachment => ({
        id: item.id,
        documentId: item.document_id,
        fileName: item.file_name,
        filePath: item.file_path,
        fileSize: item.file_size,
        fileType: item.file_type,
        createdAt: item.created_at,
      }));
    },
    enabled: !!documentId,
  });
}

export function useUploadDocumentAttachment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentId, file }: { documentId: string; file: File }) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${documentId}/${Date.now()}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from("document-files")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Save metadata to database
      const { error: dbError } = await supabase
        .from("document_attachments")
        .insert({
          document_id: documentId,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          file_type: file.type,
        });

      if (dbError) throw dbError;
      
      // Get document name for logging
      const { data: doc } = await supabase
        .from("documents")
        .select("contract_number")
        .eq("id", documentId)
        .single();
      
      // Log activity
      await logActivity({
        section: 'documents',
        elementId: documentId,
        elementName: doc?.contract_number || 'Документ',
        action: 'update',
        changes: { addedFile: file.name },
      });
    },
    onSuccess: (_, { documentId }) => {
      queryClient.invalidateQueries({ queryKey: ["document-attachments", documentId] });
      queryClient.invalidateQueries({ queryKey: ["document-attachment-counts"] });
      toast({ title: "Файл загружен" });
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить файл",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteDocumentAttachment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, filePath, documentId, fileName }: { id: string; filePath: string; documentId: string; fileName?: string }) => {
      // Get document name for logging
      const { data: doc } = await supabase
        .from("documents")
        .select("contract_number")
        .eq("id", documentId)
        .single();
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("document-files")
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("document_attachments")
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;
      
      // Log activity
      await logActivity({
        section: 'documents',
        elementId: documentId,
        elementName: doc?.contract_number || 'Документ',
        action: 'update',
        changes: { removedFile: fileName || filePath },
      });

      return documentId;
    },
    onSuccess: (documentId) => {
      queryClient.invalidateQueries({ queryKey: ["document-attachments", documentId] });
      queryClient.invalidateQueries({ queryKey: ["document-attachment-counts"] });
      toast({ title: "Файл удалён" });
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast({
        title: "Ошибка удаления",
        description: "Не удалось удалить файл",
        variant: "destructive",
      });
    },
  });
}

export function getDocumentAttachmentUrl(filePath: string): string {
  const { data } = supabase.storage
    .from("document-files")
    .getPublicUrl(filePath);
  return data.publicUrl;
}

export async function downloadDocumentAttachment(filePath: string, fileName: string): Promise<void> {
  const { data, error } = await supabase.storage
    .from("document-files")
    .download(filePath);

  if (error) throw error;

  // Create blob URL and trigger download
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
