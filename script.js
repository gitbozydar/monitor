const puppeteer = require("puppeteer");
const nodemailer = require("nodemailer");

require("dotenv").config();

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_TO = process.env.EMAIL_TO;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

const products = [
  {
    name: "Komputronik",
    shop: "https://www.komputronik.pl/product/941544/monitor-lg-27gs60qc-b-27-qhd-va-curved-1ms-180hz.html?utm_source=google&utm_medium=cpc&utm_campaign=pmax_monitory_mon&utm_term=&saids=_&gad_source=1&gclid=CjwKCAiA5pq-BhBuEiwAvkzVZWAE3WzxWsZz3pU1bHztX8Hc2XFFSOilOqz9g8yFHp_gTZPi5_fV4RoCsW4QAvD_BwE&gclsrc=aw.ds",
    tag: "div.my-2.text-3xl.font-bold.leading-8",
  },
  {
    name: "X-KOM",
    shop: "https://www.x-kom.pl/p/1280805-monitor-led-27-265-284-lg-ultragear-27gs60qc-b.html",
    tag: "span.parts__Price-sc-53da58c9-2",
  },
  {
    name: "Euro",
    shop: "https://www.euro.com.pl/monitory-led-i-lcd/lg-monitor-27gs60qcb.bhtml?utm_source=google&utm_medium=cpc&utm_campaign=it_pmax&gad_source=1&gclid=CjwKCAiA5pq-BhBuEiwAvkzVZYFEJRX171FgRibSBfcAyAjiZ-jlRcLnAicWuep1CyMoaorCGF5QahoC_OwQAvD_BwE&gclsrc=aw.ds",
    tag: "span.price-template__large--total",
  },
  {
    name: "Morele",
    shop: "https://www.morele.net/monitor-lg-ultragear-27gs60qc-b-13268058/?utm_source=google&utm_medium=cpc&utm_campaign=19968945056&gad_source=1&gclid=CjwKCAiA5pq-BhBuEiwAvkzVZcwupR0NVOI8Ziti5vMNLfvnXF-a83Li8Ug3NUoPveDRWheN_AkvyhoC2kMQAvD_BwE",
    tag: "div#product_price",
  },
  {
    name: "OleOle",
    shop: "https://www.oleole.pl/monitory-led-i-lcd/lg-monitor-27gs60qcb.bhtml?from=pla&utm_source=google&utm_medium=cpc&utm_campaign=it_pmax&gad_source=1&gclid=CjwKCAiA5pq-BhBuEiwAvkzVZTGaWsk_jBzQj8NnC_gSaNNQ36FzRR32HO0-k5qQ9qo-QQtzJllo3BoCJpQQAvD_BwE&gclsrc=aw.ds",
    tag: "span.price-template__large--total",
  },
];

const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15",
];

const getRandomUserAgent = () => {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
};

const getPrice = async ({ shop, tag, name }) => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setUserAgent(getRandomUserAgent());
    await page.setViewport({ width: 1280, height: 800 });

    await page.goto(shop, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(tag);

    const price = await page.evaluate((tag) => {
      const element = document.querySelector(tag);
      return element ? element.textContent.trim() : "Price not found";
    }, tag);

    console.log(`${name}: ${price.slice(0, 3)}`);

    await browser.close();

    // Slice the first 3 characters of the price and parse it into a float if possible
    const priceValue = parseFloat(price.replace(/[^\d.-]/g, "")); // remove non-numeric characters
    return {
      name,
      price: priceValue ? priceValue.toFixed(0).slice(0, 3) : null,
    }; // Slice to first 3 characters
  } catch (error) {
    console.error("Error:", error);
    return { name, price: null };
  }
};

const sendEmail = async (subject, body) => {
  try {
    const mailOptions = {
      from: EMAIL_USER,
      to: EMAIL_TO,
      subject: subject,
      text: body,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

const scrapePrices = async () => {
  let emailBody = "Product Price Scraping Results:\n\n";
  let sendEmailFlag = false;

  for (const product of products) {
    const { name, price } = await getPrice(product);
    if (price && parseFloat(price) < 620) {
      sendEmailFlag = true;
    }
    emailBody += `${name}: ${price ? price : "Error"}\n`;
  }

  // Send email only if a price is below 620
  if (sendEmailFlag) {
    await sendEmail("Product Price Update", emailBody);
  } else {
    console.log("No products found under 620, no email sent.");
  }
};

scrapePrices();
