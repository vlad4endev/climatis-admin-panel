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
import { Document, CONTRACT_TYPES } from "@/types/document";
import { Client } from "@/types/client";
import { ServiceObject } from "@/types/serviceObject";

interface DocumentFormProps {
  initialData?: Partial<Document>;
  onSubmit: (data: Omit<Document, 'id'>) => void;
  onCancel: () => void;
  clients: Client[];
  serviceObjects: ServiceObject[];
  readOnly?: boolean;
}

export function DocumentForm({ initialData, onSubmit, onCancel, clients, serviceObjects, readOnly = false }: DocumentFormProps) {
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      contractNumber: initialData?.contractNumber || '',
      startDate: initialData?.startDate || '',
      endDate: initialData?.endDate || '',
      contractType: initialData?.contractType || 'general',
      clientId: initialData?.clientId || '',
      objectId: initialData?.objectId || '',
      responseConditions: initialData?.responseConditions || '',
      notes: initialData?.notes || '',
      fileName: initialData?.fileName || '',
    },
  });

  const selectedClientId = watch('clientId');
  const filteredObjects = serviceObjects.filter(obj => obj.clientId === selectedClientId);

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
      <div>
        <Label htmlFor="contractNumber">Номер договора</Label>
        <Input 
          id="contractNumber" 
          {...register('contractNumber', { required: !readOnly })} 
          readOnly={readOnly}
          className={readOnly ? "bg-muted/50" : ""}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Дата начала</Label>
          <Input 
            id="startDate" 
            type="date" 
            {...register('startDate', { required: !readOnly })} 
            readOnly={readOnly}
            className={readOnly ? "bg-muted/50" : ""}
          />
        </div>
        <div>
          <Label htmlFor="endDate">Дата окончания</Label>
          <Input 
            id="endDate" 
            type="date" 
            {...register('endDate', { required: !readOnly })} 
            readOnly={readOnly}
            className={readOnly ? "bg-muted/50" : ""}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="contractType">Тип договора</Label>
        <Select
          value={watch('contractType')}
          onValueChange={(value) => setValue('contractType', value as any)}
          disabled={readOnly}
        >
          <SelectTrigger className={readOnly ? "bg-muted/50" : ""}>
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
          }}
          disabled={readOnly}
        >
          <SelectTrigger className={readOnly ? "bg-muted/50" : ""}>
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
            value={watch('objectId')}
            onValueChange={(value) => setValue('objectId', value)}
            disabled={readOnly}
          >
            <SelectTrigger className={readOnly ? "bg-muted/50" : ""}>
              <SelectValue placeholder="Выберите объект" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Не привязан к объекту</SelectItem>
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
          className={readOnly ? "bg-muted/50" : ""}
        />
      </div>

      <div>
        <Label htmlFor="notes">Примечания</Label>
        <Textarea 
          id="notes" 
          {...register('notes')} 
          readOnly={readOnly}
          className={readOnly ? "bg-muted/50" : ""}
        />
      </div>

      {!readOnly && (
        <div>
          <Label htmlFor="file">Файл договора</Label>
          <Input
            id="file"
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setValue('fileName', file.name);
              }
            }}
          />
          {watch('fileName') && (
            <p className="text-sm text-muted-foreground mt-1">
              Текущий файл: {watch('fileName')}
            </p>
          )}
        </div>
      )}

      {readOnly && watch('fileName') && (
        <div>
          <Label>Файл договора</Label>
          <p className="text-sm mt-1">{watch('fileName')}</p>
        </div>
      )}

      {!readOnly && (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button type="submit">
            {initialData ? 'Сохранить' : 'Создать'}
          </Button>
        </div>
      )}
    </form>
  );
}
