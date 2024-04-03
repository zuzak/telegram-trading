const t212 = require('./t212.js')
const config = require('./config.js')

const _ = module.exports = {
  /**
   * Places a market order:
   * buys or sells an equity at the next available price
   * (which may or may not be favourable)
   */
  placeMarketOrder: async (ticker, quantity) => {
    const res = await t212.post('equity/orders/market',
      { ticker, quantity }
    )
    return res.data
  },
  /**
   * Places a limit order:
   * tries to buy or sell an equity only if the price reaches
   * a set price (or better)
   *
   * Limit orders can either be Good 'Til Cancelled or
   * set to expire at the end of the trading day if not filled.
   */
  placeLimitOrder: async (ticker, quantity, limitPrice, timeValidity) => {
    timeValidity = timeValidity ?? config.get('transactions.defaultExpiry')
    const res = await t212.post('equity/orders/limit',
      { limitPrice, quantity, ticker, timeValidity }
    )
    return res.data
  },
  placeOrder: async (ticker, quantity, limitPrice, timeValidity) => {
    console.log('ORDER', ticker, quantity, limitPrice, timeValidity)
    if (limitPrice) return _.placeLimitOrder(ticker, quantity, limitPrice, timeValidity)
    return _.placeMarketOrder(ticker, quantity)
  },
  getOrder: async (id) => {
    const res = await t212.get(`equity/orders/${id}`)
    return res.data
  },
  getOrders: async () => (await t212.get('equity/orders')).data,
  /**
   * Given an array of possible interesting instruments,
   * pick the best one to transact.
   */
  selectInstrument: (instruments) => {
    instruments.sort((a, b) => {
      let acc = 0
      /*
       * The algorithm at the moment is thus:
       *  - prioritise GBP to avoid forex fees
       *  - if no GBP, priorise USD as we have a lot of that
       *  - otherwise pick the oldest
       *
       *  Future sorts could include things like:
       *  - whether we own any of the instrument already
       *  - prioritising certain exchanges
       *  - prioritising markets that are open
       */
      if (a.currencyCode === 'GBP') acc += 100
      if (b.currencyCode === 'GBP') acc -= 100

      if (a.currencyCode === 'GBX') acc += 100
      if (b.currencyCode === 'GBX') acc -= 100

      if (a.currencyCode === 'USD') acc += 10
      if (b.currencyCode === 'USD') acc -= 10

      if (a.type === 'STOCK') acc += 1
      if (b.type === 'STOCK') acc -= 1

      if (acc !== 0) return acc

      return new Date(a.date) - new Date(b.date)
    })
    return instruments.pop()
  }
}
