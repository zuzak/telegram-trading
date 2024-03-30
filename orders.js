const t212 = require('./t212.js')

module.exports = {
  placeMarketOrder: async (ticker, quantity) => {
    const res = await t212.post('equity/orders/market',
      { ticker, quantity }
    )
    return res.data
  },
  getOrder: async (id) => {
    const res = await t212.get(`equity/orders/${id}`)
    return res.data
  }
}
