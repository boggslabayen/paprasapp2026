// getting-started.js
const mongoose = require('mongoose');

async function dbInit() {
  await mongoose.connect(process.env.DB_CONNECTION_STRING);
}

module.exports = {
    dbInit
}