import express from "express";
import jobsRouter from "./routes/jobs.route";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello, Server is running!");
});

app.use("/api/jobs", jobsRouter);

export default app;