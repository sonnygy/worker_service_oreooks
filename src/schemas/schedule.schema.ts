import { z } from "zod";

export const SemesterStartSchema = z.object({
    semester_start: z.string()
});

export const GroupIdSchema = z.object({
    id: z.string()
});