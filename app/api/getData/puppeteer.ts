import puppeteer, { Browser } from 'puppeteer';
const launchBrowser = (): Promise<Browser> => puppeteer.launch({ headless: true });
export { launchBrowser }; 