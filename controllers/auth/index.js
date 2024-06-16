var express = require('express')
var router = express.Router()
var mongoose = require('mongoose')
var models = reqlib('database').models
var moment = require('moment')
const bcrypt = require('bcryptjs');
const { generateToken } = require('../../utils/jwtUtils')
const saltRounds = 10;


module.exports = () => {
    router.post('/register', async (req, res) => {
        try {
            const { FullName, Username, Password } = req.body
            let info = await models.Users.findOne({ Username: Username }).exec()
            if (info != null) {
                return res.status(400).json({ status: 0, data: null, message: 'Username already exists' })
            }
            bcrypt.hash(Password, saltRounds, async (err, hash) => {
                if (err) {
                    return res.status(400).json({ status: 0, data: null, message: err })
                }
                const user = await models.Users({
                    Avatar: null,
                    FullName: FullName,
                    Username: Username,
                    Password: hash,
                    CreatedAt: moment().toDate(),
                    UpdateAt: moment().toDate()
                }).save()
                const token = await generateToken({
                    uuid: user._id,
                    FullName: FullName
                })
                return res.status(200).json({
                    status: 1, data: {
                        token: token,
                        Username: Username,
                        FullName: FullName,
                        Avatar: null
                    }, message: 'success register'
                })
            });
        } catch (error) {
            return res.status(400).json({ status: 0, data: null, message: error.message })
        }
    })

    router.post('/login', async (req, res) => {
        try {
            const { Username, Password } = req.body
            let info = await models.Users.findOne({ Username: Username }).exec()
            if (info == null) {
                return res.status(400).json({
                    status: 0, data: null, message: 'Username not found'
                })
            }
            bcrypt.compare(Password, info.Password, async (err, isMatch) => {
                if (err) {
                    return res.status(400).json({ status: 0, data: null, message: err })
                }

                if (isMatch) {
                    await models.Users.updateOne({ _id: info._id }, { UpdateAt: moment().toDate() })
                    const token = await generateToken({
                        uuid: info._id,
                        FullName: info.FullName
                    })
                    return res.status(200).json({
                        status: 1, data: {
                            token: token,
                            UserID: info?._id,
                            Username: info?.Username,
                            FullName: info?.FullName,
                            Avatar: info?.Avatar
                        }, message: 'success register'
                    })
                } else {
                    return res.status(401).json({
                        status: 0, data: null, message: "Incorrect password"
                    })
                }
            });
        } catch (error) {
            return res.status(400).json({ status: 0, data: null, message: error.message })
        }
    })

    return router
}