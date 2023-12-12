const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const chatSchema = new Schema(
  {
    sender:{
        type:ObjectId,
        ref:'user'
    },
    receiver:{
        type:ObjectId,
        ref:'user'
    },
    last_message:{
      type:String,
      default:''
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
module.exports = mongoose.model('chat', chatSchema);
