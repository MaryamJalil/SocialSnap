const User = require('../../models/users.model');
const passport = require('passport');

var JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;
var opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = '@#$&distr!!!ibutor-key**)&%$'
// opts.issuer = 'accounts.examplesoft.com';
// opts.audience = 'yoursite.net';
passport.use(new JwtStrategy(opts, function (jwt_payload, done) {
    if (jwt_payload._id == 'guest') {
        const user = {
            _id: jwt_payload._id
        }
        return done(null, user);
    }
    User.findOne({ _id: jwt_payload._id, deleted: false }, function (err, user) {
        if (err) {
            return done(err, false);
        }
        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
            // or you could create a new account
        }
    });
}));


const requireRole = (_id) => {
    return (req, res, next) => {
        if (req.user.roles.includes(role)) {
            return next();
        }
        return res.status(401).send('Unauthorized');
    }
}

const requireGuest = requireRole('guest');
const requireAdmin = requireRole('admin');

module.exports = {
    requireGuest
}
