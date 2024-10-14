// import React from 'react';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { Ionicons } from '@expo/vector-icons';

// // Import your screen components
// import PhieuTinhTienScreen from './screens/PhieuTinhTien';
// import PhieuVanChuyenScreen from './screens/PhieuVanChuyen';
// import BottomFabBar from './bottombar/components/bottom.tab'
// const Tab = createBottomTabNavigator();

// const tabBarIcon = (name) => ({ focused, color, size }) => (
//   <Ionicons name={name} size={size} color={focused ? 'purple' : 'gray'} />
// );

// const BottomNavigationBar = () => {
//   return (
//     <Tab.Navigator
//       screenOptions={{
//         tabBarActiveTintColor: '#5F0B65',
//         tabBarActiveBackgroundColor: 'white',
//         tabBarInactiveBackgroundColor: 'red',
//       }}
//       tabBar={(props) => (
//         <BottomFabBar
//           mode={'square' | 'default'}
//           isRtl={false}
//           // Add Shadow for active tab bar button
//           focusedButtonStyle={{
//             shadowColor: '#000',
//             shadowOffset: {
//               width: 0,
//               height: 7,
//             },
//             shadowOpacity: 0.41,
//             shadowRadius: 9.11,
//             elevation: 14,
//           }}
//           // - You can add the style below to show screen content under the tab-bar
//           // - It will makes the "transparent tab bar" effect.
//           bottomBarContainerStyle={{
//             position: 'absolute',
//             bottom: 0,
//             left: 0,
//             right: 0,
//           }}
//           {...props}
//         />
//       )}
//     >
//       <Tab.Screen
//         options={{
//           tabBarIcon: tabBarIcon('albums-outline'),
//         }}
//         name="Home"
//         component={PhieuTinhTienScreen}
//       />
//       <Tab.Screen
//         name="Meh"
//         options={{ tabBarIcon: tabBarIcon('car-outline') }}
//         component={PhieuVanChuyenScreen}
//       />
    
//     </Tab.Navigator>
//   );
// };

// export default BottomNavigationBar;
