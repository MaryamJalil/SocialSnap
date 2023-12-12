const { check, validationResult } = require('express-validator');
const usersModel = require('../../models/users.model');
const notificationModel = require('../../models/notification.model');
const mongoose = require('mongoose');
const securePin = require('secure-pin');
const utils = require('../../services/libs/utils');
const axios = require('axios');
const moment = require('moment');
const { sendEmail, sendEmailForOtpVerification, sendForgotPassword } = require('../../utils/ses');
const {
  check_following_policy,
} = require('../../services/app_policy/following_policy');
const { sendNotification } = require('../../utils/fcm');
const { NOTIFICATIONS } = require('../../constants/notification');
const caseModel = require('../../models/suportChatCase.model');
const caseMessageModel = require('../../models/suportChatMessages.model');
const walletsModel = require('../../models/wallets.model');
const top_upModel = require('../../models/top_up.model');
const transactionModel = require('../../models/transaction.model');
const ClosingBalanceModel = require('../../models/closing_balance.model');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY_TEST);
const _ = require('lodash');
const {
  storefileToS3,
} = require('../../services/middleware/filesUpload.middleware');
// Set up Authorize.net API credentials
// const authorizeConfig = {
//   API_LOGIN_ID: process.env.AUTHORIZE_LOGIN_ID,
//   TRANSACTION_KEY: process.env.AUTHORIZE_TRANSACTION_KEY,
//   SANDBOX: true // Change to false for live transactions
// };
// const apiInstance = require('../../services/payments/authorize');
const minisModel = require('../../models/minis.model');
const chatModel = require('../../models/chats.model');
const messageModel = require('../../models/messages.model');
// const client = require('twilio')(process.env.twillio_sid, process.env.twillio_auth_token)
const ObjectId = mongoose.Types.ObjectId;
const Pusher = require("pusher");
const notification_messageModel = require('../../models/notification_message.model');

const pusher = new Pusher({
  appId: "1592983",
  key: "c59ca7141fbb64deb566",
  secret: "9aa97b48302c75f9d548",
  cluster: "ap3",
  useTLS: true
});

