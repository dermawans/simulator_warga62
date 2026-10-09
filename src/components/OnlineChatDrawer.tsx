import React, { useState, useRef, useEffect } from 'react';
import { multiplayerService } from '../services/multiplayer';
import { ChatMessage } from '../types/multiplayer';
import { MessageSquare, X, Send, Smile } from 'lucide-react';

interface OnlineChatDrawerProps {
  messages: ChatMessage[];
  currentUserId?: string;
  currentUserName: string;
  currentUserAvatar: string;
  currentUserColor: string;
}

const QUICK_TAUNTS = [
  'Bayar sewa woi! 💸',
  'Kena OTT KPK lu! 🚨',
  'Gue mau beli IKN nih! 🏗️',
  'Pinjol dulu sana haha 🤣',
  'Ampun bang jago! 😭',
  'Gaspol terus! 🚀',
];

export const OnlineChatDrawer: React.FC<OnlineChatDrawerProps> = ({
  messages,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  currentUserColor,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen && messages.length > 0) {
      setUnreadCount((prev) => prev + 1);
    }
    if (isOpen) {
      setUnreadCount(0);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    multiplayerService.sendChatMessage(text, {
      id: currentUserId,
      name: currentUserName,
      avatar: currentUserAvatar,
      color: currentUserColor,
    });

    if (!textToSend) {
      setInputText('');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 select-none">
      {/* Floating Chat Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl border-3 border-slate-950 shadow-2xl comic-box-sm cursor-pointer flex items-center gap-2 group transition-transform active:scale-95"
          title="Obrolan & Stiker Mabar"
        >
          <MessageSquare className="w-6 h-6 text-yellow-300" />
          <span className="hidden sm:inline font-comic font-black text-xs uppercase tracking-wider">
            Chat Mabar
          </span>
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white rounded-full text-[10px] font-black flex items-center justify-center border-2 border-white animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Expanded Chat Box */}
      {isOpen && (
        <div className="bg-[#fffdf7] w-80 sm:w-96 rounded-3xl border-3 border-slate-950 comic-box shadow-2xl flex flex-col h-96 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 px-4 border-b-2 border-slate-900 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-yellow-300" />
              <h4 className="font-comic font-black text-xs uppercase tracking-wide">
                Obrolan Mabar Real-Time
              </h4>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg bg-white/20 hover:bg-white/30 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Taunt Bar */}
          <div className="bg-amber-100/70 p-1.5 px-2 border-b border-slate-300 flex items-center gap-1.5 overflow-x-auto text-[10px] shrink-0 no-scrollbar">
            <span className="font-bold text-slate-500 shrink-0">Taunt:</span>
            {QUICK_TAUNTS.map((taunt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(taunt)}
                className="px-2 py-0.5 bg-white hover:bg-blue-100 border border-slate-400 rounded-md font-bold text-slate-800 whitespace-nowrap cursor-pointer transition-all active:scale-95 shrink-0"
              >
                {taunt}
              </button>
            ))}
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 italic space-y-1">
                <Smile className="w-8 h-8 opacity-40" />
                <p>Belum ada obrolan.</p>
                <p className="text-[10px]">Kirim stiker taunt di atas untuk menyapa lawan!</p>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = (currentUserId && m.senderId)
                  ? m.senderId === currentUserId
                  : m.senderName === currentUserName;
                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className="w-7 h-7 rounded-lg border border-slate-900 flex items-center justify-center text-xs shrink-0 shadow-2xs"
                      style={{ backgroundColor: m.senderColor }}
                    >
                      {m.senderAvatar}
                    </div>
                    <div
                      className={`max-w-[75%] p-2 rounded-xl border border-slate-900 text-[11px] leading-snug shadow-2xs ${
                        isMe ? 'bg-blue-500 text-white' : 'bg-white text-slate-900'
                      }`}
                    >
                      <p
                        className={`text-[9px] font-bold font-comic mb-0.5 ${
                          isMe ? 'text-blue-100' : 'text-slate-500'
                        }`}
                      >
                        {m.senderName}
                      </p>
                      <p className="font-medium break-words">{m.text}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2 border-t-2 border-slate-900 bg-white flex items-center gap-1.5"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ketik pesan..."
              className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-blue-600"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
