const t212 = require('./t212.js')

let cache

const _ = module.exports = {
  getMarkets: async () => {
    if (cache) return cache
    try {
      const res = await t212.get('equity/metadata/exchanges')
      if (process.env.NODE_ENV !== 'test') cache = res.data
      return res.data
    } catch (e) {
      // We're only allowed to call this endpoint 1 in every 30s
      // but we do it on startup so let's automatically refresh

      if (!e.response) throw e
      if (e.response.status !== 429) throw e

      console.log('Rate limited while getting markets')
      await new Promise(resolve => setTimeout(resolve, 31 * 1000))

      console.log('Trying again to get markets')
      return _.getMarkets()
    }
  },
  getMarketByName: async (name) => {
    const markets = await _.getMarkets()
    return markets.filter((x) => x.name === name)
  },
  getMarketById: async (id) => {
    const markets = await _.getMarkets()
    return markets.find((x) => x.workingSchedules.find((y) => y.id === id))
  },
  getMarketNameById: async (id) => {
    return (await _.getMarketById(id)).name
  }
}
