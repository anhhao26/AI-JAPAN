import React from 'react';
import type { ChatMessage as ChatMessageType, TutorResponse } from '../types';
import LoadingDots from './LoadingDots';

interface ChatMessageProps {
  message: ChatMessageType;
  isLoading?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLoading = false }) => {
  const isUser = message.role === 'user';

  const containerClasses = `flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`;
  const bubbleClasses = `max-w-md w-full p-4 rounded-xl ${
    isUser
      ? 'bg-gradient-to-br from-blue-500 to-cyan-400 text-white rounded-br-none'
      : 'bg-slate-700 text-gray-200 rounded-bl-none'
  }`;
  
  const iconClasses = `w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 ${
    isUser ? 'bg-blue-400' : 'bg-purple-500'
  } ${isUser ? 'order-2' : 'order-1'}`;

  const renderContent = () => {
    if (isLoading) {
      return <LoadingDots />;
    }
    
    if (typeof message.content === 'object' && message.content !== null) {
      const data = message.content as TutorResponse;
      return (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-cyan-300 border-b-2 border-cyan-500/30 pb-2">{data.concept}</h3>
          
          <div>
            <h4 className="font-semibold text-purple-300 mb-2">Giải thích:</h4>
            <p className="whitespace-pre-wrap text-slate-300">{data.explanation}</p>
          </div>

          <div>
            <h4 className="font-semibold text-purple-300 mb-2">Ví dụ:</h4>
            <ul className="space-y-3">
              {data.examples.map((ex, i) => (
                <li key={i} className="p-3 bg-slate-800/50 rounded-md border-l-4 border-slate-600">
                  <p className="font-sans font-medium text-white text-lg">{ex.japanese}</p>
                  <p className="text-sm text-gray-400 italic">{ex.romaji}</p>
                  <p className="text-sm text-gray-400">"{ex.vietnamese}"</p>
                </li>
              ))}
            </ul>
          </div>

          {data.commonMistakes && (
             <div>
              <h4 className="font-semibold text-orange-400 mb-2">Lưu ý / Lỗi thường gặp:</h4>
              <div className="whitespace-pre-wrap p-3 bg-slate-800/50 rounded-md border-l-4 border-orange-500/60">
                <p className="text-slate-300">{data.commonMistakes}</p>
              </div>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-600">
             <h4 className="font-semibold text-green-400 mb-2">💡 Kiểm tra nhanh:</h4>
             <p className="whitespace-pre-wrap mb-2 text-slate-300">{data.quiz.question}</p>
             <ul className="space-y-1 pl-5">
               {data.quiz.options.map((opt, i) => <li key={i} className="text-slate-400">{opt}</li>)}
             </ul>
             <p className="text-xs text-gray-500 mt-3 text-right">Đáp án đúng: {data.quiz.correctAnswer}</p>
          </div>
        </div>
      );
    }
    
    return <p className="whitespace-pre-wrap">{message.content as string}</p>;
  };

  return (
    <div className={containerClasses}>
       <div className={iconClasses}>
        <i className={`fas ${isUser ? 'fa-user' : 'fa-robot'}`}></i>
       </div>
       <div className={`${bubbleClasses} ${isUser ? 'order-1' : 'order-2'}`}>
          {renderContent()}
       </div>
    </div>
  );
};

export default ChatMessage;