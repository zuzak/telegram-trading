const instruments = require('./instruments.js')

const axios = require('axios')
jest.mock('axios')

describe('instrument lookup', () => {
  test('returns stuff on success', async () => {
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
  test('retries on rate-limit', async () => {
    // jest has fancy timer mocking but it doesn't work well with async/await
    // so let's replace the setTimeout function to one that returns immediately every time:
    global.setTimeout = jest.fn(cb => cb());
    jest.spyOn(global, 'setTimeout')

    const data = ['a']

    // mock axios to return 429 the first time it's called
    // and then some data the second time
    axios.get
      .mockImplementationOnce(() => Promise.reject({ response: { status: 429 }}))
      .mockImplementationOnce(() => Promise.resolve({ data }))

    const output = await instruments.getInstruments()

    expect(setTimeout).toHaveBeenCalledTimes(1)
    expect(output).toStrictEqual(data)
  })
  test('bails on other errors', async () => {
    global.setTimeout = jest.fn(cb => cb());
    jest.spyOn(global, 'setTimeout')

    const e = {response: {status: 400}}

    axios.get.mockImplementationOnce(() => Promise.reject(e))

    expect.assertions(2)
    try {
      await instruments.getInstruments()
    } catch (error) {
      expect(error).toStrictEqual(e)
    }
    expect(setTimeout).toHaveBeenCalledTimes(0)
  })
})
describe('instrument name search', () => {
  test('works with one hit', async () => {
    const data = [
      { name: 'a', shortName: 'A' },
      { name: 'b', shortName: 'B' },
      { name: 'c', shortName: 'C' }
    ]

    axios.get.mockImplementationOnce(() => Promise.resolve({ data }))

    const output = await instruments.getInstrumentsByName('a')
    expect(output).toStrictEqual([{ name: 'a', shortName: 'A' }])
  })
  test('works with multiple hits', async () => {
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
})
describe('keyed instruments', () => {
  test('should convert an array of objects into key-values', async () => {
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
  test('should clobber on collisions', async () => {
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
  test('getInstrumentNames should be in order', async () => {
    const data = [
      { name: 'alice' },
      { name: 'bob' },
      { name: 'christine' }
    ]
    axios.get.mockImplementationOnce(() => Promise.resolve({ data }))

    const output = await instruments.getInstrumentNames()
    expect(output).toStrictEqual(['bob', 'alice', 'christine'])
  })
})
