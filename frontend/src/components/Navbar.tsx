import { Globe, Calendar, Users, Lock, LogOut, UserCheck, User } from 'lucide-react';
import { getTimeZoneDetails } from '../lib/timezones';
import { CodeyoungLogo } from './CodeyoungLogo';
import { AuthUser } from '../lib/api';

interface NavbarProps {
  activeTab: 'booking' | 'login' | 'mentor-schedule';
  onTabChange: (tab: 'booking' | 'login' | 'mentor-schedule') => void;
  selectedTimeZone: string;
  currentUser?: AuthUser | null;
  onOpenLogin: (tab?: 'parent' | 'mentor') => void;
  onLogout: () => void;
}

export function Navbar({
  activeTab,
  onTabChange,
  selectedTimeZone,
  currentUser,
  onOpenLogin,
  onLogout,
}: NavbarProps) {
  const tzDetails = getTimeZoneDetails(selectedTimeZone);

  return (
    <header className="border-b border-[#F7E4B6] bg-[#FFF8E8]/95 backdrop-blur-md sticky top-0 z-50 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-2">
        {/* Brand Logo & Tagline */}
        <div
          onClick={() => onTabChange('booking')}
          className="flex items-center gap-3 shrink-0 cursor-pointer"
        >
          <CodeyoungLogo />
          <span className="hidden sm:inline-flex text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FFF0D2] text-[#843B13] border border-[#F7E4B6]">
            1:1 Live Trial
          </span>
        </div>

        {/* Navigation Tabs, Auth Profile & Timezone Badge */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center bg-[#FFF0D2]/80 p-1 rounded-[16px] border border-[#F7E4B6] text-xs font-semibold">
            <button
              onClick={() => onTabChange('booking')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[12px] transition-all cursor-pointer ${
                activeTab === 'booking'
                  ? 'btn-primary-gradient text-[#713B18] shadow-sm font-extrabold'
                  : 'text-[#713B18]/70 hover:text-[#713B18] font-bold'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book Class</span>
            </button>
            <button
              onClick={() => {
                if (!currentUser) {
                  onOpenLogin('mentor');
                } else {
                  onTabChange('mentor-schedule');
                }
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[12px] transition-all cursor-pointer ${
                activeTab === 'mentor-schedule' || (activeTab === 'login' && !currentUser)
                  ? 'btn-primary-gradient text-[#713B18] shadow-sm font-extrabold'
                  : 'text-[#713B18]/70 hover:text-[#713B18] font-bold'
              }`}
            >
              {currentUser ? <Users className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Mentor Portal</span>
              <span className="sm:hidden">Portal</span>
            </button>
          </div>

          {/* User Auth Chip or Sign In Button */}
          {currentUser ? (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-[16px] border border-[#F7E4B6] shadow-xs">
              <div className="flex items-center gap-1.5 text-xs text-[#713B18] font-extrabold">
                <UserCheck className="w-3.5 h-3.5 text-[#F28C28]" />
                <span className="truncate max-w-[100px] sm:max-w-[130px]">{currentUser.name}</span>
              </div>
              <button
                onClick={onLogout}
                title="Log Out"
                className="text-[#843B13]/70 hover:text-rose-700 p-1 rounded-md cursor-pointer transition-colors"
                aria-label="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onTabChange('login')}
              className={`hidden md:inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1.5 rounded-[14px] border cursor-pointer transition-all ${
                activeTab === 'login'
                  ? 'btn-primary-gradient text-[#713B18] border-transparent'
                  : 'text-[#843B13] hover:text-[#713B18] bg-[#FFF0D2] border-[#F7E4B6]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Parent Sign In</span>
            </button>
          )}

          {/* Standardized Time-Zone Badge with Friendly Name, Canonical IANA & UTC Offset */}
          <div
            className="hidden sm:flex items-center gap-2.5 bg-white/90 hover:bg-white px-3.5 py-1.5 rounded-[16px] border border-[#F7E4B6] transition-colors shadow-xs"
            title={`${tzDetails.friendlyName} (${tzDetails.canonicalTimeZone} · ${tzDetails.utcOffset})`}
          >
            <Globe className="w-4 h-4 text-[#F28C28] shrink-0" />
            <div className="text-left leading-tight">
              <div className="font-bold text-[#713B18] text-[11px] truncate max-w-[150px] md:max-w-[180px]">
                {tzDetails.friendlyName}
              </div>
              <div className="text-[10px] text-[#713B18]/70 font-mono flex items-center gap-1">
                <span>{tzDetails.canonicalTimeZone}</span>
                <span className="text-[#F7E4B6]">·</span>
                <span className="font-extrabold text-[#843B13]">{tzDetails.utcOffset}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
