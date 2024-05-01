import puppeteer from 'puppeteer'
import convertToExcel from './convertToExcel.js'

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        channel: 'chrome',
        args: [`--window-size=1440,1200`],
        defaultViewport: {
          width: 1440,
          height: 1200
        },
        executablePath: '/usr/bin/google-chrome',
        timeout: 60 * 1000
    })

    const parsedArr = []

    const page = await browser.newPage()

    await page.goto('https://e-auction.gosreestr.kz/p/ru/auction-guest-list', {
        waitUntil: 'domcontentloaded',
        timeout: 60 * 1000
    })

    await page.waitForResponse('https://e-auction.gosreestr.kz/p/Plugins/_core/Content/images/loading.gif')
    await page.waitForResponse('https://e-auction.gosreestr.kz/p/ru/auction-guest-list')
    await page.waitForNavigation({waitUntil: 'domcontentloaded', timeout: 60 * 1000})

    const pagesCountElement = await page.$('.page-selector-total-pages-count')
    const pagesCount = await pagesCountElement.evaluate((element) => Number(element.textContent.slice(1)))

    for (let i = 1; i <= pagesCount; i++) {
        await page.waitForSelector('.query-search-result-table > tbody > tr');

        const elementsArr = await page.$$('.query-search-result-table > tbody > tr');
        
        for (const element of elementsArr) {
            const elementLink = await element.$('.alist-div-first > a');
            const linkHrefProperty = await elementLink.getProperty('href');
            const linkHref = await linkHrefProperty.jsonValue();
    
            const newPage = await browser.newPage()
            await newPage.goto(linkHref, {waitUntil: 'domcontentloaded', timeout: 60 * 1000})

            const lotObj = {
                lotName: await newPage.$('.auction-main-info-name').then(async (element) => {
                    if (element) {
                        const regEx = /^[^;]*/gm
                        const text = await element.evaluate((element) => element.textContent)
                        const match = regEx.exec(text)
                        let result

                        if (match && match[0]) {
                            result = match[0]
                        } else {
                            result = 'Данных нет'
                        }

                        return result
                    } else {
                        return 'Данных нет'
                    }
                }),
                lotYear: await newPage.$('.auction-main-info-name').then(async (element) => {
                    if (element) {
                        const text = await element.evaluate((element) => element.textContent)
                        let result;

                        const index = text.indexOf(';')

                        if (index !== -1) {
                            result = text.slice(index + 2, index + 6);
                        } else {
                            result = "Данных нет"
                        }

                        return result
                    } else {
                        return "Данных нет"
                    }
                }),
                lotNumber: await newPage.$('.auction-main-info-row-auctionid').then(async (element) => {
                    if (element) {
                        return await element.evaluate((element) => element.textContent.slice(7));
                    } else {
                        return 'Данных нет'
                    }
                }) ,
                startPrice: await newPage.$('.auction-start-cost').then(async (element) => {
                    if (element) {
                        return await element.evaluate((element) => element.textContent);
                    } else {
                        return 'Данных нет'
                    }
                }),
                minPrice: await newPage.$('.auction-min-cost').then(async (element) => {
                    if (element) {
                        return await element.evaluate((element) => element.textContent);
                    } else {
                        return 'Данных нет'
                    }
                }),
                garantPrice: await newPage.$('.auction-guarantee-payments').then(async (element) => {
                    if (element) {
                        return await element.evaluate((element) => element.textContent);
                    } else {
                        return 'Данных нет'
                    }
                }),
                owner: await newPage.$$('.tableinfo-row-text').then(async (elementsArr) => {
                    if (elementsArr[1]) {
                        return await elementsArr[1].evaluate((element) => element.textContent);
                    } else {
                        return 'Данных нет'
                    }
                }),
                bodyNumber: await newPage.$$('.tableinfo-row-text').then(async (elementsArr) => {
                    if (elementsArr[0]) {
                       const regEx = /Номер кузова:\s*([^;]+);/
                       const text = await elementsArr[0].evaluate((element) => element.textContent)
                       const match = regEx.exec(text)
                       let result
                        if (match && match[1]) {
                            result = match[1]
                        } else {
                            result = 'Данных нет'
                        }

                       return result
                    } else {
                        return 'Данных нет'
                    }
                }),
                lotLink: linkHref

            }
            parsedArr.push(lotObj)
            await newPage.close()
        }

        await page.$('.page-selector-prev-page').then(async (button) => {
            if (button) {
                await button.click()
            }
        })
    }

    await convertToExcel(parsedArr)

    await browser.close()
})()
