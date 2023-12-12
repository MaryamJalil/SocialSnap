'use strict';
const minisModel = require('../../models/minis.model');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
let debug = require('debug')('user');
const fs = require('fs');
const moment = require('moment');
const _ = require('lodash');
const usersModel = require('../../models/users.model');
const hashTagModel = require('../../models/hashtags.model');
const mini_like_dislike = require('../../models/minis_like_dislike.model');
const commentsModel = require('../../models/comments.model');
const comment_policy = require('../../services/app_policy/comment_policy');
const {
  storefileToS3,
} = require('../../services/middleware/filesUpload.middleware');
const {
  createFragmentPreview,
  captureThumbnail,
} = require('../../utils/ffmpeg');
const notificationModel = require('../../models/notification.model');
const { sendNotification } = require('../../utils/fcm');
const minis_like_dislikeModel = require('../../models/minis_like_dislike.model');
const minisStatisticsModel = require('../../models/minis_statistics.model');
const { NOTIFICATIONS } = require('../../constants/notification');
const {
  check_like,
  check_user_location,
} = require('../../services/app_policy/IsLike');
const express = require('express');
const app = express();
var TinyURL = require('tinyurl');

module.exports.create_minis = async (req, res) => {
  try {
    let thumbnail = '';
    let vedio_url = '';
    let preview_url = '';
    let is_saved = false;
    let {
      caption,
      is_public,
      hash_tags,
      mentions,
      lat,
      lng,
      city,
      state,
      country,
    } = req.body;
    if (hash_tags == '') {
      hash_tags = [];
    }
    const repeatedHashTags = await minisModel
      .find({ hash_tags: { $in: [req.body.hash_tags] } })
      .select('hash_tags');
    let has_tag_count;
    if (hash_tags) {
      has_tag_count = await hashTagModel.create({
        hash_tags: hash_tags,
        hash_tags_count:
          repeatedHashTags.length > 0 ? repeatedHashTags.length : 0,
      });
    }
    if (mentions == '') {
      mentions = [];
    }
    if (req.files.vedio) {
      const { path, fieldname, filename } = req.files.vedio[0];
      const { url, file_path } = await storefileToS3(
        path,
        `${fieldname}/${filename}`
      );
      let newFilename = req.files.vedio[0].filename.split('.')[0];
      vedio_url = url;
      const gif_loaction = await createFragmentPreview(
        file_path,
        `./src/files/gifs/${Date.now() + newFilename + '.gif'}`
      );
      const gif = await storefileToS3(
        gif_loaction,
        gif_loaction.split('gifs/')[1]
      );
      preview_url = gif.url;
      const ssPath = await captureThumbnail(
        file_path,
        newFilename + '.png'
      );
      const storedThumbnail = await storefileToS3(
        ssPath,
        newFilename + '.png'
      );
      thumbnail = storedThumbnail.url;
      fs.unlinkSync(ssPath);
      fs.unlinkSync(gif_loaction);
      fs.unlinkSync(file_path);
    }
    const minis_data = {
      minis_url: vedio_url,
      thumbnail,
      caption,
      is_saved,
      created_by: ObjectId(req.user._id),
      is_public,
      hash_tags,
      preview_url,
      mentions,
      location: {
        lat: lat,
        lng: lng,
        city: city,
        state: state,
        country: country,
      },
    };
    const create_mini = await minisModel.create(minis_data);
    const mini_statistics_data = {
      female_view: 0,
      male_view: 0,
      others_view: 0,
      female_likes: 0,
      male_likes: 0,
      others_likes: 0,
      female_comments: 0,
      male_comments: 0,
      others_comments: 0,
      mini: create_mini._id,
      unique_users: 0,
    };
    await minisStatisticsModel.create(mini_statistics_data);
    const user = await usersModel.findById(req.user._id);
    const follow_list = req.user.followers;
    user.followers.forEach(async (id) => {
      const user = await usersModel.findById(id);
      if (req.user._id.toString() !== user._id.toString()) {
        const { first_name, last_name } = req.user;
        const notification = {
          title: user.user_name,
          body: `${first_name} ${last_name} posted new Mini`,
          type: NOTIFICATIONS.NEW_MINI.type,
        };
        const notifictaion_doc = await notificationModel.create({
          user_id: user._id,
          body: 'posted new Mini',
          from: req.user._id,
          type: NOTIFICATIONS.NEW_MINI.type,
          mini: create_mini._id,
        });
        let notification_data;
        notification_data = {
          type: NOTIFICATIONS.NEW_MINI.type,
          user: req.user,
          notification_id: notifictaion_doc._id,
          mini: create_mini,
        };
        follow_list.map(async (folowerUser) => {
          const user = await usersModel.find({
            _id: ObjectId(folowerUser),
          });
          Object.entries(user.notification_token).forEach(
            async ([key, value]) => {
              if (value) {
                await sendNotification(
                  value,
                  notification,
                  notification_data
                );
              }
            }
          );
        });
      }
    });

    return res.status(200).json({
      status: 200,
      message: 'Mini has been created',
      data: { create_mini, has_tag_count },
    });
  } catch (error) {
    console.log(
      '🚀 ~ file: minis.controller.js:37 ~ module.exports.create_minis= ~ error',
      error
    );
    return res
      .status(400)
      .json({ status: 400, message: error.message });
  }
};

