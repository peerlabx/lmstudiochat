
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { Stack, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Model {
  id: string;
  object: string;
  created?: number;
  owned_by?: string;
}

const MODEL_STORAGE_KEY = '@selected_model';
const API_URL_STORAGE_KEY = '@api_url';
const DEFAULT_API_URL = 'http://localhost:1234';

export default function ModelSelectionScreen() {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    loadSelectedModel();
    loadApiUrl();
  }, []);

  useEffect(() => {
    if (apiUrl) {
      fetchModels();
    }
  }, [apiUrl]);

  const loadSelectedModel = async () => {
    try {
      const saved = await AsyncStorage.getItem(MODEL_STORAGE_KEY);
      if (saved) {
        setSelectedModel(saved);
        console.log('Loaded selected model:', saved);
      }
    } catch (error) {
      console.error('Error loading selected model:', error);
    }
  };

  const loadApiUrl = async () => {
    try {
      const saved = await AsyncStorage.getItem(API_URL_STORAGE_KEY);
      if (saved) {
        setApiUrl(saved);
        console.log('Loaded API URL:', saved);
      }
    } catch (error) {
      console.error('Error loading API URL:', error);
    }
  };

  const fetchModels = async () => {
    console.log('Fetching models from:', `${apiUrl}/v1/models`);
    setIsLoading(true);
    try {
      const modelsEndpoint = `${apiUrl}/v1/models`;
      
      const response = await fetch(modelsEndpoint, {
        method: 'GET',
        headers: {
          "Accept": "application/json"
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received data:', JSON.stringify(data, null, 2));
      
      let modelsArray: Model[] = [];

      if (data.data && Array.isArray(data.data)) {
        console.log(`Found ${data.data.length} models in data.data`);
        modelsArray = data.data;
      } else if (Array.isArray(data)) {
        console.log(`Found ${data.length} models in direct array`);
        modelsArray = data;
      }

      console.log('Setting models:', modelsArray.length);
      setModels(modelsArray);
      
      if (modelsArray.length > 0) {
        setDropdownOpen(true);
      }
      
    } catch (error) {
      console.error('Error fetching models:', error);
      
      Alert.alert(
        'Connection Error',
        `Failed to fetch models from LM Studio.\n\nMake sure:\n1. LM Studio is running\n2. A model is loaded\n3. The API server is started\n4. Your device is on the same network\n\nCurrent API URL: ${apiUrl}`,
        [{ text: 'OK' }]
      );
      setModels([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    console.log('Refresh button pressed');
    fetchModels();
  };

  const selectModel = async (modelId: string) => {
    try {
      console.log('Selecting model:', modelId);
      setSelectedModel(modelId);
      setDropdownOpen(false);
      await AsyncStorage.setItem(MODEL_STORAGE_KEY, modelId);
      console.log('Selected model saved:', modelId);
      
      Alert.alert(
        'Model Selected',
        `Successfully selected: ${modelId}\n\nThis model will be used for all chat conversations.`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving selected model:', error);
      Alert.alert('Error', 'Failed to save selected model');
    }
  };

  const renderEmpty = () => {
    return (
      <View style={styles.emptyContainer}>
        <IconSymbol name="exclamationmark.triangle" color={colors.textSecondary} size={64} />
        <Text style={styles.emptyTitle}>No Models Found</Text>
        <Text style={styles.emptyText}>
          Make sure you have loaded a model in LM Studio and the API server is running.
        </Text>
        <View style={styles.apiInfoBox}>
          <Text style={styles.apiInfoLabel}>API URL:</Text>
          <Text style={styles.apiInfoText}>{apiUrl}/v1/models</Text>
        </View>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <IconSymbol name="arrow.clockwise" color={colors.card} size={20} />
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Select Model',
          headerBackTitle: 'Back',
        }}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Model Selection</Text>
          <Text style={styles.headerSubtitle}>
            Choose a model from LM Studio to use for your conversations
          </Text>
          <View style={styles.apiUrlContainer}>
            <IconSymbol name="network" color={colors.primary} size={16} />
            <Text style={styles.apiUrlText}>{apiUrl}/v1/models</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading models...</Text>
            <Text style={styles.loadingSubtext}>Fetching from LM Studio API</Text>
          </View>
        ) : models.length === 0 ? (
          renderEmpty()
        ) : (
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownLabel}>Available Models ({models.length})</Text>
            
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setDropdownOpen(!dropdownOpen)}
              activeOpacity={0.7}
            >
              <View style={styles.dropdownButtonContent}>
                <IconSymbol name="cpu" color={colors.primary} size={24} />
                <Text style={styles.dropdownButtonText}>
                  {selectedModel || 'Select a model...'}
                </Text>
              </View>
              <IconSymbol 
                name={dropdownOpen ? "chevron.up" : "chevron.down"} 
                color={colors.text} 
                size={20} 
              />
            </TouchableOpacity>

            {dropdownOpen && (
              <View style={styles.dropdownList}>
                <ScrollView 
                  style={styles.dropdownScroll}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                >
                  {models.map((model, index) => {
                    const isSelected = model.id === selectedModel;
                    
                    return (
                      <TouchableOpacity
                        key={`${model.id}-${index}`}
                        style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
                        onPress={() => selectModel(model.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.dropdownItemContent}>
                          <IconSymbol 
                            name="cpu" 
                            color={isSelected ? colors.primary : colors.text} 
                            size={20} 
                          />
                          <View style={styles.dropdownItemText}>
                            <Text style={[styles.dropdownItemTitle, isSelected && styles.dropdownItemTitleSelected]}>
                              {model.id}
                            </Text>
                            {model.owned_by && (
                              <Text style={styles.dropdownItemSubtitle}>
                                Owner: {model.owned_by}
                              </Text>
                            )}
                          </View>
                        </View>
                        {isSelected && (
                          <IconSymbol name="checkmark.circle.fill" color={colors.primary} size={24} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {selectedModel && !dropdownOpen && (
              <View style={styles.selectedModelCard}>
                <View style={styles.selectedModelHeader}>
                  <IconSymbol name="checkmark.circle.fill" color={colors.primary} size={28} />
                  <Text style={styles.selectedModelTitle}>Currently Selected</Text>
                </View>
                <View style={styles.selectedModelInfo}>
                  <Text style={styles.selectedModelName}>{selectedModel}</Text>
                  {models.find(m => m.id === selectedModel)?.owned_by && (
                    <Text style={styles.selectedModelDetail}>
                      Owner: {models.find(m => m.id === selectedModel)?.owned_by}
                    </Text>
                  )}
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
              <IconSymbol name="arrow.clockwise" color={colors.primary} size={20} />
              <Text style={styles.refreshButtonText}>Refresh Models</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.infoCard}>
          <IconSymbol name="info.circle" color={colors.primary} size={20} />
          <Text style={styles.infoText}>
            The selected model will be used for all chat conversations. Make sure the model is loaded in LM Studio before starting a chat.
          </Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  apiUrlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  apiUrlText: {
    fontSize: 12,
    color: colors.text,
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  loadingSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textSecondary,
  },
  dropdownContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  dropdownLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  dropdownButton: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: colors.primary,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  dropdownList: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 400,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 5,
  },
  dropdownScroll: {
    maxHeight: 400,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  dropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownItemText: {
    marginLeft: 12,
    flex: 1,
  },
  dropdownItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  dropdownItemTitleSelected: {
    color: colors.primary,
  },
  dropdownItemSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  selectedModelCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 2,
    borderColor: colors.primary,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  selectedModelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedModelTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedModelInfo: {
    paddingLeft: 36,
  },
  selectedModelName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  selectedModelDetail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  refreshButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  apiInfoBox: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    width: '100%',
  },
  apiInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  apiInfoText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.2)',
    elevation: 4,
  },
  retryButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});
