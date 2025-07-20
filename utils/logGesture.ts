import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import * as Device from 'expo-device';
import * as Location from 'expo-location';

let cachedDeviceModel: string | null = null;
let cachedLatitude: number | null = null;
let cachedLongitude: number | null = null;
let cachedLocationTimestamp: number | null = null;

let currentActiveUserEmail: string = 'unknown@example.com';
let currentActiveUserName: string = 'Unknown User';
let currentActiveSessionId: string = 'initial_session';
let currentActiveSessionNumber: number = 0;

let lastGestureTimestamp: number | null = null;

export interface GestureLog {
  username: string;
  userEmail: string;
  sessionId: string;
  deviceModel: string | null;
  screen: string;
  gestureType: string;
  timestamp: number;
  x: number;
  y: number;
  pressure: number;
  touchDuration: number;
  swipeDirection?: string;
  gestureVelocity: number;
  latitude: number | null;
  longitude: number | null;
  locationTimestamp: number | null;
  typingSpeed: number;
  backspacesUsed: number;
  keyHoldDuration: number;
  timeBetweenKeys: number;
  totalCharactersTyped: number;
  timeSinceLastGesture: number;
  action?: string;
  fieldName?: string;
  scrollSpeed: number;
  scrollDistance: number;
  dx: number;
  dy: number;
  vx: number;
  vy: number;
  finalValueLength?: number;
  sessionDuration: number;
  sessionNumber: number;
}

export interface TypingMeta {
  totalCharacters?: number;
  typingSpeed?: number;
  backspaceCount?: number;
  timeBetweenKeys?: number;
  keyHoldDuration?: number;
  fieldName?: string;
  finalValueLength?: number;
}

export const initializeGlobalMetadata = async () => {
  try {
    cachedDeviceModel = Device.modelName || Device.modelId || 'Unknown Device';
    console.log('Device.modelId returned:', Device.modelId);
    console.log(
      'Initialized cachedDeviceModel for logging:',
      cachedDeviceModel
    );

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const location = await Location.getCurrentPositionAsync({});
      cachedLatitude = location.coords.latitude;
      cachedLongitude = location.coords.longitude;
      cachedLocationTimestamp = location.timestamp;
    } else {
      console.warn(
        'Location permission not granted. Location data will be null.'
      );
    }
  } catch (error) {
    console.error('Error initializing global logging metadata:', error);
    cachedDeviceModel = 'Error Device';
  }
};

export const setActiveUserSession = async (
  userEmail: string,
  fullName: string
) => {
  currentActiveUserEmail = userEmail;
  currentActiveUserName = fullName;

  console.log(
    `[setActiveUserSession] Called for user: ${userEmail}, Full Name: ${fullName}`
  );

  let sessionNumberKey = `@user_session_number_${userEmail}`;
  let sessionIdKey = `@user_session_id_${userEmail}`;

  try {
    let storedNextSessionNumber = await AsyncStorage.getItem(sessionNumberKey);
    console.log(
      `[setActiveUserSession] Stored NEXT session number for ${userEmail}: ${storedNextSessionNumber}`
    );

    if (!storedNextSessionNumber) {
      currentActiveSessionNumber = 1;
      console.log(
        `[setActiveUserSession] No stored 'next' session found. Initializing current session number to 1.`
      );
    } else {
      currentActiveSessionNumber = parseInt(storedNextSessionNumber, 10);
      console.log(
        `[setActiveUserSession] Found stored 'next' session number: ${currentActiveSessionNumber}. This will be the current session number.`
      );
    }

    currentActiveSessionId = `${userEmail}_${currentActiveSessionNumber}_${Date.now()}`;

    await AsyncStorage.setItem(sessionIdKey, currentActiveSessionId);

    console.log(
      `Session activated for ${userEmail}. Current Session Number: ${currentActiveSessionNumber}, Current Session ID: ${currentActiveSessionId}`
    );
  } catch (e) {
    console.error(`Error setting active user session for ${userEmail}:`, e);
  }
};

