const jwt = require('jsonwebtoken');

const secretKey = process.env.JWT_SECRET || '9CgceGYPy0gNNmcZPGGmCO2Hr-bkav-csmo-deepb';
const secretRefreshKey = process.env.JWT_REFRESH_SECRET || '9CgceGYPy0gNNmcZPGGmCO2Hr-bkav-csmo-deepb';
const ageToken = process.env.MAX_AGE_TOKEN || 31536000000;
const ageRefreshToken = process.env.MAX_AGE_REFRESH_TOKEN || 31536000000;

MAX_AGE_TOKEN = 31536000000
MAX_AGE_REFRESH_TOKEN = 31536000000

const generateToken = (payload) => {
    return jwt.sign(payload, secretKey, { expiresIn: ageToken });
}
const generateRefreshToken = (payload) => {
    return jwt.sign(payload, secretRefreshKey, { expiresIn: ageRefreshToken });
}
const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, secretKey);
        return decoded;
    } catch (error) {
        console.error('Error verifying token:', error.message);
        return null;
    }
}

const verifyRefreshToken = (token) => {
    try {
        const decoded = jwt.verify(token, secretRefreshKey);
        return decoded;
    } catch (error) {
        console.error('Error verifying token:', error.message);
        return null;
    }
}
module.exports = {
    generateToken,
    generateRefreshToken,
    verifyRefreshToken,
    verifyToken,
};