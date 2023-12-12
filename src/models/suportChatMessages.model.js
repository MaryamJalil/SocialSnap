const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const caseMessageSchema = new Schema(
    {
    created_by:{
        type:ObjectId,
        ref:'user'
    },
    case:{
        type:ObjectId,
        ref:'case'
    },
    message:{
        type:String,
        default:''
    }
    },
    { timestamps: true }
);
module.exports = mongoose.model("case_message", caseMessageSchema);
 