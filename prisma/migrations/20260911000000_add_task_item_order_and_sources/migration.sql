ALTER TABLE "task_sessions" ADD COLUMN IF NOT EXISTS "source_requirements" TEXT;
ALTER TABLE "task_items" ADD COLUMN IF NOT EXISTS "question_order" INTEGER;
CREATE INDEX IF NOT EXISTS "task_items_session_id_question_order_idx" ON "task_items"("session_id", "question_order");
