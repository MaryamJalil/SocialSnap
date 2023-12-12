var express = require('express');
var router = express.Router();
const userValidator = require('../../services/validator/userValidators/users.validator');
const adminController = require('../../controllers/adminControllers/admin.conroller');
const passport = require('passport');

router.post('/login',adminController.login);

module.exports = router;