export const logGestureEvent = async (
  screen: string,
  gestureType: string,
  eventData: {
    x?: number;
    y?: number;
    pressure?: number;
    touchDuration?: number;
    dx?: number;
    dy?: number;
    vx?: number;
    vy?: number;
  } = {},
  extraData: Record<string, any> = {},
  typingMeta: TypingMeta | null = null,
  screenEntryTime: number | null = null
) => {
  const now = Date.now();

  const userEmailForLog = currentActiveUserEmail;
  const sessionIdForLog = currentActiveSessionId;
  const sessionNumberForLog = currentActiveSessionNumber;

  const username = currentActiveUserName;

  if (screenEntryTime && now - screenEntryTime < 3000) {
    console.warn(
      `Gesture skipped on ${screen} — user has not been on screen for 3 seconds yet.`
    );
    return;
  }

  const timeSinceLast = lastGestureTimestamp ? now - lastGestureTimestamp : 0;
  lastGestureTimestamp = now;

  const sessionStartTime = Number(sessionIdForLog.split('_')[2]) || now;
  const sessionDuration = now - sessionStartTime;

  const gestureLog: GestureLog = {
    username: username,
    userEmail: userEmailForLog,
    sessionId: sessionIdForLog,
    deviceModel: cachedDeviceModel,
    screen: screen,
    gestureType: gestureType,
    timestamp: now,
    x: eventData.x ?? 0.0,
    y: eventData.y ?? 0.0,
    pressure: eventData.pressure ?? 0,
    touchDuration: eventData.touchDuration ?? 0,
    swipeDirection: extraData.swipeDirection ?? 'N/A',
    gestureVelocity:
      eventData.vx !== undefined && eventData.vy !== undefined
        ? Math.sqrt(eventData.vx ** 2 + eventData.vy ** 2)
        : 0.0,
    latitude: cachedLatitude ?? null,
    longitude: cachedLongitude ?? null,
    locationTimestamp: cachedLocationTimestamp ?? null,
    typingSpeed: typingMeta?.typingSpeed ?? 0.0,
    backspacesUsed: typingMeta?.backspaceCount ?? 0,
    keyHoldDuration: typingMeta?.keyHoldDuration ?? 0,
    timeBetweenKeys: typingMeta?.timeBetweenKeys ?? 0,
    totalCharactersTyped: typingMeta?.totalCharacters ?? 0,
    timeSinceLastGesture: timeSinceLast,
    action: extraData.action ?? 'N/A',
    fieldName: typingMeta?.fieldName ?? extraData.fieldName ?? 'unknown',
    sessionDuration: sessionDuration,
    sessionNumber: sessionNumberForLog,
    scrollSpeed: extraData.scrollSpeed ?? 0.0,
    scrollDistance: extraData.scrollDistance ?? 0.0,
    dx: eventData.dx ?? 0.0,
    dy: eventData.dy ?? 0.0,
    vx: eventData.vx ?? 0.0,
    vy: eventData.vy ?? 0.0,
    finalValueLength: extraData.finalValueLength,
  };

  try {
    const userSessionDataKey = `CanaraSyncData_User_${userEmailForLog}_Session_${sessionNumberForLog}`;
    const existingData = await AsyncStorage.getItem(userSessionDataKey);
    const parsedData = existingData ? JSON.parse(existingData) : [];
    parsedData.push(gestureLog);
    await AsyncStorage.setItem(userSessionDataKey, JSON.stringify(parsedData));
    console.log('Gesture logged:', gestureLog);
  } catch (err) {
    console.error('Failed to save gesture:', err);
  }
};

export const endSessionAndPrepareForNext = async (userEmail: string) => {
  if (!userEmail) {
    console.error('User email is required to end session.');
    return;
  }
  let sessionNumberKey = `@user_session_number_${userEmail}`;
  let sessionIdKey = `@user_session_id_${userEmail}`;

  try {
    let storedSessionNumber = await AsyncStorage.getItem(sessionNumberKey);
    let nextSessionNumber = storedSessionNumber
      ? parseInt(storedSessionNumber, 10) + 1
      : 1;

    await AsyncStorage.setItem(sessionNumberKey, nextSessionNumber.toString());
    const newSessionId = `${userEmail}_${nextSessionNumber}_${Date.now()}`;
    await AsyncStorage.setItem(sessionIdKey, newSessionId);

    if (currentActiveUserEmail === userEmail) {
      currentActiveSessionNumber = nextSessionNumber;
      currentActiveSessionId = newSessionId;
      lastGestureTimestamp = null;
    }

    console.log(
      `Session for ${userEmail} ended. Preparing for Session Number: ${nextSessionNumber}, New Session ID: ${newSessionId}`
    );
  } catch (e) {
    console.error(`Error ending session for ${userEmail}:`, e);
  }
};

