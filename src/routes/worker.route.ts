import { Router } from "express";
import { authUser } from "../controllers/auth.controller";
import { getSchedule, getScheduleDay } from '../controllers/schedule.controller'
const router = Router();

router.get("/auth", authUser );
router.get("/users/:tgId/schedule/", getSchedule);
router.get("/users/:tgId/schedule/today", getScheduleDay);
router.get("/users/:tgId/schedule/tomorrow", (req,res) => {
    req.query.type="tomorrow";
    return getScheduleDay(req,res);
});

export default router;