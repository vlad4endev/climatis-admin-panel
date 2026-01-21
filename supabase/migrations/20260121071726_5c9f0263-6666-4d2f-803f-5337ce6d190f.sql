-- Шаг 1: Добавляем новые значения в существующие enum типы
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'draft' BEFORE 'new';
ALTER TYPE assignment_status ADD VALUE IF NOT EXISTS 'draft' BEFORE 'new';

-- Шаг 2: Создаём тип для статуса документов
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_status') THEN
        CREATE TYPE document_status AS ENUM ('draft', 'active', 'completed', 'cancelled');
    END IF;
END $$;

-- Шаг 3: Добавляем колонку status в таблицу documents
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS status document_status NOT NULL DEFAULT 'draft';