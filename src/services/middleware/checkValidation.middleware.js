const { check, validationResult } = require('express-validator');
let debug = require('debug')("middleware");

module.exports.checkValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: 400, message: errors.mapped() })
    } else {
        next();
    }
}