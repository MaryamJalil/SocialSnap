const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const report_schema = new Schema(
    {
        mini: {
            type: ObjectId,
            default: 'mini'
        },
        reporter: {
            type: ObjectId,
            ref: 'user'
        },
        reason: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
);
module.exports = mongoose.model("report", report_schema);