module.exports.create_minis_reply = async (req, res) => {
  try {
    let thumbnail = '';
    let vedio_url = '';
    let preview_url = '';
    const {
      caption,
      is_public,
      hash_tags,
      mini_id,
      mentions,
      lat,
      lng,
      city,
      state,
      country,
    } = req.body;
    let has_tag_count;
    if (hash_tags) {
      const repeatedHashTags = await minisModel
        .find({ hash_tags: { $in: [req.body.hash_tags] } })
        .select('hash_tags');
      await hashTagModel.create({
        hash_tags: hash_tags,
        hash_tags_count:
          repeatedHashTags.length > 0 ? repeatedHashTags.length : 0,
      });
    }
    if (req.files.vedio) {
      const { path, fieldname, filename } = req.files.vedio[0];
      const { url, file_path } = await storefileToS3(
        path,
        `${fieldname}/${filename}`
      );
      let newFilename = req.files.vedio[0].filename.split('.')[0];
      vedio_url = url;
      const gif_loaction = await createFragmentPreview(
        file_path,
        `./src/files/gifs/${Date.now() + newFilename + '.gif'}`
      );
      const gif = await storefileToS3(
        gif_loaction,
        gif_loaction.split('gifs/')[1]
      );
      preview_url = gif.url;
      const ssPath = await captureThumbnail(
        file_path,
        newFilename + '.png'
      );
      const storedThumbnail = await storefileToS3(
        ssPath,
        newFilename + '.png'
      );
      thumbnail = storedThumbnail.url;
      fs.unlinkSync(ssPath);
      fs.unlinkSync(gif_loaction);
      fs.unlinkSync(file_path);
    }
    const minis_data = {
      minis_url: vedio_url,
      thumbnail,
      caption,
      created_by: ObjectId(req.user._id),
      reply_mini: ObjectId(mini_id),
      is_public,
      hash_tags,
      mentions,
      location: {
        lat: lat,
        lng: lng,
        city: city,
        state: state,
        country: country,
      },
      preview_url,
    };
    const create_mini = await minisModel.create(minis_data);

    const get_minis = await minisModel.find({
      deleted: false,
      hash_tags: minis_data.hash_tags,
    });
    const hashtagData = {
      hashTags_count: get_minis.length,
      hash_tags: hash_tags,
    };
    await hashTagModel.create(hashtagData);
    const ggg = await minisModel;
    const get_mini = await minisModel.findById(ObjectId(mini_id));
    get_mini.replies_count = get_mini.replies_count + 1;
    get_mini.location = minis_data.location;
    get_mini.hash_tags = minis_data.hash_tags;
    get_mini.mentions = minis_data.mentions;
    await get_mini.save();
    const user = await usersModel.findById(req.user._id);
    user.followers.forEach(async (id) => {
      const user = await usersModel.findById(id);
      if (req.user._id.toString() !== user._id.toString()) {
        const { first_name, last_name } = req.user;
        const notification = {
          title: user.user_name,
          body: `${first_name} ${last_name} posted new Mini`,
          type: NOTIFICATIONS.NEW_MINI.type,
        };
        const notifictaion_doc = await notificationModel.create({
          user_id: user._id,
          body: 'posted new Mini',
          from: req.user._id,
          type: NOTIFICATIONS.NEW_MINI.type,
          mini: create_mini._id,
        });
        //nn  userid from sender receiver user_id
        let notification_data = {
          type: NOTIFICATIONS.NEW_MINI.type,
          user: req.user,
          notification_id: notifictaion_doc._id,
          mini: create_mini,
        };
        Object.entries(user.notification_token).forEach(
          async ([key, value]) => {
            if (value) {
              await sendNotification(
                value,
                notification,
                notification_data
              );
            }
          }
        );
      }
    });

    return res.status(200).json({
      status: 200,
      message: 'Mini has been created',
      create_mini,
      data: { create_mini, get_mini, has_tag_count },
    });
  } catch (error) {
    console.log(
      '🚀 ~ file: minis.controller.js:37 ~ module.exports.create_minis= ~ error',
      error
    );
    return res
      .status(400)
      .json({ status: 400, message: error.message });
  }
};

module.exports.get_reply_minis = async (req, res) => {
  try {
    // limit as 10
    let limit = req.query.limit || 10;
    limit = parseInt(limit);
    // page number
    let page = req.query.page || 1;
    page = parseInt(page);
    // calculate offset
    const skip = (page - 1) * limit;
    //check total task
    const totalminis = await minisModel.count({
      reply_mini: ObjectId(req.body.mini_id),
      deleted: false,
      is_public: true,
    });
    let numPages = Math.ceil(totalminis / limit);
    const get_minis = await minisModel
      .find({
        reply_mini: ObjectId(req.body.mini_id),
        deleted: false,
        is_public: true,
      })
      .sort({ createdAt: -1 })
      .populate('created_by')
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    console.log(
      '🚀 ~ file: minis.controller.js:61 ~ get_minis.forEach ~ req.user._id',
      req.user._id
    );
    get_minis.forEach((mini) => {
      if (req.user._id !== mini.created_by._id) {
        const is_i_follow = mini.created_by.followers.findIndex(
          (id) => id == req.user.id
        );
        if (is_i_follow > -1) {
          mini.created_by.is_followed = true;
        } else {
          mini.created_by.is_followed = false;
        }
      } else {
        mini.created_by.is_followed = null;
      }
      if (req.user.saved_mini_ids.includes(mini._id)) {
        mini.is_saved = true;
      } else {
        mini.is_saved = false;
      }
      mini.is_like = req.user.liked_mini_ids.includes(mini._id)
        ? true
        : false;
    });
    const get_mini_replies = await minisModel.find({
      reply_mini: ObjectId(req.body.mini_id),
    });
    const array = get_mini_replies.map((mini) => mini.created_by);
    const frequency = {};
    array.forEach((item) => {
      const key = item.toString();
      frequency[key] = frequency[key] ? frequency[key] + 1 : 1;
    });
    const sortedItems = Object.keys(frequency).sort(
      (a, b) => frequency[b] - frequency[a]
    );
    const rankMap = {};
    let rank = 1;
    sortedItems.forEach((item) => {
      if (!rankMap[frequency[item]]) {
        rankMap[frequency[item]] = rank;
        rank++;
      }
    });

    const result = array.map((item) => {
      const key = item.toString();
      const frequencyCount = frequency[key];
      const rankValue = rankMap[frequencyCount];
      return { _id: item, rank: rankValue };
    });

    return res.status(200).json({
      status: 200,
      message: 'Trending minis get successfully!',
      data: { get_minis, result, totalPages: numPages, page, limit },
    });
  } catch (error) {
    return res
      .status(400)
      .json({ status: 400, message: error.message });
  }
};
module.exports.trending_minis = async (req, res) => {
  try {
    // limit as 10
    let limit = req.query.limit || 10;
    limit = parseInt(limit);
    // page number
    let page = req.query.page || 1;
    page = parseInt(page);
    // calculate offset
    const skip = (page - 1) * limit;
    //check total task
    const totalminis = await minisModel.count({
      deleted: false,
      is_public: true,
      created_by: { $nin: req.user.blocked_users },
    });
    let numPages = Math.ceil(totalminis / limit);
    const get_minis = await minisModel
      .find({
        deleted: false,
        is_public: true,
        created_by: { $nin: req.user.blocked_users },
      })
      .where({ deleted: 'false' })
      .sort({ createdAt: -1 })
      .populate('created_by')
      .populate('mentions')
      .skip(skip)
      .limit(limit);
    // .lean()
    // .exec();
    if (req.user._id !== 'guest') {
      (async () => {
        _.map(get_minis, async (mini) => {
          if (req.user._id !== mini.created_by._id) {
            const is_i_follow = mini.created_by.followers.findIndex(
              (id) => id == req.user.id
            );
            if (is_i_follow > -1) {
              mini.created_by.is_followed = true;
            } else {
              mini.created_by.is_followed = false;
            }
          } else {
            mini.created_by.is_followed = null;
          }
          if (req.user.saved_mini_ids.includes(mini._id)) {
            mini.is_saved = true;
          } else {
            mini.is_saved = false;
          }
          console.log(req.user.liked_mini_ids, 'jiiihh');
          mini.is_like = req.user.liked_mini_ids.includes(mini._id)
            ? true
            : false;
          return await mini.save();
        });
      })();
    }
    return res.status(200).json({
      status: 200,
      message: 'Trending minis get successfully!',
      data: { get_minis, totalPages: numPages, page, limit },
    });
  } catch (error) {
    console.log(
      '🚀 ~ file: minis.controller.js:260 ~ module.exports.trending_minis= ~ error:',
      error
    );
    return res
      .status(400)
      .json({ status: 400, message: error.message });
  }
};

