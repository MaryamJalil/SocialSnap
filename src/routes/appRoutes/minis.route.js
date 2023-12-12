var express = require('express');
var router = express.Router();
const minisController = require('../../controllers/appControllers/minis.controller');
const passport = require('passport');
const {
  upload,
} = require('../../services/middleware/filesUpload.middleware');
const valid = require('../../services/middleware/checkValidation.middleware');
const {
  requireGuest,
} = require('../../services/middleware/passport.middleware');

router.get('/search_previews', minisController.search_preview);
router.get(
  '/trending_minis_public',
  minisController.trending_minis_public
);
router.use(passport.authenticate('jwt', { session: false }));
router.get('/trending_minis', minisController.trending_minis);
router.post('/saved_mini_byId', minisController.saved_minis_byId);
router.get('/saved_minis', minisController.saved_minis);
router.post('/get_reply_minis', minisController.get_reply_minis);
router.post(
  '/create_minis',
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'vedio', maxCount: 1 },
  ]),
  minisController.create_minis
);
router.post(
  '/create_minis_reply',
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'vedio', maxCount: 1 },
  ]),
  minisController.create_minis_reply
);
router.get('/following_minis', minisController.following_minis);
router.get('/self_minis_list', minisController.self_minis_list);
router.post(
  '/create_like_dislike',
  minisController.create_like_dislike
);
router.post('/get_like_dislikes', minisController.get_like_dislikes);
router.get('/get_comments/:id', minisController.get_comments);
router.get('/search_minis', minisController.search_minis);

router.get(
  '/get_minis_viewcount/:id',
  minisController.minis_views_count
);
router.get(
  '/get_mentioned_minis/:userId?',
  minisController.get_mentioned_minis
);
router.post('/create_comment', minisController.create_comment);
router.post(
  '/create_comment_reply',
  minisController.create_comment_reply
);
router.put('/edit_comment_reply', minisController.edit_comment_reply);
router.delete(
  '/delete_comment_reply',
  minisController.delete_comment_reply
);

router.put('/edit_mini/:id', minisController.edit_mini);
router.put('/edit_mini_formData/:miniId',minisController.edit_mini_formData)
router.delete('/delete_mini/:id', minisController.delete_mini);
router.post('/other_user_minis', minisController.other_user_minis);
router.patch('/share', minisController.share);
router.post('/send_challange', minisController.send_challange);
router.get('/get_all_hashtags', minisController.get_all_hashtags);
router.post('/hashtag_search', minisController.hashtag_search);
router.post('/location_search', minisController.location_search);
router.get('/real_view_count/:id', minisController.real_view_count);
router.get(
  '/get_miniStatistics/:miniId',
  minisController.get_mini_statistics
);

router.get(
  '/get_user_mini_statistics',
  minisController.get_user_mini_statistics
);

router.post('/get_url', minisController.get_url);

router.post('/get_watch', minisController.get_watch);

module.exports = router;
