import dotenv from 'dotenv';
dotenv.config();


export const DATABASE_URL: string = process.env.DATABASE_URL as string;

export const ORIOKS_LINK: string = process.env.ORIOKS_LINK || 'https://orioks.miet.ru';
export const PORT: number = Number.parseInt(process.env.PORT as string) ?? 3000;

if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined in .env');
}

if (!ORIOKS_LINK) {
    throw new Error('ORIOKS_LINK is not defined in .env');
}