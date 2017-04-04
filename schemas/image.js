/**
 * Created by MacBook Pro on 2017/3/9.
 */
var mongoose = require("mongoose");
var ImageSchema = new mongoose.Schema({
    name:String,
    img:String,
    loveId:Array,
    type:Number,
    comment:Array,
    indroduction:String,
    keywords:String,
    owner:String,
    updateTime:{type:Date,default:Date.now()}
});
module.exports = ImageSchema;