import { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  BookOpen,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  Loader2,
  Package as PackageIcon
} from 'lucide-react';
import { CourseItem, PackageItem, api } from '../lib/api';

interface CourseCatalogueProps {
  onSelectCourse?: (courseId: string) => void;
  onBookTrial?: (course: CourseItem) => void;
  onPurchasePackage?: (course: CourseItem, pkg: PackageItem) => void;
}

const CATEGORIES = [
  'All Courses',
  'Coding & Programming',
  'Web Development',
  'AI & Robotics',
  'Mathematics & Science',
  'English & Communication',
];

export function CourseCatalogue({
  onSelectCourse,
  onBookTrial,
  onPurchasePackage,
}: CourseCatalogueProps) {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Courses');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected package duration per course ID (courseId -> packageId)
  const [selectedPackages, setSelectedPackages] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    api.getCourses()
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : [];
        setCourses(list);

        // Pre-select popular or first package for each course
        const initialSelected: Record<string, string> = {};
        list.forEach((c) => {
          if (c.packages && c.packages.length > 0) {
            const pop = c.packages.find((p) => p.isPopular) || c.packages[0];
            if (pop) initialSelected[c.id] = pop.id;
          }
        });
        setSelectedPackages(initialSelected);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err?.message || 'Unable to load course catalogue & pricing');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const courseList = Array.isArray(courses) ? courses : [];

  const filteredCourses = courseList.filter((course) => {
    const matchesCategory =
      selectedCategory === 'All Courses' || course.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const outcomesStr = Array.isArray(course.learningOutcomes)
      ? course.learningOutcomes.join(' ')
      : String(course.learningOutcomes || '');
    const descStr = course.description || '';
    const matchesSearch =
      !q ||
      course.title.toLowerCase().includes(q) ||
      descStr.toLowerCase().includes(q) ||
      course.category.toLowerCase().includes(q) ||
      course.ageGroup.toLowerCase().includes(q) ||
      outcomesStr.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Category Filter & Search Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#F7E4B6] shadow-card-warm space-y-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Live Search Bar */}
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 text-[#713B18]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search courses, skills, age groups, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FFF8E8]/70 border border-[#F7E4B6] text-xs font-bold text-[#713B18] placeholder:text-[#713B18]/40 focus:outline-none focus:ring-2 focus:ring-[#FFD45A]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-[#713B18]/50 hover:text-[#713B18]"
              >
                ✕
              </button>
            )}
          </div>

          <div className="text-xs font-bold text-[#843B13] self-end md:self-center">
            Showing <span className="font-extrabold text-[#713B18]">{filteredCourses.length}</span> STEM courses with live pricing
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'btn-primary-gradient text-[#713B18] shadow-sm font-extrabold'
                    : 'bg-[#FFF8E8] text-[#843B13] hover:bg-[#FFF0D2] border border-[#F7E4B6]'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {/* Course Grid Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-[#713B18] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#F28C28]" />
            <span>Explore Courses & Pricing</span>
          </h2>
          <p className="text-xs text-[#843B13] mt-0.5 font-semibold">
            Compare 1:1 live curriculum packages, class durations, and pricing options for all age groups.
          </p>
        </div>
      </div>

      {/* Courses Loading State */}
      {isLoading && (
        <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-[#F7E4B6]">
          <Loader2 className="w-8 h-8 animate-spin text-[#F28C28] mx-auto" />
          <p className="text-sm font-bold text-[#843B13]">Loading Codeyoung courses and package pricing...</p>
        </div>
      )}

      {/* Courses Error State */}
      {error && !isLoading && (
        <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-center text-rose-800 text-xs font-bold">
          {error}
        </div>
      )}

      {/* Courses Empty State */}
      {!isLoading && !error && filteredCourses.length === 0 && (
        <div className="py-16 text-center bg-white rounded-3xl border border-[#F7E4B6] space-y-3">
          <p className="text-sm font-bold text-[#843B13]">No courses found matching your criteria.</p>
          <button
            onClick={() => {
              setSelectedCategory('All Courses');
              setSearchQuery('');
            }}
            className="btn-primary-gradient px-4 py-2 text-xs font-extrabold text-[#713B18] rounded-xl cursor-pointer"
          >
            Reset Search Filters
          </button>
        </div>
      )}

      {/* Merged Courses & Pricing Grid */}
      {!isLoading && !error && filteredCourses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const outcomes = Array.isArray(course.learningOutcomes)
              ? course.learningOutcomes
              : typeof course.learningOutcomes === 'string'
              ? (course.learningOutcomes as string).split(',').map((s) => s.trim())
              : [];

            const packages = course.packages && course.packages.length > 0 ? course.packages : [];
            const activePkgId = selectedPackages[course.id] || packages[0]?.id;
            const currentPkg = packages.find((p) => p.id === activePkgId) || packages[0] || {
              id: `${course.id}-default`,
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

            return (
              <div
                key={course.id}
                className="bg-white rounded-3xl border border-[#F7E4B6] shadow-card-warm hover:shadow-card-hover hover:border-[#FFC52E] transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Card Top Banner */}
                  <div className="p-6 pb-4 border-b border-[#F7E4B6]/60 bg-gradient-to-b from-[#FFFDF9] to-white">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-[#FFF0D2] text-[#843B13] border border-[#F7E4B6]">
                        {course.category}
                      </span>
                      <span className="text-[11px] font-bold text-[#843B13] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#F28C28]" />
                        {course.classDuration}m/class
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="text-3xl p-2 rounded-2xl bg-[#FFF0D2] border border-[#F7E4B6] shrink-0">
                        {course.icon || '🚀'}
                      </span>
                      <div>
                        <h3 className="text-lg font-heading font-extrabold text-[#713B18] group-hover:text-[#F28C28] transition-colors leading-snug">
                          {course.title}
                        </h3>
                        <div className="text-[11px] font-bold text-[#843B13] mt-0.5 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#F28C28]" />
                          <span>{course.ageGroup}</span>
                          {course.classLevel && (
                            <>
                              <span>•</span>
                              <span>{course.classLevel}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 space-y-4">
                    <p className="text-xs text-[#843B13]/90 leading-relaxed font-medium line-clamp-2">
                      {course.description}
                    </p>

                    {/* Learning Outcomes Preview */}
                    {outcomes.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#713B18]">
                          Key Learning Outcomes:
                        </div>
                        <ul className="space-y-1">
                          {outcomes.slice(0, 2).map((outcome, idx) => (
                            <li key={idx} className="text-xs text-[#843B13] flex items-center gap-2 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate">{outcome}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Interactive Package Comparison Pills */}
                    {packages.length > 0 && (
                      <div className="pt-2 border-t border-[#F7E4B6]/60 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-[#713B18]">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3 h-3 text-[#F28C28]" /> Package Options:
                          </span>
                          <span className="text-[#843B13]">${pricePerClass}/class</span>
                        </div>

                        {/* Package Duration Switcher Pills */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {packages.map((pkg) => {
                            const isSelected = pkg.id === currentPkg.id;
                            return (
                              <button
                                key={pkg.id}
                                type="button"
                                onClick={() =>
                                  setSelectedPackages((prev) => ({
                                    ...prev,
                                    [course.id]: pkg.id,
                                  }))
                                }
                                className={`px-2 py-1.5 rounded-xl text-center text-[10px] font-extrabold border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#FFD45A] text-[#713B18] border-[#F28C28] shadow-xs'
                                    : 'bg-[#FFF8E8] text-[#843B13] border-[#F7E4B6] hover:bg-[#FFF0D2]'
                                }`}
                              >
                                <div>{pkg.duration?.replace(' package', '')}</div>
                                <div className="text-[9px] font-bold text-[#843B13]">${pkg.price}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: Live Pricing & Actions */}
                <div className="p-6 pt-4 border-t border-[#F7E4B6]/60 bg-[#FFFDF9] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#843B13]">
                        {currentPkg.duration} ({currentPkg.classesCount} Classes)
                      </span>
                      <div className="text-xl font-heading font-extrabold text-[#713B18]">
                        ${currentPkg.price}{' '}
                        <span className="text-xs font-normal text-[#843B13]">{currentPkg.currency}</span>
                      </div>
                    </div>

                    {onPurchasePackage && (
                      <button
                        onClick={() => onPurchasePackage(course, currentPkg)}
                        className="px-3 py-1.5 rounded-xl bg-[#FFF0D2] hover:bg-[#FFE6B3] text-[#713B18] text-xs font-extrabold border border-[#F7E4B6] transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <PackageIcon className="w-3.5 h-3.5 text-[#F28C28]" />
                        <span>Choose</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {/* View Details CTA */}
                    <button
                      onClick={() => onSelectCourse && onSelectCourse(course.id)}
                      className="px-3 py-2.5 rounded-xl border border-[#F7E4B6] bg-white hover:bg-[#FFF0D2] text-[#713B18] text-xs font-extrabold transition-all cursor-pointer text-center flex items-center justify-center gap-1"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Curriculum</span>
                    </button>

                    {/* Book Trial CTA */}
                    <button
                      onClick={() => onBookTrial && onBookTrial(course)}
                      className="btn-primary-gradient px-3 py-2.5 rounded-xl text-xs font-extrabold text-[#713B18] shadow-btn hover:shadow-btn-hover transition-all cursor-pointer text-center flex items-center justify-center gap-1"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Book Free Trial</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
