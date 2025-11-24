import { useState } from "react";
import { Client } from "@/types/client";
import { ClientList } from "@/components/clients/ClientList";
import { ClientForm } from "@/components/clients/ClientForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const mockClients: Client[] = [
  {
    id: "1",
    companyName: "ООО 'Торговый дом Север'",
    type: "legal_entity",
    mainContactName: "Петров Петр Петрович",
    phone: "+7 (495) 123-45-67",
    email: "p.petrov@sever-td.ru",
    additionalContacts: [
      {
        id: "1",
        name: "Сидорова Анна Ивановна",
        phone: "+7 (495) 123-45-68",
        email: "a.sidorova@sever-td.ru",
      },
    ],
    notes: "Постоянный клиент с 2020 года. Требуется регулярное обслуживание системы кондиционирования в офисе.",
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    companyName: "ИП Иванов Иван Иванович",
    type: "individual_entrepreneur",
    mainContactName: "Иванов Иван Иванович",
    phone: "+7 (916) 234-56-78",
    email: "ivanov.ip@gmail.com",
    additionalContacts: [],
    notes: "Ресторан 'У Ивана'. Установка вентиляционной системы на кухне.",
    createdAt: new Date("2024-02-20"),
  },
  {
    id: "3",
    companyName: "ООО 'МедЦентр Здоровье'",
    type: "legal_entity",
    mainContactName: "Смирнова Елена Александровна",
    phone: "+7 (499) 987-65-43",
    email: "info@medcentr-zdorovie.ru",
    additionalContacts: [
      {
        id: "2",
        name: "Козлов Андрей Викторович",
        phone: "+7 (499) 987-65-44",
      },
    ],
    notes: "Медицинский центр. Требуется поддержка специальных требований к микроклимату.",
    createdAt: new Date("2024-03-10"),
  },
];

export default function Clients() {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [isFormVisible, setIsFormVisible] = useState(false);

  const handleCreateClient = (clientData: Omit<Client, "id" | "createdAt">) => {
    const newClient: Client = {
      ...clientData,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setClients([newClient, ...clients]);
    setIsFormVisible(false);
    toast.success("Клиент успешно создан");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Клиенты</h1>
          <p className="text-muted-foreground mt-1">
            Управление базой клиентов компании
          </p>
        </div>
        {!isFormVisible && (
          <Button onClick={() => setIsFormVisible(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить клиента
          </Button>
        )}
      </div>

      {isFormVisible ? (
        <ClientForm
          onSubmit={handleCreateClient}
          onCancel={() => setIsFormVisible(false)}
        />
      ) : (
        <ClientList clients={clients} />
      )}
    </div>
  );
}
