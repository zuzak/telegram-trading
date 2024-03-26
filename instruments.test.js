const instruments = require('./instruments.js')

const axios = require('axios')
jest.mock('axios')

test('instrument lookup returns stuff', async () => {
  const instrument = {
    ticker: 'GRGl_EQ',
    type: 'STOCK',
    workingScheduleId: 55,
    isin: 'GB00B63QSB39',
    currencyCode: 'GBX',
    name: 'Greggs',
    shortName: 'GRG',
    minTradeQuantity: 0.01,
    maxOpenQuantity: 14723,
    addedOn: '2018-07-12T07:10:07.000+03:00'
  }

  axios.get.mockImplementationOnce(() => Promise.resolve({ data: instrument }))

  const output = await instruments.getInstruments()
  expect(output).toStrictEqual(instrument)
})
