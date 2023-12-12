const multer =  require('multer');
const multerS3 =  require('multer-s3');
const aws = require('aws-sdk');
const mimetype = require('mime-types');

//set aws keys to bucket upload
aws.config.update({
    secretAccessKey: process.env.secretAccessKey,
    accessKeyId: process.env.accessKeyId,
    region: process.env.region
});
//set the bucket
const s3 = new aws.S3();

const fileFilter = (req,file,cb) =>{
    if (!file.originalname.match(/\.(JPG|jpg|jpeg|png|gif|mp4)$/)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
}

const upload_image = multer({
    fileFilter: fileFilter,
    storage: multerS3({
        acl: 'public-read',
        s3,
        bucket: `${process.env.AWS_BUCKET_NAME}`,
        metadata: (req, file, cb) => {
           cb(null, {fieldName: file.fieldname});
        },
        key: (req, file, cb) => {
           const ext = mimetype.extension(mimetype.lookup(file.originalname));
           cb(null, `${Date.now().toString()}.${ext}`)
        }
    })
});


module.exports = {
    upload_image
};
       
