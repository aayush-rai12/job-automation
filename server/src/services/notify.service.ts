import TelegramBot from "node-telegram-bot-api";

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

let bot: TelegramBot | null = null;

function getBot(): TelegramBot | null {
  if (!token) {
    console.warn("TELEGRAM_BOT_TOKEN missing, skipping notification");
    return null;
  }
  if (!bot) {
    bot = new TelegramBot(token, { polling: false });
  }
  return bot;
}

interface JobSummary {
  title: string;
  company: string;
  location: string;
  matchScore: number;
  jobUrl: string;
  category: string;
}

export async function sendJobDigest(jobs: JobSummary[]) {
  const telegramBot = getBot();

  if (!telegramBot || !chatId) return;

  let message = "";

  if (jobs.length === 0) {
    message = "🎯 No new high-match jobs found today.";

    try {
      await telegramBot.sendMessage(chatId, message);
      console.log("Telegram notification sent");
    } catch (error) {
      console.error("Failed to send Telegram notification:", error);
    }

    return;
  }

  message = `🎯 *${jobs.length} New High-Match Jobs Found!*\n\n`;

  for (const job of jobs.slice(0, 10)) {
    message += `*${job.title}*\n`;
    message += `🏢 ${job.company} | 📍 ${job.location}\n`;
    message += `📊 Match Score: ${job.matchScore}% | Category: ${job.category}\n`;
    message += `🔗 [Apply Here](${job.jobUrl})\n\n`;
  }

  try {
    await telegramBot.sendMessage(chatId, message, {
      parse_mode: "Markdown",
    });
    console.log(`Telegram notification sent: ${jobs.length} jobs`);
  } catch (error) {
    console.error("Failed to send Telegram notification:", error);
  }
}