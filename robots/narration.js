const state = require('./state.js')
const fs = require('fs');
const util = require('util');
const mp3Duration = require('mp3-duration');

const googleKeyFile = './credentials/google-text-to-speech.json'
const googleProjectId = require('../credentials/google-text-to-speech.json').project_id

const textToSpeech = require('@google-cloud/text-to-speech');

const config = {
  projectId: googleProjectId,
  keyFilename: googleKeyFile
}

async function robot(){
    const content = state.load()
    const client = new textToSpeech.TextToSpeechClient(config);

    await fetchNarrationOfAllSentences(content)

    state.save(content)

    async function fetchNarrationOfAllSentences(content){
        for(let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++){
            const duration = await fetchNarrationAndReturnDuration(content.sentences[sentenceIndex].text, sentenceIndex)
            console.log(duration);
            
            content.sentences[sentenceIndex].duration = duration
        }
    }

    async function fetchNarrationAndReturnDuration(sentence, index){
        const request = {
            input: {
                text: sentence
            },
            voice: {
                languageCode: 'pt-BR', 
                name: 'pt-BR-Wavenet-A',
                ssmlGender: 'NEUTRAL'
            },
            audioConfig: {
                audioEncoding: 'MP3'
            },
        }

        const [response] =  await client.synthesizeSpeech(request)
        
        const writeFile = util.promisify(fs.writeFile)
        await writeFile(`./content/narration${index}.mp3`, response.audioContent, 'binary')        

        return await returnDurationOfMp3(`./content/narration${index}.mp3`)
    }

    async function returnDurationOfMp3(url){
        return new Promise((resolve, reject) => {
            mp3Duration(url, (error, duration) => {
                if (error) {
                    reject(error)
                }
                resolve(duration)
            })
        })
    }
}

module.exports = robot
