import prisma from "../config/db";
import { Day } from "@prisma/client";
import type { ScheduleDTO } from "../models/sсhedule.model";

const getGroupIdByTgId = async (tgId: number): Promise<number | null> => {
  const student = await prisma.student.findFirst({
    where: { userId: tgId },
    select: { groupId: true }
  });
  
  return student?.groupId ?? null;
};

export const getOrCreateGroup = async (groupName: string): Promise<number> => {
  let group = await prisma.group.findUnique({
    where: { name: groupName }
  });
  
  if (!group) {
    group = await prisma.group.create({
      data: { name: groupName }
    });
  }
  
  return group.id;
};

export const updateStudentGroup = async (tgId: number, groupName: string): Promise<void> => {
  const groupId = await getOrCreateGroup(groupName);
  
  await prisma.student.updateMany({
    where: { userId: tgId },
    data: { 
      groupId,
      groupName 
    }
  });
};

export const createSchedule = async (groupId: number, schedule: ScheduleDTO) => {
  return prisma.schedule.create({
    data: {
      groupId,
      semester: schedule.semester,
      week: schedule.week,
      weekType: schedule.weekType,
      dayOfWeek: schedule.dayOfWeek,
      lessons: {
        create: schedule.lessons,
      },
    },
    include: { lessons: true },
  });
};

export const createSchedules = async (tgId: number, schedules: ScheduleDTO[]) => {
  const groupId = await getGroupIdByTgId(tgId);
  
  if (!groupId) {
    throw new Error(`Группа не найдена для пользователя tgId=${tgId}`);
  }
  
  return Promise.all(
    schedules.map((schedule) => createSchedule(groupId, schedule))
  );
};

export const getScheduleWeek = async (tgId: number, weekType: number) => {
  const groupId = await getGroupIdByTgId(tgId);
  
  if (!groupId) {
    return [];
  }
  
  return prisma.schedule.findMany({
    where: { groupId, weekType },
    include: { lessons: true },
    orderBy: [{ dayOfWeek: "asc" }],
  });
};

export const getScheduleToday = async (
  tgId: number,
  weekType: number,
  dayOfWeek: Day
) => {
  const groupId = await getGroupIdByTgId(tgId);
  
  if (!groupId) {
    return null;
  }
  
  return prisma.schedule.findFirst({
    where: { groupId, weekType, dayOfWeek },
    include: {
      lessons: {
        orderBy: { lesson_number: "asc" },
      },
    },
  });
};

export const scheduleExist = async (tg_id: number): Promise<boolean> => {
  const groupId = await getGroupIdByTgId(tg_id);
  
  if (!groupId) {
    return false;
  }
  
  const schedule = await prisma.schedule.findFirst({
    where: { groupId },
    select: { id: true },
  });

  return !!schedule;
};