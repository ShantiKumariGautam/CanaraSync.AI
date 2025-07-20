import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Location from 'expo-location';

let cachedSessionId: string | null = null;

const getOrCreateSessionId = async () => {
  if (cachedSessionId) return cachedSessionId;
  const existing = await AsyncStorage.getItem('CanaraSyncSessionId');
  if (existing) {
    cachedSessionId = existing;
    return existing;
  }
  const newId = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  await AsyncStorage.setItem('CanaraSyncSessionId', newId);
  cachedSessionId = newId;
  return newId;
};

type GestureData = {
  sessionId: string;
  timestamp: string;
  screen: string;
  gestureType: string;
  deviceModel: string;
  sessionDuration: number;
  location: {
    latitude: number;
    longitude: number;
  };
  [key: string]: any; // 👈 allows dynamic fields like 'typing'
};

type TypingMeta = {
  totalCharacters: number;
  backspaceCount: number;
  typingSpeed: number;
  fieldName?: string;
};

export const saveGestureData = async (
  gestureType: string,
  screen: string,
  extraData: Record<string, any> = {},
  typingMeta: TypingMeta | null = null
) => {
  try {
    const timestamp = new Date().toISOString();
    const location = await getLocation();
    const deviceModel = Device.modelName ?? 'Unknown Device';
    const sessionId = await getOrCreateSessionId();
    const sessionStart = Number(sessionId.split('_')[0]) || Date.now();
    const sessionDuration = Date.now() - sessionStart;

    const gestureLog: GestureData = {
      sessionId,
      timestamp,
      screen,
      gestureType,
      deviceModel,
      sessionDuration,
      location: {
        latitude: location?.coords?.latitude ?? 0,
        longitude: location?.coords?.longitude ?? 0,
      },
      ...extraData,
    };

    if (typingMeta) {
      gestureLog.typing = {
        totalCharacters: typingMeta.totalCharacters ?? 0,
        backspaceCount: typingMeta.backspaceCount ?? 0,
        typingSpeed: typingMeta.typingSpeed ?? 0,
        fieldName: typingMeta.fieldName ?? 'unknown',
      };
    }

    const existingData = await AsyncStorage.getItem('CanaraSyncData');
    const parsedData = existingData ? JSON.parse(existingData) : [];
    parsedData.push(gestureLog);
    await AsyncStorage.setItem('CanaraSyncData', JSON.stringify(parsedData));
  } catch (error) {}
};

const getLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const location = await Location.getCurrentPositionAsync({});
    return location;
  } catch {
    return null;
  }
};
