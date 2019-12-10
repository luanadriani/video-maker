const gm = require('gm').subClass({imageMagick: true})
const state = require('./state.js')
const spawn = require('child_process').spawn
const path = require('path')
const os = require('os');
const rootPath = path.resolve(__dirname, '..')
const videoshow = require("videoshowlas")
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path
const ffprobePath = require("@ffprobe-installer/ffprobe").path
let ffmpeg = require("fluent-ffmpeg")
ffmpeg.setFfmpegPath(ffmpegPath)
ffmpeg.setFfprobePath(ffprobePath)

const fromRoot = relPath => path.resolve(rootPath, relPath)

async function robot() {
	console.log('> [video-robot] Starting...')
	const content = state.load()

	await convertAllImages(content)
	await createYouTubeThumbnail()
    await renderVideo(content)
    await addNarrationToVideo(content)

	state.save(content)

	async function convertAllImages(content) {
		for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {
			await convertImage(sentenceIndex)
		}
	}

	async function convertImage(sentenceIndex) {
		return new Promise((resolve, reject) => {
			const inputFile = fromRoot(`./content/${sentenceIndex}-original.png[0]`)
			const outputFile = fromRoot(`./content/${sentenceIndex}-converted.png`)
			const width = 1920
			const height = 1080

			gm()
			.in(inputFile)
			.out('(')
				.out('-clone')
				.out('0')
				.out('-background', 'white')
				.out('-blur', '0x9')
				.out('-resize', `${width}x${height}^`)
			.out(')')
			.out('(')
				.out('-clone')
				.out('0')
				.out('-background', 'white')
				.out('-resize', `${width}x${height}`)
			.out(')')
			.out('-delete', '0')
			.out('-gravity', 'center')
			.out('-compose', 'over')
			.out('-composite')
			.out('-extent', `${width}x${height}`)
			.write(outputFile, (error) => {
				if (error) {
					return reject(error)
				}

				console.log(`> [video-robot] Image converted: ${outputFile}`)
				resolve()
			})

		})
	}

	async function createYouTubeThumbnail() {
		return new Promise((resolve, reject) => {
			gm()
			.in(fromRoot('./content/0-converted.png'))
			.write(fromRoot('./content/youtube-thumbnail.jpg'), (error) => {
				if (error) {
					return reject(error)
				}

				console.log('> [video-robot] YouTube thumbnail created')
				resolve()
			})
		})
	}

	async function renderVideo(content) {
        return new Promise((resolve, reject) => {
            console.log("> [video-robot] Starting Video Show(ffmpeg)");

            let images = []

            for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {
                const slideDuration = content.sentences[sentenceIndex].duration
                
                images.push({
                    path: `./content/${sentenceIndex}-converted.png`,
                    caption: content.sentences[sentenceIndex].text,
                    loop: slideDuration
                })
            }

            const videoOptions = {
                fps: 30,
                transition: true,
                transitionDuration: 1, // seconds
                videoBitrate: 1024,
                videoCodec: "libx264",
                size: "1920x?",
                audioBitrate: "128k",
                audioChannels: 2,
                format: "mp4",
                pixelFormat: "yuv420p",
                useSubRipSubtitles: false, // Use ASS/SSA subtitles instead
                subtitleStyle: {
                    Fontname: "Verdana",
                    Fontsize: "33",
                    PrimaryColour: "11861244",
                    SecondaryColour: "11861244",
                    TertiaryColour: "11861244",
                    BackColour: "-2147483640",
                    Bold: "2",
                    Italic: "0",
                    BorderStyle: "2",
                    Outline: "2",
                    Shadow: "3",
                    Alignment: "1", // left, middle, right
                    MarginL: "40",
                    MarginR: "60",
                    MarginV: "40"
                }
            }

            videoshow(images, videoOptions)
            .audio("./content/backMusic.mp3")
            .save("video.mp4")
            .on("start", function(command) {
                console.log("> [video-robot] Processo ffmpeg iniciado:", command)
            })
            .on("error", function(err, stdout, stderr) {
                console.error("Error:", err);
                console.error("> [video-robot] ffmpeg stderr:", stderr)
            reject(err)
            })
            .on("end", function(output) {
                console.error("> [video-robot] Video criado:", output)
                resolve()
            })
        })
    }

    async function addNarrationToVideo(content) {
        console.log("> [video-robot] Starting Add Narration(ffmpeg)");

        ffmpeg()  
        .input('./video.mp4')
        .input(`./content/narration/0.mp3`)
        .input(`./content/narration/1.mp3`)
        .input(`./content/narration/2.mp3`)
        .input(`./content/narration/3.mp3`)
        .input(`./content/narration/4.mp3`)
        .input(`./content/narration/5.mp3`)
        .input(`./content/narration/6.mp3`)
        .complexFilter([
            '[0:1] volume=0.1 [a0]',
            `[1:0] adelay=${content.sentences[0].timeInVideo * 1000}|${content.sentences[0].timeInVideo * 1000} [a1]`,
            `[2:0] adelay=${content.sentences[1].timeInVideo * 1000}|${content.sentences[1].timeInVideo * 1000} [a2]`,
            `[3:0] adelay=${content.sentences[2].timeInVideo * 1000}|${content.sentences[2].timeInVideo * 1000} [a3]`,
            `[4:0] adelay=${content.sentences[3].timeInVideo * 1000}|${content.sentences[3].timeInVideo * 1000} [a4]`,
            `[5:0] adelay=${content.sentences[4].timeInVideo * 1000}|${content.sentences[4].timeInVideo * 1000} [a5]`,
            `[6:0] adelay=${content.sentences[5].timeInVideo * 1000}|${content.sentences[5].timeInVideo * 1000} [a6]`,
            `[7:0] adelay=${content.sentences[6].timeInVideo * 1000}|${content.sentences[6].timeInVideo * 1000} [a7]`,
            '[a0][a1][a2][a3][a4][a5][a6][a7] amix=8 [aFinal]',
            '[aFinal] volume=6.0'
        ])
        .outputOption('-map 0:0')
        .audioCodec('aac')
        .videoCodec('copy')
        .save('video-narrado.mp4')
    }
}

module.exports = robot
