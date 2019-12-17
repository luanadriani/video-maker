const express = require('express')
const path = require('path')
const indexRoute = require('./routes/index')
const bodyParser = require('body-parser')

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

    res.render('index', {
        title: "Video Maker",
        version: "0.0.0",
        authUrl: ""
    })
})

const server = app.listen(port, err => {
    console.log(`Server is listening on ${port}`)
})