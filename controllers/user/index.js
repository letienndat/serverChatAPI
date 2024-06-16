var express = require('express')
var router = express.Router()
var mongoose = require('mongoose')
var models = reqlib('database').models
var moment = require('moment')
const { ObjectId } = require('mongoose').Types

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const currentDirectory = __dirname;
const parentDirectory = path.resolve(currentDirectory, '..', '..');
const savePathImageAvatar = `${parentDirectory}/images/avatar`;

module.exports = () => {
    router.post('/update', async (req, res) => {
        try {
            const UserID = req.UserID
            const { FullName } = req.body
            let user = await models.Users.findOne({ _id: new ObjectId(UserID) }).exec()
            if (user == null) {
                return res.status(400).json({ status: 0, data: null, message: 'User not found' })
            }
            let avatar = null
            for (const file of req.files) {
                if (file.fieldname === 'avatar') {
                    const extension = file.originalname.split('.').pop();
                    const nameFile = uuidv4();
                    const fullPath = path.join(savePathImageAvatar, `${nameFile}.${extension}`);
                    fs.writeFileSync(fullPath, file.buffer);
                    avatar = `/avatar/${nameFile}.${extension}`;
                }
            }
            const updateObject = {};

            if (FullName) {
                updateObject.FullName = FullName;
            }

            if (avatar) {
                updateObject.Avatar = avatar;
            } 
            updateObject.UpdateAt = moment().toDate();
            if (Object.keys(updateObject).length > 0) {
                await models.Users.updateOne({ _id: user._id }, updateObject);
            }
            return res.status(200).json({ status: 1, data: null, message: "update success" })

        } catch (error) {
            return res.status(400).json({ status: 0, data: null, message: error.message })
        }
    })

    router.get('/info', async (req, res) => {
        try {
            const UserID = req.UserID
            let user = await models.Users.findOne({ _id: new ObjectId(UserID) }).exec()
            if (user == null) {
                return res.status(400).json({ status: 0, data: null, message: 'User not found' })
            }
            return res.status(200).json({
                status: 1, data: {
                    Username: user?.Username,
                    FullName: user?.FullName,
                    Avatar: user?.Avatar
                }, message: ''
            })
        } catch (error) {
            return res.status(400).json({ status: 0, data: null, message: error.message })
        }
    })
    return router
}