/*
 * webserver.js
 * Copyright (C) 2024 zuzak <zuzak@saraneth>
 *
 * Distributed under terms of the MIT license.
 */
const express = require('express')
const app = module.exports = express()
const orders = require('./orders.js')
const instruments = require('./instruments.js')
const pug = require('pug')


let cache = null

app.get('/', async (req, res) => {
  if (cache) return res.send(cache)

  const pendingOrders = await orders.getOrders()

  const augmentedOrders = await pendingOrders.map(async (order) => {
    const instrument = await instruments.getInstrumentByTicker(order.ticker)
    return { order, instrument }
  })

  Promise.all(augmentedOrders).then((items) => {
    try {
      cache = pug.renderFile('orders.pug', {
        pretty: true, compileDebug: true, items: items
      })
      res.send(cache)
      setTimeout(() => cache = null, 60 * 1000)
    } catch (e) {
      console.dir(e)
      res.json(e)
    }
  })
})
