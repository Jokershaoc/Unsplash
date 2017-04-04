/**
 * Created by MacBook Pro on 2017/3/8.
 */
var mongoose = require("mongoose");
var UserSchema = new mongoose.Schema({
    username:String,
    password:String,
    img:String,
    loveId:Array,
    age:Number,
    sex:Number,
    Indroduction:String,
    hobby:String,
    updateTime:{type:Date,default:Date.now()}
});
module.exports = UserSchema;