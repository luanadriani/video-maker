const readline = require('readline-sync')
const state = require('./state.js')

function robot(){
	const content = {
		maximumSentences: 7
	}

	content.searchTerm = askAndReturnSearchTerm()
    content.prefix = askAndReturnPrefix()
    content.lang = askAndReturnLang()
	state.save(content)

	function askAndReturnSearchTerm(){
		return readline.question('Type a Wikipedia search term: ')
	}

	function askAndReturnPrefix(){
		const prefixes = ['Who is', 'What is', 'The history of']
		const selectedPrefixIndex = readline.keyInSelect(prefixes, 'Choose one option: ')
		const selectedPrefixText = prefixes[selectedPrefixIndex]

		return selectedPrefixText
    }

    function askAndReturnLang(){
		const lang = ['pt', 'en']
		const selectedLangIndex = readline.keyInSelect(lang, 'Choose one option: ')
		const selectedLangText = lang[selectedLangIndex]

		return selectedLangText
	}
}

module.exports = robot