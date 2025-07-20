// import React, { useEffect, useRef, useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   Image,
//   Dimensions,
//   Platform,
//   Alert,
//   ColorValue,
//   StatusBar,
//   TextInput, // Added TextInput for card input fields
//   Modal, // Added Modal for the popup
//   KeyboardAvoidingView, // Added for keyboard handling in modal
//   PanResponderInstance, // Import PanResponderInstance
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';
// import { GestureHandlerRootView } from 'react-native-gesture-handler';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// import {
//   initializeLoggingMetadata,
//   logGestureEvent,
//   createPanGestureLogger,
//   TypingMeta,
// } from '../utils/logGesture'; // Import necessary logging functions

// const { width } = Dimensions.get('window');

// interface CardItemProps {
//   bankName: string;
//   balance: string;
//   lastFourDigits: string;
//   type: 'Visa' | 'Mastercard';
//   gradientColors: readonly [ColorValue, ColorValue, ...ColorValue[]];
//   logoUrl?: string;
// }

// const CardsScreen = () => {
//   const router = useRouter();
//   const [activeTab, setActiveTab] = useState('Cards');
//   const [userName, setUserName] = useState('Guest'); // State for username
//   const [isAddCardModalVisible, setAddCardModalVisible] = useState(false);
//   const [newCardNumber, setNewCardNumber] = useState('');
//   const [newCardCVV, setNewCardCVV] = useState('');
//   const [newCardBank, setNewCardBank] = useState('');

//   const screenEntryTime = useRef<number | null>(null); // Added for 3-second delay
//   const panResponder = useRef<PanResponderInstance | null>(null); // PanResponder instance
//   const lastTextInputTime = useRef(Date.now()); // For typing speed
//   const lastTextInputLength = useRef(0); // For typing speed

//   // New logScreenGesture function using the imported logGestureEvent
//   const logScreenGesture = async (
//     gestureType: string,
//     eventData: {
//       x?: number;
//       y?: number;
//       pressure?: number;
//       dx?: number;
//       dy?: number;
//       vx?: number;
//       vy?: number;
//       touchDuration?: number;
//     } = {},
//     extraData: Record<string, any> = {},
//     typingMeta: TypingMeta | null = null
//   ) => {
//     await logGestureEvent(
//       'CardsScreen', // Screen name
//       gestureType,
//       eventData,
//       extraData,
//       typingMeta,
//       screenEntryTime.current // Pass screenEntryTime for the 3-second initial delay check
//     );
//   };

//   useEffect(() => {
//     screenEntryTime.current = Date.now(); // Set screen entry time on mount

//     initializeLoggingMetadata(); // Initialize logging metadata

//     // Initialize PanResponder for the screen
//     panResponder.current = createPanGestureLogger(
//       'CardsScreen',
//       screenEntryTime
//     );

//     const fetchUserName = async () => {
//       try {
//         const userDataString = await AsyncStorage.getItem('userData');
//         if (userDataString !== null) {
//           const userData = JSON.parse(userDataString);
//           if (userData.fullName) {
//             setUserName(userData.fullName);
//           }
//         }
//       } catch (error) {
//         console.error('Error fetching user name for CardsScreen:', error);
//       }
//     };
//     fetchUserName();

//     return () => {
//       // Cleanup if necessary
//     };
//   }, []);

//   const handleBack = (e: any) => {
//     logScreenGesture(
//       'tap',
//       { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
//       { action: 'back_button' }
//     );
//     router.back();
//   };

//   const handleAddCardPress = (e: any) => {
//     setAddCardModalVisible(true);
//     logScreenGesture(
//       'tap',
//       { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
//       { action: 'add_new_card_button' }
//     );
//   };

//   const handleAddCardSubmit = (e: any) => {
//     // Basic validation
//     if (!newCardNumber || !newCardCVV || !newCardBank) {
//       Alert.alert('Error', 'Please fill all card details.');
//       return;
//     }

//     // Simulate adding card
//     setAddCardModalVisible(false);
//     Alert.alert('Card Added!', 'Your card will be added after 24 hours.');

