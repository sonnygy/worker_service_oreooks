import type { Request, Response } from 'express'
import * as scheduleService from '../services/orioks.schedule.service';
import * as scheduleDb from '../repositories/schedule.repository';
import * as userRepository from '../repositories/user.repository'
import * as scheduleUtils from '../utils/schedule'
import { UserTgIdSchema, UserTgIdTypeDaySchema} from '../schemas/schedule.schema'

export const getSchedule = async ( req:Request, res:Response) => {
 try {
   const parsed = await UserTgIdSchema.safeParse(req.body.data);

   if (!parsed.success) {
      throw new Error("Некорректный ответ от BOT OREOOKS");
   }

   const tg_id = Number(parsed.data.tg_id);

   const token = await userRepository.getTokenByTgId(tg_id);

   if (!token){
      return res.status(404).json({ message:"Token not found" });
   }

   const scheduleExist = await scheduleDb.scheduleExist(tg_id);

   if (!scheduleExist){
      const schedules = await scheduleService.getSchedule(token);
      await scheduleDb.createSchedules(tg_id, schedules);
   }

   const weekType = await scheduleService.getWeekType( token );
   const schedule = await scheduleDb.getScheduleWeek( tg_id, weekType);

   return res.json(schedule);
 } 
 catch(e){
    return res.status(500).json({ message:"Server error" });
 }
};

export const getScheduleDay = async ( req:Request, res:Response ) => {

   try {
      
      const parsed = await UserTgIdTypeDaySchema.safeParse(req.body.data);

      if (!parsed.success) {
         throw new Error("Некорректный ответ от BOT OREOOKS");
      }

      const {tg_id, type_day} = parsed.data;

      const tgId = Number(tg_id);

      const type = type_day || "today";

      const token = await userRepository.getTokenByTgId(tgId);

      if(!token){
         return res.status(404).json({message:"Token not found"});
      }

      const weekType = await scheduleService.getWeekType(token);

      const day = type === "tomorrow"? scheduleUtils.getTomorrowDay(): scheduleUtils.getTodayDay();

      const schedule = await scheduleDb.getScheduleToday(tgId,weekType,day);

      return res.json(schedule);
   }
   catch(e){
      return res.status(500).json({ message:"Server error"});
   }
};
