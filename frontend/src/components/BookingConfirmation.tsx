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

  const parentTzDetails = getTimeZoneDetails(booking.parent.timeZone);
  const mentorTzDetails = getTimeZoneDetails(booking.mentor.timeZone);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in zoom-in-95 duration-300">
      {/* Top Banner Card with Celebratory Golden Gradient */}
      <div className="bg-gradient-to-r from-[#FFD45A] via-[#FFC52E] to-[#FFB82E] rounded-3xl p-8 text-[#713B18] text-center border border-[#F7E4B6] shadow-card-warm relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-white/40 backdrop-blur-md flex items-center justify-center mx-auto mb-4 border border-white/60 shadow-inner">
          <CheckCircle2 className="w-9 h-9 text-[#713B18]" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/40 text-[#713B18] text-xs font-extrabold backdrop-blur-xs mb-2 border border-white/50">
          <Sparkles className="w-3.5 h-3.5 text-[#843B13]" /> Booking Confirmed!
        </div>
        <h2 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-[#713B18]">
          Your 1:1 Trial Class is Scheduled
        </h2>
        <p className="text-[#843B13] text-xs sm:text-sm mt-1 max-w-md mx-auto font-semibold">
          We have assigned an expert mentor and sent confirmation emails to{' '}
          <span className="font-extrabold underline">{booking.parent.email}</span>.
        </p>
      </div>

      {/* Main Details Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#F7E4B6] shadow-card-warm space-y-6">
        {/* Booking Reference & Course */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#F7E4B6] gap-3">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#713B18]/70">
              Booking Reference
            </div>
            <div className="font-mono text-sm font-extrabold text-[#713B18] mt-0.5">
              {booking.id}
            </div>
          </div>
          <div className="self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FFF0D2] text-[#843B13] border border-[#F7E4B6] text-xs font-extrabold">
              <BookOpen className="w-3.5 h-3.5 text-[#F28C28]" />
              {booking.course}
            </span>
          </div>
        </div>

        {/* Live Meeting Room Link Box */}
        <div className="p-4 rounded-2xl bg-[#FFF8E8] border border-[#F7E4B6] space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-extrabold text-[#713B18] flex items-center gap-1.5">
              <Video className="w-4 h-4 text-[#F28C28]" /> Live Demo Class Link
            </div>
            <span className="text-[11px] font-extrabold text-[#843B13] bg-[#FFF0D2] px-2.5 py-0.5 rounded-full border border-[#F7E4B6]">
              Active Room
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={booking.demoClassUrl}
              className="w-full text-xs font-mono bg-white border border-[#F7E4B6] rounded-xl px-3 py-2 text-[#713B18] font-bold select-all focus:outline-hidden"
            />
            <button
              onClick={handleCopyLink}
              className="btn-primary-gradient shrink-0 px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#713B18]" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#713B18]" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Local Schedule Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Parent Local Time Box */}
          <div className="p-4 rounded-2xl bg-[#FFF0D2]/70 border border-[#F7E4B6] space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#F28C28]" />
              <span className="text-xs font-extrabold text-[#713B18]">Parent Local Time</span>
            </div>
            <div className="font-extrabold text-sm text-[#713B18]">
              {booking.parent.localStartTime} - {booking.parent.localEndTime}
            </div>
            <div className="text-[11px] text-[#843B13] font-semibold flex items-center gap-1">
              <Globe className="w-3 h-3 text-[#F28C28]" />
              <span>{parentTzDetails.friendlyName}</span>
              <span>({parentTzDetails.canonicalTimeZone} · {parentTzDetails.utcOffset})</span>
            </div>
            <div className="text-[11px] text-[#713B18]/70 pt-1 border-t border-[#F7E4B6]">
              Parent: <strong>{booking.parent.name}</strong>
            </div>
          </div>

          {/* Mentor Local Time Box */}
          <div className="p-4 rounded-2xl bg-[#FFF8E8] border border-[#F7E4B6] space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#F28C28]" />
              <span className="text-xs font-extrabold text-[#713B18]">Assigned Mentor Local Time</span>
            </div>
            <div className="font-extrabold text-sm text-[#713B18]">
              {booking.mentor.localStartTime} - {booking.mentor.localEndTime}
            </div>
            <div className="text-[11px] text-[#843B13] font-semibold flex items-center gap-1">
              <Globe className="w-3 h-3 text-[#F28C28]" />
              <span>{mentorTzDetails.friendlyName}</span>
              <span>({mentorTzDetails.canonicalTimeZone} · {mentorTzDetails.utcOffset})</span>
            </div>
            <div className="text-[11px] text-[#713B18]/70 pt-1 border-t border-[#F7E4B6]">
              Mentor: <strong>{booking.mentor.name}</strong>
            </div>
          </div>
        </div>

        {/* Next Steps Info */}
        <div className="p-4 rounded-2xl bg-[#FFF8E8] border border-[#F7E4B6] text-xs text-[#713B18] space-y-1.5">
          <p className="font-extrabold text-xs text-[#843B13]">📌 What happens next?</p>
          <ul className="list-disc list-inside space-y-1 text-[#713B18]/80 font-medium">
            <li>A confirmation email has been dispatched with the live meeting room link.</li>
            <li>An automated reminder email will be delivered 30 minutes before your class begins.</li>
            <li>Please join the demo room 5 minutes prior to start time on desktop or laptop.</li>
          </ul>
        </div>

        {/* CTA Button — Book Another */}
        <div className="pt-2">
          <button
            onClick={onBookAnother}
            className="btn-primary-gradient w-full py-4 px-6 text-base font-extrabold text-[#713B18] flex items-center justify-center gap-2 cursor-pointer shadow-btn hover:shadow-btn-hover"
          >
            <RotateCcw className="w-4 h-4 text-[#713B18]" />
            <span>Book Another Free Trial Class</span>
          </button>
        </div>
      </div>
    </div>
  );
}