//     // Clear input fields
//     setNewCardNumber('');
//     setNewCardCVV('');
//     setNewCardBank('');

//     logScreenGesture(
//       'tap',
//       { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
//       { action: 'submit_add_card_button' }
//     );
//   };

//   const handleTextInputChange = (text: string, fieldName: string) => {
//     const now = Date.now();
//     const timeElapsed = now - lastTextInputTime.current;
//     const charDiff = text.length - lastTextInputLength.current;

//     let typingSpeed = 0;
//     if (timeElapsed > 0 && charDiff !== 0) {
//       typingSpeed = charDiff / (timeElapsed / 1000);
//     }

//     let backspacesUsed = 0;
//     if (charDiff < 0) {
//       backspacesUsed = Math.abs(charDiff);
//     }

//     logScreenGesture(
//       'typing',
//       {},
//       {},
//       {
//         totalCharacters: text.length,
//         typingSpeed: parseFloat(typingSpeed.toFixed(2)),
//         backspaceCount: backspacesUsed,
//         timeBetweenKeys: timeElapsed,
//         fieldName: fieldName,
//       }
//     );

//     lastTextInputTime.current = now;
//     lastTextInputLength.current = text.length;
//   };

//   const handleTextInputEndEditing = (fieldName: string) => {
//     logScreenGesture(
//       'release',
//       {},
//       {
//         action: 'text_input_ended',
//         fieldName: fieldName,
//         finalValueLength:
//           fieldName === 'cardNumber'
//             ? newCardNumber.length
//             : fieldName === 'cardCVV'
//             ? newCardCVV.length
//             : newCardBank.length,
//       }
//     );
//   };

//   const CardItem = ({
//     bankName,
//     balance,
//     lastFourDigits,
//     type,
//     gradientColors,
//   }: CardItemProps) => (
//     <LinearGradient
//       colors={gradientColors}
//       start={{ x: 0, y: 0 }}
//       end={{ x: 1, y: 1 }}
//       style={styles.cardItem}
//     >
//       <Text style={styles.cardBankName}>{bankName}</Text>
//       <Text style={styles.cardNumberDigits}>
//         **** **** **** {lastFourDigits}
//       </Text>
//       <View style={styles.cardBottomRow}>
//         <Text style={styles.cardBalance}>${balance}</Text>
//         {type === 'Visa' && (
//           <Image
//             source={{
//               uri: 'https://placehold.co/50x20/0056B3/FFFFFF?text=VISA&font=roboto&font-size=12&bold=true',
//             }}
//             style={styles.cardLogo}
//             resizeMode="contain"
//           />
//         )}
//         {type === 'Mastercard' && (
//           <Image
//             source={{
//               uri: 'https://placehold.co/50x20/FFD700/000000?text=MC&font=roboto&font-size=12&bold=true',
//             }}
//             style={styles.cardLogo}
//             resizeMode="contain"
//           />
//         )}
//       </View>
//     </LinearGradient>
//   );

//   return (
//     <GestureHandlerRootView
//       style={styles.fullScreenContainer}
//       {...(panResponder.current?.panHandlers || {})}
//     >
//       {Platform.OS === 'android' && (
//         <StatusBar
//           backgroundColor="#E6F2FF"
//           barStyle="dark-content"
//         />
//       )}
//       <View style={styles.header}>
//         <TouchableOpacity
//           onPressIn={handleBack} // Changed to onPressIn for gesture logging
//           style={styles.headerIcon}
//         >
//           <Ionicons
//             name="arrow-back"
//             size={24}
//             color="#333"
//           />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>My Cards</Text>
//         <TouchableOpacity
//           style={styles.headerIcon}
//           onPressIn={(e) =>
//             logScreenGesture(
//               'tap',
//               { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
//               { action: 'more_options_icon' }
//             )
//           }
//         >
//           <MaterialCommunityIcons
//             name="dots-horizontal"
//             size={24}
//             color="#333"
//           />
//         </TouchableOpacity>
//       </View>

