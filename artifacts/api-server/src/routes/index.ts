import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import designsRouter from "./designs.js";
import aiRouter from "./ai.js";
import projectsRouter from "./projects.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(designsRouter);
router.use(aiRouter);
router.use(projectsRouter);

export default router;
