import React, { useEffect, useState } from 'react';
import { Alert, Animated, StyleSheet, TouchableOpacity, View, Keyboard, Text } from 'react-native';
import { CurvedBottomBarExpo } from 'react-native-curved-bottom-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import PhieuTinhTien from './screens/PhieuTinhTien';
import PhieuVanChuyen from './screens/PhieuVanChuyen';
import LiveConnect from './screens/LiveConnect'
import InDon from './screens/InDon'
import { FIREBASE_APP } from '../FirebaseConfig';
import { getDatabase, ref, onValue, push, get, set, query, orderByChild, equalTo, remove } from 'firebase/database';
export default function App() {
  const [bottomBarBottom, setBottomBarBottom] = useState(0);
  const database = getDatabase(FIREBASE_APP);
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setBottomBarBottom(-100); // Điều chỉnh giá trị này để ẩn bottom bar
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setBottomBarBottom(0); // Điều chỉnh giá trị này để hiển thị bottom bar
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const _renderIcon = (routeName, selectedTab) => {
    let icon = '';
    let text = '';
    switch (routeName) {
      case '  Hóa đơn':
        icon = 'albums-outline';
        text = 'Hóa đơn'; // Sửa dòng này
        break;
      case '  Vận chuyển':
        icon = 'car-outline';
        text = 'Vận chuyển';
        break;
      case '  In Đơn':
          icon = 'basket-outline';
          text = 'Đơn hàng';
        break;
      case '  Live':
          icon = 'radio-outline';
          text = 'Live';
        break;
    }

    return (
      <View style={{ alignItems: 'center' }}>
        <Ionicons name={icon} size={25} color={routeName === selectedTab ? 'black' : 'gray'} />
        <Text style={{ color: routeName === selectedTab ? 'black' : 'gray' }}>{text}</Text>
      </View>
    );
  };

  const renderTabBar = ({ routeName, selectedTab, navigate }) => {
    return (
      <TouchableOpacity
        onPress={() => navigate(routeName)}
        style={[styles.tabbarItem, { bottom: bottomBarBottom }]}
      >
        {_renderIcon(routeName, selectedTab)}
      </TouchableOpacity>
    );
  };
  const handleDeleteAll = () => {
    Alert.alert(
      "Xác nhận xóa",
      "Xóa tất cả món hàng",
      [
        {
          text: "Hủy",
          onPress: () => console.log("Xóa bị hủy"),
          style: "cancel"
        },
        {
          text: "Xóa",
          onPress: () => {
            const tableDataRef = ref(database, 'Temp');
            remove(tableDataRef)
              .then(() => {
                console.log("All items removed successfully.");
                // Cập nhật lại state hoặc thực hiện các hành động khác nếu cần
              })
              .catch((error) => {
                console.error("Error removing documents: ", error);
              });
          }
        }
      ]
    );
  };
  return (
    <View style={styles.container}>
      <CurvedBottomBarExpo.Navigator
        type="DOWN"
        style={[styles.bottomBar, { bottom: bottomBarBottom }]}
        shadowStyle={styles.shawdow}
        screenOptions={{headerShown:false}}
        height={55}
        circleWidth={50}
        bgColor="white"
        initialRouteName="  Hóa đơn"
        borderTopLeftRight
        renderCircle={({ selectedTab, navigate }) => (
          <Animated.View style={styles.btnCircleUp}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleDeleteAll}
            >
              <Ionicons name={'apps-sharp'} color="gray" size={25} />
            </TouchableOpacity>
          </Animated.View>
        )}
        tabBar={renderTabBar}
      >
        <CurvedBottomBarExpo.Screen
          name="  Hóa đơn"
          position="LEFT"
          component={PhieuTinhTien}
        />
        <CurvedBottomBarExpo.Screen
          name="  Vận chuyển"
          component={PhieuVanChuyen}
          position="LEFT"
        />
        <CurvedBottomBarExpo.Screen
          name="  Live"
          component={LiveConnect}
          position="RIGHT"
        />
        <CurvedBottomBarExpo.Screen
          name="  In Đơn"
          position="RIGHT"
          component={InDon}
        />
      </CurvedBottomBarExpo.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  shawdow: {
    shadowColor: '#DDDDDD',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 1,
    shadowRadius: 5,
  },
  button: {
    flex: 1,
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 30,
  },
  btnCircleUp: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8E8E8',
    bottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 1,
  },
  imgCircle: {
    width: 30,
    height: 30,
    tintColor: 'gray',
  },
  tabbarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  img: {
    width: 30,
    height: 30,
  },
  screen1: {
    flex: 1,
    backgroundColor: '#BFEFFF',
  },
  screen2: {
    flex: 1,
    backgroundColor: '#FFEBCD',
  },
});
