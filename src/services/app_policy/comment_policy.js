const usersModel =require("../../models/users.model");
const minisModel = require("../../models/minis.model");
const { includes } = require("lodash");

module.exports.check_comment_policy= async(mini_id,commenter_id)=>{
    const mini_info = await minisModel.findById(mini_id).populate('created_by')
    const mini_owner_policy = mini_info.created_by.privacy_setting.who_can_comment_on_mini
    const mini_owner_id = mini_info.created_by._id
    if (mini_owner_policy == 'public'){
        return true
    }
    if (mini_owner_policy == 'only_me'){
        if (commenter_id==mini_owner_id){
            return true
        }
        return false        
    }
    if (mini_owner_policy=='follower'){
        const check_follower= await usersModel.findById(commenter_id)
        const check_user = check_follower.following.includes(mini_owner_id)
        if (check_user){
            return true
        }
        return false
    }
}