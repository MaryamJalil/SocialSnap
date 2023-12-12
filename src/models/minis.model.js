const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const minisSchema = new Schema(
  {
    caption: {
      type: String,
      default: '',
    },
    minis_url: {
      type: String,
      default: '',
    },
    preview_url: {
      type: String,
      default: '',
    },
    thumbnail: {
      type: String,
      default: '',
    },
    views_count: {
      type: Number,
      default: 0,
    },
    comment_count: {
      type: Number,
      default: 0,
    },
    likes_count: {
      type: Number,
      default: 0,
    },
    dislikes_count: {
      type: Number,
      default: 0,
    },
    is_dislike: {
      type: Boolean,
      default: false,
    },
    is_like: {
      type: Boolean,
      default: false,
    },
    replies_count: {
      type: Number,
      default: 0,
    },
    is_public: {
      type: Boolean,
      default: true,
    },
    repost_count: {
      type: Number,
      default: 0,
    },
    created_by: {
      type: ObjectId,
      ref: 'user',
    },
    report_count: {
      type: Number,
      default: 0,
    },
    share_count: {
      type: Number,
      default: 0,
    },
    reported: {
      type: Boolean,
      default: false,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    hash_tags: {
      type: Array,
    },
    reply_mini: {
      type: ObjectId,
      ref: 'mini',
    },
    mentions: [{ type: ObjectId, ref: 'user' }],
    location: {
      lat: {
        type: String,
        default: '',
      },
      lng: {
        type: String,
        default: '',
      },
      city: {
        type: String,
        default: '',
      },
      state: {
        type: String,
        default: '',
      },
      country: {
        type: String,
        default: '',
      },
    },
    is_saved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
minisSchema.index({ caption: 'text' });
module.exports = mongoose.model('mini', minisSchema);
