import React, { useState, useRef, useEffect } from 'react';
import {
  View, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator, Keyboard,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { Colors, Spacing, Radius, Shadows } from '@/constants/theme';
import { Send, Sparkles, User } from 'lucide-react-native';
import Typography from '@/components/ui/Typography';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const appUrl = (typeof process !== 'undefined' ? (process.env as any).EXPO_PUBLIC_APP_URL : '') || 'http://localhost:3000';
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(`${appUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Failed to get response');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      const assistantId = (Date.now() + 1).toString();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          assistantText += chunk;
          setMessages(prev => {
            const existing = prev.find(m => m.id === assistantId);
            if (existing) {
              return prev.map(m => m.id === assistantId ? { ...m, content: assistantText } : m);
            }
            return [...prev, { id: assistantId, role: 'assistant', content: assistantText }];
          });
        }
      } else {
        const text = await res.text();
        setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: text }]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err.message}. Make sure the web app is running.`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[s.msgRow, item.role === 'user' && s.msgRowUser]}>
      <View style={item.role === 'user' ? s.userIcon : s.aiIcon}>
        {item.role === 'user'
          ? <User size={14} color={Colors.white} />
          : <Sparkles size={14} color={Colors.emerald} />}
      </View>
      <View style={[s.msgBubble, item.role === 'user' ? s.userBubble : s.aiBubble]}>
        <Typography variant="body" color={item.role === 'user' ? 'white' : 'navy'} style={s.msgText}>
          {item.content}
        </Typography>
      </View>
    </View>
  );

  return (
    <View style={s.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {messages.length === 0 ? (
          <View style={s.emptyChat}>
            <View style={s.emptyIcon}>
              <Sparkles size={28} color={Colors.emerald} />
            </View>
            <Typography variant="h2" weight="bold" color="navy" fontFamily="heading" style={s.emptyTitle}>
              How can I help you today?
            </Typography>
            <Typography color="slate" align="center" style={s.emptySub}>
              Ask anything about your loans, repayment strategies, or financial health.
            </Typography>
            <View style={s.suggestions}>
              {['Which loan should I pay off first?', 'How can I save on interest?', 'What is the Avalanche strategy?'].map(q => (
                <TouchableOpacity key={q} style={s.suggestion} onPress={() => { setInput(q); }}>
                  <Typography color="navy">{q}</Typography>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={s.chatList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Input */}
        <View style={[s.inputContainer, { paddingBottom: keyboardVisible ? (Platform.OS === 'ios' ? 12 : 8) : 90 }]}>
          <View style={s.inputBar}>
            <TextInput
              style={s.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask about your loans..."
              placeholderTextColor={Colors.slate}
              multiline
              maxLength={1000}
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity
              style={[s.sendBtn, (!input.trim() || loading) && s.sendBtnDisabled]}
              onPress={sendMessage}
              disabled={!input.trim() || loading}
            >
              {loading ? <ActivityIndicator size="small" color={Colors.white} /> : <Send size={16} color={Colors.white} />}
            </TouchableOpacity>
          </View>
          <Typography variant="xs" color="slate" align="center" style={s.disclaimer}>
            AI can make mistakes. Verify important info.
          </Typography>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 22, backgroundColor: '#ecfdf5',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg,
  },
  emptyTitle: { marginBottom: Spacing.sm, textAlign: 'center' },
  emptySub: { lineHeight: 22, marginBottom: Spacing.xl },
  suggestions: { gap: Spacing.sm, width: '100%' },
  suggestion: {
    borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radius.button,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, backgroundColor: Colors.white,
  },
  chatList: { padding: Spacing.base, paddingBottom: 16 },
  msgRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base, alignItems: 'flex-start' },
  msgRowUser: { flexDirection: 'row-reverse' },
  userIcon: {
    width: 30, height: 30, borderRadius: 10, backgroundColor: Colors.navy,
    alignItems: 'center', justifyContent: 'center',
  },
  aiIcon: {
    width: 30, height: 30, borderRadius: 10, backgroundColor: '#ecfdf5',
    alignItems: 'center', justifyContent: 'center',
  },
  msgBubble: { maxWidth: '78%', borderRadius: 18, padding: Spacing.md },
  userBubble: { backgroundColor: Colors.navy, borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: Colors.white, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#f1f5f9' },
  msgText: { lineHeight: 22 },
  inputContainer: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingBottom: 90, 
  },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 100, borderRadius: 16, borderWidth: 1,
    borderColor: Colors.borderMid, backgroundColor: '#f8fafc',
    paddingHorizontal: Spacing.base, paddingVertical: 10, fontSize: 16, // Use explicit 16 for input
    fontFamily: 'Manrope-Medium',
    color: Colors.navy,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.emerald,
    alignItems: 'center', justifyContent: 'center', ...Shadows.button,
  },
  sendBtnDisabled: { opacity: 0.4 },
  disclaimer: {
    marginTop: -Spacing.xs,
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.base,
    opacity: 0.8,
  },
});
