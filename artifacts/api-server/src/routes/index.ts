import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sapRouter from "./sap";
import ordersRouter from "./orders";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sapRouter);
router.use(ordersRouter);

export default router;
