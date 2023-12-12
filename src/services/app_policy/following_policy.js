const usersModel = require("../../models/users.model");

const check_following_policy = async (following_id) => {
    const following_user_info = await usersModel.findById(following_id)
    const check_privacy_setting = following_user_info.privacy_setting.who_can_follow_you
    if (check_privacy_setting == 'public') {
        return true
    }
    return false
}

module.exports = {
    check_following_policy
}