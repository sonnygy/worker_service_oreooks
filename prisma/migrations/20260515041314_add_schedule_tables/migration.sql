-- CreateEnum if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Day') THEN
        CREATE TYPE "Day" AS ENUM ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');
    END IF;
END $$;

-- First add the new columns as nullable if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'groupId') THEN
        ALTER TABLE "students" ADD COLUMN "groupId" INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'groupName') THEN
        ALTER TABLE "students" ADD COLUMN "groupName" TEXT;
    END IF;
END $$;

-- Copy data from old "group" column to "groupName" if "group" column exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'group') THEN
        UPDATE "students" SET "groupName" = "group";
        ALTER TABLE "students" DROP COLUMN "group";
    END IF;
END $$;

-- Make groupName NOT NULL if it's not already
ALTER TABLE "students" ALTER COLUMN "groupName" SET NOT NULL;

-- Make tasks.state NOT NULL if it's nullable
ALTER TABLE "tasks" ALTER COLUMN "state" SET NOT NULL;

-- Drop events table if it exists
DROP TABLE IF EXISTS "events";

-- Create groups table if not exists
CREATE TABLE IF NOT EXISTS "groups" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- Create schedules table if not exists
CREATE TABLE IF NOT EXISTS "schedules" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "semester" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "weekType" INTEGER NOT NULL,
    "dayOfWeek" "Day" NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- Create lessons table if not exists
CREATE TABLE IF NOT EXISTS "lessons" (
    "id" SERIAL NOT NULL,
    "lesson_number" INTEGER NOT NULL,
    "lesson_name" TEXT NOT NULL,
    "lesson_type" TEXT NOT NULL,
    "teacher" TEXT NOT NULL,
    "classroom" TEXT NOT NULL,
    "scheduleId" INTEGER NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- Create indexes if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'groups_name_key') THEN
        CREATE UNIQUE INDEX "groups_name_key" ON "groups"("name");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'schedules_groupId_week_dayOfWeek_key') THEN
        CREATE UNIQUE INDEX "schedules_groupId_week_dayOfWeek_key" ON "schedules"("groupId", "week", "dayOfWeek");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'lessons_scheduleId_lesson_number_key') THEN
        CREATE UNIQUE INDEX "lessons_scheduleId_lesson_number_key" ON "lessons"("scheduleId", "lesson_number");
    END IF;
END $$;

-- Add foreign keys if not exists
DO $$ 
BEGIN
    -- Check if foreign key students_groupId_fkey exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'students_groupId_fkey' AND table_name = 'students'
    ) THEN
        ALTER TABLE "students" ADD CONSTRAINT "students_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    -- Check if foreign key schedules_groupId_fkey exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'schedules_groupId_fkey' AND table_name = 'schedules'
    ) THEN
        ALTER TABLE "schedules" ADD CONSTRAINT "schedules_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    -- Check if foreign key lessons_scheduleId_fkey exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'lessons_scheduleId_fkey' AND table_name = 'lessons'
    ) THEN
        ALTER TABLE "lessons" ADD CONSTRAINT "lessons_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;