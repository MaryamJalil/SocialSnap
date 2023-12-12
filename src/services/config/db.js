const mongoose = require('mongoose');
const config = require('./config');

module.exports = function() {
  
  // const db = `mongodb://${config.DB_USERNAME}:${config.DB_PASSWORD}@${config.DB_HOST}/?authMechanism=DEFAULT`;
  const db = process.env.mongodburl
  console.log({db})
  mongoose.connect(db)
    .then(() => console.log(`Connected successfully.`))
    .catch((err)=> console.log(`Error:${err}`));
}