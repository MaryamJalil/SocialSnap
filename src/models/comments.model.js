const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const commentSchema = new Schema(
  {
    mini: {
      type: ObjectId,
      ref: 'mini',
    },
    created_by: {
      type: ObjectId,
      ref: 'user',
    },
    comment: {
      type: String,
      default: '',
    },
    reply_count: {
      type: Number,
      default: 0,
    },
    replies: [
      {
        created_by: {
          type: ObjectId,
          ref: 'user',
        },
        reply: {
          type: String,
          default: '',
        },
        like_count: {
          type: Number,
          default: 0,
        },
        time: {
          type: Date,
          default: null,
        },
        deleted: {
          type: Boolean,
          default: false,
        },
      },
    ],
    like_count: {
      type: Number,
      default: 0,
    },
    mentions: {
      type: Array,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model('comment', commentSchema);