//       <ScrollView
//         style={styles.scrollView}
//         contentContainerStyle={styles.scrollContainer}
//       >
//         <TouchableOpacity
//           onPressIn={(e) =>
//             logScreenGesture(
//               'tap',
//               { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
//               { action: 'card_item_visa_2026' }
//             )
//           }
//         >
//           <CardItem
//             bankName="CanaraSync"
//             balance="5348.50"
//             lastFourDigits="2026"
//             type="Visa"
//             gradientColors={['#FF8C00', '#FF4500'] as const}
//           />
//         </TouchableOpacity>

//         <TouchableOpacity
//           onPressIn={(e) =>
//             logScreenGesture(
//               'tap',
//               { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
//               { action: 'card_item_mastercard_6202' }
//             )
//           }
//         >
//           <CardItem
//             bankName="CanaraSync"
//             balance="2187.30"
//             lastFourDigits="6202"
//             type="Mastercard"
//             gradientColors={['#4682B4', '#8A2BE2'] as const}
//           />
//         </TouchableOpacity>

//         <TouchableOpacity
//           onPressIn={(e) =>
//             logScreenGesture(
//               'tap',
//               { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
//               { action: 'card_item_visa_0262' }
//             )
//           }
//         >
//           <CardItem
//             bankName="CanaraSync"
//             balance="3490.00"
//             lastFourDigits="0262"
//             type="Visa"
//             gradientColors={['#FF69B4', '#DA70D6'] as const}
//           />
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.addNewCardButton}
//           onPressIn={handleAddCardPress} // Changed to onPressIn for gesture logging
//         >
//           <Ionicons
//             name="add-circle-outline"
//             size={30}
//             color="#0056B3"
//           />
//           <Text style={styles.addNewCardText}>Add New Card</Text>
//         </TouchableOpacity>

//         {/* Removed "See Your Data" button as requested */}
//       </ScrollView>

//       {/* Add New Card Modal */}
//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={isAddCardModalVisible}
//         onRequestClose={() => {
//           setAddCardModalVisible(false);
//           logScreenGesture(
//             'tap',
//             { x: 0, y: 0 },
//             { action: 'close_add_card_modal' }
//           ); // Log close modal
//         }}
//       >
//         <KeyboardAvoidingView
//           behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//           style={styles.modalOverlay}
//         >
//           <View style={styles.modalContent}>
//             <TouchableOpacity
//               style={styles.modalCloseButton}
//               onPress={() => {
//                 setAddCardModalVisible(false);
//                 logScreenGesture(
//                   'tap',
//                   { x: 0, y: 0 },
//                   { action: 'close_add_card_modal_icon' }
//                 ); // Log close modal icon
//               }}
//             >
//               <Ionicons
//                 name="close-circle-outline"
//                 size={30}
//                 color="#666"
//               />
//             </TouchableOpacity>
//             <Text style={styles.modalTitle}>Add New Card</Text>

//             {/* Empty Card Design */}
//             <LinearGradient
//               colors={['#A9A9A9', '#808080']} // Grey gradient for empty card
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 1 }}
//               style={styles.modalCardPreview}
//             >
//               <Text style={styles.modalCardText}>**** **** **** ****</Text>
//               <Text style={styles.modalCardText}>MM/YY</Text>
//               <Text style={styles.modalCardText}>Card Holder Name</Text>
//             </LinearGradient>

//             {/* Input Fields */}
//             <TextInput
//               style={styles.input}
//               placeholder="Enter Card Number"
//               placeholderTextColor="#999"
//               keyboardType="numeric"
//               value={newCardNumber}
//               onChangeText={(text) => handleTextInputChange(text, 'cardNumber')}
//               onEndEditing={() => handleTextInputEndEditing('cardNumber')}
//               maxLength={16}
//             />
//             <TextInput
//               style={styles.input}
//               placeholder="Enter CVV"
//               placeholderTextColor="#999"
//               keyboardType="numeric"
//               value={newCardCVV}
//               onChangeText={(text) => handleTextInputChange(text, 'cardCVV')}
//               onEndEditing={() => handleTextInputEndEditing('cardCVV')}
//               maxLength={3}
//             />
//             <TextInput
//               style={styles.input}
//               placeholder="Enter Bank Name"
//               placeholderTextColor="#999"
//               value={newCardBank}
//               onChangeText={(text) => handleTextInputChange(text, 'cardBank')}
//               onEndEditing={() => handleTextInputEndEditing('cardBank')}
//             />

