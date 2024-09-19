const { WebcastPushConnection } = require('tiktok-live-connector');
const http = require('http');
const firebase = require('firebase');
const moment = require('moment');

// TikTok accounts to monitor
const usernames = ['ngancuong1983', 'cuongrau04092011']; // Add more usernames if needed

const firebaseConfig = {
  apiKey: "AIzaSyDXXOikQd3P1qxodkApktjN-GznKHxMqbs",
  authDomain: "gomsuyenvan.firebaseapp.com",
  databaseURL: "https://gomsuyenvan-default-rtdb.firebaseio.com",
  projectId: "gomsuyenvan",
  storageBucket: "gomsuyenvan.appspot.com",
  messagingSenderId: "265332355511",
  appId: "1:265332355511:web:770a66afd2a81101afb832",
  measurementId: "G-6V4Y3X0WYT"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Hàm để chuẩn hóa số điện thoại từ bình luận và loại bỏ ký tự đặc biệt
function normalizePhoneNumber(comment) {
  const vietnameseDigits = {
    'một': '1', 'hai': '2', 'ba': '3', 'bốn': '4', 'năm': '5',
    'sáu': '6', 'bảy': '7', 'tám': '8', 'chín': '9', 'không': '0'
  };

  // Chuyển đổi các từ tiếng Việt thành số
  Object.keys(vietnameseDigits).forEach(word => {
    const regex = new RegExp(word, 'gi');
    comment = comment.replace(regex, vietnameseDigits[word]);
  });

  // Loại bỏ các ký tự đặc biệt, chỉ giữ lại chữ số
  comment = comment.replace(/[^0-9]/g, '');

  // Nếu có dấu +84 thì chuyển thành 0
  if (comment.startsWith('84')) {
    comment = '0' + comment.slice(2);
  } else if (!comment.startsWith('0')) {
    // Nếu số điện thoại không bắt đầu bằng 0, thêm 0 vào đầu
    comment = '0' + comment;
  }

  // Nếu có số và độ dài hợp lệ, trả về số điện thoại
  const phoneRegex = /(\d{9,11})/;
  const match = comment.match(phoneRegex);
  return match ? match[1] : null;
}

// Format timestamp
function formatTimestamp(timestamp) {
  return moment(timestamp).format('YYYY-MM-DD HH:mm:ss');
}
function formatTime(timestamp) {
  return moment(timestamp).format('YYYY-MM-DD HH:mm');
}

// Create HTTP server
const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('TikTok Live Connector is running\n');
});

