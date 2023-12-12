const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const _ = require('lodash');
const { check, validationResult } = require('express-validator');
let debug = require('debug')("utils");

module.exports.generateRandomString = (length) => {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

module.exports.getRandomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min) + min);
}

module.exports.getRandomBoolean = () => {
    return (Math.random() >= 0.5)
}

module.exports.firstLetterUpperCase = (word) => {
    return word.charAt(0).toUpperCase() + word.slice(1);
}


// private SPECIAL_CHAR_REGEX: RegExp  = /[!-/:-@\[-\`{-¿¿§«»ω⊙¤°℃℉€¥£¢¡®©•’]/g;
// private WHITE_SPACE_REGEX: RegExp   = /\s+/g;
module.exports.purifySearchText = (searchText) => {
    return searchText.toLowerCase().replace(constant.SPECIAL_CHAR_REGEX, '').replace(constant.WHITE_SPACE_REGEX, ' ').trim();
}

module.exports.getOldDatesByDays = (days) => {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

module.exports.getMonthsAheadDate = (months) => {
    let today = new Date();
    return new Date(today.setMonth(today.getMonth() + months));
}

module.exports.comparePassword = (plainPassword, encryptedPassword) => {
    return bcrypt.compare(plainPassword, encryptedPassword)
}

module.exports.getEncryptPassword = (plainPassword) => {
    const salt = bcrypt.genSaltSync(8);
    return bcrypt.hash(plainPassword, salt)
}

module.exports.isStrongPassword = (password) => {
    const strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.{8,})");
    return strongRegex.test(password)
}

module.exports.normalizeHostUrl = (host, port) => {
    return `${host}:${port}`;
}

module.exports.getEmailDomain = (email) => {
    return email.split('@')[1];
}

module.exports.isValidArrayValues = (staticArr, targetArr) => {
    return targetArr.every(v => staticArr.includes(v));
}

module.exports.generateAuthToken = (id, phone_no, key) => {
    const token = jwt.sign({ _id: id, phone_no: phone_no }, key);
    return token;
}

module.exports.decodeAuthToken = (token, key) => {
    return new Promise((resolve, reject) => {
        try {
            let decode = jwt.verify(token, key);
            resolve(decode);
        } catch (error) {
            reject(error);
        }
    })
}

module.exports.formatTime = (sec_num) => {
    let hours = Math.floor(sec_num / 3600);
    let minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    let seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours < 10) { hours = "0" + hours; }
    if (minutes < 10) { minutes = "0" + minutes; }
    if (seconds < 10) { seconds = "0" + seconds; }
    return hours + ':' + minutes + ':' + seconds;
}

module.exports.decodeBase64 = (str) => {
    return Buffer.from(str, "base64").toString('utf-8');
}

module.exports.encodeBase64 = (str) => {
    return Buffer.from(str, 'utf8').toString('base64');
}