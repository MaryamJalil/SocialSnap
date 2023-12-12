const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const watchSchema = new Schema({
  start_time: {
    type: Date,
    required: true,
    default: Date.now,
  },
  end_time: {
    type: Date,
    required: true,
    default: Date.now,
  },
  duration: {
    type: Number,
    required: true,
    default: 0,
  },
});

const countrySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  value: {
    type: Number,
    required: true,
    default: 0,
  },
});

const citySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  value: {
    type: Number,
    required: true,
    default: 0,
  },
});
const minisStatisticsSchema = new Schema(
  {
    female_view: {
      type: Number,
      default: 0,
    },
    male_view: {
      type: Number,
      default: 0,
    },
    others_view: {
      type: Number,
      default: 0,
    },
    female_likes: {
      type: Number,
      default: 0,
    },
    male_likes: {
      type: Number,
      default: 0,
    },
    others_likes: {
      type: Number,
      default: 0,
    },
    female_comments: {
      type: Number,
      default: 0,
    },
    male_comments: {
      type: Number,
      default: 0,
    },
    others_comments: {
      type: Number,
      default: 0,
    },
    female_is_saved: {
      type: Number,
      default: 0,
    },
    male_is_saved: {
      type: Number,
      default: 0,
    },
    others_is_saved: {
      type: Number,
      default: 0,
    },
    mini: {
      type: ObjectId,
      ref: 'mini',
    },
    unique_users: {
      type: Number,
      ref: 'user',
    },
    countries: [countrySchema],
    cities: [citySchema],
    female_watches: [watchSchema],
    male_watches: [watchSchema],
    other_watches: [watchSchema],
  },
  { timestamps: true }
);
module.exports = mongoose.model(
  'mini_statistics',
  minisStatisticsSchema
);
