const robots = {
	input: require('./robots/input.js'),
	text: require('./robots/text.js'),
	state: require('./robots/state.js'),
    image: require('./robots/image.js'),
    narration: require('./robots/narration.js'),
	video: require('./robots/video.js'),
	youtube: require('./robots/youtube.js')
}

async function start(){
	robots.input()
    await robots.text()
    await robots.narration()
	await robots.image()
	await robots.video()
	await robots.youtube()
}

start()
