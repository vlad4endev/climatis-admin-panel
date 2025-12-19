import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Invoice, INVOICE_STATUSES } from "@/types/invoice";

interface InvoiceFormProps {
  invoice?: Invoice;
  onSubmit: (data: Partial<Invoice>) => void;
  onCancel: () => void;
  clients: Array<{ id: string; name: string }>;
  requests: Array<{ id: string; name: string; createdAt: string }>;
  estimates: Array<{ id: string; name: string; estimateDate: string }>;
  readOnly?: boolean;
}

export function InvoiceForm({
  invoice,
  onSubmit,
  onCancel,
  clients,
  requests,
  estimates,
  readOnly = false,
}: InvoiceFormProps) {
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      invoiceNumber: invoice?.invoiceNumber || `СЧ-${Date.now().toString().slice(-6)}`,
      invoiceDate: invoice?.invoiceDate || new Date().toISOString().split('T')[0],
      clientId: invoice?.clientId || "",
      requestId: invoice?.requestId || "",
      estimateId: invoice?.estimateId || "",
      amount: invoice?.amount || 0,
      status: invoice?.status || "подготовлен",
    },
  });

  const [clientSearch, setClientSearch] = useState(invoice?.clientName || "");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const clientInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const status = watch("status");
  const requestId = watch("requestId");
  const estimateId = watch("estimateId");
  const clientId = watch("clientId");

  // Sort requests by creation date (newest first)
  const sortedRequests = [...requests].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Sort estimates by date (newest first)
  const sortedEstimates = [...estimates].sort((a, b) => 
    new Date(b.estimateDate).getTime() - new Date(a.estimateDate).getTime()
  );

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        clientInputRef.current &&
        !clientInputRef.current.contains(event.target as Node)
      ) {
        setShowClientDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (invoice?.clientId && invoice?.clientName) {
      setClientSearch(invoice.clientName);
    }
  }, [invoice]);

  const handleClientSelect = (client: { id: string; name: string }) => {
    setValue("clientId", client.id);
    setClientSearch(client.name);
    setShowClientDropdown(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="bg-form-section p-4 rounded-lg space-y-4">
        <h3 className="font-semibold text-form-label">Данные счёта</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="invoiceNumber">Номер счёта</Label>
            <Input
              id="invoiceNumber"
              {...register("invoiceNumber")}
              placeholder="СЧ-001"
              readOnly={readOnly}
              tabIndex={readOnly ? -1 : undefined}
              className={readOnly ? "bg-input-readonly" : ""}
            />
          </div>
          <div>
            <Label htmlFor="invoiceDate">Дата счёта</Label>
            <Input
              id="invoiceDate"
              type="date"
              {...register("invoiceDate")}
              readOnly={readOnly}
              tabIndex={readOnly ? -1 : undefined}
              className={readOnly ? "bg-input-readonly" : ""}
            />
          </div>
        </div>
      </div>

      <div className="bg-form-section p-4 rounded-lg space-y-4">
        <h3 className="font-semibold text-form-label">Контрагент и связи</h3>
        <div>
          <Label htmlFor="clientId">Контрагент</Label>
          {readOnly ? (
            <Input
              value={clientSearch}
              readOnly
              tabIndex={-1}
              className="bg-input-readonly"
            />
          ) : (
            <div className="relative">
              <Input
                ref={clientInputRef}
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setValue("clientId", "");
                  setShowClientDropdown(true);
                }}
                onFocus={() => setShowClientDropdown(true)}
                placeholder="Поиск контрагента..."
              />
              {showClientDropdown && filteredClients.length > 0 && (
                <div
                  ref={dropdownRef}
                  className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto z-50"
                >
                  {filteredClients.map((client) => (
                    <div
                      key={client.id}
                      className="px-3 py-2 hover:bg-accent cursor-pointer"
                      onClick={() => handleClientSelect(client)}
                    >
                      {client.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="requestId">Заявка</Label>
          <Select
            value={requestId}
            onValueChange={(value) => setValue("requestId", value)}
            disabled={readOnly}
          >
            <SelectTrigger className={readOnly ? "bg-input-readonly" : ""}>
              <SelectValue placeholder="Выберите заявку (необязательно)" />
            </SelectTrigger>
            <SelectContent>
              {sortedRequests.map((request) => (
                <SelectItem key={request.id} value={request.id}>
                  {request.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="estimateId">Основание (расчёт)</Label>
          <Select
            value={estimateId}
            onValueChange={(value) => setValue("estimateId", value)}
            disabled={readOnly}
          >
            <SelectTrigger className={readOnly ? "bg-input-readonly" : ""}>
              <SelectValue placeholder="Выберите расчёт (необязательно)" />
            </SelectTrigger>
            <SelectContent>
              {sortedEstimates.map((estimate) => (
                <SelectItem key={estimate.id} value={estimate.id}>
                  {estimate.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-form-section p-4 rounded-lg space-y-4">
        <h3 className="font-semibold text-form-label">Финансы и статус</h3>
        <div>
          <Label htmlFor="amount">Сумма по счёту</Label>
          <Input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            {...register("amount", { valueAsNumber: true })}
            placeholder="0"
            readOnly={readOnly}
            tabIndex={readOnly ? -1 : undefined}
            className={readOnly ? "bg-input-readonly" : ""}
          />
        </div>

        <div>
          <Label htmlFor="status">Статус</Label>
          <Select
            value={status}
            onValueChange={(value) => setValue("status", value as any)}
            disabled={readOnly}
          >
            <SelectTrigger className={readOnly ? "bg-input-readonly" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INVOICE_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!readOnly && (
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button type="submit">
            {invoice ? "Сохранить" : "Создать"}
          </Button>
        </div>
      )}
    </form>
  );
}
