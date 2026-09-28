import { forwardRef } from "react";
import { Request, REQUEST_STATUSES, REQUEST_TYPES } from "@/types/request";
import { ServiceObject } from "@/types/serviceObject";

interface RequestPrintViewProps {
  request: Request;
  serviceObject?: ServiceObject;
}

export const RequestPrintView = forwardRef<HTMLDivElement, RequestPrintViewProps>(
  ({ request, serviceObject }, ref) => {
    const status = REQUEST_STATUSES.find((s) => s.value === request.status);
    const type = REQUEST_TYPES.find((t) => t.value === request.type);
    const mainContact =
      serviceObject?.assignedContacts?.find((c) => c.isMain) || serviceObject?.assignedContacts?.[0];

    return (
      <div
        ref={ref}
        style={{
          fontFamily: "Arial, sans-serif",
          fontSize: "9pt",
          lineHeight: "1.3",
          width: "210mm",
          minHeight: "297mm",
          boxSizing: "border-box",
          padding: "10mm 15mm",
          background: "white",
          color: "black",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "3mm" }}>
          <h1 style={{ fontSize: "12pt", fontWeight: "bold", margin: "0 0 1mm 0" }}>ЗАЯВКА НА ОБСЛУЖИВАНИЕ</h1>
          <p style={{ fontSize: "9pt", margin: "0" }}>
            № {request.requestNumber}
            {request.priority === "urgent" ? " · СРОЧНАЯ" : ""}
          </p>
          <p style={{ fontSize: "8pt", color: "#666", margin: "0" }}>
            от {new Date(request.createdAt).toLocaleDateString("ru-RU")}
          </p>
        </div>

        <table style={{ width: "100%", fontSize: "8pt", borderCollapse: "collapse", marginBottom: "3mm" }}>
          <tbody>
            <tr>
              <td style={{ padding: "0.5mm 0", color: "#666", width: "35mm" }}>Статус:</td>
              <td style={{ padding: "0.5mm 0", fontWeight: 500 }}>{status?.label}</td>
            </tr>
            <tr>
              <td style={{ padding: "0.5mm 0", color: "#666" }}>Тип заявки:</td>
              <td style={{ padding: "0.5mm 0", fontWeight: 500 }}>{type?.label}</td>
            </tr>
            <tr>
              <td style={{ padding: "0.5mm 0", color: "#666" }}>Контрагент:</td>
              <td style={{ padding: "0.5mm 0", fontWeight: 500 }}>{request.clientName}</td>
            </tr>
            <tr>
              <td style={{ padding: "0.5mm 0", color: "#666" }}>Объект:</td>
              <td style={{ padding: "0.5mm 0", fontWeight: 500 }}>{request.objectName}</td>
            </tr>
            {serviceObject?.address && (
              <tr>
                <td style={{ padding: "0.5mm 0", color: "#666" }}>Адрес объекта:</td>
                <td style={{ padding: "0.5mm 0", fontWeight: 500 }}>{serviceObject.address}</td>
              </tr>
            )}
            {mainContact && (
              <tr>
                <td style={{ padding: "0.5mm 0", color: "#666" }}>Контактное лицо:</td>
                <td style={{ padding: "0.5mm 0", fontWeight: 500 }}>
                  {mainContact.name}
                  {mainContact.phone ? `, тел. ${mainContact.phone}` : ""}
                </td>
              </tr>
            )}
            {request.contractNumber && (
              <tr>
                <td style={{ padding: "0.5mm 0", color: "#666" }}>Договор:</td>
                <td style={{ padding: "0.5mm 0", fontWeight: 500 }}>{request.contractNumber}</td>
              </tr>
            )}
            {request.desiredDate && (
              <tr>
                <td style={{ padding: "0.5mm 0", color: "#666" }}>Желаемая дата:</td>
                <td style={{ padding: "0.5mm 0", fontWeight: 500 }}>
                  {new Date(request.desiredDate).toLocaleDateString("ru-RU")}
                </td>
              </tr>
            )}
            {request.assignedTeamName && (
              <tr>
                <td style={{ padding: "0.5mm 0", color: "#666" }}>Бригада:</td>
                <td style={{ padding: "0.5mm 0", fontWeight: 500 }}>{request.assignedTeamName}</td>
              </tr>
            )}
            {request.assignedEngineerName && (
              <tr>
                <td style={{ padding: "0.5mm 0", color: "#666" }}>Инженер:</td>
                <td style={{ padding: "0.5mm 0", fontWeight: 500 }}>{request.assignedEngineerName}</td>
              </tr>
            )}
          </tbody>
        </table>

        <div style={{ marginBottom: "3mm" }}>
          <h2
            style={{
              fontSize: "9pt",
              fontWeight: "bold",
              margin: "0 0 1mm 0",
              borderBottom: "0.5pt solid #ccc",
              paddingBottom: "0.5mm",
            }}
          >
            Описание проблемы
          </h2>
          <p style={{ fontSize: "8pt", margin: 0, whiteSpace: "pre-wrap" }}>{request.problemDescription}</p>
        </div>

        {request.comments && (
          <div style={{ marginBottom: "3mm" }}>
            <h2
              style={{
                fontSize: "9pt",
                fontWeight: "bold",
                margin: "0 0 1mm 0",
                borderBottom: "0.5pt solid #ccc",
                paddingBottom: "0.5mm",
              }}
            >
              Комментарии
            </h2>
            <p style={{ fontSize: "8pt", margin: 0, whiteSpace: "pre-wrap" }}>{request.comments}</p>
          </div>
        )}

        <div style={{ marginTop: "6mm", paddingTop: "3mm", borderTop: "0.5pt solid #ccc" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4mm", fontSize: "8pt" }}>
            <div>
              <p style={{ margin: "0 0 5mm 0" }}>Заявку принял: _____________________</p>
              <p style={{ margin: 0 }}>Дата: _____________________</p>
            </div>
            <div>
              <p style={{ margin: "0 0 5mm 0" }}>Заявку выполнил: _____________________</p>
              <p style={{ margin: 0 }}>Дата: _____________________</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

RequestPrintView.displayName = "RequestPrintView";
