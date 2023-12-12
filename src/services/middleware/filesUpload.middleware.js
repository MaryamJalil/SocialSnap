const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
const mimetype = require('mime-types');
const Media = require('twilio/lib/rest/Media');
const path = require("path")
const fs = require("fs");

//set aws keys to bucket upload
// aws.config.update({
//     secretAccessKey: process.env.secretAccessKey,
//     accessKeyId: process.env.accessKeyId,
//     region: process.env.region
// });
//set the bucket



// const fileFilter = (req,file,cb) =>{
//     if (!file.originalname.match(/\.(JPG|jpg|jpeg|png|gif|mp4)$/)) {
//         return cb(new Error('Only selected formates are allowed!'), false);
//     }
//     cb(null, true);
// }

// const upload = multer({
//     fileFilter: fileFilter,
//     storage: multerS3({
//         acl: 'public-read',
//         s3,
//         bucket: `${process.env.AWS_BUCKET_NAME}`,
//         metadata: (req, file, cb) => {
//            cb(null, {fieldName: file.fieldname});
//         },
//         key: (req, file, cb) => {
//            const ext = mimetype.extension(mimetype.lookup(file.originalname));
//            cb(null, `${Date.now().toString()}.${ext}`)
//         }
//     })
// });


const storage = multer.diskStorage({
    destination: "./src/files/minis",
    filename: function (req, file, cb) {
        cb(null, "mini-" + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });



const storefileToS3 = async (filePath, Key) => {
    console.log("🚀 ~ file: filesUpload.middleware.js:54 ~ storefileToS3 ~ filePath, Key", filePath, Key)
    try {
        AWS.config.update({
            secretAccessKey: process.env.secretAccessKey,
            accessKeyId: process.env.accessKeyId,
            region: process.env.region
        });
        const fileStream = fs.createReadStream(filePath);
        const params = {
            Key,
            Body: fileStream,
            Bucket: process.env.AWS_BUCKET_NAME
        }
        const s3 = new AWS.S3();
        const res = await s3.upload(params).promise();
        return { url: res.Location, file_path: filePath };
    } catch (error) {
        console.log("🚀 ~ file: filesUpload.middleware.js:59 ~ storefileToS3 ~ error", error)

    }
}


module.exports = {
    upload,
    storefileToS3
};

