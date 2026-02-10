const mongoose = require("mongoose");
const {Schema} = mongoose;

// Schema for doctors' list

const procedureSchema = new Schema({
    title: String,
    category: String,
    bannerUrl: String,
    contentHtml: String
   
},{ timestamps: true });

const procedureModel = mongoose.model("Procedures", procedureSchema);

module.exports = {
    procedureModel
}