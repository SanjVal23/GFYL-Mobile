import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { Message, Suggestion } from '../types';
import { getChatbotResponse } from '../services/geminiService';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../services/supabaseClient';
import { useLocalization } from '../contexts/LocalizationContext';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';

type QuickPrompt = Suggestion & { label: string; icon: keyof typeof Ionicons.glyphMap };

const initialSuggestions: QuickPrompt[] = [
  { id: '1', label: 'Karma Yoga', text: 'What is karma yoga?', icon: 'body-outline' },
  { id: '2', label: 'Chapter 2', text: 'Explain Chapter 2 of Bhagavad Gita', icon: 'book-outline' },
  { id: '3', label: 'Meditation', text: 'How to practice meditation?', icon: 'leaf-outline' },
  { id: '4', label: 'Liberation', text: 'What is the path to liberation?', icon: 'sparkles-outline' },
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
  const navigation = useNavigation();
  const { user } = useUser();
  const { t } = useLocalization();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [historyVisible, setHistoryVisible] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const pendingScrollMessageId = useRef<string | null>(null);
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

  const deleteConversation = (conversationId: string) => {
    setConversations((prev) => {
      const remaining = prev.filter((item) => item.id !== conversationId);

      if (conversationId !== activeConversationId) {
        return remaining;
      }

      if (remaining.length > 0) {
        setActiveConversationId(sortByUpdated(remaining)[0].id);
        return remaining;
      }

      const fresh = createNewConversation();
      setActiveConversationId(fresh.id);
      return [fresh];
    });
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: false });
  }, [activeConversationId]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const subscription = Keyboard.addListener(showEvent, () => {
      if (!pendingScrollMessageId.current) {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }
    });

    return () => subscription.remove();
  }, []);

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
    pendingScrollMessageId.current = userMessage.id;

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
  const isFreshConversation = messages.length === 1;

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        <View style={styles.topBar}>
          {navigation.canGoBack() && (
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>

        {isFreshConversation ? (
          <ScrollView
            style={styles.heroScroll}
            contentContainerStyle={styles.heroContainer}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            <Image
              source={require('../assets/krishna-hero.png')}
              style={styles.heroImage}
              resizeMode="contain"
            />
            <Text style={styles.heroTitle}>{t('ai.title', 'Welcome to Krishly')}</Text>
            <Text style={styles.heroSubtitle}>{t('ai.subtitle', 'Ask, reflect, and grow with wisdom.')}</Text>
            <View style={styles.heroSuggestionsGrid}>
              {initialSuggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.id}
                  style={styles.heroSuggestionPill}
                  onPress={() => handleSuggestionPress(suggestion.text)}
                  activeOpacity={0.85}
                >
                  <Ionicons name={suggestion.icon} size={16} color={colors.text} />
                  <Text style={styles.heroSuggestionText}>{suggestion.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          keyboardDismissMode="on-drag"
        >
          <Image
            source={require('../assets/krishna-hero.png')}
            style={styles.chatTopImage}
            resizeMode="contain"
          />
          {messages.map((message) => (
            <View
              key={message.id}
              onLayout={(event) => {
                if (message.id === pendingScrollMessageId.current) {
                  const y = event.nativeEvent.layout.y;
                  pendingScrollMessageId.current = null;
                  scrollViewRef.current?.scrollTo({ y: Math.max(y - 12, 0), animated: true });
                }
              }}
              style={[
                styles.messageBubble,
                message.isUser ? styles.userMessage : styles.aiMessage,
              ]}
            >
              {!message.isUser && (
                <View style={styles.aiLabel}>
                  <Ionicons name="sparkles" size={14} color={colors.text} />
                  <Text style={styles.aiLabelText}>Krishly</Text>
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
                      message.id === feedbackTargetId && feedbackRating === 'up' && styles.feedbackButtonActive,
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
                      size={14}
                      color={message.id === feedbackTargetId && feedbackRating === 'up' ? colors.accentText : colors.textSecondary}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.feedbackButton,
                      message.id === feedbackTargetId && feedbackRating === 'down' && styles.feedbackButtonActive,
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
                      size={14}
                      color={message.id === feedbackTargetId && feedbackRating === 'down' ? colors.accentText : colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.text} />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          )}
        </ScrollView>
        )}

        <View style={styles.bottomBar}>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity style={styles.quickActionButton} onPress={startNewConversation} activeOpacity={0.85}>
              <Ionicons name="add" size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton} onPress={() => setHistoryVisible(true)} activeOpacity={0.85}>
              <Ionicons name="time-outline" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputPill}>
            <TextInput
              style={styles.input}
              placeholder={t('ai.placeholder', 'Type your question...')}
              placeholderTextColor={colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              onFocus={() => {
                if (!pendingScrollMessageId.current) {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }
              }}
              onContentSizeChange={() => {
                if (!pendingScrollMessageId.current) {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }
              }}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.accentText} />
              ) : (
                <Ionicons
                  name="send"
                  size={18}
                  color={inputText.trim() ? colors.accentText : colors.textTertiary}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={historyVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setHistoryVisible(false)}
      >
        <GestureHandlerRootView style={styles.gestureRoot}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.historyHeaderRow}>
              <Text style={styles.modalTitle}>{t('ai.savedConversations', 'Saved Conversations')}</Text>
              <TouchableOpacity onPress={startNewConversation}>
                <Ionicons name="add-circle-outline" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.historyList}>
              {visibleConversations.map((conversation) => (
                <Swipeable
                  key={conversation.id}
                  overshootRight={false}
                  renderRightActions={() => (
                    <TouchableOpacity
                      style={styles.deleteAction}
                      onPress={() => deleteConversation(conversation.id)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="trash-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                  )}
                >
                  <TouchableOpacity
                    style={[
                      styles.historyItem,
                      conversation.id === activeConversationId && styles.historyItemActive,
                    ]}
                    onPress={() => {
                      setActiveConversationId(conversation.id);
                      setHistoryVisible(false);
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name="chatbox-ellipses-outline"
                      size={18}
                      color={conversation.id === activeConversationId ? colors.accentText : colors.textSecondary}
                    />
                    <View style={styles.historyTextWrap}>
                      <Text
                        style={[
                          styles.historyTitle,
                          conversation.id === activeConversationId && styles.historyTitleActive,
                        ]}
                      >
                        {conversation.title}
                      </Text>
                      <Text
                        style={[
                          styles.historyMeta,
                          conversation.id === activeConversationId && styles.historyMetaActive,
                        ]}
                      >
                        {new Date(conversation.updatedAt).toLocaleString()} • {conversation.messages.length} msgs
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Swipeable>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.cancelButton} onPress={() => setHistoryVisible(false)}>
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
        </GestureHandlerRootView>
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
                  activeOpacity={0.85}
                >
                  <Text style={[styles.reasonText, selectedReasons.includes(reason) && styles.reasonTextActive]}>{reason}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.otherInput}
              placeholder="Provide additional feedback"
              placeholderTextColor={colors.textSecondary}
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
                activeOpacity={0.85}
              >
                {feedbackSubmitting ? (
                  <ActivityIndicator size="small" color={colors.accentText} />
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
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroScroll: {
    flex: 1,
  },
  heroContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  heroImage: {
    width: 220,
    height: 220,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 28,
    textAlign: 'center',
  },
  heroSuggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  heroSuggestionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
  },
  heroSuggestionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  chatTopImage: {
    width: 220,
    height: 220,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  messageBubble: {
    marginVertical: 8,
    padding: 16,
    borderRadius: 20,
    maxWidth: '85%',
  },
  aiMessage: {
    backgroundColor: colors.surfaceAlt,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 6,
  },
  userMessage: {
    backgroundColor: colors.accent,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 6,
  },
  aiLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  aiLabelText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  messageText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  userMessageText: {
    color: colors.accentText,
  },
  bottomBar: {
    padding: 20,
    paddingTop: 10,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  quickActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 28,
    padding: 6,
    gap: 8,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginVertical: 8,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  feedbackRow: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  feedbackButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  feedbackButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  gestureRoot: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 14,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyList: {
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  historyItemActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  deleteAction: {
    width: 64,
    marginBottom: 10,
    marginLeft: 8,
    borderRadius: 16,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyTextWrap: {
    flex: 1,
  },
  historyTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  historyTitleActive: {
    color: colors.accentText,
  },
  historyMeta: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },
  historyMetaActive: {
    color: colors.accentText,
  },
  reasonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  reasonTag: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  reasonTagActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  reasonText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  reasonTextActive: {
    color: colors.accentText,
  },
  otherInput: {
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    borderRadius: 14,
    padding: 14,
    minHeight: 80,
    marginBottom: 16,
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  submitButton: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    backgroundColor: colors.border,
  },
  submitButtonText: {
    color: colors.accentText,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