// Listen on port 3000
server.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
  let sharedLiveStartTime = null;
  let sharedRoomId = null;
  usernames.forEach(username => {
    let tiktokConnection = null;
    let liveStartTime = "";
    let roomId = "";
    let hasComments = false;
    let lastCommentTime = null; // Lưu thời gian bình luận cuối cùng
    
    // Hàm để kết nối lại nếu bị ngắt kết nối
    const connectToTikTok = () => {
      tiktokConnection = new WebcastPushConnection(username);

      tiktokConnection.connect().then(state => {
        console.log(`Connected to ${state.roomId}'s live`);
        roomId = state.roomId;


        const liveConnectRef = database.ref(`LiveConnect`);

        // Nếu sharedLiveStartTime đã có giá trị (tức là ngancuong đã check xong), thì sử dụng giá trị đó
        if (sharedLiveStartTime && sharedRoomId === roomId) {
          liveStartTime = sharedLiveStartTime;
          console.log(`Using shared liveStartTime: ${liveStartTime} for ${username}`);
        } else {
          // Nếu chưa có sharedLiveStartTime, thực hiện kiểm tra
          liveConnectRef.once('value', snapshot => {
            const liveConnectData = snapshot.val() || {};
            let foundMatchingTimeKey = null;

            // Kiểm tra từng mục thời gian của LiveConnect
            Object.keys(liveConnectData).forEach(timeKey => {
              const timeEntry = liveConnectData[timeKey];

              // Kiểm tra nếu tài khoản và roomId đã tồn tại
              Object.keys(timeEntry).forEach(account => {
                if (timeEntry[account] === roomId) {
                  foundMatchingTimeKey = timeKey;
                }
              });
            });

            if (foundMatchingTimeKey) {
              // Nếu tìm thấy roomId trùng, set liveStartTime thành key của entry đó
              liveStartTime = foundMatchingTimeKey;
              console.log(`Found matching roomId for ${username} at ${foundMatchingTimeKey}.`);
            
              // Lưu lại giá trị cho lần sau
              sharedLiveStartTime = liveStartTime;
              sharedRoomId = roomId;
              
              // Thoát khỏi hàm hoặc dừng logic
              return;  // Dừng lại không thực hiện khối else nữa
            } else {
              // Nếu không tìm thấy roomId trùng, tạo thời gian mới từ state.create_time
              liveStartTime = formatTime(state.create_time);
            
              // Lưu giá trị cho lần sau
              sharedLiveStartTime = liveStartTime;
              sharedRoomId = roomId;
            }

            // Sau khi kiểm tra xong, chờ 2 giây rồi thêm hoặc cập nhật vào Firebase
            setTimeout(() => {
              if (foundMatchingTimeKey) {
                // Nếu đã tìm thấy roomId trùng, chỉ cập nhật thêm tài khoản mới
                const updateData = {};
                updateData[username] = roomId;

                database.ref(`LiveConnect/${foundMatchingTimeKey}`).update(updateData)
                  .then(() => {
                    console.log(`Updated ${username} in existing entry at ${foundMatchingTimeKey}.`);
                  })
                  .catch(err => {
                    console.error('Failed to update existing LiveConnect entry:', err);
                  });
              } else {
                // Nếu không tìm thấy, tạo entry mới với liveStartTime
                const newEntryData = {};
                newEntryData[username] = roomId;

                liveConnectRef.child(sharedLiveStartTime).update(newEntryData)
                  .then(() => {
                    console.log(`Saved new roomId for ${username} at ${liveStartTime} to Firebase.`);
                  })
                  .catch(err => {
                    console.error('Failed to save new LiveConnect entry:', err);
                  });
              }
            }, 1000); // Chờ 2 giây trước khi thêm vào Firebase
          });
        }

        const roomRef = database.ref(`Tiktok/${username}/${roomId}`);
        roomRef.once('value', snapshot => {
          if (snapshot.exists()) {
            console.log(`Room ID ${roomId} already exists. Skipping setting TimeStart.`);
          } else {
            roomRef.set({
              TimeStart: liveStartTime
            }).then(() => {
              console.log(`Room ID and TimeStart saved to Firebase for room: ${roomId}`);
            }).catch(err => {
              console.error('Failed to save roomId and TimeStart to Firebase:', err);
            });
          }
        });
      }).catch(err => {
        console.error('Failed to connect:', err);
      });

      tiktokConnection.on('chat', data => {
        const comment = data.comment;
        const phoneNumber = normalizePhoneNumber(comment);
        hasComments = true;

        const currentTimestamp = Date.now();
        
        // Chỉ lưu bình luận mới nếu bình luận đến sau thời điểm ngắt kết nối
        if (!lastCommentTime || currentTimestamp > lastCommentTime) {
          if (roomId) {
            database.ref(`Tiktok/${username}/${roomId}/Comments`).push({
              nickname: data.nickname,
              uniqueId: data.uniqueId,
              comment: comment,
              image: data.profilePictureUrl,
              timestamp: formatTimestamp(currentTimestamp)
            }).catch(err => {
              console.error('Failed to push comment to Firebase:', err);
            });
          } else {
            console.error('Room ID not set before saving comment.');
          }
        }

        if (phoneNumber) {
          console.log(`Phone number detected: ${phoneNumber}`);

          database.ref(`KhachHang`).orderByChild('SDTKhachHang').equalTo(phoneNumber).once('value', snapshot => {
            if (snapshot.exists()) {
              const customerKey = Object.keys(snapshot.val())[0];
              const existingCustomer = snapshot.val()[customerKey];

              if (existingCustomer.TenKhachHang !== data.nickname) {
                database.ref(`KhachHang/${customerKey}`).update({
                  TenKhachHang: data.nickname,
                  UniqueId: data.uniqueId,
                  Image: data.profilePictureUrl,
                }).then(() => {
                  console.log('Updated customer name:', data.nickname);
                }).catch(err => {
                  console.error('Failed to update customer name:', err);
                });
              }
            } else {
              const customerData = {
                SDTKhachHang: phoneNumber,
                TenKhachHang: data.nickname,
                UniqueId: data.uniqueId,
                Image: data.profilePictureUrl,
                MangXaHoi: "Tiktok",
                DiaChi: '',
                Phuong_Xa: '',
                Quan_Huyen: '',
                Tinh_ThanhPho: ''
              };

              database.ref(`KhachHang`).push(customerData).then(() => {
                console.log('Customer data added to Firebase:', customerData);
              }).catch(err => {
                console.error('Failed to add customer to Firebase:', err);
              });
            }
          });
        } else {
          console.log(`No phone number found in comment: ${data.nickname} - ${comment}`);
        }

        lastCommentTime = currentTimestamp; // Cập nhật thời gian bình luận cuối cùng
      });

      tiktokConnection.on('streamEnd', actionId => {
        console.log(`Stream end event received with actionId: ${actionId}`);
        if (hasComments) {
          if (roomId) {
            const liveEndTime = formatTime(Date.now());
            database.ref(`Tiktok/${username}/${roomId}`).update({
              TimeStart: liveStartTime,
              TimeEnd: liveEndTime,
            }).catch(err => {
              console.error('Failed to update TimeStart or TimeEnd to Firebase:', err);
            });
          }
        }
      });

      tiktokConnection.on('disconnected', reason => {
        console.log('Disconnected:', reason);
        // Retry connection after 1.5 seconds
        setTimeout(connectToTikTok, 1500);
      });
    };

    // Bắt đầu kết nối tới TikTok
    connectToTikTok();
  });
});



