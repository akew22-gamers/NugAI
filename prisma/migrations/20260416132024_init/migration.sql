-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'STUDENT');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'PREMIUM');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('DISCUSSION', 'ASSIGNMENT');

-- CreateEnum
CREATE TYPE "TaskItemStatus" AS ENUM ('GENERATING', 'COMPLETED', 'FAILED', 'DRAFT');

-- CreateEnum
CREATE TYPE "ReferenceType" AS ENUM ('MODULE', 'JOURNAL', 'BOOK', 'GOVERNMENT', 'WEB');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "subscription_tier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "daily_usage_count" INTEGER NOT NULL DEFAULT 0,
    "last_usage_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "admin_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "admin_login_locked_until" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "nim" VARCHAR(20) NOT NULL,
    "university_name" VARCHAR(100) NOT NULL,
    "faculty" VARCHAR(50) NOT NULL,
    "study_program" VARCHAR(50) NOT NULL,
    "upbjj_branch" VARCHAR(50),
    "university_logo_url" VARCHAR(500) NOT NULL,
    "default_min_words" INTEGER NOT NULL DEFAULT 300,
    "default_tone" VARCHAR(100) NOT NULL DEFAULT 'Bahasa Indonesia Baku Semi-Formal',
    "pdf_font_url" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "course_name" VARCHAR(100) NOT NULL,
    "module_book_title" VARCHAR(200) NOT NULL,
    "tutor_name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "course_id" TEXT,
    "task_type" "TaskType" NOT NULL,
    "min_words_target" INTEGER NOT NULL,
    "regenerate_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "course_name_snapshot" VARCHAR(100),
    "module_book_title_snapshot" VARCHAR(200),
    "tutor_name_snapshot" VARCHAR(100),

    CONSTRAINT "task_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_items" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "answer_text" TEXT,
    "references_used" JSONB,
    "regenerate_count" INTEGER NOT NULL DEFAULT 0,
    "status" "TaskItemStatus" NOT NULL DEFAULT 'GENERATING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_usage_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "deepseek_tokens_used" INTEGER,
    "tavily_calls" INTEGER NOT NULL DEFAULT 0,
    "exa_calls" INTEGER NOT NULL DEFAULT 0,
    "estimated_cost" DECIMAL(10,4),
    "date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_purge_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "username_snapshot" VARCHAR(50) NOT NULL,
    "sessions_purged" INTEGER NOT NULL,
    "items_purged" INTEGER NOT NULL,
    "purge_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" VARCHAR(200) NOT NULL,

    CONSTRAINT "data_purge_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_subscription_tier_idx" ON "users"("subscription_tier");

-- CreateIndex
CREATE INDEX "users_last_usage_date_idx" ON "users"("last_usage_date");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_user_id_key" ON "student_profiles"("user_id");

-- CreateIndex
CREATE INDEX "student_profiles_university_name_idx" ON "student_profiles"("university_name");

-- CreateIndex
CREATE INDEX "student_profiles_study_program_idx" ON "student_profiles"("study_program");

-- CreateIndex
CREATE INDEX "courses_user_id_idx" ON "courses"("user_id");

-- CreateIndex
CREATE INDEX "courses_course_name_idx" ON "courses"("course_name");

-- CreateIndex
CREATE INDEX "task_sessions_user_id_idx" ON "task_sessions"("user_id");

-- CreateIndex
CREATE INDEX "task_sessions_task_type_idx" ON "task_sessions"("task_type");

-- CreateIndex
CREATE INDEX "task_sessions_created_at_idx" ON "task_sessions"("created_at");

-- CreateIndex
CREATE INDEX "task_sessions_user_id_created_at_idx" ON "task_sessions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "task_sessions_course_id_created_at_idx" ON "task_sessions"("course_id", "created_at");

-- CreateIndex
CREATE INDEX "task_items_session_id_idx" ON "task_items"("session_id");

-- CreateIndex
CREATE INDEX "task_items_status_idx" ON "task_items"("status");

-- CreateIndex
CREATE INDEX "task_items_session_id_status_idx" ON "task_items"("session_id", "status");

-- CreateIndex
CREATE INDEX "daily_usage_logs_user_id_idx" ON "daily_usage_logs"("user_id");

-- CreateIndex
CREATE INDEX "daily_usage_logs_date_idx" ON "daily_usage_logs"("date");

-- CreateIndex
CREATE INDEX "daily_usage_logs_user_id_date_idx" ON "daily_usage_logs"("user_id", "date");

-- CreateIndex
CREATE INDEX "data_purge_logs_purge_date_idx" ON "data_purge_logs"("purge_date");

-- CreateIndex
CREATE INDEX "data_purge_logs_user_id_idx" ON "data_purge_logs"("user_id");

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_sessions" ADD CONSTRAINT "task_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_sessions" ADD CONSTRAINT "task_sessions_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_items" ADD CONSTRAINT "task_items_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "task_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_usage_logs" ADD CONSTRAINT "daily_usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_usage_logs" ADD CONSTRAINT "daily_usage_logs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "task_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
