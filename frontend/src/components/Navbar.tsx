import { useState, useRef, useEffect } from 'react';
import {
  Globe,
  Calendar,
  Users,
  LogOut,
  UserCheck,
  User,
  Compass,
  ShieldCheck,
  BookOpen,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { getTimeZoneDetails } from '../lib/timezones';
import { CodeyoungLogo } from './CodeyoungLogo';
import { AuthUser } from '../lib/api';

export type AppTab =
  | 'explore'
  | 'courses'
  | 'course-details'
  | 'booking'
  | 'pricing'
  | 'login'
  | 'mentor-schedule'
  | 'admin-bookings'
  | 'admin-courses';

interface NavbarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  selectedTimeZone: string;
  currentUser?: AuthUser | null;
  onOpenLogin?: (tab?: 'parent' | 'mentor') => void;
  onLogout: () => void;
}

export function Navbar({
  activeTab,
  onTabChange,
  selectedTimeZone,
  currentUser,
  onLogout,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const tzDetails = getTimeZoneDetails(selectedTimeZone);
  const isAdmin = currentUser?.role === 'ADMIN';
  const isMentor = currentUser?.role === 'MENTOR';
  const isParent = currentUser?.role === 'PARENT';

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setProfileDropdownOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavClick = (tab: AppTab) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  };

  return (
    <header className="border-b border-[#F7E4B6] bg-[#FFF8E8]/95 backdrop-blur-md sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 sm:h-20 flex items-center justify-between gap-3">
        {/* 1. Brand Logo (Aligned Left) */}
        <div
          onClick={() => handleNavClick(isMentor ? 'mentor-schedule' : isAdmin ? 'admin-bookings' : 'explore')}
          className="flex items-center gap-3 shrink-0 cursor-pointer select-none"
        >
          <CodeyoungLogo />
          <span className="hidden lg:inline-flex text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FFF0D2] text-[#843B13] border border-[#F7E4B6]">
            1:1 STEM For Kids
          </span>
        </div>

        {/* 2. Middle Navigation Links (Role-Aware & Compact) */}
        <nav className="hidden md:flex items-center gap-1.5 bg-[#FFF0D2]/80 p-1.5 rounded-[18px] border border-[#F7E4B6] text-xs font-semibold">
          {/* PUBLIC OR PARENT USER NAVIGATION */}
          {!currentUser || isParent ? (
            <>
              {/* Single Merged Courses & Pricing Link */}
              <button
                onClick={() => handleNavClick('explore')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[12px] transition-all cursor-pointer ${
                  activeTab === 'explore' || activeTab === 'courses' || activeTab === 'pricing' || activeTab === 'course-details'
                    ? 'btn-primary-gradient text-[#713B18] shadow-sm font-extrabold'
                    : 'text-[#713B18]/75 hover:text-[#713B18] hover:bg-[#FFF8E8] font-bold'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-[#F28C28]" />
                <span>Explore Courses & Pricing</span>
              </button>

              {/* Book Free Trial CTA Tab */}
              <button
                onClick={() => handleNavClick('booking')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[12px] transition-all cursor-pointer ${
                  activeTab === 'booking'
                    ? 'btn-primary-gradient text-[#713B18] shadow-sm font-extrabold'
                    : 'text-[#713B18]/75 hover:text-[#713B18] hover:bg-[#FFF8E8] font-bold'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-[#843B13]" />
                <span>Book Free Trial</span>
              </button>
            </>
          ) : null}

          {/* MENTOR ROLE NAVIGATION */}
          {isMentor && (
            <button
              onClick={() => handleNavClick('mentor-schedule')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[12px] transition-all cursor-pointer ${
                activeTab === 'mentor-schedule'
                  ? 'btn-primary-gradient text-[#713B18] shadow-sm font-extrabold'
                  : 'text-[#713B18]/75 hover:text-[#713B18] hover:bg-[#FFF8E8] font-bold'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-[#F28C28]" />
              <span>My Schedule & Capacity</span>
            </button>
          )}

          {/* ADMIN ROLE NAVIGATION */}
          {isAdmin && (
            <>
              <button
                onClick={() => handleNavClick('admin-bookings')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[12px] transition-all cursor-pointer ${
                  activeTab === 'admin-bookings'
                    ? 'btn-primary-gradient text-[#713B18] shadow-sm font-extrabold'
                    : 'text-[#713B18]/75 hover:text-[#713B18] hover:bg-[#FFF8E8] font-bold'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#F28C28]" />
                <span>Trial Bookings</span>
              </button>
              <button
                onClick={() => handleNavClick('admin-courses')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[12px] transition-all cursor-pointer ${
                  activeTab === 'admin-courses'
                    ? 'btn-primary-gradient text-[#713B18] shadow-sm font-extrabold'
                    : 'text-[#713B18]/75 hover:text-[#713B18] hover:bg-[#FFF8E8] font-bold'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-[#F28C28]" />
                <span>Courses & Packages</span>
              </button>
              <button
                onClick={() => handleNavClick('mentor-schedule')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[12px] transition-all cursor-pointer ${
                  activeTab === 'mentor-schedule'
                    ? 'btn-primary-gradient text-[#713B18] shadow-sm font-extrabold'
                    : 'text-[#713B18]/75 hover:text-[#713B18] hover:bg-[#FFF8E8] font-bold'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-[#F28C28]" />
                <span>Mentor Capacity</span>
              </button>
            </>
          )}
        </nav>

        {/* 3. Right Area: Timezone Badge & Profile/Sign In (Aligned Right) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Compact Timezone Indicator */}
          <div
            className="hidden xl:flex items-center gap-2 bg-white/90 px-3 py-1.5 rounded-[14px] border border-[#F7E4B6] shadow-xs text-left text-xs"
            title={`${tzDetails.friendlyName} (${tzDetails.canonicalTimeZone} · ${tzDetails.utcOffset})`}
          >
            <Globe className="w-3.5 h-3.5 text-[#F28C28] shrink-0" />
            <div className="leading-tight">
              <span className="font-bold text-[#713B18] truncate max-w-[110px] block text-[11px]">
                {tzDetails.friendlyName}
              </span>
              <span className="text-[10px] text-[#843B13] font-mono block">
                {tzDetails.utcOffset}
              </span>
            </div>
          </div>

          {/* Account Profile Menu or Public Sign In Button */}
          {currentUser ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 bg-white hover:bg-[#FFFDF9] px-3 py-1.5 rounded-[16px] border border-[#F7E4B6] shadow-xs cursor-pointer transition-colors"
                aria-expanded={profileDropdownOpen}
                aria-haspopup="true"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#F28C28]" />
                <span className="text-xs font-extrabold text-[#713B18] truncate max-w-[90px] sm:max-w-[120px]">
                  {currentUser.name}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#FFF0D2] text-[#843B13] font-black uppercase">
                  {currentUser.role}
                </span>
                <ChevronDown className={`w-3 h-3 text-[#843B13] transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-[#F7E4B6] shadow-xl p-3 z-50 space-y-2 animate-in fade-in duration-150">
                  <div className="p-2 bg-[#FFF8E8] rounded-xl border border-[#F7E4B6]">
                    <div className="text-xs font-extrabold text-[#713B18]">{currentUser.name}</div>
                    <div className="text-[11px] text-[#843B13] truncate font-medium">{currentUser.email}</div>
                    <div className="mt-1 flex items-center justify-between text-[10px] font-bold text-[#843B13]">
                      <span>Role:</span>
                      <span className="px-1.5 py-0.2 rounded bg-[#FFD45A]/40 text-[#713B18] font-extrabold uppercase">
                        {currentUser.role}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1 space-y-1 text-xs font-bold text-[#713B18]">
                    {isParent && (
                      <button
                        onClick={() => handleNavClick('booking')}
                        className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-[#FFF0D2] flex items-center gap-2 cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5 text-[#F28C28]" />
                        <span>Book a Free Trial</span>
                      </button>
                    )}

                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleNavClick('admin-bookings')}
                          className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-[#FFF0D2] flex items-center gap-2 cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-[#F28C28]" />
                          <span>Admin Bookings</span>
                        </button>
                        <button
                          onClick={() => handleNavClick('admin-courses')}
                          className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-[#FFF0D2] flex items-center gap-2 cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-[#F28C28]" />
                          <span>Manage Courses</span>
                        </button>
                      </>
                    )}

                    {isMentor && (
                      <button
                        onClick={() => handleNavClick('mentor-schedule')}
                        className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-[#FFF0D2] flex items-center gap-2 cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5 text-[#F28C28]" />
                        <span>My Schedule</span>
                      </button>
                    )}

                    <div className="border-t border-[#F7E4B6]/60 pt-1">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-rose-50 text-rose-700 font-extrabold flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => handleNavClick('login')}
              className={`flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-[16px] border cursor-pointer transition-all ${
                activeTab === 'login'
                  ? 'btn-primary-gradient text-[#713B18] border-transparent shadow-sm'
                  : 'text-[#843B13] hover:text-[#713B18] bg-[#FFF0D2] border-[#F7E4B6]'
              }`}
            >
              <User className="w-3.5 h-3.5 text-[#F28C28]" />
              <span className="hidden sm:inline">Sign In</span>
              <span className="sm:hidden">Login</span>
            </button>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-xl bg-[#FFF0D2] text-[#713B18] hover:bg-[#FFE6B3] border border-[#F7E4B6] cursor-pointer"
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 4. Responsive Mobile / Tablet Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#F7E4B6] bg-[#FFF8E8] p-4 space-y-3 animate-in slide-in-from-top-2 duration-200 shadow-lg">
          <div className="space-y-1.5 text-xs font-bold">
            {!currentUser || isParent ? (
              <>
                <button
                  onClick={() => handleNavClick('explore')}
                  className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center gap-2.5 ${
                    activeTab === 'explore' || activeTab === 'courses' || activeTab === 'pricing'
                      ? 'btn-primary-gradient text-[#713B18] font-extrabold'
                      : 'bg-white text-[#713B18] border border-[#F7E4B6]'
                  }`}
                >
                  <Compass className="w-4 h-4 text-[#F28C28]" />
                  <span>Explore Courses & Pricing</span>
                </button>

                <button
                  onClick={() => handleNavClick('booking')}
                  className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center gap-2.5 ${
                    activeTab === 'booking'
                      ? 'btn-primary-gradient text-[#713B18] font-extrabold'
                      : 'bg-white text-[#713B18] border border-[#F7E4B6]'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-[#843B13]" />
                  <span>Book Free Trial</span>
                </button>
              </>
            ) : null}

            {isMentor && (
              <button
                onClick={() => handleNavClick('mentor-schedule')}
                className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center gap-2.5 ${
                  activeTab === 'mentor-schedule'
                    ? 'btn-primary-gradient text-[#713B18] font-extrabold'
                    : 'bg-white text-[#713B18] border border-[#F7E4B6]'
                }`}
              >
                <Users className="w-4 h-4 text-[#F28C28]" />
                <span>My Schedule & Capacity</span>
              </button>
            )}

            {isAdmin && (
              <>
                <button
                  onClick={() => handleNavClick('admin-bookings')}
                  className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center gap-2.5 ${
                    activeTab === 'admin-bookings'
                      ? 'btn-primary-gradient text-[#713B18] font-extrabold'
                      : 'bg-white text-[#713B18] border border-[#F7E4B6]'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-[#F28C28]" />
                  <span>Trial Bookings</span>
                </button>

                <button
                  onClick={() => handleNavClick('admin-courses')}
                  className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center gap-2.5 ${
                    activeTab === 'admin-courses'
                      ? 'btn-primary-gradient text-[#713B18] font-extrabold'
                      : 'bg-white text-[#713B18] border border-[#F7E4B6]'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-[#F28C28]" />
                  <span>Courses & Packages</span>
                </button>

                <button
                  onClick={() => handleNavClick('mentor-schedule')}
                  className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center gap-2.5 ${
                    activeTab === 'mentor-schedule'
                      ? 'btn-primary-gradient text-[#713B18] font-extrabold'
                      : 'bg-white text-[#713B18] border border-[#F7E4B6]'
                  }`}
                >
                  <Users className="w-4 h-4 text-[#F28C28]" />
                  <span>Mentor Capacity</span>
                </button>
              </>
            )}

            {!currentUser && (
              <button
                onClick={() => handleNavClick('login')}
                className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center gap-2.5 ${
                  activeTab === 'login'
                    ? 'btn-primary-gradient text-[#713B18] font-extrabold'
                    : 'bg-[#FFF0D2] text-[#843B13] border border-[#F7E4B6]'
                }`}
              >
                <User className="w-4 h-4 text-[#F28C28]" />
                <span>Parent & Staff Sign In</span>
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-[#F7E4B6] flex items-center justify-between text-xs text-[#843B13]">
            <span className="font-bold">Timezone: {tzDetails.friendlyName}</span>
            <span className="font-mono font-bold text-[#713B18]">{tzDetails.utcOffset}</span>
          </div>
        </div>
      )}
    </header>
  );
}
