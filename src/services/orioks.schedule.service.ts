import axios from "axios";
import { createApi } from "../config/axios.schedule";
import { SemesterStartSchema, GroupIdSchema, StudentSchema } from "../schemas/schedule.schema";
import type { ScheduleDTO, LessonDTO } from "../models/sсhedule.model";
import { Day } from "@prisma/client";

export const getSemesterStart = async (token: string): Promise<string> => {
  const api = createApi(token);

  try {
    const { data } = await api.get("/api/v1/schedule");

    const parsed = SemesterStartSchema.safeParse(data);

    if (!parsed.success) {
      throw new Error("Некорректный ответ от API ORIOKS");
    }

    return parsed.data.semester_start;
  } catch (e) {
    throw handleAxiosError(e, { functionName: 'getSemesterStart' });
  }
};

export const getWeek = async (token: string): Promise<number> => {
  const semesterStart = await getSemesterStart(token);

  const now = new Date();
  const start = new Date(semesterStart);

  if (isNaN(start.getTime())) {
    throw new Error("Некорректная дата семестра");
  }

  const diffDays = Math.floor(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );

  return Math.floor(diffDays / 7) + 1;
};

export const getWeekType = async (token: string): Promise<number> => {
  const week = await getWeek(token);

  return ((week - 1) % 4 + 4) % 4;
};

export const getGroups = async (token: string): Promise<Array<{ id: string | number; name?: string | undefined }>> => {
  const api = createApi(token);

  try {
    const { data, status } = await api.get("/api/v1/schedule/groups");
    
    console.error('[DEBUG] getGroups: API Response status:', status);
    console.error('[DEBUG] getGroups: API Response data:', JSON.stringify(data, null, 2));

    if (!Array.isArray(data)) {
      console.error('[ERROR] API response is not an array:', typeof data);
      throw new Error(`Некорректный формат ответа API: ожидался массив, получен ${typeof data}`);
    }

    const parsed = GroupIdSchema.safeParse(data);

    if (!parsed.success) {
      console.error('GroupIdSchema validation error:', parsed.error);
      console.error('Raw API response:', data);
      throw new Error("Некорректный ответ от API ORIOKS");
    }

    if (!parsed.data.length) {
      throw new Error("Массив групп пуст");
    }

    return parsed.data;
  } catch (e) {
    throw handleAxiosError(e, { functionName: 'getGroups' });
  }
};

export const getIdGroup = async (token: string, studentGroupName?: string): Promise<string> => {
  const groups = await getGroups(token);

  if (studentGroupName) {
    // Ищем группу по имени (точное или частичное совпадение)
    const normalizedTarget = studentGroupName.trim().toLowerCase();
    let matchedGroup = groups.find(g => g.name && g.name.trim().toLowerCase() === normalizedTarget);
    
    if (!matchedGroup) {
      // Попробуем частичное совпадение (например, "ДПК-20-007/4" vs "ДПК-20-007/4 (2020 г.)")
      matchedGroup = groups.find(g => g.name && g.name.trim().toLowerCase().includes(normalizedTarget));
    }

    if (!matchedGroup) {
      console.error('[WARN] Cannot find group by name:', studentGroupName);
      console.error('[WARN] Available groups:', groups.map(g => ({ id: g.id, name: g.name })));
      // fallback to first group
    } else {
      console.error('[DEBUG] Matched group:', matchedGroup);
      return String(matchedGroup.id);
    }
  }

  // Если имя группы не указано или не найдено, берем первую группу (для обратной совместимости)
  const firstGroup = groups[0];
  if (!firstGroup || !firstGroup.id) {
    throw new Error("ID группы отсутствует");
  }

  console.error('[DEBUG] Using first group:', firstGroup);
  return String(firstGroup.id);
};

