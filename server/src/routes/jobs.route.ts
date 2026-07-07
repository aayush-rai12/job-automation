import { Router } from "express";
import { getJobs, getJobById, updateJobStatus, createJob } from "../controllers/jobs.controller";

const router = Router();

router.post("/", createJob);
router.get("/", getJobs);
router.get("/:id", getJobById);
router.patch("/:id/status", updateJobStatus);

export default router;