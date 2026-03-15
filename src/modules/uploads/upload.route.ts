import { Router } from "express";

import upload from "../../config/multer";
import authMiddleware from "../../middlewares/auth.middleware";
import { uploadController } from "./upload.controller";

const uploadRouter = Router();

uploadRouter.post("/image", authMiddleware, upload.single("file"), uploadController.uploadImage);

export default uploadRouter;