export const getStudentInfo = async (token: string): Promise<{
  course: number;
  department: string;
  full_name: string;
  group: string;
  record_book_id: number;
  semester: number;
  study_direction: string;
  study_profile: string;
  year: string;
}> => {
  const api = createApi(token);

  try {
    const { data, status } = await api.get("/api/v1/student");
    
    console.error('[DEBUG] getStudentInfo: response status =', status);
    console.error('[DEBUG] getStudentInfo: response data =', JSON.stringify(data, null, 2));

    const parsed = StudentSchema.safeParse(data);

    if (!parsed.success) {
      console.error('[ERROR] StudentSchema validation error:', parsed.error);
      console.error('[ERROR] Raw student data:', data);
      throw new Error("Некорректный ответ от API ORIOKS (студент)");
    }

    console.error('[DEBUG] getStudentInfo: parsed data =', parsed.data);
    return parsed.data;
  } catch (e) {
    console.error('[ERROR] getStudentInfo failed:', e);
    throw handleAxiosError(e, { functionName: 'getStudentInfo' });
  }
};

export const getLessonTime = async (token: string): Promise<any> => {
  const api = createApi(token);

  try {
    const { data } = await api.get("/api/v1/schedule/timetable");
    return data;
  } catch (e) {
    throw handleAxiosError(e, { functionName: 'getLessonTime' });
  }
};

export const getSchedule = async (token: string): Promise<ScheduleDTO[]> => {
  const api = createApi(token);
  
  // Получаем информацию о студенте, чтобы узнать его группу
  let studentGroupName: string | undefined;
  try {
    const studentInfo = await getStudentInfo(token);
    studentGroupName = studentInfo.group;
    console.error('[DEBUG] getSchedule: student group name =', studentGroupName);
  } catch (e) {
    console.error('[WARN] getSchedule: failed to get student info, will use default group selection', e);
  }
  
  const idGroup = await getIdGroup(token, studentGroupName);
  
  console.error('[DEBUG] getSchedule: idGroup =', idGroup);
  console.error('[DEBUG] getSchedule: request URL =', `/api/v1/schedule/groups/${idGroup}`);

  try {
    const { data, status } = await api.get(`/api/v1/schedule/groups/${idGroup}`);
    
    console.error('[DEBUG] getSchedule: response status =', status);
    console.error('[DEBUG] getSchedule: response data keys =', Object.keys(data));
    console.error('[DEBUG] getSchedule: full response =', JSON.stringify(data, null, 2));

    const weekKey = Object.keys(data).find((k) => !isNaN(Number(k)));

    if (!weekKey) {
      console.error('[ERROR] Week not found in response. Available keys:', Object.keys(data));
      throw new Error("Week not found");
    }

    console.error('[DEBUG] getSchedule: weekKey =', weekKey);

    const weekData = data[weekKey];
    
    if (!weekData || typeof weekData !== 'object') {
      console.error('[ERROR] weekData is invalid:', weekData);
      throw new Error("Invalid week data structure");
    }

    const schedules: ScheduleDTO[] = [];

    for (const [dayKey, rawLessons] of Object.entries(weekData)) {
      console.error('[DEBUG] Processing day:', dayKey);
      
      if (!rawLessons || typeof rawLessons !== 'object') {
        console.warn(`[WARN] Skipping day ${dayKey}: rawLessons is invalid`, rawLessons);
        continue;
      }

      const lessons = Object.entries(rawLessons as any).map(
        ([lessonNumber, lesson]: any) => ({
          lesson_number: Number(lessonNumber),
          lesson_name: lesson.name ?? "",
          lesson_type: lesson.type ?? "",
          teacher: lesson.teacher ?? "",
          classroom: lesson.classroom ?? "",
        })
      );

      schedules.push({
        semester: data.semester ?? "",
        week: Number(weekKey),
        weekType: ((Number(weekKey) - 1) % 4 + 4) % 4,
        dayOfWeek: mapDay(dayKey),
        lessons,
      });
    }

    console.error('[DEBUG] getSchedule: successfully parsed', schedules.length, 'days');
    return schedules;
  } catch (e) {
    console.error('[ERROR] getSchedule failed with error:', e);
    throw handleAxiosError(e, { functionName: 'getSchedule' });
  }
};

