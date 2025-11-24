import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Request, REQUEST_STATUSES, REQUEST_TYPES, REQUEST_PRIORITIES } from "@/types/request";

interface RequestFormProps {
  initialData?: Request;
  onSubmit: (data: Partial<Request>) => void;
  onCancel: () => void;
  clients: { id: string; companyName: string }[];
  serviceObjects: { id: string; objectName: string }[];
  documents: { id: string; contractNumber: string }[];
  employees: { id: string; fullName: string }[];
  teams: { id: string; teamName: string }[];
}

export function RequestForm({ 
  initialData, 
  onSubmit, 
  onCancel,
  clients,
  serviceObjects,
  documents,
  employees,
  teams
}: RequestFormProps) {
  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const clientInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: initialData || {},
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="requestNumber">Номер заявки *</Label>
          <Input id="requestNumber" {...register("requestNumber", { required: true })} />
        </div>
        <div>
          <Label htmlFor="status">Статус *</Label>
          <Select value={selectedStatus} onValueChange={(value) => setValue("status", value as any)}>
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Тип заявки *</Label>
          <Select value={selectedType} onValueChange={(value) => setValue("type", value as any)}>
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
          <Select value={selectedPriority} onValueChange={(value) => setValue("priority", value as any)}>
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
          <Select value={selectedObjectId} onValueChange={(value) => {
            const obj = serviceObjects.find(o => o.id === value);
            setValue("objectId", value);
            setValue("objectName", obj?.objectName || "");
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите объект" />
            </SelectTrigger>
            <SelectContent>
              {serviceObjects.map(obj => (
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
        <Select value={selectedContractId} onValueChange={(value) => {
          const contract = documents.find(d => d.id === value);
          setValue("contractId", value);
          setValue("contractNumber", contract?.contractNumber || "");
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите договор" />
          </SelectTrigger>
          <SelectContent>
            {documents.map(doc => (
              <SelectItem key={doc.id} value={doc.id}>
                {doc.contractNumber}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="problemDescription">Описание проблемы *</Label>
        <Textarea id="problemDescription" {...register("problemDescription", { required: true })} rows={3} />
      </div>

      <div>
        <Label htmlFor="comments">Комментарии</Label>
        <Textarea id="comments" {...register("comments")} rows={2} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="desiredDate">Желаемая дата выполнения</Label>
          <Input type="date" id="desiredDate" {...register("desiredDate")} />
        </div>
        <div>
          <Label htmlFor="plannedVisitDate">Плановая дата выезда</Label>
          <Input type="datetime-local" id="plannedVisitDate" {...register("plannedVisitDate")} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="responsibleManagerId">Ответственный менеджер</Label>
          <Select value={selectedManagerId} onValueChange={(value) => {
            const manager = employees.find(e => e.id === value);
            setValue("responsibleManagerId", value);
            setValue("responsibleManagerName", manager?.fullName || "");
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
            setValue("assignedTeamId", value);
            setValue("assignedTeamName", team?.teamName || "");
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
            setValue("assignedEngineerId", value);
            setValue("assignedEngineerName", engineer?.fullName || "");
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
          <Input type="datetime-local" id="actualStartTime" {...register("actualStartTime")} />
        </div>
        <div>
          <Label htmlFor="actualEndTime">Фактическое окончание работ</Label>
          <Input type="datetime-local" id="actualEndTime" {...register("actualEndTime")} />
        </div>
        <div>
          <Label htmlFor="hoursSpent">Количество часов</Label>
          <Input type="number" step="0.5" id="hoursSpent" {...register("hoursSpent")} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Отмена
        </Button>
        <Button type="submit">
          {initialData ? "Сохранить" : "Создать"}
        </Button>
      </div>
    </form>
  );
}
