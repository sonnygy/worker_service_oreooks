import axios from 'axios';
import {ORIOKS_GROUP_URL, ORIOKS_LESSONS_TYPE, ORIOKS_WEEK_TYPE} from '../config/worker.config.js';
import { createTokenHeader } from '../utils/worker.js';
import type { ScheduleDTO, LessonDTO } from '../models/worker.model.js';
import { Day } from '@prisma/client'

export const getSemesterStart = async (token:string) => {
    const tokenHeader = createTokenHeader(token);
    try { 
        const response = await axios.get(ORIOKS_WEEK_TYPE, {
        headers: {
            'Accept': 'application/json',
            'Authorization': tokenHeader,
            'User-Agent': 'bot_oreooks/0.1'
        }});

        return response.data.semester_start;
    } catch(e: any) {
        if (e.response.status=== 400) {
            throw new Error('Отсутствует или недопустимый заголовк или ключ');
        }
        if (e.response.status=== 401) {
            throw new Error('Несуществующий или аннулированный токен');
        }
        if (e.response.status=== 404) {
            throw new Error('Отсутствует ресурс по данному URI');
        }
        if (e.response.status=== 405) {
            throw new Error('Несуществующий или аннулированный токен');
        }
        if (e.response.status=== 410) {
            throw new Error('Данная версия API устарела');
        }
        throw e;
    }
};
export const getWeek = async (token:string) => {
    const semesterStart = await getSemesterStart(token);
    const now = new Date();
    const date = new Date(semesterStart);
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
};
export const getWeekType = async (token:string) => {
    const week = await getWeek(token);
    return (week - 1) % 4;
};
export const getLessonTime = async (token:string) => {
    const tokenHeader = createTokenHeader(token);
    try { 
        const response = await axios.get(ORIOKS_LESSONS_TYPE, {
        headers: {
            'Accept': 'application/json',
            'Authorization': tokenHeader,
            'User-Agent': 'bot_oreooks/0.1'
        }});
    return response.data;
    } catch(e: any) {
        if (e.response.status=== 400) {
            throw new Error('Отсутствует или недопустимый заголовк или ключ');
        }
        if (e.response.status=== 401) {
            throw new Error('Несуществующий или аннулированный токен');
        }
        if (e.response.status=== 404) {
            throw new Error('Отсутствует ресурс по данному URI');
        }
        if (e.response.status=== 405) {
            throw new Error('Несуществующий или аннулированный токен');
        }
        if (e.response.status=== 410) {
            throw new Error('Данная версия API устарела');
        }
        throw e;
    }
};
export const getIdGroup = async (token:string) => {
    const tokenHeader = createTokenHeader(token);
    try { 
        const response = await axios.get(ORIOKS_GROUP_URL, {
        headers: {
            'Accept': 'application/json',
            'Authorization': tokenHeader,
            'User-Agent': 'bot_oreooks/0.1'
        }});
    return response.data.id;
    } catch(e: any) {
        if (e.response.status=== 400) {
            throw new Error('Отсутствует или недопустимый заголовк или ключ');
        }
        if (e.response.status=== 401) {
            throw new Error('Несуществующий или аннулированный токен');
        }
        if (e.response.status=== 404) {
            throw new Error('Отсутствует ресурс по данному URI');
        }
        if (e.response.status=== 405) {
            throw new Error('Несуществующий или аннулированный токен');
        }
        if (e.response.status=== 410) {
            throw new Error('Данная версия API устарела');
        }
        throw e;
    }
};
export const getSchedule = async (token: string): Promise<ScheduleDTO[]> => {
    const tokenHeader = createTokenHeader(token);
    const idGroup = await getIdGroup(token);
    try { 
        const { data } = await axios.get(`${ORIOKS_GROUP_URL}/${idGroup}`, {
        headers: {
            'Accept': 'application/json',
            'Authorization': tokenHeader,
            'User-Agent': 'bot_oreooks/0.1'
        }});
        const weekKey = Object
        .keys(data)
        .find(k => !isNaN(Number(k)));

        if (!weekKey) {
            throw new Error("Week not found");
        }

        const weekData = data[weekKey];

        const schedules: ScheduleDTO[] =
            Object.entries(weekData).map(
                ([dayKey, rawLessons]: any) => {

                const lessons: LessonDTO[] =
                    Object.entries(rawLessons).map(
                    ([lessonNumber, lesson]: any) => ({
                        lesson_number:Number(lessonNumber),
                        lesson_name:lesson.name,
                        lesson_type:lesson.type,
                        teacher:lesson.teacher,
                        classroom:lesson.classroom
                    })
                    );

                return {
                    semester:data.semester,
                    week:Number(weekKey),
                    weekType:Number(weekKey),
                    dayOfWeek:dayKey as Day,
                    lessons
                };
                }
            );

        return schedules;

    } catch(e: any) {
        if (e.response.status=== 400) {
            throw new Error('Отсутствует или недопустимый заголовк или ключ');
        }
        if (e.response.status=== 401) {
            throw new Error('Несуществующий или аннулированный токен');
        }
        if (e.response.status=== 404) {
            throw new Error('Отсутствует ресурс по данному URI');
        }
        if (e.response.status=== 405) {
            throw new Error('Несуществующий или аннулированный токен');
        }
        if (e.response.status=== 410) {
            throw new Error('Данная версия API устарела');
        }
        throw e;
    }
};
