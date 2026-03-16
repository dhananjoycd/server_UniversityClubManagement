import { Router } from "express";

import authMiddleware from "../../middlewares/auth.middleware";
import validateRequest from "../../middlewares/validateRequest";
import { accountController } from "./account.controller";
import { updateAccountProfileSchema } from "./account.validation";

const accountRouter = Router();

accountRouter.use(authMiddleware);
accountRouter.get("/profile", accountController.getAccountProfile);
accountRouter.patch("/profile", validateRequest(updateAccountProfileSchema), accountController.updateAccountProfile);

export default accountRouter;
