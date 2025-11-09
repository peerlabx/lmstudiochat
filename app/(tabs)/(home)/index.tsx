
import React from "react";
import { Stack, Link } from "expo-router";
import { FlatList, Pressable, StyleSheet, View, Text, Alert, Platform } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { GlassView } from "expo-glass-effect";
import { useTheme } from "@react-navigation/native";
import { colors } from "@/styles/commonStyles";

export default function HomeScreen() {
  const theme = useTheme();

  const renderHeaderRight = () => (
    <Pressable
      onPress={() => Alert.alert("Not Implemented", "This feature is not implemented yet")}
      style={styles.headerButtonContainer}
    >
      <IconSymbol name="plus" color={colors.primary} />
    </Pressable>
  );

  const renderHeaderLeft = () => (
    <Pressable
      onPress={() => Alert.alert("Not Implemented", "This feature is not implemented yet")}
      style={styles.headerButtonContainer}
    >
      <IconSymbol
        name="gear"
        color={colors.primary}
      />
    </Pressable>
  );

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: "LM Studio Chat App",
            headerRight: renderHeaderRight,
            headerLeft: renderHeaderLeft,
          }}
        />
      )}
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <IconSymbol name="message.fill" color={colors.primary} size={80} />
          <Text style={styles.title}>Welcome to LM Studio Chat</Text>
          <Text style={styles.description}>
            Chat with AI models running locally on your computer using LM Studio.
          </Text>
          
          <View style={styles.featureCard}>
            <View style={styles.featureItem}>
              <IconSymbol name="bolt.fill" color={colors.secondary} size={24} />
              <Text style={styles.featureText}>Fast local inference</Text>
            </View>
            <View style={styles.featureItem}>
              <IconSymbol name="lock.fill" color={colors.secondary} size={24} />
              <Text style={styles.featureText}>Private and secure</Text>
            </View>
            <View style={styles.featureItem}>
              <IconSymbol name="cpu" color={colors.secondary} size={24} />
              <Text style={styles.featureText}>Runs on your hardware</Text>
            </View>
          </View>

          <Link href="/(tabs)/chat" asChild>
            <Pressable style={styles.startButton}>
              <Text style={styles.startButtonText}>Start Chatting</Text>
              <IconSymbol name="arrow.right" color={colors.card} size={20} />
            </Pressable>
          </Link>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Getting Started:</Text>
            <Text style={styles.infoText}>
              1. Install LM Studio on your computer{'\n'}
              2. Download and load a model{'\n'}
              3. Start the local API server{'\n'}
              4. Open the Chat tab to begin
            </Text>
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 0 : 100,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  featureCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 24,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
    fontWeight: '500',
  },
  startButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    marginBottom: 24,
    boxShadow: '0px 4px 12px rgba(41, 98, 255, 0.3)',
    elevation: 4,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.card,
    marginRight: 8,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
  },
  headerButtonContainer: {
    padding: 6,
  },
});
