import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface EstimateAttachment {
  id: string;
  estimateId: string;
  fileName: string;
  filePath: string;
  fileSize: number | null;
  fileType: string | null;
  createdAt: string;
}

export function useEstimateAttachments(estimateId: string | undefined) {
  return useQuery({
    queryKey: ["estimate-attachments", estimateId],
    queryFn: async () => {
      if (!estimateId) return [];
      
      const { data, error } = await supabase
        .from("estimate_attachments")
        .select("*")
        .eq("estimate_id", estimateId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((item): EstimateAttachment => ({
        id: item.id,
        estimateId: item.estimate_id,
        fileName: item.file_name,
        filePath: item.file_path,
        fileSize: item.file_size,
        fileType: item.file_type,
        createdAt: item.created_at,
      }));
    },
    enabled: !!estimateId,
  });
}

export function useUploadEstimateAttachment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ estimateId, file }: { estimateId: string; file: File }) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${estimateId}/${Date.now()}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from("estimate-attachments")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Save metadata to database
      const { error: dbError } = await supabase
        .from("estimate_attachments")
        .insert({
          estimate_id: estimateId,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          file_type: file.type,
        });

      if (dbError) throw dbError;
    },
    onSuccess: (_, { estimateId }) => {
      queryClient.invalidateQueries({ queryKey: ["estimate-attachments", estimateId] });
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

export function useDeleteEstimateAttachment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, filePath, estimateId }: { id: string; filePath: string; estimateId: string }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("estimate-attachments")
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("estimate_attachments")
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;

      return estimateId;
    },
    onSuccess: (estimateId) => {
      queryClient.invalidateQueries({ queryKey: ["estimate-attachments", estimateId] });
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

export function getAttachmentUrl(filePath: string): string {
  const { data } = supabase.storage
    .from("estimate-attachments")
    .getPublicUrl(filePath);
  return data.publicUrl;
}
