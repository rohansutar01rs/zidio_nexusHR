import React, { useState } from 'react';
import { Phone, Mail, ChevronDown, X, MessageSquare } from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
}

export default function LandingPage({ onLoginClick }: LandingPageProps) {
  const [isChatOpen, setIsChatOpen] = useState(true);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 flex flex-col">
      {/* Top Bar */}
      <div className="bg-[#303841] text-white text-xs py-2 px-8 flex justify-end items-center space-x-6">
        <div className="flex items-center space-x-2 font-semibold">
          <Phone className="w-3.5 h-3.5" />
          <span>877-922-5867</span>
        </div>
        <div className="flex items-center space-x-2 font-semibold">
          <Mail className="w-3.5 h-3.5" />
          <span>Info@Nexushr.com</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-white py-4 px-8 flex justify-between items-center border-b shadow-sm z-10 relative">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center text-[#3fc05e]">
            {/* Custom SVG for NexusHR Logo resembling the image */}
            <svg viewBox="0 0 100 100" className="w-10 h-10 fill-current">
              <path d="M50 20 C30 0, 0 20, 20 50 C40 80, 50 90, 50 90 C50 90, 60 80, 80 50 C100 20, 70 0, 50 20 Z" opacity="0.8" />
              <circle cx="35" cy="35" r="8" fill="white" />
              <circle cx="65" cy="35" r="8" fill="white" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-[#3fc05e] tracking-tight">NEXUS<span className="text-slate-800">HR</span></span>
        </div>

        {/* Links */}
        <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-500">
          <a href="#" className="hover:text-[#3fc05e] transition-colors">Remote HR</a>
          <a href="#" className="hover:text-[#3fc05e] transition-colors">Payroll</a>
          <a href="#" className="text-[#3fc05e]">Direct Hire</a>
          <a href="#" className="hover:text-[#3fc05e] transition-colors">Bookkeeping</a>
          <a href="#" className="hover:text-[#3fc05e] transition-colors">Consulting</a>
          <a href="#" className="hover:text-[#3fc05e] transition-colors">Healthcare</a>
          <div className="flex items-center cursor-pointer hover:text-[#3fc05e] transition-colors">
            <span>Resources</span>
            <ChevronDown className="w-4 h-4 ml-1" />
          </div>
        </div>

        {/* Login Button */}
        <button 
          onClick={onLoginClick}
          className="bg-[#4ce071] hover:bg-[#3fc05e] text-white px-6 py-2.5 rounded shadow text-sm font-bold tracking-wide transition-colors"
        >
          PAYROLL LOGIN
        </button>
      </nav>

      {/* Hero Section */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden min-h-[600px] bg-slate-900">
        {/* Background Image Setup */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{ backgroundImage: "url('C:/Users/rohan/.gemini/antigravity/brain/a6155e5c-7e3c-45e2-8426-abd6768ee311/laptop_video_call_1782136761759.png')" }}
        ></div>
        {/* Dark Overlay for readability */}
        <div className="absolute inset-0 bg-black/60"></div>
        
        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-4xl px-4 py-20 flex flex-col items-center">
          <div className="flex items-center justify-center space-x-2 mb-4 text-[#4ce071] tracking-[0.2em] font-bold text-sm">
            <span className="w-1.5 h-1.5 bg-[#4ce071]"></span>
            <span>DIRECT HIRE RECRUITMENT</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
            The Whole Onboarding<br/>Process, Covered.
          </h1>
          
          <p className="text-slate-300 text-base md:text-lg mb-10 max-w-2xl leading-relaxed">
            With a comprehensive recruitment process, Nexus HR Staffing takes the lead<br/>
            from the moment you have a vacancy until the new employee finishes training.<br/>
            Get more services than any other recruiting company—all at half the cost.
          </p>
          
          <button className="bg-[#4ce071] hover:bg-[#3fc05e] text-white px-8 py-3.5 rounded-full shadow-lg shadow-green-500/20 text-base font-bold transition-all hover:-translate-y-1">
            Get Started
          </button>
        </div>

        {/* Decorative Green Dots */}
        <div className="absolute top-1/3 left-1/4 w-1.5 h-1.5 bg-[#4ce071]"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-[#4ce071]"></div>
        <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-[#4ce071]"></div>
        <div className="absolute bottom-10 right-1/3 w-1.5 h-1.5 bg-[#4ce071]"></div>
      </div>

      {/* Chatbot Widget */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {isChatOpen && (
          <div className="bg-white rounded-xl shadow-2xl p-4 mb-4 w-64 relative border border-slate-100 animate-in slide-in-from-bottom-4">
            <button 
              onClick={() => setIsChatOpen(false)}
              className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-3 mb-2">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm">
                  JA
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
            </div>
            <p className="text-slate-700 text-sm">Hi, how can we help?</p>
          </div>
        )}
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-14 h-14 bg-black text-[#4ce071] rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
        >
          <MessageSquare className="w-7 h-7" />
        </button>
      </div>

    </div>
  );
}
