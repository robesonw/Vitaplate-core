import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Sparkles, Lock, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { useSubscription } from '@/lib/useSubscription';

const FREE_MESSAGE_LIMIT = 3;

const QUICK_REPLIES = [
  { label: '🔬 Explain my labs', prompt: 'Can you explain my most recent lab results in plain English? What do the values mean for my health?' },
  { label: '🍽️ What should I eat today?', prompt: 'Based on my health goals and recent nutrition tracking, what should I eat today? Give me a full day of meals.' },
  { label: '📊 How am I doing this week?', prompt: 'How am I doing with my nutrition this week? Review my logged meals and give me honest feedback and encouragement.' },
];

function NovaAvatar() {
  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md">
      <span className="text-white text-base">✨</span>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && <NovaAvatar />}
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
        isUser
          ? 'bg-indigo-600 text-white rounded-br-sm'
          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
      }`}>
        {isUser ? (
          <p>{message.message}</p>
        ) : (
          <ReactMarkdown
            className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 prose-p:my-1 prose-ul:my-1 prose-li:my-0"
            components={{
              strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
              ul: ({ children }) => <ul className="ml-4 list-disc space-y-0.5">{children}</ul>,
              ol: ({ children }) => <ol className="ml-4 list-decimal space-y-0.5">{children}</ol>,
              p: ({ children }) => <p className="my-1">{children}</p>,
            }}
          >
            {message.message}
          </ReactMarkdown>
        )}
      </div>
      {isUser && (
        <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 text-slate-600 font-semibold text-sm">
          U
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <NovaAvatar />
      <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

function PaywallBanner() {
  return (
    <div className="mx-4 mb-4 rounded-2xl border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50 p-5 text-center shadow-sm">
      <div className="flex justify-center mb-3">
        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
          <Lock className="w-6 h-6 text-indigo-600" />
        </div>
      </div>
      <h3 className="font-semibold text-slate-900 mb-1">Unlock Unlimited Coaching</h3>
      <p className="text-sm text-slate-600 mb-4">
        You've used your {FREE_MESSAGE_LIMIT} free messages. Upgrade to Pro for unlimited conversations with Nova.
      </p>
      <Button asChild className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white">
        <Link to="/Pricing">⚡ Upgrade to Pro</Link>
      </Button>
    </div>
  );
}

export default function AICoach() {
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const queryClient = useQueryClient();
  const { isFree } = useSubscription();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['coachMessages'],
    queryFn: () => base44.entities.CoachMessage.list('-created_date', 100),
    select: (data) => [...data].reverse(),
  });

  // Context data
  const { data: userPrefs } = useQuery({
    queryKey: ['userPreferences'],
    queryFn: () => base44.entities.UserPreferences.list(),
    select: (d) => d?.[0] || null,
  });
  const { data: labResults = [] } = useQuery({
    queryKey: ['labResults'],
    queryFn: () => base44.entities.LabResult.list('-upload_date', 1),
  });
  const { data: mealPlans = [] } = useQuery({
    queryKey: ['mealPlans'],
    queryFn: () => base44.entities.MealPlan.list('-created_date', 1),
  });
  const { data: nutritionLogs = [] } = useQuery({
    queryKey: ['nutritionLogs'],
    queryFn: () => base44.entities.NutritionLog.list('-log_date', 21),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.CoachMessage.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coachMessages'] }),
  });

  const userMessageCount = messages.filter(m => m.role === 'user').length;
  const isPaywalled = isFree && userMessageCount >= FREE_MESSAGE_LIMIT;

  const buildContext = () => {
    const parts = [];

    if (userPrefs) {
      parts.push(`USER PROFILE:
- Health goal: ${userPrefs.health_goal || 'not set'}
- Age: ${userPrefs.age || 'unknown'}, Gender: ${userPrefs.gender || 'unknown'}
- Height: ${userPrefs.height ? userPrefs.height + 'cm' : 'unknown'}, Weight: ${userPrefs.weight ? userPrefs.weight + 'kg' : 'unknown'}
- Dietary restrictions: ${userPrefs.dietary_restrictions || 'none'}
- Foods liked: ${userPrefs.foods_liked || 'not specified'}
- Foods avoided: ${userPrefs.foods_avoided || 'not specified'}
- Allergens: ${userPrefs.allergens?.join(', ') || 'none'}`);
    }

    if (labResults.length > 0) {
      const lab = labResults[0];
      const biomarkerText = lab.biomarkers
        ? Object.entries(lab.biomarkers)
            .filter(([, v]) => v?.value != null)
            .map(([k, v]) => `${k}: ${v.value} ${v.unit || ''} (${v.status || 'unknown'})`)
            .join(', ')
        : 'no biomarkers extracted';
      parts.push(`LATEST LAB RESULTS (${lab.upload_date}): ${biomarkerText}`);
    }

    if (mealPlans.length > 0) {
      const plan = mealPlans[0];
      const meals = plan.days?.slice(0, 3).map(d =>
        `${d.day}: B=${d.breakfast?.name || '?'}, L=${d.lunch?.name || '?'}, D=${d.dinner?.name || '?'}`
      ).join(' | ');
      parts.push(`CURRENT MEAL PLAN (${plan.name}): ${meals || 'no days'}`);
    }

    if (nutritionLogs.length > 0) {
      const recent = nutritionLogs.slice(0, 7);
      const summary = recent.map(l => `${l.log_date}: ${l.recipe_name} (${l.calories} kcal)`).join(', ');
      const totalCals = recent.reduce((s, l) => s + (l.calories || 0), 0);
      const avgCals = Math.round(totalCals / recent.length);
      parts.push(`LAST 7 NUTRITION LOGS: Avg ${avgCals} kcal/day. Recent: ${summary}`);
    }

    return parts.join('\n\n');
  };

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isThinking || isPaywalled) return;

    setInput('');
    setIsThinking(true);

    // Save user message
    await saveMutation.mutateAsync({ role: 'user', message: trimmed });

    try {
      const context = buildContext();
      const history = messages.slice(-10).map(m => `${m.role === 'user' ? 'User' : 'Nova'}: ${m.message}`).join('\n');

      const systemPrompt = `You are Nova, a friendly and knowledgeable AI nutrition coach for VitaPlate. You speak in a warm, supportive, and encouraging tone.

