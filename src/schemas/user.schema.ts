import { z } from "zod";

export const AuthResponseSchema = z.object({
    token: z.string()
})

export const AuthRequestSchema = z.object({
    login: z.string(),
    password: z.string(),
    tg_id: z.number()
})