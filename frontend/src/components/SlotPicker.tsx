import { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Globe,
  ArrowLeft,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { api, SlotItem, BookingResponseData } from '../lib/api';
import { ParentFormData } from './ParentDetailsForm';
import { getTimeZoneDetails } from '../lib/timezones';

interface SlotPickerProps {
  parentData: ParentFormData;
  onBack: () => void;
  onBookingSuccess: (bookingData: BookingResponseData) => void;
}

export function SlotPicker({ parentData, onBack, onBookingSuccess }: SlotPickerProps) {
  // Generate next 14 selectable dates
  const today = new Date();
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i + 1); // Starting tomorrow for scheduling
    return d.toISOString().split('T')[0]!;
  });

  const [selectedDate, setSelectedDate] = useState<string>(dates[0] || '');
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotItem | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(true);
  const [slotError, setSlotError] = useState<string | null>(null);

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [alternativeSlots, setAlternativeSlots] = useState<SlotItem[]>([]);

  const fetchSlots = async (dateStr: string, tz: string) => {
    setIsLoadingSlots(true);
    setSlotError(null);
    setSelectedSlot(null);
    setSubmitError(null);
    setAlternativeSlots([]);

    try {
      const available = await api.getAvailableSlots(dateStr, tz);
      setSlots(available);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load available slots for this date.';
      setSlotError(message);
      setSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (selectedDate && parentData.parentTimeZone) {
      fetchSlots(selectedDate, parentData.parentTimeZone);
    }
  }, [selectedDate, parentData.parentTimeZone]);

  const handleBookSlot = async () => {
    if (!selectedSlot) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setAlternativeSlots([]);

    try {
      // Idempotency key to avoid duplicate submissions
      const idempotencyKey = `idem-${parentData.parentEmail}-${selectedSlot.startUtc}`;

      const booking = await api.createBooking({
        parentName: parentData.parentName,
        parentEmail: parentData.parentEmail,
        parentPhone: parentData.parentPhone,
        course: parentData.course,
        parentTimeZone: parentData.parentTimeZone,
        startAt: selectedSlot.startUtc,
        idempotencyKey,
      });

      onBookingSuccess(booking);
    } catch (err) {
      const errorObj = err as Error & { alternativeSlots?: SlotItem[] };
      setSubmitError(errorObj.message || 'This slot is no longer available.');
      if (errorObj.alternativeSlots && Array.isArray(errorObj.alternativeSlots)) {
        setAlternativeSlots(errorObj.alternativeSlots);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Edit Parent Details</span>
          </button>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Select Class Date & Time
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Booking for <span className="font-semibold text-slate-700">{parentData.parentName}</span> ({parentData.course})
          </p>
        </div>

        <div className="flex items-center gap-2.5 bg-blue-50 text-blue-700 px-3.5 py-2 rounded-xl border border-blue-200/70 text-xs font-medium self-start sm:self-auto">
          <Globe className="w-4 h-4 text-blue-600 shrink-0" />
          <div>
            <div className="text-[10px] text-blue-500 uppercase font-bold tracking-wider leading-none">
              {getTimeZoneDetails(parentData.parentTimeZone).friendlyName}
            </div>
            <div className="font-bold mt-0.5 font-mono text-[11px]">
              {getTimeZoneDetails(parentData.parentTimeZone).canonicalTimeZone} · <span className="text-blue-600">{getTimeZoneDetails(parentData.parentTimeZone).utcOffset}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Date Carousel Selector */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-blue-600" /> Choose Date
          </label>
          <span className="text-xs text-slate-400">All times shown in your local time</span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none">
          {dates.map((dateStr) => {
            const d = new Date(`${dateStr}T12:00:00Z`);
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
            const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const isSelected = selectedDate === dateStr;

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => setSelectedDate(dateStr)}
                className={`flex-shrink-0 px-4 py-3 rounded-xl border text-center transition-all cursor-pointer min-w-[90px] ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 font-bold scale-[1.02]'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className={`text-[11px] font-bold uppercase ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                  {dayName}
                </div>
                <div className="text-sm font-extrabold mt-0.5">{monthDay}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slots Grid */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-600" /> Available 30-Minute Slots
          </label>
          {slots.length > 0 && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {slots.length} slots available
            </span>
          )}
        </div>

        {/* Loading State */}
        {isLoadingSlots && (
          <div className="py-12 flex flex-col items-center justify-center text-slate-500 space-y-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs font-medium">Checking live mentor capacity...</p>
          </div>
        )}

        {/* Error State */}
        {!isLoadingSlots && slotError && (
          <div className="p-6 rounded-xl bg-red-50 border border-red-200 text-red-700 text-center space-y-3">
            <AlertCircle className="w-6 h-6 text-red-500 mx-auto" />
            <p className="text-sm font-medium">{slotError}</p>
            <button
              type="button"
              onClick={() => fetchSlots(selectedDate, parentData.parentTimeZone)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold shadow-xs hover:bg-red-700 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingSlots && !slotError && slots.length === 0 && (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">No mentors available on this date</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All mentors are either outside their working hours or have reached the 2-class daily limit for this date.
              Please choose another date above.
            </p>
          </div>
        )}

        {/* Slots Grid */}
        {!isLoadingSlots && !slotError && slots.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {slots.map((slot) => {
              const isSelected = selectedSlot?.startUtc === slot.startUtc;
              return (
                <button
                  type="button"
                  key={slot.startUtc}
                  onClick={() => {
                    setSelectedSlot(slot);
                    setSubmitError(null);
                  }}
                  className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    isSelected
                      ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500 text-blue-900 font-bold shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 text-slate-800 font-semibold'
                  }`}
                >
                  <span className="text-base font-extrabold tracking-tight">
                    {slot.parentLocalTime}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500">
                    {slot.availableMentorsCount} {slot.availableMentorsCount === 1 ? 'mentor' : 'mentors'} open
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Slot Conflict Error & Alternatives */}
        {submitError && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold">Slot Unavailable:</span> {submitError}
              </div>
            </div>

            {alternativeSlots.length > 0 && (
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 mb-2">
                  Suggested Alternative Slots:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {alternativeSlots.map((alt) => (
                    <button
                      key={alt.startUtc}
                      type="button"
                      onClick={() => {
                        setSelectedDate(alt.parentLocalDate);
                        setSelectedSlot(alt);
                        setSubmitError(null);
                      }}
                      className="p-2 rounded-lg bg-white border border-amber-300 text-center hover:bg-amber-100/50 text-xs font-bold text-amber-900 transition-colors cursor-pointer"
                    >
                      <div>{alt.parentLocalDate}</div>
                      <div className="text-blue-700">{alt.parentLocalTime}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Booking Action Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          {selectedSlot ? (
            <div className="text-xs text-slate-600">
              Selected Time:{' '}
              <span className="font-bold text-slate-900">
                {selectedDate} at {selectedSlot.parentLocalTime} ({parentData.parentTimeZone})
              </span>
            </div>
          ) : (
            <div className="text-xs text-slate-500">
              Please choose a 30-minute slot above to continue.
            </div>
          )}
        </div>

        <button
          type="button"
          disabled={!selectedSlot || isSubmitting}
          onClick={handleBookSlot}
          className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
            selectedSlot && !isSubmitting
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/25 active:scale-[0.99]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Matching Mentor & Reserving...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Confirm 1:1 Trial Booking</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
