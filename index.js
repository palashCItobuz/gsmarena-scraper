const puppeteer = require('puppeteer')
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
app.use(bodyParser.json())
const PORT = 5001

/*
  {
    data: {
      year: '2020, August 04',
      status: 'Available. Released 2020, August 13'
    }
    error: null
  },

    data: {
      year: null
      status: null
    }
    error: 'Not Found'
*/


async function start (term) {
    const url = `https://www.gsmarena.com/res.php3?sSearch=${term.replace(' ', '+')}`
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
  
    const response = {
      data: {
        year: null,
        status: null
      },
      error: null
    }
    try {
      await page.goto(url)
      await Promise.all([
        page.waitForNavigation(),
        page.click('div#review-body ul li')
      ])
      const [year, status] = await Promise.all([
        page.$eval('div#specs-list td[data-spec="year"]', el => el.innerText),
        page.$eval('div#specs-list td[data-spec="status"]', el => el.innerText)
      ])
      response.data.year = year
      response.data.status = status
    } catch (error) {
      response.error = 'Not Found'
    }
    await browser.close()
    return response
  }

app.get('/', async (req, res) => {
    const { model } = req.query
    let data = {}
    if(!model || req.query.model == '') return res.status(400).json({ error: "Model was not supplied" })
    try {
       data = await start(req.query.model)
    } catch (error) {
        return res.status(400).json(data)
    }
    return res.status(200).json(data)
})

const startApp = async () => {
    try {
      await app.listen(PORT)
      console.log('node server connected on port ' + PORT)
    } catch (error) {
      console.log(error)
    }
}
startApp()
