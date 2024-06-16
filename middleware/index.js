require('dotenv').config()
const { verifyToken } = require('../utils/jwtUtils');

module.exports = async function (req, res, next) {
    try {
        let token = req.headers.authorization
        if (!token)
            return res.status(403).json({ error: "Please provide a token" })
        const data = verifyToken(token.replace('Bearer ', ''))
        req.UserID = data.uuid
        return next()

    } catch (e) {
        return res.status(403).json({ error: "Authention fail " + e })
    }
}
