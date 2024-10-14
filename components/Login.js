import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, StyleProp, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { TextInput, Button, Checkbox, Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { FIREBASE_AUTH } from '../FirebaseConfig';
import { IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons'; // Import thư viện biểu tượng (đảm bảo bạn đã cài đặt nó)
const theme = {
  ...DefaultTheme,
  roundness: 2,
  colors: {
    ...DefaultTheme.colors,
    primary: '#007AFF', // Thay đổi màu primary theo ý muốn
  },
};

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false); // Thêm trạng thái passwordVisible
  const auth = FIREBASE_AUTH;
  const navigation = useNavigation();

  const checkLoginInfo = async () => {
    const savedEmail = await AsyncStorage.getItem('email');
    const savedPassword = await AsyncStorage.getItem('password');

    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberPassword(true);
      navigation.navigate('Home');
    }
  };

  useEffect(() => {
    checkLoginInfo();
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await signInWithEmailAndPassword(auth, email, password);

      navigation.navigate('Home');

      if (rememberPassword) {
        await AsyncStorage.setItem('email', email);
        await AsyncStorage.setItem('password', password);
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Vui lòng nhập thông tin đăng nhập hợp lệ');
    } finally {
      setLoading(false);
    }
  };
  return (
    <PaperProvider theme={theme}>
      <View style={styles.container}>
        <View style={styles.avatar}>
          <Image
            source={require('../assets/YẾN-VÂN-logos.png')} // Đường dẫn đến tệp tin hình ảnh trong thư mục asset
            style={styles.avatarImage} // Phong cách cho hình ảnh avatar
          />
        </View>
        <Text style={styles.title}>Đăng nhập</Text>
        <View style={styles.form}>
          <TextInput
            label="Email"
            placeholder="Email"
            mode="outlined"
            value={email}
            onChangeText={text => setEmail(text)}

          />
          <View>
            <TextInput
              label="Mật khẩu"
              placeholder="Mật khẩu"
              mode="outlined"
              style={styles.input}
              secureTextEntry={!passwordVisible}
              value={password}
              onChangeText={(text) => setPassword(text)}
            />
            <TouchableOpacity
              onPress={() => setPasswordVisible(!passwordVisible)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={passwordVisible ? 'eye-off' : 'eye'}
                size={24} // Màu cho biểu tượng con mắt
              />
            </TouchableOpacity>
          </View>

          <View style={styles.checkbox}>
            <Checkbox.Android
              status={rememberPassword ? 'checked' : 'unchecked'}
              onPress={() => setRememberPassword(!rememberPassword)}
            />
            <Text>Nhớ mật khẩu</Text>
          </View>
          {loading ? (
            <ActivityIndicator style={styles.customLoading} size="large" color="#0000ff" />
          ) : (
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.button}
            >
              Đăng nhập
            </Button>
          )}
        </View>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    // Phong cách cho Avatar
  },
  title: {
    fontSize: 20,
    marginTop: 10,
  },
  form: {
    width: '80%',
    marginTop: 20,
  },
  input: {
    marginTop: 15,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5
  },
  button: {
    marginTop: 5,
  },
  customLoading: {
    marginTop: 15,
  },
  eyeIcon: {
    position: 'absolute',
    right: 20, // Điều chỉnh vị trí của biểu tượng con mắt
    top: 35, // Điều chỉnh vị trí của biểu tượng con mắt
  },
  avatarImage: {
    width: 100, // Độ rộng của hình ảnh avatar
    height: 100, // Độ cao của hình ảnh avatar
    borderRadius: 50, // Độ cong của hình ảnh để tạo hình ảnh tròn
  }
});
