import * as React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const OnboardingScreen = () => {
  const router = useRouter();

  const handleStart = () => {
    router.replace('/SignUpScreen');
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      style={styles.scrollView}
    >
      <View style={styles.innerContainer}>
        <View style={styles.headerSection}>
          <View style={styles.appLogoPlaceholder}>
            <Image
              source={require('../assets/placeholder.png')}
              style={styles.appLogoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.mainTitle}>Welcome to CanaraSync.AI</Text>
          <Text style={styles.tagline}>
            Security that syncs with your every move.
          </Text>
        </View>
        <View style={styles.middleSection}>
          <View style={styles.featureContainer}>
            <View style={styles.featureItem}>
              <Ionicons
                name="eye-outline"
                size={24}
                color="#0056B3"
                style={styles.featureIcon}
              />
              <Text style={styles.featureText}>
                <Text style={styles.boldText}>Invisible Protection:</Text> Your
                unique digital habits create an invisible shield.
              </Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons
                name="lock-open-outline"
                size={24}
                color="#0056B3"
                style={styles.featureIcon}
              />
              <Text style={styles.featureText}>
                <Text style={styles.boldText}>Effortless Security:</Text> No
                more passwords or complex verifications needed.
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color="#0056B3"
                style={styles.featureIcon}
              />
              <Text style={styles.featureText}>
                <Text style={styles.boldText}>Real-time Trust:</Text> Instant
                alerts for any unusual activity. Trust built on your behavior.
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={handleStart}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#E6F2FF',
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  innerContainer: {
    width: '100%',
    alignItems: 'center',
  },
  headerSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  appLogoPlaceholder: {
    width: 100,
    height: 100,
    marginBottom: 15,
    borderRadius: 50,
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0056B3',
    textAlign: 'center',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  middleSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  featureContainer: {
    width: '100%',
    maxWidth: 350,
    paddingHorizontal: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  featureIcon: {
    marginRight: 15,
    marginTop: 2,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  boldText: {
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
    marginTop: 20,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
});
