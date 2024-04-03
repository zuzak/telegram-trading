const { Api } = require('telegram')
const { getOrders } = require('./orders.js')
const { NewMessage } = require('telegram/events')
const formatters = require('./formatters.js')
const { execSync } = require('node:child_process')
const { readFileSync } = require('node:fs')

module.exports = (client) => {
  client.addEventHandler(async (event) => {
    if (!event.message) return

    const firstWord = event.message.message.split(' ')[0]
    let command = firstWord.substr(1)
    if (!firstWord.startsWith('/')) return
    if (firstWord.includes('@')) {
      if (firstWord.substring(firstWord.indexOf('@')) !== '@TrashzoneTradingBot') {
        return
      }
      command = firstWord.substring(0, firstWord.indexOf('@'))
    }

    if (commands[command]) {
      const reply = await commands[command].cmd(event.message)
      if (typeof reply === 'string') {
        return event.message.reply({
          message: reply,
          linkPreview: false
        })
      }
      return reply
    }
  }, new NewMessage())

  updateBotCommands(client)
}

const commands = {
  botsnack: {
    desc: 'Gives the bot a snack',
    cmd: () => {
      console.log('Bot snack!')
      return 'Yum!'
    }
  },
  accountcash: {
    desc: 'Get a summary of our current cash holdings',
    cmd: async (message) => message.reply({ message: await formatters.generateCashSummary('paragraph') })
  },
  openorders: {
    desc: 'List all orders waiting for fulfillment',
    cmd: async () => {
      const json = await getOrders()
      return `<pre language="json">${JSON.stringify(json, null, 4)}</pre>`
    }
  },
  lobo: {
    desc: null,
    cmd: (message) => {
      if (Math.random() < 0.2) {
        return message.respond({ // like .reply but without a quote
          message: '/lobo',
          linkPreview: false
        })
      }
    }
  },
  version: {
    desc: 'Get the version information of the bot',
    cmd: () => {
      return [
        `telegram-trading 🤖 <code>${execSync('git describe --always --dirty')}</code>`,
        'https://github.com/zuzak/telegram-trading',
        '<blockquote>',
        readFileSync('LICENSE'),
        '</blockquote>'
      ].filter(Boolean).join('\r\n')
    }
  }
}

const updateBotCommands = (client) => {
  const cmds = Object.keys(commands).map((x) => {
    if (!commands[x].desc) return null
    return new Api.BotCommand({
      command: x,
      description: commands[x].desc
    })
  }).filter(Boolean)

  client.invoke(
    new Api.bots.SetBotCommands({
      scope: new Api.BotCommandScopeDefault({}),
      langCode: 'en',
      commands: cmds
    })
  )
}
