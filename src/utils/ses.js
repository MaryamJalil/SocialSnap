let nodemailer = require('nodemailer');
let AWS = require('aws-sdk');


const sendEmailForOtpVerification = async (from, to, otp,first_name,last_name) => {
    // configure AWS SDK
    AWS.config.update({
        secretAccessKey: process.env.secretAccessKey,
        accessKeyId: process.env.accessKeyId,
        region: process.env.region
    });

    // create Nodemailer SES transporter
    let transporter = nodemailer.createTransport({
        SES: new AWS.SES({
            apiVersion: '2010-12-01'
        })
    });

    try {
        const emailRes = await transporter.sendMail({
            from,
            to,
            subject: 'OTP',
            text: `Dear ${first_name} ${last_name},

Thank you for signing up for Share Slate Fun! We're excited to have you as a part of our community.

To complete your registration, please use the following One-Time Password (OTP) verification code:

${otp}

Please enter this code on the app to verify your account. This code will expire in (expiration time). If you did not request this code, please ignore this email.

If you have any questions or need further assistance, please don't hesitate to contact our support team at (Support email address).

Thank you for choosing Share Slate Fun!

Best regards,
Team Share Slate Fun`,
        });

        console.log("🚀 ~ file: ses.js:25 ~ sendEmail ~ emailRes", emailRes);
        return emailRes;
    } catch (error) {
        console.log("🚀 ~ file: ses.js:32 ~ sendEmail ~ error", error)
    }
}

const sendForgotPassword = async (from, to, otp,first_name,last_name) => {
    // configure AWS SDK
    AWS.config.update({
        secretAccessKey: process.env.secretAccessKey,
        accessKeyId: process.env.accessKeyId,
        region: process.env.region
    });

    // create Nodemailer SES transporter
    let transporter = nodemailer.createTransport({
        SES: new AWS.SES({
            apiVersion: '2010-12-01'
        })
    });

    try {
        const emailRes = await transporter.sendMail({
            from,
            to,
            subject: 'Reset Password',
            text: `Reset Password

Please enter the email address you provided during sign-up to receive a password reset code via email.
Email address: ${to}

Dear ${first_name} ${last_name},

We have received a request to reset the password associated with your Share Slate Fun account. If you did not request this password reset, please ignore this email.

To reset your password, please follow the instructions below:
1. Click on the following link: [Insert Link Here].
2. Follow the on-screen instructions to verify your identity and create a new password for your account.
3. If you are unable to click on the link above, please copy and paste the link into your web browser's address bar.

Please note that this password reset link will expire in [Insert Expiration Time Here], so please reset your password as soon as possible.

If you have any questions or concerns, please do not hesitate to contact our customer support team at [Insert Contact Information Here].

Thank you for using Share Slate Fun.

Best regards,
Team Share Slate Fun`,
        });

        console.log("🚀 ~ file: ses.js:25 ~ sendEmail ~ emailRes", emailRes);
        return emailRes;
    } catch (error) {
        console.log("🚀 ~ file: ses.js:32 ~ sendEmail ~ error", error);
    }
};

const sendEmail = async (from, to,otp) => {

    // configure AWS SDK
    AWS.config.update({
        secretAccessKey: process.env.secretAccessKey,
        accessKeyId: process.env.accessKeyId,
        region: process.env.region
    });

    // create Nodemailer SES transporter
    let transporter = nodemailer.createTransport({
        SES: new AWS.SES({
            apiVersion: '2010-12-01'
        })
    });



    try {
        const emailRes = await  // send some mail
            transporter.sendMail({
                from,
                to,
                subject: 'OTP',
                text: `Your OTP for the share slate fun is ${otp}`,
                // replyTo: 'no-reply@shareslate.fun'
            });
        console.log("🚀 ~ file: ses.js:25 ~ sendEmail ~ emailRes", emailRes);
        return emailRes;
    } catch (error) {
        console.log("🚀 ~ file: ses.js:32 ~ sendEmail ~ error", error)

    }

}

module.exports = {
    sendEmail,
    sendEmailForOtpVerification,
    sendForgotPassword
}