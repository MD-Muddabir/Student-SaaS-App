import puppeteer from 'puppeteer';

(async () => {
    try {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();

        page.on('console', msg => {
            console.log(`[Browser Console]: ${msg.text()}`);
        });

        page.on('request', request => {
            if (!request.url().includes('localhost')) return;
            console.log(`[Request]: ${request.method()} ${request.url()}`);
        });
        page.on('response', response => {
            if (!response.url().includes('localhost')) return;
            console.log(`[Response]: ${response.status()} ${response.url()}`);
        });

        console.log("Navigating to http://localhost:5173 ...");
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

        console.log("Clicking the login link in navbar...");
        await page.evaluate(() => {
            const loginBtn = Array.from(document.querySelectorAll('a')).find(el => el.textContent.includes('Login'));
            if (loginBtn) {
                loginBtn.click();
            } else {
                console.log("Login link not found!");
            }
        });

        console.log("Waiting 3 seconds...");
        await new Promise(r => setTimeout(r, 3000));
        console.log("Closing...");
        await browser.close();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
