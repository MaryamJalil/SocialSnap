const minisModel = require("../../models/minis.model");
const reportModel = require("../../models/report.model");
module.exports.create = async (req, res) => {
    try {
        const { reason, mini_id } = req.body;
        const mini = await minisModel.findOne({ _id: mini_id });
        if (!mini) {
            return res.status(404).json({ success: false, message: "Mini not found" })
        }
        const report = {
            mini: mini_id,
            reporter: req.user.id,
            reason
        }

        let count = mini.report_count || 0;
        if (count <= 4) {
            mini.report_count = ++count;
            await reportModel.create(report);
            await mini.save()
        } else {
            mini.reported = true;
            await mini.save();
        }
        return res.status(201).json({ success: 200, message: "Report created!" })
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    }
}
