import mongoose, { Schema, Document } from "mongoose";

export interface IJob extends Document {
  title: string;
  company: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  jobUrl: string;
  source: "indeed" | "naukri" | "linkedin";
  category: "frontend" | "backend" | "fullstack";
  description?: string;
  skillsRequired: string[];
  experienceMin?: number;
  experienceMax?: number;
  postedDate?: Date;
  scrapedAt: Date;
  matchScore: number;
  status: "new" | "shortlisted" | "applied" | "rejected" | "ignored";
}

const JobSchema = new Schema<IJob>({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  salaryMin: { type: Number },
  salaryMax: { type: Number },
  jobUrl: { type: String, required: true, unique: true },
  source: { type: String, enum: ["indeed", "naukri", "linkedin"], required: true },
  category: { type: String, enum: ["frontend", "backend", "fullstack"], required: true, default: "fullstack" },
  description: { type: String },
  skillsRequired: { type: [String], default: [] },
  experienceMin: { type: Number },
  experienceMax: { type: Number },
  postedDate: { type: Date },
  scrapedAt: { type: Date, default: Date.now },
  matchScore: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["new", "shortlisted", "applied", "rejected", "ignored"],
    default: "new",
  },
});

export default mongoose.model<IJob>("Job", JobSchema);