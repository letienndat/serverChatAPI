const mongoose = require('mongoose')
const { ObjectId } = require('mongoose').Types
let image = new mongoose.Schema({
    urlImage: { type: String, required: null },
    FileName: { type: String, required: null }
})

let file = new mongoose.Schema({
    urlFile: { type: String, required: null },
    FileName: { type: String, required: null }
})
let Message = new mongoose.Schema({
    UserID: { type: ObjectId, required: true },
    FriendID: { type: ObjectId, required: true },
    Content: { type: String, required: null },
    Files: { type: [file], required: null },
    Images: { type: [image], required: null },
    CreatedAt: { type: Date, required: false, default: null },
    UpdateAt: { type: Date, required: false, default: null },
    isSend: { type: Number, required: false, default: 0 }
})

let MessageModel = mongoose.model('message', Message)
module.exports = MessageModel