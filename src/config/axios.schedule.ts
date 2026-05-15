import axios from "axios";
import { ORIOKS_LINK } from "../config/env.config";
import { createTokenHeader } from "../utils/schedule";

export const createApi = (token: string) => {
  const api = axios.create({
    baseURL: ORIOKS_LINK,
    timeout: 10000,
    headers: {
      Accept: "application/json",
      Authorization: createTokenHeader(token),
      "User-Agent": "Oreooks-bot/1.0 Windows 11"
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

  return api;
};