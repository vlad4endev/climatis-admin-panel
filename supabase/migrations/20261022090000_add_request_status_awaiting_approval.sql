-- Статус "Ожидает согласования" (п.10 фидбэка заказчика). partially_completed
-- остаётся в enum для совместимости со старыми заявками — просто не
-- предлагается новым записям (см. src/types/request.ts).
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'awaiting_approval' AFTER 'needs_calculation';
