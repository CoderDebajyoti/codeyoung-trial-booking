import { Sparkles, Globe, Calendar, Users } from 'lucide-react';
import { getTimeZoneDetails } from '../lib/timezones';

interface NavbarProps {
  activeTab: 'booking' | 'mentor-schedule';
  onTabChange: (tab: 'booking' | 'mentor-schedule') => void;
  selectedTimeZone: string;
}

export function Navbar({ activeTab, onTabChange, selectedTimeZone }: NavbarProps) {
  const tzDetails = getTimeZoneDetails(selectedTimeZone);

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
                Codeyoung
              </span>
              <span className="hidden sm:inline-flex text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                1:1 Live Trial
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden md:block">
              STEM & Coding Classes for Kids (Ages 5-17)
            </p>
          </div>
        </div>

        {/* Navigation Tabs & Timezone Badge */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => onTabChange('booking')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'booking'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book Class</span>
            </button>
            <button
              onClick={() => onTabChange('mentor-schedule')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'mentor-schedule'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mentor Capacity</span>
              <span className="sm:hidden">Mentors</span>
            </button>
          </div>

          {/* Standardized Time-Zone Badge with Friendly Name, Canonical IANA & UTC Offset */}
          <div
            className="hidden sm:flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors"
            title={`${tzDetails.friendlyName} (${tzDetails.canonicalTimeZone} · ${tzDetails.utcOffset})`}
          >
            <Globe className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="text-left leading-tight">
              <div className="font-bold text-slate-800 text-[11px] truncate max-w-[150px] md:max-w-[180px]">
                {tzDetails.friendlyName}
              </div>
              <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                <span>{tzDetails.canonicalTimeZone}</span>
                <span className="text-slate-300">·</span>
                <span className="font-semibold text-blue-700">{tzDetails.utcOffset}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
