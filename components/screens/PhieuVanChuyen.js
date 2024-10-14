import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, StatusBar, useColorScheme } from 'react-native';
import { Table, Row } from 'react-native-table-component';
import { AntDesign } from '@expo/vector-icons';
import { Button, Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import axios, { all } from 'axios';
import { printToFileAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { FIREBASE_APP } from '../../FirebaseConfig';
import { SelectList } from 'react-native-dropdown-select-list'
import { getDatabase, ref, onValue, push, get, set, query, orderByChild, equalTo } from 'firebase/database';
import localData from '../../files/Address.json';
import { Dropdown } from 'react-native-element-dropdown';
import { useIsFocused } from '@react-navigation/native';
const PhieuVanChuyen = () => {
    const scheme = useColorScheme();
    const [khachHang, setKhachHang] = useState('');
    const [SDTKhachHang, setSDTKhachHang] = useState('');
    const [DiaChiKhachHang, setDiaChiKhachHang] = useState('');
    const [SoLuong, setSoLuong] = useState('');
    const [ThuHo, setThuHo] = useState('');
    const [Ship, setShip] = useState('');
    const [Tinh_TP, setTinh_TP] = useState('');
    const [Quan_Huyen, setQuan_Huyen] = useState('');
    const [Phuong_Xa, setPhuong_Xa] = useState('');
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
    const isFocused = useIsFocused();
    const [hasSelectedOnce, setHasSelectedOnce] = useState(true);
    const [searchValue, setSearchValue] = useState('');
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
        if (!inputValue) return '0';

        // Làm sạch chuỗi đầu vào bằng cách loại bỏ tất cả ký tự không phải số
        inputValue = inputValue.replace(/[^0-9]/g, '');

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

    function formatCurrency(amount) {
        return amount.toLocaleString('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        });
    }
    const currentDate = new Date();
    const date = currentDate.getDate();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    let TKH = khachHang.toUpperCase();
    const generateHTML = () => {
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
        <style>
        @page {
            size: A4 landscape;
            margin: 0mm;
            padding: 0;
        }
        
        @media print {
            html, body {
                margin: 0mm;
                padding: 0;
                box-sizing: border-box;
            }
        
            .container, .columns, .column, .column-50 {
                box-sizing: border-box;
                padding: 0;
                margin: 0;
            }
        }
        
        body {
            font-family: Arial, sans-serif;
            padding: 0;
            box-sizing: border-box;
            margin: 0;
        }
        
        .container {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: stretch;
            height: 100vh;
        }
        
        .header, .footer {
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        
        .header {
            padding-top: 20px;
        }
        
        .footer {
            padding-bottom: 20px;
        }
        
        .bold {
            font-weight: bold;
        }
        
        .text-35 {
            font-size: 35px;
            margin-bottom: 10px;
        }
        
        .text-45 {
            font-size: 45px;
        }
        .text-40{
        font-size: 40px;
        }
        .columns {
            display: flex;
            flex-direction: row;
            width: 100%;
        }
        .columns1 {
            display: flex;
            flex-direction: row;
            justify-content: center;
            width: 100%;
        }
        .column-25 {
            flex: 0 0 30%;
            width: 30%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 60px;
        }
        
        .column-25 .text {
            width: 100%;
            font-weight: bold;
        }
        
        .column-50 {
            flex: 0 0 50%;
            width: 50%;
        }
        
        .column-72 {
            width: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        
        .column-72 .text1 {
            font-weight: bold;
            font-size: 60px;
        }
        
        .column-72 .text2 {
            font-weight: bold;
            font-size: 55px;
        }
        
        .column-40 {
            flex: 0 0 40%;
            width: 40%;
        }
        
        .column-60 {
            flex: 0 0 60%;
            width: 60%;
        }
        </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="columns">
                        <div class="column-25">
                             <div class="text">Người gửi:</div>
                        </div>
                        <div class="column-72">
                            <div class="text2">Gốm Sứ Yến Vân</div>
                            <div class="text2">Kinh doanh đa phương tiện</div>
                        </div>
                    </div>
                    <div class="text-35">
                        <span class="bold">Địa chỉ:</span>
                        31/21/27/17 Đường số 1 Kp5 P.Tân Tạo A Quận Bình Tân
                    </div>
                    <div class="text-40">
                        <span class="bold">SĐT/Zalo:</span>
                        0918095223 & 0919696242
                    </div>
                    <div class="text-40">
                        <span class="bold">Người nhận:</span>
                        <span class="bold">${TKH}</span>
                    </div>
                    <div class="text-45" style="word-wrap: break-word;">
                        <span class="bold">Địa chỉ:</span>
                        ${DiaChiKhachHang}${Phuong_Xa ? ', ' : ''}${Phuong_Xa}${Quan_Huyen ? ', ' : ''}${Quan_Huyen}${Tinh_TP ? ', ' : ''}${Tinh_TP}
                    </div>
                    <div class="columns">
                        <div class="column-50 text-40">
                            <span class="bold">SĐT:</span>
                            ${SDTKhachHang}
                        </div>
                        <div class="column-50 text-40">
                            <span class="bold">Ngày:</span>
                            <span class="bold">${date}/${month}/${year}</span>
                        </div>
                    </div>
                    <div class="columns">
                        <div class="column-50 text-40">
                            <span class="bold">Số lượng:</span>
                            ${SoLuong}
                        </div>
                        <div class="column-50 bold" style="padding-left:20px; font-size: 45px;">HÀNG DỄ VỠ</div>
                    </div>
                    <div class="columns">
                        <div class="column-50 text-40">
                            <span class="bold">Ship:</span>
                            ${Ship}
                        </div>
                        <div class="column-50 bold text-40" style="padding-left:25px; font-size: 45px;">GIÁ TRỊ CAO</div>
                    </div>
                    <div class="columns">
                        <div class="column-40 text-40">
                            <span class="bold">Thu hộ:</span>
                            ${formatCurrency(ThuHo)}
                        </div>

                        <div class="column-60 bold text-40" style="padding-left:75px;">Xin nhẹ tay cảm ơn</div>
                    </div>
                </div>
                <div class="footer">
                    <div class="columns1">
                        <div class="bold" style="font-size:40px">Chân thành cảm ơn quý khách đã ủng hộ Shop</div>
                    </div>
                </div>
            </div>
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
                        set(ref(database, `KhachHang/${existingItemKey}`), {
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
        const itemsRef = ref(database, 'ThuHo');

        // get(itemsRef)
        //     .then((querySnapshot) => {
        //         const newKhachHangRef = push(itemsRef);

        //         set(newKhachHangRef, {
        //             SDTKhachHang: SDTKhachHang,
        //             TenKhachHang: khachHang,
        //             DiaChi: DiaChiKhachHang,
        //             Phuong_Xa: Phuong_Xa,
        //             Quan_Huyen: Quan_Huyen,
        //             Tinh_ThanhPho: Tinh_TP,
        //             ThuHo: ThuHo,
        //             SoLuong: SoLuong,
        //             Ngay: `${date}/${month}/${year}`,
        //             Ship: Ship,
        //             // Các trường khác mà bạn muốn thêm mới
        //         })
        //             .then(() => {
        //                 console.log("Thêm mới thành công!");
        //             })
        //             .catch((error) => {
        //                 console.error("Lỗi khi thêm mới:", error);
        //             });
        //     })
        //     .catch((error) => {
        //         console.error("Lỗi:", error);
        //     });
        const pageWidth = 842; // Kích thước A4 ngang (đơn vị là pixel) cho 72 DPI
        const pageHeight = 595; // Kích thước A4 dọc (đơn vị là pixel) cho 72 DPI
        const margin = 0; // Lề trái và lề phải (đơn vị là pixel)

        const file = await printToFileAsync({
            html: generateHTML(),
            base64: false,
            Orientation: 'landscape', // Hướng ngang
            width: pageWidth, // Sử dụng kích thước giấy A4 ngang
            height: pageHeight, // Sử dụng kích thước giấy A4 dọc
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
    const handleShipChange = (itemValue) => {
        setShip(itemValue.value);
    };
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
            setKhachHang('');
            setSDTKhachHang('');
            setDiaChiKhachHang('');
            setSelectedCity('');
            setSelectedDistrict('');
            setSelectedWard('');
            setTinh_TP('');
            setQuan_Huyen('');
            setPhuong_Xa('');
            setTotalAmount(0);
            setSoLuong('');
            setThuHo('');
            setSearchValue('');
            setShip('');
            setHasSelectedOnce(true);
        }, 1000);
    }, []);


    const tableHead = ['STT', 'Tên món hàng', 'Số lượng', 'Thành tiền', ''];

    const widthArr = [40, 120, 50, 110, 50];

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
                    <Text style={styles.infoTitle}>  THÔNG TIN PHIẾU VẬN CHUYỂN</Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Số Lượng</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType='number-pad'
                            placeholder="Số Lượng"
                            value={SoLuong}
                            onChangeText={setSoLuong}
                        />
                    </View>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Thu Hộ</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Thu Hộ"
                            value={ThuHo}
                            onChangeText={(inputValue) => setThuHo(formatCurrencyInput(inputValue))}
                        />
                    </View>

                    <View style={styles.inputContainer1}>
                        <Text style={styles.label1}>Ship</Text>
                        <View style={styles.pickerContainer}>
                            <Dropdown
                                style={styles.dropdown}
                                placeholderStyle={styles.placeholderStyle}
                                selectedTextStyle={styles.selectedTextStyle}
                                inputSearchStyle={styles.inputSearchStyle}
                                itemTextStyle={styles.inputStyleDD}
                                iconStyle={styles.iconStyle}
                                data={
                                    [
                                        { label: 'Khách trả', value: 'Khách trả' },
                                        { label: 'Shop trả', value: 'Shop trả' },
                                    ]
                                }

                                value={Ship}
                                maxHeight={300}
                                labelField="label"
                                valueField="value"
                                placeholder="Chọn Ship"
                                onChange={(itemValue) => {
                                    handleShipChange(itemValue);
                                }}
                            />
                        </View>
                    </View>




                </View>

                <View style={styles.buttonContainer}>
                    <Button mode="contained" onPress={generatePDF}>
                        In phiếu vận chuyển
                    </Button>
                </View>
            </ScrollView>
            <StatusBar
                barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} // Chọn kiểu biểu tượng dựa vào chế độ màu
                translucent={true}
                animated
            />
        </PaperProvider>
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
        height: 35,
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
        paddingLeft: 10,
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
        // Các thuộc tính khác của phần scroll
        flexGrow: 1,
        marginTop: 10,
        marginBottom: 100, // Khoảng cách giữa các nút
    },
    buttonContainer: {
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

export default PhieuVanChuyen;
