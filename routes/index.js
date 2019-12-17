const express = require('express')
const router = express.Router()

router.get('/', (req, res, next) => {
    res.render('index', {
        title: "Video Maker",
        version: "0.0.0",
        authUrl: ""
    })
})

module.exports = router