const { NewMessage } = require('telegram/events')
const instruments = require('./instruments.js')
const sentiment = require('./sentiment.js')
const orders = require('./orders.js')

const main = async () => {
  const client = await require('./client.js')()

  client.addEventHandler(async (event) => {
    const msg = event.message
    const sender = await msg.getSender()

    const possibleInstruments = await instruments.searchStringForInstruments(msg.message)
    const senti = sentiment.getSentiment(msg.message)
    console.log(
      new Date(msg.date * 1000),
      sender.username ? `‹@${sender.username}›` : `«${msg.firstName} ${msg.lastName}»`,
      msg.message,
      senti
    )

    const quantity = Math.sign(senti)
    if (quantity === 0) return
    if (possibleInstruments.length === 0) return

    const order = await orders.placeMarketOrder(possibleInstruments[0].ticker, quantity)
    console.dir(order)
  }, new NewMessage())
}

main()
