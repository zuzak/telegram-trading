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
    return Object.keys(await _.getInstrumentsKeyedByName()).sort((a, b) => a.length - b.length)
  },
  /**
   * Searches a given string and returns all the securities possibly mentioned within.
   */
  searchStringForInstruments: async (string) => {
    const instrumentNames = await _.getInstrumentNames()

    const matchingInstrumentNames = instrumentNames.filter((x) => (new RegExp(`\\b${x}\\b`)).test(string))
    const matchingInstruments = matchingInstrumentNames.map((x) => _.getInstrumentsByName(x))

    return (await Promise.all(matchingInstruments)).flat()
  }
}
