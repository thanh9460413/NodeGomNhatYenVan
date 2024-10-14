import React, { useState, useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';

const BaoCaoDongTien = () => {
  const [locations, setLocations] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedWard, setSelectedWard] = useState('');

  // Tải dữ liệu tỉnh/thành phố và quận/huyện từ API khi màn hình được tạo
  useEffect(() => {
    axios.get('https://provinces.open-api.vn/api/?depth=3')
      .then((response) => {
        if (response.status === 200) {
          setLocations(response.data);
        }
      })
      .catch((error) => {
        console.error('Lỗi khi tải dữ liệu tỉnh/thành phố:', error);
      });
  }, []);

  // Xử lý khi chọn lại thành phố
  const handleCityChange = (itemValue) => {
    setSelectedCity(itemValue);
    setSelectedDistrict(''); // Đặt lại quận/huyện thành giá trị mặc định
    setSelectedWard('');    // Đặt lại phường/xã thành giá trị mặc định
  }

  return (
    <View style={{ marginTop: 200, padding: 50 }}>
      <Picker
        selectedValue={selectedCity}
        onValueChange={handleCityChange}
      >
        <Picker.Item label="Chọn tỉnh/thành phố" value="" />
        {locations.map((location) => (
          <Picker.Item key={location.code} label={location.name} value={location.code} />
        ))}
      </Picker>
      
      <Picker
        selectedValue={selectedDistrict}
        onValueChange={(itemValue, itemIndex) => setSelectedDistrict(itemValue)}
        enabled={selectedCity !== ''}
      >
        <Picker.Item label="Chọn quận/huyện" value="" />
        {selectedCity && locations.find(location => location.code === selectedCity).districts
          ? locations.find(location => location.code === selectedCity).districts.map((district) => (
              <Picker.Item key={district.code} label={district.name} value={district.code} />
            ))
          : null
        }
      </Picker>

      <Picker
        selectedValue={selectedWard}
        onValueChange={(itemValue, itemIndex) => setSelectedWard(itemValue)}
        enabled={selectedDistrict !== ''}
      >
        <Picker.Item label="Chọn phường/xã" value="" />
        {selectedCity && selectedDistrict && locations.find(location => location.code === selectedCity).districts
          .find(district => district.code === selectedDistrict).wards
          ? locations.find(location => location.code === selectedCity).districts
              .find(district => district.code === selectedDistrict).wards.map((ward) => (
                <Picker.Item key={ward.code} label={ward.name} value={ward.code} />
              ))
          : null
        }
      </Picker>

      <Text>Data from API:</Text>
      <Text>Thành phố/tỉnh: {selectedCity}</Text>
      <Text>Quận/huyện: {selectedDistrict}</Text>
      <Text>Phường/xã: {selectedWard}</Text>
    </View>
  );
};

export default BaoCaoDongTien;