//             <TouchableOpacity
//               style={styles.modalAddButton}
//               onPressIn={handleAddCardSubmit} // Changed to onPressIn for gesture logging
//             >
//               <Text style={styles.modalAddButtonText}>Add Card</Text>
//             </TouchableOpacity>
//           </View>
//         </KeyboardAvoidingView>
//       </Modal>

//       <View style={styles.bottomNavBar}>
//         <TouchableOpacity
//           style={styles.navItem}
//           onPress={() => {
//             setActiveTab('Home');
//             router.replace('/HomeScreen');
//             logScreenGesture('tap', { x: 0, y: 0 }, { action: 'nav_home' });
//           }}
//         >
//           <Ionicons
//             name={activeTab === 'Home' ? 'home' : 'home-outline'}
//             size={24}
//             color={activeTab === 'Home' ? '#0056B3' : '#666'}
//           />
//           <Text
//             style={[
//               styles.navText,
//               activeTab === 'Home' && styles.navTextActive,
//             ]}
//           >
//             Home
//           </Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={styles.navItem}
//           onPress={() => {
//             setActiveTab('History');
//             router.replace('/HistoryScreen');
//             logScreenGesture('tap', { x: 0, y: 0 }, { action: 'nav_history' });
//           }}
//         >
//           <MaterialCommunityIcons
//             name={activeTab === 'History' ? 'history' : 'history'}
//             size={24}
//             color={activeTab === 'History' ? '#0056B3' : '#666'}
//           />
//           <Text
//             style={[
//               styles.navText,
//               activeTab === 'History' && styles.navTextActive,
//             ]}
//           >
//             History
//           </Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={styles.navItem}
//           onPress={() => {
//             setActiveTab('Scan');
//             router.replace('/QRScreen');
//             logScreenGesture('tap', { x: 0, y: 0 }, { action: 'nav_scan' });
//           }}
//         >
//           <MaterialCommunityIcons
//             name="qrcode-scan"
//             size={30}
//             color={activeTab === 'Scan' ? '#0056B3' : '#666'}
//           />
//           <Text
//             style={[
//               styles.navText,
//               activeTab === 'Scan' && styles.navTextActive,
//             ]}
//           >
//             Scan
//           </Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={styles.navItem}
//           onPress={() => {
//             setActiveTab('Cards');
//             router.replace('/CardsScreen');
//             logScreenGesture('tap', { x: 0, y: 0 }, { action: 'nav_cards' });
//           }}
//         >
//           <Ionicons
//             name={activeTab === 'Cards' ? 'card' : 'card-outline'}
//             size={24}
//             color={activeTab === 'Cards' ? '#0056B3' : '#666'}
//           />
//           <Text
//             style={[
//               styles.navText,
//               activeTab === 'Cards' && styles.navTextActive,
//             ]}
//           >
//             Cards
//           </Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={styles.navItem}
//           onPress={() => {
//             setActiveTab('My Profile');
//             router.replace('/ProfileScreen');
//             logScreenGesture('tap', { x: 0, y: 0 }, { action: 'nav_profile' });
//           }}
//         >
//           <Ionicons
//             name={activeTab === 'My Profile' ? 'person' : 'person-outline'}
//             size={24}
//             color={activeTab === 'My Profile' ? '#0056B3' : '#666'}
//           />
//           <Text
//             style={[
//               styles.navText,
//               activeTab === 'My Profile' && styles.navTextActive,
//             ]}
//           >
//             My Profile
//           </Text>
//         </TouchableOpacity>
//       </View>
//     </GestureHandlerRootView>
//   );
// };

// export default CardsScreen;

