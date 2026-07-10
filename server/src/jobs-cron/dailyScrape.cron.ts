import cron from 'node-cron';
import { scrapeIndeed } from '../scrapers/indeed.scraper';
import { sendJobDigest } from "../services/notify.service";

function randomDelay(min: number, max: number) {
  const delay = Math.floor(Math.random() * (max - min) + min);
  return new Promise(resolve => setTimeout(resolve, delay));
}

async function runFullScrapeCycle() {
  console.log(`\n[CRON] Starting scrape cycle at ${new Date().toLocaleString()}`);
  try {
    console.log("=== Scraping Frontend Developer jobs ===");
    const frontendResult = await scrapeIndeed("frontend developer react", "India", "frontend");

    await randomDelay(15000, 25000);

    console.log("=== Scraping Backend Developer jobs ===");
    const backendResult = await scrapeIndeed("backend developer node.js", "India", "backend");

    await randomDelay(15000, 25000);

    console.log("=== Scraping Full Stack Developer jobs ===");
    const fullstackResult = await scrapeIndeed("full stack developer", "India", "fullstack");

    console.log(`[CRON] Scrape cycle completed at ${new Date().toLocaleString()}\n`);

    const allNewJobs = [
      ...frontendResult.newlySavedJobs,
      ...backendResult.newlySavedJobs,
      ...fullstackResult.newlySavedJobs,
    ];

    const highMatchJobs = allNewJobs.filter((j: any) => j.matchScore >= 40);

    console.log(`Found ${highMatchJobs.length} new high-match jobs out of ${allNewJobs.length} newly saved`);

    await sendJobDigest(
      highMatchJobs.map((j: any) => ({
        title: j.title,
        company: j.company,
        location: j.location,
        matchScore: j.matchScore,
        jobUrl: j.jobUrl,
        category: j.category,
      }))
    );
  } catch (error) {
    console.error("[CRON] Error during scrape cycle:", error);
  }
}

export function startCronJobs() {
  cron.schedule("50 9 * * *", () => {
    console.log("Running morning job 9:50 AM...");
    runFullScrapeCycle();
  });

  cron.schedule("50 13 * * *", () => {
    console.log("Running afternoon job 1:50 PM...");
    runFullScrapeCycle();
  });

  cron.schedule("30 18 * * *", () => {
    console.log("Running evening job 6:30 PM...");
    runFullScrapeCycle();
  });

  console.log("Cron jobs scheduled: 9:50 AM, 1:50 PM, and 6:30 PM daily");
}

export { runFullScrapeCycle };