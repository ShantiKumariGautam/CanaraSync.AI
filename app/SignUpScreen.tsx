import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  StatusBar,
  GestureResponderEvent,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { useML } from '../app/_layout'; // Correct import for useML

const SignUpScreen = () => {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const screenEntryTime = useRef<number | null>(null);
  const lastKeyTime = useRef<number | null>(null);
  const lastTextInputLength = useRef(0);

  // Destructure logScreenGesture, setActiveUserSession, and endSessionAndPrepareForNext from useML
  const {
    logScreenGesture,
    setActiveUserSession,
    endSessionAndPrepareForNext,
  } = useML();

  useEffect(() => {
    screenEntryTime.current = Date.now();
    return () => {};
  }, []);

  const handleTextInputKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    fieldName: string
  ) => {
    if (e.nativeEvent.key === 'Backspace') {
      logScreenGesture(
        'SignUpScreen',
        'typing',
        {},
        { fieldName: fieldName }, // Context for which field
        { backspaceCount: 1 },
        screenEntryTime.current
      );
    }
  };

  const handleTextInputChange = (
    text: string,
    fieldName: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    setter(text);

    const now = Date.now();
    const timeElapsed = now - (lastKeyTime.current || now);
    const charDiff = text.length - lastTextInputLength.current;

    let typingSpeed = 0;
    if (timeElapsed > 0 && charDiff !== 0) {
      typingSpeed = charDiff / (timeElapsed / 1000);
    }

    lastKeyTime.current = now;
    lastTextInputLength.current = text.length;

    logScreenGesture(
      'SignUpScreen',
      'typing',
      {},
      { fieldName: fieldName }, // Context for which field
      {
        totalCharacters: text.length,
        typingSpeed: parseFloat(typingSpeed.toFixed(2)),
        timeBetweenKeys: timeElapsed,
        keyHoldDuration: 50, // Placeholder, actual key hold duration needs native module
      },
      screenEntryTime.current
    );
  };

  const handleFocus = (fieldName: string) => {
    logScreenGesture(
      'SignUpScreen',
      'focus',
      {},
      { fieldName: fieldName },
      null,
      screenEntryTime.current
    );
  };

  const handleBlur = (fieldName: string) => {
    logScreenGesture(
      'SignUpScreen',
      'blur',
      {},
      { fieldName: fieldName },
      null,
      screenEntryTime.current
    );
  };

  const handleSignUp = async (e: GestureResponderEvent) => {
    logScreenGesture(
      'SignUpScreen',
      'tap',
      { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
      { action: 'SignUpButton' },
      null,
      screenEntryTime.current
    );

    if (
      !fullName ||
      !accountNumber ||
      !mobileNumber ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    try {
      console.log('Attempting to retrieve existing users from AsyncStorage...');
      const existingData = await AsyncStorage.getItem('@users');
      const users = existingData ? JSON.parse(existingData) : [];
      console.log('Existing users retrieved:', users);

      const userExists = users.find(
        (user: any) => user.email.toLowerCase() === email.toLowerCase()
      );
      if (userExists) {
        Alert.alert('Error', 'User with this email already exists.');
        logScreenGesture(
          'SignUpScreen',
          'signup_failed',
          {},
          { emailAttempted: email, reason: 'UserExists' },
          null,
          screenEntryTime.current
        );
        return;
      }

      const newUser = {
        fullName,
        accountNumber,
        mobileNumber,
        email,
        password,
      };

      const updatedUsers = [...users, newUser];
      console.log('New user to be added:', newUser);
      console.log('Updated users array:', updatedUsers);

      await AsyncStorage.setItem('@users', JSON.stringify(updatedUsers));
      console.log('Users array successfully saved to AsyncStorage.');

      await AsyncStorage.setItem('userData', JSON.stringify(newUser));
      console.log('Current user data successfully saved to AsyncStorage.');

      // Set the active user session in the ML context
      await setActiveUserSession(newUser.email, newUser.fullName);

      // Removed the premature call to endSessionAndPrepareForNext here.
      // The session should remain active after signup.
      // await endSessionAndPrepareForNext(newUser.email); // REMOVED THIS LINE

      // Log signup success
      logScreenGesture(
        'SignUpScreen',
        'signup_success',
        {},
        { userEmail: newUser.email, username: newUser.fullName },
        null,
        screenEntryTime.current
      );

      Alert.alert('Success', 'Account created successfully!');
      router.replace('/ConsentScreen');
    } catch (error: any) {
      // Cast error to any
      console.error(
        'Signup Error:',
        error,
        'Full error:',
        JSON.stringify(error)
      );
      Alert.alert('Error', 'Something went wrong during signup.');
      logScreenGesture(
        'SignUpScreen',
        'signup_error',
        {},
        { errorMessage: error.message },
        null,
        screenEntryTime.current
      );
    }
  };

  const navigateToLogin = (e: GestureResponderEvent) => {
    logScreenGesture(
      'SignUpScreen',
      'tap',
      { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
      { action: 'LoginLink' },
      null,
      screenEntryTime.current
    );
    router.push('/LoginScreen');
  };

  return (
    <View style={styles.fullScreenContainer}>
      {Platform.OS === 'android' && (
        <StatusBar
          backgroundColor="#E6F2FF"
          barStyle="dark-content"
        />
      )}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        style={styles.scrollView}
      >
        <View style={styles.container}>
          <View style={styles.headerSection}>
            <View style={styles.appLogoPlaceholder}>
              <Image
                source={require('../assets/placeholder.png')} // Ensure this path is correct
                style={styles.appLogoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.mainTitle}>Create Your Account</Text>
            <Text style={styles.subtitle}>
              Join CanaraSync.AI for secure banking.
            </Text>
          </View>

          <View style={styles.inputCard}>
            <View style={styles.inputGroup}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#999"
                value={fullName}
                onChangeText={(text) =>
                  handleTextInputChange(text, 'fullName', setFullName)
                }
                onKeyPress={(e) => handleTextInputKeyPress(e, 'fullName')}
                onFocus={() => handleFocus('fullName')}
                onBlur={() => handleBlur('fullName')}
              />
            </View>

            <View style={styles.inputGroup}>
              <MaterialCommunityIcons
                name="bank-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Bank Account Number"
                placeholderTextColor="#999"
                value={accountNumber}
                onChangeText={(text) =>
                  handleTextInputChange(text, 'accountNumber', setAccountNumber)
                }
                keyboardType="numeric"
                onKeyPress={(e) => handleTextInputKeyPress(e, 'accountNumber')}
                onFocus={() => handleFocus('accountNumber')}
                onBlur={() => handleBlur('accountNumber')}
              />
            </View>

            <View style={styles.inputGroup}>
              <Ionicons
                name="call-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Mobile Number"
                placeholderTextColor="#999"
                value={mobileNumber}
                onChangeText={(text) =>
                  handleTextInputChange(text, 'mobileNumber', setMobileNumber)
                }
                keyboardType="phone-pad"
                onKeyPress={(e) => handleTextInputKeyPress(e, 'mobileNumber')}
                onFocus={() => handleFocus('mobileNumber')}
                onBlur={() => handleBlur('mobileNumber')}
              />
            </View>

            <View style={styles.inputGroup}>
              <MaterialCommunityIcons
                name="email-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#999"
                value={email}
                onChangeText={(text) =>
                  handleTextInputChange(text, 'email', setEmail)
                }
                keyboardType="email-address"
                autoCapitalize="none"
                onKeyPress={(e) => handleTextInputKeyPress(e, 'email')}
                onFocus={() => handleFocus('email')}
                onBlur={() => handleBlur('email')}
              />
            </View>

            <View style={styles.inputGroup}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={(text) =>
                  handleTextInputChange(text, 'password', setPassword)
                }
                secureTextEntry={!showPassword}
                onKeyPress={(e) => handleTextInputKeyPress(e, 'password')}
                onFocus={() => handleFocus('password')}
                onBlur={() => handleBlur('password')}
              />
              <TouchableOpacity
                onPress={() => {
                  setShowPassword(!showPassword);
                  logScreenGesture(
                    'SignUpScreen',
                    'tap',
                    {}, // Coordinates might be harder to get accurately for a simple toggle
                    {
                      action: 'toggle_password_visibility',
                      visibility: !showPassword ? 'show' : 'hide',
                    },
                    null,
                    screenEntryTime.current
                  );
                }}
                style={styles.passwordToggle}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={(text) =>
                  handleTextInputChange(
                    text,
                    'confirmPassword',
                    setConfirmPassword
                  )
                }
                secureTextEntry={!showConfirmPassword}
                onKeyPress={(e) =>
                  handleTextInputKeyPress(e, 'confirmPassword')
                }
                onFocus={() => handleFocus('confirmPassword')}
                onBlur={() => handleBlur('confirmPassword')}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.passwordToggle}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPressIn={handleSignUp}
            >
              <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPressIn={navigateToLogin}
            style={styles.loginLinkContainer}
          >
            <Text style={styles.loginLinkText}>
              Already have an Account?{' '}
              <Text style={styles.loginLinkBold}>Login Here</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default SignUpScreen;

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#E6F2FF',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#E6F2FF',
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  headerSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  appLogoPlaceholder: {
    width: 80,
    height: 80,
    marginBottom: 15,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appLogoImage: {
    width: '100%',
    height: '100%',
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0056B3',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
    marginBottom: 15,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  passwordToggle: {
    padding: 5,
  },
  button: {
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  loginLinkContainer: {
    marginTop: 10,
    paddingVertical: 10,
  },
  loginLinkText: {
    fontSize: 15,
    color: '#666',
  },
  loginLinkBold: {
    fontWeight: 'bold',
    color: '#0056B3',
  },
});
