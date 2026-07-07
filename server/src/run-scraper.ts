import dotenv from "dotenv";
dotenv.config();

import connectDB from "./config/db";
import { scrapeIndeed } from "./scrapers/indeed.scraper";

function randomDelay(min: number, max: number) {
  const delay = Math.floor(Math.random() * (max - min) + min);
  return new Promise(resolve => setTimeout(resolve, delay));
}

async function run() {
  await connectDB();

  console.log("=== Scraping Frontend Developer jobs ===");
  await scrapeIndeed("frontend developer react", "Remote", "frontend");

  //middile of category scraping, we need to wait sometime to avoid cloudflare detection
  console.log("Waiting before next search...");
  await randomDelay(15000, 25000); // 15-25 sec gap

  console.log("=== Scraping Backend Developer jobs ===");
  await scrapeIndeed("backend developer node.js", "Remote", "backend");

  await randomDelay(15000, 25000);

  console.log("=== Scraping Full Stack Developer jobs ===");
  await scrapeIndeed("full stack developer", "Remote", "fullstack");

  process.exit(0);
}

run();