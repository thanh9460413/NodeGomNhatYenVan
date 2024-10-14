import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import BottomNavigationBar from './BottomTabNavigator';
import { NavigationContainer } from '@react-navigation/native';
import { KeyboardAvoidingView } from 'react-native';
export default function Home() {

  return (
    <NavigationContainer independent={true}>
      <BottomNavigationBar />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
});
