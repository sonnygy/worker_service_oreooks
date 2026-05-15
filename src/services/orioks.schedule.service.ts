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
    throw handleAxiosError(e);
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

export const getIdGroup = async (token: string): Promise<string> => {
  const api = createApi(token);

  try {
    const { data } = await api.get("/api/v1/schedule/groups");

    const parsed = GroupIdSchema.safeParse(data);

    if (!parsed.success) {
      throw new Error("Некорректный ответ от API ORIOKS");
    }

    return String(parsed.data.id);
  } catch (e) {
    throw handleAxiosError(e);
  }
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
    const { data } = await api.get("/api/v1/student");

    const parsed = StudentSchema.safeParse(data);

    if (!parsed.success) {
      throw new Error("Некорректный ответ от API ORIOKS (студент)");
    }

    return parsed.data;
  } catch (e) {
    throw handleAxiosError(e);
  }
};

export const getLessonTime = async (token: string): Promise<any> => {
  const api = createApi(token);

  try {
    const { data } = await api.get("/api/v1/schedule/timetable");
    return data;
  } catch (e) {
    throw handleAxiosError(e);
  }
};

export const getSchedule = async (token: string): Promise<ScheduleDTO[]> => {
  const api = createApi(token);
  const idGroup = await getIdGroup(token);

  try {
    const { data } = await api.get(`/api/v1/schedule/groups/${idGroup}`);

    const weekKey = Object.keys(data).find((k) => !isNaN(Number(k)));

    if (!weekKey) throw new Error("Week not found");

    const weekData = data[weekKey];

    const schedules: ScheduleDTO[] = [];

    for (const [dayKey, rawLessons] of Object.entries(weekData)) {
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

    return schedules;
  } catch (e) {
    throw handleAxiosError(e);
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

const handleAxiosError = (e: unknown): Error => {
  if (axios.isAxiosError(e)) {
    const status = e.response?.status;
    const url = e.config?.url;
    const method = e.config?.method?.toUpperCase();
    const responseData = e.response?.data;
    
    console.error(`API Error: ${method} ${url} - Status: ${status}`);
    console.error('Response data:', responseData);
    console.error('Full error:', e.message);

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
        return new Error(`Ошибка API (${status ?? "unknown"}): ${e.message}`);
    }
  }

  console.error('Non-Axios error:', e);
  return new Error("Неизвестная ошибка при обращении к API");
};