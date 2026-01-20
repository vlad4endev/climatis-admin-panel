import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ServiceObject } from "@/types/serviceObject";
import { Client } from "@/types/client";
import { ServiceObjectContactsEditor } from "./ServiceObjectContactsEditor";

const formSchema = z.object({
  clientId: z.string().min(1, "Выберите клиента"),
  objectName: z.string().min(1, "Введите название объекта"),
  address: z.string().min(1, "Введите адрес"),
  accessDescription: z.string(),
  notes: z.string(),
});

interface ServiceObjectFormProps {
  clients: Client[];
  onSubmit: (data: Omit<ServiceObject, "id" | "createdAt" | "clientName">) => void;
  onCancel: () => void;
  initialData?: ServiceObject;
  readOnly?: boolean;
}

export function ServiceObjectForm({
  clients,
  onSubmit,
  onCancel,
  initialData,
  readOnly = false,
}: ServiceObjectFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: initialData?.clientId || "",
      objectName: initialData?.objectName || "",
      address: initialData?.address || "",
      accessDescription: initialData?.accessDescription || "",
      notes: initialData?.notes || "",
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit({
      clientId: values.clientId,
      objectName: values.objectName,
      address: values.address,
      accessDescription: values.accessDescription || "",
      notes: values.notes || "",
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Клиент {!readOnly && '*'}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={readOnly}>
                  <FormControl>
                    <SelectTrigger className={readOnly ? "bg-input-readonly" : ""}>
                      <SelectValue placeholder="Выберите клиента" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="objectName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Название объекта {!readOnly && '*'}</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Офис, склад, производство..." 
                    {...field} 
                    readOnly={readOnly}
                    tabIndex={readOnly ? -1 : undefined}
                    className={readOnly ? "bg-input-readonly" : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Адрес объекта {!readOnly && '*'}</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Улица, дом, корпус..." 
                    {...field} 
                    readOnly={readOnly}
                    tabIndex={readOnly ? -1 : undefined}
                    className={readOnly ? "bg-input-readonly" : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accessDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Описание / особенности доступа</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Код домофона, инструкции по проходу..."
                    className={`min-h-[100px] ${readOnly ? "bg-input-readonly" : ""}`}
                    {...field}
                    readOnly={readOnly}
                    tabIndex={readOnly ? -1 : undefined}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Примечания</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Дополнительная информация..."
                    className={`min-h-[100px] ${readOnly ? "bg-input-readonly" : ""}`}
                    {...field}
                    readOnly={readOnly}
                    tabIndex={readOnly ? -1 : undefined}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Контактные лица */}
          <div className="pt-4 border-t">
            <ServiceObjectContactsEditor
              serviceObjectId={initialData?.id}
              clientId={form.watch("clientId") || initialData?.clientId}
              readOnly={readOnly}
            />
          </div>
        </div>

        {!readOnly && (
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Отмена
            </Button>
            <Button type="submit">
              {initialData ? "Сохранить" : "Создать объект"}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
