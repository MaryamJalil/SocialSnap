const NOTIFICATIONS = {
    MINI_LIKE: {
        title: 'username',
        body: 'liked your Mini',
        type: 'Mini_Like',
    },
    MINI_COMMENT: {
        title: 'username',
        body: 'commented on your Mini',
        type: 'Mini_Comment',
    },
    MINI_COMMENT_REPLY: {
        title: 'username',
        body: 'replied to your comment',
        type: 'Mini_Comment_Reply',
    },
    FOLLOW: {
        title: 'Follow',
        body: 'started following you',
        type: 'Follow',
    },
    NEW_MINI: {
        title: 'username',
        body: 'post',
        type: "New_Mini"
    },
    CHALLANGE: {
        title: 'username',
        body: 'Sent you Mini Challenge',
        type: "Mini_Challenge"
    },
    MESSAGE_SEND: {
        title: 'username',
        body: 'Message is send',
        type: "Message_Send"
    }
}
module.exports = {
    NOTIFICATIONS
}
