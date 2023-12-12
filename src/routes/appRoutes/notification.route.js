var express = require('express');
const { read_notifications, mark_as_read_notification } = require('../../controllers/appControllers/notifications.controller');
var router = express.Router();
const passport = require('passport');


router.use(passport.authenticate('jwt', { session: false }));

router.get('/', read_notifications);
router.patch('/', mark_as_read_notification);


module.exports = router;