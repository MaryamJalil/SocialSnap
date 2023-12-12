const { param, query, body, check } = require('express-validator');


module.exports.AddUser = [
    body('name',"Name is required and must be two character long.").isString().trim().isLength({min:2}).optional(),
    body('phone_number', "Phone Number is required and must be two character long.").isString().trim().notEmpty().isLength({min:2})
]

module.exports.login = [
    body('email', "Email is required.").isEmail().trim().escape().notEmpty().normalizeEmail().toLowerCase()
]