// const styles = StyleSheet.create({
//   fullScreenContainer: {
//     flex: 1,
//     backgroundColor: '#F5F5F5',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingTop:
//       Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 50,
//     paddingBottom: 15,
//     backgroundColor: '#fff',
//     borderBottomLeftRadius: 20,
//     borderBottomRightRadius: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     elevation: 5,
//   },
//   headerIcon: {
//     padding: 5,
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   scrollView: {
//     flex: 1,
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     alignItems: 'center',
//     paddingVertical: 20,
//     paddingBottom: 80,
//   },
//   cardItem: {
//     width: width * 0.9,
//     height: 180,
//     borderRadius: 15,
//     padding: 20,
//     marginBottom: 20,
//     justifyContent: 'space-between',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 5 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 10,
//   },
//   cardBankName: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#fff',
//   },
//   cardNumberDigits: {
//     fontSize: 16,
//     color: '#fff',
//     letterSpacing: 2,
//   },
//   cardBottomRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   cardBalance: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#fff',
//   },
//   cardLogo: {
//     width: 60,
//     height: 25,
//   },
//   addNewCardButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//     borderRadius: 15,
//     paddingVertical: 15,
//     paddingHorizontal: 20,
//     width: width * 0.9,
//     justifyContent: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 5,
//     marginBottom: 20,
//   },
//   addNewCardText: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#0056B3',
//     marginLeft: 10,
//   },
//   bottomNavBar: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     height: 70,
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -5 },
//     shadowOpacity: 0.1,
//     shadowRadius: 5,
//     elevation: 10,
//   },
//   navItem: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 5,
//   },
//   navText: {
//     fontSize: 12,
//     color: '#666',
//     marginTop: 4,
//   },
//   navTextActive: {
//     color: '#0056B3',
//     fontWeight: 'bold',
//   },
//   // Modal Styles
//   modalOverlay: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.6)', // Semi-transparent background
//   },
//   modalContent: {
//     backgroundColor: '#fff',
//     borderRadius: 20,
//     padding: 25,
//     width: width * 0.9,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 5 },
//     shadowOpacity: 0.3,
//     shadowRadius: 10,
//     elevation: 15,
//     position: 'relative',
//   },
//   modalCloseButton: {
//     position: 'absolute',
//     top: 10,
//     right: 10,
//     padding: 5,
//     zIndex: 1,
//   },
//   modalTitle: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: '#0056B3',
//     marginBottom: 20,
//   },
//   modalCardPreview: {
//     width: '100%',
//     height: 150,
//     borderRadius: 15,
//     padding: 20,
//     marginBottom: 25,
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.2,
//     shadowRadius: 5,
//     elevation: 8,
//   },
//   modalCardText: {
//     fontSize: 16,
//     color: '#fff',
//     fontWeight: '500',
//   },
//   input: {
//     width: '100%',
//     height: 50,
//     borderColor: '#ddd',
//     borderWidth: 1,
//     borderRadius: 10,
//     paddingHorizontal: 15,
//     marginBottom: 15,
//     fontSize: 16,
//     color: '#333',
//     backgroundColor: '#f9f9f9',
//   },
//   modalAddButton: {
//     backgroundColor: '#0056B3',
//     borderRadius: 10,
//     paddingVertical: 15,
//     paddingHorizontal: 30,
//     width: '100%',
//     alignItems: 'center',
//     marginTop: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.2,
//     shadowRadius: 5,
//     elevation: 8,
//   },
//   modalAddButtonText: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#fff',
//   },
// });








import * as React from 'react'; // Changed from import React from 'react';
import { useEffect, useRef, useState } from 'react'; // Explicitly import hooks
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  Alert,
  ColorValue,
  StatusBar,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  GestureResponderEvent, // Import GestureResponderEvent
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useML } from '../app/_layout'; // Corrected path to useML

const { width } = Dimensions.get('window');

interface CardItemProps {
  bankName: string;
  balance: string;
  lastFourDigits: string;
  type: 'Visa' | 'Mastercard';
  gradientColors: readonly [ColorValue, ColorValue, ...ColorValue[]];
  logoUrl?: string;
}

