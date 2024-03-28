const { NewMessage } = require('telegram/events')
const instruments = require('./instruments.js')
const main = async () => {
  const client = await require('./client.js')()

  client.addEventHandler(async (event) => {
    const msg = event.message
    const sender = await msg.getSender()
    console.log(
      new Date(msg.date * 1000),
      sender.username ? `‹@${sender.username}›` : `«${msg.firstName} ${msg.lastName}»`,
      msg.message,
      await instruments.searchStringForInstruments(msg.message)
    )
  }, new NewMessage())
}

main()
