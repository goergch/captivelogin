var CronJob = require('cron').CronJob;
const puppeteer = require('puppeteer');
const TICKET = process.env.IAC_TICKET
const TICKET_PW = process.env.IAC_TICKET_PW
const CRONTAB = (process.env.IAC_CRONTAB===undefined)?'*/1 * * * *':process.env.IAC_CRONTAB;

const BROWSERPATH = process.env.BROWSERPATH
console.log("Welcome to the IAC login")
if(TICKET === undefined || TICKET_PW === undefined){
    console.log("IAC_TICKET or IAC_TICKET_PW is not set!!! Shuting down")
    return;
}
var job = new CronJob(CRONTAB, function() {
    (async () => {
        console.log("Checking internet status...")
        browserOptions = {
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox'
                ]
        }
        if (BROWSERPATH != null){
            browserOptions["executablePath"] = BROWSERPATH
        }
        
        const browser = await puppeteer.launch(browserOptions);
        const page = await browser.newPage();
        await page.goto('http://logon.now');
        await page.waitForNavigation({ waitUntil: 'networkidle0' })
        await page.screenshot({path: '1.png'});
        if (await page.$('span[class=logged-in]').catch() !== null) {
            console.log("We are online")
            browser.close();
        }else if(await page.$('span[class=logged-out]').catch() !== null)
        {
            console.log("We are offline! I try to log us in...")
            await page.focus("input[name=uid]").then(async ()=>{
                await page.type("input[name=uid]",TICKET);
                await page.type("input[name=pwd]",TICKET_PW);
                await page.screenshot({path: '2.png'});
                await page.$$eval('input[type="checkbox"]', checkboxes => {
                    checkboxes.forEach(chbox => chbox.click())
                 });
                await page.$$eval('input[type="submit"]', submit => {
                    submit.forEach(sb => sb.click())
                });
                await page.screenshot({path: '3.png'});

                if (await page.$('span[class=logged-in]').catch() !== null) {
                    console.log("We are online now")
                }else{
                    console.log("We are still offline")
                }
                await browser.close();
    
            }).catch(async err => {
                console.log(err);
                await browser.close();
            })
        }else {
            console.log("That's strange. I could not determine, if we are on- or offline")
        }
      })();
}, null, true, 'Europe/Berlin');
job.start();