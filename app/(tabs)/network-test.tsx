
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL_STORAGE_KEY = '@api_url';
const DEFAULT_API_URL = 'http://localhost:1234';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

export default function NetworkTestScreen() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [apiUrl, setApiUrl] = useState<string>('');

  const runTests = async () => {
    setIsRunning(true);
    const testResults: TestResult[] = [];

    // Test 1: Load API URL
    try {
      const saved = await AsyncStorage.getItem(API_URL_STORAGE_KEY);
      const url = saved || DEFAULT_API_URL;
      setApiUrl(url);
      
      testResults.push({
        name: 'API URL Configuration',
        status: 'success',
        message: 'API URL loaded successfully',
        details: url,
      });

      // Test 1.5: Check if using localhost on Android
      if (Platform.OS === 'android' && (url.includes('localhost') || url.includes('127.0.0.1'))) {
        testResults.push({
          name: 'Android localhost Check',
          status: 'error',
          message: 'Using localhost on Android device',
          details: 'localhost refers to the Android device itself, not your computer. You must use your computer\'s IP address (e.g., http://192.168.1.100:1234)',
        });
      } else if (Platform.OS === 'android') {
        testResults.push({
          name: 'Android localhost Check',
          status: 'success',
          message: 'Using IP address (correct for Android)',
          details: 'Good! You are using an IP address instead of localhost.',
        });
      }

      // Test 2: Basic fetch capability
      try {
        const testUrl = 'https://httpbin.org/get';
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });

        if (response.ok) {
          testResults.push({
            name: 'Internet Connectivity',
            status: 'success',
            message: 'Device can make HTTP requests',
            details: 'Successfully connected to test server',
          });
        } else {
          testResults.push({
            name: 'Internet Connectivity',
            status: 'warning',
            message: 'HTTP request returned non-OK status',
            details: `Status: ${response.status}`,
          });
        }
      } catch (error: any) {
        testResults.push({
          name: 'Internet Connectivity',
          status: 'error',
          message: 'Cannot make HTTP requests',
          details: error.message,
        });
      }

      // Test 3: LM Studio API connectivity
      try {
        const modelsEndpoint = `${url}/v1/models`;
        console.log('Testing LM Studio API:', modelsEndpoint);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(modelsEndpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));

        if (response.ok) {
          const data = await response.json();
          const modelCount = data.data?.length || (Array.isArray(data) ? data.length : 0);
          
          testResults.push({
            name: 'LM Studio API Connection',
            status: 'success',
            message: 'Successfully connected to LM Studio',
            details: `Found ${modelCount} model(s)`,
          });
        } else {
          testResults.push({
            name: 'LM Studio API Connection',
            status: 'error',
            message: 'LM Studio API returned error',
            details: `HTTP ${response.status}: ${response.statusText}`,
          });
        }
      } catch (error: any) {
        let errorDetails = error.message;
        
        if (error.name === 'AbortError') {
          errorDetails = 'Request timed out after 5 seconds. LM Studio may not be running or is unreachable.';
        } else if (error.message.includes('Network request failed')) {
          errorDetails = 'Network request failed. ';
          if (Platform.OS === 'android') {
            errorDetails += 'On Android, make sure you are using your computer\'s IP address, not localhost. ';
          }
          errorDetails += 'Check that LM Studio is running and both devices are on the same network.';
        }
        
        testResults.push({
          name: 'LM Studio API Connection',
          status: 'error',
          message: 'Cannot connect to LM Studio',
          details: errorDetails,
        });
      }

      // Test 4: Platform information
      testResults.push({
        name: 'Platform Information',
        status: 'success',
        message: `Running on ${Platform.OS}`,
        details: `Version: ${Platform.Version}`,
      });

    } catch (error: any) {
      testResults.push({
        name: 'Test Suite',
        status: 'error',
        message: 'Test suite encountered an error',
        details: error.message,
      });
    }

    setResults(testResults);
    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <IconSymbol name="checkmark.circle.fill" color="#4CAF50" size={24} />;
      case 'error':
        return <IconSymbol name="xmark.circle.fill" color="#F44336" size={24} />;
      case 'warning':
        return <IconSymbol name="exclamationmark.triangle.fill" color="#FF9800" size={24} />;
      default:
        return <IconSymbol name="clock.fill" color={colors.textSecondary} size={24} />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      case 'warning':
        return '#FF9800';
      default:
        return colors.textSecondary;
    }
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
          <IconSymbol name="network" color={colors.primary} size={48} />
          <Text style={styles.headerTitle}>Network Diagnostics</Text>
          <Text style={styles.headerSubtitle}>
            Test your connection to LM Studio and diagnose network issues
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.runButton, isRunning && styles.runButtonDisabled]}
          onPress={runTests}
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <ActivityIndicator color={colors.card} size="small" />
              <Text style={styles.runButtonText}>Running Tests...</Text>
            </>
          ) : (
            <>
              <IconSymbol name="play.circle.fill" color={colors.card} size={24} />
              <Text style={styles.runButtonText}>Run Network Tests</Text>
            </>
          )}
        </TouchableOpacity>

        {apiUrl && (
          <View style={styles.infoCard}>
            <IconSymbol name="info.circle" color={colors.primary} size={20} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Testing API URL:</Text>
              <Text style={styles.infoValue}>{apiUrl}</Text>
            </View>
          </View>
        )}

        {results.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Test Results</Text>
            
            {results.map((result, index) => (
              <View key={index} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  {getStatusIcon(result.status)}
                  <View style={styles.resultHeaderText}>
                    <Text style={styles.resultName}>{result.name}</Text>
                    <Text style={[styles.resultMessage, { color: getStatusColor(result.status) }]}>
                      {result.message}
                    </Text>
                  </View>
                </View>
                {result.details && (
                  <View style={styles.resultDetails}>
                    <Text style={styles.resultDetailsText}>{result.details}</Text>
                  </View>
                )}
              </View>
            ))}

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <IconSymbol name="checkmark.circle.fill" color="#4CAF50" size={20} />
                  <Text style={styles.summaryText}>
                    {results.filter(r => r.status === 'success').length} Passed
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <IconSymbol name="exclamationmark.triangle.fill" color="#FF9800" size={20} />
                  <Text style={styles.summaryText}>
                    {results.filter(r => r.status === 'warning').length} Warnings
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <IconSymbol name="xmark.circle.fill" color="#F44336" size={20} />
                  <Text style={styles.summaryText}>
                    {results.filter(r => r.status === 'error').length} Failed
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.helpCard}>
          <IconSymbol name="lightbulb.fill" color="#FFC107" size={24} />
          <View style={styles.helpContent}>
            <Text style={styles.helpTitle}>Troubleshooting Tips</Text>
            <Text style={styles.helpText}>
              • Make sure LM Studio is running on your computer{'\n'}
              • Load a model in LM Studio{'\n'}
              • Start the local server in LM Studio{'\n'}
              • On Android, use your computer&apos;s IP address (not localhost){'\n'}
              • Ensure both devices are on the same WiFi network{'\n'}
              • Check your computer&apos;s firewall settings{'\n'}
              • Disable VPN if you&apos;re using one
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
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  runButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    boxShadow: '0px 4px 12px rgba(41, 98, 255, 0.3)',
    elevation: 4,
    gap: 8,
  },
  runButtonDisabled: {
    opacity: 0.6,
  },
  runButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  resultsContainer: {
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  resultCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  resultHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  resultMessage: {
    fontSize: 14,
    fontWeight: '500',
  },
  resultDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  resultDetailsText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    gap: 4,
  },
  summaryText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF9C4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  helpContent: {
    flex: 1,
    marginLeft: 12,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
  },
});
