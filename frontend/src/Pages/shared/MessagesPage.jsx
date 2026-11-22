import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Send, ChevronLeft, Check, CheckCheck, Clock, Loader2 } from "lucide-react";
import { Button, Input, Pill, Avatar, SkeletonText } from "../../components/ui";
import { listConversationsApi, listMessagesApi, sendMessageApi, markMessagesReadApi } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export default function MessagesPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [error, setError] = useState("");
  const [conversationQuery, setConversationQuery] = useState("");

  const messageForm = useForm({ defaultValues: { content: "" } });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    async function loadConversations() {
      setLoading(true);
      try {
        const res = await listConversationsApi();
        const items = res.items || res.conversations || [];
        const normalized = items.map(conv => ({
          ...conv,
          otherParty: { name: conv.other_participant?.full_name || conv.other_participant?.email || "User" },
          lastMessage: conv.last_message?.body || "",
          time: conv.last_message_at ? new Date(conv.last_message_at).toLocaleString() : "",
          unread: conv.unread_count || 0,
        }));
        setConversations(normalized);
        const requestedId = Number(searchParams.get("conversation"));
        const requestedConversation = normalized.find(conv => conv.id === requestedId);
        if (requestedConversation) await openConversation(requestedConversation);
      } catch (e) {
        setError(e.response?.data?.detail || e.message || "Failed to load conversations.");
      } finally {
        setLoading(false);
      }
    }
    loadConversations();
  }, [searchParams]);

  const openConversation = async (conversation) => {
    setActiveConversation(conversation);
    setMobileDrawerOpen(true);
    try {
      const res = await listMessagesApi(conversation.id);
      setMessages((res.items || res.messages || []).map(message => ({
        ...message,
        content: message.content || message.body || "",
        own: message.sender_id === user?.id,
        senderName: message.sender?.full_name || message.sender?.email,
        time: message.time || message.created_at,
      })));
      if (conversation.unread > 0) await markMessagesReadApi(conversation.id);
      setConversations(prev => prev.map(c => c.id === conversation.id ? { ...c, unread: 0 } : c));
    } catch (e) {
      setError(e.response?.data?.detail || e.message || "Failed to load messages.");
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!activeConversation || sending) return;
    const data = messageForm.getValues();
    if (!data.content.trim()) return;
    setSending(true);
    try {
      setError("");
      const res = await sendMessageApi(activeConversation.id, data.content);
      const message = res.data || res.message || res;
      setMessages(prev => [...prev, { ...message, content: message.content || message.body || data.content, own: true, time: message.time || message.created_at || "now" }]);
      messageForm.reset();
      setConversations(prev => prev.map(c => c.id === activeConversation.id ? { ...c, lastMessage: data.content, time: "now" } : c));
    } catch (e) {
      setError(e.response?.data?.detail || e.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);
  const visibleConversations = conversations.filter((conversation) =>
    [conversation.otherParty?.name, conversation.lastMessage]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(conversationQuery.trim().toLowerCase()),
  );

  if (loading) {
    return (
      <div className="h-[calc(100vh-200px)] flex items-center justify-center">
        <SkeletonText lines={3} />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-border shrink-0">
        <div>
          <h1 className="font-serif text-xl font-semibold text-text">Messages</h1>
          <p className="text-sm text-white/70">Conversations across your Almeriq workspace</p>
        </div>
        <div className="flex items-center gap-2">
          {totalUnread > 0 && (
            <Pill variant="gold" className="text-xs">{totalUnread} unread</Pill>
          )}
        </div>
      </div>

      {error && <p role="alert" className="mx-4 mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}

      {/* Conversation List + Chat View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversation List (Sidebar on desktop, Drawer on mobile) */}
        <div className={`w-full lg:w-96 flex-shrink-0 border-r border-border bg-surface flex flex-col ${mobileDrawerOpen ? "fixed inset-0 z-50 lg:static lg:z-auto" : "hidden lg:flex"}`}>
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-serif text-lg font-semibold text-text">Messages</h2>
            <Button variant="ghost" size="sm" onClick={() => setMobileDrawerOpen(false)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-border">
            <Input value={conversationQuery} onChange={(event) => setConversationQuery(event.target.value)} placeholder="Search conversations..." className="text-sm" />
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {visibleConversations.length === 0 ? (
              <div className="p-8 text-center text-white/60">
                <p>{conversations.length === 0 ? "No conversations yet" : "No matching conversations"}</p>
                <p className="text-sm mt-1">{conversations.length === 0 ? "Start chatting from the Marketplace or an accepted request" : "Try another name or message."}</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {visibleConversations.map(conv => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    active={activeConversation?.id === conv.id}
                    onClick={() => openConversation(conv)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat View */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeConversation ? (
            <ChatView
              conversation={activeConversation}
              messages={messages}
              onSend={handleSend}
              messageForm={messageForm}
              sending={sending}
              messagesEndRef={messagesEndRef}
              onClose={() => { setActiveConversation(null); setMobileDrawerOpen(false); }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-white/60">
              <div className="text-center">
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-sm mt-1">Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConversationItem({ conversation, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 flex items-center gap-3 text-left transition-colors ${active ? "bg-surface-2 border-l-2 border-gold" : "hover:bg-surface"}`}
    >
      <Avatar name={conversation.otherParty?.name || "Provider"} size="lg" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-text truncate">{conversation.otherParty?.name || "Provider"}</h4>
          <span className="text-xs font-mono text-white/60 shrink-0">{conversation.time}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-sm text-white/70 truncate">{conversation.lastMessage || "No messages yet"}</p>
          {conversation.unread > 0 && (
            <Pill variant="gold" className="text-[10px]">{conversation.unread}</Pill>
          )}
        </div>
      </div>
    </button>
  );
}

function ChatView({ conversation, messages, onSend, messageForm, sending, messagesEndRef, onClose }) {
  const otherParty = conversation.otherParty || { name: "Provider", verified: true };

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border shrink-0 lg:hidden">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <Avatar name={otherParty.name} size="md" />
          <div>
            <h3 className="font-semibold text-text">{otherParty.name}</h3>
            <span className="text-xs text-gold">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesEndRef}>
        {messages.length === 0 ? (
          <div className="text-center text-white/60 py-8">
            <p>No messages yet</p>
            <p className="text-sm mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <MessageBubble key={msg.id || i} message={msg} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <form onSubmit={onSend} className="p-4 border-t border-border bg-surface shrink-0">
        <div className="flex items-center gap-2">
          <Input
            {...messageForm.register("content")}
            placeholder="Type a message..."
            className="flex-1 min-h-[48px]"
            disabled={sending}
          />
          <Button type="submit" disabled={sending || !messageForm.watch("content")?.trim()} size="sm" className="h-10 px-4">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
}

function MessageBubble({ message }) {
  const isOwn = message.own || message.senderId === "me";
  const statusIcons = { sent: <Clock className="w-3.5 h-3.5" />, delivered: <Check className="w-3.5 h-3.5" />, read: <CheckCheck className="w-3.5 h-3.5" /> };
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[70%] ${isOwn ? "text-right" : ""}`}>
        {!isOwn && <p className="text-xs text-white/70 mb-1 ml-1">{message.senderName || "Provider"}</p>}
        <div className={`inline-block px-4 py-2 rounded-2xl ${isOwn ? "bg-gold text-bg rounded-tr-sm" : "bg-surface-2 text-text rounded-tl-sm"}`}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className={`flex items-center gap-1 mt-1 text-[10px] text-white/60 ${isOwn ? "justify-end pr-1" : "justify-start pl-1"}`}>
          <span>{message.time}</span>
          {isOwn && message.status && statusIcons[message.status]}
        </div>
      </div>
    </div>
  );
}