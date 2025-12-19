import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Message, Suggestion } from '../types';

const initialSuggestions: Suggestion[] = [
  { id: '1', text: 'What is karma yoga?' },
  { id: '2', text: 'Explain Chapter 2 of Bhagavad Gita' },
  { id: '3', text: 'How to practice meditation?' },
  { id: '4', text: 'What is the path to liberation?' },
];

export default function AIBuddyScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Namaste! 🙏 I am your AI spiritual companion.\nHow can I guide you on your journey with the Bhagavad Gita today?',
      isUser: false,
    },
  ]);
  const [inputText, setInputText] = useState('');

  const sendMessage = () => {
    if (inputText.trim()) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: inputText,
        isUser: true,
      };

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "Thank you for your question. As an AI companion, I'm here to help guide you through the teachings of the Bhagavad Gita. Please note this is a demo response.",
        isUser: false,
      };

      setMessages([...messages, userMessage, aiResponse]);
      setInputText('');
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    setInputText(suggestion);
  };

  return (
    <LinearGradient colors={['#172554', '#1e3a8a']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={90}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.aiIcon}>
            <Ionicons name="chatbubbles" size={40} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>AI Buddy</Text>
          <Text style={styles.headerSubtitle}>Spiritual Guidance</Text>
        </View>

        {/* Messages */}
        <ScrollView style={styles.messagesContainer}>
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.isUser ? styles.userMessage : styles.aiMessage,
              ]}
            >
              {!message.isUser && (
                <View style={styles.aiLabel}>
                  <Ionicons name="flash" size={16} color="#fb923c" />
                  <Text style={styles.aiLabelText}>AI Buddy</Text>
                </View>
              )}
              <Text
                style={[
                  styles.messageText,
                  message.isUser && styles.userMessageText,
                ]}
              >
                {message.text}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Suggestions */}
        {messages.length === 1 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Suggestions:</Text>
            <View style={styles.suggestionsGrid}>
              {initialSuggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.id}
                  style={styles.suggestionButton}
                  onPress={() => handleSuggestionPress(suggestion.text)}
                >
                  <Ionicons name="sparkles" size={16} color="#fb923c" />
                  <Text style={styles.suggestionText}>{suggestion.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask me anything..."
            placeholderTextColor="#94a3b8"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() ? '#fff' : '#64748b'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 15,
  },
  aiIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fb923c',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#cbd5e1',
    marginTop: 4,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  messageBubble: {
    marginVertical: 8,
    padding: 15,
    borderRadius: 16,
    maxWidth: '85%',
  },
  aiMessage: {
    backgroundColor: '#1e40af',
    alignSelf: 'flex-start',
  },
  userMessage: {
    backgroundColor: '#fb923c',
    alignSelf: 'flex-end',
  },
  aiLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  aiLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fb923c',
  },
  messageText: {
    fontSize: 15,
    color: '#e2e8f0',
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  suggestionsContainer: {
    padding: 15,
  },
  suggestionsTitle: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 10,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  suggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e40af',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  suggestionText: {
    fontSize: 13,
    color: '#e2e8f0',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 15,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#1e40af',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    color: '#fff',
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fb923c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#334155',
  },
});
