const express = require('express')
const t212 = require('./t212.js')
const app = module.exports = express()
const markets = require('./markets.js')
const orders = require('./orders.js')
const instruments = require('./instruments.js')
const pug = require('pug')

try {
  const cache = { orders: null, index: null }

  app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send('Something broke!')
  })

  app.get('/', async (req, res) => {
    if (cache.index) {
      console.log('serving cache')
      return res.send(cache.index)
    }
    try {
      const cash = (await t212.get('equity/account/cash')).data
      const timeout = 5
      cache.index = pug.renderFile('index.pug', {
        pretty: true, compileDebug: true, cash, timeout
      })
      setTimeout(() => { cache.index = null }, timeout * 1000)
      console.log('okc', cache.index)
      return res.send(cache.index)
    } catch (e) {
      console.log('error /')
      console.dir(e)
      return res.send(pug.renderFile('index.pug'))
    }
  })

  app.get('/orders', async (req, res) => {
    if (cache.orders) return res.send(cache.orders)

    const pendingOrders = await orders.getOrders()

    const augmentedOrders = await pendingOrders.map(async (order) => {
      const instrument = await instruments.getInstrumentByTicker(order.ticker)
      const market = await markets.getMarketById(instrument.workingScheduleId)
      return { order, instrument, market }
    })

    Promise.all(augmentedOrders).then((items) => {
      const timeout = 60
      try {
        cache.orders = pug.renderFile('orders.pug', {
          pretty: true, compileDebug: true, items, timeout
        })
        setTimeout(() => { cache.orders = null }, timeout * 1000)
        return res.send(cache.orders)
      } catch (e) {
        console.dir(e)
        return res.json(e)
      }
    })
  })

  app.get('/positions', async (req, res) => {
    const timeout = 10
    if (!cache.positions) {
      const positions = await orders.getPositions()
      cache.positions = await positions.map(async (position) => {
        const instrument = await instruments.getInstrumentByTicker(position.ticker)
        const market = await markets.getMarketById(instrument.workingScheduleId)
        return { position, instrument, market }
      })
      setTimeout(() => { cache.positions = null }, timeout * 1000)
    }
    Promise.all(cache.positions).then((items) => {
      try {
        res.send(pug.renderFile('positions.pug', {
          pretty: true, compileDebug: true, items // timeout
        }))
      } catch (e) {
        console.dir(e)
        return res.json(e)
      }
    })
  })
} catch (e) {
  console.error('webserver error')
  console.dir(e)
}