const mapDay = (day: string): Day => {
  const map: Record<string, Day> = {
    monday: Day.Monday,
    tuesday: Day.Tuesday,
    wednesday: Day.Wednesday,
    thursday: Day.Thursday,
    friday: Day.Friday,
    saturday: Day.Saturday,
    sunday: Day.Sunday,
  };

  const result = map[day.toLowerCase()];

  if (!result) {
    throw new Error(`Неизвестный день недели: ${day}`);
  }

  return result;
};

const handleAxiosError = (e: unknown, context?: { tgId?: number, functionName?: string }): Error => {
  const timestamp = new Date().toISOString();
  
  if (axios.isAxiosError(e)) {
    const status = e.response?.status;
    const url = e.config?.url;
    const baseURL = e.config?.baseURL;
    const method = e.config?.method?.toUpperCase();
    const responseData = e.response?.data;
    const fullUrl = baseURL ? `${baseURL}${url}` : url;
    const headers = e.config?.headers;
    const authHeaderValue = headers?.Authorization;
    const authHeader = typeof authHeaderValue === 'string' ?
      `${authHeaderValue.substring(0, 15)}...` : 'none';
    const errorCode = e.code;
    const errorMessage = e.message;
    
    console.error(`[${timestamp}] API Error:`, {
      method,
      fullUrl,
      baseURL,
      endpoint: url,
      status,
      errorCode,
      errorMessage,
      context,
      authHeaderPreview: authHeader,
      responseData,
      stack: e.stack?.split('\n').slice(0, 3).join(' ')
    });

    // Детальное логирование для сетевых ошибок
    if (errorCode === 'ETIMEDOUT' || errorCode === 'ECONNREFUSED' || errorCode === 'ENETUNREACH') {
      console.error(`[${timestamp}] Сетевая ошибка: ${errorCode} - ${errorMessage}`);
      console.error(`[${timestamp}] Целевой сервер: ${baseURL}`);
      console.error(`[${timestamp}] Порт: 443 (HTTPS)`);
    }

    switch (status) {
      case 400:
        return new Error("Некорректный запрос к API");
      case 401:
        return new Error("Неверный токен авторизации");
      case 403:
        return new Error("Доступ запрещен");
      case 404:
        return new Error(`Ресурс не найден: ${url}`);
      case 405:
        return new Error("Метод не поддерживается");
      case 410:
        return new Error("API устарел");
      case 500:
      case 502:
      case 503:
      case 504:
        return new Error("Сервер API временно недоступен");
      default:
        // Для сетевых ошибок (status undefined) возвращаем более информативное сообщение
        if (errorCode === 'ETIMEDOUT') {
          return new Error(`Таймаут соединения с сервером ORIOKS: ${errorMessage}`);
        } else if (errorCode === 'ECONNREFUSED') {
          return new Error(`Сервер ORIOKS отказал в соединении: ${errorMessage}`);
        } else if (errorCode === 'ENETUNREACH') {
          return new Error(`Сеть недоступна: ${errorMessage}`);
        }
        return new Error(`Ошибка API (${status ?? errorCode ?? "unknown"}): ${errorMessage}`);
    }
  }

  console.error(`[${timestamp}] Non-Axios error:`, e);
  if (e instanceof Error) {
    console.error(`[${timestamp}] Non-Axios error message: ${e.message}`);
    console.error(`[${timestamp}] Non-Axios error stack: ${e.stack}`);
    // Если это ошибка валидации Zod, выведем детали
    if ('errors' in e && Array.isArray((e as any).errors)) {
      console.error(`[${timestamp}] Zod validation errors:`, (e as any).errors);
    }
  }
  return new Error("Неизвестная ошибка при обращении к API");
};