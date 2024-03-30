const t212 = require('./t212.js')
const _ = module.exports = {
  /**
   * Returns formatted username or equivalent given a Telegram user object
   */
  formatUsername: (user) => {
    if (user.username) return `@${user.username}`
    return `${user.firstName} ${user.lastName}`
  },
  /**
   * Wraps substr in str in underline formatting
   */
  underlineMessage: (str, substr) => {
    if (!substr) return str
    const index = str.toUpperCase().indexOf(substr.toUpperCase())
    return [
      str.substr(0, index),
      '<u>' + str.substr(index, substr.length) + '</u>',
      str.substr(index + substr.length)
    ].join('')
  },
  /**
   * Outputs a nicely formatted summary of a stock mention
   */
  generateMentionSummary: (user, message, instrument) => {
    return [
      _.formatUsername(user),
      'mentioned',
      instrument.name,
      `$${instrument.shortName}`, // double $$ intentional (it's a cashtag)
      `<blockquote>${_.underlineMessage(message, instrument.name)}</blockquote>`
    ].join(' ')
  },
  /**
   * Outputs a nicely formatted summary of an order status
   * given an order object
   */
  generateOrderSummary: (order) => {
    return [
      Math.sign(order.quantity) > 0 ? 'Buying' : 'Selling',
      Math.abs(order.quantity) + '×',
      `<code>${order.ticker}</code>`,
      order.type === 'MARKET' ? 'at next available price' : null
    ].filter(Boolean).join(' ')
  },
  generateCashSummary: async (variant) => {
    // this should probably be somewhere else
    const cash = (await t212.get('equity/account/cash')).data
    const fmt = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })
    console.dir(cash)
    const emoji = {
      1: '📈',
      '-1': '📉',
      0: '🏛️'
    }[Math.sign(cash.ppl)]
    switch (variant) {
      case 'tickerline':
        return [
          emoji,
          `${fmt.format(cash.invested)} invested`,
          `(${fmt.format(cash.ppl)})`,
          '·',
          `<b>${fmt.format(cash.result)} realised</b>`,
          '·',
          `${fmt.format(cash.free)} free`
        ].join(' ')
      case 'emoji':
        return emoji
    }
    return cash
  }
}