export const createPanGestureLogger = (
  screenName: string,
  screenEntryTimeRef: React.MutableRefObject<number | null>
) => {
  let initialTouchTime: number | null = null;

  return PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => true,

    onPanResponderGrant: (evt, gestureState) => {
      initialTouchTime = Date.now();
      logGestureEvent(
        screenName,
        'touchStart',
        {
          x: evt.nativeEvent.pageX,
          y: evt.nativeEvent.pageY,
          pressure: evt.nativeEvent.force || 0,
        },
        {},
        null,
        screenEntryTimeRef.current
      );
    },

    onPanResponderMove: (
      evt: GestureResponderEvent,
      gestureState: PanResponderGestureState
    ) => {
      logGestureEvent(
        screenName,
        'touchMove',
        {
          x: evt.nativeEvent.pageX,
          y: evt.nativeEvent.pageY,
          pressure: evt.nativeEvent.force || 0,
          dx: gestureState.dx ?? 0,
          dy: gestureState.dy ?? 0,
          vx: gestureState.vx ?? 0,
          vy: gestureState.vy ?? 0,
        },
        {},
        null,
        screenEntryTimeRef.current
      );
    },

    onPanResponderRelease: (
      evt: GestureResponderEvent,
      gestureState: PanResponderGestureState
    ) => {
      let gestureType = 'release';
      let calculatedTouchDuration = initialTouchTime
        ? Date.now() - initialTouchTime
        : 0;
      let swipeDirection: string = 'N/A';
      const minSwipeDistance = 50;
      const velocityThreshold = 0.5;

      const isTap =
        Math.abs(gestureState.dx) < 5 &&
        Math.abs(gestureState.dy) < 5 &&
        calculatedTouchDuration < 300;
      const isSwipe =
        Math.abs(gestureState.dx) > minSwipeDistance ||
        Math.abs(gestureState.dy) > minSwipeDistance;

      if (isTap) {
        gestureType = 'tap';
      } else if (isSwipe) {
        gestureType = 'swipe';
        if (Math.abs(gestureState.dx) > Math.abs(gestureState.dy)) {
          swipeDirection = gestureState.dx > 0 ? 'right' : 'left';
        } else {
          swipeDirection = gestureState.dy > 0 ? 'down' : 'up';
        }
      } else {
        gestureType = 'drag';
      }

      logGestureEvent(
        screenName,
        gestureType,
        {
          x: evt.nativeEvent.pageX,
          y: evt.nativeEvent.pageY,
          pressure: evt.nativeEvent.force || 0,
          touchDuration: calculatedTouchDuration,
          dx: gestureState.dx ?? 0,
          dy: gestureState.dy ?? 0,
          vx: gestureState.vx ?? 0,
          vy: gestureState.vy ?? 0,
        },
        {
          swipeDirection: swipeDirection,
          gestureVelocity: Math.sqrt(
            (gestureState.vx ?? 0) ** 2 + (gestureState.vy ?? 0) ** 2
          ),
        },
        null,
        screenEntryTimeRef.current
      );
      initialTouchTime = null;
    },
  });
};

export const getCurrentSessionNumber = async (
  userEmail: string
): Promise<number> => {
  if (!userEmail) return 0;
  const storedSessionNumber = await AsyncStorage.getItem(
    `@user_session_number_${userEmail}`
  );
  return storedSessionNumber ? parseInt(storedSessionNumber, 10) : 0;
};

export const getCurrentSessionId = async (
  userEmail: string
): Promise<string> => {
  if (!userEmail) return 'unknown_session';
  const storedSessionId = await AsyncStorage.getItem(
    `@user_session_id_${userEmail}`
  );
  return storedSessionId || `${userEmail}_0_${Date.now()}`;
};

export const getCachedDeviceModel = (): string | null => {
  return cachedDeviceModel;
};

export const getCachedLocation = (): {
  latitude: number | null;
  longitude: number | null;
  locationTimestamp: number | null;
} => {
  return {
    latitude: cachedLatitude,
    longitude: cachedLongitude,
    locationTimestamp: cachedLocationTimestamp,
  };
};

export const getActiveUserEmail = (): string => {
  return currentActiveUserEmail;
};

export const getActiveUserName = (): string => {
  return currentActiveUserName;
};
