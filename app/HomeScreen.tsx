import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TextInput,
  Platform,
  StatusBar,
  Alert,
  PanResponderInstance,
  GestureResponderEvent,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createPanGestureLogger } from '../utils/logGesture';
import { useML } from '../app/_layout';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const router = useRouter();
  const [userName, setUserName] = useState('Guest');
  const [balance, setBalance] = useState('90,560');
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState('Home');

  const screenEntryTime = useRef<number | null>(null);
  const panResponder = useRef<PanResponderInstance | null>(null);

  const scrollOffset = useRef({ lastOffset: 0, lastTime: 0 });
  const textInputRef = useRef<TextInput>(null);
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
        console.error('Error fetching user name:', error);
      }
    };
    fetchUserName();

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
        'HomeScreen',
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
      'HomeScreen',
      'typing',
      {},
      {},
      {
        totalCharacters: text.length,
        typingSpeed: parseFloat(typingSpeed.toFixed(2)),
        backspaceCount: backspacesUsed,
        timeBetweenKeys: timeElapsed,
        fieldName: 'search_input',
      },
      screenEntryTime.current
    );

    lastTextInputTime.current = now;
    lastTextInputLength.current = text.length;
  };

  const handleTextInputEndEditing = () => {
    logScreenGesture(
      'HomeScreen',
      'release',
      {},
      {
        action: 'text_input_ended',
        fieldName: 'search_input',
        finalValueLength: lastTextInputLength.current,
      },
      null,
      screenEntryTime.current
    );
  };

  const handlePress = (action: string, e: GestureResponderEvent) => {
    logScreenGesture(
      'HomeScreen',
      'tap',
      { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
      { action: action },
      null,
      screenEntryTime.current
    );
  };

  const headerHeight =
    Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 70 : 90;
  const bottomNavHeight = 70;

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      {Platform.OS === 'android' && (
        <StatusBar
          backgroundColor="#E6F2FF"
          barStyle="dark-content"
        />
      )}

      <View style={styles.fixedHeaderBar}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPressIn={(e) => handlePress('profile_logo', e)}
          >
            <Image
              source={require('../assets/placeholder.png')}
              style={styles.profileLogo}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text style={styles.canaraSyncTextLogo}>CanaraSync.AI</Text>
        </View>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPressIn={(e) => handlePress('notifications_icon', e)}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color="#333"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContentContainer,
          {
            paddingTop: headerHeight,
            paddingBottom: bottomNavHeight + 40,
          },
        ]}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.contentWrapper}>
          <View style={styles.welcomeGreetingContainer}>
            <Text style={styles.welcomeGreetingText}>
              Welcome, {userName.split(' ')[0]}!
            </Text>
          </View>
          <View style={styles.searchBarContainer}>
            <Ionicons
              name="search-outline"
              size={20}
              color="#666"
              style={styles.searchIcon}
            />
            <TextInput
              ref={textInputRef}
              style={styles.searchInput}
              placeholder="Search a service..."
              placeholderTextColor="#999"
              onChangeText={handleTextInputChange}
              onEndEditing={handleTextInputEndEditing}
            />
            <TouchableOpacity onPressIn={(e) => handlePress('mic_icon', e)}>
              <MaterialCommunityIcons
                name="microphone-outline"
                size={20}
                color="#666"
                style={styles.micIcon}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.navTabsContainer}>
            <TouchableOpacity
              style={styles.navTab}
              onPressIn={(e) => handlePress('nav_tab_overview', e)}
            >
              <Text style={styles.navTabTextActive}>Overview</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navTab}
              onPressIn={(e) => handlePress('nav_tab_pay', e)}
            >
              <Text style={styles.navTabText}>Pay</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navTab}
              onPressIn={(e) => handlePress('nav_tab_save', e)}
            >
              <Text style={styles.navTabText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navTab}
              onPressIn={(e) => handlePress('nav_tab_invest', e)}
            >
              <Text style={styles.navTabText}>Invest</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewTitle}>Overview</Text>
            <Text style={styles.accountType}>Savings A/c</Text>
            <Text style={styles.accountNumberFull}>1234 5678 9000</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceAmountOverview}>
                ₹{showBalance ? balance : '*******'}
              </Text>
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => {
                  setShowBalance(!showBalance);
                  logScreenGesture(
                    'HomeScreen',
                    'tap',
                    { x: 0, y: 0 },
                    {
                      action: 'toggle_balance_visibility',
                      newVisibility: !showBalance,
                    },
                    null,
                    screenEntryTime.current
                  );
                }}
              >
                <Ionicons
                  name={showBalance ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.balanceLabelOverview}>Available Balance</Text>
            <TouchableOpacity
              style={styles.viewAllAccountsButton}
              onPressIn={(e) => handlePress('view_all_accounts_button', e)}
            >
              <Text style={styles.viewAllAccountsText}>View all accounts</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.servicesSection}>
            <Text style={styles.servicesTitle}>Services</Text>
            <View style={styles.servicesGrid}>
              <TouchableOpacity
                style={styles.serviceItem}
                onPressIn={(e) => handlePress('service_money_transfer', e)}
              >
                <MaterialCommunityIcons
                  name="send-outline"
                  size={28}
                  color="#0056B3"
                />
                <Text style={styles.serviceText}>Money Transfer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.serviceItem}
                onPressIn={(e) => handlePress('service_upi_transfer', e)}
              >
                <MaterialCommunityIcons
                  name="currency-inr"
                  size={28}
                  color="#0056B3"
                />
                <Text style={styles.serviceText}>UPI Transfer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.serviceItem}
                onPressIn={(e) => handlePress('service_other_bank_transfer', e)}
              >
                <MaterialCommunityIcons
                  name="bank-transfer-out"
                  size={28}
                  color="#0056B3"
                />
                <Text style={styles.serviceText}>Other Bank Transfer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.serviceItem}
                onPressIn={(e) => handlePress('service_bill_payments', e)}
              >
                <MaterialCommunityIcons
                  name="script-text-outline"
                  size={28}
                  color="#0056B3"
                />
                <Text style={styles.serviceText}>Bill Payments</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.serviceItem}
                onPressIn={(e) => handlePress('service_add_payee', e)}
              >
                <Ionicons
                  name="person-add-outline"
                  size={28}
                  color="#0056B3"
                />
                <Text style={styles.serviceText}>Add Payee</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.serviceItem}
                onPressIn={(e) => handlePress('service_recharge', e)}
              >
                <Ionicons
                  name="call-outline"
                  size={28}
                  color="#0056B3"
                />
                <Text style={styles.serviceText}>Recharge</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.additionalFeatureCard}
            onPressIn={(e) => handlePress('add_another_account_card', e)}
          >
            <Ionicons
              name="add-circle-outline"
              size={30}
              color="#0056B3"
            />
            <Text style={styles.additionalFeatureText}>
              Add Another Account
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.additionalFeatureCard}
            onPressIn={(e) => handlePress('explore_loan_offers_card', e)}
          >
            <MaterialCommunityIcons
              name="hand-coin-outline"
              size={30}
              color="#0056B3"
            />
            <Text style={styles.additionalFeatureText}>
              Explore Loan Offers
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomNavBar}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setActiveTab('Home');
            router.replace('/HomeScreen');
            logScreenGesture(
              'HomeScreen',
              'tap',
              { x: 0, y: 0 },
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
          onPress={() => {
            setActiveTab('History');
            router.push('/HistoryScreen');
            logScreenGesture(
              'HomeScreen',
              'tap',
              { x: 0, y: 0 },
              { action: 'nav_history' },
              null,
              screenEntryTime.current
            );
          }}
        >
          <MaterialCommunityIcons
            name="history"
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
          onPress={() => {
            setActiveTab('Scan');
            router.push('/QRScreen');
            logScreenGesture(
              'HomeScreen',
              'tap',
              { x: 0, y: 0 },
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
          onPress={() => {
            setActiveTab('Cards');
            router.push('/CardsScreen');
            logScreenGesture(
              'HomeScreen',
              'tap',
              { x: 0, y: 0 },
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
          onPress={() => {
            setActiveTab('My Profile');
            router.push('/ProfileScreen');
            logScreenGesture(
              'HomeScreen',
              'tap',
              { x: 0, y: 0 },
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
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  safeAreaContainer: {
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  canaraSyncTextLogo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0056B3',
    marginLeft: 12,
  },
  headerIconBtn: {
    padding: 8,
  },
  profileLogo: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  contentWrapper: {
    paddingHorizontal: 20,
  },
  welcomeGreetingContainer: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 5,
    marginTop: 0,
  },
  welcomeGreetingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  micIcon: {
    marginLeft: 10,
  },
  navTabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  navTab: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  navTabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  navTabTextActive: {
    fontSize: 16,
    color: '#0056B3',
    fontWeight: 'bold',
    borderBottomWidth: 2,
    borderColor: '#0056B3',
  },
  overviewCard: {
    backgroundColor: '#0056B3',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  accountType: {
    fontSize: 16,
    color: '#E0E0E0',
    marginBottom: 5,
  },
  accountNumberFull: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  balanceAmountOverview: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  eyeIcon: {
    padding: 5,
  },
  balanceLabelOverview: {
    fontSize: 14,
    color: '#E0E0E0',
  },
  viewAllAccountsButton: {
    alignSelf: 'flex-end',
    marginTop: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  viewAllAccountsText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
  servicesSection: {
    marginBottom: 20,
  },
  servicesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  serviceItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: (width - 80) / 3,
    aspectRatio: 1,
    marginBottom: 15,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  serviceText: {
    fontSize: 12,
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  additionalFeatureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: '100%',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    marginTop: 10,
  },
  additionalFeatureText: {
    fontSize: 16,
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
});
