const mysql = require('mysql');
const pool = mysql.createPool({
  name: 'database-3.cknl2c6ecure.ap-northeast-1.rds.amazonaws.com',
  host: 'database-3.cknl2c6ecure.ap-northeast-1.rds.amazonaws.com',
  user: 'admin',
  password: 'carlwe.com',
  port: '3306',
  database: 'test',
  connectionLimit: 10,
})

exports.queryUserByMobile = function (mobile, callback) {
  const sql = 'SELECT * FROM user WHERE mobile = ?';
  const addSqlParams = [mobile]
  queryDb(sql, addSqlParams, callback);
}

exports.queryUserById = function (id, callback) {
  const sql = 'SELECT * FROM user WHERE id = ?';
  const addSqlParams = [id]
  queryDb(sql, addSqlParams, callback);
}

exports.queryAllUser = function (callback) {
  const sql = 'SELECT * FROM user';
  const addSqlParams = []
  queryDb(sql, addSqlParams, callback);
}

exports.addUser = function (data, callback) {
  const sql = 'INSERT INTO user(name,mobile,user_type,password) VALUES(?,?,?,?)'
  const addSqlParams = [data.name, data.mobile, data.user_type, data.password];
  queryDb(sql, addSqlParams, callback);
}

exports.updateUserPassword = function (userId, newPassword, callback) {
  const sql = 'UPDATE user SET password = ? WHERE id = ?';
  const addSqlParams = [newPassword, userId];
  queryDb(sql, addSqlParams, callback);
}

exports.getVideoHls = function (s3_url, callback) {
  const sql = 'SELECT hls_url FROM transcode_log WHERE s3_url = ?';
  const addSqlParams = [s3_url];
  queryDb(sql, addSqlParams, callback);
}

exports.uploadVideo = function (data, callback) {
  const sql = 'INSERT INTO video(title,thumbnail,source_url,s3_url,hls_url,hls_state,create_user_id,upload_time) VALUES(?,?,?,?,?,?,?,?)'
  const addSqlParams = [data.title, data.thumbnail, data.source_url, data.s3_url, data.hls_url, data.hls_state, data.create_user_id, data.upload_time];
  queryDb(sql, addSqlParams, callback);
}

exports.queryVideoList = function (user_id, callback) {
  const sql = 'SELECT v.*,like_type\n' +
    'FROM like_log AS l\n' +
    'RIGHT JOIN  video AS v\n' +
    'ON v.id = l.video_id and l.user_id = ? ORDER BY id DESC';
  const addSqlParams = [user_id];
  queryDb(sql, addSqlParams, callback);
}

exports.insertAndUpdateLikeLog = function (data, callback) {
  const sql = 'INSERT INTO like_log(log_id,user_id,video_id,like_type,update_time) VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE like_type = ?'
  const addSqlParams = [data.user_id + "_" + data.video_id, data.user_id, data.video_id, data.like_type, data.like_time, data.like_type];
  queryDb(sql, addSqlParams, callback);
}

exports.getVideoLikeCount = function (video_id, callback) {
  const sql = 'select COUNT(CASE WHEN video_id=? and like_type=1 THEN 1 END) AS like_num, COUNT(CASE WHEN video_id=? and like_type=2 THEN 1 END) AS unlike_num from like_log';
  const addSqlParams = [video_id, video_id];
  queryDb(sql, addSqlParams, callback);
}

exports.updateVideoLikeCount = function (like_num, unlike_num, video_id, callback) {
  const sql = 'UPDATE video SET like_num = ? ,unlike_num = ? WHERE id = ?';
  const addSqlParams = [like_num, unlike_num, video_id];
  queryDb(sql, addSqlParams, callback);
}

function queryDb(sql, addSqlParams, callback) {
  pool.getConnection(function (err, connection) {
    connection.query(sql, addSqlParams, function (err, result) {
      connection.release();
      if (err || !result) {
        callback(err.message, null)
      } else {
        callback(null, result)
      }
    })
  });
}

