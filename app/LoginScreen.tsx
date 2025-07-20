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
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  GestureResponderEvent,
  Platform,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useML } from '../app/_layout'; 
const LoginScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const screenEntryTime = useRef<number | null>(null);
  const lastKeyTime = useRef<number | null>(null);
  const lastTextInputLength = useRef(0);

  
  const {
    logScreenGesture,
    setActiveUserSession,
    endSessionAndPrepareForNext,
  } = useML();

  useEffect(() => {
    screenEntryTime.current = Date.now();

    const checkAsyncStorage = async () => {
      try {
        const storedUsers = await AsyncStorage.getItem('@users');
        const storedUserData = await AsyncStorage.getItem('userData');
        console.log('LoginScreen loaded:');
        console.log(
          '  @users in AsyncStorage:',
          storedUsers ? JSON.parse(storedUsers) : 'null/empty'
        );
        console.log(
          '  userData in AsyncStorage:',
          storedUserData ? JSON.parse(storedUserData) : 'null/empty'
        );
      } catch (e) {
        console.error('Error checking AsyncStorage on LoginScreen load:', e);
      }
    };
    checkAsyncStorage();

    return () => {
      logScreenGesture('LoginScreen', 'exit', {}, { exitReason: 'SuccessfulLogin' }, null, screenEntryTime.current);
    };
  }, []);

  const handleTextInputKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    fieldName: string
  ) => {
    if (e.nativeEvent.key === 'Backspace') {
      logScreenGesture(
        'LoginScreen',
        'typing',
        {},
        { fieldName: fieldName }, 
        { backspaceCount: 1 },
        screenEntryTime.current
      );
    }
  };

  const handleTextInputChange = (text: string, fieldName: string) => {
    if (fieldName === 'email') {
      setEmail(text);
    } else if (fieldName === 'password') {
      setPassword(text);
    }

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
      'LoginScreen',
      'typing',
      {},
      { fieldName: fieldName }, 
      {
        totalCharacters: text.length,
        typingSpeed: parseFloat(typingSpeed.toFixed(2)),
        timeBetweenKeys: timeElapsed,
        keyHoldDuration: 50, 
      },
      screenEntryTime.current
    );
  };

  const handleFocus = (fieldName: string) => {
    logScreenGesture(
      'LoginScreen',
      'focus',
      {},
      { fieldName: fieldName },
      null,
      screenEntryTime.current
    );
  };

  const handleBlur = (fieldName: string) => {
    logScreenGesture(
      'LoginScreen',
      'blur',
      {},
      { fieldName: fieldName },
      null,
      screenEntryTime.current
    );
  };

  const handleLogin = async (e: GestureResponderEvent) => {
    logScreenGesture(
      'LoginScreen',
      'tap',
      { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY },
      { action: 'LoginButton' },
      null,
      screenEntryTime.current
    );

    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password.');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    try {
      console.log('Login attempt for email:', email);
      console.log('Retrieving @users from AsyncStorage for login...');
      const existingUsers = await AsyncStorage.getItem('@users');
      const users = existingUsers ? JSON.parse(existingUsers) : [];
      console.log('Users retrieved for login:', users);

      const matchedUser = users.find((u: any) => u.email === email);
      console.log('Matched user:', matchedUser);

      if (!matchedUser) {
        Alert.alert('Error', 'Email not found. Please sign up first.');
        logScreenGesture(
          'LoginScreen',
          'login_failed',
          {},
          { emailAttempted: email, reason: 'EmailNotFound' },
          null,
          screenEntryTime.current
        );
        return;
      }

      if (matchedUser.password !== password) {
        Alert.alert('Error', 'Incorrect password. Please try again.');
        logScreenGesture(
          'LoginScreen',
          'login_failed',
          {},
          { emailAttempted: email, reason: 'IncorrectPassword' },
          null,
          screenEntryTime.current
        );
        return;
      }

      await AsyncStorage.setItem('userData', JSON.stringify(matchedUser));
      console.log('Login successful! userData saved:', matchedUser);

     
      await setActiveUserSession(
        matchedUser.email,
        matchedUser.fullName || 'Unknown User'
      );

      
      logScreenGesture(
        'LoginScreen',
        'login_success',
        {},
        { userEmail: matchedUser.email, username: matchedUser.fullName },
        null,
        screenEntryTime.current
      );

      Alert.alert('Success', 'Logged in successfully!');
      router.replace('/HomeScreen');
    } catch (error: any) {
      
      console.error(
        'Login Error:',
        error,
        'Full error:',
        JSON.stringify(error)
      );
      Alert.alert('Error', 'Something went wrong. Please try again later.');
      logScreenGesture(
        'LoginScreen',
        'login_error',
        {},
        { errorMessage: error.message },
        null,
        screenEntryTime.current
      );
    }
  };

  const navigateToSignUp = (e: GestureResponderEvent) => {
    logScreenGesture(
      'LoginScreen',
      'tap',
      { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY },
      { action: 'SignUpLink' },
      null,
      screenEntryTime.current
    );
    router.push('/SignUpScreen');
  };

  const navigateToForgotPassword = (e: GestureResponderEvent) => {
    logScreenGesture(
      'LoginScreen',
      'tap',
      { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY },
      { action: 'ForgotPasswordLink' },
      null,
      screenEntryTime.current
    );
    Alert.alert('Forgot Password', 'Coming soon!');
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
                source={require('../assets/placeholder.png')} 
                style={styles.appLogoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.mainTitle}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Sign in to continue.</Text>
          </View>

          <View style={styles.inputCard}>
            <View style={styles.inputGroup}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#999"
                value={email}
                onChangeText={(text) => handleTextInputChange(text, 'email')}
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
                onChangeText={(text) => handleTextInputChange(text, 'password')}
                secureTextEntry={!showPassword}
                onKeyPress={(e) => handleTextInputKeyPress(e, 'password')}
                onFocus={() => handleFocus('password')}
                onBlur={() => handleBlur('password')}
              />
              <TouchableOpacity
                onPressIn={() => {
                  setShowPassword(!showPassword);
                  logScreenGesture(
                    'LoginScreen',
                    'tap',
                    {}, 
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

            <TouchableOpacity
              onPressIn={navigateToForgotPassword}
              style={styles.forgotPasswordLink}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPressIn={handleLogin}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPressIn={navigateToSignUp}
            style={styles.signUpLinkContainer}
          >
            <Text style={styles.signUpLinkText}>
              Don't have an account?{' '}
              <Text style={styles.signUpLinkBold}>Sign Up Here</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default LoginScreen;

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
    marginBottom: 30,
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
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#0056B3',
    fontWeight: 'bold',
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
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333', 
  },
  signUpLinkContainer: {
    marginTop: 20,
    paddingVertical: 10,
  },
  signUpLinkText: {
    fontSize: 15,
    color: '#666',
  },
  signUpLinkBold: {
    fontWeight: 'bold',
    color: '#0056B3',
  },
});