module.exports.trending_minis_public = async (req, res) => {
  try {
    // limit as 10
    let limit = req.query.limit || 10;
    limit = parseInt(limit);
    // page number
    let page = req.query.page || 1;
    page = parseInt(page);
    // calculate offset
    const skip = (page - 1) * limit;
    //check total task
    const totalminis = await minisModel.count({
      deleted: false,
      is_public: true,
    });
    let numPages = Math.ceil(totalminis / limit);
    const get_minis = await minisModel
      .find({ deleted: false, is_public: true })
      .sort({ createdAt: -1 })
      .populate('created_by')
      .populate('mentions')
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
    return res.status(200).json({
      status: 200,
      message: 'Trending minis get successfully!',
      data: { get_minis, totalPages: numPages, page, limit },
    });
  } catch (error) {
    return res
      .status(400)
      .json({ status: 400, message: error.message });
  }
};

module.exports.other_user_minis = async (req, res) => {
  try {
    // limit as 10
    const user_id = req.body.user_id;
    let limit = req.query.limit || 10;
    limit = parseInt(limit);
    // page number
    let page = req.query.page || 1;
    page = parseInt(page);
    // calculate offset
    const skip = (page - 1) * limit;
    //check total task
    const totalminis = await minisModel.count({
      deleted: false,
      is_public: true,
      created_by: ObjectId(user_id),
    });
    let numPages = Math.ceil(totalminis / limit);
    const get_minis = await minisModel
      .find({
        deleted: false,
        is_public: true,
        created_by: ObjectId(user_id),
      })
      .sort({ createdAt: -1 })
      .populate('created_by')
      .populate('mentions')
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
    get_minis.forEach(async (mini) => {
      if (req.user._id !== mini.created_by._id) {
        const is_i_follow = mini.created_by.followers.findIndex(
          (id) => id == req.user.id
        );
        if (is_i_follow > -1) {
          mini.created_by.is_followed = true;
        } else {
          mini.created_by.is_followed = false;
        }
      } else {
        mini.created_by.is_followed = null;
      }
      if (req.user.saved_mini_ids.includes(mini._id)) {
        mini.is_saved = true;
      } else {
        mini.is_saved = false;
      }
      mini.is_like = req.user.liked_mini_ids.includes(mini._id)
        ? true
        : false;
    });
    return res.status(200).json({
      status: 200,
      message: 'Other user minis get successfully!',
      data: { get_minis, totalPages: numPages, page, limit },
    });
  } catch (error) {
    return res
      .status(400)
      .json({ status: 400, message: error.message });
  }
};

module.exports.search_preview = async (req, res) => {
  try {
    // limit as 10
    let limit = req.query.limit || 10;
    limit = parseInt(limit);
    // page number
    let page = req.query.page || 1;
    page = parseInt(page);
    // calculate offset
    const skip = (page - 1) * limit;
    //check total task
    const totalminis = await minisModel.count();
    let numPages = Math.ceil(totalminis / limit);
    const get_minis = await minisModel
      .find()
      .where({ deleted: 'false' })
      .sort({ likes_count: -1 })
      .populate('created_by')
      .populate('mentions')
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
    return res.status(200).json({
      status: 200,
      message: 'Search previews get successfully!',
      data: { get_minis, totalPages: numPages, page, limit },
    });
  } catch (error) {
    return res
      .status(400)
      .json({ status: 400, message: error.message });
  }
};

module.exports.following_minis = async (req, res) => {
  try {
    // limit as 10
    let limit = req.query.limit || 10;
    limit = parseInt(limit);
    // page number
    let page = req.query.page || 1;
    page = parseInt(page);
    // calculate offset
    const skip = (page - 1) * limit;
    const following_ids = req.user.following;
    const blocked_users = req.user.blocked_users;
    
    let commented_liked_minis = [];
    const commented_minis = await commentsModel.find({
      created_by: req.user._id,
      deleted: false,
    });
    const liked_minis = await minis_like_dislikeModel.find({
      created_by: req.user._id,
      deleted: false,
    });
    
    if (commented_minis.length > 0) {
      for (let mini of commented_minis) {
        commented_liked_minis.push(mini.mini);
      }
    }
    if (liked_minis.length > 0) {
      for (let mini of liked_minis) {
        commented_liked_minis.push(mini.mini);
      }
    }
    
    const totalMinisQuery = {
      $or: [
        {
          created_by: { $in: following_ids },
          deleted: false,
          is_public: true,
        },
        { _id: { $in: commented_liked_minis } },
      ],
    };
    
    // Exclude blocked users' minis
    if (blocked_users.length > 0) {
      totalMinisQuery['created_by'] = { $nin: blocked_users };
    }
    
    const totalMinis = await minisModel.count(totalMinisQuery);
    let numPages = Math.ceil(totalMinis / limit);
    
    const getMinisQuery = {
      $or: [
        {
          created_by: { $in: following_ids },
          deleted: false,
          is_public: true,
        },
        { _id: { $in: commented_liked_minis } },
      ],
    };
    
    // Exclude blocked users' minis
    if (blocked_users.length > 0) {
      getMinisQuery['created_by'] = { $nin: blocked_users };
    }
    
    const getMinis = await minisModel
      .find(getMinisQuery)
      .sort({ createdAt: -1 })
      .populate('created_by')
      .populate('mentions')
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
    
    getMinis.forEach((mini) => {
      if (req.user._id !== mini.created_by._id) {
        const is_i_follow = mini.created_by.followers.findIndex(
          (id) => id == req.user.id
        );
        if (is_i_follow > -1) {
          mini.created_by.is_followed = true;
        } else {
          mini.created_by.is_followed = false;
        }
      } else {
        mini.created_by.is_followed = null;
      }
      if (req.user.saved_mini_ids.includes(mini._id)) {
        mini.is_saved = true;
      } else {
        mini.is_saved = false;
      }
      mini.is_like = req.user.liked_mini_ids.includes(mini._id)
        ? true
        : false;
    });
    
    return res.status(200).json({
      status: 200,
      message: 'Following minis retrieved successfully!',
      data: { get_minis: getMinis, totalPages: numPages, page, limit },
    });
  } catch (error) {
    return res.status(400).json({ status: 400, message: error.message });
  }
};

module.exports.self_minis_list = async (req, res) => {
  try {
    let limit = req.query.limit || 10;
    limit = parseInt(limit);
    let page = req.query.page || 1;
    page = parseInt(page);
    const skip = (page - 1) * limit;
    const totalminis = await minisModel.count({
      created_by: ObjectId(req.user._id),
      deleted: false,
    });
    let numPages = Math.ceil(totalminis / limit);
    const get_minis = await minisModel
      .find({ created_by: req.user._id, deleted: false })
      .sort({ createdAt: -1 })
      .populate('created_by')
      .populate('mentions')
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
    await Promise.all(
      get_minis.map(async (mini) => {
        if (req.user.saved_mini_ids.includes(mini._id)) {
          mini.is_saved = true;
        } else {
          mini.is_saved = false;
        }
        mini.is_like = req.user.liked_mini_ids.includes(mini._id)
          ? true
          : false;
      })
    );
    return res.status(200).json({
      status: 200,
      message: 'Following minis get successfully!',
      data: { get_minis, totalPages: numPages, page, limit },
    });
  } catch (error) {
    console.log(
      '🚀 ~ file: minis.controller.js:425 ~ module.exports.self_minis_list= ~ error:',
      error
    );
    return res
      .status(400)
      .json({ status: 400, message: error.message });
  }
};

