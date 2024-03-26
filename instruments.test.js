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
test('instrument name search works with one hit', async () => {
  const data = [
    { name: 'a', shortName: 'A' },
    { name: 'b', shortName: 'B' },
    { name: 'c', shortName: 'C' }
  ]

  axios.get.mockImplementationOnce(() => Promise.resolve({ data }))

  const output = await instruments.getInstrumentsByName('a')
  expect(output).toStrictEqual([{ name: 'a', shortName: 'A' }])
})
test('instrument name search works with multiple hits', async () => {
  const data = [
    { name: 'a', shortName: 'AA' },
    { name: 'b', shortName: 'BB' },
    { name: 'a', shortName: 'AB' },
    { name: 'c', shortName: 'CC' },
    { name: 'a', shortName: 'AC' }
  ]

  axios.get.mockImplementationOnce(() => Promise.resolve({ data }))

  const output = await instruments.getInstrumentsByName('a')
  expect(output).toStrictEqual([
    { name: 'a', shortName: 'AA' },
    { name: 'a', shortName: 'AB' },
    { name: 'a', shortName: 'AC' }
  ])
})
test('getInstrumentsKeyed should convert an array of objects into key-values', async () => {
  const data = [
    { name: 'a' },
    { name: 'b' },
    { name: 'c' }
  ]
  axios.get.mockImplementationOnce(() => Promise.resolve({ data }))

  const output = await instruments.getInstrumentsKeyed()
  expect(output).toStrictEqual({
    a: { name: 'a' },
    b: { name: 'b' },
    c: { name: 'c' }
  })
})
test('getInstrumentsKeyed should clobber on collisions', async () => {
  // no idea what the best behaviour here is yet actually
  const data = [
    { name: 'a', ticker: 'u' },
    { name: 'b', ticker: 'v' },
    { name: 'c', ticker: 'w' },
    { name: 'a', ticker: 'x' },
    { name: 'b', ticker: 'y' },
    { name: 'c', ticker: 'z' }
  ]
  axios.get.mockImplementationOnce(() => Promise.resolve({ data }))

  const output = await instruments.getInstrumentsKeyed()
  expect(output).toStrictEqual({
    a: { name: 'a', ticker: 'x' },
    b: { name: 'b', ticker: 'y' },
    c: { name: 'c', ticker: 'z' }
  })
})
