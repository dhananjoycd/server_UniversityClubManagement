import { Router } from "express";

import accountRouter from "../modules/account/account.route";
import applicationRouter from "../modules/applications/application.route";
import committeeRouter from "../modules/committee/committee.route";
import dashboardRouter from "../modules/dashboard/dashboard.route";
import eventRouter from "../modules/events/event.route";
import memberRouter from "../modules/members/member.route";
import noticeRouter from "../modules/notices/notice.route";
import registrationRouter from "../modules/registrations/registration.route";
import settingRouter from "../modules/settings/setting.route";
import testimonialRouter from "../modules/testimonials/testimonial.route";
import uploadRouter from "../modules/uploads/upload.route";
import userRouter from "../modules/users/user.route";

const router = Router();

router.use("/account", accountRouter);
router.use("/applications", applicationRouter);
router.use("/members", memberRouter);
router.use("/events", eventRouter);
router.use("/registrations", registrationRouter);
router.use("/notices", noticeRouter);
router.use("/dashboard", dashboardRouter);
router.use("/settings", settingRouter);
router.use("/uploads", uploadRouter);
router.use("/users", userRouter);
router.use("/testimonials", testimonialRouter);
router.use("/committee", committeeRouter);

export default router;
