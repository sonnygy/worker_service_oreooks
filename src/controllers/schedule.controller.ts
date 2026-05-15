import type { Request, Response } from 'express'
import * as scheduleService from '../services/orioks.schedule.service';
import * as scheduleDb from '../repositories/schedule.repository';
import * as userRepository from '../repositories/user.repository'
import * as scheduleUtils from '../utils/schedule'
import { UserTgIdSchema, UserTgIdTypeDaySchema} from '../schemas/schedule.schema'
import { Day } from '@prisma/client';
import prisma from '../config/db';

const getStudentGroupId = async (tgId: number): Promise<number> => {
  let student = await prisma.student.findFirst({
    where: { userId: tgId },
    select: { groupId: true, groupName: true }
  });
  
  if (!student) {
    const token = await userRepository.getTokenByTgId(tgId);
    if (!token) {
      throw new Error(`Студент с tgId=${tgId} не найден и токен отсутствует`);
    }
    
    let studentInfo = null;
    try {
      studentInfo = await scheduleService.getStudentInfo(token);
    } catch (error) {
      console.warn(`Не удалось получить информацию о студенте tgId=${tgId}:`, error);
      try {
        const groupIdStr = await scheduleService.getIdGroup(token);
        studentInfo = {
          group: groupIdStr,
          course: 1,
          department: '',
          full_name: '',
          record_book_id: 0,
          semester: 1,
          study_direction: '',
          study_profile: '',
          year: new Date().getFullYear().toString()
        };
      } catch (groupError) {
        console.error(`Не удалось получить группу для tgId=${tgId}:`, groupError);
        studentInfo = {
          group: 'unknown',
          course: 1,
          department: '',
          full_name: '',
          record_book_id: 0,
          semester: 1,
          study_direction: '',
          study_profile: '',
          year: new Date().getFullYear().toString()
        };
      }
    }
    
    student = await prisma.student.create({
      data: {
        userId: tgId,
        groupName: studentInfo.group,
        course: studentInfo.course,
        department: studentInfo.department,
        full_name: studentInfo.full_name,
        record_book_id: studentInfo.record_book_id,
        semester: studentInfo.semester,
        study_direction: studentInfo.study_direction,
        study_profile: studentInfo.study_profile,
        year: studentInfo.year,
        groupId: null,
      },
      select: { groupId: true, groupName: true }
    });
  }
  
  if (!student.groupId) {
    if (!student.groupName) {
      throw new Error(`У студента tgId=${tgId} не указана группа`);
    }
    const groupId = await scheduleDb.getOrCreateGroup(student.groupName);
    await scheduleDb.updateStudentGroup(tgId, student.groupName);
    return groupId;
  }
  
  return student.groupId;
};

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

   const groupId = await getStudentGroupId(tg_id);

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

export const getScheduleByDate = async (req: Request, res: Response) => {
  try {
    const { tgId, date } = req.params;
    
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ message: "Дата обязательна" });
    }
    
    const tgIdNum = Number(tgId);
    
    if (isNaN(tgIdNum)) {
      return res.status(400).json({ message: "Некорректный tgId" });
    }
    
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ message: "Некорректная дата" });
    }
    
    const token = await userRepository.getTokenByTgId(tgIdNum);
    
    if (!token) {
      return res.status(404).json({ message: "Token not found" });
    }
    
    const groupId = await getStudentGroupId(tgIdNum);
    
    const scheduleExists = await scheduleDb.scheduleExist(tgIdNum);
    
    if (!scheduleExists) {
      const schedules = await scheduleService.getSchedule(token);
      await scheduleDb.createSchedules(tgIdNum, schedules);
    }
    
    const semesterStart = await scheduleService.getSemesterStart(token);
    const startDate = new Date(semesterStart);
    
    const diffTime = targetDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const week = Math.floor(diffDays / 7) + 1;
    const weekType = ((week - 1) % 4 + 4) % 4;
    
    const dayOfWeekIndex = targetDate.getDay();
    const dayMap: Day[] = [
      Day.Sunday, Day.Monday, Day.Tuesday, Day.Wednesday,
      Day.Thursday, Day.Friday, Day.Saturday
    ];
    const dayOfWeek = dayMap[dayOfWeekIndex];
    
    if (!dayOfWeek) {
      return res.status(500).json({ message: "Ошибка определения дня недели" });
    }
    
    const schedule = await scheduleDb.getScheduleToday(tgIdNum, weekType, dayOfWeek);
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Расписание на указанную дату не найдено"
      });
    }
    
    return res.json({
      success: true,
      schedule
    });
  } catch (e) {
    console.error('Error in getScheduleByDate:', e);
    return res.status(500).json({ message: "Server error" });
  }
};
