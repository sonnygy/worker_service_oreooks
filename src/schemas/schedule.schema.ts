import { z } from "zod";

export const SemesterStartSchema = z.object({
    semester_start: z.string()
});

export const GroupIdSchema = z.object({
    id: z.string()
});

export const UserTgIdSchema = z.object({
    tg_id: z.string()
});

export const UserTgIdTypeDaySchema = z.object({
    tg_id: z.string(),
    type_day: z.string()
});