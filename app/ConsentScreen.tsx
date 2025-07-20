// app/ConsentScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; 

const ConsentScreen = () => {
  const router = useRouter();
  const [hasConsented, setHasConsented] = useState(false);

  const handleAcceptAndContinue = () => {
    if (hasConsented) {
    
      router.replace('/HomeScreen');
    } else {
      Alert.alert(
        'Consent Required',
        'Please tick the box to give your consent before proceeding.'
      );
    }
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContainer}
    >
      <View style={styles.container}>

        <View style={styles.headerSection}>
          <Text style={styles.title}>Your Data, Your Security: Consent</Text>
          <Text style={styles.subtitle}>
            Understanding Behavioral Biometric Authentication (BBA)
          </Text>
        </View>

      
        <View style={styles.contentArea}>
          <Text style={styles.introText}>
            CanaraSync.AI uses advanced Behavioral Biometric Authentication
            (BBA) to provide an unparalleled layer of security, making your
            banking experience safer and more seamless. This requires
            understanding your unique interaction patterns.
          </Text>

    
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="finger-print-outline"
                size={24}
                color="#0056B3"
                style={styles.sectionIcon}
              />
              <Text style={styles.sectionTitle}>What Data Do We Collect?</Text>
            </View>
            <Text style={styles.sectionDescription}>
              To build your unique behavioral profile, we collect the following
              data:
            </Text>
            <View style={styles.bulletPoint}>
              <MaterialCommunityIcons
                name="gesture-tap"
                size={20}
                color="#333"
                style={styles.bulletIcon}
              />
              <Text style={styles.bulletText}>
                <Text style={styles.boldText}>Tap Data:</Text> The rhythm and
                force of your taps on the screen.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <MaterialCommunityIcons
                name="gesture-swipe"
                size={20}
                color="#333"
                style={styles.bulletIcon}
              />
              <Text style={styles.bulletText}>
                <Text style={styles.boldText}>Gesture Data:</Text> Patterns of
                your swipes, scrolls, and other screen interactions.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <MaterialCommunityIcons
                name="speedometer"
                size={20}
                color="#333"
                style={styles.bulletIcon}
              />
              <Text style={styles.bulletText}>
                <Text style={styles.boldText}>Scrolling Speed:</Text> How
                quickly and consistently you scroll through content.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons
                name="compass-outline"
                size={20}
                color="#333"
                style={styles.bulletIcon}
              />
              <Text style={styles.bulletText}>
                <Text style={styles.boldText}>Device Tilt & Motion:</Text>{' '}
                Subtle movements and orientation changes of your device.
              </Text>
            </View>
            <Text style={styles.sectionDescription}>
              This data is collected in the background, anonymously, and is
              encrypted.
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="shield-checkmark-outline"
                size={24}
                color="#0056B3"
                style={styles.sectionIcon}
              />
              <Text style={styles.sectionTitle}>
                How Your Data Enhances Security
              </Text>
            </View>
            <Text style={styles.sectionDescription}>
              Your collected data helps us build a unique behavioral profile.
              This profile acts as an invisible security layer, constantly
              verifying your identity in the background. If any activity
              deviates significantly from your established pattern, it flags
              potential unauthorized access, providing real-time protection
              against fraud.
            </Text>
          </View>

       
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="lock-closed-outline"
                size={24}
                color="#0056B3"
                style={styles.sectionIcon}
              />
              <Text style={styles.sectionTitle}>
                Our Commitment to Your Privacy (DPDP Rule)
              </Text>
            </View>
            <Text style={styles.sectionDescription}>
              CanaraSync.AI strictly adheres to the{' '}
              <Text style={styles.boldText}>
                Digital Personal Data Protection (DPDP) Act, 2023
              </Text>
              . We are committed to protecting your personal data with the
              highest standards of security and transparency. Your data is:
            </Text>
            <View style={styles.bulletPoint}>
              <Text style={styles.bulletText}>
                •{' '}
                <Text style={styles.boldText}>
                  Collected only for specified purposes (BBA).
                </Text>
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bulletText}>
                •{' '}
                <Text style={styles.boldText}>
                  Processed with your explicit consent.
                </Text>
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bulletText}>
                •{' '}
                <Text style={styles.boldText}>
                  Secured against unauthorized access or breaches.
                </Text>
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bulletText}>
                •{' '}
                <Text style={styles.boldText}>
                  Kept to a minimum necessary for the service.
                </Text>
              </Text>
            </View>
            <Text style={styles.sectionDescription}>
              You retain full rights over your data, including the right to
              access, correct, or erase it, as per the DPDP Act.
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="cloud-lock-outline"
                size={24}
                color="#0056B3"
                style={styles.sectionIcon}
              />
              <Text style={styles.sectionTitle}>
                Secure & Transparent Logging (ICP Integration)
              </Text>
            </View>
            <Text style={styles.sectionDescription}>
              For enhanced security and transparency, certain critical logs
              related to behavioral authentication events are securely recorded
              on the{' '}
              <Text style={styles.boldText}>
                Internet Computer Protocol (ICP)
              </Text>{' '}
              blockchain. This ensures that these logs are:
            </Text>
            <View style={styles.bulletPoint}>
              <Text style={styles.bulletText}>
                •{' '}
                <Text style={styles.boldText}>Tamper-proof and immutable.</Text>
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bulletText}>
                •{' '}
                <Text style={styles.boldText}>
                  Decentralized and highly available.
                </Text>
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bulletText}>
                •{' '}
                <Text style={styles.boldText}>
                  Cryptographically verifiable.
                </Text>
              </Text>
            </View>
          </View>

          {/* Final Summary Statement */}
          <Text style={styles.finalSummaryText}>
            By proceeding, you acknowledge and consent to the collection and
            processing of your behavioral data as described above, solely for
            the purpose of enhancing your security with CanaraSync.AI.
          </Text>

          {/* Consent Checkbox */}
          <View style={styles.consentBox}>
            <Switch
              onValueChange={setHasConsented}
              value={hasConsented}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={hasConsented ? '#f5dd4b' : '#f4f3f4'}
            />
            <Text style={styles.consentText}>
              I give my consent to collect my data as described above.
            </Text>
          </View>
        </View>

        {/* Accept & Continue Button */}
        <TouchableOpacity
          style={[styles.button, !hasConsented && styles.buttonDisabled]}
          onPress={handleAcceptAndContinue}
          disabled={!hasConsented}
        >
          <Text style={styles.buttonText}>Accept & Continue</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default ConsentScreen;

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#E6F2FF',
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 0, 
  },
  container: {
    width: '100%',
    maxWidth: 600, 
    alignItems: 'center',
  },
  headerSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 24, 
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0056B3',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  contentArea: {
    width: '100%',
    paddingHorizontal: 24, 
  },
  introText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5, 
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEFF1',
    paddingBottom: 10,
  },
  sectionIcon: {
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#34495E',
    flex: 1, 
  },
  sectionDescription: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    marginBottom: 10,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletIcon: {
    marginRight: 10,
    marginTop: 2, 
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  boldText: {
    fontWeight: 'bold',
  },
  finalSummaryText: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  consentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0', 
    padding: 15,
    marginBottom: 30,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  consentText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    lineHeight: 22,
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
    marginBottom: 40, 
  },
  buttonDisabled: {
    backgroundColor: '#CCC',
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
});
