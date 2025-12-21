import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Message, Suggestion } from '../types';
import { getChatbotResponse } from '../services/geminiService';

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
      text: 'Radhey Radhey! 🙏 I am Krishna, your spiritual BFF and coach.\nHow can I help you apply the teachings of the Bhagavad Gita to your life today?',
      isUser: false,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackTargetId, setFeedbackTargetId] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<'up' | 'down' | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [otherFeedback, setOtherFeedback] = useState('');

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = async () => {
    if (inputText.trim() && !isLoading) {
      const questionText = inputText;
      
      const userMessage: Message = {
        id: Date.now().toString(),
        text: questionText,
        isUser: true,
      };

      setMessages(prev => [...prev, userMessage]);
      setInputText('');
      setIsLoading(true);

      try {
        // Use the geminiService for structured responses
        console.log('Sending message to Gemini:', questionText);
        console.log('Chat history length:', messages.length);
        
        const response = await getChatbotResponse(questionText, messages);
        
        console.log('Received response:', response);

        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: `${response.summary}\n\n${response.detailedExplanation}`,
          isUser: false,
        };

        setMessages(prev => [...prev, aiResponse]);
      } catch (error) {
        console.error('Error calling Gemini API:', error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Radhey Radhey! I encountered a small ripple in the cosmos. Could you try asking that again?',
          isUser: false,
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
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
          <Text style={styles.headerTitle}>Krishna - Your Spiritual BFF</Text>
          <Text style={styles.headerSubtitle}>Guidance from the Bhagavad Gita</Text>
        </View>

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
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
              {/* Feedback controls for AI responses */}
              {!message.isUser && (
                <View style={styles.feedbackRow}>
                  <TouchableOpacity
                    style={[
                      styles.feedbackButton,
                      message.id === feedbackTargetId && feedbackRating === 'up' && styles.feedbackButtonActiveUp,
                    ]}
                    onPress={() => {
                      setFeedbackTargetId(message.id);
                      setFeedbackRating('up');
                      setFeedbackVisible(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="thumbs-up"
                      size={16}
                      color={message.id === feedbackTargetId && feedbackRating === 'up' ? '#fff' : '#94a3b8'}
                      style={styles.feedbackIcon}
                    />
                    <Text style={[styles.feedbackCount, message.id === feedbackTargetId && feedbackRating === 'up' && styles.feedbackCountActive]}> </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.feedbackButton,
                      message.id === feedbackTargetId && feedbackRating === 'down' && styles.feedbackButtonActiveDown,
                    ]}
                    onPress={() => {
                      setFeedbackTargetId(message.id);
                      setFeedbackRating('down');
                      setFeedbackVisible(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="thumbs-down"
                      size={16}
                      color={message.id === feedbackTargetId && feedbackRating === 'down' ? '#fff' : '#94a3b8'}
                      style={styles.feedbackIcon}
                    />
                    <Text style={[styles.feedbackCount, message.id === feedbackTargetId && feedbackRating === 'down' && styles.feedbackCountActive]}> </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#fb923c" />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          )}
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
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={inputText.trim() ? '#fff' : '#64748b'}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Feedback Modal */}
      <Modal
        visible={feedbackVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setFeedbackVisible(false);
          setFeedbackTargetId(null);
          setFeedbackRating(null);
          setSelectedReasons([]);
          setOtherFeedback('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Why did you choose this rating? (optional)</Text>
            <View style={styles.reasonsRow}>
              {['Factually correct','Easy to understand','Informative','Creative / Interesting','Other'].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.reasonTag, selectedReasons.includes(r) && styles.reasonTagActive]}
                  onPress={() => {
                    if (selectedReasons.includes(r)) setSelectedReasons(prev => prev.filter(x => x !== r));
                    else setSelectedReasons(prev => [...prev, r]);
                    if (r === 'Other') setOtherFeedback('');
                  }}
                >
                  <Text style={[styles.reasonText, selectedReasons.includes(r) && styles.reasonTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.otherInput}
              placeholder="Provide additional feedback"
              placeholderTextColor="#94a3b8"
              multiline
              value={otherFeedback}
              onChangeText={setOtherFeedback}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.submitButton, !feedbackRating && styles.submitButtonDisabled]}
                onPress={() => {
                  // Submit feedback - for now log to console and close modal
                  console.log('Feedback submitted', {
                    messageId: feedbackTargetId,
                    rating: feedbackRating,
                    reasons: selectedReasons,
                    other: otherFeedback,
                  });
                  setFeedbackVisible(false);
                  setFeedbackTargetId(null);
                  setFeedbackRating(null);
                  setSelectedReasons([]);
                  setOtherFeedback('');
                }}
                disabled={!feedbackRating}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setFeedbackVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#1e40af',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 16,
    marginVertical: 8,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  feedbackRow: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  feedbackIcon: {
    marginRight: 6,
  },
  feedbackCount: {
    color: 'transparent',
    fontSize: 12,
  },
  feedbackCountActive: {
    color: '#fff',
  },
  feedbackButtonActiveUp: {
    backgroundColor: '#1e3a8a',
    borderColor: '#214d8f',
  },
  feedbackButtonActiveDown: {
    backgroundColor: '#172554',
    borderColor: '#102040',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
  },
  reasonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  reasonTag: {
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  reasonTagActive: {
    borderColor: '#fb923c',
    backgroundColor: '#1e3a8a',
  },
  reasonText: {
    color: '#cbd5e1',
  },
  reasonTextActive: {
    color: '#fb923c',
  },
  otherInput: {
    backgroundColor: '#0b1220',
    color: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  submitButton: {
    backgroundColor: '#fb923c',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#334155',
  },
  submitButtonText: {
    color: '#071033',
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#cbd5e1',
  },
});
