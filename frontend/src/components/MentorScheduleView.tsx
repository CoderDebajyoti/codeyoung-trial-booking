import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Globe,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock,
  UserCheck,
  Video,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

import { api, MentorItem, MentorScheduleResponse, AuthUser } from '../lib/api';

interface MentorScheduleViewProps {
  currentUser?: AuthUser | null;
  onOpenLogin?: () => void;
}

export function MentorScheduleView({ currentUser, onOpenLogin }: MentorScheduleViewProps) {
  const todayStr = new Date().toISOString().split('T')[0]!;
  const [mentors, setMentors] = useState<MentorItem[]>([]);
  const [selectedMentorId, setSelectedMentorId] = useState<string>(currentUser?.mentorId || '');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [scheduleData, setScheduleData] = useState<MentorScheduleResponse['data'] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch all mentors on mount (for dropdown if admin or fallback)
  useEffect(() => {
    api.getMentors()
      .then((data) => {
        setMentors(data);
        if (data.length > 0 && !selectedMentorId) {
          const defaultId = currentUser?.mentorId || data[0]!.id;
          setSelectedMentorId(defaultId);
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load mentors');
      });
  }, [currentUser]);

  // 2. Fetch mentor schedule when mentor or date changes (only if authenticated)
  useEffect(() => {
    const mentorIdToFetch = currentUser?.role === 'MENTOR' && currentUser?.mentorId
      ? currentUser.mentorId
      : selectedMentorId;

    if (currentUser && mentorIdToFetch && selectedDate) {
      setIsLoading(true);
      setError(null);
      api.getMentorSchedule(mentorIdToFetch, selectedDate)
        .then((data) => {
          setScheduleData(data);
        })
        .catch((err) => {
          setError(err.message || 'Failed to load mentor schedule');
          setScheduleData(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [currentUser, selectedMentorId, selectedDate]);

  // If not logged in, prompt with locked screen
  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-[#F7E4B6] shadow-card-warm text-center space-y-5 animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-2xl bg-[#FFF0D2] flex items-center justify-center mx-auto border border-[#F7E4B6] text-[#F28C28]">
          <Lock className="w-8 h-8" />
        </div>
        <div>
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FFF0D2] text-[#843B13] text-xs font-extrabold mb-2 border border-[#F7E4B6]">
            <ShieldAlert className="w-3.5 h-3.5 text-[#F28C28]" /> Protected Mentor Portal
          </div>
          <h2 className="text-2xl font-heading font-extrabold text-[#713B18]">
            Company Authentication Required
          </h2>
          <p className="text-xs sm:text-sm text-[#713B18]/80 max-w-md mx-auto mt-1 font-medium">
            To protect student privacy and enforce daily limits, trial schedules are restricted to authenticated Codeyoung mentors and administrators.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={onOpenLogin}
            className="btn-primary-gradient px-8 py-3.5 text-sm font-extrabold text-[#713B18] rounded-2xl inline-flex items-center gap-2 cursor-pointer shadow-btn hover:shadow-btn-hover"
          >
            <Lock className="w-4 h-4 text-[#713B18]" />
            <span>Sign In to Mentor Portal</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#F7E4B6] shadow-card-warm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF0D2] text-[#843B13] text-xs font-extrabold mb-2 border border-[#F7E4B6]">
            <UserCheck className="w-3.5 h-3.5 text-[#F28C28]" />
            <span>Logged in as <strong>{currentUser.name}</strong> ({currentUser.role})</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-[#713B18] tracking-tight">
            Daily Capacity & Bookings
          </h2>
          <p className="text-xs text-[#713B18]/70 mt-0.5 font-semibold">
            {currentUser.role === 'MENTOR'
              ? 'Viewing your authorized mentor schedule and 2-classes daily capacity.'
              : 'Administrative view: audit any mentor schedule and system capacity.'}
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Mentor Selector (Active for Admin, locked to self for Mentor) */}
          {currentUser.role === 'ADMIN' ? (
            <div>
              <label htmlFor="mentorSelect" className="block text-[11px] font-extrabold uppercase tracking-wider text-[#713B18] mb-1">
                Select Mentor
              </label>
              <select
                id="mentorSelect"
                value={selectedMentorId}
                onChange={(e) => setSelectedMentorId(e.target.value)}
                className="w-full sm:w-52 py-2.5 px-3.5 rounded-2xl border border-[#F7E4B6] bg-[#FFF8E8]/40 text-xs font-bold text-[#713B18] focus:outline-hidden focus:border-[#F28C28] focus:ring-4 focus:ring-[#FFD45A]/40 transition-all cursor-pointer"
              >
                {mentors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.timeZone})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#713B18] mb-1">
                Mentor Account
              </label>
              <div className="py-2.5 px-3.5 rounded-2xl border border-[#F7E4B6] bg-[#FFF0D2] text-xs font-extrabold text-[#713B18]">
                {currentUser.name}
              </div>
            </div>
          )}

          {/* Date Selector */}
          <div>
            <label htmlFor="scheduleDate" className="block text-[11px] font-extrabold uppercase tracking-wider text-[#713B18] mb-1">
              Date (Mentor Local)
            </label>
            <input
              id="scheduleDate"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full sm:w-40 py-2.5 px-3.5 rounded-2xl border border-[#F7E4B6] bg-[#FFF8E8]/40 text-xs font-bold text-[#713B18] focus:outline-hidden focus:border-[#F28C28] focus:ring-4 focus:ring-[#FFD45A]/40 transition-all cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Loading / Error / Data View */}
      {isLoading && (
        <div className="py-16 text-center text-[#713B18]/70 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#F28C28]" />
          <p className="text-xs font-bold">Loading mentor schedule and capacity metrics...</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!isLoading && scheduleData && (
        <div className="space-y-6">
          {/* Mentor Profile & Capacity Meter Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#F7E4B6] shadow-card-warm grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: Mentor Info */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl btn-primary-gradient flex items-center justify-center text-[#713B18] font-extrabold text-lg shadow-sm">
                  {scheduleData.mentor.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-lg text-[#713B18]">
                    {scheduleData.mentor.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#843B13] font-semibold">
                    <Globe className="w-3.5 h-3.5 text-[#F28C28]" />
                    <span>Time Zone: <strong>{scheduleData.mentor.timeZone}</strong></span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-2xl bg-[#FFF8E8] border border-[#F7E4B6]">
                  <span className="text-[11px] font-bold text-[#843B13] block">Working Hours</span>
                  <span className="font-extrabold text-[#713B18]">
                    {String(scheduleData.mentor.workStartHour).padStart(2, '0')}:00 - {String(scheduleData.mentor.workEndHour).padStart(2, '0')}:00 (Local)
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#FFF8E8] border border-[#F7E4B6]">
                  <span className="text-[11px] font-bold text-[#843B13] block">Working Days</span>
                  <span className="font-extrabold text-[#713B18]">Mon - Sat</span>
                </div>
              </div>
            </div>

            {/* Right: Daily Capacity Limit Meter */}
            <div className="p-5 rounded-2xl bg-[#FFF0D2]/70 border border-[#F7E4B6] flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#843B13]">
                    Daily Capacity Limit
                  </span>
                  {scheduleData.capacity.isFullyBooked ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                      <Lock className="w-3 h-3" /> Fully Booked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Slot Available
                    </span>
                  )}
                </div>

                <div className="text-2xl font-heading font-extrabold text-[#713B18] mt-2">
                  {scheduleData.capacity.confirmedClassesCount} / {scheduleData.capacity.maxDailyClasses} Classes Used
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="w-full bg-[#F7E4B6] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full btn-primary-gradient transition-all duration-300"
                    style={{
                      width: `${(scheduleData.capacity.confirmedClassesCount / scheduleData.capacity.maxDailyClasses) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-[#843B13] mt-1.5 font-bold">
                  Rule: Strict 2 classes max per mentor-local calendar day.
                </p>
              </div>
            </div>
          </div>

          {/* Bookings Table / List */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#F7E4B6] shadow-card-warm space-y-4">
            <h4 className="font-heading font-extrabold text-base text-[#713B18] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#F28C28]" />
              Assigned Classes for {scheduleData.queryDate}
            </h4>

            {scheduleData.bookings.length === 0 ? (
              <div className="py-10 text-center text-[#713B18]/70 border-2 border-dashed border-[#F7E4B6] rounded-2xl bg-[#FFF8E8]/40">
                <Sparkles className="w-6 h-6 text-[#F28C28] mx-auto mb-1.5" />
                <p className="text-xs font-bold">No classes booked for this mentor on this date.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduleData.bookings.map((b) => {
                  return (
                    <div
                      key={b.id}
                      className="p-4 rounded-2xl bg-[#FFF8E8] border border-[#F7E4B6] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-[#713B18]">
                            1:1 Live Trial Class
                          </span>
                          <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                            {b.status}
                          </span>
                        </div>
                        <div className="text-xs text-[#713B18]/80 font-medium">
                          Student / Parent: <strong>{b.parentName}</strong> {b.parentEmail ? `(${b.parentEmail})` : ''}
                        </div>
                        <div className="text-[11px] text-[#843B13] flex items-center gap-1 font-bold">
                          <Clock className="w-3.5 h-3.5 text-[#F28C28]" />
                          <span>Mentor Local: <strong>{b.mentorLocalStartTime} - {b.mentorLocalEndTime}</strong></span>
                          <span className="text-[#F7E4B6]">|</span>
                          <span>Parent Zone: {b.parentTimeZone}</span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <a
                          href={b.demoClassUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-primary-gradient px-3.5 py-1.5 text-xs font-extrabold flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <Video className="w-3.5 h-3.5 text-[#713B18]" />
                          <span>Join Meeting</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
