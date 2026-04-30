import { Prisma, User } from '@prisma/client';
import prisma from './db';

export const createUser = async ( tgId: number, token: string ): Promise<User> => {
  try {
    return await prisma.user.create({
      data: {
        tgId,
        token
      }
    });
  } catch (e) {
    console.error("Ошибка создания пользоваля: ", e);
    throw new Error("Ошибка базы данных");
  }
};

export const userExists = async ( tgId: number ): Promise<boolean> => {
  try {
    const user = await prisma.user.findUnique({
      where: { tgId },
      select: {
        tgId: true
      }
    });

    return Boolean(user);
  } catch (e) {
      console.error("Ошибка получения пользоваля: ", e);
      throw new Error("Ошибка базы данных");
  }
};

export const getTokenByTgId = async ( tgId: number ): Promise<string | null> => {
  try {
    const user = await prisma.user.findUnique({
      where: { tgId },
      select: {
        token: true,
      }
    });

    return user?.token ?? null;
  } catch (e) {
    console.error("Ошибка получения токена: ", e);
    throw new Error("Ошибка базы данных");
  }
};