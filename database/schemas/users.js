const mongoose = require('mongoose')

let User = new mongoose.Schema({
    Avatar: { type: String, required: false },
    FullName: { type: String, required: false },
    Username: {
        type: String, required: true, default: null,
        validate: {
            validator: function (value) {
                return /^[a-zA-Z0-9_-]+$/.test(value);
            },
            message: 'Tên đăng nhập chỉ được bao gồm chữ cái, số và dấu gạch dưới.'
        },
        unique: true
    },
    Password: { type: String, required: true, default: null },
    CreatedAt: { type: Date, required: false, default: null },
    UpdateAt: { type: Date, required: false, default: null }
})

let UserModel = mongoose.model('User', User)
module.exports = UserModel