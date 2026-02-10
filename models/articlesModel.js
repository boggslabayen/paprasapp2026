const mongoose = require("mongoose");
const {Schema} = mongoose;

// Schema for doctors' list

const articleSchema = new Schema({
    title: String,
    bannerUrl: String,
    contentHtml: String
   
},{ timestamps: true });

const articleModel = mongoose.model("Articles", articleSchema);

module.exports = {
    articleModel
}