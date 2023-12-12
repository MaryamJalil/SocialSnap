const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const walletSchema = new Schema(
  {
    total_credit:{
      type:Number,
      default:0
    },
    gift_granted_credit:{
      type:Number,
      default:0
    },
    gift_recived_credit:{
      type:Number,
      default:0
    },
    recharge_credit:{
      type:Number,
      default:0
    },
    created_by:{
        type:ObjectId,
        unique:true,
        ref:'user'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('wallet', walletSchema);
