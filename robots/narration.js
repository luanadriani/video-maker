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
    console.log('> [narration-robot] Starting...')
    const content = state.load()
    const client = new textToSpeech.TextToSpeechClient(config);

    await fetchNarrationOfAllSentences(content)

    state.save(content)

    async function fetchNarrationOfAllSentences(content){
        for(let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++){
            await fetchNarrationWithGoogle(content.sentences[sentenceIndex].text, sentenceIndex)

            const duration = await returnDurationOfMp3(`./content/narration/${sentenceIndex}.mp3`)
            
            content.sentences[sentenceIndex].duration = duration
            
            if(sentenceIndex === 0){
                content.sentences[sentenceIndex].timeInVideo = 0.5
            }else{
                content.sentences[sentenceIndex].timeInVideo = (content.sentences[sentenceIndex-1].timeInVideo + 0 + content.sentences[sentenceIndex-1].duration)
            }

            console.log(`> [narration-robot] time in video: ${content.sentences[sentenceIndex].timeInVideo}`);
        }
    }

    async function fetchNarrationWithGoogle(sentence, index){
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
        await writeFile(`./content/narration/${index}.mp3`, response.audioContent, 'binary')
        console.log(`> [narration-robot] narration mp3: ./content/narration/${index}.mp3`)
    }

    async function returnDurationOfMp3(url){
        return new Promise((resolve, reject) => {
            mp3Duration(url, (error, duration) => {
                if (error) {
                    reject(error)
                }

                console.log(`> [narration-robot] duration: ${duration}`)

                resolve(duration)
            })
        })
    }
}

module.exports = robot
