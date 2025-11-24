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
}

export function ServiceObjectForm({
  clients,
  onSubmit,
  onCancel,
  initialData,
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
                <FormLabel>Клиент *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
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
                <FormLabel>Название объекта *</FormLabel>
                <FormControl>
                  <Input placeholder="Офис, склад, производство..." {...field} />
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
                <FormLabel>Адрес объекта *</FormLabel>
                <FormControl>
                  <Input placeholder="Улица, дом, корпус..." {...field} />
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
                    className="min-h-[100px]"
                    {...field}
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
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button type="submit">
            {initialData ? "Сохранить" : "Создать объект"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
