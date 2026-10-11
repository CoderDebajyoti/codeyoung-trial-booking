import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  BookOpen,
  Award,
  Users,
  ShieldCheck,
  Package,
  HelpCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { CourseItem, PackageItem, api } from '../lib/api';
import { CourseCardImage } from './CourseCardImage';

interface CourseDetailsPageProps {
  courseId: string;
  onBack: () => void;
  onBookTrial: (course: CourseItem) => void;
  onPurchasePackage: (course: CourseItem, pkg: PackageItem) => void;
}

export function CourseDetailsPage({
  courseId,
  onBack,
  onBookTrial,
  onPurchasePackage,
}: CourseDetailsPageProps) {
  const [course, setCourse] = useState<CourseItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    api.getCourseById(courseId)
      .then((data) => {
        if (!isMounted) return;
        setCourse(data);
        if (data.packages && data.packages.length > 0) {
          const pop = data.packages.find((p) => p.isPopular) || data.packages[0];
          setSelectedPackageId(pop.id);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err?.message || 'Unable to load course details.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [courseId]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4 bg-white rounded-3xl border border-[#F7E4B6]">
        <Loader2 className="w-10 h-10 animate-spin text-[#F28C28] mx-auto" />
        <p className="text-sm font-bold text-[#843B13]">Loading curriculum details & package pricing...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="py-16 text-center space-y-4 bg-white rounded-3xl border border-[#F7E4B6] p-6">
        <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
        <h3 className="text-lg font-heading font-extrabold text-[#713B18]">Course Not Found</h3>
        <p className="text-xs font-semibold text-rose-800">{error || 'Could not load the requested course.'}</p>
        <button
          onClick={onBack}
          className="btn-primary-gradient px-4 py-2 text-xs font-extrabold text-[#713B18] rounded-xl"
        >
          Return to Course Catalogue
        </button>
      </div>
    );
  }

  const outcomes = Array.isArray(course.learningOutcomes)
    ? course.learningOutcomes
    : typeof course.learningOutcomes === 'string'
    ? (course.learningOutcomes as string).split(',').map((s) => s.trim())
    : [];

  const packages = course.packages && course.packages.length > 0 ? course.packages : [];
  const selectedPackage = packages.find((p) => p.id === selectedPackageId) || packages[0] || {
    id: 'default-1',
    courseId: course.id,
    duration: '1 month',
    classesCount: 8,
    price: course.basePrice || 199,
    currency: course.currency || 'USD',
    isActive: true,
  };

  const pricePerClass = selectedPackage.classesCount > 0
    ? (selectedPackage.price / selectedPackage.classesCount).toFixed(2)
    : '0';

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-6xl mx-auto">
      {/* Back Navigation Button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-extrabold text-[#843B13] hover:text-[#713B18] bg-white px-3.5 py-2 rounded-2xl border border-[#F7E4B6] transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-[#F28C28]" />
          <span>Back to All Courses</span>
        </button>
      </div>

      {/* Hero Header Banner */}
      <div className="bg-gradient-to-r from-[#FFD45A] via-[#FFC52E] to-[#FFB82E] p-6 sm:p-8 rounded-3xl border border-[#F7E4B6] shadow-card-warm text-[#713B18]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/60 text-[#713B18] text-xs font-extrabold border border-white/80 shadow-2xs">
                {course.category}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/40 text-[#843B13] text-xs font-bold">
                {course.ageGroup}
              </span>
              {course.classLevel && (
                <span className="px-3 py-1 rounded-full bg-white/30 text-[#843B13] text-xs font-bold">
                  {course.classLevel}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-heading font-extrabold text-[#713B18] tracking-tight leading-tight">
              {course.title}
            </h1>

            <p className="text-sm sm:text-base text-[#843B13] font-semibold leading-relaxed">
              {course.description}
            </p>
          </div>

          {/* Quick Trial Booking Card */}
          <div className="bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-[#F7E4B6] shadow-md space-y-4 text-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Free 30-Min 1:1 Trial
            </span>
            <div className="text-xs font-bold text-[#843B13]">
              Experience our live interactive class before purchasing a package.
            </div>
            <button
              onClick={() => onBookTrial(course)}
              className="btn-primary-gradient w-full py-3.5 px-4 rounded-2xl text-xs font-extrabold text-[#713B18] flex items-center justify-center gap-2 cursor-pointer shadow-btn hover:shadow-btn-hover"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Free 1:1 Trial</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Course Curriculum Details & Package Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Curriculum & Learning Outcomes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Visual Artwork / Fallback */}
          <CourseCardImage course={course} variant="card" className="rounded-3xl border border-[#F7E4B6] shadow-card-warm" />

          {/* Key Course Specifications */}
          <div className="bg-white p-6 rounded-3xl border border-[#F7E4B6] shadow-card-warm">
            <h2 className="text-base font-heading font-extrabold text-[#713B18] mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#F28C28]" />
              Course Specifications & Format
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-4 rounded-2xl bg-[#FFF8E8] border border-[#F7E4B6]">
                <Clock className="w-4 h-4 text-[#F28C28] mx-auto mb-1" />
                <div className="text-[11px] font-bold text-[#843B13]">Class Duration</div>
                <div className="text-sm font-extrabold text-[#713B18] mt-0.5">{course.classDuration} Mins</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#FFF8E8] border border-[#F7E4B6]">
                <BookOpen className="w-4 h-4 text-[#F28C28] mx-auto mb-1" />
                <div className="text-[11px] font-bold text-[#843B13]">Total Classes</div>
                <div className="text-sm font-extrabold text-[#713B18] mt-0.5">{course.totalClasses} Classes</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#FFF8E8] border border-[#F7E4B6]">
                <Users className="w-4 h-4 text-[#F28C28] mx-auto mb-1" />
                <div className="text-[11px] font-bold text-[#843B13]">Class Format</div>
                <div className="text-sm font-extrabold text-[#713B18] mt-0.5">1:1 Dedicated</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#FFF8E8] border border-[#F7E4B6]">
                <ShieldCheck className="w-4 h-4 text-[#F28C28] mx-auto mb-1" />
                <div className="text-[11px] font-bold text-[#843B13]">Certification</div>
                <div className="text-sm font-extrabold text-[#713B18] mt-0.5">STEM Certified</div>
              </div>
            </div>
          </div>

          {/* Learning Outcomes */}
          <div className="bg-white p-6 rounded-3xl border border-[#F7E4B6] shadow-card-warm space-y-4">
            <h2 className="text-base font-heading font-extrabold text-[#713B18] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              What Your Child Will Learn
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {outcomes.map((outcome, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-[#FFF8E8]/60 border border-[#F7E4B6] flex items-start gap-3"
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-[#713B18] leading-relaxed">
                    {outcome}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pedagogy FAQ & Guarantee */}
          <div className="bg-[#FFF0D2]/60 p-6 rounded-3xl border border-[#F7E4B6] space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#713B18] flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-[#F28C28]" />
              The Codeyoung 1:1 Difference
            </h3>
            <p className="text-xs text-[#843B13] font-semibold leading-relaxed">
              Every package includes dedicated 1:1 live guidance, customized pacing, monthly progress reports, and capstone project portfolios reviewed by industry experts.
            </p>
          </div>
        </div>

        {/* Right Column: Configurable Packages & Purchase Box */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-[#F7E4B6] shadow-card-warm space-y-5 sticky top-24">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#713B18] flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-[#F28C28]" />
                  Choose Course Package
                </span>
                <span className="text-[10px] font-bold text-[#843B13]">
                  {packages.length} options
                </span>
              </div>
              <p className="text-xs text-[#843B13] font-medium mt-1">
                Select your preferred learning duration and schedule commitment.
              </p>
            </div>

            {/* Package Selector Cards */}
            <div className="space-y-2.5">
              {packages.map((pkg) => {
                const isSelected = pkg.id === selectedPackage.id;
                const pkgPricePerClass = pkg.classesCount > 0 ? (pkg.price / pkg.classesCount).toFixed(2) : '0';
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackageId(pkg.id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-[#F28C28] bg-[#FFF0D2] shadow-sm'
                        : 'border-[#F7E4B6] bg-white hover:bg-[#FFF8E8] hover:border-[#FFC52E]'
                    }`}
                  >
                    {pkg.isPopular && (
                      <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-[#F28C28] text-white font-extrabold text-[10px] shadow-xs">
                        Most Popular
                      </span>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-extrabold text-sm text-[#713B18]">
                          {pkg.duration} Package
                        </div>
                        <div className="text-xs font-bold text-[#843B13] mt-0.5">
                          {pkg.classesCount} Classes ({course.classDuration}m each)
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-heading font-extrabold text-[#713B18]">
                          ${pkg.price}
                        </div>
                        <div className="text-[10px] font-bold text-[#843B13]">
                          ${pkgPricePerClass}/class
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Package Breakdown Summary */}
            <div className="p-4 rounded-2xl bg-[#FFF8E8] border border-[#F7E4B6] space-y-2 text-xs">
              <div className="flex justify-between font-bold text-[#843B13]">
                <span>Selected Duration:</span>
                <span className="text-[#713B18] font-extrabold">{selectedPackage.duration}</span>
              </div>
              <div className="flex justify-between font-bold text-[#843B13]">
                <span>Total Live Classes:</span>
                <span className="text-[#713B18] font-extrabold">{selectedPackage.classesCount} Classes</span>
              </div>
              <div className="flex justify-between font-bold text-[#843B13]">
                <span>Price per 1:1 Class:</span>
                <span className="text-[#713B18] font-extrabold">${pricePerClass} {selectedPackage.currency}</span>
              </div>
              <div className="pt-2 border-t border-[#F7E4B6] flex justify-between text-sm font-extrabold text-[#713B18]">
                <span>Total Investment:</span>
                <span className="text-base text-[#843B13]">${selectedPackage.price} {selectedPackage.currency}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => onPurchasePackage(course, selectedPackage)}
                className="btn-primary-gradient w-full py-3.5 px-4 rounded-2xl text-xs font-extrabold text-[#713B18] flex items-center justify-center gap-2 cursor-pointer shadow-btn hover:shadow-btn-hover"
              >
                <Package className="w-4 h-4" />
                <span>Purchase Package (${selectedPackage.price})</span>
              </button>

              <button
                onClick={() => onBookTrial(course)}
                className="w-full py-3 px-4 rounded-2xl text-xs font-bold text-[#713B18] bg-[#FFF0D2] hover:bg-[#FFE6B3] border border-[#F7E4B6] flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Calendar className="w-4 h-4 text-[#F28C28]" />
                <span>Try a Free Trial Class First</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