const CardsScreen = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Cards');
  const [userName, setUserName] = useState('Guest');
  const [isAddCardModalVisible, setAddCardModalVisible] = useState(false);
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardCVV, setNewCardCVV] = useState('');
  const [newCardBank, setNewCardBank] = useState('');

  const screenEntryTime = useRef<number | null>(null);
  const lastTextInputTime = useRef(Date.now());
  const lastTextInputLength = useRef(0);

  const { logScreenGesture } = useML();

  useEffect(() => {
    screenEntryTime.current = Date.now();

    const fetchUserName = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString !== null) {
          const userData = JSON.parse(userDataString);
          if (userData.fullName) {
            setUserName(userData.fullName);
          }
        }
      } catch (error) {
        console.error('Error fetching user name for CardsScreen:', error);
      }
    };
    fetchUserName();

    return () => {};
  }, []);

  const handleBack = (e: GestureResponderEvent) => {
    logScreenGesture(
      'CardsScreen',
      'tap',
      { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
      { action: 'back_button' },
      null,
      screenEntryTime.current
    );
    router.back();
  };

  const handleAddCardPress = (e: GestureResponderEvent) => {
    setAddCardModalVisible(true);
    logScreenGesture(
      'CardsScreen',
      'tap',
      { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
      { action: 'add_new_card_button' },
      null,
      screenEntryTime.current
    );
  };

  const handleAddCardSubmit = (e: GestureResponderEvent) => {
    if (!newCardNumber || !newCardCVV || !newCardBank) {
      Alert.alert('Error', 'Please fill all card details.');
      return;
    }

    setAddCardModalVisible(false);
    Alert.alert('Card Added!', 'Your card will be added after 24 hours.');

    setNewCardNumber('');
    setNewCardCVV('');
    setNewCardBank('');

    logScreenGesture(
      'CardsScreen',
      'tap',
      { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
      { action: 'submit_add_card_button' },
      null,
      screenEntryTime.current
    );
  };

  const handleTextInputChange = (text: string, fieldName: string) => {
    const now = Date.now();
    const timeElapsed = now - lastTextInputTime.current;
    const charDiff = text.length - lastTextInputLength.current;

    let typingSpeed = 0;
    if (timeElapsed > 0 && charDiff !== 0) {
      typingSpeed = charDiff / (timeElapsed / 1000);
    }

    let backspacesUsed = 0;
    if (charDiff < 0) {
      backspacesUsed = Math.abs(charDiff);
    }

    logScreenGesture(
      'CardsScreen',
      'typing',
      {},
      {},
      {
        totalCharacters: text.length,
        typingSpeed: parseFloat(typingSpeed.toFixed(2)),
        backspaceCount: backspacesUsed,
        timeBetweenKeys: timeElapsed,
        fieldName: fieldName,
      },
      screenEntryTime.current
    );

    lastTextInputTime.current = now;
    lastTextInputLength.current = text.length;
  };

  const handleTextInputEndEditing = (fieldName: string) => {
    logScreenGesture(
      'CardsScreen',
      'release',
      {},
      {
        action: 'text_input_ended',
        fieldName: fieldName,
        finalValueLength:
          fieldName === 'cardNumber'
            ? newCardNumber.length
            : fieldName === 'cardCVV'
            ? newCardCVV.length
            : newCardBank.length,
      },
      null,
      screenEntryTime.current
    );
  };

  const CardItem = ({
    bankName,
    balance,
    lastFourDigits,
    type,
    gradientColors,
  }: CardItemProps) => (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardItem}
    >
      <Text style={styles.cardBankName}>{bankName}</Text>
      <Text style={styles.cardNumberDigits}>
        **** **** **** {lastFourDigits}
      </Text>
      <View style={styles.cardBottomRow}>
        <Text style={styles.cardBalance}>${balance}</Text>
        {type === 'Visa' && (
          <Image
            source={{
              uri: 'https://placehold.co/50x20/0056B3/FFFFFF?text=VISA&font=roboto&font-size=12&bold=true',
            }}
            style={styles.cardLogo}
            resizeMode="contain"
          />
        )}
        {type === 'Mastercard' && (
          <Image
            source={{
              uri: 'https://placehold.co/50x20/FFD700/000000?text=MC&font=roboto&font-size=12&bold=true',
            }}
            style={styles.cardLogo}
            resizeMode="contain"
          />
        )}
      </View>
    </LinearGradient>
  );

  return (
    <GestureHandlerRootView style={styles.fullScreenContainer}>
      {Platform.OS === 'android' && (
        <StatusBar
          backgroundColor="#E6F2FF"
          barStyle="dark-content"
        />
      )}
      <View style={styles.header}>
        <TouchableOpacity
          onPressIn={handleBack}
          style={styles.headerIcon}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#333"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cards</Text>
        <TouchableOpacity
          style={styles.headerIcon}
          onPressIn={(e) =>
            logScreenGesture(
              'CardsScreen',
              'tap',
              { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
              { action: 'more_options_icon' },
              null,
              screenEntryTime.current
            )
          }
        >
          <MaterialCommunityIcons
            name="dots-horizontal"
            size={24}
            color="#333"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
      >
        <TouchableOpacity
          onPressIn={(e) =>
            logScreenGesture(
              'CardsScreen',
              'tap',
              { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
              { action: 'card_item_visa_2026' },
              null,
              screenEntryTime.current
            )
          }
        >
          <CardItem
            bankName="CanaraSync"
            balance="5348.50"
            lastFourDigits="2026"
            type="Visa"
            gradientColors={['#FF8C00', '#FF4500'] as const}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPressIn={(e) =>
            logScreenGesture(
              'CardsScreen',
              'tap',
              { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
              { action: 'card_item_mastercard_6202' },
              null,
              screenEntryTime.current
            )
          }
        >
          <CardItem
            bankName="CanaraSync"
            balance="2187.30"
            lastFourDigits="6202"
            type="Mastercard"
            gradientColors={['#4682B4', '#8A2BE2'] as const}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPressIn={(e) =>
            logScreenGesture(
              'CardsScreen',
              'tap',
              { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
              { action: 'card_item_visa_0262' },
              null,
              screenEntryTime.current
            )
          }
        >
          <CardItem
            bankName="CanaraSync"
            balance="3490.00"
            lastFourDigits="0262"
            type="Visa"
            gradientColors={['#FF69B4', '#DA70D6'] as const}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addNewCardButton}
          onPressIn={handleAddCardPress}
        >
          <Ionicons
            name="add-circle-outline"
            size={30}
            color="#0056B3"
          />
          <Text style={styles.addNewCardText}>Add New Card</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isAddCardModalVisible}
        onRequestClose={() => {
          setAddCardModalVisible(false);
          logScreenGesture(
            'CardsScreen',
            'tap',
            { x: 0, y: 0 },
            { action: 'close_add_card_modal' },
            null,
            screenEntryTime.current
          );
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setAddCardModalVisible(false);
                logScreenGesture(
                  'CardsScreen',
                  'tap',
                  { x: 0, y: 0 },
                  { action: 'close_add_card_modal_icon' },
                  null,
                  screenEntryTime.current
                );
              }}
            >
              <Ionicons
                name="close-circle-outline"
                size={30}
                color="#666"
              />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Card</Text>

            <LinearGradient
              colors={['#A9A9A9', '#808080']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalCardPreview}
            >
              <Text style={styles.modalCardText}>**** **** **** ****</Text>
              <Text style={styles.modalCardText}>MM/YY</Text>
              <Text style={styles.modalCardText}>Card Holder Name</Text>
            </LinearGradient>

            <TextInput
              style={styles.input}
              placeholder="Enter Card Number"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={newCardNumber}
              onChangeText={(text) => {
                setNewCardNumber(text);
                handleTextInputChange(text, 'cardNumber');
              }}
              onEndEditing={() => handleTextInputEndEditing('cardNumber')}
              maxLength={16}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter CVV"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={newCardCVV}
              onChangeText={(text) => {
                setNewCardCVV(text);
                handleTextInputChange(text, 'cardCVV');
              }}
              onEndEditing={() => handleTextInputEndEditing('cardCVV')}
              maxLength={3}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter Bank Name"
              placeholderTextColor="#999"
              value={newCardBank}
              onChangeText={(text) => {
                setNewCardBank(text);
                handleTextInputChange(text, 'cardBank');
              }}
              onEndEditing={() => handleTextInputEndEditing('cardBank')}
            />

            <TouchableOpacity
              style={styles.modalAddButton}
              onPressIn={handleAddCardSubmit}
            >
              <Text style={styles.modalAddButtonText}>Add Card</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <View style={styles.bottomNavBar}>
        <TouchableOpacity
          style={styles.navItem}
          onPressIn={(e) => {
            setActiveTab('Home');
            router.replace('/HomeScreen');
            logScreenGesture(
              'CardsScreen',
              'tap',
              { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
              { action: 'nav_home' },
              null,
              screenEntryTime.current
            );
          }}
        >
          <Ionicons
            name={activeTab === 'Home' ? 'home' : 'home-outline'}
            size={24}
            color={activeTab === 'Home' ? '#0056B3' : '#666'}
          />
          <Text
            style={[
              styles.navText,
              activeTab === 'Home' && styles.navTextActive,
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPressIn={(e) => {
            setActiveTab('History');
            router.replace('/HistoryScreen');
            logScreenGesture(
              'CardsScreen',
              'tap',
              { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
              { action: 'nav_history' },
              null,
              screenEntryTime.current
            );
          }}
        >
          <MaterialCommunityIcons
            name={activeTab === 'History' ? 'history' : 'history'}
            size={24}
            color={activeTab === 'History' ? '#0056B3' : '#666'}
          />
          <Text
            style={[
              styles.navText,
              activeTab === 'History' && styles.navTextActive,
            ]}
          >
            History
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPressIn={(e) => {
            setActiveTab('Scan');
            router.replace('/QRScreen');
            logScreenGesture(
              'CardsScreen',
              'tap',
              { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
              { action: 'nav_scan' },
              null,
              screenEntryTime.current
            );
          }}
        >
          <MaterialCommunityIcons
            name="qrcode-scan"
            size={30}
            color={activeTab === 'Scan' ? '#0056B3' : '#666'}
          />
          <Text
            style={[
              styles.navText,
              activeTab === 'Scan' && styles.navTextActive,
            ]}
          >
            Scan
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPressIn={(e) => {
            setActiveTab('Cards');
            router.replace('/CardsScreen');
            logScreenGesture(
              'CardsScreen',
              'tap',
              { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
              { action: 'nav_cards' },
              null,
              screenEntryTime.current
            );
          }}
        >
          <Ionicons
            name={activeTab === 'Cards' ? 'card' : 'card-outline'}
            size={24}
            color={activeTab === 'Cards' ? '#0056B3' : '#666'}
          />
          <Text
            style={[
              styles.navText,
              activeTab === 'Cards' && styles.navTextActive,
            ]}
          >
            Cards
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPressIn={(e) => {
            setActiveTab('My Profile');
            router.replace('/ProfileScreen');
            logScreenGesture(
              'CardsScreen',
              'tap',
              { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
              { action: 'nav_profile' },
              null,
              screenEntryTime.current
            );
          }}
        >
          <Ionicons
            name={activeTab === 'My Profile' ? 'person' : 'person-outline'}
            size={24}
            color={activeTab === 'My Profile' ? '#0056B3' : '#666'}
          />
          <Text
            style={[
              styles.navText,
              activeTab === 'My Profile' && styles.navTextActive,
            ]}
          >
            My Profile
          </Text>
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
};

export default CardsScreen;

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop:
      Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 50,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  headerIcon: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 80,
  },
  cardItem: {
    width: width * 0.9,
    height: 180,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  cardBankName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardNumberDigits: {
    fontSize: 16,
    color: '#fff',
    letterSpacing: 2,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBalance: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardLogo: {
    width: 60,
    height: 25,
  },
  addNewCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: width * 0.9,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 20,
  },
  addNewCardText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0056B3',
    marginLeft: 10,
  },
  bottomNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: 70,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  navText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  navTextActive: {
    color: '#0056B3',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    width: width * 0.9,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
    position: 'relative',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0056B3',
    marginBottom: 20,
  },
  modalCardPreview: {
    width: '100%',
    height: 150,
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  modalCardText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  modalAddButton: {
    backgroundColor: '#0056B3',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 30,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  modalAddButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});
