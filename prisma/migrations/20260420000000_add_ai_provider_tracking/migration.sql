-- AlterTable
ALTER TABLE "task_sessions" 
ADD COLUMN "ai_provider_name" TEXT,
ADD COLUMN "ai_provider_type" VARCHAR(50),
ADD COLUMN "ai_model" VARCHAR(200);

-- AlterTable
ALTER TABLE "daily_usage_logs" 
ADD COLUMN "ai_provider_name" VARCHAR(100),
ADD COLUMN "ai_provider_type" VARCHAR(50);
