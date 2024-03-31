const t212 = require('./t212.js')
const config = require('./config.js')

module.exports = {
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
  getOrder: async (id) => {
    const res = await t212.get(`equity/orders/${id}`)
    return res.data
  },
  selectInstrument: (orders) => orders.shift()
}
