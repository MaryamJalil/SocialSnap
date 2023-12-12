const express = require('express');
const router = express.Router();
const passport = require('passport');
const reportController = require('../../controllers/appControllers/report.controller');


router.use(passport.authenticate('jwt', { session: false }));
router.post('/', reportController.create);


module.exports = router;
