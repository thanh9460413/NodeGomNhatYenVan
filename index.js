const express = require('express');
const graph = require('fbgraph');

const app = express();
const PORT = process.env.PORT || 3000;

const ACCESS_TOKEN = 'EAANAZAMKsZCgIBOZCw9azYFm6aIniKTuud7HUxGcVQAeN0niCyX97RmTxvDtZAuAgZCqX8vOPYZAEN85JmadD7AYoeZCpYU1BQYqtWXnBN6aciJuQcJg7VQyjwaMX5F8io5fNBHWp0znhLpk9ZB9qxLdZCyQiBtyWZAsjgo1ZAzf5fFz8rHerFdfRccQ9npzudcaRS9LEaKRG0zJt6R5W8OZCtuqk7UZD'; 
graph.setAccessToken(ACCESS_TOKEN);

const pageId = '104599055407821'; 

// Hàm lấy livestream hiện tại
function getLiveStream(pageId) {
  return new Promise((resolve, reject) => {
    const params = {
      fields: 'id,title,description,creation_time,status', // Các trường cần thiết
      broadcast_status: ['LIVE'], // Truyền broadcast_status dưới dạng mảng
    };

    graph.get(`${pageId}/live_videos`, params, (err, res) => {
      if (err) {
        console.error('Lỗi khi gọi API livestream: ', err);
        reject('Lỗi khi lấy thông tin livestream: ' + err.message);
      } else {
        if (res.data && res.data.length > 0) {
          resolve(res.data[0]); // Lấy livestream đầu tiên đang phát
        } else {
          reject('Không có livestream nào đang phát.');
        }
      }
    });
  });
}

// Hàm lấy bình luận từ một livestream
function getComments(liveVideoId) {
  return new Promise((resolve, reject) => {
    const params = {
      fields: 'from,message,created_time',
      filter: 'stream',
    };

    graph.get(`${liveVideoId}/comments`, params, (err, res) => {
      if (err) {
        console.error('Lỗi khi gọi API bình luận: ', err);
        reject('Lỗi khi lấy bình luận: ' + err.message);
      } else {
        resolve(res.data); // Trả về các bình luận
      }
    });
  });
}

// API endpoint để lấy livestream và bình luận
app.get('/get-live-comments', async (req, res) => {
  try {
    console.log('Đang tìm livestream hiện tại...');
    const liveStream = await getLiveStream(pageId);
    console.log('Livestream hiện tại:', liveStream);

    console.log(`Đang lấy bình luận từ livestream với ID: ${liveStream.id}`);
    const comments = await getComments(liveStream.id);
    console.log('Các bình luận:', comments);

    // Trả về kết quả dưới dạng JSON
    res.json({
      liveStream,
      comments,
    });
  } catch (error) {
    console.error('Đã xảy ra lỗi:', error);
    res.status(500).json({ error: error.message });
  }
});

// Khởi động server và lắng nghe cổng
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});



// const { WebcastPushConnection } = require('tiktok-live-connector');
// const http = require('http');
// const firebase = require('firebase');
// const moment = require('moment-timezone');
// const axios = require('axios');

// // TikTok accounts to monitor
// const usernames = ['ngancuong1983', 'vandiy223']; // Add more usernames if needed

// // Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyDXXOikQd3P1qxodkApktjN-GznKHxMqbs",
//   authDomain: "gomsuyenvan.firebaseapp.com",
//   databaseURL: "https://gomsuyenvan-default-rtdb.firebaseio.com",
//   projectId: "gomsuyenvan",
//   storageBucket: "gomsuyenvan.appspot.com",
//   messagingSenderId: "265332355511",
//   appId: "1:265332355511:web:770a66afd2a81101afb832",
//   measurementId: "G-6V4Y3X0WYT"
// };

// // Initialize Firebase
// firebase.initializeApp(firebaseConfig);
// const database = firebase.database();

// // Hàm để chuẩn hóa số điện thoại từ bình luận và loại bỏ ký tự đặc biệt
// function normalizePhoneNumber(comment) {
//   const vietnameseDigits = {
//     'một': '1', 'hai': '2', 'ba': '3', 'bốn': '4', 'năm': '5',
//     'sáu': '6', 'bảy': '7', 'tám': '8', 'chín': '9', 'không': '0'
//   };

//   // Chuyển đổi các từ tiếng Việt thành số
//   Object.keys(vietnameseDigits).forEach(word => {
//     const regex = new RegExp(word, 'gi');
//     comment = comment.replace(regex, vietnameseDigits[word]);
//   });

//   // Loại bỏ các ký tự đặc biệt, chỉ giữ lại chữ số
//   comment = comment.replace(/[^0-9]/g, '');

//   // Nếu có dấu +84 thì chuyển thành 0
//   if (comment.startsWith('84')) {
//     comment = '0' + comment.slice(2);
//   } else if (!comment.startsWith('0')) {
//     // Nếu số điện thoại không bắt đầu bằng 0, thêm 0 vào đầu
//     comment = '0' + comment;
//   }

//   // Nếu có số và độ dài hợp lệ, trả về số điện thoại
//   const phoneRegex = /(\d{9,11})/;
//   const match = comment.match(phoneRegex);
//   return match ? match[1] : null;
// }

// // Hàm định dạng thời gian
// function formatTimestamp(timestamp) {
//   return moment(timestamp).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');
// }
// function formatTime(timestamp) {
//   return moment(timestamp).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm');
// }

// // Create HTTP server
// const server = http.createServer((req, res) => {
//   res.statusCode = 200;
//   res.setHeader('Content-Type', 'text/plain');
//   res.end('TikTok Live Connector is running\n');
// });

