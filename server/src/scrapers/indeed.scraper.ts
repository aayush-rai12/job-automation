import { chromium } from "playwright";
import Job from "../models/Job";
import { calculateMatchScore } from "../services/scoring.service";

interface ScrapedJob {
  title: string;
  company: string;
  location: string;
  salary: string | null;
  jobUrl: string;
}

function parseSalary(salaryText: string | null): { min?: number; max?: number } {
  if (!salaryText) return {};
  const numbers = salaryText.match(/[\d,]+(\.\d+)?/g);
  if (!numbers || numbers.length === 0) return {};

  const cleanNumbers = numbers.map(n => parseFloat(n.replace(/,/g, "")));
  const firstNumber = cleanNumbers[0];
  if (firstNumber === undefined || Number.isNaN(firstNumber)) return {};
  const secondNumber = cleanNumbers[1];

  const isMonthly = salaryText.toLowerCase().includes("month");
  const isHourly = salaryText.toLowerCase().includes("hour");

  let min = firstNumber;
  let max = secondNumber !== undefined && !Number.isNaN(secondNumber) ? secondNumber : firstNumber;

  if (isMonthly) {
    min = (min * 12) / 100000;
    max = (max * 12) / 100000;
  } else if (isHourly) {
    min = (min * 8 * 22 * 12) / 100000;
    max = (max * 8 * 22 * 12) / 100000;
  } else {
    min = min / 100000;
    max = max / 100000;
  }

  return { min: Math.round(min * 10) / 10, max: Math.round(max * 10) / 10 };
}

const KNOWN_SKILLS = [
  "React", "React.js", "Next.js", "Node.js", "Node", "Express.js", "Express",
  "MongoDB", "MySQL", "TypeScript", "JavaScript", "MERN", "Full Stack", "Fullstack"
];

function extractSkillsFromTitle(title: string): string[] {
  const found = new Set<string>();
  const lowerTitle = title.toLowerCase();
  for (const skill of KNOWN_SKILLS) {
    if (lowerTitle.includes(skill.toLowerCase())) found.add(skill);
  }
  return Array.from(found);
}

function randomDelay(min: number, max: number) {
  const delay = Math.floor(Math.random() * (max - min) + min);
  return new Promise(resolve => setTimeout(resolve, delay));
}

export async function scrapeIndeed(
  searchQuery = "full stack developer",
  location = "Remote",
  category: "frontend" | "backend" | "fullstack" = "fullstack"
) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
  });
  const page = await context.newPage();

  console.log("Opening Indeed...");
  const searchUrl = `https://in.indeed.com/jobs?q=${encodeURIComponent(searchQuery)}&l=${encodeURIComponent(location)}`;
  await page.goto(searchUrl);

  await randomDelay(4000, 7000);

  await page.mouse.wheel(0, 300);
  await randomDelay(1500, 3000);

  const jobCards = await page.locator('div.job_seen_beacon').all();
  console.log(`Found ${jobCards.length} job cards`);

  const scrapedJobs: ScrapedJob[] = [];

  for (const [i, card] of jobCards.entries()) {
    try {
      const titleEl = card.locator('h3.jobTitle a.jcs-JobTitle').first();
      const title = (await titleEl.textContent())?.trim() || "N/A";
      const relativeLink = await titleEl.getAttribute('href');
      const jobUrl = relativeLink ? `https://in.indeed.com${relativeLink.split('&bb=')[0]}` : "";

      const company = (await card.locator('[data-testid="company-name"]').textContent())?.trim() || "N/A";
      const jobLocation = (await card.locator('[data-testid="text-location"]').textContent())?.trim() || "N/A";

      let salary: string | null = null;
      try {
        const salaryEl = card.locator('li[data-testid*="salary-snippet"] span.css-zydy3i').first();
        salary = await salaryEl.textContent({ timeout: 1000 });
      } catch {
        salary = null;
      }

      scrapedJobs.push({ title, company, location: jobLocation, salary, jobUrl });
      console.log(`[${i + 1}/${jobCards.length}] Extracted: ${title}`);

      await randomDelay(2000, 5000);

    } catch (err) {
      console.log(`Skipping card ${i + 1} due to error`);
    }
  }

  console.log("Closing browser...");
  await randomDelay(2000, 4000);
  await browser.close();

  // Database mein save
  let savedCount = 0;
  let duplicateCount = 0;
  const newlySavedJobs: any[] = [];

  for (const scraped of scrapedJobs) {
    if (!scraped.jobUrl) continue;

    const { min, max } = parseSalary(scraped.salary);
    const skillsRequired = extractSkillsFromTitle(scraped.title);

    const matchScore = calculateMatchScore({
      skillsRequired,
      category,
      ...(min !== undefined && { salaryMin: min }),
      ...(max !== undefined && { salaryMax: max }),
    });

    try {
      const created = await Job.create({
        title: scraped.title,
        company: scraped.company,
        location: scraped.location,
        ...(min !== undefined && { salaryMin: min }),
        ...(max !== undefined && { salaryMax: max }),
        jobUrl: scraped.jobUrl,
        source: "indeed",
        category,
        skillsRequired,
        matchScore,
      });
      savedCount++;
      newlySavedJobs.push(created);
    } catch (error: any) {
      if (error.code === 11000) {
        duplicateCount++;
      } else {
        console.error("Error saving job:", error.message);
      }
    }
  }
  console.log(`Saved: ${savedCount}, Duplicates skipped: ${duplicateCount}`);
  return { savedCount, duplicateCount, newlySavedJobs };
}