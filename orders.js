const t212 = require('./t212.js')
const config = require('./config.js')
const getTicker = require('./instruments.js').getInstrumentByTicker

Error.stackTraceLimit = Infinity

const _ = module.exports = {
  /**
   * Places a market order:
   * buys or sells an equity at the next available price
   * (which may or may not be favourable)
   */
  placeMarketOrder: async (ticker, quantity) => {
    const payload = { ticker, quantity }
    console.log('PLACING MARKET ORDER', payload)
    const res = await t212.post('equity/orders/market', payload)
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
  placeOrder: async (ticker, quantity, limitPrice, timeValidity, skipRecursion) => {
    console.log('PLACING ORDER', { ticker, quantity, limitPrice, timeValidity, skipRecursion })
    try {
      let order
      if (limitPrice) {
        order = await _.placeLimitOrder(ticker, quantity, limitPrice, timeValidity)
      } else {
        order = await _.placeMarketOrder(ticker, quantity)
      }
      console.log('PLACED ORDER', order)
      return order
    } catch (e) {
      if (!e.response) throw e
      if (e.response.status === 429) {
        console.error('Rate limited on placing order...')
        await new Promise(resolve => setTimeout(resolve, 5 * 1000))
        console.error('...retrying order placement')
        return _.placeOrder(ticker, quantity, limitPrice, timeValidity, skipRecursion)
      }

      if (e.response.data === null) throw e
      console.error('Error placing order', e.response.data)

      if (
        (['InsufficientFreeForStocksException', 'SellingEquityNotOwned'].includes(e.response.data.clarification)) ||
        (!e.response.data.clarification && e.response.status === 400)
      ) {
        console.log('Not enough cash! // Not enough stocks!')

        if (skipRecursion) {
          console.log('Not retrying')
          throw e
        }

        // wait a bit to avoid rate limiting
        console.log('Waiting...')
        await new Promise(resolve => setTimeout(resolve, 5 * 1000))
        console.log('       ... waited.')

        // try again with a smaller order quantity
        const instr = await getTicker(ticker)
        // Math.floor(value / roundTo) * roundTo;
        quantity = quantity / config.get('transactions.retryFactor')
        if (!instr.minTradeQuantity) instr.minTradeQuantity = 0.001
        if (instr.minTradeQuantity) {
          quantity = Math.floor(quantity / instr.minTradeQuantity) * instr.minTradeQuantity
        }
        if (quantity === 0) throw e
        if (quantity > 0 && Math.abs(quantity) <= instr.minTradeQuantity) {
          quantity = instr.minTradeQuantity
          return await _.placeOrder(ticker, quantity.toPrecision(3), limitPrice, timeValidity, true) // the API enforces precision
        }
        if (quantity < 0 && Math.abs(quantity) <= instr.minTradeQuantity) {
          quantity = 0 - instr.minTradeQuantity
          return await _.placeOrder(ticker, quantity.toPrecision(3), limitPrice, timeValidity, false) // the API enforces precision
        }
        return await _.placeOrder(ticker, quantity.toPrecision(3), limitPrice, timeValidity, false) // the API enforces precision
      }
      console.log('Spicy error')
      throw e
    }
  },
  getOrder: async (id) => {
    try {
      const res = await t212.get(`equity/orders/${id}`)
      return res.data
    } catch (e) {
      if (e.response.status === 404) {
        const historicalOrders = (await t212.get('equity/history/orders')).data.items
        return historicalOrders.find((x) => x.parentOrder === id)
      }
      throw e
    }
  },
  getOrders: async () => (await t212.get('equity/orders')).data,
  getPositions: async () => (await t212.get('equity/portfolio')).data,
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
