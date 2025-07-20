import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
  StatusBar,
  GestureResponderEvent,
  ActivityIndicator, // Added for loading indicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from '@expo/vector-icons';
import { useML } from '../app/_layout'; // useML को इम्पोर्ट करें
import { GestureLog } from '../utils/logGesture'; // GestureLog इंटरफ़ेस इम्पोर्ट करें

const ProfileScreen = () => {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('CNRB0 XXXXXX');
  const [branchName, setBranchName] = useState('Connaught Place, New Delhi');
  const [gestureData, setGestureData] = useState<GestureLog[]>([]); // जेस्चर डेटा को स्टोर करने के लिए
  const [loadingGestures, setLoadingGestures] = useState(false); // लोडिंग स्टेट
  const [statusMessage, setStatusMessage] = useState(''); // स्थिति संदेश


  const screenEntryTime = useRef<number | null>(null);

  // useML से logScreenGesture, userEmail, और endSessionAndPrepareForNext प्राप्त करें
  const { logScreenGesture, userEmail: mlUserEmail, endSessionAndPrepareForNext } = useML();

  useEffect(() => {
    screenEntryTime.current = Date.now();

    const fetchUserData = async () => {
      try {
        const storedData = await AsyncStorage.getItem('userData');
        if (storedData) {
          const parsed = JSON.parse(storedData);
          setUserName(parsed.fullName || '');
          setUserEmail(parsed.email || '');
          setUserPhone(parsed.mobileNumber || '');
          setAccountNumber(parsed.accountNumber || '');
        } else {
          console.log('No user data found in AsyncStorage for ProfileScreen.');
          // If no user data, ensure the ML context email is also unknown
          setUserEmail('unknown@example.com'); 
        }
      } catch (err) {
        console.error('Failed to fetch user data from AsyncStorage:', err);
        Alert.alert('Error', 'Failed to load profile data.');
        setUserEmail('unknown@example.com'); // Fallback on error
      }
    };

    fetchUserData();

    return () => {};
  }, []);

  const handleBack = (e: GestureResponderEvent) => {
    logScreenGesture(
      'ProfileScreen',
      'tap',
      { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
      { action: 'back_button' },
      null,
      screenEntryTime.current
    );
    router.back();
  };

  const handleOptionPress = (optionName: string, e: GestureResponderEvent) => {
    logScreenGesture(
      'ProfileScreen',
      'tap',
      { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
      { action: `option_${optionName.toLowerCase().replace(/\s/g, '_')}` },
      null,
      screenEntryTime.current
    );
    Alert.alert('Functionality', `${optionName} functionality coming soon!`);
  };

  const handleClearAllGestureData = async (e: GestureResponderEvent) => {
    logScreenGesture(
      'ProfileScreen',
      'tap',
      { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
      { action: 'clear_all_gesture_data_button_prompt' },
      null,
      screenEntryTime.current
    );
    Alert.alert(
      'Clear Gesture Data',
      'Are you sure you want to clear ONLY gesture data for the current user from AsyncStorage? This will not affect your login details.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () =>
            logScreenGesture(
              'ProfileScreen',
              'tap',
              { x: 0, y: 0 },
              { action: 'clear_data_cancel_button' },
              null,
              screenEntryTime.current
            ),
        },
        {
          text: 'Clear Data',
          onPress: async () => {
            try {
              if (!mlUserEmail || mlUserEmail === 'unknown@example.com') {
                Alert.alert('Error', 'No active user to clear data for.');
                return;
              }

              const allKeys = await AsyncStorage.getAllKeys();
              const gestureDataKeys = allKeys.filter(
                (key) =>
                  key.startsWith(
                    `CanaraSyncData_User_${mlUserEmail}_Session_`
                  ) ||
                  key === `@user_session_number_${mlUserEmail}` ||
                  key === `@user_session_id_${mlUserEmail}`
              );

              if (gestureDataKeys.length > 0) {
                await AsyncStorage.multiRemove(gestureDataKeys);
                Alert.alert(
                  'Success',
                  'Selected gesture data cleared successfully!'
                );
                console.log(
                  'Cleared specific gesture data keys for user:',
                  mlUserEmail,
                  gestureDataKeys
                );
                // Clear displayed gesture data and status
                setGestureData([]);
                setStatusMessage('जेस्चर डेटा साफ़ कर दिया गया है।');
              } else {
                Alert.alert(
                  'Info',
                  'No gesture data found to clear for the current user.'
                );
              }

              logScreenGesture(
                'ProfileScreen',
                'tap',
                { x: 0, y: 0 },
                { action: 'clear_data_confirm_button' },
                null,
                screenEntryTime.current
              );
            } catch (e: any) { // Explicitly type error as any
              console.error('Failed to clear gesture data:', e);
              Alert.alert('Error', `Failed to clear gesture data: ${e.message}`);
              logScreenGesture(
                'ProfileScreen',
                'tap',
                { x: 0, y: 0 },
                { action: 'clear_data_error', errorMessage: e.message },
                null,
                screenEntryTime.current
              );
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  const handleViewAllGestureData = async (e: GestureResponderEvent) => {
    logScreenGesture(
      'ProfileScreen',
      'tap',
      { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
      { action: 'view_all_gesture_data_button' },
      null,
      screenEntryTime.current
    );
    // mlUserEmail का उपयोग करें जो useML संदर्भ से आ रहा है
    if (!mlUserEmail || mlUserEmail === 'unknown@example.com') {
      setStatusMessage('कोई सक्रिय उपयोगकर्ता ईमेल नहीं मिला जेस्चर दिखाने के लिए।');
      Alert.alert('No User Data', 'जेस्चर डेटा देखने के लिए कृपया लॉग इन करें।');
      return;
    }
    console.log('Attempting to view gesture data...');
    console.log('Current mlUserEmail:', mlUserEmail); // यहां सही ईमेल लॉग होना चाहिए
    setLoadingGestures(true);
    setGestureData([]); // पिछला डेटा साफ़ करें
    setStatusMessage('जेस्चर डेटा लोड हो रहा है...');

    try {
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('सभी AsyncStorage कुंजियाँ:', allKeys);

      // वर्तमान उपयोगकर्ता के सेशन डेटा से संबंधित कुंजियों को फ़िल्टर करें
      const userGestureKeys = allKeys.filter(key =>
        key.startsWith(`CanaraSyncData_User_${mlUserEmail}_Session_`)
      );
      console.log('वर्तमान उपयोगकर्ता के लिए फ़िल्टर की गई सेशन कुंजियाँ:', userGestureKeys);

      let collectedData: GestureLog[] = [];
      for (const key of userGestureKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          collectedData = collectedData.concat(parsed);
        }
      }

      setGestureData(collectedData);
      setStatusMessage(`कुल रॉ जेस्चर डेटा एकत्र किया गया: ${collectedData.length}`);
      console.log(`कुल रॉ जेस्चर डेटा एकत्र किया गया: ${collectedData.length}`, collectedData);
    } catch (error: any) { // Explicitly type error as any
      console.error('जेस्चर डेटा देखने में त्रुटि:', error);
      setStatusMessage(`जेस्चर डेटा लोड करने में त्रुटि: ${error.message}`);
    } finally {
      setLoadingGestures(false);
    }
  };

  const handleLogout = (e: GestureResponderEvent) => {
    logScreenGesture(
      'ProfileScreen',
      'tap',
      { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
      { action: 'logout_button_prompt' },
      null,
      screenEntryTime.current
    );
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      {
        text: 'Cancel',
        onPress: () =>
          logScreenGesture(
            'ProfileScreen',
            'tap',
            { x: 0, y: 0 },
            { action: 'logout_cancel_button' },
            null,
            screenEntryTime.current
          ),
      },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            // Call endSessionAndPrepareForNext from useML context
            if (mlUserEmail && mlUserEmail !== 'unknown@example.com') {
              await endSessionAndPrepareForNext(mlUserEmail);
            }
            await AsyncStorage.removeItem('userData'); // Clear user login data
            console.log('User data cleared from AsyncStorage. Logging out.');
            logScreenGesture(
              'ProfileScreen',
              'tap',
              { x: 0, y: 0 },
              { action: 'logout_confirm_button' },
              null,
              screenEntryTime.current
            );
            router.replace('/LoginScreen'); // Navigate to login screen
          } catch (error: any) { // Explicitly type error as any
            console.error('Error during logout:', error);
            Alert.alert('Logout Error', `Failed to log out: ${error.message}`);
            logScreenGesture(
              'ProfileScreen',
              'tap',
              { x: 0, y: 0 },
              { action: 'logout_error', errorMessage: error.message },
              null,
              screenEntryTime.current
            );
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.fullScreenContainer}>
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
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={styles.headerIconPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons
              name="person-circle"
              size={100}
              color="#0056B3"
              style={styles.profileIcon}
            />
            <TouchableOpacity
              style={styles.editProfileIcon}
              onPressIn={(e) => handleOptionPress('Edit Profile', e)}
            >
              <MaterialCommunityIcons
                name="pencil-circle"
                size={30}
                color="#0056B3"
                style={styles.editProfileIconShadow}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{userName}</Text>
          <Text style={styles.profileTagline}>Your CanaraSync.AI Profile</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoItem}>
            <Ionicons
              name="mail-outline"
              size={22}
              color="#666"
              style={styles.infoIcon}
            />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue}>{userEmail}</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <Ionicons
              name="call-outline"
              size={22}
              color="#666"
              style={styles.infoIcon}
            />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>{userPhone}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons
              name="bank-outline"
              size={22}
              color="#666"
              style={styles.infoIcon}
            />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Account Number</Text>
              <Text style={styles.infoValue}>{accountNumber}</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <FontAwesome5
              name="code-branch"
              size={20}
              color="#666"
              style={styles.infoIcon}
            />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>IFSC Code</Text>
              <Text style={styles.infoValue}>{ifscCode}</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <Ionicons
              name="business-outline"
              size={22}
              color="#666"
              style={styles.infoIcon}
            />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Branch</Text>
              <Text style={styles.infoValue}>{branchName}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security & App Settings</Text>
          <TouchableOpacity
            style={styles.optionItem}
            onPressIn={(e) => handleOptionPress('Change Password', e)}
          >
            <Ionicons
              name="lock-closed-outline"
              size={24}
              color="#0056B3"
              style={styles.optionIcon}
            />
            <Text style={styles.optionText}>Change Password</Text>
            <Ionicons
              name="chevron-forward-outline"
              size={20}
              color="#999"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.optionItem}
            onPressIn={(e) => handleOptionPress('Manage Biometrics', e)}
          >
            <Ionicons
              name="finger-print-outline"
              size={24}
              color="#0056B3"
              style={styles.optionIcon}
            />
            <Text style={styles.optionText}>Manage Biometrics</Text>
            <Ionicons
              name="chevron-forward-outline"
              size={20}
              color="#999"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.optionItem}
            onPressIn={(e) =>
              handleOptionPress('Add Trusted Person Biometric', e)
            }
          >
            <Ionicons
              name="person-add-outline"
              size={24}
              color="#0056B3"
              style={styles.optionIcon}
            />
            <Text style={styles.optionText}>Add Trusted Person Biometric</Text>
            <Ionicons
              name="chevron-forward-outline"
              size={20}
              color="#999"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.optionItem}
            onPressIn={(e) => handleOptionPress('Privacy Policy', e)}
          >
            <Ionicons
              name="document-text-outline"
              size={24}
              color="#0056B3"
              style={styles.optionIcon}
            />
            <Text style={styles.optionText}>Privacy Policy</Text>
            <Ionicons
              name="chevron-forward-outline"
              size={20}
              color="#999"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.optionItem}
            onPressIn={(e) => handleOptionPress('Help & Support', e)}
          >
            <Ionicons
              name="help-circle-outline"
              size={24}
              color="#0056B3"
              style={styles.optionIcon}
            />
            <Text style={styles.optionText}>Help & Support</Text>
            <Ionicons
              name="chevron-forward-outline"
              size={20}
              color="#999"
            />
          </TouchableOpacity>
        </View>

        {/* जेस्चर डेटा डिस्प्ले सेक्शन */}
        <View style={styles.gestureDataSection}>
          <Text style={styles.sectionTitle}>जेस्चर डेटा</Text>
          <TouchableOpacity
            style={styles.dataActionButton}
            onPressIn={handleViewAllGestureData}
          >
            <Ionicons
              name="eye-outline"
              size={24}
              color="#0056B3"
              style={styles.optionIcon}
            />
            <Text style={styles.dataActionButtonText}>सभी जेस्चर डेटा देखें</Text>
          </TouchableOpacity>
          {loadingGestures ? (
            <ActivityIndicator size="large" color="#0056B3" style={{ marginVertical: 10 }} />
          ) : (
            <>
              <Text style={styles.statusMessage}>{statusMessage}</Text>
              {gestureData.length > 0 ? (
                gestureData.map((log, index) => (
                  <View key={index} style={styles.gestureLogItem}>
                    <Text style={styles.logText}>स्क्रीन: {log.screen}</Text>
                    <Text style={styles.logText}>प्रकार: {log.gestureType}</Text>
                    <Text style={styles.logText}>टाइमस्टैम्प: {new Date(log.timestamp).toLocaleTimeString()}</Text>
                    <Text style={styles.logText}>सेशन ID: {log.sessionId}</Text>
                    {log.action && <Text style={styles.logText}>एक्शन: {log.action}</Text>}
                    {log.fieldName && <Text style={styles.logText}>फ़ील्ड: {log.fieldName}</Text>}
                    {log.typingSpeed !== undefined && <Text style={styles.logText}>टाइपिंग स्पीड: {log.typingSpeed.toFixed(2)}</Text>}
                    {/* Add more details here if needed for debugging */}
                  </View>
                ))
              ) : (
                !statusMessage.includes('लोड हो रहा है') && <Text style={styles.noDataText}>इस उपयोगकर्ता या सेशन के लिए कोई जेस्चर डेटा नहीं मिला।</Text>
              )}
            </>
          )}
          <TouchableOpacity
            style={[styles.dataActionButton, styles.clearDataButton]}
            onPressIn={handleClearAllGestureData}
          >
            <Ionicons
              name="trash-outline"
              size={24}
              color="#D32F2F"
              style={styles.optionIcon}
            />
            <Text style={[styles.dataActionButtonText, { color: '#D32F2F' }]}>
              सभी जेस्चर डेटा साफ़ करें
            </Text>
          </TouchableOpacity>
        </View>


        <TouchableOpacity
          style={styles.logoutButton}
          onPressIn={handleLogout}
        >
          <Ionicons
            name="log-out-outline"
            size={24}
            color="#D32F2F"
            style={styles.optionIcon}
          />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.bottomNavBar}>
        <TouchableOpacity
          style={styles.navItem}
          onPressIn={(e) => {
            logScreenGesture(
              'ProfileScreen',
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
            name={'home-outline'}
            size={24}
            color={'#666'}
          />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPressIn={(e) => {
            logScreenGesture(
              'ProfileScreen',
              'tap',
              { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
              { action: 'nav_history' },
              null,
              screenEntryTime.current
            );
            router.replace('/HistoryScreen');
          }}
        >
          <MaterialCommunityIcons
            name={'history'}
            size={24}
            color={'#666'}
          />
          <Text style={styles.navText}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPressIn={(e) => {
            logScreenGesture(
              'ProfileScreen',
              'tap',
              { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
              { action: 'nav_scan' },
              null,
              screenEntryTime.current
            );
            router.replace('/QRScreen');
          }}
        >
          <MaterialCommunityIcons
            name="qrcode-scan"
            size={30}
            color={'#0056B3'}
          />
          <Text
            style={[styles.navText, { color: '#0056B3', fontWeight: 'bold' }]}
          >
            Scan
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPressIn={(e) => {
            logScreenGesture(
              'ProfileScreen',
              'tap',
              { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
              { action: 'nav_cards' },
              null,
              screenEntryTime.current
            );
            router.replace('/CardsScreen');
          }}
        >
          <Ionicons
            name={'card-outline'}
            size={24}
            color={'#666'}
          />
          <Text style={styles.navText}>Cards</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPressIn={(e) => {
            logScreenGesture(
              'ProfileScreen',
              'tap',
              { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
              { action: 'nav_profile' },
              null,
              screenEntryTime.current
            );
            router.replace('/ProfileScreen');
          }}
        >
          <Ionicons
            name={'person'}
            size={24}
            color={'#0056B3'}
          />
          <Text
            style={[styles.navText, { color: '#0056B3', fontWeight: 'bold' }]}
          >
            My Profile
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProfileScreen;

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
  headerIconPlaceholder: {
    width: 24 + 10,
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
    paddingVertical: 20,
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profileIcon: {},
  editProfileIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  editProfileIconShadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  profileTagline: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0056B3',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoIcon: {
    marginRight: 15,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionIcon: {
    marginRight: 15,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    marginTop: 20,
    marginBottom: 20,
  },
  logoutButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginLeft: 10,
  },
  dataActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    marginTop: 10,
  },
  dataActionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0056B3',
    marginLeft: 10,
  },
  clearDataButton: {
    borderColor: '#D32F2F',
    borderWidth: 1,
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
  gestureDataSection: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  statusMessage: {
    textAlign: 'center',
    marginVertical: 10,
    color: '#555',
  },
  gestureLogItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginHorizontal: 20,
  },
  logText: {
    fontSize: 14,
    color: '#333',
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
    color: '#888',
  },
});
