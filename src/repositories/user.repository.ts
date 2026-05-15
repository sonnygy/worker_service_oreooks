import prisma from '../config/db';

export const getTokenByTgId = async (tg_id: number): Promise<string | null> => {
  try {
    const user = await prisma.user.findUnique({
      where: { tg_id },
      select: {
        token: true,
      },
    });

    return user?.token ?? null;
  } catch (e) {
    console.error("Ошибка получения токена: ", e);
    throw new Error("Ошибка базы данных");
  }
};