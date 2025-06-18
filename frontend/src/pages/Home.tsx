import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2 } from 'lucide-react';

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
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center px-4">
      <div className="w-full max-w-3xl text-center">
        <div className="mb-10">
          <div className="flex justify-center mb-4">
            <Wand2 className="w-14 h-14 text-indigo-400 animate-pulse" />
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight">
            Lumari Clone <span className="text-indigo-400">.io</span>
          </h1>
          <p className="mt-4 text-xl text-gray-300 max-w-xl mx-auto">
            Describe your dream website — Lumari AI will turn your vision into a reality.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/5 backdrop-blur-md rounded-2xl shadow-2xl p-8 space-y-4 border border-white/10"
        >
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A sleek portfolio site with a dark theme and animations..."
            className="w-full h-40 p-4 bg-black/40 text-white placeholder-gray-400 rounded-xl border border-white/10 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
          />

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 transition-all duration-200 text-white py-3 px-6 rounded-xl text-lg font-semibold shadow-md"
          >
            ✨ Generate Website Plan
          </button>
        </form>
      </div>
    </div>
  );
}
