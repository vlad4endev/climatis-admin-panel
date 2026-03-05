import { useState, useRef, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Request, REQUEST_STATUSES, REQUEST_TYPES, REQUEST_PRIORITIES } from "@/types/request";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Calculator } from "lucide-react";
import { logButtonClick } from "@/lib/monitoringLogger";

interface RequestFormProps {
  initialData?: Request;
  onSubmit: (data: Partial<Request>) => Promise<void>;
  onCancel: () => void;
  onGoToEstimate?: (requestId: string) => void;
  onMinimize?: (formData: any) => void;
  clients: { id: string; companyName: string }[];
  serviceObjects: { id: string; objectName: string; clientId?: string }[];
  documents: { id: string; contractNumber: string; clientId?: string; responseConditions?: string }[];
  employees: { id: string; fullName: string }[];
  teams: { id: string; teamName: string }[];
}

export function RequestForm({ 
  initialData, 
  onSubmit, 
  onCancel,
  onGoToEstimate,
  onMinimize,
  clients,
  serviceObjects,
  documents,
  employees,
  teams
}: RequestFormProps) {
  const queryClient = useQueryClient();
  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(initialData?.id || null);
  const [isSaving, setIsSaving] = useState(false);
  const clientInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isCreatingRef = useRef(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const manualSavedRef = useRef(false);
  const isDirtyRef = useRef(false);

  const { register, handleSubmit, setValue, watch, getValues } = useForm({
    defaultValues: initialData || {
      status: 'draft',
      type: 'repair',
      priority: 'normal',
    },
  });

  // Continuously sync form data for minimize capture
  const allValues = watch();
  useEffect(() => {
    if (onMinimize) {
      onMinimize(allValues);
    }
  });

  const selectedClientId = watch("clientId");
  const selectedObjectId = watch("objectId");
  const selectedContractId = watch("contractId");
  const selectedStatus = watch("status");
  const selectedType = watch("type");
  const selectedPriority = watch("priority");
  const selectedManagerId = watch("responsibleManagerId");
  const selectedTeamId = watch("assignedTeamId");
  const selectedEngineerId = watch("assignedEngineerId");

  // Filter clients by search query
  const filteredClients = clients.filter((client) =>
    client.companyName.toLowerCase().includes(clientSearch.toLowerCase())
  );

  // Get selected client name
  const selectedClient = clients.find((client) => client.id === selectedClientId);

  // Auto-save function
  const autoSave = useCallback(async (fieldData?: Partial<Request>) => {
    if (isCreatingRef.current) return;
    
    const formValues = getValues();
    const dataToSave = fieldData ? { ...formValues, ...fieldData } : formValues;
    
    // Validate required fields before creating
    if (!currentId && (!dataToSave.clientId || !dataToSave.objectId)) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      if (currentId) {
        // Update existing request
        const { error } = await supabase
          .from("requests")
          .update({
            status: dataToSave.status,
            type: dataToSave.type,
            priority: dataToSave.priority,
            client_id: dataToSave.clientId,
            object_id: dataToSave.objectId,
            contract_id: dataToSave.contractId || null,
            contract_conditions: dataToSave.contractConditions || null,
            problem_description: dataToSave.problemDescription || '',
            comments: dataToSave.comments || '',
            desired_date: dataToSave.desiredDate || null,
            planned_visit_date: dataToSave.plannedVisitDate || null,
            responsible_manager_id: dataToSave.responsibleManagerId || null,
            assigned_team_id: dataToSave.assignedTeamId || null,
            assigned_engineer_id: dataToSave.assignedEngineerId || null,
            actual_start_time: dataToSave.actualStartTime || null,
            actual_end_time: dataToSave.actualEndTime || null,
            hours_spent: dataToSave.hoursSpent || null,
          })
          .eq("id", currentId);
        
        if (error) throw error;
      } else {
        // Create new request
        isCreatingRef.current = true;
        const { data, error } = await supabase
          .from("requests")
          .insert({
            status: dataToSave.status || 'draft',
            type: dataToSave.type || 'repair',
            priority: dataToSave.priority || 'normal',
            client_id: dataToSave.clientId,
            object_id: dataToSave.objectId,
            contract_id: dataToSave.contractId || null,
            contract_conditions: dataToSave.contractConditions || null,
            problem_description: dataToSave.problemDescription || '',
            comments: dataToSave.comments || '',
            desired_date: dataToSave.desiredDate || null,
            planned_visit_date: dataToSave.plannedVisitDate || null,
            responsible_manager_id: dataToSave.responsibleManagerId || null,
            assigned_team_id: dataToSave.assignedTeamId || null,
            assigned_engineer_id: dataToSave.assignedEngineerId || null,
          } as any)
          .select()
          .single();
        
        if (error) throw error;
        if (data) {
          setCurrentId(data.id);
        }
        isCreatingRef.current = false;
      }
      
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    } catch (error) {
      console.error("Auto-save error:", error);
      isCreatingRef.current = false;
    } finally {
      setIsSaving(false);
    }
  }, [currentId, getValues, queryClient]);

  // Start 2-minute auto-save timer on first field change (new records only)
  const startAutoSaveTimer = useCallback(() => {
    if (isDirtyRef.current || initialData?.id) return; // Already started or editing existing
    isDirtyRef.current = true;
    autoSaveTimerRef.current = setTimeout(() => {
      if (!manualSavedRef.current && !currentId) {
        autoSave();
        toast.info("Заявка автоматически сохранена как черновик", { duration: 3000 });
      }
    }, 2 * 60 * 1000); // 2 minutes
  }, [autoSave, currentId, initialData?.id]);

  // Handle select change - track dirty state
  const handleSelectChange = useCallback((field: string, value: string, additionalFields?: Record<string, any>) => {
    setValue(field as any, value);
    if (additionalFields) {
      Object.entries(additionalFields).forEach(([key, val]) => {
        setValue(key as any, val);
      });
    }
    startAutoSaveTimer();
  }, [setValue, startAutoSaveTimer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !clientInputRef.current?.contains(event.target as Node)
      ) {
        setShowClientDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize search with selected client name
  useEffect(() => {
    if (selectedClient && !showClientDropdown) {
      setClientSearch(selectedClient.companyName);
    }
  }, [selectedClient, showClientDropdown]);

  // Clear object and contract when client changes
  const [prevClientId, setPrevClientId] = useState(selectedClientId);
  useEffect(() => {
    if (selectedClientId !== prevClientId) {
      setPrevClientId(selectedClientId);
      if (prevClientId) {
        setValue("objectId", "");
        setValue("objectName", "");
        setValue("contractId", "");
        setValue("contractNumber", "");
        setValue("contractConditions", "");
      }
    }
  }, [selectedClientId, prevClientId, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {isSaving && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Сохранение...
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="status">Статус *</Label>
          <Select value={selectedStatus} onValueChange={(value) => handleSelectChange("status", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите статус" />
            </SelectTrigger>
            <SelectContent>
              {REQUEST_STATUSES.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="type">Тип заявки *</Label>
          <Select value={selectedType} onValueChange={(value) => handleSelectChange("type", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите тип" />
            </SelectTrigger>
            <SelectContent>
              {REQUEST_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="priority">Срочность *</Label>
          <Select value={selectedPriority} onValueChange={(value) => handleSelectChange("priority", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите срочность" />
            </SelectTrigger>
            <SelectContent>
              {REQUEST_PRIORITIES.map(priority => (
                <SelectItem key={priority.value} value={priority.value}>
                  {priority.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="relative">
          <Label htmlFor="clientSearch">Контрагент *</Label>
          <Input
            ref={clientInputRef}
            id="clientSearch"
            type="text"
            value={clientSearch}
            onChange={(e) => {
              setClientSearch(e.target.value);
              setShowClientDropdown(true);
            }}
            onFocus={() => setShowClientDropdown(true)}
            placeholder="Начните вводить название контрагента..."
            autoComplete="off"
          />
          {showClientDropdown && filteredClients.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto"
            >
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={() => {
                    setValue("clientId", client.id);
                    setValue("clientName", client.companyName);
                    setClientSearch(client.companyName);
                    setShowClientDropdown(false);
                    startAutoSaveTimer();
                  }}
                >
                  {client.companyName}
                </div>
              ))}
            </div>
          )}
          {showClientDropdown && clientSearch && filteredClients.length === 0 && (
            <div
              ref={dropdownRef}
              className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md px-3 py-2 text-muted-foreground text-sm"
            >
              Контрагент не найден
            </div>
          )}
        </div>
        <div>
          <Label htmlFor="objectId">Объект *</Label>
          <Select 
            value={selectedObjectId} 
            onValueChange={(value) => {
              const obj = serviceObjects.find(o => o.id === value);
              handleSelectChange("objectId", value, { objectName: obj?.objectName || "" });
            }}
            disabled={!selectedClientId}
          >
            <SelectTrigger>
              <SelectValue placeholder={selectedClientId ? "Выберите объект" : "Сначала выберите контрагента"} />
            </SelectTrigger>
            <SelectContent>
              {serviceObjects
                .filter(obj => obj.clientId === selectedClientId)
                .map(obj => (
                  <SelectItem key={obj.id} value={obj.id}>
                    {obj.objectName}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="contractId">Договор (опционально)</Label>
        <Select 
          value={selectedContractId} 
          onValueChange={(value) => {
            const contract = documents.find(d => d.id === value);
            handleSelectChange("contractId", value, {
              contractNumber: contract?.contractNumber || "",
              contractConditions: contract?.responseConditions || "",
            });
          }}
          disabled={!selectedClientId}
        >
          <SelectTrigger>
            <SelectValue placeholder={selectedClientId ? "Выберите договор" : "Сначала выберите контрагента"} />
          </SelectTrigger>
          <SelectContent>
            {documents
              .filter(doc => doc.clientId === selectedClientId)
              .map(doc => (
                <SelectItem key={doc.id} value={doc.id}>
                  {doc.contractNumber}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {selectedContractId && (
        <div>
          <Label htmlFor="contractConditions">Условия по договору</Label>
          <Textarea 
            id="contractConditions" 
            {...register("contractConditions")} 
            rows={2} 
            readOnly 
            className="bg-muted/50 cursor-default"
          />
        </div>
      )}

      <div>
        <Label htmlFor="problemDescription">Описание проблемы *</Label>
        <Textarea 
          id="problemDescription" 
          {...register("problemDescription", { required: true })} 
          rows={3} 
          onBlur={() => startAutoSaveTimer()}
        />
      </div>

      <div>
        <Label htmlFor="comments">Комментарии</Label>
        <Textarea 
          id="comments" 
          {...register("comments")} 
          rows={2} 
          onBlur={() => startAutoSaveTimer()}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="desiredDate">Желаемая дата выполнения</Label>
          <Input type="date" id="desiredDate" {...register("desiredDate")} onBlur={() => startAutoSaveTimer()} />
        </div>
        <div>
          <Label htmlFor="plannedVisitDate">Плановая дата выезда</Label>
          <Input type="datetime-local" id="plannedVisitDate" {...register("plannedVisitDate")} onBlur={() => startAutoSaveTimer()} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="responsibleManagerId">Ответственный менеджер</Label>
          <Select value={selectedManagerId} onValueChange={(value) => {
            const manager = employees.find(e => e.id === value);
            handleSelectChange("responsibleManagerId", value, { responsibleManagerName: manager?.fullName || "" });
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите менеджера" />
            </SelectTrigger>
            <SelectContent>
              {employees.map(emp => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="assignedTeamId">Назначенная бригада</Label>
          <Select value={selectedTeamId} onValueChange={(value) => {
            const team = teams.find(t => t.id === value);
            handleSelectChange("assignedTeamId", value, { assignedTeamName: team?.teamName || "" });
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите бригаду" />
            </SelectTrigger>
            <SelectContent>
              {teams.map(team => (
                <SelectItem key={team.id} value={team.id}>
                  {team.teamName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="assignedEngineerId">Назначенный инженер</Label>
          <Select value={selectedEngineerId} onValueChange={(value) => {
            const engineer = employees.find(e => e.id === value);
            handleSelectChange("assignedEngineerId", value, { assignedEngineerName: engineer?.fullName || "" });
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите инженера" />
            </SelectTrigger>
            <SelectContent>
              {employees.map(emp => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="actualStartTime">Фактическое начало работ</Label>
          <Input type="datetime-local" id="actualStartTime" {...register("actualStartTime")} onBlur={() => startAutoSaveTimer()} />
        </div>
        <div>
          <Label htmlFor="actualEndTime">Фактическое окончание работ</Label>
          <Input type="datetime-local" id="actualEndTime" {...register("actualEndTime")} onBlur={() => startAutoSaveTimer()} />
        </div>
        <div>
          <Label htmlFor="hoursSpent">Количество часов</Label>
          <Input type="number" step="0.5" id="hoursSpent" {...register("hoursSpent")} onBlur={() => startAutoSaveTimer()} />
        </div>
      </div>

      <div className="flex justify-between gap-2 pt-4 border-t">
        <div>
          {onGoToEstimate && currentId && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                logButtonClick("requests", "Перейти к расчёту");
                onGoToEstimate(currentId);
              }}
            >
              <Calculator className="h-4 w-4 mr-2" />
              Перейти к расчёту
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button
            type="button"
            onClick={async () => {
              logButtonClick("requests", "Сохранить заявку");
              manualSavedRef.current = true;
              if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
              }
              const formValues = getValues();
              if (!formValues.clientId || !formValues.objectId) {
                toast.error("Заполните обязательные поля: Контрагент и Объект");
                return;
              }
              setIsSaving(true);
              try {
                // If auto-save already created a draft, treat as update
                const dataToSubmit: Partial<Request> = {
                  ...formValues,
                  ...(currentId ? { id: currentId } : {}),
                };
                await onSubmit(dataToSubmit);
              } catch (error) {
                console.error("Save error:", error);
              } finally {
                setIsSaving(false);
              }
            }}
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isSaving ? "Сохранение..." : "Сохранить"}
          </Button>
        </div>
      </div>
    </form>
  );
}
