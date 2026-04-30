import type { Request, Response } from "express";
import { AuthRequestSchema } from "../schemas/user.schema";
import * as UserService from '../services/orioks.auth.service';
import * as UserRepository  from '../repositoryes/user.repository';

export const authUser = async (req:Request, res:Response) => {
  try {
    const parsed = AuthRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Некорректные данные",
        errors: parsed.error.flatten().fieldErrors
      });
    }

    const { login, password, tg_id } = parsed.data;

    if (! await UserRepository.userExists(tg_id)) {
      const token = await UserService.getToken(login, password);

      await UserRepository.createUser(tg_id, token);

      return res.status(201).json({ message: "Пользователь создан"});
    }

    return res.status(200).json({
      success: true,
      message: "Пользователь уже существует"
    });
  } catch (error: unknown) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Error creating user"    
    });
  }
};