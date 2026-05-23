import { Router, type Request, type Response } from "express";

import { authenticateToken, requireOwner } from "../middleware/auth";
import { billingController } from "../modules/billing/billing.controller";
import { menuController } from "../modules/menu/menu.controller";
import { ordersController } from "../modules/orders/orders.controller";
import { packagesController } from "../modules/packages/packages.controller";
import { unitsController } from "../modules/units/units.controller";
import { authController } from "../modules/users/auth.controller";

const authRouter = Router();
const billingRouter = Router();
const packagesRouter = Router();
const unitsRouter = Router();
const menuRouter = Router();
const ordersRouter = Router();
const smartPlugRouter = Router();
const usersRouter = Router();

authRouter.post("/login", authController.login);
authRouter.post("/register", authenticateToken, requireOwner, authController.register);

billingRouter.use(authenticateToken);
billingRouter.post("/start", billingController.startSession);
billingRouter.post("/stop/:sessionId", billingController.stopSession);
billingRouter.post("/extend/:sessionId", billingController.extendSession);
billingRouter.get("/active", billingController.getActiveSessions);
billingRouter.get("/logs", requireOwner, billingController.getSessionLogs);
billingRouter.delete("/logs/:sessionId", requireOwner, billingController.deleteSession);

packagesRouter.use(authenticateToken);
packagesRouter.get("/", packagesController.listPackages);
packagesRouter.post("/", requireOwner, packagesController.createPackage);
packagesRouter.put("/:id", requireOwner, packagesController.updatePackage);
packagesRouter.delete("/:id", requireOwner, packagesController.deletePackage);

unitsRouter.use(authenticateToken);
unitsRouter.get("/", unitsController.listUnits);
unitsRouter.post("/", requireOwner, unitsController.createUnit);
unitsRouter.put("/:id", requireOwner, unitsController.updateUnit);
unitsRouter.delete("/:id", requireOwner, unitsController.deleteUnit);
unitsRouter.get("/:unitId/smart-plug", requireOwner, unitsController.getSmartPlug);
unitsRouter.post("/:unitId/smart-plug", requireOwner, unitsController.saveSmartPlug);
unitsRouter.delete("/:unitId/smart-plug", requireOwner, unitsController.deleteSmartPlug);

menuRouter.use(authenticateToken);
menuRouter.get("/", menuController.listMenuItems);
menuRouter.post("/", requireOwner, menuController.createMenuItem);
menuRouter.put("/:id", requireOwner, menuController.updateMenuItem);
menuRouter.delete("/:id", requireOwner, menuController.deleteMenuItem);

ordersRouter.use(authenticateToken);
ordersRouter.post("/", ordersController.createOrder);
ordersRouter.put("/:id/status", ordersController.updateOrderStatus);
ordersRouter.get("/logs", requireOwner, ordersController.getOrderLogs);
ordersRouter.delete("/logs/:orderId", requireOwner, ordersController.deleteOrder);

smartPlugRouter.get("/", (_req: Request, res: Response) => {
  res.json({ module: "smart-plug", status: "ready" });
});

usersRouter.use(authenticateToken, requireOwner);
usersRouter.get("/", authController.listUsers);
usersRouter.post("/", authController.createUser);
usersRouter.put("/:id", authController.updateUser);
usersRouter.delete("/:id", authController.deleteUser);

export const apiRouter = Router()
  .use("/auth", authRouter)
  .use("/billing", billingRouter)
  .use("/packages", packagesRouter)
  .use("/units", unitsRouter)
  .use("/menu", menuRouter)
  .use("/orders", ordersRouter)
  .use("/smart-plug", smartPlugRouter)
  .use("/users", usersRouter);
