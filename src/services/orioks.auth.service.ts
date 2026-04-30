import axios, { AxiosError } from 'axios';
import { AuthResponseSchema } from '../schemas/user.schema'
import { ORIOKS_LINK } from '../config/env.config'
import { createAuthHeader } from '../utils/auth'

export const getToken = async (login:string, password:string): Promise<string> => {
    const authHeader = createAuthHeader(login, password);

    try { 
        const response = await axios.get(`${ORIOKS_LINK}/api/v1/auth`, {
        headers: {
            'Accept': 'application/json',
            'Authorization': authHeader,
            'User-Agent': 'Oreooks-bot/1.0 Windows 11'
        }});

        const parsed = AuthResponseSchema.safeParse(response.data);

        if (!parsed.success) {
            throw new Error('API не вернул токен');
        }

        return parsed.data.token;
    } catch (e: unknown) {
        if (axios.isAxiosError(e)) {
            const status = e.response?.status;
            const message = e.response?.data;

            if (status === 401) {
                throw new Error('Неверный логин или пароль');
            }

            if (status === 403) {
                throw new Error('Студент не может получить более восьми токенов');
            }
        }
        
        throw new Error('Неизвестная ошибка при запросе токена ORIOKS');
    }
};
 