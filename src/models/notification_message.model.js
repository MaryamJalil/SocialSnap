const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notificationMessageSchema = new Schema(
    {
        sender: {
            type: Schema.Types.ObjectId,
            ref: 'user'
        },
        receiver: {
            type: Schema.Types.ObjectId,
            ref: 'user'
        },
        type: {
            type: String,
            default: ""
        },
        message: {
            type: String,
            default: ""
        },
        is_read: {
            type: Boolean,
            default: false
        },

    },
    { timestamps: true }
);


module.exports = mongoose.model("notification_message", notificationMessageSchema);
