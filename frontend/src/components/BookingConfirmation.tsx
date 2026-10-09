import { useState } from 'react';
import {
  CheckCircle2,
  Globe,
  User,
  Video,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  BookOpen,
} from 'lucide-react';

import { BookingResponseData } from '../lib/api';
import { getTimeZoneDetails } from '../lib/timezones';

interface BookingConfirmationProps {
  booking: BookingResponseData;
  onBookAnother: () => void;
}

export function BookingConfirmation({ booking, onBookAnother }: BookingConfirmationProps) {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(booking.demoClassUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in zoom-in-95 duration-300">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-8 text-white text-center shadow-lg shadow-emerald-600/15 relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-inner">
          <CheckCircle2 className="w-9 h-9 text-white" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-xs mb-2">
          <Sparkles className="w-3.5 h-3.5" /> Booking Confirmed!
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Your 1:1 Trial Class is Scheduled
        </h2>
        <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-md mx-auto">
          We have assigned an expert mentor and sent confirmation emails to{' '}
          <span className="font-bold underline">{booking.parent.email}</span>.
        </p>
      </div>

      {/* Main Details Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        {/* Booking Reference & Course */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Booking Reference
            </div>
            <div className="font-mono text-sm font-extrabold text-slate-800 mt-0.5">
              {booking.id}
            </div>
          </div>
          <div className="self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
              <BookOpen className="w-3.5 h-3.5" />
              {booking.course}
            </span>
          </div>
        </div>

        {/* Live Meeting Room Link */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Video className="w-4 h-4 text-blue-600" /> Live Demo Class Link
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Active Room
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={booking.demoClassUrl}
              className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 focus:outline-hidden"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Time Conversion Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Parent Time Card */}
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-blue-900 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" /> Parent (You)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-mono">
                {getTimeZoneDetails(booking.parent.timeZone).utcOffset}
              </span>
            </div>
            <div className="text-base font-extrabold text-slate-900">
              {booking.parent.localStartTime}
            </div>
            <div className="text-xs text-slate-600 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>
                <strong>{getTimeZoneDetails(booking.parent.timeZone).friendlyName}</strong> ({getTimeZoneDetails(booking.parent.timeZone).canonicalTimeZone})
              </span>
            </div>
          </div>

          {/* Mentor Time Card */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Assigned Mentor
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-mono">
                {getTimeZoneDetails(booking.mentor.timeZone).utcOffset}
              </span>
            </div>
            <div className="text-base font-extrabold text-slate-900">
              {booking.mentor.localStartTime}
            </div>
            <div className="text-xs text-slate-600 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>
                <strong>{booking.mentor.name}</strong> · {getTimeZoneDetails(booking.mentor.timeZone).friendlyName} ({getTimeZoneDetails(booking.mentor.timeZone).canonicalTimeZone})
              </span>
            </div>
          </div>
        </div>

        {/* Assigned Mentor Details */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center shadow-xs">
              {booking.mentor.name.charAt(0)}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">{booking.mentor.name}</div>
              <div className="text-[11px] text-slate-500">Expert Coding & STEM Educator</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Duration</div>
            <div className="text-xs font-bold text-slate-800">30 Minutes</div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onBookAnother}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Book Another Trial Class</span>
          </button>

          <a
            href={booking.demoClassUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Video className="w-4 h-4" />
            <span>Join Live Demo Room</span>
          </a>
        </div>
      </div>
    </div>
  );
}
