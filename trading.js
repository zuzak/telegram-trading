const axios = require('axios')
const config = require('./config.js')

const t212 = axios.create({
  baseURL: `https://${config.get('trading212.env')}.trading212.com/api/v0/`,
  responseType: 'json',
  headers: {
    authorization: config.get('trading212.apiKey')
  }
})

const getInstruments = async () => {
  try {
    const res = await t212.get('equity/metadata/instruments')
    return res.data
  } catch (e) {
    // We're only allowed to call this endpoint 1 in every 30s
    // but we do it on startup so let's automatically refresh
    if (!e.response.status === 429) throw e

    console.log('Rate limited while getting instruments')
    await new Promise(resolve => setTimeout(resolve, 31 * 1000))
    // ^ probably a better way to do that

    console.log('Trying again to get instruments')
    return getInstruments()
  }
}

const x = async () => {
  console.dir(await getInstruments())
}

x()
