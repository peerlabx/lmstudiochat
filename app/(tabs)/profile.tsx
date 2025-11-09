
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Platform, TextInput, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL_STORAGE_KEY = '@api_url';
const DEFAULT_API_URL = 'http://localhost:1234';

export default function ProfileScreen() {
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [isEditing, setIsEditing] = useState(false);
  const [tempApiUrl, setTempApiUrl] = useState(DEFAULT_API_URL);

  useEffect(() => {
    loadApiUrl();
  }, []);

  const loadApiUrl = async () => {
    try {
      const saved = await AsyncStorage.getItem(API_URL_STORAGE_KEY);
      if (saved) {
        setApiUrl(saved);
        setTempApiUrl(saved);
        console.log('Loaded API URL:', saved);
      }
    } catch (error) {
      console.error('Error loading API URL:', error);
    }
  };

  const saveApiUrl = async () => {
    try {
      if (!tempApiUrl.trim()) {
        Alert.alert('Error', 'API URL cannot be empty');
        return;
      }

      const cleanUrl = tempApiUrl.trim();
      
      // Validate URL format
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        Alert.alert('Invalid URL', 'API URL must start with http:// or https://');
        return;
      }

      // Check for localhost on Android
      if (Platform.OS === 'android' && (cleanUrl.includes('localhost') || cleanUrl.includes('127.0.0.1'))) {
        Alert.alert(
          'Warning: localhost on Android',
          'You are using localhost or 127.0.0.1 on an Android device.\n\n' +
          'This will NOT work because localhost refers to the Android device itself, not your computer.\n\n' +
          'You need to use your computer\'s IP address instead (e.g., http://192.168.1.100:1234).\n\n' +
          'Do you want to save this URL anyway?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Save Anyway',
              style: 'destructive',
              onPress: async () => {
                await AsyncStorage.setItem(API_URL_STORAGE_KEY, cleanUrl);
                setApiUrl(cleanUrl);
                setTempApiUrl(cleanUrl);
                setIsEditing(false);
                console.log('API URL saved (with localhost warning):', cleanUrl);
              },
            },
          ]
        );
        return;
      }

      await AsyncStorage.setItem(API_URL_STORAGE_KEY, cleanUrl);
      setApiUrl(cleanUrl);
      setTempApiUrl(cleanUrl);
      setIsEditing(false);
      console.log('API URL saved:', cleanUrl);
      
      Alert.alert(
        'Success',
        `API URL has been updated to:\n${cleanUrl}\n\nThe new URL will be used for all future requests.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving API URL:', error);
      Alert.alert('Error', 'Failed to save API URL');
    }
  };

  const resetToDefault = () => {
    Alert.alert(
      'Reset to Default',
      'Are you sure you want to reset the API URL to the default value?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setTempApiUrl(DEFAULT_API_URL);
            await AsyncStorage.setItem(API_URL_STORAGE_KEY, DEFAULT_API_URL);
            setApiUrl(DEFAULT_API_URL);
            setIsEditing(false);
            console.log('API URL reset to default:', DEFAULT_API_URL);
          },
        },
      ]
    );
  };

  const cancelEdit = () => {
    setTempApiUrl(apiUrl);
    setIsEditing(false);
  };

  const showNetworkHelp = () => {
    let helpMessage = 'To connect to LM Studio from this device:\n\n';
    
    if (Platform.OS === 'android') {
      helpMessage += '📱 ANDROID DEVICE\n\n';
      helpMessage += '1. Find your computer\'s IP address:\n';
      helpMessage += '   • Windows: Open CMD, type "ipconfig"\n';
      helpMessage += '   • Mac: Open Terminal, type "ifconfig"\n';
      helpMessage += '   • Linux: Open Terminal, type "ip addr"\n';
      helpMessage += '   • Look for IPv4 address (e.g., 192.168.1.100)\n\n';
      helpMessage += '2. Use that IP in your API URL:\n';
      helpMessage += '   • Example: http://192.168.1.100:1234\n\n';
      helpMessage += '3. Make sure:\n';
      helpMessage += '   • Both devices are on the same WiFi\n';
      helpMessage += '   • LM Studio server is running\n';
      helpMessage += '   • Firewall allows port 1234\n';
    } else {
      helpMessage += '1. Make sure LM Studio is running\n';
      helpMessage += '2. Start the local server in LM Studio\n';
      helpMessage += '3. Enable CORS in LM Studio settings\n';
      helpMessage += '4. Use the correct API URL\n';
    }
    
    Alert.alert('Network Setup Help', helpMessage, [{ text: 'OK' }]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          Platform.OS !== 'ios' && styles.scrollContentWithTabBar
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <IconSymbol name="person.fill" color={colors.card} size={48} />
          </View>
          <Text style={styles.name}>LM Studio User</Text>
          <Text style={styles.email}>user@lmstudio.ai</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>API Settings</Text>
            <TouchableOpacity onPress={showNetworkHelp} style={styles.helpButton}>
              <IconSymbol name="questionmark.circle" color={colors.primary} size={20} />
            </TouchableOpacity>
          </View>
          
          {Platform.OS === 'android' && (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) && (
            <View style={styles.androidWarningCard}>
              <IconSymbol name="exclamationmark.triangle.fill" color="#FF9800" size={24} />
              <View style={styles.androidWarningContent}>
                <Text style={styles.androidWarningTitle}>Android Device Detected</Text>
                <Text style={styles.androidWarningText}>
                  localhost won&apos;t work on Android! You need to use your computer&apos;s IP address.
                </Text>
                <TouchableOpacity onPress={showNetworkHelp} style={styles.androidWarningButton}>
                  <Text style={styles.androidWarningButtonText}>Show Setup Instructions</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingHeader}>
                <IconSymbol name="network" color={colors.primary} size={20} />
                <Text style={styles.settingLabel}>API URL</Text>
              </View>
              
              {isEditing ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={styles.input}
                    value={tempApiUrl}
                    onChangeText={setTempApiUrl}
                    placeholder="Enter API URL (e.g., http://192.168.1.100:1234)"
                    placeholderTextColor={colors.textSecondary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                  />
                  <View style={styles.buttonRow}>
                    <TouchableOpacity 
                      style={[styles.button, styles.cancelButton]} 
                      onPress={cancelEdit}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.button, styles.saveButton]} 
                      onPress={saveApiUrl}
                    >
                      <IconSymbol name="checkmark" color={colors.card} size={16} />
                      <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.displayContainer}>
                  <Text style={styles.apiUrlDisplay}>{apiUrl}</Text>
                  <View style={styles.buttonRow}>
                    <TouchableOpacity 
                      style={[styles.button, styles.editButton]} 
                      onPress={() => setIsEditing(true)}
                    >
                      <IconSymbol name="pencil" color={colors.primary} size={16} />
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.button, styles.resetButton]} 
                      onPress={resetToDefault}
                    >
                      <IconSymbol name="arrow.counterclockwise" color={colors.secondary} size={16} />
                      <Text style={styles.resetButtonText}>Reset</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.infoBox}>
              <IconSymbol name="info.circle" color={colors.primary} size={16} />
              <Text style={styles.infoBoxText}>
                Enter the base URL for LM Studio&apos;s API. {Platform.OS === 'android' ? 'On Android, use your computer\'s IP address (e.g., http://192.168.1.100:1234)' : 'Example: http://localhost:1234'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              This app allows you to chat with AI models running locally on your computer using LM Studio.
              All conversations are processed on your device, ensuring privacy and security.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.card}>
            <View style={styles.featureItem}>
              <IconSymbol name="checkmark.circle.fill" color={colors.secondary} size={20} />
              <Text style={styles.featureText}>Local AI inference</Text>
            </View>
            <View style={styles.featureItem}>
              <IconSymbol name="checkmark.circle.fill" color={colors.secondary} size={20} />
              <Text style={styles.featureText}>Privacy-focused</Text>
            </View>
            <View style={styles.featureItem}>
              <IconSymbol name="checkmark.circle.fill" color={colors.secondary} size={20} />
              <Text style={styles.featureText}>No internet required</Text>
            </View>
            <View style={styles.featureItem}>
              <IconSymbol name="checkmark.circle.fill" color={colors.secondary} size={20} />
              <Text style={styles.featureText}>Multiple model support</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requirements</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              • LM Studio installed on your computer{'\n'}
              • A compatible AI model loaded{'\n'}
              • Local API server running{'\n'}
              • Device on the same network{'\n'}
              {Platform.OS === 'android' ? '• Use computer\'s IP address (not localhost)' : ''}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  scrollContentWithTabBar: {
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    boxShadow: '0px 4px 12px rgba(41, 98, 255, 0.3)',
    elevation: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  helpButton: {
    padding: 4,
  },
  androidWarningCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  androidWarningContent: {
    flex: 1,
    marginLeft: 12,
  },
  androidWarningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E65100',
    marginBottom: 4,
  },
  androidWarningText: {
    fontSize: 14,
    color: '#E65100',
    lineHeight: 20,
    marginBottom: 8,
  },
  androidWarningButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  androidWarningButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  cardText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 15,
    color: colors.text,
    marginLeft: 12,
  },
  settingRow: {
    marginBottom: 12,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  editContainer: {
    marginTop: 8,
  },
  displayContainer: {
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 12,
  },
  apiUrlDisplay: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  editButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  resetButtonText: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    marginLeft: 8,
    lineHeight: 18,
  },
});
