import prisma from "./db";
import { Day } from "@prisma/client";
import type { ScheduleDTO } from "../models/sсhedule.model";

export const createSchedule = async (
  tg_id: number,
  schedule: ScheduleDTO
) => {
  return prisma.schedule.create({
    data: {
      tg_id,
      semester: schedule.semester,
      week: schedule.week,
      weekType: schedule.weekType,
      dayOfWeek: schedule.dayOfWeek,
      lessons: {
        create: schedule.lessons,
      },
    },
    include: {
      lessons: true,
    },
  });
};

export const createSchedules = async (
  tg_id: number,
  schedules: ScheduleDTO[]
) => {
  return Promise.all(
    schedules.map((schedule) => createSchedule(tg_id, schedule))
  );
};

export const getScheduleWeek = async (tg_id: number, weekType: number) => {
  return prisma.schedule.findMany({
    where: { tg_id, weekType },
    include: { lessons: true },
    orderBy: [{ dayOfWeek: "asc" }],
  });
};

export const getScheduleToday = async (
  tg_id: number,
  weekType: number,
  dayOfWeek: Day
) => {
  return prisma.schedule.findFirst({
    where: { tg_id, weekType, dayOfWeek },
    include: {
      lessons: {
        orderBy: {
          lesson_number: "asc",
        },
      },
    },
  });
};

export const scheduleExist = async (tg_id: number): Promise<boolean> => {
  const schedule = await prisma.schedule.findFirst({
    where: { tg_id },
    select: {
      tg_id: true,
    },
  });

  return !!schedule;
};