import type { Request, Response } from 'express'
import * as scheduleService from '../services/orioks.schedule.service.js';
import * as scheduleDb from '../repositoryes/schedule.repository.js';
import * as userRepo from '../repositoryes/user.repository.js'
import * as worker from '../utils/worker.js'

export const getSchedule = async ( req:Request, res:Response) => {
 try {
   const tgId = Number(req.body.tgId);

   const userExists = await userRepo.userExists(tgId);

   if (!userExists){
      return res.status(404).json({ message:"User not found" });
   }

   const token = await userRepo.getTokenByTgId(tgId);

   if (!token){
      return res.status(404).json({ message:"Token not found" });
   }

   const exists = await scheduleDb.scheduleExist(tgId);

   if (!exists){
      const schedules = await scheduleService.getSchedule(token);
      await scheduleDb.createSchedules(tgId,schedules);
   }

   const weekType = await scheduleService.getWeekType( token );

   const schedule = await scheduleDb.getScheduleWeek( tgId, weekType);

   return res.json(schedule);
 } catch(e){
    return res.status(500).json({ message:"Server error" });
 }
};

export const getScheduleDay = async ( req:Request, res:Response ) => {

 try{
  const tgId = Number(req.body.tgId);

  const type = req.query.type || "today";

  const userExists = await userRepo.userExists(tgId);

  if(!userExists){
    return res.status(404).json({message:"User not found"});
  }

  const token =await userRepo.getTokenByTgId(tgId);

  if(!token){
    return res.status(404).json({message:"Token not found"});
  }

  const weekType =await scheduleService.getWeekType(token);

  const day = type === "tomorrow"? worker.getTomorrowDay(): worker.getTodayDay();

  const schedule = await scheduleDb.getScheduleToday(tgId,weekType,day);

  return res.json(schedule);
 }
 catch(e){

   return res.status(500).json({
      message:"Server error"
   });

 }

};
