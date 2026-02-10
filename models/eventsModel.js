const mongoose = require("mongoose");
const {Schema} = mongoose;

// Schema for doctors' list

const eventSchema = new Schema({
    title: String,
    eventUrl: String,
    bannerUrl: String,
    contentHtml: String
   
},{ timestamps: true });

const eventsModel = mongoose.model("Events", eventSchema);

module.exports = {
    eventsModel
}