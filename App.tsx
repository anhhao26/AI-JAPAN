import React, { useState } from 'react';
import type { FeatureTab } from './types';
import CompositionAssistant from './components/CompositionAssistant';
import IntelligentTutor from './components/IntelligentTutor';
import CommunicationPractice from './components/CommunicationPractice';
import QuickQA from './components/QuickQA';
import ReviewGenerator from './components/ReviewGenerator';
import { WriteIcon, TutorIcon, SpeakIcon, QandAIcon, ReviewIcon } from './components/icons';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FeatureTab>('review');

  const renderContent = () => {
    switch (activeTab) {
      case 'compose':
        return <CompositionAssistant />;
      case 'tutor':
        return <IntelligentTutor />;
      case 'practice':
        return <CommunicationPractice />;
      case 'qa':
        return <QuickQA />;
      case 'review':
        return <ReviewGenerator />;
      default:
        return <CompositionAssistant />;
    }
  };

  const tabs = [
    { id: 'review', label: 'Ôn tập', icon: <ReviewIcon /> },
    { id: 'compose', label: 'Soạn thảo', icon: <WriteIcon /> },
    { id: 'tutor', label: 'Gia sư AI', icon: <TutorIcon /> },
    { id: 'practice', label: 'Luyện giao tiếp', icon: <SpeakIcon /> },
    { id: 'qa', label: 'Hỏi đáp nhanh', icon: <QandAIcon /> },
  ];

  return (
    <div className="relative overflow-hidden bg-gray-900 min-h-screen font-sans text-gray-200">
      {/* Aurora background */}
      <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-600/30 rounded-full filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-cyan-600/30 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-indigo-600/30 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto max-w-4xl p-4">
        <header className="text-center my-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
            Trợ lý Tiếng Nhật AI
          </h1>
          <p className="text-gray-400 mt-2">
            Nâng cao kỹ năng tiếng Nhật của bạn với sức mạnh từ Gemini
          </p>
        </header>

        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
          <nav className="flex flex-wrap border-b border-slate-700/50">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as FeatureTab)}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-4 px-2 sm:px-6 text-sm sm:text-base font-medium transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 ${
                  activeTab === tab.id
                    ? 'border-b-2 border-cyan-400 text-cyan-400 bg-slate-800/30'
                    : 'text-gray-400 hover:text-white hover:bg-slate-800/20'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <main className="p-4 sm:p-8 min-h-[60vh] flex">
            {renderContent()}
          </main>
        </div>
        
        <footer className="text-center mt-8 text-gray-500 text-sm">
          <p>Powered by Google Gemini</p>
        </footer>
      </div>
    </div>
  );
};

export default App;