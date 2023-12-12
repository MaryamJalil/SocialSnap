const FCM = require('fcm-node')

const sendNotification = async (token, notification, data = {}) => {

var serverKey = `AAAAVLfaERs:APA91bHoOpvR6DvrYMQ3Lu9ACcTiKej0VapZ6JzrxtThdtJkcKJ2HS6HPJqgTNeVVPr1rQnxmuFGC22jUJnM7QWH7S4DZ-cL75C9xzUjlka4OTgSi9fm7_UcEWDXz49DDK2F1HOQLzq3`;
console.log(serverKey,'serverKey')

const fcm = new FCM(serverKey)
console.log(fcm,"bhhhhh")
    console.log("🚀 ~ file: fcm.js:9 ~ sendNotification ~ token", token)
    try {

        const message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
            to: token,
            notification,
            data
        }
console.log(message,"njjjjkjln j")
        return fcm.send(message, function (err, response) {
        
            if (err) {
                console.log("🚀 ~ file: fcm.js:20 ~ err", err)
                console.log("Something has gone wrong!")
            }
            console.log("🚀 ~ file: fcm.js:26 ~ response", response)

             return response;
        })
    } catch (error) {
        console.log("🚀 ~ file: fcm.js:11 ~ sendNotification ~ error", error)

    }
}



module.exports = {
    sendNotification
}