// tiktokConnection.connect().then(state => {
//   console.info(`Connected to ${username}'s live`);

//   const liveStartTime = formatTimestamp(state.create_time);

//   let hasComments = false;
//   tiktokConnection.on('chat', data => {
//     const comment = data.comment;
//     const phoneNumber = normalizePhoneNumber(comment);

//     hasComments = true;

//     // Save comment under username in Firebase
//     database.ref(`Tiktok/${username}/${state.roomId}/Comments`).push({
//       nickname: data.nickname,
//       uniqueId: data.uniqueId,
//       comment: comment,
//       timestamp: formatTimestamp(Date.now())
//     }).catch(err => {
//       console.error('Failed to push comment to Firebase:', err);
//     });

//     if (phoneNumber) {
//       console.log(`Phone number detected: ${phoneNumber}`);

//       // Check if phone number exists in Firebase
//       database.ref(`KhachHang`).orderByChild('SDTKhachHang').equalTo(phoneNumber).once('value', snapshot => {
//         if (snapshot.exists()) {
//           const customerKey = Object.keys(snapshot.val())[0];
//           const existingCustomer = snapshot.val()[customerKey];

//           if (existingCustomer.TenKhachHang !== data.nickname) {
//             database.ref(`KhachHang/${customerKey}`).update({
//               TenKhachHang: data.nickname,
//               UniqueId: data.uniqueId,
//               Image: data.profilePictureUrl,
//             }).then(() => {
//               console.log('Updated customer name:', data.nickname);
//             }).catch(err => {
//               console.error('Failed to update customer name:', err);
//             });
//           }
//         } else {
//           const customerData = {
//             SDTKhachHang: phoneNumber,
//             TenKhachHang: data.nickname,
//             UniqueId: data.uniqueId,
//             Image: data.profilePictureUrl,
//             MangXaHoi: "Tiktok",
//             DiaChi: '',
//             Phuong_Xa: '',
//             Quan_Huyen: '',
//             Tinh_ThanhPho: ''
//           };

//           database.ref(`KhachHang`).push(customerData).then(() => {
//             console.log('Customer data added to Firebase:', customerData);
//           }).catch(err => {
//             console.error('Failed to add customer to Firebase:', err);
//           });
//         }
//       });
//     } else {
//       console.log(`No phone number found in comment: ${data.nickname} - ${comment}`);
//     }
//   });
//   // Handle stream end event
//   tiktokConnection.on('streamEnd', actionId => {
//     console.log(`Stream end event received with actionId: ${actionId}`);

