const notificationModel = require("../../models/notification.model");

module.exports.read_notifications = async (req, res) => {
    try {
        const notifications = await notificationModel.find({ user_id: req.user._id }).sort({ createdAt: -1 }).populate("from").populate("mini").populate("user_id")
        return res.status(200).json({ status: 200, notifications })
    } catch (error) {
        console.log("🚀 ~ file: notifications.controller.js:8 ~ module.exports.read_notifications= ~ error:", error)
        return res.status(500).json({ status: 500, message: error.message });
    }
}


module.exports.mark_as_read_notification = async (req, res) => {
    try {
        const { notification_id } = req.body;
        if (!notification_id) {
            return res.status(400).json({ status: 400, message: "Invalid body data" })
        }
        await notificationModel.findOneAndUpdate({ _id: notification_id }, { $set: { is_read: true } }, { new: true })
        return res.status(200).json({ status: 200 })
    } catch (error) {
        console.log("🚀 ~ file: notifications.controller.js:23 ~ module.exports.mark_as_read_notification= ~ error:", error)
        return res.status(500).json({ status: 500, message: error.message });
    }
}
