const t212 = require('./t212.js')

let cache

const _ = module.exports = {
  /**
   * List all instruments our account has access to.
   */
  getInstruments: async () => {
    if (cache) return cache
    try {
      const res = await t212.get('equity/metadata/instruments')
      if (process.env.NODE_ENV !== 'test') cache = res.data
      return res.data
    } catch (e) {
      // We're only allowed to call this endpoint 1 in every 30s
      // but we do it on startup so let's automatically refresh

      if (!e.response) throw e
      if (e.response.status !== 429) throw e

      console.log('Rate limited while getting instruments')
      await new Promise(resolve => setTimeout(resolve, 31 * 1000))
      // ^ probably a better way to do that

      console.log('Trying again to get instruments')
      return _.getInstruments()
    }
  },
  /**
   * Returns an array of instruments with a given name.
   */
  getInstrumentsByName: async (name) => {
    const aliases = require('./aliases.json')
    if (Object.keys(aliases).includes(name)) {
      console.log('ALIAS', name)
      name = aliases[name]
    }
    const instruments = await _.getInstruments()
    return instruments.filter((x) => x.name === name)
  },
  /**
   * Returns a key-value object of instruments keyed by their name.
   * If there's duplicate names, they'll get globbed.
   */
  getInstrumentsKeyedByName: async () => {
    const instruments = (await _.getInstruments())
    instruments.unshift({}) // add something empty to the start to accumulate onto
    return instruments.reduce((acc, curr) => {
      acc[curr.name] = curr
      return acc
    })
  },
  /**
   * Returns an array of all the available instrument names.
   */
  getInstrumentNames: async (name) => {
    const aliases = require('./aliases.json')
    const trueInstruments = Object.keys(await _.getInstrumentsKeyedByName()).sort((a, b) => a.length - b.length)
    return trueInstruments.concat(Object.keys(aliases))
  },
  /**
   * Searches a given string and returns all the securities possibly mentioned within.
   */
  searchStringForInstruments: async (string) => {
    const instrumentNames = await _.getInstrumentNames()

    const matchingInstrumentNames = instrumentNames.filter((x) => (new RegExp(`\\b${x}\\b`)).test(string))
    const matchingInstruments = matchingInstrumentNames.map((x) => _.getInstrumentsByName(x))

    return (await Promise.all(matchingInstruments)).flat()
  },
  getOpenPosition: async (ticker) => {
    try {
      const res = await t212.get(`equity/portfolio/${ticker}`)
      return res.data
    } catch (e) {
      console.log(`Error trying to get open position for ${ticker}`)
      if (e.response.status === 400) throw new Error('Invalid ticker supplied')
      if (e.response.status === 404) return null // No open position with that ticker
      throw e
    }
  }
}