module.exports.create_like_dislike = async (req, res) => {
  try {
    let like_dislike_data = {};
    const check_mini = await mini_like_dislike
      .findOne({
        minis: ObjectId(req.body.mini),
        created_by: ObjectId(req.user._id),
        deleted: false,
      })
      .populate('created_by');
    const user = await usersModel.findById(ObjectId(req.user._id));
    if (check_mini) {
      const del_mini = await mini_like_dislike.findByIdAndDelete(
        check_mini._id
      );
      const update_like_count = await minisModel.findById(
        req.body.mini
      );
      update_like_count.likes_count--;
      update_like_count.is_like = false;

      if (user.liked_mini_ids.includes(req.body.mini)) {
        const index = user.liked_mini_ids.indexOf(req.body.mini);
        user.liked_mini_ids.splice(index, 1);
        await user.save();
      }

      await update_like_count.save();
      let like_count = update_like_count.likes_count;
      return res.status(200).json({
        status: 200,
        message: 'unlike the mini like by you',
        data: {
          like_count: like_count,
          is_like: update_like_count.is_like,
        },
      });
    }
    if (req.body.like == true) {
      like_dislike_data = {
        mini: ObjectId(req.body.mini),
        like: true,
        created_by: ObjectId(req.user._id),
      };
      const update_like_count = await minisModel
        .findById(req.body.mini)
        .populate('created_by');
      update_like_count.likes_count++;
      update_like_count.is_like = true;
      await update_like_count.save();
      let like_count = update_like_count.likes_count;
      const create_like_dislike = await mini_like_dislike.create(
        like_dislike_data
      );

      user.liked_mini_ids.push(req.body.mini);
      await user.save();
      const { first_name, last_name } = req.user;
      const notification = {
        title: update_like_count.created_by.user_name,
        body: `${first_name} ${last_name} liked your Mini`,
        type: NOTIFICATIONS.MINI_LIKE.type,
      };
      const notifictaion_doc = await notificationModel.create({
        user_id: update_like_count.created_by._id,
        body: 'liked your mini',
        from: req.user._id,
        type: NOTIFICATIONS.MINI_LIKE.type,
        mini: update_like_count._id,
      });
      let notification_data = {
        type: NOTIFICATIONS.MINI_LIKE.type,
        user: req.user,
        notification_id: notifictaion_doc._id,
        mini: update_like_count,
      };
      if (
        update_like_count.created_by.notification_setting
          .likes_notification
      ) {
        Object.entries(
          update_like_count.created_by.notification_token
        ).forEach(async ([key, value]) => {
          if (value) {
            await sendNotification(
              value,
              notification,
              notification_data
            );
          }
        });
      }
      return res.status(200).json({
        status: 200,
        message: 'Minis Like/Dislike has been created',
        data: {
          create_like_dislike,
          like_count: like_count,
          is_like: update_like_count.is_like,
        },
      });
    }
  } catch (error) {
    console.log(
      '🚀 ~ file: minis.controller.js:273 ~ module.exports.create_like_dislike= ~ error',
      error
    );
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};
//this api is not used on frontend
module.exports.get_like_dislikes = async (req, res) => {
  try {
    const mini = req.body.mini;
    let result = '';
    result = await mini_like_dislike
      .find({ mini: ObjectId(mini) })
      .where({ deleted: 'false' })
      .populate('created_by')
      .lean()
      .exec();
    const mini_data = await minisModel.findById(req.body.mini);
    if (mini_data)
      mini_data.is_like = req.user.liked_mini_ids.includes(mini)
        ? true
        : false;
    return res.status(200).json({
      status: 200,
      message: 'Minis Like/Dislike has been get successfully!',
      data: { result, is_like: mini_data.is_like },
    });
  } catch (error) {
    return res
      .status(400)
      .json({ status: 400, message: error.message });
  }
};

module.exports.search_minis = async (req, res) => {
  try {
    const { caption } = req.query;
    const blockedUsers = req.user.blocked_users;
    
    const minisQuery = {
      $text: { $search: caption },
      deleted: false,
    };
    
    // Exclude blocked users' minis
    if (blockedUsers.length > 0) {
      minisQuery['created_by'] = { $nin: blockedUsers };
    }
    
    const minis = await minisModel
      .find(minisQuery, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .populate('created_by')
      .populate('mentions')
      .lean()
      .exec();

    const users = await usersModel
      .find(
        { $text: { $search: caption }, deleted: false }
      )
      .sort({ score: { $meta: 'textScore' } });

    minis.map((mini) => {
      if (req.user.saved_mini_ids.includes(mini._id)) {
        mini.is_saved = true;
      } else {
        mini.is_saved = false;
      }
      mini.is_like = req.user.liked_mini_ids.includes(mini._id)
        ? true
        : false;
    });

    const result = {
      minis,
      users,
    };

    return res.status(200).json({ status: 200, data: result });
  } catch (error) {
    console.log(
      '🚀 ~ file: minis.controller.js:377 ~ module.exports.search_minis= ~ error',
      error
    );
    return res.status(500).json({ status: 500, message: error.message });
  }
};


module.exports.create_comment = async (req, res) => {
  try {
    const check_policy = await comment_policy.check_comment_policy(
      req.body.mini,
      req.user._id
    );
    if (check_policy == false) {
      return res.status(403).json({
        status: 403,
        message: `Mini's owner policy is restricted to comment`,
      });
    }

    const blockedUsers = req.user.blocked_users || [];
    if (blockedUsers.includes(req.body.mini)) {
      return res.status(403).json({
        status: 403,
        message: `You are blocked from commenting on this Mini`,
      });
    }

    const comment_data = {
      mini: ObjectId(req.body.mini),
      comment: req.body.comment,
      created_by: ObjectId(req.user._id),
      mentions: req.body.mentions,
    };

    const create_comment = await commentsModel.create(comment_data);

    const update_comment_count = await minisModel
      .findById({ _id: ObjectId(req.body.mini) })
      .populate('created_by');
    update_comment_count.comment_count++;
    await update_comment_count.save();

    const { first_name, last_name, _id } = req.user;
    if (update_comment_count.created_by._id.toString() !== _id.toString()) {
      const notification = {
        title: update_comment_count.created_by.user_name,
        body: `${first_name} ${last_name} commented on your Mini`,
        type: NOTIFICATIONS.MINI_COMMENT.type,
      };
      const notification_doc = await notificationModel.create({
        user_id: update_comment_count.created_by._id,
        body: 'commented on your Mini',
        from: req.user._id,
        type: NOTIFICATIONS.MINI_COMMENT.type,
        mini: update_comment_count._id,
      });
      let notification_data = {
        type: NOTIFICATIONS.MINI_COMMENT.type,
        user: req.user,
        notification_id: notification_doc._id,
        mini: update_comment_count,
      };
// console.log(update_comment_count,"update_comment_countiwiwk")
      if (
        update_comment_count.created_by.notification_setting
          .comments_notification
      ) {
        // Send notification to the owner of the Mini
        Object.entries(
          update_comment_count.created_by.notification_token
        ).forEach(async ([key, value]) => {
          if (value) {
           const data= await sendNotification(value, notification, notification_data);
           console.log(data,"64403ec32982f2b2ea2c7e0578o")
          }
        });
      }
    }
    const miniStatistics = await minisStatisticsModel.findOne({
      mini: ObjectId(req.body.mini),
    });
    const user = await usersModel.findById(ObjectId(req.user._id));
    if (!user.commented_mini_ids.includes(req.body.mini)) {
      user.commented_mini_ids.push(req.body.mini);
      await user.save();
    }
    if (user && miniStatistics) {
      if (user.gender === 'female') {
        await minisStatisticsModel.updateOne(
          {
            _id: ObjectId(miniStatistics._id),
          },
          {
            $set: {
              female_comments:
                1 + parseInt(miniStatistics.female_comments),
            },
          }
        );
      }
      if (user.gender === 'male') {
        await minisStatisticsModel.updateOne(
          {
            _id: ObjectId(miniStatistics._id),
          },
          {
            $set: {
              male_comments:
                1 + parseInt(miniStatistics.male_comments),
            },
          }
        );
      } else if (user.gender === 'others') {
        await minisStatisticsModel.updateOne(
          {
            _id: ObjectId(miniStatistics._id),
          },
          {
            $set: {
              others_comments:
                1 + parseInt(miniStatistics.others_comments),
            },
          }
        );
      }
    }
    return res.status(200).json({
      status: 200,
      message: 'Comment has been created successfully!',
      data: {
        create_comment,
        comment_count: update_comment_count.comment_count,
      },
    });
  } catch (error) {
    console.log(
      '🚀 ~ file: minis.controller.js:388 ~ module.exports.create_comment= ~ error',
      error
    );
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};

module.exports.get_comments = async (req, res) => {
  try {
    const mini = req.params.id;
    let result = '';
    result = await commentsModel
      .find({ mini: ObjectId(mini), deleted: false })
      .populate('created_by')
      .populate({
        path: 'replies.created_by',
        deleted: false,
      })
      // .map(comment => {
      //   const nonDeletedReplies = comment.replies.filter(reply => !reply.deleted);
      //   return {
      //     ...comment,
      //     replies: nonDeletedReplies
      //   };
      // })

      // .replies.find({deleted: false})
      .lean()
      .exec();
    const filteredComments = result.map((comment) => {
      const nonDeletedReplies = comment.replies.filter(
        (reply) => !reply.deleted
      );
      return {
        ...comment,
        replies: nonDeletedReplies,
      };
    });

    // console.log("🚀 ~ file: minis.controller.js:1021 ~ module.exports.get_comments= ~ result:", JSON.stringify(filteredComments));
    return res.status(200).json({
      status: 200,
      message: 'Minis comments has been get successfully!',
      data: filteredComments,
    });
  } catch (error) {
    console.log(
      '🚀 ~ file: minis.controller.js:439 ~ module.exports.get_comments= ~ error',
      error
    );
    return res
      .status(400)
      .json({ status: 400, message: error.message });
  }
};

module.exports.create_comment_reply = async (req, res) => {
  try {
    const comment_data = {
      reply: req.body.reply,
      created_by: ObjectId(req.user.id),
      time: moment(),
    };
    const user = await usersModel.findOne({ _id: req.user.id });
    const update_comment_count = await commentsModel
      .findById(req.body.comment)
      .where({ deleted: 'false' })
      .populate('created_by');
    update_comment_count.replies.push(comment_data);
    update_comment_count.reply_count++;
    await update_comment_count.save();

    const mini_comment_count = await minisModel
      .findById({ _id: ObjectId(update_comment_count.mini) })
      .populate('created_by');

    mini_comment_count.comment_count++;
    await mini_comment_count.save();

    const { first_name, last_name } = req.user;
    const notification = {
      title: update_comment_count.created_by.user_name,
      body: `${first_name} ${last_name} replied to your comment.`,
      type: NOTIFICATIONS.MINI_COMMENT_REPLY.type,
    };
    const notifictaion_doc = await notificationModel.create({
      user_id: update_comment_count.created_by._id,
      body: 'replied to your comment',
      from: req.user._id,
      type: NOTIFICATIONS.MINI_COMMENT_REPLY.type,
      mini: update_comment_count.mini,
    });
    let notification_data = {
      type: NOTIFICATIONS.MINI_COMMENT_REPLY.type,
      user: req.user,
      notification_id: notifictaion_doc._id,
      mini: update_comment_count.mini,
      comment_id: req.body.comment,
    };

    if (
      update_comment_count.created_by.notification_setting
        .comments_notification
    ) {
      Object.entries(
        update_comment_count.created_by.notification_token
      ).forEach(async ([key, value]) => {
        if (value) {
          await sendNotification(
            value,
            notification,
            notification_data
          );
        }
      });
    }
    return res.status(200).json({
      status: 200,
      message: 'reply comment has been created successfully!',
      data: update_comment_count,
    });
  } catch (error) {
    console.log(
      '🚀 ~ file: minis.controller.js:481 ~ module.exports.create_comment_reply= ~ error',
      error
    );
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};

module.exports.edit_comment_reply = async (req, res) => {
  try {
    const comment_id = req.body.comment_id;
    const update_comment_count = await commentsModel
      .find({
        replies: { $elemMatch: { _id: ObjectId(req.body.reply_id) } },
      })
      .where({ deleted: 'false' });
    if (update_comment_count) {
      const updateDocument = {
        $set: { 'replies.$.reply': req.body.reply },
      };
      await commentsModel.updateOne(
        {
          _id: ObjectId(comment_id),
          'replies._id': req.body.reply_id,
        },
        updateDocument
      );
    }
    const coments_replyData = await commentsModel.find({
      replies: { $elemMatch: { _id: ObjectId(req.body.reply_id) } },
    });
    return res.status(200).json({
      status: 200,
      message: 'reply comment has been created successfully!',
      data: coments_replyData,
    });
  } catch (error) {
    console.log(
      '🚀 ~ file: minis.controller.js:481 ~ module.exports.create_comment_reply= ~ error',
      error
    );
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};

module.exports.share = async (req, res) => {
  try {
    const { mini_id } = req.body;
    const mini = await minisModel.findOne({ _id: mini_id });
    if (!mini_id) {
      return res
        .status(404)
        .json({ success: true, message: 'Content not foundS!' });
    }
    let count = mini.share_count || 0;
    mini.share_count = ++count;
    await mini.save();
    return res
      .status(200)
      .json({ status: 200, message: 'Shared!', data: result });
  } catch (error) {
    console.log(
      '🚀 ~ file: minis.controller.js:309 ~ module.exports.share= ~ error',
      error
    );
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};

module.exports.edit_mini = async (req, res) => {
  try {
    const miniId = req.params.id;
    const userId = req.user.id;

    const mini = await minisModel.findOne({
      _id: miniId,
      created_by: userId,
      deleted: false,
    });

    if (mini) {
      mini.caption = req.body.caption || mini.caption;
      mini.location.city = req.body.location.city || mini.location.city;
      mini.location.country = req.body.location.country || mini.location.country;
      mini.location.state = req.body.location.state || mini.location.state;
      mini.location.lat = req.body.location.lat || mini.location.lat;
      mini.location.lng = req.body.location.lng || mini.location.lng;

      await mini.save();

      return res.status(200).json({
        status: 200,
        message: 'Mini has been updated',
        data: mini,
      });
    }

    return res.status(400).json({
      status: 400,
      message: 'Mini not found or you are not the owner of the mini',
    });
  } catch (error) {
    console.log('Error:', error);
    return res.status(400).json({ status: 400, message: error.message });
  }
};

module.exports.edit_mini_formData = async (req, res) => {
  try {
    console.log(req.body,"hdjj")
    const miniId = req.params.miniId;
    const userId = req.user.id;

    const mini = await minisModel.findOne({
      _id: miniId,
      // created_by: userId,
      // deleted: false,
    });
    if (mini) {
      let {
        caption,
        is_public,
        hash_tags,
        mentions,
        lat,
        lng,
        city,
        state,
        country,
      } = req.body;

     mini.caption = caption || mini.caption;
      mini.is_public = is_public || mini.is_public;
      mini.hash_tags = hash_tags || mini.hash_tags;
      mini.mentions = mentions || mini.mentions;
      mini.location.lat = lat || mini.location.lat;
      mini.location.lng = lng || mini.location.lng;
      mini.location.city = city || mini.location.city;
      mini.location.state = state || mini.location.state;
      mini.location.country = country || mini.location.country;

      // mini.formData = req.body.formData;

      await mini.save();

      return res.status(200).json({
        status: 200,
        message: 'Mini has been updated',
        data: mini,
      });
    }

    return res.status(400).json({
      status: 400,
      message: 'Mini not found or you are not the owner of the mini',
    });
  } catch (error) {
    console.log('Error:', error);
    return res.status(400).json({ status: 400, message: error.message });
  }
};

module.exports.delete_mini = async (req, res) => {
  try {
    const mini_id = req.params.id;
    const mini = await minisModel.findOne({
      _id: mini_id,
      created_by: ObjectId(req.user.id),
      deleted: false,
    });
    if (mini) {
      mini.deleted = true;
      await mini.save();
      return res
        .status(200)
        .json({ status: 200, message: 'Mini has been deleted' });
    }
    return res.status(400).json({
      status: 400,
      message: 'Mini not found or you are not owner of mini',
    });
  } catch (error) {
    console.log(
      '🚀 ~ file: minis.controller.js:530 ~ module.exports.delete_mini= ~ error',
      error
    );
    return res
      .status(400)
      .json({ status: 400, message: error.message });
  }
};

module.exports.delete_comment_reply = async (req, res) => {
  try {
    const comment_id = req.body.comment_id;
    const comments = await commentsModel.findOne({
      _id: ObjectId(comment_id),
      replies: { $elemMatch: { _id: ObjectId(req.body.reply_id) } },
    });
    const update_comment_count = await minisModel
      .findById(comments.mini)
      .populate('created_by');
    update_comment_count.comment_count =
      update_comment_count.comment_count <= 0
        ? 0
        : update_comment_count.comment_count - 1;
    await minisModel.findOneAndUpdate(
      { _id: ObjectId(comments.mini) },
      {
        $set: { comment_count: update_comment_count.comment_count },
      }
    );
    if (comments) {
      const updateDocument = {
        $set: { 'replies.$.deleted': true },
      };
      await commentsModel.updateOne(
        {
          _id: ObjectId(comment_id),
          'replies._id': req.body.reply_id,
        },
        updateDocument
      );
      // console.log("🚀 ~ file: minis.controller.js:1271 ~ module.exports.delete_comment_reply= ~ updateDocument:", comments)

      return res.status(200).json({
        status: 200,
        message: 'comment reply has been deleted',
      });
    }
    return res.status(400).json({
      status: 400,
      message:
        'comment reply not found or you are not owner of comment reply',
    });
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json({ status: 400, message: error.message });
  }
};
module.exports.send_challange = async (req, res) => {
  try {
    const get_mini = await minisModel.findById(req.body.mini_id);
    const get_users = await usersModel.find({
      _id: { $in: req.body.users },
    });
    for (user of get_users) {
      const notification = {
        title: user.user_name,
        body: `${req.user.first_name} ${req.user.last_name} Sent you Mini Challenge.`,
        type: NOTIFICATIONS.CHALLANGE.type,
      };
      const notifictaion_doc = await notificationModel.create({
        user_id: user._id,
        body: 'Sent you Mini Challenge',
        from: req.user._id,
        type: NOTIFICATIONS.CHALLANGE.type,
        mini: get_mini._id,
      });
      let notification_data = {
        type: NOTIFICATIONS.CHALLANGE.type,
        user: req.user,
        notification_id: notifictaion_doc._id,
        mini: get_mini,
      };
      Object.entries(user.notification_token).forEach(
        async ([key, value]) => {
          if (value) {
            await sendNotification(
              value,
              notification,
              notification_data
            );
          }
        }
      );
    }
    return res
      .status(200)
      .json({ status: 200, message: 'challange has been sent' });
  } catch (error) {
    return res
      .status(400)
      .json({ status: 400, message: error.message });
  }
};

module.exports.get_all_hashtags = async (req, res) => {
  try {
    const minis = await minisModel
      .find({ hash_tags: { $ne: [] } })
      .select('hash_tags views_count');
    const tags = minis.map((mini) => mini.hash_tags).flat();
    const tagCounts = tags.reduce((counts, tag) => {
      if (tag in counts) {
        counts[tag]++;
      } else {
        counts[tag] = 1;
      }
      return counts;
    }, {});

    const formattedTags = Object.keys(tagCounts)
      .map((tagname) => {
        return { tagname, count: tagCounts[tagname] };
      })
      .sort((a, b) => b.count - a.count);

    return res.status(200).json({
      status: 200,
      message: 'All hash tags get successfully!',
      data: { hash_tags: formattedTags },
    });
  } catch (error) {
    return res
      .status(400)
      .json({ status: 400, message: error.message });
  }
};

module.exports.hashtag_search = async (req, res) => {
  try {
    const get_mini = await minisModel
      .find({ hash_tags: { $regex: req.body.tag, $options: 'i' } })
      .populate('created_by')
      .lean()
      .exec();
    return res.status(200).json({
      status: 200,
      message: 'Hashtag minis get successfully!',
      data: get_mini,
    });
  } catch (error) {
    return res
      .status(400)
      .json({ status: 400, message: error.message });
  }
};

module.exports.location_search = async (req, res) => {
  try {
    const keyword = req.body.keyword;
    const get_mini = await minisModel
      .find({
        $or: [
          {
            'location.city': { $regex: `${keyword}`, $options: 'i' },
          },
          {
            'location.state': { $regex: `${keyword}`, $options: 'i' },
          },
          {
            'location.country': {
              $regex: `${keyword}`,
              $options: 'i',
            },
          },
        ],
      })
      .populate('created_by')
      .lean()
      .exec();
    get_mini.map((mini) => {
      mini.is_saved = req.user.saved_mini_ids.includes(mini._id)
        ? true
        : false;
      mini.is_like = req.user.liked_mini_ids.includes(mini._id)
        ? true
        : false;
    });

    return res.status(200).json({
      status: 200,
      message: 'location minis get successfully!',
      data: get_mini,
    });
  } catch (error) {
    return res
      .status(400)
      .json({ status: 400, message: error.message });
  }
};
module.exports.minis_views_count = async (req, res) => {
  try {
    const mini_id = req.params.id;
    const mini = await minisModel.findOne({
      _id: ObjectId(mini_id),
    });
    const miniStatistics = await minisStatisticsModel.findOne({
      mini: ObjectId(mini_id),
    });
    const user = await usersModel.findById(ObjectId(req.user.id));
    const hasViewedBefore = user.viewed_mini_ids.includes(mini_id);

    if (!hasViewedBefore) {
      user.viewed_mini_ids.push(mini_id);
      await user.save();
      if (miniStatistics && typeof miniStatistics.unique_users === 'number' && !isNaN(miniStatistics.unique_users)) {
        await minisStatisticsModel.updateOne(
          {
            _id: ObjectId(miniStatistics._id),
          },
          {
            $set: {
              unique_users: miniStatistics.unique_users + 1,
            },
          }
        );
      }
    }

    if (mini) {
      mini.views_count = (mini.views_count || 0) + 1;
      await mini.save();
    }

    if (user && miniStatistics) {
      if (user.gender === 'female') {
        await minisStatisticsModel.updateOne(
          {
            _id: ObjectId(miniStatistics._id),
          },
          {
            $set: {
              female_view: Math.max(
                0,
                miniStatistics.female_view + 1
              ),
            },
          }
        );
      }
      if (user.gender === 'male') {
        await minisStatisticsModel.updateOne(
          {
            _id: ObjectId(miniStatistics._id),
          },
          {
            $set: {
              male_view: Math.max(0, miniStatistics.male_view + 1),
            },
          }
        );
      } else if (user.gender === 'others') {
        await minisStatisticsModel.updateOne(
          {
            _id: ObjectId(miniStatistics._id),
          },
          {
            $set: {
              others_view: Math.max(
                0,
                miniStatistics.others_view + 1
              ),
            },
          }
        );
      }
    }
    return res.status(200).json({
      status: 200,
      message: 'Mini views count has been updated',
      data: mini,
    });
  } catch (error) {
    return res
      .status(400)
      .json({ status: 400, message: error.message });
  }
};

module.exports.saved_minis_byId = async (req, res) => {
  try {
    const { mini_id } = req.body;
    const { _id } = req.user;

    const minis = await minisModel.findById(ObjectId(mini_id), {
      deleted: false,
    });
    const user = await usersModel.findById(ObjectId(_id));

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: 'User not found',
      });
    }
    const miniStatistics = await minisStatisticsModel.findOne({
      mini: ObjectId(mini_id),
    });

    if (user.saved_mini_ids.includes(mini_id)) {
      const index = user.saved_mini_ids.indexOf(mini_id);
      user.saved_mini_ids.splice(index, 1);
      minis.is_saved = false;
      await user.save();

      if (user && miniStatistics) {
        // _.forEach(users, (user) => {
        if (user.gender === 'female') {
          await minisStatisticsModel.updateOne(
            {
              _id: ObjectId(miniStatistics._id),
            },
            {
              $set: {
                female_is_saved: Math.max(
                  0,
                  miniStatistics.female_is_saved - 1
                ),
              },
            }
          );
        }
        if (user.gender === 'male') {
          await minisStatisticsModel.updateOne(
            {
              _id: ObjectId(miniStatistics._id),
            },
            {
              $set: {
                male_is_saved: Math.max(
                  0,
                  miniStatistics.male_is_saved - 1
                ),
              },
            }
          );
        } else if (user.gender === 'others') {
          await minisStatisticsModel.updateOne(
            {
              _id: ObjectId(miniStatistics._id),
            },
            {
              $set: {
                others_is_saved: Math.max(
                  0,
                  miniStatistics.others_is_saved - 1
                ),
              },
            }
          );
        }
      }
      return res.status(200).json({
        status: 200,
        message: 'UNSaved minis',
        data: minis,
      });
    }

    user.saved_mini_ids.push(mini_id);
    minis.is_saved = true;
    await user.save();
    if (user && miniStatistics) {
      // _.forEach(users, (user) => {
      if (user.gender === 'female') {
        await minisStatisticsModel.updateOne(
          {
            _id: ObjectId(miniStatistics._id),
          },
          {
            $set: {
              female_is_saved: Math.max(
                0,
                miniStatistics.female_is_saved + 1
              ),
            },
          }
        );
      }
      if (user.gender === 'male') {
        await minisStatisticsModel.updateOne(
          {
            _id: ObjectId(miniStatistics._id),
          },
          {
            $set: {
              male_is_saved: Math.max(
                0,
                miniStatistics.male_is_saved + 1
              ),
            },
          }
        );
      } else if (user.gender === 'others') {
        await minisStatisticsModel.updateOne(
          {
            _id: ObjectId(miniStatistics._id),
          },
          {
            $set: {
              others_is_saved: Math.max(
                0,
                miniStatistics.others_is_saved + 1
              ),
            },
          }
        );
      }
    }
    return res.status(200).json({
      status: 200,
      message: 'Saved minis',
      data: minis,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error',
    });
  }
};

module.exports.saved_minis = async (req, res) => {
  try {
    const { _id } = req.user;
    const user = await usersModel.findById(ObjectId(_id));
    let minis = [];

    if (user) {
      await Promise.all(
        _.map(user.saved_mini_ids, async (saved_mini) => {
          console.log(saved_mini, 'saved_mini');

          const minisResult = await minisModel
            .find({
              deleted: false,
              _id: { $in: saved_mini },
            })
            .populate('created_by');

          const updatedMinis = minisResult.map((mini) => {
            const updatedMini = {
              ...mini.toObject(),
              is_saved: req.user.saved_mini_ids.includes(mini._id),
              is_like: req.user.liked_mini_ids.includes(mini._id)
                ? true
                : false,
            };
            return updatedMini;
          });

          minis.push(...updatedMinis);
        })
      );
    }
    minis.forEach((mini) => {
      if (req.user._id !== mini.created_by._id) {
        const is_i_follow = mini.created_by.followers.findIndex(
          (id) => id == req.user.id
        );
        if (is_i_follow > -1) {
          mini.created_by.is_followed = true;
        } else {
          mini.created_by.is_followed = false;
        }
      } else {
        mini.created_by.is_followed = null;
      }
    });
    return res.status(200).json({
      status: 200,
      message: 'Saved minis',
      data: minis,
    });
  } catch (error) {
    console.error(error);
  }
};

module.exports.get_mentioned_minis = async (req, res) => {
  const objectIdStr = `${req.user._id}`;
  const user_id = req.params.userId;
  let minis;
  try {
    // limit as 10
    let limit = req.query.limit || 10;
    limit = parseInt(limit);
    // page numberπuserπ
    let page = req.query.page || 1;
    page = parseInt(page);
    // calculate offset
    const skip = (page - 1) * limit;
    //check total task
    const totalminis = await minisModel.count({
      deleted: false,
      is_public: true,
    });
    let numPages = Math.ceil(totalminis / limit);

    if (user_id) {
      minis = await minisModel
        .find({
          deleted: false,
          mentions: { $in: [user_id] },
        })
        .populate('created_by')
        .populate('mentions')
        .skip(skip)
        .limit(limit)
        .lean()
        .exec();
      minis.map(async (mini) => {
        if (req.user.saved_mini_ids.includes(mini._id)) {
          mini.is_saved = true;
        } else {
          mini.is_saved = false;
        }
        mini.is_like = req.user.liked_mini_ids.includes(mini._id)
          ? true
          : false;
      });
    } else {
      minis = await minisModel
        .find({
          deleted: false,
          mentions: { $in: [objectIdStr] },
        })
        .populate('created_by')
        .populate('mentions')
        .skip(skip)
        .limit(limit)
        .lean()
        .exec();
      minis.map(async (mini) => {
        if (req.user.saved_mini_ids.includes(mini._id)) {
          mini.is_saved = true;
        } else {
          mini.is_saved = false;
        }
        mini.is_like = req.user.liked_mini_ids.includes(mini._id)
          ? true
          : false;
      });
    }
    minis.forEach((mini) => {
      if (req.user._id !== mini.created_by._id) {
        const is_i_follow = mini.created_by.followers.findIndex(
          (id) => id == req.user.id
        );
        if (is_i_follow > -1) {
          mini.created_by.is_followed = true;
        } else {
          mini.created_by.is_followed = false;
        }
      } else {
        mini.created_by.is_followed = null;
      }
    });
    return res.status(200).json({
      status: 200,
      message: 'Mentioned user minis are here!',
      data: { minis, totalPages: numPages, page, limit },
    });
  } catch (error) {
    return res
      .status(400)
      .json({ status: 400, message: error.message });
  }
};
module.exports.get_mini_statistics = async (req, res) => {
  try {
    const mini = req.params.miniId;
    const miniStat = await minisStatisticsModel.findOne({
      mini: ObjectId(mini),
    });
    const user = await usersModel.findById(ObjectId(req.user.id));

    const total_views = miniStat.female_view + miniStat.male_view;

    const location_views = await check_user_location(mini);
    console.log(location_views, 'location_viewshyhh');
    const miniStatistics = {
      ...miniStat.toObject(),
      total_views,
      location_views,
    };
    return res.status(200).json({
      status: 200,
      message: 'Mini views count has been updated',
      data: miniStatistics,
    });
  } catch (error) {
    return res
      .status(400)
      .json({ status: 400, message: error.message });
  }
};

module.exports.get_user_mini_statistics = async (req, res) => {
  try {
    const userId = req.user.id;
    const minis = await minisModel.find({ created_by: userId });
    const miniStatisticsArray = await Promise.all(
      minis.map(async (mini) => {
        const miniStat = await minisStatisticsModel.findOne({
          mini: ObjectId(mini._id),
        });
        const total_views = miniStat?.female_view + miniStat?.male_view;

        const location_views = await check_user_location(mini);
        const miniStatistics = {
          ...miniStat.toObject(),
          total_views,
          location_views,
        };
        return miniStatistics;
      })
    );

    return res.status(200).json({
      status: 200,
      message: 'Mini stats',
      data: miniStatisticsArray,
    });
  } catch (error) {
    return res
      .status(400)
      .json({ status: 400, message: error.message });
  }
};

module.exports.get_watch = async (req, res) => {
  try {
    const { start_time, end_time, duration, mini } = req.body;
    const user = await usersModel.findById(ObjectId(req.user._id));
    if (
      user.gender === 'female' ||
      user.gender === 'male' ||
      user.gender === 'others'
    ) {
      const miniStatistics = await minisStatisticsModel.findOne({
        mini: ObjectId(mini),
      });
      let femaleWatchIndex = -1;
      let maleWatchIndex = -1;
      let otherWatchIndex = -1;
      if (miniStatistics) {
        femaleWatchIndex = miniStatistics.female_watches.findIndex(
          (watch) =>
            watch.user_id && watch.user_id.toString() === req.user._id
        );
        maleWatchIndex = miniStatistics.male_watches.findIndex(
          (watch) =>
            watch.user_id && watch.user_id.toString() === req.user._id
        );
        otherWatchIndex = miniStatistics.other_watches.findIndex(
          (watch) =>
            watch.user_id && watch.user_id.toString() === req.user._id
        );
      }
      if (femaleWatchIndex === -1 && user.gender === 'female') {
        // if user has not watched this mini before, add a new watch
        miniStatistics.female_watches.push({
          user_id: ObjectId(req.user._id),
          start_time: moment(start_time),
          end_time: moment(end_time),
          duration,
        });
      }

      if (maleWatchIndex === -1 && user.gender === 'male') {
        // if user has not watched this mini before, add a new watch
        miniStatistics.male_watches.push({
          user_id: ObjectId(req.user._id),
          start_time: moment(start_time),
          end_time: moment(end_time),
          duration,
        });
      }
      if (otherWatchIndex === -1 && user.gender === 'others') {
        // if user has not watched this mini before, add a new watch
        miniStatistics.other_watches.push({
          user_id: ObjectId(req.user._id),
          start_time: moment(start_time),
          end_time: moment(end_time),
          duration,
        });
      } else if (femaleWatchIndex !== -1 && user.gender === 'male') {
        // if user has watched this mini before, update the watch
        miniStatistics.male_watches[femaleWatchIndex].start_time =
          moment(start_time);
        miniStatistics.male_watches[femaleWatchIndex].end_time =
          moment(end_time);
        miniStatistics.male_watches[femaleWatchIndex].duration =
          duration;
      } else if (maleWatchIndex !== -1 && user.gender === 'male') {
        // if user has watched this mini before, update the watch
        miniStatistics.male_watches[maleWatchIndex].start_time =
          moment(start_time);
        miniStatistics.male_watches[maleWatchIndex].end_time =
          moment(end_time);
        miniStatistics.male_watches[maleWatchIndex].duration =
          duration;
      } else if (otherWatchIndex !== -1 && user.gender === 'male') {
        // if user has watched this mini before, update the watch
        miniStatistics.male_watches[otherWatchIndex].start_time =
          moment(start_time);
        miniStatistics.male_watches[otherWatchIndex].end_time =
          moment(end_time);
        miniStatistics.male_watches[otherWatchIndex].duration =
          duration;
      }
      await miniStatistics.save();
    }
    const updatedMiniStatistics = await minisStatisticsModel.findOne({
      mini: ObjectId(mini),
    });
    return res.status(200).json({
      status: 200,
      message: 'Female watches count has been updated',
      data: updatedMiniStatistics,
    });
  } catch (error) {
    return res
      .status(400)
      .json({ status: 400, message: error.message });
  }
};

module.exports.get_url = async (req, res) => {
  try {
    const baseUrl = 'https://www.shareslate.fun/';
    const string = req.body.stringURL;
    const url = `https://shareslate.fun/${string}`;
    const tiny = await TinyURL.shorten(url);

    const shortenedUrl = tiny.replace(
      'https://tinyurl.com/',
      baseUrl
    );

    return res.status(200).json({
      status: 200,
      message: 'Successfully shortened URL',
      data: { originalUrl: url, shortenedUrl },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(400)
      .json({ status: 400, message: error.message });
  }
};

module.exports.real_view_count = async (req, res) => {
  try {
    const mini_id = req.params.id;
    const mini_statistics = await minisStatisticsModel.findOne({
      mini: ObjectId(mini_id),
    });
    return res.status(200).json({
      status: 200,
      message: 'Real view count updated successfully!',
      mini_statistics,
    });
  } catch (error) {
    return res
      .status(400)
      .json({ status: 400, message: error.message });
  }
};
