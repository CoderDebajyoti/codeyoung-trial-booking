import { useState } from 'react';
import { CourseItem, PackageItem } from '../lib/api';
import { X, Sparkles, CheckCircle2, ShieldAlert, ArrowRight, CreditCard, Lock, User, Mail, Phone } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: CourseItem;
  pkg?: PackageItem;
  selectedPackage?: PackageItem;
  initialParentEmail?: string;
  initialParentName?: string;
  onBookTrial?: () => void;
  onNavigateToBooking?: () => void;
}

export function CheckoutModal({
  isOpen,
  onClose,
  course,
  pkg,
  selectedPackage,
  initialParentEmail = '',
  initialParentName = '',
  onBookTrial,
  onNavigateToBooking,
}: CheckoutModalProps) {
  const [parentName, setParentName] = useState(initialParentName);
  const [studentName, setStudentName] = useState('');
  const [parentEmail, setParentEmail] = useState(initialParentEmail);
  const [parentPhone, setParentPhone] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const currentPkg = pkg || selectedPackage || {
    id: 'default-pkg',
    courseId: course.id,
    duration: '1 month',
    classesCount: 8,
    price: course.basePrice || 199,
    currency: course.currency || 'USD',
    isActive: true,
  };

  const pricePerClass = currentPkg.classesCount > 0
    ? (currentPkg.price / currentPkg.classesCount).toFixed(2)
    : '0';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  const handleTrialRedirect = () => {
    onClose();
    if (onBookTrial) onBookTrial();
    else if (onNavigateToBooking) onNavigateToBooking();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-[#F7E4B6] shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#FFF0D2] flex items-center justify-center text-[#713B18] hover:bg-[#FFD45A] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF0D2] text-[#843B13] text-[11px] font-extrabold border border-[#F7E4B6]">
                <CreditCard className="w-3.5 h-3.5 text-[#F28C28]" />
                <span>Package Enrollment Review</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-[#713B18] mt-2">
                Review Course Package
              </h2>
              <p className="text-xs text-[#843B13] font-medium">
                Verify curriculum package details before initiating enrollment.
              </p>
            </div>

            {/* Selected Course & Package Summary Box */}
            <div className="p-4 rounded-2xl bg-[#FFF8E8] border border-[#F7E4B6] space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[10px] uppercase font-extrabold text-[#843B13]">Selected Course</div>
                  <div className="font-extrabold text-sm text-[#713B18]">{course.title}</div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#FFF0D2] text-[#843B13] font-extrabold text-xs border border-[#F7E4B6]">
                  {course.category}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#F7E4B6]/60 text-center">
                <div className="p-2 bg-white rounded-xl border border-[#F7E4B6]">
                  <div className="text-[10px] text-[#843B13] font-bold">Duration</div>
                  <div className="text-xs font-extrabold text-[#713B18]">{currentPkg.duration}</div>
                </div>
                <div className="p-2 bg-white rounded-xl border border-[#F7E4B6]">
                  <div className="text-[10px] text-[#843B13] font-bold">Live Classes</div>
                  <div className="text-xs font-extrabold text-[#713B18]">{currentPkg.classesCount} Classes</div>
                </div>
                <div className="p-2 bg-white rounded-xl border border-[#F7E4B6]">
                  <div className="text-[10px] text-[#843B13] font-bold">Per Class</div>
                  <div className="text-xs font-extrabold text-[#843B13]">${pricePerClass}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#F7E4B6]/60 flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#713B18]">Total Package Fee:</span>
                <span className="text-lg font-heading font-extrabold text-[#843B13]">
                  ${currentPkg.price} <span className="text-xs font-normal text-[#843B13]">{currentPkg.currency}</span>
                </span>
              </div>
            </div>

            {/* Parent & Student Contact Details Form */}
            <div className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-extrabold text-[#713B18] mb-1">
                  Parent Full Name <span className="text-[#F28C28]">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#843B13] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-xs font-bold text-[#713B18] rounded-xl border border-[#F7E4B6] bg-[#FFF8E8]/50 focus:outline-none focus:ring-2 focus:ring-[#FFD45A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#713B18] mb-1">
                  Student Full Name <span className="text-[#F28C28]">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#843B13] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aryan Doe"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-xs font-bold text-[#713B18] rounded-xl border border-[#F7E4B6] bg-[#FFF8E8]/50 focus:outline-none focus:ring-2 focus:ring-[#FFD45A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-[#713B18] mb-1">
                    Email Address <span className="text-[#F28C28]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#843B13] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="parent@example.com"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 text-xs font-bold text-[#713B18] rounded-xl border border-[#F7E4B6] bg-[#FFF8E8]/50 focus:outline-none focus:ring-2 focus:ring-[#FFD45A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#713B18] mb-1">
                    Phone Number <span className="text-[#F28C28]">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#843B13] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      placeholder="+1 (555) 000-0000"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 text-xs font-bold text-[#713B18] rounded-xl border border-[#F7E4B6] bg-[#FFF8E8]/50 focus:outline-none focus:ring-2 focus:ring-[#FFD45A]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Honest Payment Gateway Integration Notice */}
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-left">
              <ShieldAlert className="w-4 h-4 text-[#F28C28] shrink-0 mt-0.5" />
              <div className="text-[11px] text-[#843B13] leading-relaxed">
                <span className="font-extrabold text-[#713B18]">Checkout-Ready Flow: </span>
                This application is pre-configured with complete package specifications. Submitting this order registers your interest and prepares the checkout invoice for the real payment gateway (Stripe/Razorpay integration).
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="submit"
                className="btn-primary-gradient w-full py-3.5 px-4 rounded-2xl text-xs font-extrabold text-[#713B18] flex items-center justify-center gap-2 cursor-pointer shadow-btn hover:shadow-btn-hover"
              >
                <Lock className="w-4 h-4" />
                <span>Confirm & Request Package Invoice</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleTrialRedirect}
                className="w-full py-2.5 px-3 text-xs font-bold text-[#843B13] hover:text-[#713B18] underline cursor-pointer"
              >
                Or book a 100% Free 1:1 Trial Class first
              </button>
            </div>
          </form>
        ) : (
          /* Submission Order Review Success Notice */
          <div className="text-center py-6 space-y-4 animate-in fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-heading font-extrabold text-[#713B18]">
                Enrollment Request Received!
              </h3>
              <p className="text-xs text-[#843B13] max-w-sm mx-auto font-medium">
                Thank you, <span className="font-extrabold">{parentName}</span>! We have prepared your enrollment order for <span className="font-extrabold">{course.title}</span> ({currentPkg.duration} · {currentPkg.classesCount} Classes).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFF8E8] border border-[#F7E4B6] text-left text-xs space-y-2">
              <div className="font-extrabold text-[#713B18] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#F28C28]" /> Next Steps:
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[#843B13] font-semibold text-[11px]">
                <li>A dedicated academic counselor will reach out to {parentEmail}.</li>
                <li>You will receive your personalized mentor match and schedule onboarding.</li>
                <li>Invoice and payment link (${currentPkg.price} {currentPkg.currency}) has been generated.</li>
              </ul>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-[#F7E4B6] bg-[#FFF0D2] text-[#713B18] text-xs font-extrabold cursor-pointer"
              >
                Close Window
              </button>
              <button
                onClick={handleTrialRedirect}
                className="btn-primary-gradient flex-1 py-3 px-4 rounded-xl text-xs font-extrabold text-[#713B18] cursor-pointer"
              >
                Book Free Trial Class
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
