const { expect, test, describe } = require('@jest/globals')
const sentiment = require('./sentiment.js')

describe('sentiment analysis', () => {
  // it's a third-party library so there's nothing meaningful to test yet
  test('returns a number', () => {
    const x = sentiment.getSentiment('Hello, world!')
    expect(typeof x).toBe('number')
  })
})
