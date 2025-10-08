import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function Home() {
  const [prompt, setPrompt] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      navigate('/builder', { state: { prompt } });
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-2xl text-center">
        <div className="mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">L</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">
            grooff.ai
          </h1>
          <p className="text-lg text-gray-600 max-w-lg mx-auto leading-relaxed">
            Describe your dream website and watch grooff.ai turn your vision into reality.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-lg p-8 space-y-6 border border-gray-200"
        >
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
              What would you like to build?
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A modern portfolio website with a dark theme, smooth animations, and a contact form..."
              className="w-full h-32 p-4 bg-gray-50 text-gray-900 placeholder-gray-500 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none resize-none text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 transition-colors duration-200 text-white py-3 px-6 rounded-lg text-sm font-semibold shadow-sm"
          >
            Generate App
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Powered by AI • Built with React & TypeScript
          </p>
        </div>
      </div>
    </div>
  );
}
