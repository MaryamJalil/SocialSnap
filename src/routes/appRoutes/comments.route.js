const express = require('express');
const router = express.Router();
const passport = require('passport');
const commentsController = require('../../controllers/appControllers/comments.controller');

router.use(passport.authenticate('jwt', { session: false }));
router.put('/edit_mini_comments/:id', commentsController.edit);
router.delete(
  '/delete_mini_comment',
  commentsController.delete_mini_comment
);

module.exports = router;
