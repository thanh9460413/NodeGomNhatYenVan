import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import LiveDetail from './LiveDetail'; // Nhập LiveDetail
import Ionicons from '@expo/vector-icons/Ionicons';
import { FIREBASE_APP } from '../../FirebaseConfig';
import { getDatabase, ref, onValue } from 'firebase/database';

const Stack = createStackNavigator();

const LiveConnect = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="LiveMain" component={LiveMain} options={{ headerShown: false }} />
      <Stack.Screen name="LiveDetail" component={LiveDetail} options={({ navigation }) => ({
        headerShown: true,
        headerTitleAlign: 'center',
      })} />
    </Stack.Navigator>
  );
};

const LiveMain = ({ navigation }) => {
  const database = getDatabase(FIREBASE_APP);
  const [dataTiktok, setTiktok] = useState([]);

  useEffect(() => {
    const tikTokRef = ref(database, 'Tiktok');

    const unsubscribeTiktok = onValue(tikTokRef, (snapshot) => {
      const tiktokData = snapshot.val();
      if (tiktokData) {
        setTiktok(tiktokData);
      }
    });

    return () => {
      unsubscribeTiktok();
    };
  }, []);

  const handleRefresh = async () => {
    try {
      // Gọi API để bật ứng dụng Heroku
      const response = await fetch('https://api.heroku.com/apps/gomnhatyenvan/formation', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.heroku+json; version=3',
          'Authorization': 'Bearer HRKU-9af2dadf-3bf6-4cab-ab80-e942a5991320' // Thay token thật vào đây
        },
        body: JSON.stringify({
          updates: [
            {
              quantity: 1, // Đặt số lượng web dyno thành 1 để bật ứng dụng
              type: 'web'
            }
          ]
        })
      });

      const data = await response.json();
      console.log('API Response:', data); // Log phản hồi API để kiểm tra
    } catch (error) {
      console.error('Error starting Heroku app:', error);
    }
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

  const renderLiveDetails = () => {
    const userKeys = Object.keys(dataTiktok);
  
    // Collect all rooms and sort them by TimeStart
    const allRooms = [];
  
    userKeys.forEach(user => {
      const roomIds = Object.keys(dataTiktok[user]);
  
      roomIds.forEach(roomId => {
        const roomData = dataTiktok[user][roomId];
        allRooms.push({ user, roomId, ...roomData });
      });
    });
  
    // Sort by TimeStart in descending order (latest TimeStart first)
    allRooms.sort((a, b) => {
      const timeA = new Date(a.TimeStart);
      const timeB = new Date(b.TimeStart);
      return timeB - timeA;
    });
  
    // Render sorted rooms
    return allRooms.map(({ user, roomId, TimeStart, TimeEnd }) => {
      const hasTimeEnded = TimeEnd !== undefined;
  
      return (
        <TouchableOpacity
          onPress={() => navigation.navigate('LiveDetail', { roomIds: [[user, roomId]], key: user })}
          key={roomId}
        >
          <View style={styles.liveDetail}>
            <View style={styles.imageContainer}>
              <View style={styles.imageWrapper}>
                <Ionicons name="play" size={25} color="white" />
              </View>
              <View style={styles.liveTagContainer}>
                {hasTimeEnded ? (
                  <Ionicons name="videocam-outline" size={20} color="white" />
                ) : (
                  <>
                    <Ionicons name="caret-forward-outline" size={20} color="white" />
                    <Text style={styles.liveTagText}>Trực tiếp</Text>
                  </>
                )}
              </View>
            </View>
            <View style={styles.liveDetails}>
              <Text style={[styles.liveStatus, hasTimeEnded ? styles.statusEnded : {}]}>
                {hasTimeEnded ? "Đã phát trực tiếp" : "Đang phát trực tiếp"}
              </Text>
              <Text style={styles.username}>{user} live</Text>
              <Text style={styles.date}>
                {`${TimeStart} (${calculateLiveDuration(TimeStart)})`} {/* Use TimeStart for calculating live duration */}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    });
  };
  

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={25} color="black" style={styles.searchIcon} />
          <TextInput
            placeholder="Tìm kiếm"
            style={styles.searchInput}
          />
        </View>
        <View style={styles.iconContainer}>
          <TouchableOpacity onPress={handleRefresh}>
            <Ionicons name="refresh" size={25} color="black" style={styles.icon} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.liveInfo}>
        <ScrollView>
          {renderLiveDetails()}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    fontWeight: 'bold',
    marginLeft: 20,
    marginRight: 20,
    marginTop: 50,
    paddingBottom: 200,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#E8E8E8',
    borderRadius: 20,
    paddingLeft: 10,
  },
  searchInput: {
    flex: 1,
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  searchIcon: {
    marginRight: 10,
  },
  iconContainer: {
    flexDirection: 'row',
  },
  icon: {
    marginLeft: 10,
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#E8E8E8',
  },
  liveInfo: {},
  liveDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  imageContainer: {
    position: 'relative',
  },
  imageWrapper: {
    backgroundColor: 'lightgray',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: 80,
    marginRight: 10,
  },
  liveTagContainer: {
    position: 'absolute',
    top: 5,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: 5,
    borderRadius: 10,
  },
  liveTagText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 0,
  },
  liveStatus: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'red',
  },
  statusEnded: {
    color: 'black',
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  date: {
    color: 'gray',
  },
});

export default LiveConnect;
