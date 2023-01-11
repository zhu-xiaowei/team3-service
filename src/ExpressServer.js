const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const sql = require("./MysqlUtil");
const date = require("./DateUtil");
const app = express();

app.use(express.static(__dirname));
const jsonParser = bodyParser.json({extended: false});


app.post('/api/login', jsonParser, function (req, res) {
  let response = getResponse();
  if (!checkBody(req, response)) {
    res.end(JSON.stringify(response))
    return;
  }
  let mobile = req.body.mobile;
  let password = req.body.password;
  if (mobile) {
    sql.queryUserByMobile(mobile, function (err, result) {
      if (err) {
        response.code = 1;
        response.msg = err;
      } else {
        if (result.length === 0) {
          response.code = 1;
          response.msg = "请输入正确的手机号";
        } else {
          let res = result[0]
          if (res.password === password) {
            response.data.user = res
          } else {
            response.code = 2;
            response.msg = "密码错误";
          }
        }
      }
      res.end(JSON.stringify(response))
    })
  } else {
    response.code = 1;
    response.msg = "请输入手机号";
    res.end(JSON.stringify(response))
  }
})


app.post('/api/modifyPassword', jsonParser, function (req, res) {
  let response = getResponse();
  if (!checkBody(req, response)) {
    res.end(JSON.stringify(response))
    return;
  }
  let mobile = req.body.mobile;
  let password = req.body.password;
  let newPassword = req.body.newPassword;
  if (mobile) {
    sql.queryUserByMobile(mobile, function (err, result) {
      if (err) {
        response.code = 1;
        response.msg = err;
      } else if (result.length === 0) {
        response.code = 1;
        response.msg = "请输入正确的手机号";
      } else if (result[0].password !== password) {
        response.code = 2;
        response.msg = "原密码错误";
      } else {
        //更新密码
        sql.updateUserPassword(result[0].id, newPassword, function (err, result) {
          if (err) {
            response.code = 1;
            response.msg = err;
          }
          res.end(JSON.stringify(response))
        })
        return;
      }
      res.end(JSON.stringify(response))
    })
  } else {
    response.code = 1;
    response.msg = "请输入手机号";
    res.end(JSON.stringify(response))
  }
})

app.post('/api/addVideo', jsonParser, function (req, res) {
  let response = getResponse();
  if (!checkBody(req, response)) {
    res.end(JSON.stringify(response))
    return;
  }
  let data = req.body;
  let s3_url = data.s3_url;
  //查找hls_url
  sql.getVideoHls(s3_url, function (err, result) {
    if (err) {
      response.code = 1;
      response.msg = err;
      res.end(JSON.stringify(response))
    } else {
      let hls_url = "";
      let hls_state = 0;
      if (result && result.length > 0) {
        hls_url = result[0].hls_url;
        hls_state = 1;
      }
      data.hls_url = hls_url;
      data.hls_state = hls_state;
      data.upload_time = date.dateFormat("YYYY-mm-dd HH:MM:SS", new Date());
      sql.uploadVideo(data, function (err, result) {
        if (err) {
          response.code = 1;
          response.msg = err;
        }
        res.end(JSON.stringify(response))
      })
    }
  })
});


app.get('/api/videoList', function (req, res) {
  let response = getResponse();
  let userId = req.query.userId;
  let isApp = req.headers.app_name === "RnVideo";
  sql.queryVideoList(userId, function (err, result) {
    if (err) {
      response.code = 1;
      response.msg = err;
    } else {
      if (isApp) {
        response.data.videoList = result.filter(item => item.hls_state === 1)
      } else {
        response.data.videoList = result
      }
    }
    res.end(JSON.stringify(response))
  })
});

app.post('/api/addUser', jsonParser, function (req, res) {
  let response = getResponse();
  if (!checkBody(req, response)) {
    res.end(JSON.stringify(response))
    return;
  }
  let mobile = req.body.mobile;
  sql.queryUserByMobile(mobile, function (err, result) {
    if (err) {
      response.code = 1;
      response.msg = err;
      res.end(JSON.stringify(response))
    } else {
      if (result.length > 0) {
        response.code = 1;
        response.msg = "该用户已存在";
        res.end(JSON.stringify(response))
      } else {
        //用户不存在 插入
        let data = req.body;
        sql.addUser(data, function (err, result) {
          if (err) {
            response.code = 1;
            response.msg = err;
          }
          res.end(JSON.stringify(response))
        })
      }
    }
  })
});

app.get('/api/userList', function (req, res) {
  let response = getResponse();
  sql.queryAllUser(function (err, result) {
    if (err) {
      response.code = 1;
      response.msg = err;
      res.end(JSON.stringify(response))
    } else if (result.length === 0) {
      response.code = 1;
      response.msg = "暂无用户";
      res.end(JSON.stringify(response))
    } else {
      response.data.userList = result
      res.end(JSON.stringify(response))
    }
  })
});


app.post('/api/likeVideo', jsonParser, function (req, res) {
  let response = getResponse();
  if (!checkBody(req, response)) {
    res.end(JSON.stringify(response))
    return;
  }
  let data = {
    "user_id": req.body.user_id,
    "video_id": req.body.video_id,
    "like_type": req.body.like_type,
    "like_time": date.dateFormat("YYYY-mm-dd HH:MM:SS", new Date()),
  }
  //打log
  sql.insertAndUpdateLikeLog(data, function (err, result) {
    if (err) {
      console.log(err);
      response.code = 1;
      response.msg = err;
      res.end(JSON.stringify(response))
    }
    // 更新视频的点赞数
    sql.getVideoLikeCount(data.video_id, function (err, result) {
      if (err) {
        response.code = 1;
        response.msg = err;
        res.end(JSON.stringify(response))
      } else {
        let like_num = result[0].like_num;
        let unlike_num = result[0].unlike_num;
        sql.updateVideoLikeCount(like_num, unlike_num, data.video_id, function (err, result) {
          if (err) {
            response.code = 1;
            response.msg = err;
          }
          res.end(JSON.stringify(response))
        })
      }
    })
  })
})


app.get('/index.html', function (req, res) {
  res.sendFile(path.resolve(__dirname, "../index.html"))//访问上一级目录
})

function getResponse() {
  return {
    "code": 0,
    "msg": "success",
    "data": {}
  }
}

function checkBody(req, response) {
  if (!req.body) {
    response.code = 1;
    response.msg = "请求参数错误";
    return false
  }
  return true
}

const server = app.listen(8080, function () {
  let host = server.address().address;
  let port = server.address().port;
  console.log("应用实例，访问地址为 http://%s:%s", host, port)
});
