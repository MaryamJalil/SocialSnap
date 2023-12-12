const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const usersSchema = new Schema(
  {
    first_name: {
      type: String,
      default: '',
      trim: true,
    },
    notification_token: Object,
    last_name: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      default: '',
      trim: true,
      unique: true,
      // required: true,
    },
    user_name: {
      type: String,
      default: '',
      trim: true,
      unique: true,
    },
    phone_no: {
      type: String,
      default: '',
      trim: true,
    },
    password: {
      type: String,
      default: null,
    },
    cover_image: {
      type: String,
      default: '',
    },
    profile_image: {
      type: String,
      default: '',
    },
    referral_code: {
      type: String,
      default: '',
    },
    list_of_minis: [
      {
        minis_url: {
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
      },
    ],
    follower_count: {
      type: Number,
      default: 0,
    },
    following_count: {
      type: Number,
      default: 0,
    },
    is_followed: {
      type: Boolean,
      default: false,
    },
    user_bio: {
      type: String,
      default: '',
    },
    work: {
      type: String,
      default: '',
    },
    relationship_status: {
      type: String,
      default: null,
    },
    your_interests: [],
    address: {
      city: String,
      country: String,
    },
    date_of_birth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      default: 'others',
    },
    following: [],
    followers: [
      {
        type: ObjectId,
        ref: 'user',
      },
    ],
    active: {
      type: Boolean,
      default: true,
    },
    is_private: {
      type: Boolean,
      default: false,
    },
    google_id: {
      type: String,
      default: '',
    },
    apple_id: {
      type: String,
      default: '',
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    notification_setting: {
      comments_notification: {
        type: Boolean,
        default: false,
      },
      likes_notification: {
        type: Boolean,
        default: false,
      },
      following_notification: {
        type: Boolean,
        default: false,
      },
    },
    privacy_setting: {
      private_account: {
        type: Boolean,
        default: false,
      },
      who_can_follow_you: {
        type: String,
        default: 'public',
      },
      who_can_comment_on_mini: {
        type: String,
        default: 'public',
      },
    },
    otp: {
      type: String,
      default: null,
    },
    deleted_at: {
      type: Date,
      default: null,
    },
    blocked_users: {
      type: Array,
    },
    is_admin: {
      type: Boolean,
      default: false,
    },
    saved_mini_ids: [
      {
        type: ObjectId,
        ref: 'mini',
      },
    ],
    viewed_mini_ids: [
      {
        type: ObjectId,
        ref: 'mini',
      },
    ],
    liked_mini_ids: [
      {
        type: ObjectId,
        ref: 'mini',
      },
    ],
    commented_mini_ids: [
      {
        type: ObjectId,
        ref: 'mini',
      },
    ],
  },
  { timestamps: true }
);
usersSchema.index({
  first_name: 'text',
  last_name: 'text',
  user_name: 'text',
});
module.exports = mongoose.model('user', usersSchema);
