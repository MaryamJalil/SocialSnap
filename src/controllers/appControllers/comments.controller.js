const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const commentsModel = require('../../models/comments.model');
const miniModel = require('../../models/minis.model');
const usersModel = require('../../models/users.model');
const minisStatisticsModel = require('../../models/minis_statistics.model');
module.exports.edit = async (req, res) => {
  try {
    const comment_id = req.params.id;
    const commented_minis = await commentsModel.findOne({
      _id: ObjectId(comment_id),
      created_by:ObjectId(req.user.id)
    });
    if (commented_minis) {
      commented_minis.comment =
        req.body.comment || commented_minis.comment;
      commented_minis.mentions =
        req.body.mentions || commented_minis.mentions;
    }
    await commented_minis.save();
    return res.status(200).json({
      status: 200,
      message: 'mini comment has been updated successfully!!',
      data: commented_minis,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: 500, message: error.message });
  }
};
module.exports.delete_mini_comment = async (req, res) => {
  try {
    const commented_minis = await commentsModel.findOne({
      _id: ObjectId(req.body.comment_id),
      created_by:ObjectId(req.user.id),
      deleted: false,
    });
    const update_comment_count = await miniModel
    .findById(ObjectId(commented_minis.mini))
    .populate('created_by');
    if (commented_minis) {
      commented_minis.deleted = true;
      await commentsModel.deleteOne({_id: ObjectId(req.body.comment_id)})
      // await commented_minis.save();
      const user = await usersModel.findById(ObjectId(req.user._id));
      const index = user.commented_mini_ids.indexOf(
        ObjectId(commented_minis.mini)
      );
      user.commented_mini_ids.splice(index, 1);
      update_comment_count.comment_count =
      update_comment_count.comment_count <= 0
        ? 0
        : update_comment_count.comment_count - 1;
        await update_comment_count.save()
      await user.save();
      const miniStatistics = await minisStatisticsModel.findOne({
        mini: ObjectId(commented_minis.mini),
      });
      if (user && miniStatistics) {
        if (user.gender === 'female') {
          await minisStatisticsModel.updateOne(
            {
              _id: ObjectId(miniStatistics._id),
            },
            {
              $set: {
                female_comments: Math.max(
                  0,
                  miniStatistics.female_comments - 1
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
                male_comments: Math.max(
                  0,
                  miniStatistics.male_comments - 1
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
                others_comments: Math.max(
                  0,
                  miniStatistics.others_comments - 1
                ),
              },
            }
          );
        }
      }
      return res.status(200).json({
        status: 200,
        message: 'Mini comment has been deleted',
        data:{coment_count:update_comment_count.comment_count}
      });
    } else {
      return res.status(400).json({
        status: 400,
        message:
          'Mini comment not found or you are not owner of mini',
      });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json({ status: 400, message: error.message });
  }
};
