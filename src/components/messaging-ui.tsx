"use client";
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface Contact {
  userId: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
  lastMessage: string;
  unread: number;
  lastAt: string;
}

interface Message {
  id: string;
  fromUserId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  fromUser: { id: string; role: string; repProfile?: { fullName: string; avatarUrl?: string | null } | null; businessProfile?: { businessName: string } | null };
}

export function MessagingUI({ currentUserId }: { currentUserId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const withParam = searchParams.get("with");

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/messages/contacts").then(r => r.json()).then(setContacts);
  }, []);

  useEffect(() => {
    if (withParam && contacts.length > 0) {
      const c = contacts.find(c => c.userId === withParam);
      if (c) { setActiveContact(c); setShowSidebar(false); }
    }
  }, [withParam, contacts]);

  useEffect(() => {
    if (!activeContact) return;
    const load = () =>
      fetch(`/api/messages?with=${activeContact.userId}`).then(r => r.json()).then(setMessages);
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [activeContact]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !activeContact) return;
    setSending(true);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId: activeContact.userId, content: input }),
    });
    const msg = await res.json();
    setMessages(prev => [...prev, msg]);
    setInput("");
    setSending(false);
    fetch("/api/messages/contacts").then(r => r.json()).then(setContacts);
  }

  function selectContact(c: Contact) {
    setActiveContact(c);
    setShowSidebar(false);
    router.replace(`/messages?with=${c.userId}`);
  }

  const initials = (name: string) => name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex h-full border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">

      {/* Sidebar — hidden on mobile when chat is open */}
      <div className={`${showSidebar ? "flex" : "hidden"} md:flex w-full md:w-72 border-r border-slate-100 flex-col shrink-0`}>
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <p className="text-sm font-semibold text-slate-700">Conversations</p>
        </div>
        <div className="overflow-y-auto flex-1">
          {contacts.length === 0 && (
            <div className="text-center p-8 text-slate-400">
              <div className="text-3xl mb-2">💬</div>
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Messages appear after your first job</p>
            </div>
          )}
          {contacts.map(c => (
            <button
              key={c.userId}
              onClick={() => selectContact(c)}
              className={`w-full text-left px-4 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition border-b border-slate-50 ${activeContact?.userId === c.userId ? "bg-blue-50 border-r-2 border-r-[#0f2044]" : ""}`}
            >
              <div className="w-10 h-10 rounded-full bg-[#0f2044]/10 flex items-center justify-center text-[#0f2044] font-bold text-sm shrink-0 overflow-hidden">
                {c.avatarUrl ? <img src={c.avatarUrl} alt="" className="w-full h-full object-cover" /> : initials(c.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 text-sm truncate">{c.name}</span>
                  {c.unread > 0 && <span className="bg-[#0f2044] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shrink-0 ml-1">{c.unread}</span>}
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">{c.lastMessage || "No messages yet"}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat panel */}
      <div className={`${!showSidebar ? "flex" : "hidden"} md:flex flex-1 flex-col`}>
        {!activeContact ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <p className="text-5xl mb-3">💬</p>
              <p className="font-medium text-slate-600">Select a conversation</p>
              <p className="text-sm text-slate-400 mt-1">Choose someone from the left to start messaging</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
              {/* Back button on mobile */}
              <button
                onClick={() => setShowSidebar(true)}
                className="md:hidden p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition mr-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-9 h-9 rounded-full bg-[#0f2044]/10 flex items-center justify-center text-[#0f2044] font-bold text-sm overflow-hidden shrink-0">
                {activeContact.avatarUrl ? <img src={activeContact.avatarUrl} alt="" className="w-full h-full object-cover" /> : initials(activeContact.name)}
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{activeContact.name}</p>
                <p className="text-xs text-slate-400 capitalize">{activeContact.role}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
              {messages.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">Start the conversation below</div>
              )}
              {messages.map(m => {
                const isMine = m.fromUserId === currentUserId;
                return (
                  <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] sm:max-w-sm px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                      isMine
                        ? "bg-[#0f2044] text-white rounded-br-sm"
                        : "bg-white text-slate-900 rounded-bl-sm border border-slate-200"
                    }`}>
                      <p className="leading-relaxed">{m.content}</p>
                      <p className={`text-xs mt-1 ${isMine ? "text-blue-300" : "text-slate-400"}`}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-3 border-t border-slate-100 flex gap-2 bg-white">
              <input
                className="flex-1 border border-slate-300 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2044] focus:border-transparent"
                placeholder="Type a message..."
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="bg-[#0f2044] text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[#1a3360] disabled:opacity-50 transition shrink-0"
              >
                Send
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
