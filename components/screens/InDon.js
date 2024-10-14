import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TextInput, ScrollView, KeyboardAvoidingView, Platform, FlatList, TouchableOpacity, ActivityIndicator,Image } from 'react-native';
import { Tab, Button } from '@rneui/themed';
import Ionicons from '@expo/vector-icons/Ionicons';
import { TabView, Text, Card } from '@rneui/themed';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Picker } from '@react-native-picker/picker';
import { getDatabase, ref, onValue, get, set, push } from 'firebase/database';
import { FIREBASE_APP } from '../../FirebaseConfig';
import { NetPrinter } from '@nhaanh/react-native-thermal-receipt-printer-image-qr';
import { captureRef } from 'react-native-view-shot';
import { getStorage, ref as storageRef, listAll, getDownloadURL, uploadBytesResumable, deleteObject } from "firebase/storage";
import logoImage from '../../assets/vD.png'
const InDon = () => {
  const [index, setIndex] = useState(0);
  const [khachHang, setKhachHang] = useState('');
  const [tenMonHang, setTenMonHang] = useState('');
  const [soLuong, setSoLuong] = useState('');
  const [gia, setGia] = useState('');
  const [thanhToan, setThanhToan] = useState('');
  const [diys, setDiys] = useState([]);
  const database = getDatabase(FIREBASE_APP);
  const [dataPrint, setDataPrint] = useState([]);
  const [dataMonHang, setDataMonHang] = useState([]);
  const [key, setKey] = useState([]);
  const printViewRef = useRef();
  const [printingStatus, setPrintingStatus] = useState();
  const [selectedMonHang, setSelectedMonHang] = useState('');
  const [bonus, setBonus] = useState(0);
  const [monHangList, setMonHangList] = useState([]);
  useEffect(() => {
    const diyRef = ref(database, 'Diys');
    const printRef = ref(database, 'Print');
    const monHangRef = ref(database, 'MonHang');
    const unsubscribeDiy = onValue(diyRef, (snapshot) => {
      const diyData = snapshot.val();
      if (diyData) {
        // Chỉ lấy dữ liệu có isCheck là false
        const filteredData = Object.entries(diyData)
          .map(([key, value]) => ({ key, ...value }))
          .filter(item => !item.isCheck); // Lọc các mục có isCheck là false

        // Sắp xếp dữ liệu theo NgayTao và đảo ngược thứ tự
        const sortedData = filteredData
          .sort((a, b) => {
            const dateA = new Date(a.NgayTao).getTime();
            const dateB = new Date(b.NgayTao).getTime();
            return dateA - dateB; // Sắp xếp theo thứ tự tăng dần
          })
          .reverse(); // Đảo ngược thứ tự

        setDiys(sortedData);
      }
    });
    const unsubscribePrint = onValue(printRef, (snapshot) => {
      const printData = snapshot.val();
      if (printData) {
        setDataPrint(printData);
      }
    });
    const unsubscribeMonHang = onValue(monHangRef, (snapshot) => {
      const monHangData = snapshot.val();
      if (monHangData) {
        setDataMonHang(monHangData);
      }
    });
    return () => {
      unsubscribeDiy();
      unsubscribePrint();
      unsubscribeMonHang();
    };
  }, []);


  // Call the calculateBonus function whenever the selected item or soLuong changes
  const handleMonHangChange = (itemValue) => {
    setSelectedMonHang(itemValue);
    if (dataMonHang[itemValue]) {
      const selectedSoLuong = Object.keys(dataMonHang[itemValue].SoLuong)[0]; // Default select first SoLuong option
      setSoLuong(selectedSoLuong);
      setGia(dataMonHang[itemValue].SoLuong[selectedSoLuong].toString());
    }
  };

  const handleSoLuongChange = (value) => {
    setSoLuong(value);
    if (selectedMonHang && dataMonHang[selectedMonHang]?.SoLuong[value]) {
      setGia(dataMonHang[selectedMonHang].SoLuong[value].toString());
    }
  };
  const clearInput = (setter) => {
    setter('');
  };
  // Function to format the date
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const handleCreateOrder = () => {
    const diyRef = ref(database, 'Diys');
    get(diyRef).then((snapshot) => {
      let latestKey = "1"; // Đặt giá trị khởi đầu của key là "1"

      if (snapshot.exists()) {
        const data = snapshot.val();

        // Lọc ra các key hợp lệ (không phải là Firebase-generated key) và chuyển thành số
        const keys = Object.values(data)
          .filter(item => !isNaN(item.key)) // Chỉ lấy các mục có `key` là số
          .map(item => parseInt(item.key)); // Chuyển thành số để dễ tính toán

        // Tìm key lớn nhất hiện có và cộng thêm 1
        if (keys.length > 0) {
          latestKey = (Math.max(...keys) + 1).toString(); // Tính key mới là lớn nhất + 1
        }
      }

      setKey(latestKey);
      handlePrint();

      const newOrder = {
        TenKhachHang: khachHang,
        ThanhToan: thanhToan,
        isCheck: false,
        NgayTao: formatDate(Date.now()),
        key: latestKey,
        GioHang: {} // Khởi tạo GioHang là một object rỗng
      };

      // Giả sử monHangList là danh sách các món hàng hiện tại
      monHangList.forEach(item => {
        // Sử dụng push để thêm các món hàng vào GioHang với key ngẫu nhiên
        newOrder.GioHang[push(ref(database, `Diys/${latestKey}/GioHang`)).key] = {
          TenMonHang: item.TenMonHang,
          SoLuong: item.SoLuong,
          Gia: item.Gia,
        };
      });

      // Lưu đơn hàng mới vào Firebase
      push(ref(database, `Diys`), newOrder);
    });
  };

  const formatCurrency = (amount) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // Thêm dấu chấm vào vị trí phù hợp
  };
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

  const uploadNewImage = async (imageUri, key) => {
    if (!key) {
      console.error('Nickname is undefined or invalid');
      throw new Error('Nickname is required for image upload');
    }

    const storage = getStorage();
    const imageRef = storageRef(storage, `images/${key}_${Date.now()}.png`);
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
  const handlePrint = async () => {
    setPrintingStatus(true);
    try {
      await NetPrinter.init();
      await NetPrinter.connectPrinter(ip, port);
      await deleteOldImages();

      const imageUri = await captureRef(printViewRef, {
        format: 'png',
        quality: 0.8,
        width: 2000,
        height: 1500,
      });

      const imageUrl = await uploadNewImage(imageUri, key);

      await NetPrinter.printImage(imageUrl, {
        imageWidth: 500,
        imageHeight: 300,
      });

      await NetPrinter.printBill(' ', { beep: false, cut: true });

    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('Error', 'Failed to print: ' + error.message);
    } finally {
      setPrintingStatus(false);
      await NetPrinter.closeConn();
      clearInput(setKhachHang);
      clearInput(setThanhToan)
      setMonHangList([])
    }
  }
  const handleAddMonHang = () => {
    if (selectedMonHang && dataMonHang && dataMonHang[selectedMonHang]) {

      const selectedGia = dataMonHang[selectedMonHang].SoLuong[soLuong];

      const newMonHang = {
        key: `${selectedMonHang}-${Date.now()}`, // Tạo key duy nhất bằng cách kết hợp với timestamp
        TenMonHang: dataMonHang[selectedMonHang].TenMonHang,
        SoLuong: soLuong, // Lưu key số lượng
        Gia: selectedGia, // Lưu giá
      };
      setMonHangList([...monHangList, newMonHang]);
    }
  };

  const handleRemoveMonHang = (key) => {
    const updatedList = monHangList.filter(item => item.key !== key);
    setMonHangList(updatedList);
  };
  const renderOrder = ({ item }) => {
    const { key, TenKhachHang, GioHang, ThanhToan } = item;
  
    // Calculate total money of all items in GioHang
    const totalAmount = Object.values(GioHang).reduce((total, { Gia, SoLuong }) => {
      return total + (Gia * 1000);
    }, 0);
  
    return (
      <Card containerStyle={styles.card}>
        <Text style={styles.orderKey}>Đơn số: {key}</Text>
        <Text style={styles.text}><Text style={{ fontWeight: 'bold' }}>Tên Khách Hàng:</Text> {TenKhachHang}</Text>
        <Text style={styles.text}><Text style={{ fontWeight: 'bold' }}>Danh sách món hàng:</Text></Text>
        
        {Object.values(GioHang).map((monHang, index) => (
          <Text key={index} style={styles.text}>
            {`${index + 1}. ${monHang.TenMonHang} * ${monHang.SoLuong} = ${formatCurrency(monHang.Gia * 1000)}đ`}
          </Text>
        ))}
  
        <Text style={styles.text}><Text style={{ fontWeight: 'bold' }}>Tổng tiền:</Text> {formatCurrency(totalAmount)}đ</Text>
        <Text style={styles.text}><Text style={{ fontWeight: 'bold' }}>Đã Thanh Toán:</Text> {formatCurrency(ThanhToan * 1000)}đ</Text>
        <Text style={styles.text}><Text style={{ fontWeight: 'bold' }}>Còn lại:</Text> {formatCurrency(totalAmount - ThanhToan * 1000)}đ</Text>
      </Card>
    );
  };
  


  // Trong FlatList, sửa keyExtractor
  <FlatList
    data={diys}
    keyExtractor={(item) => item.key} // Sử dụng key từ object
    renderItem={renderOrder}
  />
  const totalAmount = monHangList.reduce((total, item) => {
    return total + (item.Gia * 1000);
  }, 0);
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Tab
            value={index}
            onChange={(e) => setIndex(e)}
            indicatorStyle={{
              backgroundColor: 'white',
              height: 2,
            }}
            variant="primary"
          >
            <Tab.Item
              title="Tạo đơn"
              titleStyle={{ fontSize: 12 }}
              icon={{ name: 'add', type: 'ionicon', color: 'white' }}
            />
            <Tab.Item
              title="Đơn hàng"
              titleStyle={{ fontSize: 12 }}
              icon={{ name: 'cart', type: 'ionicon', color: 'white' }}
            />
          </Tab>

          <TabView value={index} onChange={setIndex} animationType="spring">
            <TabView.Item style={{ width: '100%', height: '100%' }}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
              >
                <ScrollView contentContainerStyle={styles.scrollContentContainer}>
                  <View style={{ padding: 5 }}>
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Họ Tên</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Tên Khách Hàng"
                        value={khachHang}
                        onChangeText={setKhachHang}
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Tên món hàng</Text>
                      <View style={styles.pickerContainer}>
                        <Picker
                          selectedValue={selectedMonHang}
                          style={styles.picker}
                          onValueChange={handleMonHangChange}
                        >
                          {Object.entries(dataMonHang).map(([key, item]) => (
                            <Picker.Item key={key} label={item.TenMonHang} value={key} />
                          ))}
                        </Picker>
                      </View>




                    </View>



                    <View style={styles.rowContainer}>
                      <View style={styles.rowItem}>
                        <Text style={styles.label}>Số lượng</Text>
                        {selectedMonHang && (
                          <View style={styles.pickerContainer}>
                            <Picker
                              selectedValue={soLuong}
                              onValueChange={handleSoLuongChange}
                              style={styles.picker} // Nếu cần thêm style cho Picker
                            >
                              {Object.keys(dataMonHang[selectedMonHang]?.SoLuong).map((quantity) => (
                                <Picker.Item label={quantity} value={quantity} key={quantity} />
                              ))}
                            </Picker>
                          </View>
                        )}


                      </View>
                      <View style={styles.rowItem}>
                        <Text style={styles.label}>Giá</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Giá"
                          inputMode='decimal'
                          value={formatCurrency(gia * 1000)}
                          editable={false} // Tắt nhập vào ô TextInput
                        />

                      </View>
                    </View>
                    {/* Nút thêm món hàng */}

                    <TouchableOpacity
                      style={{
                        marginTop: 10,
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        borderRadius: 5,
                        width: '100%',
                        backgroundColor: '#0066FF',
                        alignSelf: 'flex-start',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        marginBottom:10,
                        alignItems: 'center',
                      }}
                      onPress={handleAddMonHang}
                    >
                      <Text style={{ color: 'white' }}>Thêm</Text>
                    </TouchableOpacity>

                    {monHangList.length > 0 ? 
                    <FlatList
                      data={monHangList}
                      keyExtractor={(item) => item.key}
                      style={{marginBottom:10}}
                      ListHeaderComponent={
                        <View style={styles.headerContainer}>
                          <Text style={styles.headerText}>Tên món hàng</Text>
                          <Text style={styles.headerTextQuantity}>Số lượng</Text>
                          <Text style={styles.headerTextPrice}>Giá tiền</Text>
                          <Text style={styles.headerTextIcon}> </Text>
                        </View>
                      }
                      renderItem={({ item }) => (
                        <View style={styles.rowContainer1}>
                          <Text style={styles.itemText}>{item.TenMonHang}</Text>
                          <Text style={styles.itemTextQuantity}>{item.SoLuong}</Text>
                          <Text style={styles.itemTextPrice}>{formatCurrency(item.Gia * 1000)}</Text>
                          <Ionicons
                            name="trash-outline"
                            size={24}
                            color="red"
                            style={styles.itemTextIcon} // Sử dụng style cho icon
                            onPress={() => handleRemoveMonHang(item.key)}
                          />
                        </View>
                      )}
                    /> 
                    : ""}


                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Thanh Toán</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Thanh Toán"
                        inputMode='decimal'
                        value={thanhToan}
                        onChangeText={setThanhToan}
                      />
                    </View>
                    <TouchableOpacity
                      style={{
                        marginTop: 10,
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        borderRadius: 5,
                        width: '100%',
                        backgroundColor: '#0066FF',
                        alignSelf: 'flex-start',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                      onPress={handleCreateOrder}
                    >
                      {printingStatus && (
                        <>
                          <ActivityIndicator size="small" color="#fff" style={{ marginRight: 5 }} />
                          <Text style={{ color: 'white' }}>Đang in...</Text>
                        </>
                      )}
                      {!printingStatus && (
                        <Text style={{ color: 'white' }}>Tạo đơn</Text>
                      )}
                    </TouchableOpacity>

                  </View>
                  <View
                    ref={printViewRef}
                    style={{
                      backgroundColor: 'white',
                      justifyContent: 'center',
                      alignItems: 'center',
                      opacity: 0,
                      zIndex: 1,
                      position: 'relative', // Để chứa hình ảnh tuyệt đối
                    }}
                  >

                    <Text style={{ fontSize: 60, fontWeight: 'bold' }}>{key}</Text>
                    <Text style={{ fontSize: 25, fontWeight: 'bold' }}>{khachHang}</Text>
                    <Text style={{ fontSize: 25 }}>{formatDate(Date.now())}</Text>
                    {monHangList.map((item, index) => (
                      <Text key={index} style={styles.text}>
                        <Text style={{}}>
                          {`${item.TenMonHang} * ${item.SoLuong} = ${formatCurrency(item.Gia * 1000)}đ`}
                        </Text>
                      </Text>
                    ))}

                    {/* Hiển thị tổng tiền */}
                    <Text style={styles.text}>
                      <Text style={{ fontWeight: 'bold' }}>Tổng tiền:</Text> {formatCurrency(totalAmount)}đ
                    </Text>

                    <Text style={styles.text}>
                      <Text style={{ fontWeight: 'bold' }}>Đã Thanh Toán:</Text> {formatCurrency(thanhToan * 1000)}đ
                    </Text>

                    <Text style={styles.text}>
                      <Text style={{ fontWeight: 'bold' }}>Còn lại:</Text> {formatCurrency(totalAmount - thanhToan * 1000)}đ
                    </Text>
                  </View>

                </ScrollView>
              </KeyboardAvoidingView>
            </TabView.Item>


            <TabView.Item style={{ width: '100%' }}>
               <FlatList
                data={Object.values(diys)}
                renderItem={renderOrder}
              /> 
            </TabView.Item>
          </TabView>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    paddingTop: 46,
    flex: 1,
    marginBottom: 20,
    zIndex: 100
  },
  inputContainer: {
    marginBottom: 10,
    
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowItem: {
    flex: 1,
    marginHorizontal: 5,
  },
  label: {
    fontSize: 16,
    color: '#56585c',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    height: 50,
    borderColor: '#DCDCDC',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
    fontSize: 16,
  },
  picker: {
    height: 40,
    borderColor: '#DCDCDC',
    borderWidth: 1,
    borderRadius: 5,
  },
  buttonContainer: {
    marginTop: 20,
  },
  card: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    marginVertical: 5,
  },
  orderKey: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 20,
    marginBottom: 5,
  },
  scrollContentContainer: {
    paddingBottom: 80
  },
  quantitiesContainer: {
    marginTop: 10,
    marginBottom: 10
  },
  quantityText: {
    fontSize: 16,
    marginLeft: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#f1f1f1',
  },
  headerText: {
    flex: 0.8, // Chiếm không gian còn lại
    textAlign: 'left',
    fontWeight: 'bold'
  },
  headerTextQuantity: {
    flex: 0.3, // 25%
    textAlign: 'center',
    fontWeight: 'bold'
  },
  headerTextPrice: {
    flex: 0.5, // 30%
    textAlign: 'right',
    fontWeight: 'bold'
  },
  headerTextIcon: {
    flex: 0.2, // 15%
    textAlign: 'center',
  },
  rowContainer1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },
  itemText: {
    flex: 0.8, // Tên món hàng: 30%
    textAlign: 'left',
  },
  itemTextQuantity: {
    flex: 0.3, // 25%
    textAlign: 'center',
  },
  itemTextPrice: {
    flex: 0.5, // 30%
    textAlign: 'right',
  },
  itemTextIcon: {
    flex: 0.2, // 15%
    textAlign: 'right',
  },
  quantityText: {
    flex: 1, // Chiếm không gian
    textAlign: 'center', // Căn giữa cho số lượng
  },
  priceText: {
    flex: 1, // Chiếm không gian
    textAlign: 'right', // Căn phải cho giá
  },
  pickerContainer: {
    borderWidth: 1, // Độ dày của viền
    borderColor: '#DCDCDC', // Màu sắc của viền
    borderRadius: 5, // Độ bo góc của viền (nếu muốn)
    overflow: 'hidden', // Để tránh viền bị cắt
    marginVertical: 10, // Khoảng cách phía trên và dưới
  },
  picker: {
    height: 50, // Chiều cao của Picker
    // Các thuộc tính khác (nếu cần)
  },
});

export default InDon;