// // Port để chạy server
// const PORT = process.env.PORT || 3000;
// server.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}/`);

//   usernames.forEach(username => {
//     let tiktokConnection = null;
//     let roomId = "";
//     let lastCommentTime = null; // Lưu thời gian bình luận cuối cùng

//     // Hàm để kết nối lại nếu bị ngắt kết nối
//     const connectToTikTok = () => {
//       tiktokConnection = new WebcastPushConnection(username);

//       tiktokConnection.connect().then(state => {
//         roomId = state.roomId;

//         // Check room user (if live)
//         tiktokConnection.on('roomUser', data => {
//           if (data.viewerCount > 0) {
//             const roomRef = database.ref(`Tiktok/${username}/${roomId}`);
//             roomRef.once('value', snapshot => {
//               if (!snapshot.exists()) {
//                 const liveStartTime = formatTime(Date.now());
//                 roomRef.set({
//                   TimeStart: liveStartTime
//                 }).then(() => {
//                   console.log(`Room ID and TimeStart saved to Firebase for room: ${roomId}`);
//                 }).catch(err => {
//                   console.error('Failed to save roomId and TimeStart to Firebase:', err);
//                 });
//               }
//             });
//           } else {
//             console.log(`Room ID ${roomId} has no viewers.`);
//           }
//         });

//         // Listen for chat (comments)
//         tiktokConnection.on('chat', data => {
//           const comment = data.comment;
//           const phoneNumber = normalizePhoneNumber(comment);

//           const currentTimestamp = Date.now();
          
//           // Chỉ lưu bình luận mới nếu bình luận đến sau thời điểm ngắt kết nối
//           if (!lastCommentTime || currentTimestamp > lastCommentTime) {
//             if (roomId) {
//               database.ref(`Tiktok/${username}/${roomId}/Comments`).push({
//                 nickname: data.nickname,
//                 uniqueId: data.uniqueId,
//                 comment: comment,
//                 image: data.profilePictureUrl,
//                 timestamp: formatTimestamp(currentTimestamp)
//               }).catch(err => {
//                 console.error('Failed to push comment to Firebase:', err);
//               });
//             } else {
//               console.error('Room ID not set before saving comment.');
//             }
//           }

//           if (phoneNumber) {
//             console.log(`Phone number detected: ${phoneNumber}`);

//             database.ref(`KhachHang`).orderByChild('SDTKhachHang').equalTo(phoneNumber).once('value', snapshot => {
//               if (snapshot.exists()) {
//                 const customerKey = Object.keys(snapshot.val())[0];
//                 const existingCustomer = snapshot.val()[customerKey];

//                 if (existingCustomer.TenKhachHang !== data.nickname) {
//                   database.ref(`KhachHang/${customerKey}`).update({
//                     TenKhachHang: data.nickname,
//                     UniqueId: data.uniqueId,
//                     Image: data.profilePictureUrl,
//                   }).then(() => {
//                     console.log('Updated customer name:', data.nickname);
//                   }).catch(err => {
//                     console.error('Failed to update customer name:', err);
//                   });
//                 }
//               } else {
//                 const customerData = {
//                   SDTKhachHang: phoneNumber,
//                   TenKhachHang: data.nickname,
//                   UniqueId: data.uniqueId,
//                   Image: data.profilePictureUrl,
//                   MangXaHoi: "Tiktok",
//                   DiaChi: '',
//                   Phuong_Xa: '',
//                   Quan_Huyen: '',
//                   Tinh_ThanhPho: ''
//                 };

//                 database.ref(`KhachHang`).push(customerData).then(() => {
//                   console.log('Customer data added to Firebase:', customerData);
//                 }).catch(err => {
//                   console.error('Failed to add customer to Firebase:', err);
//                 });
//               }
//             });
//           } else {
//             console.log(`No phone number found in comment: ${data.nickname} - ${comment}`);
//           }

//           lastCommentTime = currentTimestamp;
//         });

//         // Handle stream end event
//         tiktokConnection.on('streamEnd', actionId => {
//           console.log(`Stream end event received with actionId: ${actionId}`);
//           if (roomId) {
//             const liveEndTime = formatTime(Date.now());
//             database.ref(`Tiktok/${username}/${roomId}`).update({
//               TimeEnd: liveEndTime,
//             }).catch(err => {
//               console.error('Failed to update TimeEnd to Firebase:', err);
//             });

//             // Scale down Heroku dyno
//             axios.patch('https://api.heroku.com/apps/gomnhatyenvan/formation', 
//               {
//                 updates: [
//                   {
//                     quantity: 0,
//                     type: 'web'
//                   }
//                 ]
//               }, 
//               {
//                 headers: {
//                   'Content-Type': 'application/json',
//                   'Accept': 'application/vnd.heroku+json; version=3',
//                   'Authorization': 'Bearer HRKU-9af2dadf-3bf6-4cab-ab80-e942a5991320'
//                 }
//               })
//               .then(response => {
//                 console.log('Heroku app scaled down successfully:', response.data);
//               })
//               .catch(error => {
//                 console.error('Failed to scale down Heroku app:', error);
//               });
//           }
//         });

//         // Handle disconnection and reconnect
//         tiktokConnection.on('disconnected', reason => {
//           console.log('Disconnected:', reason);
//           setTimeout(connectToTikTok, 1500);
//         });
//       }).catch(err => {
//         console.error('Failed to connect:', err);
//       });
//     };

//     // Start TikTok connection
//     connectToTikTok();
//   });
// });
