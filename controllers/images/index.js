var express = require('express')
var router = express.Router()
mongoose = require('mongoose')
models = reqlib('database').models
const path = require('path');
const currentDirectory = __dirname;
const parentDirectory = path.resolve(currentDirectory, '..', '..');

const savePathImage = `${parentDirectory}/images`;
const savePathImageAvatar = `${parentDirectory}/images/avatar`;

module.exports = () => {
    router.get('/:filename', async (req, res) => {
        try {
            const { filename } = req.params;
            const imagePath = path.join(savePathImage, filename);
            res.sendFile(imagePath);
        } catch (error) {
            return res.status(400).json({ status: 0, data: null, message: error.message })
        }
    })

    router.get('/avatar/:filename', async (req, res) => {
        try {
            const { filename } = req.params;
            const imagePath = path.join(savePathImageAvatar, filename);
            res.sendFile(imagePath);
        } catch (error) {
            return res.status(400).json({ status: 0, data: null, message: error.message })
        }
    })
    return router
}
