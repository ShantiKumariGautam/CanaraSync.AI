import * as React from 'react'; 
import { useEffect } from 'react'; 
import {
  View,
  Text,
  Image,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SplashScreenLib from 'expo-splash-screen';

const SplashScreen = () => {
  const router = useRouter();

  useEffect(() => {
    const prepare = async () => {
      try {
        await SplashScreenLib.preventAutoHideAsync();

        console.log('Splash screen timer started for 30 seconds...');
        await new Promise((resolve) => setTimeout(resolve, 7000));
        console.log('Splash screen timer finished. Hiding splash screen...');

        await SplashScreenLib.hideAsync();

        router.replace('/OnboardingScreen');
      } catch (err) {
        console.warn('Splash screen error:', err);
        SplashScreenLib.hideAsync();
      }
    };

    prepare();
  }, []);

  return (
    <View style={styles.container}>
      {Platform.OS === 'android' && (
        <StatusBar
          backgroundColor="#000"
          barStyle="light-content"
        />
      )}
      <Image
        source={require('../assets/placeholder.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.text}>Welcome to CanaraSync.AI</Text>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 20,
    borderRadius: 20,
  },
  text: {
    marginTop: 20,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
