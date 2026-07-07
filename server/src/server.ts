import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import connectDB from "./config/db";
import { startCronJobs } from "./jobs-cron/dailyScrape.cron";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Start the cron jobs after the server has started
  startCronJobs();

  process.on("SIGINT", async () => {
    console.log("SIGINT received. Shutting down...");
    await import("mongoose").then((mongoose) =>
      mongoose.connection.close()
    );
    server.close(() => {
      console.log("Server closed gracefully");
      process.exit(0);
    });
  });
};

startServer();