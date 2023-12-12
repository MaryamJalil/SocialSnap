const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const messageSchema = new Schema(
  {
    sender:{
        type:ObjectId,
        ref:'user'
    },
    reciever:{
        type:ObjectId,
        ref:'user'
    },
    message:{
        type: String
        },
    media:{
        type:String,
        default:''
    },
    media_type:{
        type:String,
        default:''
    },
    chat_id:{
        type:ObjectId,
        ref:'chat'
    },
    is_deleted:{
        type:Boolean,
        default:false
    },
    deleted_by:{
        type:ObjectId,
        ref:'user'
    }
    },
      { timestamps: true }
);
module.exports = mongoose.model('message', messageSchema);