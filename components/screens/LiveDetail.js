import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { getDatabase, ref, onValue, get, update } from 'firebase/database';
import { FIREBASE_APP } from '../../FirebaseConfig';
import { NetPrinter } from '@nhaanh/react-native-thermal-receipt-printer-image-qr';
import { captureRef } from 'react-native-view-shot';
import { getStorage, ref as storageRef, listAll, getDownloadURL, uploadBytesResumable, deleteObject } from "firebase/storage";

const LiveDetail = ({ route, navigation }) => {
  const { roomIds } = route.params;
  const { key } = route.params;
  const [comments, setComments] = useState([]);
  const [dataPrint, setDataPrint] = useState([]);
  const [dataDiys, setDataDiys] = useState([]);
  const [currentComment, setCurrentComment] = useState({});
  const [customerPhones, setCustomerPhones] = useState({}); // Store customer phone numbers
  const printViewRef = useRef();
  const [Phone, setPhone] = useState(); // Store customer phone numbers
  const [printingStatus, setPrintingStatus] = useState({});
  const [displayName, setDisplayName] = useState('');
  useEffect(() => {
    setDisplayName(usernameDisplayNames(currentComment.username)); // Cập nhật displayName khi currentComment.username thay đổi
  }, [currentComment.username]);
  useEffect(() => {
    const database = getDatabase(FIREBASE_APP);
    const tikTokRef = ref(database, 'Tiktok');
    const printRef = ref(database, 'Print');
    const diyRef = ref(database, 'Diys')
    navigation.setOptions({ title: usernameDisplayNames(key) });

    const unsubscribeTiktok = onValue(tikTokRef, (snapshot) => {
      const tiktokData = snapshot.val();
      if (tiktokData) {
        let allComments = [];

        roomIds.forEach(([username, roomId]) => {
          const roomComments = tiktokData?.[username]?.[roomId]?.Comments;
          if (roomComments) {
            Object.keys(roomComments).forEach((commentId) => {
              const commentData = roomComments[commentId];
              allComments.push({ ...commentData, username });
            });
          }
        });

        allComments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setComments(allComments);
      }
    });

    const unsubscribePrint = onValue(printRef, (snapshot) => {
      const printData = snapshot.val();
      if (printData) {
        setDataPrint(printData);
      }
    });
    const unsubscribeDiys = onValue(diyRef, (snapshot) => {
      const printDiy = snapshot.val();
      if (printDiy) {
        setDataDiys(printDiy);
      }
    });
    return () => {
      unsubscribeTiktok();
      unsubscribePrint();
      unsubscribeDiys();
    };
  }, [roomIds]);

  useEffect(() => {
    const fetchCustomerPhones = async () => {
      const database = getDatabase(FIREBASE_APP);
      const khachHangRef = ref(database, 'KhachHang');
      const snapshot = await get(khachHangRef);

      if (snapshot.exists()) {
        const customers = snapshot.val();
        const phones = {};

        comments.forEach((comment) => {
          for (let key in customers) {
            if (customers[key].UniqueId === comment.uniqueId) {
              phones[comment.uniqueId] = customers[key].SDTKhachHang;
            }
          }
        });

        setCustomerPhones(phones);
      }
    };

    fetchCustomerPhones();
  }, [comments]);

  const deleteOldImages = async () => {
    const storage = getStorage();
    const imagesRef = storageRef(storage, 'images');
    try {
      const listResult = await listAll(imagesRef);
      const deletePromises = listResult.items.map((item) => deleteObject(item));
      await Promise.all(deletePromises);
      console.log('All old images deleted');
    } catch (error) {
      console.error('Error deleting old images:', error);
    }
  };

  const uploadNewImage = async (imageUri, nickname) => {
    if (!nickname) {
      console.error('Nickname is undefined or invalid');
      throw new Error('Nickname is required for image upload');
    }

    const storage = getStorage();
    const imageRef = storageRef(storage, `images/${nickname}_${Date.now()}.png`);
    try {
      const response = await fetch(imageUri);
      if (!response.ok) throw new Error('Failed to fetch image from URI');

      const blob = await response.blob();
      const uploadTask = uploadBytesResumable(imageRef, blob);

      const downloadUrl = await new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          null,
          (error) => {
            console.error('Upload error:', error);
            reject(error);
          },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          }
        );
      });

      if (!downloadUrl) {
        throw new Error('Failed to get download URL');
      }

      return downloadUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const ip = dataPrint.Ip;
  const port = dataPrint.Port;

  const handlePrint = async (comment, phone) => {
    if (key == 'ngancuong1983') {
      setPrintingStatus(prev => ({ ...prev, [`${comment.uniqueId}_${comment.timestamp}`]: true }));
      try {
        await NetPrinter.init();
        await NetPrinter.connectPrinter(ip, port);
        setCurrentComment(comment);
        setPhone(phone);
        await deleteOldImages();

        const imageUri = await captureRef(printViewRef, {
          format: 'png',
          quality: 0.8,
          width: 2000,
          height: 1500,
        });

        const imageUrl = await uploadNewImage(imageUri, comment.nickname);

        await NetPrinter.printImage(imageUrl, {
          imageWidth: 500,
          imageHeight: 300,
        });

        await NetPrinter.printBill(' ', { beep: false, cut: true });

      } catch (error) {
        console.error('Print error:', error);
        Alert.alert('Error', 'Failed to print: ' + error.message);
      } finally {
        setPrintingStatus(prev => ({ ...prev, [`${comment.uniqueId}_${comment.timestamp}`]: false }));
        await NetPrinter.closeConn();
      }
    } else {
      setPrintingStatus(prev => ({ ...prev, [`${comment.uniqueId}_${comment.timestamp}`]: true }));
      try {
        await NetPrinter.init();
        await NetPrinter.connectPrinter(ip, port);
        setCurrentComment(comment);
        setPhone(phone);
        await deleteOldImages();

        const imageUri = await captureRef(printViewRef, {
          format: 'png',
          quality: 0.8,
          width: 2000,
          height: 1500,
        });

        const imageUrl = await uploadNewImage(imageUri, comment.nickname);

        await NetPrinter.printImage(imageUrl, {
          imageWidth: 500,
          imageHeight: 300,
        });

        await NetPrinter.printBill(' ', { beep: false, cut: true });
        const commentKey = comment.comment.match(/\d+/g); // Extract the number part

        if (commentKey) {
          const searchKey = commentKey.join(''); // Convert to a string

          // Iterate through each Diy entry in the dataDiys object
          Object.keys(dataDiys).forEach(diyKey => {
            if (dataDiys[diyKey].key === searchKey) {
              // If the key matches, update the isCheck field to true locally
              const updatedDataDiys = {
                ...dataDiys,
                [diyKey]: { ...dataDiys[diyKey], isCheck: true }
              };
              setDataDiys(updatedDataDiys);

              // Update the isCheck field in Firebase
              const db = getDatabase();
              const updateRef = ref(db, `Diys/${diyKey}`);
              update(updateRef, { isCheck: true })
                .then(() => console.log(`Updated isCheck for key: ${searchKey} in Firebase`))
                .catch((error) => console.error('Firebase update failed: ', error));
            }
          });
        }


      } catch (error) {
        console.error('Print error:', error);
        Alert.alert('Error', 'Failed to print: ' + error.message);
      } finally {
        setPrintingStatus(prev => ({ ...prev, [`${comment.uniqueId}_${comment.timestamp}`]: false }));
        await NetPrinter.closeConn();
      }


    }
  };

  const usernameDisplayNames = (username) => {
    const displayNames = {
      ngancuong1983: 'Kinh doanh đa phương tiện',
      vandiy223: 'Vân DIY',
    };

    return displayNames[username] || username; // Return username if no display name is found
  };
  console.log(usernameDisplayNames("ngancuong1983"));
  const renderComment = (comment) => {
    const timeAgo = calculateLiveDuration(comment.timestamp);
    const uniqueId = comment.uniqueId;
    const timestamp = comment.timestamp;
    const isPrinting = printingStatus[`${uniqueId}_${timestamp}`];

    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, zIndex: 100 }}>
        <Image
          source={{ uri: comment.image }}
          style={{ width: 30, height: 30, borderRadius: 25, marginRight: 15 }}
        />
        <View
          style={{
            backgroundColor: 'white',
            padding: 10,
            borderRadius: 5,
            flex: 1,
            alignSelf: 'stretch',
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, width: '100%' }}>
            <Text style={{ color: '#0066FF', flexShrink: 1, marginRight: 10 }}>{comment.nickname}</Text>
            <Text>{timeAgo}</Text>
          </View>


          {customerPhones[comment.uniqueId] && (
            <Text style={{ marginTop: 5, fontStyle: 'italic', color: '#555' }}>
              Số điện thoại: {customerPhones[comment.uniqueId]}
            </Text>
          )}
          <Text style={{ marginTop: 5 }}>{comment.comment}</Text>



          <TouchableOpacity
            style={{
              marginTop: 10,
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 5,
              backgroundColor: '#0066FF',
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
            }}
            onPress={() => handlePrint(comment, customerPhones[comment.uniqueId])}
          >
            {isPrinting && (
              <>
                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 5 }} />
                <Text style={{ color: 'white' }}>Đang in...</Text>
              </>
            )}
            {!isPrinting && (
              <Text style={{ color: 'white' }}>Tạo đơn</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  console.log(currentComment)
  return (
    <ScrollView style={{ padding: 20 }}>
      {comments.map(renderComment)}

      <View
        ref={printViewRef}
        style={{
          backgroundColor: 'white',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: 0,
          zIndex: 1,
        }}
      >
        <Text style={{ fontSize: 30, fontWeight: 'bold' }}>{currentComment.nickname}</Text>
        <Text style={{ fontSize: 25, fontWeight: 'bold' }}>{currentComment.uniqueId}</Text>
        {Phone && (
          <Text style={{ fontSize: 25 }}>{Phone}</Text>
        )}
        <Text style={{ fontSize: 25 }}>{currentComment.timestamp}</Text>
        <Text style={{ fontSize: 18 }}>{currentComment.comment}</Text>
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{displayName}</Text>
      </View>
    </ScrollView>
  );
};

const calculateLiveDuration = (startTime) => {
  if (!startTime) return 'Không có thời gian bắt đầu';

  let formattedStartTime = startTime.includes('T') ? startTime : startTime.replace(' ', 'T');
  const startDate = new Date(formattedStartTime);

  if (isNaN(startDate.getTime())) {
    return 'Thời gian không hợp lệ';
  }

  const now = new Date();
  const diffInMs = now - startDate;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

  if (diffInMinutes < 1) {
    return 'Khoảng 1 phút trước'; // Nếu thời gian chênh lệch dưới 1 phút
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`;
  } else {
    const diffInHours = diffInMinutes / 60;
    if (diffInHours >= 24) {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} ngày trước`;
    } else {
      return `${Math.floor(diffInHours)} tiếng trước`;
    }
  }
};

export default LiveDetail;
