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
	const content = state.load()
	await fetchContentFromWikipedia(content)
	sanitizeContent(content)
	breakContentIntoSentences(content)
	limitMaximumSentences(content)
	await fetchKeywordsOfAllSentences(content)

	state.save(content)

	async function fetchContentFromWikipedia(content){
		const algorithmiaAuthenticated = algorithmia(algorithmiaApiKey)
		const wikipediaAlgorithm = algorithmiaAuthenticated.algo('web/WikipediaParser/0.1.2')
		const wikipediaResponse = await wikipediaAlgorithm.pipe(content.searchTerm)
		const wikipediaContent = wikipediaResponse.get()

		content.sourceContentOriginal = wikipediaContent.content
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
		for(const sentence of content.sentences){
			sentence.keywords = await fetchWatsonAndReturnKeywords(sentence.text)
		}
	}

	async function fetchWatsonAndReturnKeywords(sentence){
		return new Promise((resolve, reject) => {
		nlu.analyze(
		  {
		    html: sentence, // Buffer or String
		    features: {
		      keywords: {}
		    }
		  })
		  .then(response => {
		  	const keywords = response.result.keywords.map((keywords) => {
		  		return keywords.text
		  	})

		  	resolve(keywords)
		  })
		  .catch(err => {
		    console.log('error: ', err);
		  });
		})
	}
}

module.exports = robot