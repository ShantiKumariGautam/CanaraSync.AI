
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Platform,
  StatusBar,
  TextInput,
  Alert,
  ToastAndroid,
  NativeScrollEvent,
  NativeSyntheticEvent,
  GestureResponderEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useML } from '../app/_layout';

const { width, height } = Dimensions.get('window');

const QRScreen = () => {
  const router = useRouter();
  const [qrCodeData, setQrCodeData] = useState('canarasync.ai/scan/user123');

  const screenEntryTime = useRef<number | null>(null);
  const scrollOffset = useRef({ lastOffset: 0, lastTime: 0 });
  const lastTextInputTime = useRef(Date.now());
  const lastTextInputLength = useRef(0);

  const { logScreenGesture } = useML();

  useEffect(() => {
    screenEntryTime.current = Date.now();

    return () => {};
  }, []);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const time = Date.now();
    const timeDiff = time - scrollOffset.current.lastTime;
    const distance = Math.abs(currentOffset - scrollOffset.current.lastOffset);

    let scrollSpeed = 0;
    if (timeDiff > 0) {
      scrollSpeed = distance / (timeDiff / 1000);
    }

    if (distance > 5 || timeDiff > 100) {
      logScreenGesture(
        'QRScreen',
        'scroll',
        { y: currentOffset },
        {
          scrollOffset: currentOffset,
          scrollSpeed: parseFloat(scrollSpeed.toFixed(2)),
          scrollDistance: distance,
        },
        null,
        screenEntryTime.current
      );
    }
    scrollOffset.current.lastOffset = currentOffset;
    scrollOffset.current.lastTime = time;
  };

  const handleGenerateQR = (e: GestureResponderEvent) => {
    const newCode = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
      qrCodeData
    )}`;
    setQrCodeData(newCode);
    logScreenGesture(
      'QRScreen',
      'tap',
      { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
      { action: 'generate_qr_button' },
      null,
      screenEntryTime.current
    );

    if (Platform.OS === 'android') {
      ToastAndroid.show('QR Code generated!', ToastAndroid.SHORT);
    } else {
      Alert.alert('Success', 'QR Code generated!');
    }
  };

  const handleScanQRCode = (e: GestureResponderEvent) => {
    Alert.alert('Scan QR Code', 'Opening camera to scan QR code...');
    logScreenGesture(
      'QRScreen',
      'tap',
      { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
      { action: 'scan_qr_code_button' },
      null,
      screenEntryTime.current
    );
  };

  const handleTextInputChange = (text: string) => {
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
      'QRScreen',
      'typing',
      {},
      {},
      {
        totalCharacters: text.length,
        typingSpeed: parseFloat(typingSpeed.toFixed(2)),
        backspaceCount: backspacesUsed,
        timeBetweenKeys: timeElapsed,
        fieldName: 'qr_code_data_input',
      },
      screenEntryTime.current
    );

    lastTextInputTime.current = now;
    lastTextInputLength.current = text.length;
  };

  const handleTextInputEndEditing = () => {
    logScreenGesture(
      'QRScreen',
      'release',
      {},
      {
        action: 'text_input_ended',
        fieldName: 'qr_code_data_input',
        finalValueLength: qrCodeData.length,
      },
      null,
      screenEntryTime.current
    );
  };

  const headerHeight =
    Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 70 : 90;

  const Content = () => (
    <ScrollView
      style={[styles.scrollView, { paddingTop: headerHeight }]}
      contentContainerStyle={styles.scrollContainer}
      scrollEventThrottle={16}
      onScroll={onScroll}
    >
      <View style={styles.contentWrapper}>
        <Text style={styles.instructionText}>Receive Money via QR</Text>

        <View style={styles.qrCodeContainer}>
          <Image
            source={{
              uri: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                qrCodeData
              )}`,
            }}
            style={styles.qrCodeImage}
            onError={() => {
              Alert.alert('Error', 'Failed to load QR code image');
            }}
          />
          <Text style={styles.qrCodeLabel}>Scan to Pay</Text>
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.canaraSyncPaymentInput}
            value="CanaraSync.AI Payment"
            editable={false}
            onChangeText={handleTextInputChange}
            onEndEditing={handleTextInputEndEditing}
          />
        </View>

        <TouchableOpacity
          style={styles.generateQrButton}
          onPressIn={handleGenerateQR}
        >
          <Text style={styles.generateQrButtonText}>Generate QR</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.scanQrButton}
          onPressIn={handleScanQRCode}
        >
          <MaterialCommunityIcons
            name="qrcode-scan"
            size={24}
            color="#fff"
            style={styles.scanQrButtonIcon}
          />
          <Text style={styles.scanQrButtonText}>Scan QR Code to Pay</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.fullScreenContainer}>
      {Platform.OS === 'android' && (
        <StatusBar
          backgroundColor="#E6F2FF"
          barStyle="dark-content"
        />
      )}

      <View style={styles.fixedHeaderBar}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPressIn={(e) => {
            logScreenGesture(
              'QRScreen',
              'tap',
              { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
              { action: 'back_button' },
              null,
              screenEntryTime.current
            );
            router.back();
          }}
        >
          <Ionicons
            name="arrow-back-outline"
            size={24}
            color="#333"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My QR Code</Text>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPressIn={(e) =>
            logScreenGesture(
              'QRScreen',
              'tap',
              { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
              { action: 'help_button' },
              null,
              screenEntryTime.current
            )
          }
        >
          <Ionicons
            name="help-circle-outline"
            size={24}
            color="#333"
          />
        </TouchableOpacity>
      </View>

      <Content />

      <View style={styles.bottomNavBar}>
        <TouchableOpacity
          style={styles.navItem}
          onPressIn={(e) => {
            logScreenGesture(
              'QRScreen',
              'tap',
              { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
              { action: 'nav_home' },
              null,
              screenEntryTime.current
            );
            router.replace('/HomeScreen');
          }}
        >
          <Ionicons
            name="home-outline"
            size={24}
            color="#666"
          />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPressIn={(e) => {
            logScreenGesture(
              'QRScreen',
              'tap',
              { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
              { action: 'nav_history' },
              null,
              screenEntryTime.current
            );
            router.push('/HistoryScreen');
          }}
        >
          <MaterialCommunityIcons
            name="history"
            size={24}
            color="#666"
          />
          <Text style={styles.navText}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPressIn={(e) =>
            logScreenGesture(
              'QRScreen',
              'tap',
              { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
              { action: 'nav_scan' },
              null,
              screenEntryTime.current
            )
          }
        >
          <MaterialCommunityIcons
            name="qrcode-scan"
            size={30}
            color="#0056B3"
          />
          <Text style={[styles.navText, styles.navTextActive]}>Scan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPressIn={(e) => {
            logScreenGesture(
              'QRScreen',
              'tap',
              { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
              { action: 'nav_cards' },
              null,
              screenEntryTime.current
            );
            router.push('/CardsScreen');
          }}
        >
          <Ionicons
            name="card-outline"
            size={24}
            color="#666"
          />
          <Text style={styles.navText}>Cards</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPressIn={(e) => {
            logScreenGesture(
              'QRScreen',
              'tap',
              { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
              { action: 'nav_profile' },
              null,
              screenEntryTime.current
            );
            router.push('/ProfileScreen');
          }}
        >
          <Ionicons
            name="person-outline"
            size={24}
            color="#666"
          />
          <Text style={styles.navText}>My Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default QRScreen;

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  fixedHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E6F2FF',
    paddingHorizontal: 15,
    paddingVertical: 15,
    paddingTop:
      Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 6,
    zIndex: 10,
  },
  headerIconBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0056B3',
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  contentWrapper: {
    paddingHorizontal: 20,
    marginTop: 0,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0056B3',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  qrCodeContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  qrCodeImage: {
    width: 250,
    height: 250,
    marginBottom: 15,
    borderRadius: 10,
  },
  qrCodeLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  qrCodeDetails: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  inputWrapper: {
    width: '100%',
    marginBottom: 20,
  },
  canaraSyncPaymentInput: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  generateQrButton: {
    backgroundColor: '#0056B3',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  generateQrButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  scanQrButton: {
    backgroundColor: '#28A745',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  scanQrButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  scanQrButtonIcon: {
    marginRight: 10,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
    width: '100%',
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    marginVertical: 20,
  },
  additionalInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  additionalInfoText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 30,
  },
  recentActivityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  recentActivityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  recentActivityText: {
    fontSize: 15,
    color: '#333',
  },
  recentActivityAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0056B3',
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
});
