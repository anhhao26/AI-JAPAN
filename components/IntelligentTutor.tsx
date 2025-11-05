import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage as ChatMessageType, TutorResponse } from '../types';
import ChatMessage from './ChatMessage';
import { GoogleGenAI, Type } from '@google/genai';
import LoadingSpinner from './LoadingSpinner';

const IntelligentTutor: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([
    { role: 'model', content: 'Xin chào! Bạn có câu hỏi nào về ngữ pháp, từ vựng hay văn hoá Nhật Bản không?' }
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
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `Bạn là một gia sư tiếng Nhật chuyên nghiệp và thân thiện. Hãy giải thích khái niệm ngữ pháp, từ vựng hoặc văn hoá mà người dùng hỏi. Luôn trả lời bằng một cấu trúc JSON theo schema đã định sẵn.
        - concept: Tên khái niệm tiếng Nhật (ví dụ: "Động từ thể て").
        - explanation: Giải thích rõ ràng, súc tích.
        - examples: Cung cấp 3 ví dụ, mỗi ví dụ có 'japanese', 'romaji', và 'vietnamese'.
        - commonMistakes: (Tùy chọn) Một lỗi phổ biến người học hay mắc phải.
        - quiz: Một câu hỏi trắc nghiệm nhỏ để kiểm tra kiến thức, với 'question', một mảng 'options', và 'correctAnswer'.
        Câu hỏi của người dùng: "${input}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              concept: { type: Type.STRING },
              explanation: { type: Type.STRING },
              examples: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    japanese: { type: Type.STRING },
                    romaji: { type: Type.STRING },
                    vietnamese: { type: Type.STRING },
                  },
                  required: ["japanese", "romaji", "vietnamese"],
                },
              },
              commonMistakes: { type: Type.STRING },
              quiz: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.STRING },
                },
                required: ["question", "options", "correctAnswer"],
              },
            },
            required: ["concept", "explanation", "examples", "quiz"],
          },
        }
      });
      
      try {
        const modelResponse = JSON.parse(response.text) as TutorResponse;
        const modelMessage: ChatMessageType = { role: 'model', content: modelResponse };
        setMessages(prev => [...prev, modelMessage]);
      } catch (jsonError) {
        console.error("JSON parsing error:", jsonError);
        console.error("Raw response text:", response.text);
        // Fallback to show raw text if JSON parsing fails
        const fallbackMessage: ChatMessageType = { role: 'model', content: 'Đã nhận được phản hồi nhưng không thể hiển thị. Nội dung: \n' + response.text };
        setMessages(prev => [...prev, fallbackMessage]);
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
      <h2 className="text-2xl font-bold text-white mb-4">Gia sư AI</h2>
      <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-4">
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
        {isLoading && <ChatMessage message={{ role: 'model', content: '' }} isLoading={true} />}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="mt-6 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Hỏi về ngữ pháp, từ vựng..."
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

export default IntelligentTutor;