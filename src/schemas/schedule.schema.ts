import { z } from "zod";

export const SemesterStartSchema = z.object({
    semester_start: z.string()
});

export const GroupIdSchema = z.array(
  z.object({
    id: z.union([z.number(), z.string()]),
    name: z.string().optional()
  })
);

export const StudentSchema = z.object({
    course: z.number(),
    department: z.string(),
    full_name: z.string(),
    group: z.string(),
    record_book_id: z.number(),
    semester: z.number(),
    study_direction: z.string(),
    study_profile: z.string(),
    year: z.string()
});

export const UserTgIdSchema = z.object({
    tg_id: z.string()
});

export const UserTgIdTypeDaySchema = z.object({
    tg_id: z.string(),
    type_day: z.string()
});