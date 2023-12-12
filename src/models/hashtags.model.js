const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const hashTags = new Schema(
  {
    deleted: {
      type: Boolean,
      default: false,
    },
    hash_tags: {
      type: Array,
    },
    hashTags_count: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model('hashtags', hashTags);
