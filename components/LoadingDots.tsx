import React from 'react';

const LoadingDots: React.FC = () => (
  <div className="flex items-center justify-center gap-1.5 px-2 py-1">
    <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce"></div>
  </div>
);

export default LoadingDots;
