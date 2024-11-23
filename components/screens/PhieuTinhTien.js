import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, StatusBar } from 'react-native';
import { Table, Row } from 'react-native-table-component';
import { AntDesign } from '@expo/vector-icons';
import { Button, Provider as PaperProvider, DefaultTheme, DataTable } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import axios, { all } from 'axios';
import { printToFileAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { FIREBASE_APP } from '../../FirebaseConfig';
import { SelectList } from 'react-native-dropdown-select-list'
import { getDatabase, ref, onValue, push, get, set, query, orderByChild, equalTo, remove,update } from 'firebase/database';
import localData from '../../files/Address.json';
import { Dropdown } from 'react-native-element-dropdown';
import { useIsFocused } from '@react-navigation/native';


const PhieuTinhTien = () => {
  const [khachHang, setKhachHang] = useState('');
  const [SDTKhachHang, setSDTKhachHang] = useState('');
  const [DiaChiKhachHang, setDiaChiKhachHang] = useState('');
  const [Tinh_TP, setTinh_TP] = useState('');
  const [Quan_Huyen, setQuan_Huyen] = useState('');
  const [Phuong_Xa, setPhuong_Xa] = useState('');
  const [tenMonHang, setTenMonHang] = useState('');
  const [soLuong, setSoLuong] = useState('');
  const [thanhTien, setThanhTien] = useState('');
  const [tableData, setTableData] = useState([]);
  const [stt, setSTT] = useState(1);
  const [totalAmount, setTotalAmount] = useState(0);

  const [locations, setLocations] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [refreshing, setRefreshing] = React.useState(false);

  const [initialLocations, setInitialLocations] = useState([]);
  const database = getDatabase(FIREBASE_APP);
  const [hasSelectedOnce, setHasSelectedOnce] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const isFocused = useIsFocused();
  const searchSdtInArray = (allItems, searchSdt) => {
    if (allItems && searchSdt) {
      for (const key in allItems) {
        if (allItems[key].SDTKhachHang === searchSdt) {
          return allItems[key];
        }
      }
    }
    return null;
  };

  function formatCurrencyInput(inputValue) {
    inputValue = inputValue.replace(',', '');
    // Làm sạch chuỗi đầu vào bằng cách loại bỏ tất cả ký tự không phải số
    const value = parseFloat(inputValue) * 1000; // Chia cho 1000 để định dạng theo hàng nghìn

    return value;
  }

  // Hàm tìm khách hàng bằng số điện thoại
  const findKhachHangBySDT = (searchSdt) => {
    const itemsRef = ref(database, 'KhachHang');
    onValue(itemsRef, (snapshot) => {
      const allItems = snapshot.val();
      const foundItem = searchSdtInArray(allItems, searchSdt);
      if (foundItem) {
        setKhachHang(foundItem.TenKhachHang);
        setDiaChiKhachHang(foundItem.DiaChi);
        setSelectedCity({
          value: foundItem.Tinh_ThanhPho
        });
        setSelectedDistrict({
          value: foundItem.Quan_Huyen
        });
        setSelectedWard({
          value: foundItem.Phuong_Xa
        });
        setTinh_TP(foundItem.Tinh_ThanhPho);
        setQuan_Huyen(foundItem.Quan_Huyen);
        setPhuong_Xa(foundItem.Phuong_Xa);
        if (!foundItem.Tinh_ThanhPho || !foundItem.Quan_Huyen || !foundItem.Phuong_Xa) {
          setHasSelectedOnce(true);
        } else {
          setHasSelectedOnce(false);
        }
      } else {
        setKhachHang('');
        setDiaChiKhachHang('');
        setSelectedCity('');
        setSelectedDistrict('');
        setSelectedWard('');
        setTinh_TP('');
        setQuan_Huyen('');
        setPhuong_Xa('');
        setHasSelectedOnce(true);
      }
    });
  };

  // Sử dụng `useEffect` để theo dõi SDTKhachHang và gọi hàm tìm kiếm
  useEffect(() => {
    if (SDTKhachHang) {
      findKhachHangBySDT(SDTKhachHang);
    }
  }, [SDTKhachHang]);

  // Tải dữ liệu tỉnh/thành phố và quận/huyện từ API khi màn hình được tạo
  useEffect(() => {

    setLocations(localData);
    setInitialLocations(localData);

  }, []);


  const currentDate = new Date();
  const date = currentDate.getDate();
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  let TKH = khachHang.toUpperCase();
  const generateHTML = () => {
    const htmlContent = `
    <html>

    <head>
        <style>
            @page {
            size: A4;
            margin: 0;
            }
            .header {
                font-size: 33px;
                font-weight: bold;
                text-align: center;
                margin: 0;
            }
    
            .address {
                font-weight: bold;
            }
    
            .phoneNumber {
                font-weight: bold;
            }
            .diachi {
              font-weight: bold;
            }
            .customerName {
                font-weight: bold;
            }
    
            .date {
                font-weight: bold;
            }
    
            .total {
                font-weight: bold;
                text-align: right;
            }
    
            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
            }
    
            th, td {
                border: 1px solid #000;
                padding: 8px;
            }
            thead {
              display: table-header-group; /* Đảm bảo thead xuất hiện trên mỗi trang */
            }
            th {
                background-color: lightgray;
            }
        </style>
    </head>
    
    <body>
        <h1 class="header">Gốm Sứ Yến Vân - Kinh Doanh Đa Phương Tiện</h1>
        <p class="address">
            Địa chỉ: 31/21/27/17 Đường số 1 Kp5 P.Tân Tạo A Quận Bình Tân
        </p>
        <p class="phoneNumber">
            SĐT/Zalo: 0918095223 & 0919696242
        </p>
        <p class="date">
            Ngày: ${date}/${month}/${year}
        </p>
        <p class="customerName">
            Tên khách hàng: ${TKH}
        </p>
        
        <p class="phoneNumber">
            SĐT Khách hàng: ${SDTKhachHang}
        </p>
        <p class="diachi">
            Địa chỉ khách hàng: ${DiaChiKhachHang}${Phuong_Xa ? ',' : ''}${Phuong_Xa}${Quan_Huyen ? ',' : ''}${Quan_Huyen}${Tinh_TP ? ',' : ''}${Tinh_TP}
        </p>
        <table>
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên món hàng</th>
                <th>Số lượng</th>
                <th>Thành tiền</th>
              </tr>
            </thead>
            ${tableData.map((rowData, index) => `
            <tr>
              <td style="text-align:center; width:5%">${rowData[0]}</td>
              <td style="width:60%">${rowData[1]}</td>
              <td style="text-align:center;width:15%">${rowData[2]}</td>
              <td style="text-align:right;width:20%">${formatCurrency(rowData[3])}</td>
            </tr>
          `).join('')}
            <tr>
                <td colspan="3" class="total">Tổng tiền:</td>
                <td class="total">${formatCurrency(totalAmount)}</td>
            </tr>
        </table>
    </body>
    
    </html>
    `;
    return htmlContent;
  };
  const updateOrCreateCustomer = () => {
    if (!SDTKhachHang) {
      console.log("Vui lòng điền số điện thoại khách hàng trước khi in hóa đơn.");
      return;
    }

    const itemsRef = ref(database, 'KhachHang');
    const queryRef = query(itemsRef, orderByChild('SDTKhachHang'), equalTo(SDTKhachHang));

    get(queryRef)
      .then((querySnapshot) => {
        if (querySnapshot.exists()) {
          querySnapshot.forEach((childSnapshot) => {
            const existingItemKey = childSnapshot.key;
            update(ref(database, `KhachHang/${existingItemKey}`), {
              SDTKhachHang: SDTKhachHang,
              TenKhachHang: khachHang,
              DiaChi: DiaChiKhachHang,
              Phuong_Xa: Phuong_Xa,
              Quan_Huyen: Quan_Huyen,
              Tinh_ThanhPho: Tinh_TP,
            })
              .then(() => {
                console.log("Cập nhật thành công!");
              })
              .catch((error) => {
                console.error("Lỗi khi cập nhật:", error);
              });
          });
        } else {
          const newKhachHangRef = push(itemsRef);
          set(newKhachHangRef, {
            SDTKhachHang: SDTKhachHang,
            TenKhachHang: khachHang,
            DiaChi: DiaChiKhachHang,
            Phuong_Xa: Phuong_Xa,
            Quan_Huyen: Quan_Huyen,
            Tinh_ThanhPho: Tinh_TP,
            // Các trường khác mà bạn muốn thêm mới
          })
            .then(() => {
              console.log("Thêm mới thành công!");
            })
            .catch((error) => {
              console.error("Lỗi khi thêm mới:", error);
            });
        }
      })
      .catch((error) => {
        console.error("Lỗi:", error);
      });
  };






  let generatePDF = async () => {
    tableData.slice().reverse();
    updateOrCreateCustomer();
    const pageWidth = 595.28; // Kích thước A4 (đơn vị là pixel)
    const pageHeight = 841.89;
    const margin = 40; // Lề trái và lề phải (đơn vị là pixel)

    const file = await printToFileAsync({
      html: generateHTML(),
      base64: false,
      width: pageWidth - margin * 2, // Sử dụng kích thước giấy trừ lề
      height: pageHeight - margin * 2,
      marginLeft: margin,
      marginRight: margin,
      marginTop: margin,
      marginBottom: margin
    });

    await shareAsync(file.uri);
  }
  const theme = {
    ...DefaultTheme,
    roundness: 2,
    colors: {
      ...DefaultTheme.colors,
      primary: '#007AFF',
    },
  };
  useEffect(() => {
    const fetchTableData = () => {
      const tableDataRef = ref(database, 'Temp');
      onValue(tableDataRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Định dạng dữ liệu
          const formattedData = Object.values(data).map(item => [
            item.stt,
            item.tenMonHang,
            item.soLuong,
            parseFloat(item.thanhTien)  // Chuyển thành số thực
          ]);
          setTableData(formattedData);

          // Tính tổng thành tiền
          const total = formattedData.reduce((sum, row) => sum + row[3], 0);
          setTotalAmount(total);

          // Lấy stt của mục cuối cùng và cập nhật state stt
          const lastItem = formattedData[formattedData.length - 1];
          if (lastItem) {
            setSTT(lastItem[0] + 1);
          }
        } else {
          // Nếu không có dữ liệu, đặt tổng thành tiền và stt mặc định
          setTableData([]);
          setTotalAmount(0);
          setSTT(1);
        }
      });
    };

    fetchTableData();

    // Cleanup function to remove the listener when the component unmounts
    return () => {
      const tableDataRef = ref(database, 'Temp');
      tableDataRef.off();
    };
  }, []);

  const handleAddButton = () => {
    if (!tenMonHang || !thanhTien) {
      return;
    }

    const newRow = {
      stt,
      tenMonHang,
      soLuong,
      thanhTien,
    };

    const newTotalAmount = totalAmount + parseFloat(thanhTien);
    setTotalAmount(newTotalAmount);

    // Thêm dữ liệu vào Firebase
    const tableDataRef = ref(database, 'Temp');
    const newRowRef = push(tableDataRef);
    set(newRowRef, newRow);

    // Cập nhật local state
    setTenMonHang('');
    setSoLuong('');
    setThanhTien('');
    setSTT(stt + 1);
  };
  function formatCurrency(amount) {
    return amount.toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }
  
  const handleDeleteItem = (stt) => {
    const deletedIndex = tableData.findIndex((row) => row[0] === stt);
    if (deletedIndex !== -1) {
      const deletedItem = tableData[deletedIndex];
      console.log(deletedItem)
      const newTotalAmount = totalAmount - parseFloat(deletedItem.thanhTien);
      setTotalAmount(newTotalAmount);
      // Xóa mục khỏi Firebase
      const tableDataRef = ref(database, 'Temp');
      onValue(tableDataRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Tìm key của mục cần xóa
          let itemKeyToDelete = '';
          for (const key in data) {
            const item = data[key];
            if (
              item.stt === deletedItem[0] &&
              item.tenMonHang === deletedItem[1] &&
              item.soLuong === deletedItem[2] &&
              parseFloat(item.thanhTien) === parseFloat(deletedItem[3])
            ) {
              itemKeyToDelete = key;
              break;
            }
          }
  
          if (itemKeyToDelete) {

            const itemRef = ref(database, `Temp/${itemKeyToDelete}`);
            remove(itemRef)
              .then(() => {
              })
              .catch((error) => {
                console.error("Error removing document: ", error);
              });
          }
        }
      });
    }
  };


  const handleCityChange = (itemValue) => {
    setSelectedCity(itemValue);
    setSelectedDistrict(''); // Reset district
    setSelectedWard(''); // Reset ward

    const selectedCityName = initialLocations.find(location => location.name === itemValue.value)?.name;

    setTinh_TP(selectedCityName || Tinh_TP); // Sử dụng Tinh_TP từ Firebase nếu đã được thiết lập

    // Bạn cũng có thể cập nhật Quan_Huyen và Phuong_Xa ở đây nếu cần
    setQuan_Huyen('');
    setPhuong_Xa('');
    setHasSelectedOnce(true);
    setSearchValue('');
  };
  const handleDistrictChange = (itemValue) => {
    setSelectedDistrict(itemValue);
    setSelectedWard(''); // Reset ward

    // You can update Quan_Huyen here based on the selected district
    const selectedDistrictName = locations
      .find(location => location.name === selectedCity.value)
      .districts.find(district => district.name === itemValue.value)?.name;
    setQuan_Huyen(selectedDistrictName || Quan_Huyen);
    setPhuong_Xa('');
    setHasSelectedOnce(true);
    setSearchValue('');
  };

  const handleWardChange = (itemValue) => {
    setPhuong_Xa('');
    setSelectedWard(itemValue);

    // You can update Phuong_Xa here based on the selected ward
    const selectedWardName = locations
      .find(location => location.name === selectedCity.value)
      .districts.find(district => district.name === selectedDistrict.value)
      .wards.find(ward => ward.name === itemValue.value)?.name;
    setPhuong_Xa(selectedWardName || Phuong_Xa);
    setHasSelectedOnce(true);
    setSearchValue('');
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setKhachHang('');
      setSDTKhachHang('');
      setDiaChiKhachHang('');
      setSelectedCity(''); // Reset selected city
      setSelectedDistrict(''); // Reset selected district
      setSelectedWard(''); // Reset selected ward
      setTinh_TP('');
      setQuan_Huyen('');
      setPhuong_Xa('');
      setTenMonHang('');
      setSoLuong('');
      setThanhTien('');
      setHasSelectedOnce(true);
      setSearchValue('');
      setRefreshing(false);
    }, 1000);
  }, []);
  return (
    <PaperProvider theme={theme}>
      <ScrollView contentContainerStyle={styles.container} refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>  THÔNG TIN KHÁCH HÀNG</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Số Điện Thoại</Text>
            <TextInput
              style={styles.input}
              keyboardType='numeric'
              placeholder="Số Điện Thoại"
              value={SDTKhachHang}
              onChangeText={setSDTKhachHang}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Họ Tên</Text>
            <TextInput
              style={styles.input}
              placeholder="Tên Khách Hàng"
              value={khachHang}
              onChangeText={setKhachHang}
            />
          </View>

          <View style={styles.inputContainer1}>
            <Text style={styles.label}>Địa Chỉ</Text>
            <TextInput
              style={styles.input}
              placeholder="Địa Chỉ"
              value={DiaChiKhachHang}
              onChangeText={setDiaChiKhachHang}
            />
          </View>

          <View style={styles.inputContainer1}>
            <Text style={styles.label1}>Tỉnh/Thành Phố</Text>

            <View style={styles.pickerContainer}>
              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                itemTextStyle={styles.inputStyleDD}
                iconStyle={styles.iconStyle}
                data={locations.map((location) => ({
                  label: location.name,
                  value: location.name,
                  key: location.code,
                }))}
                search
                onChangeText={(search) => setSearchValue(search)}
                value={Tinh_TP ? Tinh_TP : selectedCity}
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Chọn Tỉnh/Thành phố"
                searchPlaceholder="Tìm kiếm..."
                onChange={(itemValue) => {
                  handleCityChange(itemValue);
                  setSearchValue(''); // Đặt giá trị tìm kiếm về rỗng sau khi chọn
                }}
              />


            </View>

          </View>

          <View style={styles.inputContainer} >
            <Text style={styles.label1}>Quận/Huyện</Text>
            <View style={styles.pickerContainer}>
              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                itemTextStyle={styles.inputStyleDD}
                iconStyle={styles.iconStyle}
                data={
                  (selectedCity && locations.find(location => location.name === selectedCity.value)?.districts
                    ? locations.find(location => location.name === selectedCity.value)?.districts.map((district) => (
                      {
                        label: district.name,
                        value: district.name,
                        key: district.code
                      }
                    ))
                    : [])
                }
                search
                value={Quan_Huyen ? Quan_Huyen : selectedDistrict}
                maxHeight={300}
                labelField="label"
                onChangeText={(search) => setSearchValue(search)}
                valueField="value"
                placeholder="Chọn Quận/Huyện"
                searchPlaceholder="Tìm kiếm..."
                onChange={(itemValue) => {
                  handleDistrictChange(itemValue);
                }}
              />


            </View>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label1}>Phường/Xã</Text>
            <View style={styles.pickerContainer}>
              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                itemTextStyle={styles.inputStyleDD}
                iconStyle={styles.iconStyle}
                data={
                  (selectedCity && selectedDistrict && locations.find(location => location.name === selectedCity.value)?.districts
                    .find(district => district.name === selectedDistrict.value)?.wards
                    ? locations.find(location => location.name === selectedCity.value)?.districts
                      .find(district => district.name === selectedDistrict.value)?.wards.map((ward) => (
                        {
                          label: ward.name,
                          value: ward.name,
                          key: ward.code
                        }
                      ))
                    : [])

                }

                search
                value={Phuong_Xa ? Phuong_Xa : selectedWard}
                maxHeight={300}
                labelField="label"
                valueField="value"
                onChangeText={(search) => setSearchValue(search)}
                placeholder="Chọn Phường/Xã"
                searchPlaceholder="Tìm kiếm..."
                onChange={(itemValue) => {
                  handleWardChange(itemValue);
                }}
              />

            </View>
          </View>

        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>  THÔNG TIN MÓN HÀNG</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tên Món Hàng</Text>
            <TextInput
              style={styles.input}
              placeholder="Tên Món Hàng"
              value={tenMonHang}
              onChangeText={setTenMonHang}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Số Lượng</Text>
            <TextInput
              style={styles.smallInput}
              placeholder="Số Lượng"
              value={soLuong}
              onChangeText={setSoLuong}
            />
            <Text style={styles.label}>Thành Tiền</Text>
            <TextInput
              style={styles.smallInput}
              keyboardType='number-pad'
              placeholder="Thành Tiền"
              value={thanhTien}
              onChangeText={(inputValue) => setThanhTien(formatCurrencyInput(inputValue))}
            />
          </View>
          <View style={styles.buttonContainer}>
            <Button mode="contained" onPress={handleAddButton} style={styles.button}>
              Thêm
            </Button>
            <Button mode="contained" onPress={generatePDF} style={styles.button}>
              In hóa đơn
            </Button>
          </View>
        </View>

        <View style={styles.tongtien}>
          <Text style={styles.totalLabel}>Tổng tiền: {formatCurrency(totalAmount)}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <DataTable style={{ borderWidth: 1 }}>
            <DataTable.Header style={styles.tableHeader}>
              <DataTable.Title style={[styles.leftText, { flex: 0.7 }]}>#</DataTable.Title>
              <DataTable.Title style={[styles.leftText, { flex: 2.5, maxHeight: 60, overflow: 'hidden' }]}>Tên món hàng</DataTable.Title>
              <DataTable.Title style={[styles.centerText, { flex: 1.3 }]}>Số lượng</DataTable.Title>
              <DataTable.Title style={[styles.rightText, { flex: 1.7 }]}>Thành tiền</DataTable.Title>
              <DataTable.Title style={[styles.centerElement, { flex: 0.5 }]}></DataTable.Title>
            </DataTable.Header>

            {tableData.slice().reverse().map((rowData, index) => (
              <DataTable.Row key={index}>
                <DataTable.Cell style={[styles.leftText, { flex: 0.7 }]}>{rowData[0]}</DataTable.Cell>
                <DataTable.Cell style={[styles.leftText, { flex: 2.5, maxHeight: 60, overflow: 'hidden' }]}>{rowData[1]}</DataTable.Cell>
                <DataTable.Cell style={[styles.centerText, { flex: 1.3 }]}>{rowData[2]}</DataTable.Cell>
                <DataTable.Cell style={[styles.rightText, { flex: 1.7 }]}>{formatCurrency(rowData[3])}</DataTable.Cell>
                <DataTable.Cell style={[styles.centerElement, { flex: 0.5 }]}>
                  <TouchableOpacity onPress={() => handleDeleteItem(rowData[0])}>
                    <AntDesign name="delete" size={24} color="red" />
                  </TouchableOpacity>
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </ScrollView>
      </ScrollView>
      <StatusBar
        barStyle={'dark-content'} // Chọn kiểu biểu tượng (dark/light) tùy thuộc vào trạng thái focus
        translucent={true}
        animated
      />
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    fontWeight: 'bold',
    marginLeft: 20,
    marginRight: 20,
    paddingBottom: 100,
    flexGrow: 1,
  },
  infoContainer: {
    position: 'relative',
    zIndex: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
    shadowColor: '#171717',
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  infoTitle: {

    fontSize: 16,
    fontWeight: '600',
    borderLeftWidth: 2,
    color: '#F4A460',
    borderLeftColor: '#F4A460'
  },
  label: {

    marginRight: 10,
    fontSize: 12,
    color: '#56585c',
    fontWeight: 'bold',
  },
  label1: {
    marginRight: 10,
    fontSize: 12,
    color: '#56585c',
    fontWeight: 'bold',
    marginTop: -2
  },
  inputContainer: {
    position: 'relative',
    zIndex: 0,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5
  },
  inputContainer1: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2
  },
  input: {
    flex: 2,
    height: 45,
    color: '#317ef7',
    borderBottomWidth: 1,
    borderBottomColor: '#DCDCDC',
    fontSize: 12,
  },
  smallInput: {

    flex: 1,
    height: 45,
    color: '#317ef7',
    borderBottomWidth: 1,
    borderBottomColor: '#DCDCDC',
    fontSize: 12,
  },
  tongtien: {
    fontSize: 16,
  },
  totalLabel: {
    display: 'flex',
  },
  tableHeader: {
    position: 'relative',
    zIndex: 0,
    height: 50,
    backgroundColor: 'lightgray',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableHeaderText: {
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
  },
  tableRow: {
    height: 40,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tableText: {
    textAlign: 'center',
    flex: 1,
    fontSize: 14,
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 50,
  },
  centerText: {
    textAlign: 'center',
    justifyContent: 'center',
    flex: 1,
    fontSize: 14,
  },
  leftText: {
    flex: 1,
    fontSize: 14,
  },
  rightText: {
    textAlign: 'right',
    flex: 1,
    paddingLeft: 10,
    fontSize: 14,
  },
  centerElement: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 14,
  },
  pickerContainer: {
    flex: 1,
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#DCDCDC',
    zIndex: 1, // Set zIndex to bring the SelectList to the front
  },
  picker: {
    fontSize: 12,
  },
  scrollContainer: {

    flexGrow: 1,
    marginTop: 10,
    marginBottom: 100, // Khoảng cách giữa các nút
  },
  buttonContainer: {
    flexDirection: 'row', // Hiển thị các nút theo chiều ngang
    justifyContent: 'space-between', // Các nút nằm cách nhau
    marginTop: 20,
  },
  button: {
    flex: 1, // Chia đều khoảng trống giữa các nút
    marginRight: 10, // Khoảng cách giữa các nút
  },
  dropdown: {
    marginLeft: 5,
    marginRight: 5,
    height: 50,
  },
  icon: {
    marginRight: 5,
  },
  placeholderStyle: {
    fontSize: 12,
    color: '#DCDCDC'
  },
  selectedTextStyle: {
    fontSize: 12,
    color: '#317ef7'
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 12,
  },
  inputStyleDD: {
    fontSize: 12,
    color: '#317ef7'
  }
});

export default PhieuTinhTien;
