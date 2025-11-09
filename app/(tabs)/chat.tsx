
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { Stack, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const MODEL_STORAGE_KEY = '@selected_model';
const API_URL_STORAGE_KEY = '@api_url';
const DEFAULT_API_URL = 'http://localhost:1234';

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [selectedModel, setSelectedModel] = useState('local-model');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const loadSettings = async () => {
    try {
      const savedModel = await AsyncStorage.getItem(MODEL_STORAGE_KEY);
      const savedUrl = await AsyncStorage.getItem(API_URL_STORAGE_KEY);
      
      if (savedModel) {
        setSelectedModel(savedModel);
        console.log('Loaded selected model:', savedModel);
      }
      
      if (savedUrl) {
        setApiUrl(savedUrl);
        console.log('Loaded API URL:', savedUrl);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) {
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const chatEndpoint = `${apiUrl}/v1/chat/completions`;
      console.log('Sending message to:', chatEndpoint);
      console.log('Using model:', selectedModel);
      
      const apiMessages = [
        ...messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: 'user',
          content: userMessage.content,
        },
      ];

      const requestBody = {
        model: selectedModel,
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: -1,
        stream: false,
      };

      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(chatEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received response from LM Studio');

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from API');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.choices[0].message.content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      Alert.alert(
        'Connection Error',
        `Failed to connect to LM Studio.\n\nMake sure:\n1. LM Studio is running\n2. A model is loaded (${selectedModel})\n3. The API server is started\n4. Your device is on the same network\n\nCurrent API URL: ${apiUrl}`,
        [
          {
            text: 'Change URL',
            onPress: () => {
              Alert.prompt(
                'API URL',
                'Enter the LM Studio API URL:',
                (text) => {
                  if (text) {
                    setApiUrl(text.trim());
                    AsyncStorage.setItem(API_URL_STORAGE_KEY, text.trim());
                  }
                },
                'plain-text',
                apiUrl
              );
            },
          },
          { text: 'OK' },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear all messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => setMessages([]),
        },
      ]
    );
  };

  const openModelSelection = () => {
    router.push('/model-selection');
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}
        >
          <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
            {item.content}
          </Text>
          <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.assistantTimestamp]}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const renderHeaderRight = () => (
    <View style={styles.headerButtons}>
      <TouchableOpacity onPress={openModelSelection} style={styles.headerButton}>
        <IconSymbol name="cpu" color={colors.primary} size={20} />
      </TouchableOpacity>
      <TouchableOpacity onPress={clearChat} style={styles.headerButton}>
        <IconSymbol name="trash" color={colors.primary} size={20} />
      </TouchableOpacity>
    </View>
  );

  const renderHeaderLeft = () => (
    <TouchableOpacity
      onPress={() => {
        Alert.prompt(
          'API URL',
          'Enter the LM Studio API URL:',
          (text) => {
            if (text) {
              setApiUrl(text.trim());
              AsyncStorage.setItem(API_URL_STORAGE_KEY, text.trim());
            }
          },
          'plain-text',
          apiUrl
        );
      }}
      style={styles.headerButton}
    >
      <IconSymbol name="gear" color={colors.primary} size={20} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: 'LM Studio Chat',
            headerRight: renderHeaderRight,
            headerLeft: renderHeaderLeft,
          }}
        />
      )}
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol name="message" color={colors.textSecondary} size={64} />
            <Text style={styles.emptyTitle}>Start a Conversation</Text>
            <Text style={styles.emptyText}>
              Send a message to chat with your AI model running in LM Studio
            </Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Setup Instructions:</Text>
              <Text style={styles.infoText}>
                1. Open LM Studio on your computer{'\n'}
                2. Load a model{'\n'}
                3. Start the local server{'\n'}
                4. Make sure your device is on the same network
              </Text>
              <Text style={styles.apiUrlText}>API: {apiUrl}</Text>
              <Text style={styles.modelText}>Model: {selectedModel}</Text>
            </View>
            <TouchableOpacity style={styles.selectModelButton} onPress={openModelSelection}>
              <IconSymbol name="cpu" color={colors.card} size={20} />
              <Text style={styles.selectModelButtonText}>Select Model</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={2000}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.card} size="small" />
              ) : (
                <IconSymbol name="arrow.up" color={colors.card} size={20} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  apiUrlText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  modelText: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: '500',
  },
  selectModelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.2)',
    elevation: 4,
  },
  selectModelButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 16 : 100,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  assistantMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: colors.card,
  },
  assistantText: {
    color: colors.text,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  assistantTimestamp: {
    color: colors.textSecondary,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingBottom: Platform.OS === 'ios' ? 12 : 90,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.background,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 4,
  },
});
