import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';

import { router } from 'expo-router';

type UserType = 'patient' | 'doctor';

export default function RegisterScreen() {
  const [email, setEmail] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userType, setUserType] = useState<UserType>('patient');

  const handleRegister = async (): Promise<void> => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Replace with actual API call
      setTimeout(() => {
        setIsLoading(false);
        Alert.alert('Success', `Registration successful as ${userType}!`);
      }, 1500);
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Error', 'Registration failed. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>+</Text>
              </View>
            </View>
            <Text style={styles.hospitalName}>MedData Hospital</Text>
            <Text style={styles.subtitle}>Appointment Management System</Text>
          </View>

          {/* Registration Form */}
          <View style={styles.formContainer}>
            <Text style={styles.welcomeText}>Welcome</Text>
            <Text style={styles.loginText}>Create your account</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#A0A0A0"
                value={email}
                onChangeText={(text: string) => setEmail(text)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Name & Surname</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your Name and Surname"
                placeholderTextColor="#A0A0A0"
                value={name}
                onChangeText={(text: string) => setName(text)}
                autoCapitalize="words" //words: Make capital first letter of each word.
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#A0A0A0"
                value={password}
                onChangeText={(text: string) => setPassword(text)}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor="#A0A0A0"
                value={confirmPassword}
                onChangeText={(text: string) => setConfirmPassword(text)}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* User Type Selection */}
            <View style={styles.userTypeContainer}>
              <Text style={styles.userTypeTitle}>I am a ...</Text>
              <View style={styles.userTypeButtons}>
                <TouchableOpacity 
                  style={[ 
                    styles.userTypeButton, 
                    styles.patientButton,
                    userType === 'patient' && styles.selectedUserType
                  ]}
                  onPress={() => setUserType('patient')}
                >
                  <Text style={[
                    styles.userTypeButtonText, 
                    userType === 'patient' && styles.selectedUserTypeText
                  ]}>
                    Patient
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[ 
                    styles.userTypeButton, 
                    styles.doctorButton,
                    userType === 'doctor' && styles.selectedUserType
                  ]}
                  onPress={() => setUserType('doctor')}
                >
                  <Text style={[
                    styles.userTypeButtonText, 
                    styles.doctorButtonText,
                    userType === 'doctor' && styles.selectedUserTypeText
                  ]}>
                    Doctor
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity 
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Registering...' : 'Register'}
              </Text>
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/LoginScreen')}>
                <Text style={styles.signupLink}>Login Here</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2025 MedData Hospital</Text>
            <Text style={styles.footerSubtext}>Secure & Confidential</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
  },
  logoContainer: {
    marginBottom: 15,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2E86C1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  hospitalName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 5,
  },
  loginText: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 25,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34495E',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    color: '#2C3E50',
  },
  userTypeContainer: {
    marginBottom: 25,
  },
  userTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34495E',
    textAlign: 'center',
    marginBottom: 15,
  },
  userTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userTypeButton: {
    flex: 1,
    height: 45,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 2,
  },
  patientButton: {
    backgroundColor: '#fff',
    borderColor: '#27AE60',
  },
  doctorButton: {
    backgroundColor: '#fff',
    borderColor: '#E8E8E8',
  },
  selectedUserType: {
    backgroundColor: '#27AE60',
  },
  userTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#27AE60',
  },
  doctorButtonText: {
    color: '#7F8C8D',
  },
  selectedUserTypeText: {
    color: '#fff',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  signupLink: {
    fontSize: 14,
    color: '#3498DB',
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#2E86C1',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#2E86C1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#BDC3C7',
    shadowOpacity: 0.1,
    elevation: 2,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#95A5A6',
    marginBottom: 2,
  },
  footerSubtext: {
    fontSize: 11,
    color: '#BDC3C7',
  },
});