//     if (actionId === 3) {
//       console.log(`${username} stream ended by user`);
//       if (hasComments) {
//         const liveEndTime = formatTimestamp(Date.now());
//         database.ref(`Tiktok/${username}/${state.roomId}`).update({
//           TimeStart: liveStartTime,
//           TimeEnd: liveEndTime,
//         }).catch(err => {
//           console.error('Failed to update TimeStart or TimeEnd to Firebase:', err);
//         });
//       }
//     } else if (actionId === 4) {
//       console.log(`${username} stream ended by platform moderator (ban)`);
//     } else {
//       console.log(`Stream ended with unknown actionId: ${actionId}`);
//     }
//   });

// }).catch(err => {
//   console.error(`Failed to connect to ${username}`, err);
// });


// const { WebcastPushConnection } = require('tiktok-live-connector');
// const http = require('http');
// const cron = require('node-cron');
// const firebase = require('firebase');
// const moment = require('moment');
// // Cấu hình Firebase từ Firebase Console
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

// // Khởi tạo Firebase
// firebase.initializeApp(firebaseConfig);

// // Tham chiếu tới Realtime Database
// const database = firebase.database();

// // TikTok username cần theo dõi live stream
// const username = 'ngancuong1983';

// // Tạo một kết nối mới với TikTok Live
// const tiktokConnection = new WebcastPushConnection(username);

// // Tạo một HTTP server đơn giản
// const server = http.createServer((req, res) => {
//   res.statusCode = 200;
//   res.setHeader('Content-Type', 'text/plain');
//   res.end('TikTok Live Connector is running\n');
// });
// function formatTimestamp(timestamp) {
//   return moment(timestamp).format('YYYY-MM-DD HH:mm:ss');
// }
// // Server lắng nghe trên cổng 3000
// server.listen(3000, () => {
//   console.log('Server đang chạy tại http://localhost:3000/');

//   // Đặt lịch cron job kiểm tra mỗi 1 phút
//   cron.schedule('*/1 * * * *', () => {
//     console.log('Checking if the user is live...');

//     // Kết nối với live stream TikTok
//     tiktokConnection.connect().then(state => {
//       console.info(`Connected to ${state.roomId}'s live`);

//       // Lưu thời gian bắt đầu live (khi kết nối thành công)
//       const liveStartTime = Date.now();

//       // Lắng nghe tin nhắn từ live stream TikTok
//       let hasComments = false;
//       tiktokConnection.on('chat', data => {
//         console.log(`User nickname: ${data.nickname}, UserId: ${data.userId}, Commented: ${data.comment}`);
//         hasComments = true;

//         // Lưu thông tin bình luận vào Firebase
//         database.ref(`Tiktok/${state.roomId}/Comments`).push({
//           nickname: data.nickname,
//           userId: data.userId,
//           comment: data.comment,
//           timestamp: formatTimestamp(Date.now())
//         }).catch(err => {
//           console.error('Failed to push comment to Firebase:', err);
//         });
//       });

//       // Lắng nghe sự kiện kết thúc live
//       tiktokConnection.on('disconnect', () => {
//         console.log('Live stream has ended.');

//         if (hasComments) {
//           // Cập nhật thời gian bắt đầu và kết thúc live vào Firebase nếu có bình luận
//           const liveEndTime = Date.now();
//           database.ref(`Tiktok/${state.roomId}`).update({
//             TimeStart: formatTimestamp(liveStartTime),
//             TimeEnd: formatTimestamp(liveEndTime)
//           }).catch(err => {
//             console.error('Failed to update TimeStart or TimeEnd to Firebase:', err);
//           });
//         } else {
//           // Nếu không có bình luận, xóa dữ liệu phòng khỏi Firebase
//           database.ref(`Tiktok/${state.roomId}`).remove().catch(err => {
//             console.error('Failed to remove roomId from Firebase:', err);
//           });
//         }
//       });

//     }).catch(err => {
//       console.error('Failed to connect', err);
//     });
//   });
// });

