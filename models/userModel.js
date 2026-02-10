const mongoose = require("mongoose");
const {Schema} = mongoose;

// Schema for users

const userSchema = new Schema({
    firstName: String,
    lastName: String,
    email: String,
    password: String,
    type: String
   
},{ timestamps: true });

const userModel = mongoose.model("User", userSchema);

module.exports = {
    userModel
}