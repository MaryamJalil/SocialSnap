const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const transactionSchema = new Schema(
  {
    ammount:{
      type:Number,
      default:0
    },
    transaction_type:{
      type:String,
      default:''
    },
    from_wallet:{
        type:ObjectId,
        ref:'wallet'
    },
    to_wallet:{
        type:ObjectId,
        ref:'wallet'
    },
    created_by:{
        type:ObjectId,
        ref:'user'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('transaction', transactionSchema);
