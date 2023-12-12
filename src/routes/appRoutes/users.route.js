var express = require('express');
var router = express.Router();
const userValidator = require('../../services/validator/userValidators/users.validator');
const userController = require('../../controllers/appControllers/users.controller');
const passport = require('passport');
const {
  upload_image,
} = require('../../services/middleware/imageUpload.middleware');
const {upload_media}=require('../../services/middleware/messageMedia.middleware')
const valid = require('../../services/middleware/checkValidation.middleware');
const {
  requireGuest,
} = require('../../services/middleware/passport.middleware');

router.put('/activate_profile', userController.active_profile);

router.post(
  '/verifyUser_apple_id',
  userController.verifyUser_apple_id
);

router.post('/google_login', userController.google_login);
router.post('/apple_login', userController.apple_login);
router.post(
  '/signup',
  userValidator.signup,
  valid.checkValidation,
  userController.signUp
);
router.post(
  '/registeration',
  upload_image.single('profile_image'),
  userController.registeration
);
router.put('/forget_password', userController.forget_password);
router.post('/resend_otp', userController.resend_otp);
router.post(
  '/login',
  userValidator.login,
  valid.checkValidation,
  userController.login
);
router.post('/guest_login', userController.guest_login);
router.post('/topup_hook', userController.topup_hook);

router.use(passport.authenticate('jwt', { session: false }));

router.get('/profile', userController.profile);
router.post('/change_password', userController.change_password);
router.get('/get_profile/:id', userController.get_profile_by_id);
router.post('/follow_user', userController.follow_user);
router.get(
  '/get_self_follower_folloing_list',
  userController.get_self_follower_folloing_list
);
router.get(
  '/get_other_follower_folloing_list/:id',
  userController.get_other_follower_folloing_list
);
router.put(
  '/edit_profile',
  upload_image.single('image'),
  userController.edit_profile
);
router.put(
  '/update_privacy_setting',
  userController.update_privacy_setting
);
router.put(
  '/update_notification_setting',
  userController.update_notification_setting
);
router.post('/unfollow_user', userController.unfollow_user);
router.put('/deactive_profile', userController.deactive_profile);
router.get('/get_inviteable', userController.get_inviteable);
router.post('/logout', userController.logout);
router.post('/block_user', userController.block_user);
router.post('/unblock_user', userController.unblock_user);
router.get('/block_users_list', userController.block_users_list);
router.post(
  '/create_case',
  upload_image.single('attachment'),
  userController.create_case
);
router.get('/get_all_cases', userController.get_all_cases);
router.get('/get_case/:id', userController.get_case);
router.post(
  '/create_case_message',
  userController.create_case_message
);
router.post(
  '/user_name_verification',
  userController.user_name_verification
);
router.get('/get_users', userController.get_users);
router.get('/get_wallet', userController.get_wallet);

router.get('/get_wallet_transactions', userController.get_wallet_transactions);
router.post('/get_other_wallet', userController.get_other_wallet);
router.post('/send_credit', userController.send_credit);
router.post('/create_intent', userController.create_intent);
router.post('/closing_banlance', userController.closing_banlance);
router.get(
  '/day_balance_detail/:id',
  userController.day_balance_detail
);

router.get('/near_me_minis', userController.nearme_minis);
router.post('/create_room',userController.create_room)
router.get('/message_list/:id',userController.message_list)
router.get('/get_room',userController.get_room)
router.post('/send_message',upload_media.single('media'),userController.send_message)
router.delete('/message/:id',userController.delete_message)
router.delete('/chat/:id',userController.delete_chat)


module.exports = router;
