import { Request, Response } from "express";
import Job from "../models/Job";
import { calculateMatchScore } from "../services/scoring.service";

export const getJobs = async (req: Request, res: Response) => {
  try {
    const { status, minScore, source, category } = req.query;
    const filter: any = {};

    if (status) filter.status = status;
    if (source) filter.source = source;
    if(category) filter.category = category;
    if (minScore) filter.matchScore = { $gte: Number(minScore) };

    const jobs = await Job.find(filter).sort({ scrapedAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
};

export const getJobById = async (req: Request, res: Response) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch job" });
  }
};

export const updateJobStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: "Failed to update status" });
  }
};

// POST /api/jobs - create a new job with auto-calculated score
export const createJob = async (req: Request, res: Response) => {
  try {
    const jobData = req.body;
    
    const matchScore = calculateMatchScore({
      skillsRequired: jobData.skillsRequired || [],
      experienceMin: jobData.experienceMin,
      experienceMax: jobData.experienceMax,
      salaryMin: jobData.salaryMin,
      salaryMax: jobData.salaryMax,
    });

    const job = await Job.create({ ...jobData, matchScore });
    res.status(201).json(job);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "Job already exists (duplicate URL)" });
    }
    res.status(500).json({ error: "Failed to create job" });
  }
};