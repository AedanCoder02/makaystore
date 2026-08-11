import puppeteer from 'puppeteer-core';

const CHROMIUM_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v131.0.0/chromium-v131.0.0-pack.tar';

const CHROMIUM_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--single-process',
];

async function getExecutablePath(): Promise<string> {
  if (process.env.NODE_ENV === 'development') {
    if (process.platform === 'win32') {
      return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    }
    if (process.platform === 'darwin') {
      return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    }
    return '/usr/bin/google-chrome';
  }
  // Serverless: inflate chromium-min from remote tar
  const { inflate } = await import('@sparticuz/chromium-min');
  return inflate(CHROMIUM_URL);
}

export async function htmlToPdf(html: string): Promise<Buffer> {
  const executablePath = await getExecutablePath();

  const browser = await puppeteer.launch({
    args: CHROMIUM_ARGS,
    executablePath,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
