const { param, query, body, check } = require('express-validator');
const mongoose = require('mongoose');
const moment = require('moment-timezone');

module.exports.signup = [
    body('first_name',"Name is required and must be two character long.").isString().trim().isLength({min:2}).optional(),
    body('last_name',"Name is required and must be two character long.").isString().trim().isLength({min:2}).optional(),
    body('email',"This is a required field.").isEmail().optional(),
    body('phone_no',"Phone_no is required.").isString().trim().isMobilePhone().optional(),
    body('password',"Phone_no is required").isString().optional(),
    body('referral_code',"refral code is required field").isString().optional(),
    body('your_interests','interests are not requried').isArray().optional(),
    body('otp','otp is not required').isString().optional(),
    body('step',"step is required").notEmpty().trim().toLowerCase().custom(value =>{
        if(value !== 'first' && value !== 'second'){
            throw new Error('Please enter a valid step.');
        }
        return true;
    })
]

module.exports.login = [
    body('email',"email is required.").isString().trim().isEmail(),
    body("password", "password is required in this email").isString().trim()
]

module.exports.editProfile = [
    body('name',"Name is required and must be two character long.").isString().trim().isLength({min:2}).optional(),
    body('image', "email is required.").isURL().optional(),
]
module.exports.updateNumber =[
    body('phone_no',"Phone_no is required.").isString().trim().optional().isMobilePhone(),
    body("verification_code", "PIN code length should be 4").isString().trim().optional().isLength({min:4,max:4})

]