var express = require('express')
const middleware = require('../middleware')
var router = express.Router()

module.exports = function () {
    router.use('/auth', require('./auth')())
    router.use('/user', middleware, require('./user')())
    router.use('/message', middleware, require('./message')())
    router.use('/images', require('./images')())
    router.use('/files', require('./files')())
    return router
}