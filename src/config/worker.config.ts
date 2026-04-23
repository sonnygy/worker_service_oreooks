import dotenv from 'dotenv';
dotenv.config();
export const PORT = process.env.PORT;
export const ORIOKS_AUTH_URL = process.env.ORIOKS_AUTH_URL as string;
export const ORIOKS_GROUP_URL = process.env.ORIOKS_GROUP_URL as string;
export const ORIOKS_WEEK_TYPE = process.env.ORIOKS_WEEK_TYPE as string;
export const ORIOKS_LESSONS_TYPE = process.env.ORIOKS_LESSONS_TYPE as string;