You have full access to the user's health data:

${context || 'No health data available yet. Encourage the user to complete their profile.'}

CONVERSATION HISTORY:
${history || 'This is the start of the conversation.'}

Your capabilities:
- Explain lab results in plain, understandable language
- Suggest meals and food swaps based on the user's goals and restrictions
- Review nutrition logs and give personalized feedback
- Provide motivation and accountability
- Recommend foods for specific health goals
- Answer any nutrition or diet questions

Guidelines:
- Be specific to their actual data — reference their real biomarker values, meal names, goals
- Keep responses concise (3-5 sentences or a short list) unless a detailed explanation is needed
- Use a friendly, coach-like tone — encouraging but honest
- Always end with an actionable tip or question to keep the conversation going
- If they don't have data (no labs, no meal plan), still give helpful general advice and suggest they set up their profile`;

      // Use VitaPlate's Nova coach endpoint (Haiku model, context-aware)
      const chatResult = await base44.entities.CoachMessage.create({ message: trimmed });
      const reply = chatResult?.message?.message || chatResult?.message || '';
      if (reply) {
        await saveMutation.mutateAsync({ role: 'assistant', message: reply });
      }
    } catch (err) {
      toast.error('Nova had trouble responding. Please try again.');
      console.error(err);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[900px]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
          <span className="text-2xl">✨</span>
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">Nova</h1>
          <p className="text-sm text-slate-500">Your AI Nutrition Coach · Powered by your health data</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-slate-500">Online</span>
        </div>
        {isFree && (
          <Badge variant="outline" className="text-xs text-slate-500 border-slate-300">
            {Math.max(0, FREE_MESSAGE_LIMIT - userMessageCount)} free msg{FREE_MESSAGE_LIMIT - userMessageCount !== 1 ? 's' : ''} left
          </Badge>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-4">
        {loadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-8">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center">
              <span className="text-4xl">✨</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Hi! I'm Nova 👋</h2>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">
                Your personal AI nutrition coach. I've read your health profile, lab results, and meal plans — ask me anything!
              </p>
            </div>
            <div className="grid gap-2 w-full max-w-md">
              {QUICK_REPLIES.map((qr) => (
                <button
                  key={qr.label}
                  onClick={() => sendMessage(qr.prompt)}
                  disabled={isPaywalled}
                  className="text-left px-4 py-3 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 hover:border-indigo-400 transition-all text-sm text-slate-700 font-medium shadow-sm"
                >
                  {qr.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isThinking && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Paywall */}
      {isPaywalled && <PaywallBanner />}

      {/* Quick replies (when there are messages) */}
      {messages.length > 0 && !isPaywalled && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {QUICK_REPLIES.map((qr) => (
            <button
              key={qr.label}
              onClick={() => sendMessage(qr.prompt)}
              disabled={isThinking}
              className="text-xs px-3 py-1.5 rounded-full border border-indigo-200 bg-white hover:bg-indigo-50 hover:border-indigo-400 transition-all text-slate-600 disabled:opacity-50"
            >
              {qr.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 mt-3">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isPaywalled ? 'Upgrade to Pro to continue chatting...' : 'Ask Nova anything about your nutrition, labs, or meal plan...'}
          disabled={isPaywalled || isThinking}
          rows={2}
          className="flex-1 resize-none rounded-xl border-slate-300 focus:border-indigo-400 text-sm"
        />
        <Button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isThinking || isPaywalled}
          className="h-full px-4 bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 rounded-xl self-stretch"
        >
          {isThinking ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>
      <p className="text-xs text-center text-slate-400 mt-2">Press Enter to send · Shift+Enter for new line</p>
    </div>
  );
}