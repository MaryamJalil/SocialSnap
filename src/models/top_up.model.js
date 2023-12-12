const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const top_upSchema = new Schema(
  {
    amount:{
      type:Number
    },
    payment_id:{
      type:String
    },
    created_by:{
        type:ObjectId,
        ref:'user'
    },
    wallet_id:{
        type:ObjectId,
        ref:'wallet'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('top_up', top_upSchema);
