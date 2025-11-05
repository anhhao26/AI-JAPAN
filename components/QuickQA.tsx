import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage as ChatMessageType } from '../types';
import ChatMessage from './ChatMessage';
import { GoogleGenAI } from '@google/genai';
import LoadingSpinner from './LoadingSpinner';

const QuickQA: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([
    { role: 'model', content: 'Cần tra cứu nhanh từ vựng hay cấu trúc nào? Hãy hỏi tôi!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessageType = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (!process.env.API_KEY) {
        throw new Error("API key is not configured.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: `Bạn là một từ điển tiếng Nhật thông minh. Hãy trả lời câu hỏi của người dùng một cách nhanh chóng, chính xác và đi thẳng vào vấn đề.
        Câu hỏi của người dùng: "${input}"`,
      });
      
      let fullResponse = "";
      // Add a placeholder for the model's message
      setMessages(prev => [...prev, { role: 'model', content: fullResponse }]);

      for await (const chunk of responseStream) {
        fullResponse += chunk.text;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = fullResponse;
          return newMessages;
        });
      }
    } catch (error) {
      console.error(error);
      const errorMessage: ChatMessageType = { role: 'model', content: 'Rất xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <h2 className="text-2xl font-bold text-white mb-4">Hỏi đáp nhanh</h2>
      <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-4">
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} isLoading={isLoading && index === messages.length - 1 && msg.content === ''}/>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="mt-6 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Hỏi nhanh đáp gọn..."
          className="flex-grow p-3 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-slate-800 text-white transition duration-300"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold p-3 rounded-lg transition-all duration-300 h-[50px] w-[50px] flex items-center justify-center"
        >
          {isLoading ? <LoadingSpinner /> : <i className="fas fa-paper-plane"></i>}
        </button>
      </form>
    </div>
  );
};

export default QuickQA;