const express = require('express')
const path = require('path')
const indexRoute = require('./routes/index')
const bodyParser = require('body-parser')

const robots = {
	input: require('./robots/input.js'),
	text: require('./robots/text.js'),
	state: require('./robots/state.js'),
    image: require('./robots/image.js'),
    narration: require('./robots/narration.js'),
	video: require('./robots/video.js'),
	youtube: require('./robots/youtube.js')
}

const port = 3000
const app = express()

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(bodyParser.urlencoded({extended:true}))

app.get('/', indexRoute)

app.post('/', async (req,res,next) => {
    const search = {
        term: req.body.searchTerm,
        prefix: req.body.prefix,
        lang: req.body.lang
    }

    //robots.input(search)
    //await robots.text()
    //await robots.image()
    //await robots.narration()

    const content = robots.state.load()

    res.render('index', {
        title: "Video Maker",
        version: "0.0.0",
        content: content, 
    })
})

app.get('/videoGerate', async (req,res,next) => {
    const content = robots.state.load()

    await robots.video()
	//await robots.youtube()

    res.render('index', {
        title: "Video Maker",
        version: "0.0.1",
        content: content, 
    })
})

const server = app.listen(port, err => {
    console.log(`Server is listening on ${port}`)
}).setTimeout(5000000);