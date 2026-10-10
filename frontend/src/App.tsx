import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LoginPage } from './components/LoginPage';
import { ParentDetailsForm, ParentFormData } from './components/ParentDetailsForm';
import { SlotPicker } from './components/SlotPicker';
import { BookingConfirmation } from './components/BookingConfirmation';
import { MentorScheduleView } from './components/MentorScheduleView';
import { AuthModal } from './components/AuthModal';
import { getDetectedDeviceTimeZone } from './lib/timezones';
import { BookingResponseData, AuthUser, api } from './lib/api';
import { Check, User, Calendar, Sparkles } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'booking' | 'login' | 'mentor-schedule'>('booking');
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'parent' | 'mentor'>('parent');

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

    // Check if user has active session
    api.getMe().then((user) => {
      if (user) {
        setCurrentUser(user);
      }
    });
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

  const handleLoginSuccess = (user: AuthUser, type: 'parent' | 'mentor') => {
    setCurrentUser(user);
    if (type === 'parent') {
      setParentData((prev) => ({
        ...prev,
        parentName: user.name || prev.parentName,
        parentEmail: user.email || prev.parentEmail,
      }));
      setActiveTab('booking');
      setBookingStep(1);
    } else {
      setActiveTab('mentor-schedule');
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setActiveTab('booking');
  };

  const handleOpenAuthModal = (tab: 'parent' | 'mentor' = 'parent') => {
    setAuthModalTab(tab);
    setIsLoginModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FFF8E8] text-[#713B18] selection:bg-[#FFD45A] selection:text-[#713B18]">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'mentor-schedule' && !currentUser) {
            handleOpenAuthModal('mentor');
          } else {
            setActiveTab(tab);
          }
        }}
        selectedTimeZone={parentData.parentTimeZone}
        currentUser={currentUser}
        onOpenLogin={handleOpenAuthModal}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className={`mx-auto px-4 sm:px-6 py-6 sm:py-10 w-full flex-1 ${activeTab === 'login' ? 'max-w-7xl' : 'max-w-5xl'}`}>
        {activeTab === 'login' && (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onNavigateToBooking={() => {
              setActiveTab('booking');
              setBookingStep(1);
            }}
          />
        )}

        {activeTab === 'booking' && (
          <div className="space-y-8">
            {/* Step Progress Breadcrumb */}
            {bookingStep < 3 && (
              <div className="max-w-lg mx-auto flex items-center justify-between relative">
                {/* Connecting Bar */}
                <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-1 bg-[#F7E4B6] z-0 rounded-full" />
                <div
                  className={`absolute top-1/2 left-8 -translate-y-1/2 h-1 bg-gradient-to-r from-[#FFD45A] to-[#FFB82E] transition-all duration-300 z-0 rounded-full ${
                    bookingStep === 2 ? 'w-1/2' : 'w-0'
                  }`}
                />

                {/* Step 1 Node */}
                <div className="relative z-10 flex flex-col items-center gap-1.5">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-xs transition-all shadow-xs ${
                      bookingStep === 1
                        ? 'btn-primary-gradient text-[#713B18] ring-4 ring-[#FFD45A]/40'
                        : 'bg-[#FFC52E] text-[#713B18] border border-[#F7E4B6]'
                    }`}
                  >
                    {bookingStep > 1 ? <Check className="w-4 h-4 text-[#713B18]" /> : <User className="w-4 h-4 text-[#713B18]" />}
                  </div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#713B18]">
                    1. Details
                  </span>
                </div>

                {/* Step 2 Node */}
                <div className="relative z-10 flex flex-col items-center gap-1.5">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-xs transition-all shadow-xs ${
                      bookingStep === 2
                        ? 'btn-primary-gradient text-[#713B18] ring-4 ring-[#FFD45A]/40'
                        : 'bg-white border-2 border-[#F7E4B6] text-[#713B18]/40'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#713B18]">
                    2. Date & Time
                  </span>
                </div>

                {/* Step 3 Node */}
                <div className="relative z-10 flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-xs bg-white border-2 border-[#F7E4B6] text-[#713B18]/40 shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#713B18]/40">
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
        {activeTab === 'mentor-schedule' && (
          <MentorScheduleView
            currentUser={currentUser}
            onOpenLogin={() => handleOpenAuthModal('mentor')}
          />
        )}
      </main>

      {/* Dual Parent / Mentor Authentication Modal */}
      <AuthModal
        isOpen={isLoginModalOpen}
        initialTab={authModalTab}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Footer */}
      <footer className="border-t border-[#F7E4B6] bg-[#FFF8E8] py-6 text-center text-xs text-[#713B18]/70">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Codeyoung Trial Class Appointment Booking &copy; 2026. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-[11px] text-[#713B18]/50">
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
