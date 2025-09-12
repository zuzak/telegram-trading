const orders = require('./orders.js')
const formatters = require('./formatters.js')
const pollPendingOrder = module.exports = async (messageObject, summary, oldOrder, oldMessage, timeout) => {
  // I couldn't get message.edit() to catch so passing the old message text in as an argument
  // which is very suspect but I'm beyond caring at the moment lol
  console.log('Poll pending order:', { messageObject, summary, oldOrder, oldMessage, timeout })
  if (!timeout) timeout = 1000
  /**
   * Every so often poll the not-yet fulfilled orders for an update
   * and edit the transaction message with the information.
   *
   * If it's still in flight, return it (back onto the pendingOrders array)
   * ready for the next poll.
   *
   * This should probably do something with event emitters I guess
   */

  if (!oldOrder) {
    console.error('No old order passed to pendingOrders')
    return
  }
  let order
  try {
    order = await orders.getOrder(oldOrder.id)
  } catch (e) {
    if (e.response.status === 429) {
      console.log(e.response.status, 'when fetching order')
      timeout = 30000
      setTimeout(pollPendingOrder.bind(
        null,
        messageObject,
        summary,
        oldOrder,
        oldMessage,
        timeout
      ), 30000) // override just this time
      return
    }
    throw e
  }

  const text = [
    summary,
    await formatters.generateOrderSummary(order)
  ].filter(Boolean).join('\r\n')
  console.log('OLDMSG', oldMessage)
  console.log('NEWMSG', text)
  console.log('EQLMSG', oldMessage === text)
  if (oldMessage !== text) {
    await messageObject.edit(
      {
        message: messageObject.id,
        text,
        linkPreview: false
      }
    )
    timeout = 1000
  } else {
    timeout = timeout * 2
  }

  if (['FILLED', 'CANCELLED', 'REPLACED', 'REJECTED'].includes(order.status)) {
    console.log(`Order ${order.id} now ${order.status}; no longer polling`)
    return
  }

  setTimeout(pollPendingOrder.bind(null, messageObject, summary, order, text, timeout), timeout)
}
