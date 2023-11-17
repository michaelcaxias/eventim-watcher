import { Client } from 'discord.js';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';

dotenv.config();

const EVENTIM_URL = 'https://www.eventim.com.br/event/paul-mccartney-estadio-couto-pereira-17441256/?affiliate=PMY';
const TICKET_SELECTOR = '.clearfix .ticket-type-item';

const CURRENT_TICKET_INNER_TEXT = `MEIA ESTUDANTE
R$ 495,00
Indisponível no momento`;

const ONE_MINUTE = 6000;

const BOT_CHANNEL = '1174872539693056050';
const MY_USER_MENTION = '<@313797640439595008>';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const main = async () => {
  const { browser, page } = await initBrowser();

  const { channel } = await initDiscordBot();
  await pageWatcher(page, channel);

  await browser.close();
}

const initBrowser = async () => {
  const browser = await puppeteer.launch({ headless: false });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  await page.goto(EVENTIM_URL);

  return { browser, page };
};

const initDiscordBot = async () => {
  const client = new Client({
    intents: ['Guilds', 'GuildMessages', 'GuildVoiceStates', 'MessageContent'],
  });

  client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
  });

  client.on('messageCreate', (msg) => {
    if (msg.content === 'ping') {
      msg.reply('Pong!');
    }
  });

  await client.login(process.env.DISCORD_BOT_TOKEN);

  const channel = await client.channels.fetch(BOT_CHANNEL);

  return { client, channel };
}

const pageWatcher = async (page, channel) => {
  while (true) {
    await page.waitForSelector(TICKET_SELECTOR);
    const tickets = await page.$$(TICKET_SELECTOR);
    
    const selectedTicket = tickets[1];
    const isAvailable = await isTicketAvailable(selectedTicket);
    
    if (!isAvailable) {
      await channel.send(MY_USER_MENTION);
      await channel.send({ files: ['images/ticket_screenshot.png'] });
    }
    
    await page.reload();
    await delay(ONE_MINUTE);
  }
}

const isTicketAvailable = async (selectedTicket) => {
  await selectedTicket.screenshot({ path: 'images/ticket_screenshot.png' });
  const ticketInnerText = await selectedTicket.evaluate((node) => node.innerText);

  console.log(ticketInnerText);

  const separatedTicketInnerText = ticketInnerText.split('\n');
  const separatedCurrentTicketInnerText = CURRENT_TICKET_INNER_TEXT.split('\n');

  const isEverythingEqual = separatedTicketInnerText.every((text, index) => text === separatedCurrentTicketInnerText[index]);

  if (!isEverythingEqual) {
    return false;
  }
  
  console.log('Ticket is available');
  return true;
};

main();
