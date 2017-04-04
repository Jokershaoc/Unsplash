/**
 * Created by MacBook Pro on 2017/3/9.
 */
var mongoose = require("mongoose");
var ImageSchema = require("../schemas/image");
var Image = mongoose.model("image",ImageSchema);

module.exports = Image;