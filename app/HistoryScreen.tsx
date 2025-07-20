import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
  GestureResponderEvent,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { useML } from '../app/_layout';

const HistoryScreen = () => {
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('All');

  const screenEntryTime = useRef<number | null>(null);
  const scrollOffset = useRef({ lastOffset: 0, lastTime: 0 });

  const { logScreenGesture } = useML();

  useEffect(() => {
    screenEntryTime.current = Date.now();

    const fetchTransactions = async () => {
      try {
        const mockTransactions = [
          {
            id: '1',
            type: 'Received',
            amount: '₹500.00',
            from: 'Sneha Kumari', // Changed name
            date: '2024-07-15',
            status: 'Completed',
          },
          {
            id: '2',
            type: 'Sent',
            amount: '₹250.00',
            to: 'Shanti Gautam', // Changed name
            date: '2024-07-14',
            status: 'Completed',
          },
          {
            id: '3',
            type: 'Received',
            amount: '₹1200.00',
            from: 'Anchal Malik', // Changed name
            date: '2024-07-13',
            status: 'Completed',
          },
          {
            id: '4',
            type: 'Sent',
            amount: '₹75.00',
            to: 'Simran Singh', // Changed name
            date: '2024-07-12',
            status: 'Completed',
          },
          {
            id: '5',
            type: 'Received',
            amount: '₹300.00',
            from: 'Astuti', // Changed name
            date: '2024-07-11',
            status: 'Pending',
          },
          {
            id: '6',
            type: 'Sent',
            amount: '₹150.00',
            to: 'Sonam', // Changed name
            date: '2024-07-10',
            status: 'Completed',
          },
          {
            id: '7',
            type: 'Received',
            amount: '₹800.00',
            from: 'Archita', // Changed name
            date: '2024-07-09',
            status: 'Completed',
          },
          {
            id: '8',
            type: 'Sent',
            amount: '₹50.00',
            to: 'Rohan Sharma', // Added a new Indian name
            date: '2024-07-08',
            status: 'Failed',
          },
          {
            id: '9',
            type: 'Received',
            amount: '₹200.00',
            from: 'Priya Devi', // Added a new Indian name
            date: '2024-07-07',
            status: 'Completed',
          },
          {
            id: '10',
            type: 'Sent',
            amount: '₹1000.00',
            to: 'Vikram Patel', // Added a new Indian name
            date: '2024-07-06',
            status: 'Completed',
          },
        ];
        setTransactions(mockTransactions);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        Alert.alert('Error', 'Failed to load transactions.');
      }
    };

    fetchTransactions();

    return () => {};
  }, []);

  const handleBack = (e: GestureResponderEvent) => {
    logScreenGesture(
      'HistoryScreen',
      'tap',
      { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
      { action: 'back_button' },
      null,
      screenEntryTime.current
    );
    router.back();
  };

  const handleTabPress = (tabName: string, e: GestureResponderEvent) => {
    setActiveTab(tabName);
    logScreenGesture(
      'HistoryScreen',
      'tap',
      { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
      { action: `tab_press_${tabName.toLowerCase()}` },
      null,
      screenEntryTime.current
    );
  };

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
        'HistoryScreen',
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

  const filteredTransactions = transactions.filter((transaction) => {
    if (activeTab === 'All') {
      return true;
    }
    return transaction.type === activeTab;
  });

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
        <Text style={styles.headerTitle}>Transaction History</Text>
        <TouchableOpacity
          style={styles.headerIcon}
          onPressIn={(e) =>
            logScreenGesture(
              'HistoryScreen',
              'tap',
              { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
              { action: 'filter_icon' },
              null,
              screenEntryTime.current
            )
          }
        >
          <Ionicons
            name="filter-outline"
            size={24}
            color="#333"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'All' && styles.activeTab]}
          onPressIn={(e) => handleTabPress('All', e)}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'All' && styles.activeTabText,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'Sent' && styles.activeTab]}
          onPressIn={(e) => handleTabPress('Sent', e)}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'Sent' && styles.activeTabText,
            ]}
          >
            Sent
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'Received' && styles.activeTab,
          ]}
          onPressIn={(e) => handleTabPress('Received', e)}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'Received' && styles.activeTabText,
            ]}
          >
            Received
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((transaction) => (
            <TouchableOpacity
              key={transaction.id}
              style={styles.transactionItem}
              onPressIn={(e) =>
                logScreenGesture(
                  'HistoryScreen',
                  'tap',
                  { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
                  { action: `transaction_item_${transaction.id}` },
                  null,
                  screenEntryTime.current
                )
              }
            >
              <View style={styles.transactionIconContainer}>
                {transaction.type === 'Received' ? (
                  <Ionicons
                    name="arrow-down-circle-outline"
                    size={24}
                    color="#28A745"
                  />
                ) : (
                  <Ionicons
                    name="arrow-up-circle-outline"
                    size={24}
                    color="#DC3545"
                  />
                )}
              </View>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionDescription}>
                  {transaction.type === 'Received'
                    ? `Received from ${transaction.from}`
                    : `Sent to ${transaction.to}`}
                </Text>
                <Text style={styles.transactionDate}>{transaction.date}</Text>
              </View>
              <View style={styles.transactionAmountStatus}>
                <Text
                  style={[
                    styles.transactionAmount,
                    transaction.type === 'Received'
                      ? styles.amountReceived
                      : styles.amountSent,
                  ]}
                >
                  {transaction.amount}
                </Text>
                <Text
                  style={[
                    styles.transactionStatus,
                    transaction.status === 'Completed' &&
                      styles.statusCompleted,
                    transaction.status === 'Pending' && styles.statusPending,
                    transaction.status === 'Failed' && styles.statusFailed,
                  ]}
                >
                  {transaction.status}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noTransactionsText}>No transactions found.</Text>
        )}
      </ScrollView>

      <View style={styles.bottomNavBar}>
        <TouchableOpacity
          style={styles.navItem}
          onPressIn={(e) => {
            setActiveTab('Home');
            router.replace('/HomeScreen');
            logScreenGesture(
              'HistoryScreen',
              'tap',
              { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
              { action: 'nav_home' },
              null,
              screenEntryTime.current
            );
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
            setActiveTab('History');
            router.replace('/HistoryScreen');
            logScreenGesture(
              'HistoryScreen',
              'tap',
              { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
              { action: 'nav_history' },
              null,
              screenEntryTime.current
            );
          }}
        >
          <MaterialCommunityIcons
            name={'history'}
            size={24}
            color={'#0056B3'}
          />
          <Text
            style={[styles.navText, { color: '#0056B3', fontWeight: 'bold' }]}
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
              'HistoryScreen',
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
            color={'#666'}
          />
          <Text style={styles.navText}>Scan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPressIn={(e) => {
            setActiveTab('Cards');
            router.replace('/CardsScreen');
            logScreenGesture(
              'HistoryScreen',
              'tap',
              { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
              { action: 'nav_cards' },
              null,
              screenEntryTime.current
            );
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
            setActiveTab('My Profile');
            router.replace('/ProfileScreen');
            logScreenGesture(
              'HistoryScreen',
              'tap',
              { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
              { action: 'nav_profile' },
              null,
              screenEntryTime.current
            );
          }}
        >
          <Ionicons
            name={'person-outline'}
            size={24}
            color={'#666'}
          />
          <Text style={styles.navText}>My Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HistoryScreen;

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
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTab: {
    backgroundColor: '#E6F2FF',
  },
  activeTabText: {
    color: '#0056B3',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionIconContainer: {
    marginRight: 15,
    width: 30,
    alignItems: 'center',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionAmountStatus: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  amountReceived: {
    color: '#28A745',
  },
  amountSent: {
    color: '#DC3545',
  },
  transactionStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusCompleted: {
    color: '#28A745',
  },
  statusPending: {
    color: '#FFC107',
  },
  statusFailed: {
    color: '#DC3545',
  },
  noTransactionsText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
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
