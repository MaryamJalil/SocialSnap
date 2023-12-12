const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const minis_like_dislikeSchema = new Schema(
    {
    mini:{
        type: ObjectId,
        ref: 'mini'
        },
    created_by:{
        type:ObjectId,
        ref:'user'
    },
    like:{
        type:Boolean,
        default:false
    }
    },
    { timestamps: true }
);
module.exports = mongoose.model("mini_like_dislike", minis_like_dislikeSchema);
 