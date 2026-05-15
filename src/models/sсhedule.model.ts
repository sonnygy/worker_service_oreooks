import { Day } from "@prisma/client";

export const weekType = {
  0: "1ч",
  1: "1з",
  2: "2ч",
  3: "2з",
};

export type ScheduleDTO = {
  semester: string,
  week: number,
  weekType: number,
  dayOfWeek: Day,
  lessons: LessonDTO[]
};

export type LessonDTO = {
  lesson_number: number,
  lesson_name: string,
  lesson_type: string,
  teacher: string,
  classroom: string
};
