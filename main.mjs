import puppeteer from 'puppeteer';

const EVENTIM_URL = 'https://www.eventim.com.br/event/paul-mccartney-estadio-couto-pereira-17441256/?affiliate=PMY';
const TICKET_SELECTOR = '.clearfix .ticket-type-item';

const CURRENT_TICKET_INNER_TEXT = `MEIA ESTUDANTE
R$ 495,00
Indisponível no momento`;

const main = async () => {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({
    headless: false,
  });

  const page = await browser.newPage();

  await page.goto(EVENTIM_URL);

  // Wait for the ticket list to be rendered
  await page.waitForSelector(TICKET_SELECTOR);

  const tickets = await page.$$(TICKET_SELECTOR);

  const selectedTicket = tickets[1];

  await ticketHandler(selectedTicket);
 
  await browser.close();
}

const ticketHandler = async (selectedTicket) => {
  await selectedTicket.screenshot({ path: 'images/ticket_screenshot.png' });
  const ticketInnerText = await selectedTicket.evaluate((node) => node.innerText);

  const separatedTicketInnerText = ticketInnerText.split('\n');
  const separatedCurrentTicketInnerText = CURRENT_TICKET_INNER_TEXT.split('\n');

  const isEverythingEqual = separatedTicketInnerText.every((text, index) => text === separatedCurrentTicketInnerText[index]);

  if (!isEverythingEqual) {
    console.log('Ticket is still unavailable');
    return;
  }
  
  console.log('Ticket is available');
};

const notifyUser = () => {

}

main();
