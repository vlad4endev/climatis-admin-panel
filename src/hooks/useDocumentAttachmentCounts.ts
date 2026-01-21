import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DocumentAttachmentCount {
  documentId: string;
  count: number;
}

export function useDocumentAttachmentCounts(documentIds: string[]) {
  return useQuery({
    queryKey: ["document-attachment-counts", documentIds],
    queryFn: async () => {
      if (documentIds.length === 0) return {};
      
      const { data, error } = await supabase
        .from("document_attachments")
        .select("document_id")
        .in("document_id", documentIds);

      if (error) throw error;

      // Count attachments per document
      const counts: Record<string, number> = {};
      data.forEach(item => {
        counts[item.document_id] = (counts[item.document_id] || 0) + 1;
      });
      
      return counts;
    },
    enabled: documentIds.length > 0,
  });
}
