const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notificationSchema = new Schema(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: 'user'
        },
        from: {
            type: Schema.Types.ObjectId,
            ref: 'user'
        },
        type: {
            type: String,
            default: ""
        },
        body: {
            type: String,
            default: ""
        },
        is_read: {
            type: Boolean,
            default: false
        },
        mini: {
            type: Schema.Types.ObjectId,
            ref: 'mini'
        }
    },
    { timestamps: true }
);


module.exports = mongoose.model("notification", notificationSchema);
