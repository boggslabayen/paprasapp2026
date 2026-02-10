const mongoose = require("mongoose");
const {Schema} = mongoose;

// Schema for doctors' list

const doctorSchema = new Schema({
    firstName: String,
    lastName: String,
    location: String
   
},{ timestamps: true });

const doctorModel = mongoose.model("Doctors", doctorSchema);

module.exports = {
    doctorModel
}