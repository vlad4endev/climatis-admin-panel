import { useCallback, useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Document, CONTRACT_TYPES, DOCUMENT_STATUSES } from "@/types/document";
import { Client } from "@/types/client";
import { ServiceObject } from "@/types/serviceObject";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { logActivity } from "@/lib/activityLogger";
import { DocumentAttachments } from "./DocumentAttachments";

interface DocumentFormProps {
  initialData?: Partial<Document>;
  onSubmit: (data: Omit<Document, 'id'>) => void;
  onCancel: () => void;
  onMinimize?: (formData: any) => void;
  clients: Client[];
  serviceObjects: ServiceObject[];
  readOnly?: boolean;
}

export function DocumentForm({ initialData, onSubmit, onCancel, onMinimize, clients, serviceObjects, readOnly = false }: DocumentFormProps) {
  const queryClient = useQueryClient();
  const [currentId, setCurrentId] = useState<string | null>(initialData?.id || null);
  const [isSaving, setIsSaving] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isCreatingRef = useRef(false);

  const { register, handleSubmit, watch, setValue, getValues } = useForm({
    defaultValues: {
      contractNumber: initialData?.contractNumber || '',
      startDate: initialData?.startDate || '',
      endDate: initialData?.endDate || '',
      contractType: initialData?.contractType || 'general',
      clientId: initialData?.clientId || '',
      objectId: initialData?.objectId || '',
      responseConditions: initialData?.responseConditions || '',
      notes: initialData?.notes || '',
      status: initialData?.status || 'draft',
    },
  });

  const selectedClientId = watch('clientId');
  const filteredObjects = serviceObjects.filter(obj => obj.clientId === selectedClientId);

  // Автосохранение: создание или обновление
  const autoSave = useCallback(async (fieldData?: Partial<Document>) => {
    if (readOnly || isCreatingRef.current) return;
    
    const formValues = getValues();
    const dataToSave = fieldData ? { ...formValues, ...fieldData } : formValues;
    
    setIsSaving(true);
    
    try {
      if (currentId) {
        // Обновляем существующий документ
        const { error } = await supabase
          .from("documents")
          .update({
            contract_number: dataToSave.contractNumber,
            start_date: dataToSave.startDate || null,
            end_date: dataToSave.endDate || null,
            contract_type: dataToSave.contractType,
            client_id: dataToSave.clientId || null,
            object_id: dataToSave.objectId || null,
            response_conditions: dataToSave.responseConditions,
            notes: dataToSave.notes,
            status: dataToSave.status,
          })
          .eq("id", currentId);
        
        if (error) throw error;
        
        // Log activity for update
        await logActivity({
          section: 'documents',
          elementId: currentId,
          elementName: dataToSave.contractNumber || 'Документ',
          action: 'update',
          changes: fieldData,
        });
      } else {
        // Создаём новый документ
        isCreatingRef.current = true;
        const { data, error } = await supabase
          .from("documents")
          .insert({
            contract_number: dataToSave.contractNumber || 'Новый договор',
            start_date: dataToSave.startDate || new Date().toISOString().split('T')[0],
            end_date: dataToSave.endDate || new Date().toISOString().split('T')[0],
            contract_type: dataToSave.contractType || 'general',
            client_id: dataToSave.clientId || clients[0]?.id || null,
            object_id: dataToSave.objectId || null,
            response_conditions: dataToSave.responseConditions || '',
            notes: dataToSave.notes || '',
            status: 'draft',
          })
          .select()
          .single();
        
        if (error) throw error;
        if (data) {
          setCurrentId(data.id);
          
          // Log activity for create
          await logActivity({
            section: 'documents',
            elementId: data.id,
            elementName: data.contract_number,
            action: 'create',
          });
        }
        isCreatingRef.current = false;
      }
      
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    } catch (error) {
      console.error("Auto-save error:", error);
      isCreatingRef.current = false;
    } finally {
      setIsSaving(false);
    }
  }, [currentId, readOnly, getValues, queryClient, clients]);

  // Debounced сохранение
  const debouncedSave = useCallback((fieldData?: Partial<Document>) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => autoSave(fieldData), 500);
  }, [autoSave]);

  // Обработчик blur для input полей
  const handleBlur = useCallback(() => {
    debouncedSave();
  }, [debouncedSave]);

  // Обработчик изменения select полей
  const handleSelectChange = useCallback((field: string, value: string) => {
    setValue(field as any, value);
    debouncedSave({ [field]: value } as Partial<Document>);
  }, [setValue, debouncedSave]);

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const onSubmitForm = (data: any) => {
    const selectedClient = clients.find(c => c.id === data.clientId);
    const selectedObject = serviceObjects.find(o => o.id === data.objectId);
    
    onSubmit({
      ...data,
      clientName: selectedClient?.companyName,
      objectName: selectedObject?.objectName,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      {isSaving && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Сохранение...
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contractNumber">Номер договора</Label>
          <Input 
            id="contractNumber" 
            {...register('contractNumber', { required: !readOnly })} 
            readOnly={readOnly}
            tabIndex={readOnly ? -1 : undefined}
            className={readOnly ? "bg-input-readonly" : ""}
            onBlur={handleBlur}
          />
        </div>
        <div>
          <Label htmlFor="status">Статус</Label>
          <Select
            value={watch('status')}
            onValueChange={(value) => handleSelectChange('status', value)}
            disabled={readOnly}
          >
            <SelectTrigger className={readOnly ? "bg-input-readonly" : ""}>
              <SelectValue placeholder="Выберите статус" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Дата начала</Label>
          <Input 
            id="startDate" 
            type="date" 
            {...register('startDate', { required: !readOnly })} 
            readOnly={readOnly}
            tabIndex={readOnly ? -1 : undefined}
            className={readOnly ? "bg-input-readonly" : ""}
            onBlur={handleBlur}
          />
        </div>
        <div>
          <Label htmlFor="endDate">Дата окончания</Label>
          <Input 
            id="endDate" 
            type="date" 
            {...register('endDate', { required: !readOnly })} 
            readOnly={readOnly}
            tabIndex={readOnly ? -1 : undefined}
            className={readOnly ? "bg-input-readonly" : ""}
            onBlur={handleBlur}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="contractType">Тип договора</Label>
        <Select
          value={watch('contractType')}
          onValueChange={(value) => handleSelectChange('contractType', value)}
          disabled={readOnly}
        >
          <SelectTrigger className={readOnly ? "bg-input-readonly" : ""}>
            <SelectValue placeholder="Выберите тип договора" />
          </SelectTrigger>
          <SelectContent>
            {CONTRACT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="clientId">Контрагент</Label>
        <Select
          value={watch('clientId')}
          onValueChange={(value) => {
            setValue('clientId', value);
            setValue('objectId', '');
            debouncedSave({ clientId: value, objectId: '' });
          }}
          disabled={readOnly}
        >
          <SelectTrigger className={readOnly ? "bg-input-readonly" : ""}>
            <SelectValue placeholder="Выберите контрагента" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.companyName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedClientId && filteredObjects.length > 0 && (
        <div>
          <Label htmlFor="objectId">Объект (необязательно)</Label>
          <Select
            value={watch('objectId') || "__none__"}
            onValueChange={(value) => handleSelectChange('objectId', value === "__none__" ? "" : value)}
            disabled={readOnly}
          >
            <SelectTrigger className={readOnly ? "bg-input-readonly" : ""}>
              <SelectValue placeholder="Выберите объект" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Не привязан к объекту</SelectItem>
              {filteredObjects.map((obj) => (
                <SelectItem key={obj.id} value={obj.id}>
                  {obj.objectName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="responseConditions">Условия реагирования</Label>
        <Textarea
          id="responseConditions"
          {...register('responseConditions')}
          placeholder="Например: выезд до 24 часов"
          readOnly={readOnly}
          tabIndex={readOnly ? -1 : undefined}
          className={readOnly ? "bg-input-readonly" : ""}
          onBlur={handleBlur}
        />
      </div>

      <div>
        <Label htmlFor="notes">Примечания</Label>
        <Textarea 
          id="notes" 
          {...register('notes')} 
          readOnly={readOnly}
          tabIndex={readOnly ? -1 : undefined}
          className={readOnly ? "bg-input-readonly" : ""}
          onBlur={handleBlur}
        />
      </div>

      {/* Прикреплённые документы - как в Расчётах */}
      <DocumentAttachments documentId={currentId || undefined} readOnly={readOnly} />

      {!readOnly && (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Закрыть
          </Button>
        </div>
      )}
    </form>
  );
}
