const algorithmia = require('algorithmia')
const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey
const sentenceBoundaryDetection = require('sbd')

const watsonApiKey = require('../credentials/watson-nlu.json').apikey
const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
const { IamAuthenticator } = require('ibm-watson/auth');

const state = require('./state.js')

const nlu = new NaturalLanguageUnderstandingV1({
  authenticator: new IamAuthenticator({ apikey: watsonApiKey }),
  version: '2018-04-05',
  url: 'https://gateway.watsonplatform.net/natural-language-understanding/api/'
});

async function robot() {
  console.log('> Text robot starting...');
	const content = state.load()
	await fetchContentFromWikipedia(content)
	sanitizeContent(content)
	breakContentIntoSentences(content)
	limitMaximumSentences(content)
	await fetchKeywordsOfAllSentences(content)

	state.save(content)

	async function fetchContentFromWikipedia(content){
    console.log('> [text-robot] Fetching content from wikipedia');
		const algorithmiaAuthenticated = algorithmia(algorithmiaApiKey)
        const wikipediaAlgorithm = algorithmiaAuthenticated.algo('web/WikipediaParser/0.1.2')
        
        const term = {
            'articleName': content.searchTerm,
            'lang': content.lang
        }

		const wikipediaResponse = await wikipediaAlgorithm.pipe(term)
		const wikipediaContent = wikipediaResponse.get()

		content.sourceContentOriginal = wikipediaContent.content
    console.log('> [text-robot] fetching done!');
	}

	function sanitizeContent(content){
		const withoutBlackLinesAndMarkdown = removeBlankLinesAndMarkdown(content.sourceContentOriginal)
		const withoutDatesInParenteses = removeDatesInParenteses(withoutBlackLinesAndMarkdown)

		content.sourceContentSanitized = withoutDatesInParenteses

		function removeBlankLinesAndMarkdown(text){
			const allLines = text.split('\n')

			const withoutBlackLinesAndMarkdown = allLines.filter((line) => {
				if (line.trim().length === 0 || line.trim().startsWith('=')) {
					return false
				}

				return true
			})

			return withoutBlackLinesAndMarkdown.join(' ')
		}

		function removeDatesInParenteses(text){
			return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g,' ')
		}
	}

	function breakContentIntoSentences(content){
		content.sentences = []

		const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized)
		sentences.forEach((sentence) => {
			content.sentences.push({
				text: sentence,
				keywords: [],
				images: []
			})
		})
	}

	function limitMaximumSentences(content){
		content.sentences = content.sentences.slice(0, content.maximumSentences)
	}

	async function fetchKeywordsOfAllSentences(content){
    console.log('> [text-robot] Starting to fetch keywords from Watson')
		for(const sentence of content.sentences){
      console.log(`> [text-robot] Sentence: "${sentence.text}"`)
			sentence.keywords = await fetchWatsonAndReturnKeywords(sentence.text)
      console.log(`> [text-robot] Keywords: ${sentence.keywords.join(', ')}\n`)
		}
	}

  async function fetchWatsonAndReturnKeywords(sentence) {
    return new Promise((resolve, reject) => {
      nlu.analyze({
        text: sentence,
        features: {
          keywords: {}
        }
      }, (error, response) => {
        if (error) {
          reject(error)
          return
        }

        const keywords = response.result.keywords.map((keyword) => {
          return keyword.text
        })

        resolve(keywords)
      })
    })
  }
}

module.exports = robot
