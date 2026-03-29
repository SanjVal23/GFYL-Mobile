import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Message, Suggestion } from '../types';
import { getChatbotResponse } from '../services/geminiService';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../services/supabaseClient';
import { useLocalization } from '../contexts/LocalizationContext';

const initialSuggestions: Suggestion[] = [
  { id: '1', text: 'What is karma yoga?' },
  { id: '2', text: 'Explain Chapter 2 of Bhagavad Gita' },
  { id: '3', text: 'How to practice meditation?' },
  { id: '4', text: 'What is the path to liberation?' },
];

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  text: 'Radhey Radhey! 🙏 I am Krishna, your spiritual BFF and coach.\nHow can I help you apply the teachings of the Bhagavad Gita to your life today?',
  isUser: false,
};

interface ChatConversation {
  id: string;
  title: string;
  updatedAt: string;
  messages: Message[];
}

const createNewConversation = (): ChatConversation => ({
  id: `conv-${Date.now()}`,
  title: 'New chat',
  updatedAt: new Date().toISOString(),
  messages: [WELCOME_MESSAGE],
});

const sortByUpdated = (items: ChatConversation[]) =>
  [...items].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

export default function AIBuddyScreen() {
  const { user } = useUser();
  const { t } = useLocalization();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [historyVisible, setHistoryVisible] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackTargetId, setFeedbackTargetId] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<'up' | 'down' | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [otherFeedback, setOtherFeedback] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  const storageKey = useMemo(
    () => `chat_conversations:${user.id || 'guest'}`,
    [user.id]
  );

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );

  const messages = activeConversation?.messages ?? [WELCOME_MESSAGE];

  const patchConversation = (conversationId: string, updater: (conversation: ChatConversation) => ChatConversation) => {
    setConversations((prev) => {
      const index = prev.findIndex((item) => item.id === conversationId);
      if (index === -1) {
        return prev;
      }

      const updated = updater(prev[index]);
      const copy = [...prev];
      copy[index] = updated;
      return copy;
    });
  };

  const startNewConversation = () => {
    const nextConversation = createNewConversation();
    setConversations((prev) => [nextConversation, ...prev]);
    setActiveConversationId(nextConversation.id);
    setInputText('');
    setHistoryVisible(false);
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored) as ChatConversation[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            const normalized = sortByUpdated(parsed).map((item) => ({
              ...item,
              messages: item.messages?.length ? item.messages : [WELCOME_MESSAGE],
            }));
            setConversations(normalized);
            setActiveConversationId(normalized[0].id);
            return;
          }
        }

        if (!user.isGuest && user.id) {
          const { data, error } = await supabase
            .from('chat_messages')
            .select('id,role,text,created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });

          if (!error && data && data.length > 0) {
            const restored: ChatConversation = {
              id: `legacy-${Date.now()}`,
              title: 'Previous chat',
              updatedAt: data[data.length - 1].created_at || new Date().toISOString(),
              messages: data.map((item) => ({
                id: item.id,
                text: item.text,
                isUser: item.role === 'user',
              })),
            };
            setConversations([restored]);
            setActiveConversationId(restored.id);
            return;
          }
        }

        const first = createNewConversation();
        setConversations([first]);
        setActiveConversationId(first.id);
      } catch (error) {
        console.error('Failed to load conversations', error);
        const first = createNewConversation();
        setConversations([first]);
        setActiveConversationId(first.id);
      }
    };

    loadConversations();
  }, [storageKey, user.id, user.isGuest]);

  useEffect(() => {
    if (conversations.length === 0) return;
    AsyncStorage.setItem(storageKey, JSON.stringify(conversations)).catch((error) => {
      console.error('Failed to persist conversations', error);
    });
  }, [conversations, storageKey]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading || !activeConversation) return;

    const questionText = inputText.trim();
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: questionText,
      isUser: true,
    };

    const contextMessages = [...activeConversation.messages, userMessage];

    patchConversation(activeConversation.id, (conversation) => ({
      ...conversation,
      updatedAt: new Date().toISOString(),
      title:
        conversation.title === 'New chat'
          ? questionText.slice(0, 42)
          : conversation.title,
      messages: [...conversation.messages, userMessage],
    }));

    setInputText('');
    setIsLoading(true);

    try {
      const response = await getChatbotResponse(questionText, contextMessages);
      const aiResponse: Message = {
        id: `assistant-${Date.now()}`,
        text: `${response.summary}\n\n${response.detailedExplanation}`,
        isUser: false,
      };

      patchConversation(activeConversation.id, (conversation) => ({
        ...conversation,
        updatedAt: new Date().toISOString(),
        messages: [...conversation.messages, aiResponse],
      }));

      if (!user.isGuest && user.id) {
        await supabase.from('chat_messages').insert([
          {
            user_id: user.id,
            role: 'user',
            text: questionText,
          },
          {
            user_id: user.id,
            role: 'assistant',
            text: aiResponse.text,
          },
        ]);
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      const errorMessage: Message = {
        id: `assistant-error-${Date.now()}`,
        text: 'Radhey Radhey! I encountered a small ripple in the cosmos. Could you try asking that again?',
        isUser: false,
      };

      patchConversation(activeConversation.id, (conversation) => ({
        ...conversation,
        updatedAt: new Date().toISOString(),
        messages: [...conversation.messages, errorMessage],
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    setInputText(suggestion);
  };

  const visibleConversations = sortByUpdated(conversations);

  return (
    <LinearGradient colors={['#172554', '#1e3a8a']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={90}
      >
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.headerActionButton} onPress={() => setHistoryVisible(true)}>
            <Ionicons name="time-outline" size={18} color="#fff" />
            <Text style={styles.headerActionText}>{t('ai.history', 'History')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerActionButton} onPress={startNewConversation}>
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={styles.headerActionText}>{t('ai.newChat', 'New Chat')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <View style={styles.aiIcon}>
            <Ionicons name="chatbubbles" size={40} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>{t('ai.title', 'Krishna - Your Spiritual BFF')}</Text>
          <Text style={styles.headerSubtitle}>{t('ai.subtitle', 'Guidance from the Bhagavad Gita')}</Text>
          {activeConversation ? (
            <Text style={styles.activeConversationTitle}>{activeConversation.title}</Text>
          ) : null}
        </View>

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

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={t('ai.placeholder', 'Ask me anything...')}
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

      <Modal
        visible={historyVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setHistoryVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.historyHeaderRow}>
              <Text style={styles.modalTitle}>{t('ai.savedConversations', 'Saved Conversations')}</Text>
              <TouchableOpacity onPress={startNewConversation}>
                <Ionicons name="add-circle-outline" size={22} color="#fb923c" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.historyList}>
              {visibleConversations.map((conversation) => (
                <TouchableOpacity
                  key={conversation.id}
                  style={[
                    styles.historyItem,
                    conversation.id === activeConversationId && styles.historyItemActive,
                  ]}
                  onPress={() => {
                    setActiveConversationId(conversation.id);
                    setHistoryVisible(false);
                  }}
                >
                  <Ionicons
                    name="chatbox-ellipses-outline"
                    size={18}
                    color={conversation.id === activeConversationId ? '#fb923c' : '#94a3b8'}
                  />
                  <View style={styles.historyTextWrap}>
                    <Text style={styles.historyTitle}>{conversation.title}</Text>
                    <Text style={styles.historyMeta}>
                      {new Date(conversation.updatedAt).toLocaleString()} • {conversation.messages.length} msgs
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.cancelButton} onPress={() => setHistoryVisible(false)}>
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
              {['Factually correct', 'Easy to understand', 'Informative', 'Creative / Interesting', 'Other'].map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[styles.reasonTag, selectedReasons.includes(reason) && styles.reasonTagActive]}
                  onPress={() => {
                    if (selectedReasons.includes(reason)) {
                      setSelectedReasons((prev) => prev.filter((item) => item !== reason));
                    } else {
                      setSelectedReasons((prev) => [...prev, reason]);
                    }
                  }}
                >
                  <Text style={[styles.reasonText, selectedReasons.includes(reason) && styles.reasonTextActive]}>{reason}</Text>
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
                style={[styles.submitButton, (!feedbackRating || feedbackSubmitting) && styles.submitButtonDisabled]}
                onPress={async () => {
                  try {
                    setFeedbackSubmitting(true);

                    const feedbackData = {
                      timestamp: new Date().toLocaleString(),
                      messageId: feedbackTargetId,
                      rating: feedbackRating,
                      reasons: selectedReasons.join(', '),
                      feedback: otherFeedback,
                    };

                    const GOOGLE_APPS_SCRIPT_URL =
                      'https://script.google.com/macros/s/AKfycbwZfLbOV7kYs_utlb6KkDpnIjsg-J0KrDjo-9nz_qbUmE2GdQ8ZBC0BxUUaC2NV76KrSQ/exec';

                    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
                      method: 'POST',
                      body: JSON.stringify(feedbackData),
                    });

                    if (!response.ok) {
                      console.error('Failed to submit feedback, status:', response.status);
                      setFeedbackSubmitting(false);
                      return;
                    }

                    setFeedbackVisible(false);
                    setFeedbackTargetId(null);
                    setFeedbackRating(null);
                    setSelectedReasons([]);
                    setOtherFeedback('');
                    setFeedbackSubmitting(false);
                  } catch (error) {
                    console.error('Error submitting feedback:', error);
                    setFeedbackSubmitting(false);
                  }
                }}
                disabled={!feedbackRating || feedbackSubmitting}
              >
                {feedbackSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setFeedbackVisible(false);
                }}
                disabled={feedbackSubmitting}
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
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 14,
  },
  headerActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e40af',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  headerActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    paddingTop: 10,
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
  activeConversationTitle: {
    fontSize: 12,
    color: '#93c5fd',
    marginTop: 8,
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
    maxHeight: '80%',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyList: {
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#223248',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  historyItemActive: {
    borderColor: '#fb923c',
    backgroundColor: '#152238',
  },
  historyTextWrap: {
    flex: 1,
  },
  historyTitle: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
  },
  historyMeta: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
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
