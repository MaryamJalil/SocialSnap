const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const caseSchema = new Schema(
    {
    created_by:{
        type:ObjectId,
        ref:'user'
    },
    title:{
        type:String,
        default:''
    },
    categorey:{
        type:String,
        default:''
    },
    attachment:{
        type:String,
        default:''
    },
    description:{
        type:String,
        default:''
    },
    case_no:{
        type:String,
        unique:true,
    },
    case_status:{
        type:String,
        default:'open'
    }
    },
    { timestamps: true }
);
module.exports = mongoose.model("case", caseSchema);
 