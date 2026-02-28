const mongoose = require("mongoose");
const {Schema} = mongoose;

// Schema for doctors' list

const doctorSchema = new Schema({
    firstName: String,
    lastName: String,
    doctor_type: String,
    region: String,
    province: String,
    city: String
   
},{ timestamps: true });

const doctorModel = mongoose.model("Doctors", doctorSchema);

module.exports = {
    doctorModel
}