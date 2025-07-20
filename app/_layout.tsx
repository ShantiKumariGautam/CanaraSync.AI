import {
  useEffect,
  useState,
  createContext,
  useContext,
  useRef,
  useCallback,
} from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  Platform,
  AppState,
  AppStateStatus,
  Modal,
  Pressable,
  StyleSheet,
} from 'react-native';
import {
  initializeGlobalMetadata,
  endSessionAndPrepareForNext,
  logGestureEvent,
  getCurrentSessionNumber,
  GestureLog,
  getCachedDeviceModel,
  getCachedLocation,
  getCurrentSessionId,
  getActiveUserEmail,
  setActiveUserSession,
  getActiveUserName,
  createPanGestureLogger,
} from '../utils/logGesture';
import {
  trainAutoencoder,
  detectAnomaly,
  initializeAutoencoderModel,
  NUM_TRAINING_SESSIONS,
  isBehavioralProfileTrained,
} from '../utils/autoencoder';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { Stack, useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import * as LocalAuthentication from 'expo-local-authentication';

SplashScreen.preventAutoHideAsync().catch(() => {});

interface MLContextType {
  currentSession: number;
  isModelReady: boolean;
  checkBehavioralAnomaly: (gesture: GestureLog) => Promise<void>;
  logScreenGesture: (
    screen: string,
    gestureType: string,
    eventData?: Record<string, any>,
    extraData?: Record<string, any>,
    typingMeta?: any,
    screenEntryTime?: number | null
  ) => Promise<void>;
  userEmail: string;
  setActiveUserSession: (userEmail: string, username: string) => Promise<void>;
  endSessionAndPrepareForNext: (userEmail: string) => Promise<void>;
}

const MLContext = createContext<MLContextType | undefined>(undefined);

export const useML = () => {
  const context = useContext(MLContext);
  if (context === undefined) {
    throw new Error('useML must be used within an MLProvider');
  }
  return context;
};

let autoencoderModel: tf.LayersModel | null = null;

const BIOMETRIC_THRESHOLD = 0.3;
const MIN_ANOMALY_PERCENTAGE_FOR_ACTION = 30;
const REAUTH_COOLDOWN_MINUTES = 0.166;

export default function RootLayout() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isModelReady, setIsModelReady] = useState(false);
  const [currentSession, setCurrentSession] = useState(0);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>(
    'unknown@example.com'
  );
  const reauthenticationPrompted = useRef(false);
  const trainingInProgress = useRef(false);
  const lastReauthenticationTime = useRef<number>(0);

  const screenEntryTime = useRef<number | null>(null);
  const panResponder = useRef(
    createPanGestureLogger('AppRoot', screenEntryTime)
  );

  const [showAnomalyModal, setShowAnomalyModal] = useState(false);
  const [anomalyModalDetails, setAnomalyModalDetails] = useState<{
    title: string;
    message: string;
    actionType: 'biometric' | 'relogin';
    reconstructionError: number;
    errorPercentage?: string;
  } | null>(null);

  const handleAnomalyAction = useCallback(async () => {
    if (!anomalyModalDetails) return;

    setShowAnomalyModal(false);
    lastReauthenticationTime.current = Date.now();

    if (anomalyModalDetails.actionType === 'biometric') {
      try {
        const authResult = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to confirm identity',
          cancelLabel: 'Cancel',
          fallbackLabel: 'Use Passcode',
        });

        if (authResult.success) {
          console.log('Biometric authentication successful!');
          Alert.alert(
            'Verification Successful',
            'Your identity has been verified.'
          );
        } else {
          console.log(
            'Biometric authentication failed or cancelled:',
            authResult.error
          );
          Alert.alert(
            'Authentication Failed',
            'Biometric authentication failed or was cancelled. Please log in manually for security.',
            [
              {
                text: 'Log In',
                onPress: async () => {
                  await endSessionAndPrepareForNext(getActiveUserEmail());
                  await AsyncStorage.removeItem('userData');
                  setCurrentUserEmail('unknown@example.com');
                  router.replace('/LoginScreen');
                },
              },
            ]
          );
        }
      } catch (error: any) {
        console.error('Error during biometric authentication:', error);
        Alert.alert(
          'Authentication Error',
          'Could not perform biometric authentication. Please log in manually.',
          [
            {
              text: 'Log In',
              onPress: async () => {
                await endSessionAndPrepareForNext(getActiveUserEmail());
                await AsyncStorage.removeItem('userData');
                setCurrentUserEmail('unknown@example.com');
                router.replace('/LoginScreen');
              },
            },
          ]
        );
      }
    } else {
      console.log('Triggering full reauthentication...');
      if (getActiveUserEmail() !== 'unknown@example.com') {
        await endSessionAndPrepareForNext(getActiveUserEmail());
      }
      await AsyncStorage.removeItem('userData');
      setCurrentUserEmail('unknown@example.com');
      router.replace('/LoginScreen');
    }
  }, [anomalyModalDetails, endSessionAndPrepareForNext, router]);

  const checkBehavioralAnomaly = useCallback(
    async (gesture: GestureLog) => {
      if (getActiveUserEmail() === 'unknown@example.com') {
        console.log(
          '[checkBehavioralAnomaly] Skipping anomaly detection: User is unknown.'
        );
        return;
      }

      if (
        !autoencoderModel ||
        autoencoderModel.name !== `autoencoderModel${getActiveUserEmail()}`
      ) {
        console.log(
          `[checkBehavioralAnomaly] Model not loaded or user changed. Attempting to initialize/load model for ${getActiveUserEmail()}.`
        );
        autoencoderModel = await initializeAutoencoderModel(
          getActiveUserEmail()
        );
        if (!autoencoderModel) {
          console.error(
            '[checkBehavioralAnomaly] Autoencoder model not initialized. Cannot perform anomaly detection.'
          );
          setIsModelReady(false);
          return;
        }
        setIsModelReady(true);
      }

      if (autoencoderModel && gesture.userEmail === getActiveUserEmail()) {
        console.log(
          '[checkBehavioralAnomaly] Performing behavioral anomaly check...'
        );
        try {
          const { isAnomaly, reconstructionError } = await detectAnomaly(
            autoencoderModel,
            gesture,
            getActiveUserEmail()
          );
          console.log(
            `[checkBehavioralAnomaly] Anomaly detection result: isAnomaly=${isAnomaly}, reconstructionError=${reconstructionError.toFixed(
              5
            )}`
          );

          const timeSinceLastReauth =
            Date.now() - lastReauthenticationTime.current;
          const cooldownMs = REAUTH_COOLDOWN_MINUTES * 60 * 1000;
          if (timeSinceLastReauth < cooldownMs) {
            console.log(
              `[checkBehavioralAnomaly] Anomaly detected but within cooldown period (${(
                timeSinceLastReauth / 1000
              ).toFixed(0)}s / ${(cooldownMs / 1000).toFixed(
                0
              )}s). Skipping alert.`
            );
            return;
          }

          if (isAnomaly) {
            const displayMaxError = 0.5;
            const anomalyPercentageValue = Math.min(
              100,
              (reconstructionError / displayMaxError) * 100
            );

            if (anomalyPercentageValue >= MIN_ANOMALY_PERCENTAGE_FOR_ACTION) {
              console.warn(
                `Anomaly detected! Reconstruction error: ${reconstructionError.toFixed(
                  5
                )}, Percentage: ${anomalyPercentageValue.toFixed(0)}%`
              );

              let actionType: 'biometric' | 'relogin';
              let message =
                'Unusual behavior detected. Please re-authenticate to confirm your identity.';
              let title = 'Security Alert';

              const hasHardware = await LocalAuthentication.hasHardwareAsync();
              const isEnrolled = await LocalAuthentication.isEnrolledAsync();

              if (
                reconstructionError <= BIOMETRIC_THRESHOLD &&
                hasHardware &&
                isEnrolled
              ) {
                actionType = 'biometric';
                message = `Anomaly detected (${anomalyPercentageValue.toFixed(
                  0
                )}% risk). You can quickly verify your identity using your fingerprint or face ID.`;
              } else {
                actionType = 'relogin';
                message = `Significant unusual behavior detected (${anomalyPercentageValue.toFixed(
                  0
                )}% risk). For your security, please re-authenticate by logging in again.`;
              }

              setAnomalyModalDetails({
                title,
                message,
                actionType,
                reconstructionError,
                errorPercentage: anomalyPercentageValue.toFixed(0),
              });
              setShowAnomalyModal(true);
            } else {
              console.log(
                `Anomaly detected (${anomalyPercentageValue.toFixed(
                  0
                )}%), but below action threshold (${MIN_ANOMALY_PERCENTAGE_FOR_ACTION}%). No alert triggered.`
              );
            }
          } else {
            console.log(
              `Behavior is normal. Reconstruction error: ${reconstructionError.toFixed(
                5
              )}`
            );
          }
        } catch (error: any) {
          console.error('Error during anomaly detection:', error);
          Alert.alert(
            'Detection Error',
            'Could not perform anomaly detection.'
          );
        }
      } else {
        console.log(
          `[checkBehavioralAnomaly] Anomaly detection skipped. Model not active or user mismatch.`
        );
      }
    },
    [endSessionAndPrepareForNext, router, setIsModelReady]
  );

  const logScreenGesture = useCallback(
    async (
      screen: string,
      gestureType: string,
      eventData: Record<string, any> = {},
      extraData: Record<string, any> = {},
      typingMeta: any = null,
      componentScreenEntryTime: number | null = null
    ) => {
      const userEmailForLog = getActiveUserEmail();
      const usernameForLog = getActiveUserName();

      console.log(
        `[logScreenGesture] Logging gesture: ${gestureType} on ${screen}`
      );
      await logGestureEvent(
        screen,
        gestureType,
        eventData,
        extraData,
        typingMeta,
        componentScreenEntryTime
      );

      const { latitude, longitude, locationTimestamp } = getCachedLocation();
      const sessionIdForLog = await getCurrentSessionId(userEmailForLog);
      const deviceModel = getCachedDeviceModel();
      const sessionNumberForAnomalyLog = await getCurrentSessionNumber(
        userEmailForLog
      );

      const gestureLogForAnomaly: GestureLog = {
        username: usernameForLog,
        userEmail: userEmailForLog,
        sessionId: sessionIdForLog,
        deviceModel: deviceModel,
        screen: screen,
        gestureType,
        timestamp: Date.now(),
        x: eventData.x ?? 0.0,
        y: eventData.y ?? 0.0,
        pressure: eventData.pressure ?? 0,
        touchDuration: eventData.touchDuration ?? 0,
        swipeDirection: extraData.swipeDirection || 'N/A',
        gestureVelocity:
          extraData.gestureVelocity !== undefined
            ? extraData.gestureVelocity
            : 0.0,
        latitude: latitude,
        longitude: longitude,
        locationTimestamp: locationTimestamp,
        timeSinceLastGesture: 0,
        action: extraData.action,
        fieldName: typingMeta?.fieldName ?? extraData.fieldName ?? 'unknown',
        scrollSpeed: extraData.scrollSpeed,
        scrollDistance: extraData.scrollDistance,
        dx: eventData.dx ?? 0.0,
        dy: eventData.dy ?? 0.0,
        vx: eventData.vx ?? 0.0,
        vy: eventData.vy ?? 0.0,
        finalValueLength:
          typingMeta?.finalValueLength ?? extraData.finalValueLength,
        sessionDuration: 0,
        typingSpeed: typingMeta?.typingSpeed ?? 0.0,
        backspacesUsed: typingMeta?.backspaceCount ?? 0,
        keyHoldDuration: typingMeta?.keyHoldDuration ?? 0,
        timeBetweenKeys: typingMeta?.timeBetweenKeys ?? 0,
        totalCharactersTyped: typingMeta?.totalCharacters ?? 0,
        sessionNumber: sessionNumberForAnomalyLog,
      };

      const latestActiveUserEmail = getActiveUserEmail();
      const latestCurrentSession = await getCurrentSessionNumber(
        latestActiveUserEmail
      );

      console.log(
        `[logScreenGesture] Anomaly check conditions: isModelReady=${isModelReady}, latestActiveUserEmail=${latestActiveUserEmail}, latestCurrentSession=${latestCurrentSession}, NUM_TRAINING_SESSIONS=${NUM_TRAINING_SESSIONS}`
      );

      if (isModelReady && latestActiveUserEmail !== 'unknown@example.com') {
        console.log(
          `[logScreenGesture] Conditions met. Calling checkBehavioralAnomaly for ${gestureType}.`
        );
        await checkBehavioralAnomaly(gestureLogForAnomaly);
      } else {
        console.log(
          `[logScreenGesture] Anomaly detection skipped. Model not ready or user unknown.`
        );
      }
    },
    [isModelReady, checkBehavioralAnomaly]
  );

  useEffect(() => {
    screenEntryTime.current = Date.now();

    const loadUserDataAndSetupML = async () => {
      console.log('--- loadUserDataAndSetupML started ---');
      setIsLoading(true);
      try {
        console.log('Initializing TensorFlow.js...');
        await tf.ready();
        console.log('TensorFlow.js initialized.');

        console.log(
          'Initializing global logging metadata (device, location)...'
        );
        await initializeGlobalMetadata();

        const storedUserDataString = await AsyncStorage.getItem('userData');
        let userEmailToUse: string = 'unknown@example.com';
        let userFullNameToUse: string = 'Unknown User';

        if (storedUserDataString) {
          try {
            const parsedUserData = JSON.parse(storedUserDataString);
            if (parsedUserData.email) {
              userEmailToUse = parsedUserData.email;
              userFullNameToUse = parsedUserData.fullName || 'Unknown User';
              console.log(
                `[loadUserDataAndSetupML] Found stored user data: ${userEmailToUse}`
              );
            }
          } catch (parseError) {
            console.error(
              '[loadUserDataAndSetupML] Error parsing stored user data:',
              parseError
            );
          }
        } else {
          console.log(
            '[loadUserDataAndSetupML] No user data found in AsyncStorage.'
          );
        }

        await setActiveUserSession(userEmailToUse, userFullNameToUse);
        setCurrentUserEmail(userEmailToUse);

        SplashScreen.hideAsync();
        console.log('Splash screen hidden.');
      } catch (error: any) {
        console.error(
          '[loadUserDataAndSetupML] Error during initial app setup:',
          error
        );
        Alert.alert(
          'App Error',
          `An error occurred during app initialization: ${error.message}. Please restart.`
        );
        SplashScreen.hideAsync();
      }
    };

    loadUserDataAndSetupML();
  }, []);

  useEffect(() => {
    const setupMLModel = async (email: string) => {
      console.log(`--- setupMLModel started for user: ${email} ---`);
      setIsLoading(true);

      if (email === 'unknown@example.com') {
        console.log('[setupMLModel] Skipping ML setup: User is unknown.');
        setIsModelReady(false);
        setIsLoading(false);
        return;
      }

      try {
        const sessionNum = await getCurrentSessionNumber(email);
        setCurrentSession(sessionNum);
        console.log(
          `[setupMLModel] Current Session Number for ${email}: ${sessionNum}`
        );

        autoencoderModel = await initializeAutoencoderModel(email);
        if (autoencoderModel) {
          setIsModelReady(true);
          console.log(
            `[setupMLModel] Existing model for ${email} loaded successfully. isModelReady set to TRUE.`
          );
        } else {
          setIsModelReady(false);
          console.log(
            `[setupMLModel] No existing model found for ${email}. isModelReady remains FALSE.`
          );
        }

        const trained = await isBehavioralProfileTrained(email);
        console.log(
          `[setupMLModel] Behavioral profile trained status for ${email}: ${trained}`
        );

        if (trained) {
          console.log(
            '[setupMLModel] Behavioral profile already trained. Anomaly detection readiness based on model load attempt.'
          );
          if (
            sessionNum > NUM_TRAINING_SESSIONS &&
            !reauthenticationPrompted.current
          ) {
            console.log(
              `[setupMLModel] Session ${sessionNum} is after training period (${NUM_TRAINING_SESSIONS}). Prompting for reauthentication.`
            );
            reauthenticationPrompted.current = true;
            Alert.alert(
              'Reauthentication Required',
              'Your behavioral profile has been established. Please re-authenticate to confirm your identity and continue.',
              [
                {
                  text: 'Re-authenticate',
                  onPress: async () => {
                    console.log(
                      '[setupMLModel] Triggering reauthentication from post-training prompt...'
                    );
                    if (email && email !== 'unknown@example.com') {
                      await endSessionAndPrepareForNext(email);
                    }
                    await AsyncStorage.removeItem('userData');
                    setCurrentUserEmail('unknown@example.com');
                    router.replace('/LoginScreen');
                    lastReauthenticationTime.current = Date.now();
                  },
                },
              ],
              { cancelable: false }
            );
          }
        } else {
          console.log(
            `[setupMLModel] Behavioral profile not yet trained for ${email}.`
          );

          if (sessionNum >= NUM_TRAINING_SESSIONS) {
            if (trainingInProgress.current) {
              console.warn(
                '[setupMLModel] Training already in progress. Skipping new training initiation.'
              );
              setIsLoading(false);
              return;
            }

            console.log(
              `[setupMLModel] Reached or exceeded ${NUM_TRAINING_SESSIONS} sessions for ${email} and profile not trained. Initiating automatic training...`
            );
            trainingInProgress.current = true;

            const allKeys = await AsyncStorage.getAllKeys();
            const userSessionKeys = allKeys.filter((key) =>
              key.startsWith(`CanaraSyncData_User_${email}_Session_`)
            );
            let allUserGestureData: GestureLog[] = [];
            for (const key of userSessionKeys) {
              const data = await AsyncStorage.getItem(key);
              if (data) {
                allUserGestureData = allUserGestureData.concat(
                  JSON.parse(data)
                );
              }
            }

            if (allUserGestureData.length >= 100) {
              console.log(
                `[setupMLModel] Attempting to train model with ${allUserGestureData.length} gestures.`
              );
              const success = await trainAutoencoder(allUserGestureData, email);
              if (success) {
                autoencoderModel = await initializeAutoencoderModel(email);
                if (autoencoderModel) {
                  setIsModelReady(true);
                  console.log(
                    '[setupMLModel] Automatic training complete. Behavioral profile trained successfully! Anomaly detection is now active. isModelReady set to TRUE.'
                  );
                  if (!reauthenticationPrompted.current) {
                    reauthenticationPrompted.current = true;
                    Alert.alert(
                      'Training Complete',
                      'Your behavioral profile has been successfully trained. Please re-authenticate to confirm your identity and continue with anomaly detection enabled.',
                      [
                        {
                          text: 'Re-authenticate',
                          onPress: async () => {
                            console.log(
                              '[setupMLModel] Triggering reauthentication after training completion...'
                            );
                            if (email && email !== 'unknown@example.com') {
                              await endSessionAndPrepareForNext(email);
                            }
                            await AsyncStorage.removeItem('userData');
                            setCurrentUserEmail('unknown@example.com');
                            router.replace('/LoginScreen');
                            lastReauthenticationTime.current = Date.now();
                          },
                        },
                      ],
                      { cancelable: false }
                    );
                  }
                } else {
                  setIsModelReady(false);
                  console.error(
                    '[setupMLModel] Failed to load model after automatic training. isModelReady set to FALSE. Please restart the app.'
                  );
                }
              } else {
                setIsModelReady(false);
                console.error(
                  '[setupMLModel] Failed to train behavioral model automatically. isModelReady set to FALSE. Check console for details.'
                );
                Alert.alert(
                  'Error',
                  'Failed to train behavioral model automatically. Please try again later.'
                );
              }
            } else {
              setIsModelReady(false);
              console.warn(
                `[setupMLModel] Not enough data for automatic training (${allUserGestureData.length} gestures). Need at least 100.`
              );
              Alert.alert(
                'Info',
                `Please use the app more to collect enough data for behavioral profile training (${allUserGestureData.length}/100 gestures collected).`
              );
            }
            trainingInProgress.current = false;
          } else {
            setIsModelReady(false);
            console.log(
              `[setupMLModel] Collecting data for session ${sessionNum} of ${NUM_TRAINING_SESSIONS} for user ${email}.`
            );
          }
        }
      } catch (error: any) {
        setIsModelReady(false);
        console.error('[setupMLModel] Error during ML setup:', error);
        Alert.alert(
          'ML Setup Error',
          `An error occurred during ML setup: ${error.message}.`
        );
      } finally {
        setIsLoading(false);
        console.log(
          `--- setupMLModel finished for user: ${email}. Final isModelReady state: ${isModelReady} ---`
        );
      }
    };

    if (currentUserEmail) {
      setupMLModel(currentUserEmail);
    }
  }, [currentUserEmail, endSessionAndPrepareForNext, router]);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log(
          'App is going to background or inactive. Clearing user data for re-login.'
        );
        try {
          if (currentUserEmail && currentUserEmail !== 'unknown@example.com') {
            await endSessionAndPrepareForNext(currentUserEmail);
          }
          await AsyncStorage.removeItem('userData');
          setCurrentUserEmail('unknown@example.com');
          router.replace('/LoginScreen');
        } catch (error: any) {
          console.error('Error clearing user data on app background:', error);
        }
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, [router, currentUserEmail, endSessionAndPrepareForNext]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F5F5F5',
        }}
      >
        <ActivityIndicator
          size="large"
          color="#0056B3"
        />
        <Text style={{ marginTop: 10, fontSize: 16, color: '#333' }}>
          {currentSession <= NUM_TRAINING_SESSIONS
            ? `Collecting data for session ${currentSession} of ${NUM_TRAINING_SESSIONS}...`
            : 'Initializing ML models...'}
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView
      style={{ flex: 1 }}
      {...(panResponder.current?.panHandlers || {})}
    >
      <MLContext.Provider
        value={{
          currentSession,
          isModelReady,
          checkBehavioralAnomaly,
          logScreenGesture: logScreenGesture,
          userEmail: currentUserEmail,
          setActiveUserSession: setActiveUserSession,
          endSessionAndPrepareForNext: endSessionAndPrepareForNext,
        }}
      >
        <Stack>
          <Stack.Screen
            name="SplashScreen"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="OnboardingScreen"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SignUpScreen"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="LoginScreen"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ConsentScreen"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="HomeScreen"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ProfileScreen"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="HistoryScreen"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="QRScreen"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CardsScreen"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="index"
            options={{ headerShown: false }}
          />
        </Stack>
      </MLContext.Provider>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showAnomalyModal}
        onRequestClose={() => setShowAnomalyModal(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>
              {anomalyModalDetails?.title || 'Security Alert'}
            </Text>
            <Text style={styles.modalText}>{anomalyModalDetails?.message}</Text>
            {anomalyModalDetails?.errorPercentage && (
              <Text style={styles.anomalyPercentage}>
                Anomaly Score: {anomalyModalDetails.errorPercentage}%
              </Text>
            )}
            <Pressable
              style={[styles.button, styles.buttonClose]}
              onPress={handleAnomalyAction}
            >
              <Text style={styles.textStyle}>
                {anomalyModalDetails?.actionType === 'biometric'
                  ? 'Verify with Biometrics'
                  : 'Log In Now'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#D32F2F',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 16,
    color: '#333',
  },
  anomalyPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0056B3',
    marginBottom: 20,
  },
  button: {
    borderRadius: 10,
    padding: 12,
    elevation: 2,
    minWidth: 150,
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});
