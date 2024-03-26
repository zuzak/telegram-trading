const t212 = require('./t212.js')

const _ = module.exports = {
  getInstruments: async () => {
    try {
      const res = await t212.get('equity/metadata/instruments')
      return res.data
    } catch (e) {
      // We're only allowed to call this endpoint 1 in every 30s
      // but we do it on startup so let's automatically refresh

      if (e.response.status != 429) throw e

      console.log('Rate limited while getting instruments')
      await new Promise(resolve => setTimeout(resolve, 31 * 1000))
      // ^ probably a better way to do that

      console.log('Trying again to get instruments')
      return _.getInstruments()
    }
  },
  getInstrumentsByName: async (name) => {
    const instruments = await _.getInstruments()
    return instruments.filter((x) => x.name === name)
  },
  getInstrumentsKeyed: async (name) => {
    const instruments = (await _.getInstruments())
    instruments.unshift({}) // add something empty to the start to accumulate onto
    return instruments.reduce((acc, curr) => {
      acc[curr.name] = curr
      return acc
    })
  },
  getInstrumentNames: async (name) => {
    return Object.keys(await _.getInstrumentsKeyed()).sort((a, b) => a.length - b.length)
  }
}
