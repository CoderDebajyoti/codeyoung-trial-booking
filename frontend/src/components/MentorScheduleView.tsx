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
} from 'lucide-react';

import { api, MentorItem, MentorScheduleResponse } from '../lib/api';

export function MentorScheduleView() {
  const todayStr = new Date().toISOString().split('T')[0]!;
  const [mentors, setMentors] = useState<MentorItem[]>([]);
  const [selectedMentorId, setSelectedMentorId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [scheduleData, setScheduleData] = useState<MentorScheduleResponse['data'] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch all mentors on mount
  useEffect(() => {
    api.getMentors()
      .then((data) => {
        setMentors(data);
        if (data.length > 0) {
          setSelectedMentorId(data[0]!.id);
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load mentors');
      });
  }, []);

  // 2. Fetch mentor schedule when mentor or date changes
  useEffect(() => {
    if (selectedMentorId && selectedDate) {
      setIsLoading(true);
      setError(null);
      api.getMentorSchedule(selectedMentorId, selectedDate)
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
  }, [selectedMentorId, selectedDate]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
            <UserCheck className="w-3.5 h-3.5" /> Mentor Schedule Inspector
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Daily Capacity & Bookings
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit mentor-local schedules and enforce the max 2-classes/mentor-local-day rule.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Mentor Selector */}
          <div>
            <label htmlFor="mentorSelect" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Select Mentor
            </label>
            <select
              id="mentorSelect"
              value={selectedMentorId}
              onChange={(e) => setSelectedMentorId(e.target.value)}
              className="w-full sm:w-52 py-2 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
            >
              {mentors.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.timeZone})
                </option>
              ))}
            </select>
          </div>

          {/* Date Selector */}
          <div>
            <label htmlFor="dateInput" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Mentor Local Date
            </label>
            <input
              id="dateInput"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="py-2 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-slate-500 space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs font-medium">Loading mentor schedule...</p>
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 shrink-0 text-red-600" />
          <p className="text-xs font-medium">{error}</p>
        </div>
      )}

      {/* Schedule Content */}
      {!isLoading && scheduleData && (
        <div className="space-y-6">
          {/* Capacity Metrics Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] font-bold uppercase text-slate-400">Mentor Time Zone</div>
              <div className="text-sm font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-600" />
                {scheduleData.mentor.timeZone}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Working: {scheduleData.mentor.workStartHour}:00 - {scheduleData.mentor.workEndHour}:00 Local
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] font-bold uppercase text-slate-400">Daily Capacity Limit</div>
              <div className="text-sm font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                {scheduleData.capacity.confirmedClassesCount} / {scheduleData.capacity.maxDailyClasses} Classes Used
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    scheduleData.capacity.isFullyBooked ? 'bg-red-500' : 'bg-blue-600'
                  }`}
                  style={{
                    width: `${(scheduleData.capacity.confirmedClassesCount / scheduleData.capacity.maxDailyClasses) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] font-bold uppercase text-slate-400">Capacity Status</div>
              <div className="mt-1">
                {scheduleData.capacity.isFullyBooked ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-100 text-red-800 text-xs font-bold">
                    <Lock className="w-3 h-3" /> Fully Booked (Limit Reached)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold">
                    <CheckCircle2 className="w-3 h-3" /> {scheduleData.capacity.availableCapacity} Slot(s) Available
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 mt-1.5">
                Date: {scheduleData.queryDate}
              </div>
            </div>
          </div>

          {/* Bookings List Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" /> Confirmed Bookings for {scheduleData.mentor.name} on {scheduleData.queryDate}
            </h3>

            {scheduleData.bookings.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs font-medium">
                No bookings scheduled for this mentor on this local date.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {scheduleData.bookings.map((b) => (
                  <div key={b.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {b.mentorLocalStartTime} - {b.mentorLocalEndTime} (Mentor Local)
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Parent: <span className="font-semibold text-slate-700">{b.parentName}</span> ({b.parentEmail}) - {b.parentTimeZone}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                        {b.status}
                      </span>
                      <a
                        href={b.demoClassUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Video className="w-3 h-3" /> Join Link
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
