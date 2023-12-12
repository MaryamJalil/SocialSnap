const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const closingBalanceSchema = new Schema(
  {
    closing_credit:{
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
    created_by:{
        type:ObjectId,
        unique:true,
        ref:'user'
    },
    wallet_id:{
        type:ObjectId,
        ref:'wallet'
    },
    posted_at: {
        type: Date,
        default: Date.now
      }
    },
      { timestamps: true }
);

module.exports = mongoose.model('closing_balance', closingBalanceSchema);
