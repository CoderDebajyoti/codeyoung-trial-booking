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
  Check,
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

  const fetchSlots = async (dateStr: string, tz: string, keepSubmitError = false) => {
    setIsLoadingSlots(true);
    setSlotError(null);
    setSelectedSlot(null);
    if (!keepSubmitError) {
      setSubmitError(null);
      setAlternativeSlots([]);
    }

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
        parentPhone: parentData.parentPhone || undefined,
        course: parentData.course,
        parentTimeZone: parentData.parentTimeZone,
        startAt: selectedSlot.startUtc,
        idempotencyKey,
        verificationToken: parentData.verificationToken || 'test-verified-token',
        captchaToken: 'test-captcha-token',
      });

      onBookingSuccess(booking);
    } catch (err: any) {
      const errorMsg = err?.message || 'Selected slot is no longer available. Please choose another time.';
      setSubmitError(errorMsg);
      const alts = err?.alternativeSlots || err?.alternatives;
      if (alts && Array.isArray(alts)) {
        setAlternativeSlots(alts);
      }
      // Refresh slots without clearing the submission error
      fetchSlots(selectedDate, parentData.parentTimeZone, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tzDetails = getTimeZoneDetails(parentData.parentTimeZone);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Card with Golden-to-Orange Gradient */}
      <div className="bg-gradient-to-r from-[#FFD45A] via-[#FFC52E] to-[#FFB82E] rounded-3xl p-6 sm:p-8 text-[#713B18] border border-[#F7E4B6] shadow-card-warm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/40 text-[#713B18] text-xs font-extrabold backdrop-blur-xs mb-2 border border-white/50">
              <Sparkles className="w-3.5 h-3.5 text-[#843B13]" /> Step 2 of 2: Select Date & Time
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-[#713B18]">
              Select Class Date & Time
            </h2>
            <p className="text-[#843B13] text-xs sm:text-sm mt-1 font-semibold">
              Booking for <strong>{parentData.parentName}</strong> ({parentData.course}).
            </p>
          </div>

          <button
            onClick={onBack}
            className="btn-warm-secondary px-4 py-2 text-xs font-extrabold flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#713B18]" />
            <span>Edit Details</span>
          </button>
        </div>

        {/* Selected Timezone Badge */}
        <div className="mt-4 pt-4 border-t border-[#F7E4B6]/80 flex items-center gap-2 text-xs text-[#843B13] font-bold">
          <Globe className="w-4 h-4 text-[#F28C28] shrink-0" />
          <span>Local Time Zone:</span>
          <span className="font-extrabold text-[#713B18] bg-white/60 px-2.5 py-0.5 rounded-lg border border-white/80">
            {tzDetails.friendlyName} ({tzDetails.canonicalTimeZone} · {tzDetails.utcOffset})
          </span>
        </div>
      </div>

      {/* Main Selection Area */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#F7E4B6] shadow-card-warm space-y-6">
        {/* 1. Date Selector Carousel */}
        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-[#713B18] mb-3 flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-[#F28C28]" /> 1. Select Date
          </label>
          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
            {dates.map((dStr) => {
              const dateObj = new Date(dStr + 'T00:00:00');
              const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
              const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
              const dayNum = dateObj.getDate();
              const isSelected = selectedDate === dStr;

              return (
                <button
                  key={dStr}
                  onClick={() => setSelectedDate(dStr)}
                  className={`shrink-0 flex flex-col items-center justify-center p-3 rounded-2xl w-20 sm:w-22 transition-all cursor-pointer border ${
                    isSelected
                      ? 'btn-primary-gradient text-[#713B18] border-transparent font-extrabold shadow-sm'
                      : 'border-[#F7E4B6] bg-white hover:bg-[#FFF8E8] text-[#713B18]'
                  }`}
                >
                  <span className={`text-[11px] uppercase tracking-wider ${isSelected ? 'font-extrabold text-[#843B13]' : 'text-[#713B18]/70 font-bold'}`}>
                    {dayName}
                  </span>
                  <span className="text-xl font-extrabold my-0.5 text-[#713B18]">
                    {dayNum}
                  </span>
                  <span className={`text-[10px] ${isSelected ? 'font-bold text-[#843B13]' : 'text-[#713B18]/60'}`}>
                    {monthName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Available Slots Grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-extrabold uppercase tracking-wider text-[#713B18] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#F28C28]" /> 2. Select Time (Your Local Time)
            </label>
            {!isLoadingSlots && slots.length > 0 && (
              <span className="text-xs font-extrabold text-[#843B13] bg-[#FFF0D2] px-2.5 py-0.5 rounded-full border border-[#F7E4B6]">
                {slots.length} slots available
              </span>
            )}
          </div>

          {/* Loading State */}
          {isLoadingSlots && (
            <div className="py-12 text-center text-[#713B18]/70 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#F28C28]" />
              <p className="text-xs font-bold">Checking real-time mentor availability across timezones...</p>
            </div>
          )}

          {/* Slot Loading Error */}
          {!isLoadingSlots && slotError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold">Failed to load available slots</p>
                <p className="mt-0.5">{slotError}</p>
                <button
                  onClick={() => fetchSlots(selectedDate, parentData.parentTimeZone)}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:text-rose-900 cursor-pointer underline"
                >
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingSlots && !slotError && slots.length === 0 && (
            <div className="py-10 px-4 text-center rounded-2xl border-2 border-dashed border-[#F7E4B6] bg-[#FFF8E8]/40">
              <AlertCircle className="w-8 h-8 text-[#F28C28] mx-auto mb-2" />
              <h4 className="font-extrabold text-sm text-[#713B18]">No Slots Available on this Date</h4>
              <p className="text-xs text-[#713B18]/70 max-w-sm mx-auto mt-1 font-medium">
                All eligible mentors are fully booked or at their daily 2-class limit. Please select a different date from the carousel above.
              </p>
            </div>
          )}

          {/* Slots Grid */}
          {!isLoadingSlots && !slotError && slots.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
              {slots.map((slot) => {
                const isSelected = selectedSlot?.startUtc === slot.startUtc;
                return (
                  <button
                    key={slot.startUtc}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-3 px-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      isSelected
                        ? 'btn-primary-gradient text-[#713B18] border-transparent font-extrabold shadow-md ring-2 ring-[#F28C28]'
                        : 'border-[#F7E4B6] bg-white hover:bg-[#FFF8E8] hover:border-[#FFC52E] text-[#713B18]'
                    }`}
                  >
                    <span className="text-sm font-extrabold tracking-tight">
                      {slot.parentLocalTime}
                    </span>
                    <span className={`text-[10px] ${isSelected ? 'text-[#843B13] font-bold' : 'text-[#713B18]/60 font-semibold'}`}>
                      {slot.availableMentorsCount} {slot.availableMentorsCount === 1 ? 'mentor' : 'mentors'} open
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Concurrency/Booking Error Alert with Alternatives */}
        {submitError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold">Slot Unavailable</p>
                <p className="mt-0.5">{submitError}</p>
              </div>
            </div>

            {alternativeSlots.length > 0 && (
              <div className="pt-2 border-t border-rose-200">
                <p className="font-extrabold text-[11px] uppercase tracking-wider text-rose-800 mb-2">
                  Suggested Alternative Slots:
                </p>
                <div className="flex flex-wrap gap-2">
                  {alternativeSlots.map((alt) => (
                    <button
                      key={alt.startUtc}
                      onClick={() => {
                        setSelectedDate(alt.parentLocalDate);
                        setSelectedSlot(alt);
                        setSubmitError(null);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white border border-rose-300 text-rose-800 font-bold text-xs hover:bg-rose-100 cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                    >
                      <span className="opacity-80">{alt.parentLocalDate} at</span>
                      <span className="font-extrabold">{alt.parentLocalTime}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Booking Confirmation CTA Button */}
        <div className="pt-4 border-t border-[#F7E4B6]">
          <button
            type="button"
            disabled={!selectedSlot || isSubmitting}
            onClick={handleBookSlot}
            className="btn-primary-gradient w-full py-4 px-6 text-base font-extrabold text-[#713B18] flex items-center justify-center gap-2 cursor-pointer shadow-btn hover:shadow-btn-hover"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-[#713B18]" />
                <span>Confirming Booking with Fair Mentor Assignment...</span>
              </>
            ) : selectedSlot ? (
              <>
                <Check className="w-5 h-5 text-[#713B18]" />
                <span>Confirm 1:1 Trial Booking for {selectedSlot.parentLocalDate} at {selectedSlot.parentLocalTime}</span>
              </>
            ) : (
              <span>Select a Date & Time Slot Above</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
