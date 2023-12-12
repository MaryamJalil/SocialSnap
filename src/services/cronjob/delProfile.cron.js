const cron = require('node-cron');
let debug = require('debug')("remaiderCron");
const _ = require('lodash');
const usersModel=require('../../models/users.model')
const minisModel=require('../../models/minis.model')
const commentsModel = require('../../models/comments.model')
const minis_like_dislikeModel=require('../../models/minis_like_dislike.model')
const moment = require('moment');
const mongoose = require('mongoose');


module.exports.delProfile = ()=>{
    cron.schedule('0 0 * * *', async() => {
        console.log('Runing a cron job after 24 hours')
        let current_date =moment(moment.now()).toISOString().substring(0,10)
        let users = await usersModel.find({deleted_at:current_date, active:false})

        for (let user of users){
            let user_id = user._id
            let del_single_user= await usersModel.findById(user_id)
            del_single_user.deleted= true
            del_single_user.save()
            let del_user_minis = await minisModel.updateMany({created_by:user_id},{
                $set:{
                  deleted: true
                }
              },{
                "multi": true
            })
            console.log('user minis has been deleted',del_user_minis)
        }
    })
}