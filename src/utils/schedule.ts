import { Day } from "@prisma/client";

export function createTokenHeader(token: string): string {
  return `Bearer ${token}`;
}

const days: Day[] = [
  Day.MONDAY,
  Day.TUESDAY,
  Day.WEDNESDAY,
  Day.THURSDAY,
  Day.FRIDAY,
  Day.SATURDAY,
  Day.SUNDAY,
];

const normalizeIndex = (index: number) => ((index % 7) + 7) % 7;

const getDayByOffset = (offset = 0): Day => {
  let jsDay = new Date().getDay(); 
  jsDay = jsDay === 0 ? 6 : jsDay - 1;

  const index = normalizeIndex(jsDay + offset);

  return days[index];
};

export const getTodayDay = () => getDayByOffset();
export const getTomorrowDay = () => getDayByOffset(1);
export const getYesterdayDay = () => getDayByOffset(-1);