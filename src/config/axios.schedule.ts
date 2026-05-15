import axios from "axios";
import { ORIOKS_LINK } from "../config/env.config";
import { createTokenHeader } from "../utils/schedule";

export const createApi = (token: string) => {
  const api = axios.create({
    baseURL: ORIOKS_LINK,
    timeout: 10000,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: createTokenHeader(token),
      "User-Agent": "Oreooks/1.0 Windows 10",
      "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8"
    }
  });

  api.interceptors.request.use((config) => {
    console.debug(`[${new Date().toISOString()}] ORIOKS Request:`, {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        ...config.headers,
        Authorization: config.headers.Authorization ?
          `${String(config.headers.Authorization).substring(0, 15)}...` : 'none'
      }
    });
    return config;
  });

  api.interceptors.response.use(
    (response) => {
      console.debug(`[${new Date().toISOString()}] ORIOKS Response:`, {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      return response;
    },
    (error) => {
      if (axios.isAxiosError(error)) {
        console.debug(`[${new Date().toISOString()}] ORIOKS Error Response:`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          code: error.code,
          message: error.message
        });
      }
      return Promise.reject(error);
    }
  );

  return api;
};