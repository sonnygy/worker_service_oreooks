import { Day } from "@prisma/client";

export function createTokenHeader(token: string): string {
  return `Bearer ${token}`;
}

const days: Day[] = [
  Day.Monday,
  Day.Tuesday,
  Day.Wednesday,
  Day.Thursday,
  Day.Friday,
  Day.Saturday,
  Day.Sunday,
];

const normalizeIndex = (index: number) => ((index % 7) + 7) % 7;

const getDayByOffset = (offset = 0): Day => {
  let jsDay = new Date().getDay(); 
  jsDay = jsDay === 0 ? 6 : jsDay - 1;

  const index = normalizeIndex(jsDay + offset);

  return days[index] as Day;
};

export const getTodayDay = () => getDayByOffset();
export const getTomorrowDay = () => getDayByOffset(1);
export const getYesterdayDay = () => getDayByOffset(-1);