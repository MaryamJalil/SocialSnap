const usersModel = require('../../models/users.model');
const utils = require('../../services/libs/utils');

module.exports.login = async (req, res) => {
    try {

      const checkUser = await usersModel.findOne({
        email: req.body.email,
        deleted: false,
        is_admin:true
      });
      if (!checkUser) {
        return res
          .status(400)
          .json({ status: 400, message: 'Requesting user is not an admin.' });
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
  