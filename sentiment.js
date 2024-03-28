const Analyzer = require('natural').SentimentAnalyzer
const stemmer = require('natural').PorterStemmer

const config = require('./config.js')

const analyzer = new Analyzer(
  config.get('sentiment.language'),
  stemmer,
  config.get('sentiment.vocabulary')
)

module.exports = {
  getSentiment: (string) => analyzer.getSentiment(string.split(' '))
}
