/**
 * Created by MacBook Pro on 2017/3/7.
 */
var express = require("express");
var port = 3000;
var mongoose = require("mongoose");
var User = require("./models/user");
var Image = require("./models/image");
var path = require("path");
// 解析json格式的请求
var bodyParser = require('body-parser');
// 解析文件格式的请求
var multiparty = require('multiparty');
var fs = require("fs");


// 自定义session缓存
var session = [];
var sessionTime = 5000;   // session过期时间

var app = express();
mongoose.connect('mongodb://localhost:27017/admin');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
    console.log('db service connected.')
});
app.set("views","./views");
app.set("view engine","jade");
app.use(express.static(path.join(__dirname,'static')));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.listen(port);
console.log("imooc started on port" + port);

app.get("/all",function(req,res){
    User.find({},function(err,users){
        if(err){
            console.log(err);
        }else{
            res.send(users);
        }
    });
});

// 注册
app.post("/user/register",function(req,res){
    // 查看是否已经注册
    User.find({username:req.body.username},function(err,user){
        if(err){
            console.log(err);
        }
        if(user.length > 0){
            res.send(returnObj(1,req.body.username + "用户名已存在"));
        }else{
            // 注册用户
            var user = new User({
                username:req.body.username,
                password:req.body.password
            });
            user.save(function(err,doc){
                if(err){
                    console.log(err);
                }else{
                    doc.loginTime = Date.now();
                    session.push(doc);
                    res.send(returnObj(0,"注册成功",doc));
                }
            });
        }
    });
});

// 登录
app.post("/user/login",function(req,res){
    User.find({username:req.body.username},function(err,users){
        if(err){
            console.log(err);
        }
        if(users.length == 0){
            res.send(returnObj(1,req.body.username+"用户名不存在"));
        }else{
            User.find({username:req.body.username,password:req.body.password},function(err,user){
                if(err){
                    console.log(err);
                }
                if(user.length == 0){
                    res.send(returnObj(1,"密码错误"));
                }else{
                    user[0].loginTime = Date.now();
                    session.push(user[0]);
                    res.send(returnObj(0,"登录成功",user[0]));
                }
            });
        }
    });
});

// 上传文件
app.post("/image/upload",function(req,res){
    var form = new multiparty.Form({uploadDir: './static/files/'});
    form.parse(req, function(err, fields, files) {
        var filesTmp = JSON.stringify(files,null,2);
        if(err){
            console.log(err);
        }else{
            var inputFile = files.file[0];
            var uploadedPath = inputFile.path;
            var dstPath = './static/files/' + inputFile.originalFilename;
            fs.rename(uploadedPath, dstPath, function(err) {
                if(err){
                    console.log(err);
                }else{
                    res.send(returnObj(0,"上传图片成功",dstPath));
                }
            })
        }
    })
});

// 查找用户信息
app.get("/user/info",function(req,res){
    var id = req.query.id;
    User.find({_id:id},function(err,user){
        if(err){
            console.log(err);
        }
        res.send(returnObj(0,"查找成功",user[0]));
    });
});

// 用户喜欢图片
app.get("/user/loveImg",function(req,res){
    var id = req.query.userId;
    User.find({_id:id},function(err,user){
        if(err){
        }else{
            var imageComment = user[0].loveId;
            Image.where("_id").in(imageComment).exec(function(err,data){
                res.send(returnObj(0,"查询成功",data));
            });
        }
    });
});

// 用户上传图片
app.get("/user/upload",function(req,res){
    var id = req.query.userId;
    Image.find({owner:id},function(err,user){
        if(err){
            console.log(err);
        }else{
            console.log(user);
            res.send(returnObj(0,"查询成功",user));
        }
    });
});

// 完善用户信息
app.post("/user/perfect",function(req,res){
    id = req.body.id;
    var user = {
        img:req.body.img,
        age:req.body.age,
        sex:req.body.sex,
        indroduction:req.body.indroduction,
        hobby:req.body.hobby
    };
    User.update({_id:id},{$set:user},function(err,user){
        if(err){
            console.log(err);
        }else{
            if(user.nModified > 0){
                res.send(returnObj(0,"更新成功"));
            }else{
                res.send(returnObj(1,"更新失败"));
            }
        }
    });
});

// 图片搜索
app.get("/image/search",function(req,res){
    var type = req.query.type;
    Image.find({type:type},function(err,imgaes){
        if(err){
            console.log(err);
        }else{
            res.send(returnObj(0,"搜索成功",imgaes));
        }
    });
});

// 获取全部图片
app.get("/image/all",function(req,res){
    var currentPage = req.query.currentPage;
    var pageSize = req.query.pageSize;
    Image.find({},function(err,images){
        if(err){
            console.log(err);
        }else{
            var backImg = [];
            var beginIndex = pageSize * (currentPage - 1);
            var endIndex = pageSize * currentPage;
            for(var i = beginIndex; i < endIndex; i++){
                if(images[i]){
                    backImg.push(images[i]);
                }
            }
            res.send(returnObj(0,"查询成功",backImg))
        }
    });
});

// 图片详情
app.get("/image/detail",function(req,res){
    var id = req.query.id;
    Image.find({_id:id},function(err,image){
        if(err){
            console.log(err);
        }else{
            res.send(returnObj(0,"查询成功",image));
        }
    });
});

