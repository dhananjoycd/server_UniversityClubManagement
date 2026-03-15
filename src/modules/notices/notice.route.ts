import { Router } from "express";

import authMiddleware from "../../middlewares/auth.middleware";
import roleMiddleware, { ADMIN_ROLES } from "../../middlewares/role.middleware";
import validateRequest from "../../middlewares/validateRequest";
import { noticeController } from "./notice.controller";
import { createNoticeSchema, noticeListQuerySchema, updateNoticeSchema } from "./notice.validation";

const noticeRouter = Router();

noticeRouter.use(authMiddleware);
noticeRouter.get("/", validateRequest(noticeListQuerySchema, "query"), noticeController.getNotices);
noticeRouter.get("/:id", noticeController.getNoticeById);
noticeRouter.post(
  "/",
  roleMiddleware(...ADMIN_ROLES),
  validateRequest(createNoticeSchema),
  noticeController.createNotice,
);
noticeRouter.patch(
  "/:id",
  roleMiddleware(...ADMIN_ROLES),
  validateRequest(updateNoticeSchema),
  noticeController.updateNotice,
);
noticeRouter.delete("/:id", roleMiddleware(...ADMIN_ROLES), noticeController.deleteNotice);

export default noticeRouter;
