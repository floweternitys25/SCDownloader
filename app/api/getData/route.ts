import puppeteer from 'puppeteer';

export async function GET(request: Request): Promise<Response> {
    const urlBase = new URL(request.url).searchParams.get('url');
    if (!urlBase) {
        return new Response(JSON.stringify({ error: 'URL parameter is missing' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    let urlM3u8: string | null = null;
    let title: string | null = null;
    page.on('request', (request) => {
        const url = request.url();
        if (url.endsWith('.mp3') || url.includes('.m3u8')) {
            urlM3u8 = url;
        }
    });
    await page.goto(urlBase, { waitUntil: 'networkidle2' });
    title = await page.$eval('meta[property="og:title"]', (el) => el.getAttribute('content')) ?? null;
    await browser.close();
    return new Response(
        JSON.stringify({ 
            urlM3u8: urlM3u8,
            title: title
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        }
    );
}