//删除图片
app.post("/image/delete",function(req,res){
    var userId = req.body.userId;
    var imageId = req.body.id;
    Image.remove({_id:imageId,owner:userId},function(err,data){
        if(err){
            console.log(err);
        }else{
            res.send(returnObj(0,"删除成功",data));
        }
    });
});

// 回复评论
app.post("/comment/back",function(req,res){
    var index = req.body.index;
    var imageId = req.body.imageId;
    var backComment = req.body.msg;
    Image.find({_id:imageId},function(err,image){
        if(err){
            console.log(err);
        }else{
            var comment = image[0].comment;
            if(comment[index].comments){
                comment[index].comments.push(backComment);
            }else{
                comment[index].comments = [];
                comment[index].comments.push(backComment);
            }
            Image.update({_id:imageId},{$set:{comment:comment}},function(err){
                if(err){
                    console.log(err);
                }else{
                    res.send(returnObj(0,"更新成功"))
                }
            });
        }
    });
});

// 上传图片
app.post("/image/uploadfile",function(req,res){
    var image = new Image({
        owner:req.body.owner,
        name:req.body.name,
        img:req.body.img,
        type:req.body.type,
        keyword:req.body.keyword,
        indroduction:req.body.indroduction
    });
    image.save(function(err,image){
        if(err){
            console.log(err);
        }else{
            res.send(returnObj(0,"上传图片成功",image));
        }
    });
});

// 评论
app.post("/image/comment",function(req,res){
    var imageId = req.body.imageId;
    var userId = req.body.userId;
    var comment = req.body.comment;
    var obj = {
        userId:userId,
        comment:comment
    };
    Image.find({_id:imageId},function(err,image){
        if(err){
            console.log(err);
        }else{
            var imageComment = image[0].comment;
            imageComment.push(obj);
            Image.update({_id:imageId},{$set:{comment:imageComment}},function(err){
                if(err){
                    console.log(err);
                }else{
                    res.send(returnObj(0,"评论成功",imageComment));
                }
            });
        }
    })
});

// 获取评论
app.get("/image/comment",function(req,res){
    var id = req.query.id;
    Image.find({_id:id},function(err,image){
        if(err){
        }else{
            var imageComment = image[0].comment;
            var userId  = [];
            for(var i = 0; i < imageComment.length; i++){
                userId.push(imageComment[i].userId);
            }
            User.where("_id").in(userId).exec(function(err,data){
                for(var i = 0; i < imageComment.length; i++){
                    for(var j = 0; j < data.length; j++){
                        if(imageComment[i].userId == data[j]._id){
                            imageComment[i].userInfo = data[j];
                        }
                    }
                }
                res.send(returnObj(0,"查询成功",imageComment));
            });
        }
    });
});

// 收藏
app.post("/image/love",function(req,res){
    var userId = req.body.userId;
    var imageId = req.body.imageId;
    var isUser = false;
    var isImage = false;
    User.find({_id:userId},function(err,user){
        if(err){
            console.log(err);
        }else{
            var userLove = user[0].loveId;
            userLove.push(imageId);
            User.update({_id:userId},{$set:{loveId:userLove}},function(err){
                if(err){
                    console.log(err);
                }else{
                    isUser = true;
                    if(isUser && isImage){
                        res.send(returnObj(0,"收藏成功"))
                    }
                }
            })
        }
    });
    Image.find({_id:imageId},function(err,image){
        if(err){
            console.log(err);
        }else{
            var imageLove = image[0].loveId;
            imageLove.push(userId);
            Image.update({_id:imageId},{$set:{loveId:imageLove}},function(err){
                if(err){
                    console.log(err);
                }else{
                    isImage = true;
                    if(isUser && isImage){
                        res.send(returnObj(0,"收藏成功"))
                    }
                }
            })
        }
    });
});

// 取消收藏
app.post("/image/notlove",function(req,res){
    var userId = req.body.userId;
    var imageId = req.body.imageId;
    var isUser = false;
    var isImage = false;
    User.find({_id:userId},function(err,user){
        if(err){
            console.log(err);
        }else{
            var userLove = user[0].loveId;
            for(var i = userLove.length - 1; i >= 0; i--){
                if(userLove[i] == imageId){
                    userLove.splice(i,1);
                }
            }
            User.update({_id:userId},{$set:{loveId:userLove}},function(err){
                if(err){
                    console.log(err);
                }else{
                    isUser = true;
                    if(isUser && isImage){
                        res.send(returnObj(0,"取消收藏成功"))
                    }
                }
            })
        }
    });
    Image.find({_id:imageId},function(err,image){
        if(err){
            console.log(err);
        }else{
            var imageLove = image[0].loveId;
            for(var i = imageLove.length - 1; i >= 0; i--){
                if(imageLove[i] == userId){
                    imageLove.splice(i,1);
                }
            }
            Image.update({_id:imageId},{$set:{loveId:imageLove}},function(err){
                if(err){
                    console.log(err);
                }else{
                    isImage = true;
                    if(isUser && isImage){
                        res.send(returnObj(0,"取消收藏成功"))
                    }
                }
            })
        }
    });
});

// 返回对象
function returnObj(status,msg,data){
    var backData = {};
    backData.status = status || 0;
    backData.msg = msg || "";
    if(data){
        backData.body = data;
    }
    return backData;
}

// 每隔五分钟删除session
setInterval(function(){
    for(var i = session.length - 1; i >= 0; i--){
        var nowTime = Date.now();
        if(nowTime - session[i].loginTime >= sessionTime){
            session.splice(i,1);
        }
    }
},sessionTime);