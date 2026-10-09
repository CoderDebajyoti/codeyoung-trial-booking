import { useState, useEffect } from 'react';
import { Clock, Globe, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';

export function App() {
  const [backendHealth, setBackendHealth] = useState<string>('Checking...');
  const [detectedTz, setDetectedTz] = useState<string>('');

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setDetectedTz(tz || 'UTC');
    } catch {
      setDetectedTz('UTC');
    }

    // Ping backend health
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') {
          setBackendHealth('Connected (Healthy)');
        } else {
          setBackendHealth('Unexpected Response');
        }
      })
      .catch(() => {
        setBackendHealth('Offline (Dev Server not reachable)');
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
                Codeyoung
              </span>
              <span className="ml-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Trial Class System
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>{detectedTz || 'Detecting timezone...'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero / Placeholder container for the booking stages */}
      <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 w-full flex-1 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold mb-6">
          <ShieldCheck className="w-3.5 h-3.5" />
          Production-Ready Architecture Initialized
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4 max-w-2xl">
          Book Your 1:1 Live Trial Class with an Expert Mentor
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-xl mb-8">
          Personalized trial classes spanning global time zones with automatic mentor matching, real-time concurrency controls, and seamless scheduling.
        </p>

        {/* Status card */}
        <div className="w-full max-w-lg bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-left">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
            System Initialization Status
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm py-2 border-b border-slate-100">
              <span className="flex items-center gap-2 text-slate-700">
                <Clock className="w-4 h-4 text-slate-400" /> Backend Health
              </span>
              <span className="font-medium text-blue-600">{backendHealth}</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2 border-b border-slate-100">
              <span className="flex items-center gap-2 text-slate-700">
                <Globe className="w-4 h-4 text-slate-400" /> Detected Time Zone
              </span>
              <span className="font-medium text-slate-800">{detectedTz}</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2">
              <span className="flex items-center gap-2 text-slate-700">
                <UserCheck className="w-4 h-4 text-slate-400" /> Capacity Rule
              </span>
              <span className="font-medium text-slate-800">Max 2 Classes/Mentor/Day</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        Codeyoung Trial Class Booking System &copy; 2026. Built with React, Vite, Tailwind CSS, Express, and Prisma.
      </footer>
    </div>
  );
}

export default App;
