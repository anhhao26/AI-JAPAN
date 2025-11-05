import React, { useState } from 'react';
import type { ChatMessage as ChatMessageType, TutorResponse } from '../types';
import LoadingDots from './LoadingDots';

interface ChatMessageProps {
  message: ChatMessageType;
  isLoading?: boolean;
}

const Quiz: React.FC<{ quiz: TutorResponse['quiz'] }> = ({ quiz }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleOptionClick = (option: string) => {
    if (selectedOption === null) {
      setSelectedOption(option);
    }
  };

  const getButtonClass = (option: string) => {
    if (selectedOption === null) {
      return 'border-slate-600 hover:bg-slate-600/50 hover:border-cyan-500';
    }
    const isCorrect = option === quiz.correctAnswer;
    const isSelected = option === selectedOption;

    if (isCorrect) {
      return 'border-green-500 bg-green-500/20 text-green-300';
    }
    if (isSelected && !isCorrect) {
      return 'border-red-500 bg-red-500/20 text-red-300';
    }
    return 'border-slate-600 opacity-60 cursor-not-allowed';
  };
  
  const getIcon = (option: string) => {
    if (selectedOption === null) return null;
    const isCorrect = option === quiz.correctAnswer;
    const isSelected = option === selectedOption;

    if(isCorrect) return <i className="fas fa-check-circle text-green-400"></i>;
    if(isSelected && !isCorrect) return <i className="fas fa-times-circle text-red-400"></i>;
    return null;
  }

  return (
    <div className="mt-4 pt-3 border-t border-slate-600">
      <h4 className="font-semibold text-green-400 mb-2">💡 Kiểm tra nhanh:</h4>
      <p className="whitespace-pre-wrap mb-3 text-slate-300">{quiz.question}</p>
      <div className="space-y-2">
        {quiz.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleOptionClick(opt)}
            disabled={selectedOption !== null}
            className={`w-full text-left p-3 border rounded-lg transition-all duration-300 flex justify-between items-center ${getButtonClass(opt)}`}
          >
            <span>{opt}</span>
            {getIcon(opt)}
          </button>
        ))}
      </div>
      {selectedOption && <p className="text-xs text-gray-500 mt-3 text-right">Đáp án đúng: {quiz.correctAnswer}</p>}
    </div>
  );
};


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

          <Quiz quiz={data.quiz} />
        </div>
      );
    }
    
    return <p className="whitespace-pre-wrap">{message.content as string || '...'}</p>;
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