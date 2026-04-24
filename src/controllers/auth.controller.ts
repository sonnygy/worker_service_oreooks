import type { Request, Response } from "express";
import * as userService from '../services/orioks.auth.service.js';
import * as user from '../repositoryes/user.repository.js';

export const createUser = async (req:Request, res:Response) => {
  try {
    const { tgId, login, password } = req.body;

    const token = await userService.getToken(login, password);
    await user.createUser(tgId, token);

    return res.status(201).json({
      message: "User created"
    });

  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Error creating user"
    });
  }
};