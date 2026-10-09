import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ParentDetailsForm, ParentFormData } from './components/ParentDetailsForm';
import { SlotPicker } from './components/SlotPicker';
import { BookingConfirmation } from './components/BookingConfirmation';
import { MentorScheduleView } from './components/MentorScheduleView';
import { getDetectedDeviceTimeZone } from './lib/timezones';
import { BookingResponseData } from './lib/api';
import { Check, User, Calendar, Sparkles } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'booking' | 'mentor-schedule'>('booking');
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [parentData, setParentData] = useState<ParentFormData>({
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    course: 'Coding & Game Design (Scratch / Roblox)',
    parentTimeZone: getDetectedDeviceTimeZone(),
  });

  const [confirmedBooking, setConfirmedBooking] = useState<BookingResponseData | null>(null);

  useEffect(() => {
    const tz = getDetectedDeviceTimeZone();
    setParentData((prev) => ({
      ...prev,
      parentTimeZone: prev.parentTimeZone || tz,
    }));
  }, []);

  const handleParentDetailsSubmit = (data: ParentFormData) => {
    setParentData(data);
    setBookingStep(2);
  };

  const handleBookingSuccess = (booking: BookingResponseData) => {
    setConfirmedBooking(booking);
    setBookingStep(3);
  };

  const handleBookAnother = () => {
    setConfirmedBooking(null);
    setBookingStep(1);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50/70 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        selectedTimeZone={parentData.parentTimeZone}
      />

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full flex-1">
        {activeTab === 'booking' && (
          <div className="space-y-8">
            {/* Step Progress Breadcrumb */}
            {bookingStep < 3 && (
              <div className="max-w-lg mx-auto flex items-center justify-between relative">
                {/* Connecting Bar */}
                <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-0.5 bg-slate-200 z-0" />
                <div
                  className={`absolute top-1/2 left-8 -translate-y-1/2 h-0.5 bg-blue-600 transition-all duration-300 z-0 ${
                    bookingStep === 2 ? 'w-1/2' : 'w-0'
                  }`}
                />

                {/* Step 1 Node */}
                <div className="relative z-10 flex flex-col items-center gap-1.5">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-xs ${
                      bookingStep === 1
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {bookingStep > 1 ? <Check className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    1. Details
                  </span>
                </div>

                {/* Step 2 Node */}
                <div className="relative z-10 flex flex-col items-center gap-1.5">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-xs ${
                      bookingStep === 2
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : 'bg-white border-2 border-slate-300 text-slate-400'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    2. Date & Time
                  </span>
                </div>

                {/* Step 3 Node */}
                <div className="relative z-10 flex flex-col items-center gap-1.5">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs bg-white border-2 border-slate-300 text-slate-400 shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    3. Confirmed
                  </span>
                </div>
              </div>
            )}

            {/* Screen A: Parent Details Form */}
            {bookingStep === 1 && (
              <ParentDetailsForm
                initialData={parentData}
                onSubmit={handleParentDetailsSubmit}
              />
            )}

            {/* Screen B: Slot Picker */}
            {bookingStep === 2 && (
              <SlotPicker
                parentData={parentData}
                onBack={() => setBookingStep(1)}
                onBookingSuccess={handleBookingSuccess}
              />
            )}

            {/* Screen C: Booking Confirmation */}
            {bookingStep === 3 && confirmedBooking && (
              <BookingConfirmation
                booking={confirmedBooking}
                onBookAnother={handleBookAnother}
              />
            )}
          </div>
        )}

        {/* Screen D: Mentor Schedule Inspector View */}
        {activeTab === 'mentor-schedule' && <MentorScheduleView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Codeyoung Trial Class Appointment Booking &copy; 2026. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Powered by Node.js & React</span>
            <span>•</span>
            <span>PostgreSQL Concurrency-Safe Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