module.exports.google_login = async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      return res
        .status(404)
        .json({ status: 404, message: 'Token Not Found' });
    }
    axios
      .get(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${accessToken}`
      )
      .then(async function (response) {
        let checkUser = await usersModel.findOne({
          email: response.data.email,
          deleted: false,
        });
        console.log(response.data);
        if (checkUser) {
          console.log(response.data);
          const wallet = await walletsModel.findOne({
            created_by: checkUser._id,
          });
          console.log(wallet, 'wallet');
          if (!wallet) {
            await walletsModel.create({
              total_credit: 0,
              gift_granted_credit: 0,
              gift_recived_credit: 0,
              created_by: checkUser._id,
            });
          }
          if (checkUser.google_id !== '') {
            checkUser.google_id =
              checkUser.google_id || response.data.sub;
            await checkUser.save();
          }
        } else {
          let r = (Math.random() + 1).toString(36).substring(7);
          const user_name = `${response.data.family_name}_${r}`;
          const referral = await securePin.generatePinSync(6);
          const userData = {
            first_name: response.data.given_name || '',
            last_name: response.data.family_name || '',
            user_name: user_name,
            email: response.data.email,
            google_id: response.data.sub,
            referral_code: referral,
          };
          console.log(userData);
          checkUser = new usersModel(userData);
          console.log(checkUser);
          await checkUser.save();
          const wallet = await walletsModel.findOne({
            created_by: checkUser._id,
          });
          if (!wallet) {
            await walletsModel.create({
              total_credit: 0,
              gift_granted_credit: 0,
              gift_recived_credit: 0,
              created_by: checkUser._id,
            });
          }
        }
        console.log(checkUser.email);
        const token = utils.generateAuthToken(
          checkUser._id,
          checkUser.email,
          process.env.jwtPrivateKey
        );

        return res.status(200).json({
          status: 200,
          message: 'Login is successfully.',
          data: { token, checkUser },
        });
      })
      .catch(function (error) {
        console.log(
          '🚀 ~ file: users.controller.js:49 ~ error',
          error
        );
        return res
          .status(400)
          .json({ status: 400, message: 'invalid token' });
      });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};

module.exports.apple_login = async (req, res) => {
  try {
    const { familyName, givenName, user, email, phone_no } = req.body;
    let checkUser = {};
    if (email == null) {
      checkUser = await usersModel.findOne({
        apple_id: user,
        deleted: false,
      });
    } else {
      checkUser = await usersModel.findOne({
        email: email,
        deleted: false,
      });
    }
    if (checkUser) {
      if (checkUser.apple_id == '') {
        checkUser.apple_id = checkUser.apple_id || user;
        await checkUser.save();
        const wallet = await walletsModel.findOne({
          created_by: checkUser._id,
        });
        console.log(wallet, 'wallet');
        if (!wallet) {
          await walletsModel.create({
            total_credit: 0,
            gift_granted_credit: 0,
            gift_recived_credit: 0,
            created_by: checkUser._id,
          });
        }
      }
    }
    if (!checkUser) {
      let r = (Math.random() + 1).toString(36).substring(7);
      const user_name = `${familyName}_${r}`;
      const referral = await securePin.generatePinSync(6);
      const userData = {
        first_name: givenName || '',
        last_name: familyName || '',
        user_name: user_name,
        email: email,
        apple_id: user,
        referral_code: referral,
        phone_no: phone_no || '',
      };
      checkUser = new usersModel(userData);
      checkUser = await checkUser.save();
      const wallet = await walletsModel.findOne({
        created_by: checkUser._id,
      });
      console.log(wallet, 'wallet');
      if (!wallet) {
        await walletsModel.create({
          total_credit: 0,
          gift_granted_credit: 0,
          gift_recived_credit: 0,
          created_by: checkUser._id,
        });
      }
    }
    const token = utils.generateAuthToken(
      checkUser._id,
      checkUser.email,
      process.env.jwtPrivateKey
    );
    return res.status(200).json({
      status: 200,
      message: 'Login is successfully.',
      data: { token, checkUser },
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};

module.exports.signUp = async (req, res) => {
  try {
    const step = req.body.step;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ status: 400, message: errors.mapped() });
    }
    if (step == 'first') {
      const checkUser = await usersModel.findOne({
        email: req.body.email,
        deleted: false,
      });
      if (checkUser) {
        return res
          .status(400)
          .json({ status: 400, message: 'User already exists.' });
      }
      let r = (Math.random() + 1).toString(36).substring(7);
      const user_name = `${req.body.last_name}_${r}`;
      req.body.password = await utils.getEncryptPassword(
        req.body.password
      );
      const userData = {
        first_name: req.body.first_name,
        email: req.body.email,
        user_name: user_name,
        last_name: req.body.last_name,
        phone_no: req.body.phone_no,
        password: req.body.password,
        referral_code: req.body.referral_code,
        active:false
      };
      let user = new usersModel(userData);
      const referral_code = await securePin.generatePinSync(6);
      user.referral_code = referral_code;
      await user.save();
      user = await user.save();
      await walletsModel.create({
        total_credit: 0,
        gift_granted_credit: 0,
        gift_recived_credit: 0,
        created_by: user._id,
      });
      if (req.body.your_interests.length > 0) {
        for (let interest of req.body.your_interests) {
          user.your_interests.push(interest);
        }
        await user.save();
      }
      const pin = await securePin.generatePinSync(4);
      console.log(pin);
      user.otp = pin;
      await user.save();

      await sendEmail('otp@shareslate.fun', user.email, pin);

      return res.status(200).json({
        status: 200,
        message:
          'Users created and OTP has been sent successfully on email.',
      });
    }
    if (step == 'second') {
      const checkUser = await usersModel.findOne({
        email: req.body.email,
        deleted: false,
      });
      if (checkUser.otp == req.body.otp) {
        const token = await utils.generateAuthToken(
          checkUser._id,
          checkUser.email,
          process.env.jwtPrivateKey
        );
        await usersModel.findOneAndUpdate(
          { _id: checkUser._id },
          { $set: { active:true } }
        );
        return res.status(200).json({
          status: 200,
          message: 'Login is successfully.',
          data: { token, checkUser },
        });
      }
      return res.status(400).json({
        status: 400,
        message: 'You have enter an invalid OTP',
      });
    }
  } catch (error) {
    return res
      .status(400)
      .json({ status: 400, message: error.message });
  }
};

module.exports.registeration = async (req, res) => {
  const {
    first_name,
    last_name,
    email,
    phone_no,
    gender,
    profile_image,
  } = req.body;
  req.body.password = await utils.getEncryptPassword(
    req.body.password
  );
  const userExists = await usersModel.findOne({
    email: email,
    deleted: false,
  });
  if (userExists) {
    return res.status(409).json({ message: 'User already exists' });
  }
  let r = (Math.random() + 1).toString(36).substring(7);
  const user_name = `${req.body.last_name}_${r}`;
  const newUser = {
    first_name,
    last_name,
    email,
    password: req.body.password,
    phone_no,
    gender,
    user_name,
    profile_image,
  };

  if (req.body.address) {
    newUser.address = {
      city: req.body.address.city,
      country: req.body.address.country,
    };
  }
  if (req.file) {
    newUser.profile_image = req.file.location;
  }

  const savedUser = await usersModel.create(newUser);
  res
    .status(201)
    .json({ message: 'User created successfully', user: savedUser });
};


module.exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ status: 400, message: errors.mapped() });
    }
    const checkUser = await usersModel.findOne({
      email: req.body.email,
      deleted: false,
      active:true
    });
    if (!checkUser) {
      return res
        .status(400)
        .json({ status: 400, message: 'Email does not exists or  your otp is not verified' });
    }
    const checkUserPass = await utils.comparePassword(
      req.body.password,
      checkUser.password
    );
    if (!checkUserPass) {
      return res
        .status(400)
        .json({ status: 400, message: 'Password is incorrect.' });
    }
    const token = await utils.generateAuthToken(
      checkUser._id,
      checkUser.email,
      process.env.jwtPrivateKey
    );
    return res.status(200).json({
      status: 200,
      message: 'Login is successfully.',
      data: { token, checkUser },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};

module.exports.guest_login = async (req, res) => {
  try {
    let guest = {
      role: 'guest',
      loggined_as: 'guest',
    };
    const token = await utils.generateAuthToken(
      guest.role,
      guest.loggined_as,
      process.env.jwtPrivateKey
    );
    return res.status(200).json({
      status: 200,
      message: 'Guest login successfully.',
      data: { token },
    });
  } catch (error) {
    console.log(
      '🚀 ~ file: users.controller.js:183 ~ module.exports.guest_login= ~ error:',
      error
    );
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};

module.exports.profile = async (req, res) => {
  try {
    const user = await usersModel.findById(req.user.id);
    if (!user || user == null) {
      return res
        .status(400)
        .json({ status: 400, message: 'Profile could not found.' });
    }
    delete user._doc.password;
    return res.status(200).json({
      status: 200,
      message: 'Profile Get Successfully.',
      data: user,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};

module.exports.get_profile_by_id = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await usersModel.findById(id);
    const follower = user.followers;
    user.is_followed = follower.includes(req.user._id) ? true : false;
    const loginUser=await usersModel.findById(req.user.id);

    if (user.blocked_users.includes(req.user.id) || loginUser.blocked_users.includes(id)) {
      return res.status(403).json({
        status: 403,
        message: 'You are not allowed to view this profile.',
      });
    }

    if (!user || user == null) {
      return res
        .status(400)
        .json({ status: 400, message: 'Profile could not found.' });
    }
    delete user._doc.password;
    return res.status(200).json({
      status: 200,
      message: 'Profile Get Successfully.',
      data: user,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};

module.exports.follow_user = async (req, res) => {
  try {
    const following_id = req.body.following_id;
    const check_policy = await check_following_policy(following_id);
    
    if (check_policy == false) {
      return res.status(400).json({
        status: 400,
        message: 'You are not allowed to follow this user',
      });
    }
    const follower = await usersModel.findById(req.user.id);
    const following_user = await usersModel.findById(following_id);
    const check_following = follower.following.includes(following_id);

    if (following_user.blocked_users.includes(req.user.id) || follower.blocked_users.includes(following_id)) {
      return res.status(403).json({
        status: 403,
        message: 'You are not allowed to follow this user.',
      });
    }

    if (check_following) {
      return res.status(400).json({
        status: 400,
        message: 'You have already follow this user!',
      });
    }
    follower.following.push(following_id);
    follower.following_count = follower.following.length;
    follower.save();
    const following = await usersModel.findById(following_id);
    following.followers.push(req.user.id);
    following.follower_count = following.followers.length;
    following.is_followed = true;
    following.save();
    const { first_name, last_name } = req.user;
    const notification = {
      title: following_user.user_name,
      body: `${first_name} ${last_name} started following you!`,
      type: NOTIFICATIONS.FOLLOW.type,
    };
    const notifictaion_doc = await notificationModel.create({
      user_id: following_id,
      title: notification.title,
      body: 'started following you',
      from: req.user._id,
      type: NOTIFICATIONS.FOLLOW.type,
    });
    let notification_data = {
      type: NOTIFICATIONS.FOLLOW.type,
      user: req.user,
      notification_id: notifictaion_doc._id,
    };
    if (following_user.notification_setting.following_notification) {
      Object.entries(following_user.notification_token).forEach(
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
    return res.status(200).json({
      status: 200,
      message: 'User is added for the following sucessfully!',
    });
  } catch (error) {
    console.log(
      '🚀 ~ file: users.controller.js:241 ~ module.exports.follow_user= ~ error',
      error
    );
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};

module.exports.get_self_follower_folloing_list = async (req, res) => {
  try {
    const get_user_info = await usersModel.findById(req.user.id);
    const following = get_user_info.following;
    const follower = get_user_info.followers;
    let get_following_user = [];
    if (following.length > 0) {
      get_following_user = await usersModel.find({
        _id: { $in: following },
      });
    }
    let get_follower_user = [];
    if (follower.length > 0) {
      get_follower_user = await usersModel.find({
        _id: { $in: follower },
      });
    }
    return res.status(200).json({
      status: 200,
      message: 'self folower and following list get successfully',
      get_following_user,
      get_follower_user,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};

module.exports.get_other_follower_folloing_list = async (
  req,
  res
) => {
  try {
    const user_id = req.params.id;
    const get_user_info = await usersModel.findById(user_id);
    // const follower_user = await usersModel.findById(req.user._id);
    const following = get_user_info.following;
    const follower = get_user_info.followers;
    // follower.includes(req.user._id)?true:false
    let get_following_user = [];
    console.log(following);

    const loginUser=await usersModel.findById(req.user.id);

    // Check if the user making the request is blocked by the user in the request parameters
    if (get_user_info.blocked_users.includes(req.user.id) || loginUser.blocked_users.includes(user_id)) {
      return res.status(403).json({
        status: 403,
        message: 'You are not allowed to view this profile.',
      });
    }

    if (following.length > 0) {
      get_following_user = await usersModel.find({
        _id: { $in: following },
      });
    }
    let get_follower_user = [];
    if (follower.length > 0) {
      get_follower_user = await usersModel.find({
        _id: { $in: follower },
      });
    }
    get_following_user.forEach((mini) => {
      if (req.user._id !== mini._id) {
        const is_i_follow = mini.followers.findIndex(
          (id) => id == req.user.id
        );
        if (is_i_follow > -1) {
          mini.is_followed = true;
        } else {
          mini.is_followed = false;
        }
      } else {
        mini.is_followed = null;
      }
    });
    get_follower_user.forEach((mini) => {
      if (req.user._id !== mini._id) {
        const is_i_follow = mini.followers.findIndex(
          (id) => id == req.user.id
        );
        if (is_i_follow > -1) {
          mini.is_followed = true;
        } else {
          mini.is_followed = false;
        }
      } else {
        mini.is_followed = null;
      }
    });
    return res.status(200).json({
      status: 200,
      message: 'self folower and following list get successfully',
      get_following_user,
      get_follower_user,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};

module.exports.edit_profile = async (req, res) => {
  try {
    const user = await usersModel.findById(req.user.id);
    const {
      is_private,
      fcm_token,
      relationship_status,
      bio,
      work,
      first_name,
      last_name,
      date_of_birth,
      gender,
      city,
      country,
      user_name,
    } = req.body;
    if (req.file) {
      user.profile_image = req.file.location;
    }
    user.notification_token = {
      android:
        fcm_token?.android || user.notification_token?.android || '',
      ios: fcm_token?.ios || user.notification_token?.ios || '',
    };
    user.is_private = is_private || user.is_private;
    user.relationship_status =
      relationship_status || user.relationship_status;
    user.user_bio = bio || user.user_bio;
    user.work = work || user.work;
    user.first_name = first_name || user.first_name;
    user.last_name = last_name || user.last_name;
    user.date_of_birth = date_of_birth || user.date_of_birth;
    user.gender = gender || user.gender;
    user.address = { city, country };
    user.user_name = user_name || user.user_name;
    await user.save();
    return res.status(200).json({
      status: 200,
      message: 'user has been updated successfully!!',
      data: user,
    });
  } catch (error) {
    console.log(
      '🚀 ~ file: users.controller.js:309 ~ module.exports.edit_profile= ~ error',
      error
    );
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};

module.exports.update_privacy_setting = async (req, res) => {
  try {
    const user = await usersModel.findById(req.user.id);
    user.privacy_setting.who_can_follow_you =
      req.body.who_can_follow_you ||
      user.privacy_setting.who_can_follow_you;
    user.privacy_setting.who_can_comment_on_mini =
      req.body.who_can_comment_on_mini ||
      user.privacy_setting.who_can_comment_on_mini;
    if (
      req.body.private_account == true ||
      req.body.private_account == false
    ) {
      user.privacy_setting.private_account = req.body.private_account;
    }
    if (!req.body.private_account) {
      user.privacy_setting.private_account =
        user.privacy_setting.private_account;
    }
    user.save();
    return res.status(200).json({
      status: 200,
      message: 'user has been updated successfully!!',
      data: user,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};

module.exports.update_notification_setting = async (req, res) => {
  try {
    const {
      comments_notification,
      likes_notification,
      following_notification,
    } = req.body;
    const user = await usersModel.findById(req.user.id);
    if (
      comments_notification == true ||
      comments_notification == false
    ) {
      user.notification_setting.comments_notification =
        comments_notification;
      await user.save();
    }
    user.notification_setting.comments_notification =
      user.notification_setting.comments_notification;
    if (likes_notification == true || likes_notification == false) {
      user.notification_setting.likes_notification =
        likes_notification;
      await user.save();
    }
    user.notification_setting.likes_notification =
      user.notification_setting.likes_notification;
    if (
      following_notification == true ||
      following_notification == false
    ) {
      user.notification_setting.following_notification =
        following_notification;
      await user.save();
    }
    user.notification_setting.following_notification =
      user.notification_setting.following_notification;
    await user.save();
    return res.status(200).json({
      status: 200,
      message: 'user has been updated successfully!!',
      data: user,
    });
  } catch (error) {
    console.log(
      '🚀 ~ file: users.controller.js:336 ~ module.exports.update_notification_setting= ~ error',
      error
    );
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};

module.exports.forget_password = async (req, res) => {
  try {
    const step = req.body.step;
    const email = req.body.email;
    let user = await usersModel.findOne({
      email: email,
      deleted: false,
    });
    if (!user) {
      return res.status(400).json({
        status: 400,
        message: 'User not found against this email.',
      });
    }
    if (step == 'first') {
      const pin = await securePin.generatePinSync(4);
      user.otp = pin;
      await user.save();
      await sendForgotPassword('otp@shareslate.fun', user.email, pin,user.first_name,user.last_name);
      return res.status(200).json({
        status: 200,
        message: 'User OTP has been sent successfully on email.',
      });
    }
    if (step == 'second') {
      if (user.otp == req.body.otp) {
        return res.status(200).json({
          status: 200,
          message: 'User OTP has been verified successfully.',
        });
      }
      return res
        .status(400)
        .json({ status: 400, message: 'User OTP is not verified' });
    }
    if (step == 'third') {
      req.body.password = await utils.getEncryptPassword(
        req.body.password
      );
      user.password = req.body.password;
      await user.save();
      return res.status(200).json({
        status: 200,
        message: 'User password has been reset successfully.',
      });
    }
  } catch (error) {
    console.log(
      '🚀 ~ file: users.controller.js:369 ~ module.exports.forget_password= ~ error',
      error
    );
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};


module.exports.resend_otp = async (req, res) => {
  try {
    const email = req.body.email;
    let user = await usersModel.findOne({
      email: email,
      deleted: false,
    });
    if (!user) {
      return res.status(400).json({
        status: 400,
        message: 'User not found against this email.',
      });
    }
    const pin = await securePin.generatePinSync(4);
    user.otp = pin;
    await user.save();
    await sendEmailForOtpVerification('otp@shareslate.fun', user.email, pin,user.first_name,user.last_name);
    return res.status(200).json({
      status: 200,
      message: 'User OTP has been sent successfully on email.',
    });
  } catch (error) {
    console.log(
      '🚀 ~ file: users.controller.js:387 ~ module.exports.resend_otp= ~ error',
      error
    );
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};


module.exports.unfollow_user = async (req, res) => {
  try {
    const following_id = req.body.following_id;
    const follower = await usersModel.findById(req.user.id);
    const check_following = follower.following.includes(following_id);
    if (!check_following) {
      return res
        .status(400)
        .json({ status: 400, message: 'You dont follow this user!' });
    }
    follower.following.pull(following_id);
    follower.following_count--;
    follower.save();
    const following = await usersModel.findById(following_id);
    following.followers.pull(req.user.id);
    following.follower_count--;
    following.is_followed = false;
    following.save();
    return res.status(200).json({
      status: 200,
      message: 'User is unfollowed sucessfully!',
    });
  } catch (error) {
    console.log(
      '🚀 ~ file: users.controller.js:410 ~ module.exports.unfollow_user= ~ error',
      error
    );
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};

module.exports.logout = async (req, res) => {
  try {
    console.log( req.body,' req.body;')
    const loggin_user = await usersModel.findOne({
      _id: req.user.id,
    });
    const { is_ios, is_android } = req.body;
    let obj = {
      notification_token: {
        android:
          (!is_android && loggin_user.notification_token?.android)  ||
          '',
        ios: (!is_ios && loggin_user.notification_token?.ios) || '',
      },
    };
    await usersModel.findOneAndUpdate(
      { _id: req.user.id },
      { $set: { ...obj } },
      { new: true }
    );
    return res.status(200).json({ status: 200 });
  } catch (error) {
    console.log(
      '🚀 ~ file: users.controller.js:410 ~ module.exports.unfollow_user= ~ error',
      error
    );
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};

module.exports.change_password = async (req, res) => {
  try {
    const user = await usersModel.findById(req.user.id);
    req.body.password = await utils.getEncryptPassword(
      req.body.password
    );
    user.password = req.body.password;
    await user.save();
    return res.status(200).json({
      status: 200,
      message: 'User password is changed sucessfully!',
    });
  } catch (error) {
    console.log(
      '🚀 ~ file: users.controller.js:423 ~ module.exports.change_password= ~ error',
      error
    );
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};

module.exports.deactive_profile = async (req, res) => {
  try {
    let user = await usersModel.findById(req.user.id);
    let del_date = moment(moment.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .substring(0, 10);
    user.deleted_at = del_date;
    user.active = false;
    user.save();
    return res.status(200).json({
      status: 200,
      message:
        'User is deactivated sucessfully and if you not active your account within 7 days it will be removed permanently!',
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};

module.exports.active_profile = async (req, res) => {
  try {
    let user = await usersModel.findOne({
      email: req.body.email,
      active: false,
    });
    if (user) {
      const now = moment();
      const deletedAt = moment(user.deleted_at);
      console.log(deletedAt, 'deletedAt');
      const diff = deletedAt.diff(now, 'days');
      if (diff <= 7) {
        user.active = true;
        user.save();
        return res.status(200).json({
          status: 200,
          message: 'User is activated sucessfully',
        });
      } else {
        return res.status(200).json({
          status: 200,
          message:
            'User cannot be activated sucessfully as the account is deleted 7 days ago',
        });
      }
    } else {
      return res.status(200).json({
        status: 500,
        message: 'User is already activated or user not found',
      });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};

module.exports.get_inviteable = async (req, res) => {
  try {
    const user = await usersModel.findById(req.user._id);
    let follower = user.followers;
    let following = user.following;
    let inviteable_users = [];
    for (userOne of follower) {
      let check = following.includes(userOne);
      if (check) {
        inviteable_users.push(userOne);
      }
    }
    for (userOne of following) {
      let check = follower.includes(userOne);
      if (check) {
        inviteable_users.push(userOne);
      }
    }
    const Users = await usersModel.find({
      _id: { $in: inviteable_users },
    });
    return res.status(200).json({
      status: 200,
      message: 'Inviteable users get successfully',
      data: Users,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};

module.exports.block_user = async (req, res) => {
  try {
    const block_user = req.body.block_user;
    const currentUserId = req.user._id;

    const currentUser = await usersModel.findById(currentUserId);
    currentUser.blocked_users.push(block_user);
    await currentUser.save();

    const followingIndex = currentUser.following.indexOf(block_user);
    if (followingIndex !== -1) {
      currentUser.following.splice(followingIndex, 1);
    }

  await currentUser.save();

    return res.status(200).json({
      status: 200,
      message: 'User has been blocked and removed from the following and followers list',
      data: currentUser,
    });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
  }
};

module.exports.unblock_user = async (req, res) => {
  try {
    const block_user = req.body.unblock_user;
    const get_user = await usersModel.findById(req.user._id);
    get_user.blocked_users.pull(block_user);
    await get_user.save();
    return res.status(200).json({
      status: 200,
      message: 'user has been blocked',
      data: get_user,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};

module.exports.block_users_list = async (req, res) => {
  try {
    const get_user = await usersModel.findById(req.user._id);
    const block_users = get_user.blocked_users;
    const block_user_list = await usersModel.find({
      _id: { $in: block_users },
    });
    return res.status(200).json({
      status: 200,
      message: 'user has been blocked',
      data: block_user_list,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};

module.exports.create_case = async (req, res) => {
  try {
    let attachment = '';
    if (req.file) {
      attachment = req.file.location;
    }
    const caseData = {
      created_by: req.user._id,
      title: req.body.title,
      categorey: req.body.categorey,
      attachment: attachment,
      description: req.body.description,
      case_no: `case no.${Math.floor(
        100000 + Math.random() * 900000
      )}`,
    };
    let user_case = new caseModel(caseData);
    user_case = await user_case.save();
    return res.status(200).json({
      status: 200,
      message: 'case has been created',
      data: user_case,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};

module.exports.get_all_cases = async (req, res) => {
  try {
    const get_cases = await caseModel.find({
      created_by: req.user._id,
    });
    return res.status(200).json({
      status: 200,
      message: 'cases has been get successfully!',
      data: get_cases,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};

module.exports.get_case = async (req, res) => {
  try {
    const get_cases = await caseModel.findOne({ _id: req.params.id });
    const case_messages = await caseMessageModel
      .find({ case: req.params.id })
      .sort({ createdAt: -1 })
      .populate('created_by')
      .lean()
      .exec();
    return res.status(200).json({
      status: 200,
      message: 'case has been get successfully!',
      data: get_cases,
      case_messages,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};

module.exports.create_case_message = async (req, res) => {
  try {
    const case_messageData = {
      created_by: req.user._id,
      case: req.body.case_id,
      message: req.body.message,
    };
    let user_case_message = new caseMessageModel(case_messageData);
    user_case_message = await user_case_message.save();
    return res.status(200).json({
      status: 200,
      message: 'case has been created',
      data: user_case_message,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};

module.exports.user_name_verification = async (req, res) => {
  try {
    const { user_name } = req.body;
    const verify_user_byName = await usersModel.findOne({
      user_name: user_name,
      deleted: false,
      active: true,
    });
    return res.status(200).json({
      status: 200,
      message: verify_user_byName
        ? 'This user name already exists'
        : 'This user name does not exist',
      data: verify_user_byName ? true : false,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};

module.exports.get_users = async (req, res) => {
  try {
    const userId = req.user.id;
    const blockedUsers = req.user.blocked_users || []; 
    const get_users = await usersModel
      .find({ deleted: false, active: true, _id: { $nin: blockedUsers } }) 
      .lean()
      .exec();

    const loginUser = await usersModel
      .findById(req.user._id)
      .populate('followers');

    await Promise.all(
      get_users.map((user) => {
        const follower = user.followers;
        user.is_followed = follower.includes(userId) ? true : false;
      })
    );

    get_users.sort((a, b) =>
      loginUser.followers.includes(a._id)
        ? -1
        : loginUser.followers.includes(b._id)
        ? 1
        : 0
    );

    console.log(loginUser);

    return res.status(200).json({
      status: 200,
      message: 'Users list has been retrieved successfully!',
      data: { get_users, friendLists: loginUser.followers },
    });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
  }
};

module.exports.verifyUser_apple_id = async (req, res) => {
  try {
    const { apple_id } = req.body;
    const verify_user = await usersModel.findOne({
      apple_id: apple_id,
      deleted: false,
      active: true,
    });
    if (!verify_user) {
      return res.status(400).json({
        status: 400,
        message: 'User with this apple_id does not exist.',
      });
    }
    const token = utils.generateAuthToken(
      verify_user._id,
      verify_user.email,
      process.env.jwtPrivateKey
    );
    console.log(token, 'token123');
    return res.status(200).json({
      status: 200,
      message: 'users has been verified!',
      data: { checkUser: verify_user, token },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};

module.exports.get_wallet = async (req, res) => {
  try {
    const user_id = req.user.id;
    const wallet = await walletsModel
      .findOne({ created_by: user_id })
      .lean()
      .exec();

    const transaction = await transactionModel
      .find({ created_by: user_id })
      .lean()
      .exec();

    if (!wallet) {
      const create_wallet = await walletsModel.create({
        total_credit: 0,
        gift_granted_credit: 0,
        gift_recived_credit: 0,
        created_by: user_id,
      });
      return res.json({
        message: 'Wallet has been retrieved successfully!',
        data: create_wallet,
      });
    }
    
    return res.json({
      message: 'Wallet has been retrieved successfully!',
      data: { wallet, transaction },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports.get_wallet_transactions = async (req, res) => {
  try {
    const user_id = req.user.id;
    
    const creditTransactions = await transactionModel
      .find({ created_by: user_id, transaction_type: 'cr' })
      .lean()
      .exec();

    const debitTransactions = await transactionModel
      .find({ created_by: user_id, transaction_type: 'dr' })
      .lean()
      .exec();

    return res.json({
      message: 'Wallet transactions have been retrieved successfully!',
      data: { credit: creditTransactions, debit: debitTransactions },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports.get_other_wallet = async (req, res) => {
  try {
    const user_id = req.body.user_id;
    const wallet = await walletsModel
      .findOne({ created_by: user_id })
      .select('_id')
      .lean()
      .exec();
      const user = await usersModel.findById(user_id);
      const loginUser=await usersModel.findById(req.user.id);
      if (user.blocked_users.includes(req.user.id) || loginUser.blocked_users.includes(user_id)) {
        return res.status(403).json({
          status: 403,
          message: 'You are not allowed to view wallet because this person is blocked by you.',
        });
      }
    if (wallet == null) {
      const create_wallet = await walletsModel.create({
        total_credit: 0,
        gift_granted_credit: 0,
        gift_recived_credit: 0,
        created_by: user_id,
      });
      return res.status(200).json({
        status: 200,
        message: 'wallet has been get successfully!',
        data: create_wallet,
      });
    }
    return res.status(200).json({
      status: 200,
      message: 'wallet has been get successfully!',
      data: wallet,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};

module.exports.send_credit = async (req, res) => {
  try {
    const receiver = req.body.reciver;
    const send_coins = req.body.send_coins;

    let sender_wallet = await walletsModel.findOne({
      created_by: req.user.id,
    });
    let receiver_wallet;

    receiver_wallet = await walletsModel.findOne({
      created_by: receiver,
    });

    if (!sender_wallet || send_coins > sender_wallet.total_credit) {
      return res.status(403).json({
        status: 403,
        message: 'You have insufficient balance in your account. Please recharge.',
      });
    }

    if (receiver !== req.user.id) {
      sender_wallet.gift_granted_credit += parseInt(send_coins);
      sender_wallet.total_credit -= parseInt(send_coins);
      await sender_wallet.save();

      receiver_wallet.gift_received_credit += parseInt(send_coins);
      receiver_wallet.total_credit += parseInt(send_coins);
      await receiver_wallet.save();

    } else {
      receiver_wallet.total_credit =
        parseInt(receiver_wallet.total_credit) + parseInt(send_coins);
      receiver_wallet.gift_received_credit =
        parseInt(receiver_wallet.gift_received_credit) + parseInt(send_coins);
        await receiver_wallet.save();

        sender_wallet.total_credit =
        parseInt(receiver_wallet.total_credit) - parseInt(send_coins);
        sender_wallet.gift_granted_credit =
        parseInt(receiver_wallet.gift_granted_credit) - parseInt(send_coins);
        await sender_wallet.save();
    }

    const create_dr_transaction = await transactionModel.create({
      ammount: req.body.send_coins,
      transaction_type: 'dr',
      from_wallet: sender_wallet._id,
      to_wallet: receiver_wallet._id,
      created_by: req.user.id,
    });
    return res.status(200).json({
      status: 200,
      message: 'Transaction has been completed successfully!',
    });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
  }
};

module.exports.create_intent = async (req, res) => {
  try {
    const { amount, currency, payment_method_types } = req.body;
    const wallet = await walletsModel
      .findOne({ created_by: req.user._id })
      .select('_id');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      payment_method_types: payment_method_types,
      metadata: {
        user_id: req.user._id,
      },
    });
    return res.status(200).json({
      status: 200,
      message: 'payment intent created sucessfully!!',
      data: paymentIntent,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};

module.exports.closing_banlance = async (req, res) => {
  try {
    let year = req.body.year;
    let month = req.body.month - 1;
    const wallet = await walletsModel
      .findOne({ created_by: req.user._id })
      .select('_id');
    const closing_balance = await ClosingBalanceModel.find({
      wallet_id: wallet._id,
      posted_at: {
        $gte: new Date(year, month, 1),
        $lt: new Date(year, month + 1, 1),
      },
    });
    return res.status(200).json({
      status: 200,
      message: 'closing balance has been get successfully!',
      data: closing_balance,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};

module.exports.day_balance_detail = async (req, res) => {
  try {
    const closing_balance = await ClosingBalanceModel.findById(
      req.params.id
    );
    return res.status(200).json({
      status: 200,
      message: 'closing balance has been get successfully!',
      data: closing_balance,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};

module.exports.topup_hook = async (req, res) => {
  try {
    const user_id = req.body.data.object.metadata.user_id;
    const status = req.body.data.object.status;
    const amount = req.body.data.object.amount;
    let wallet = await walletsModel.findOne({ created_by: user_id });
    if (status == 'succeeded' || status == 'processing') {
      const check_topup = await top_upModel.findOne({
        payment_id: req.body.data.object.id,
      });
      if (check_topup == null) {
        wallet.total_credit = wallet.total_credit + amount;
        await wallet.save();
        const create_topup = await top_upModel.create({
          amount: amount,
          payment_id: req.body.data.object.id,
          created_by: user_id,
          wallet_id: wallet._id,
        });
        return res.status(200).json({ status: 200, message: 'ok' });
      }
    }
    return res.status(200).json({ status: 200, message: 'ok' });
  } catch (error) {
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};

module.exports.nearme_minis = async (req, res) => {
  try {
    let limit = req.query.limit || 10;
    limit = parseInt(limit);

    let page = req.query.page || 1;
    page = parseInt(page);

    const skip = (page - 1) * limit;

    const blockedUserIds = req.user.blocked_users.map((id) => {
      try {
        return ObjectId(id);
      } catch (error) {
        return null; // Invalid ObjectId, skip this entry
      }
    }).filter((id) => id !== null);

    const totalMinis = await minisModel.countDocuments({
      deleted: false,
      is_public: true,
      created_by: { $nin: blockedUserIds },
    });

    let numPages = Math.ceil(totalMinis / limit);

    const userId = req.user.id;
    const user = await usersModel.findById(ObjectId(userId));

    let minis;
    // if (
    //   !user.address ||
    //   (!user.address.country && !user.address.city)
    // ) {
    //   const countryRegex = new RegExp('United States', 'i');
    //   minis = await minisModel
    //     .find({
    //       'location.country': { $regex: countryRegex },
    //       deleted: false,
    //       is_public: true,
    //       created_by: { $nin: req.user.blocked_users },
    //     })
    //     .where({ deleted: 'false' })
    //     .sort({ createdAt: -1 })
    //     .populate('created_by')
    //     .populate('mentions')
    //     .skip(skip)
    //     .limit(limit);
    // } else {
      const cityRegex = new RegExp(user.address.city, 'i');
      const countryRegex = new RegExp(user.address.country, 'i');

      minis = await minisModel
        .find({
          'location.city': { $regex: cityRegex },
          'location.country': { $regex: countryRegex },
          deleted: false,
          is_public: true,
          created_by: { $nin: blockedUserIds },
        })
        .where({ deleted: false })
        .sort({ createdAt: -1 })
        .populate('created_by')
        .populate('mentions')
        .skip(skip)
        .limit(limit);

      if (_.isEmpty(minis)) {
        minis = await minisModel
          .find({
            deleted: false,
            is_public: true,
            created_by: { $nin: blockedUserIds },
          })
          .where({ deleted: false })
          .sort({ createdAt: -1 })
          .populate('created_by')
          .populate('mentions')
          .skip(skip)
          .limit(limit);
      }
    // }
    (async () => {
      _.map(minis, async (mini) => {
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
        return await mini.save();
      });
    })();
    return res.status(200).json({
      status: 200,
      data: { minis, totalPages: numPages, page, limit },
    });
  } catch (error) {
    return res
      .status(400)
      .json({ status: 400, message: error.message });
  }
};

module.exports.message_list =async(req,res)=>{
  try{
    let chat_id = req.params.id
    let limit = req.query.limit || 10000;
    limit = parseInt(limit);
    let page = req.query.page || 1;
    page = parseInt(page);
    const skip = (page - 1) * limit;
    const totalmessages = await messageModel.count({
      chat_id:chat_id
    });
    let numPages = Math.ceil(totalmessages / limit);
    const get_messages = await messageModel
      .find({
        chat_id:chat_id
      })
      .populate('sender','first_name last_name _id profile_image')
      .populate('reciever','first_name last_name _id profile_image')
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
      return res.status(200).json({
        status: 200,
        message: 'chat messages get successfully successfully!',
        data: { get_messages, totalPages: numPages, page, limit },
      });
  }catch(error){
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
}

module.exports.create_room= async(req,res)=>{
  try{
    const sender= req.body.sender
    const receiver = req.body.receiver
    console.log(req.body)
    let check_room= await chatModel.findOne({
      $or: [
        {
          sender:sender,
          receiver:receiver,
          is_deleted:false
        },
        {
          sender: receiver,
          receiver: sender,
          is_deleted:false
        },
      ],
    });
    console.log(check_room)
    if (check_room==null){
      let create_room= await chatModel.create({
        sender:sender,
        receiver:receiver
      })
      await pusher.trigger(
        create_room.id,
        "NewSubscription",
        {
          sender: sender,
          receiver: receiver,
        },
      );
      return res.status(200).json({
        status: 200,
        data: create_room,
      });
    }
    console.log(check_room.id)
    return res.status(200).json({
      status: 200,
      data: check_room,
    });
  }catch(error){
    console.log(error.message)
    return res.status(500).json({ status: 500, message: error.message });
  }
}
module.exports.get_room= async(req,res)=>{
  try{
    let check_room= await chatModel.find({
      $or: [
        {
          sender:req.user.id,
          last_message: { $ne: '' },
          is_deleted:false        
        },
        {
          receiver: req.user.id,
          last_message: { $ne: '' },
          is_deleted:false
        },
        {
          sender:req.user.id,
          media: { $ne: '' },
          is_deleted:false
        },
        {
          receiver: req.user.id,
          media: { $ne: '' },
          is_deleted:false
        }
      ],
    })
    .sort({ updatedAt: -1 })
    .populate('sender','first_name last_name _id profile_image')
    .populate('receiver','first_name last_name _id profile_image')
    .lean()
    .exec();
    return res.status(200).json({
      status: 200,
      data: check_room,
    });
  }catch(error){
    return res.status(500).json({ status: 500, message: error.message });
  }
}
module.exports.send_message = async (req,res)=>{
  try{
    let chat_id = req.body.chat_id
    let sender = req.body.sender
    let receiver = req.body.receiver
    let message_text = req.body.message
    let media_type = req.body.media_type
    let media = ''
    if (req.file) {
      media = req.file.location;
    }
    let sendMessage = await pusher.trigger(chat_id, 'newMessage', {
      message: message_text || '',
      media:media,
      media_type:media_type,
      sender:sender,
      receiver:receiver
    });
    let create_message = await messageModel.create({
      sender:sender,
      reciever:receiver,
      message:message_text,
      chat_id:chat_id,
      media:media,
      media_type:media_type
    })
    let check_room= await chatModel.findById(chat_id)
    check_room.last_message=message_text
    check_room.sender=sender
    check_room.receiver = receiver
    await check_room.save()
    const user_receiver = await usersModel.findById(receiver);
    const user_sender = await usersModel.findById(sender);

    const notification = {
      title: `${user_sender?.first_name} ${user_sender?.last_name} send you message!!`,
      body: create_message.message,
      type: NOTIFICATIONS.MESSAGE_SEND.type,
    };
    const notifictaion_doc = await notification_messageModel.create({
      sender:sender,
      message: create_message.message,
      receiver: receiver,
      type: NOTIFICATIONS.MESSAGE_SEND.type,
    });
    let notification_message = {
      sender:user_sender,
      message:create_message.message,
      reciever:user_receiver,
      chat_id:chat_id,
      type: NOTIFICATIONS.MESSAGE_SEND.type,
      notification_id: notifictaion_doc._id
        };
    Object.entries(user_receiver.notification_token).forEach(
      async ([key, value]) => {
        if (value) {
          await sendNotification(
            value,
            notification,
            notification_message
          );
        }
      }
    );
    return res.status(200).json({
      status: 200,
      message:'Text message has been sent successfully!!',
      data: create_message
    });
  }catch(error){
    return res.status(500).json({ status: 500, message: error.message });
  }
}

module.exports.delete_chat = async (req, res) => {
try{
  const chat_id = req.params.id
  const get_chat= await chatModel.findById(chat_id)
  get_chat.is_deleted=true
  get_chat.deleted_by=req.user.id
  await get_chat.save()
  return res.status(200).json({ status: 200, message:'chat has been deleted'});
}catch(error){
  return res.status(500).json({ status: 500, message: error.message });
}
}

module.exports.delete_message = async (req, res) => {
  try{
    const message_id = req.params.id
    const get_message= await messageModel.findById(message_id)
    get_message.is_deleted=true
    get_message.deleted_by=req.user.id
    await get_message.save()
    return res.status(200).json({ status: 200, message:'Message has been deleted!!!'});
  }catch(error){
    return res.status(500).json({ status: 500, message: error.message });
  }
  }