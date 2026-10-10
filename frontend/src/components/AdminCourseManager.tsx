import { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Layers,
  Save,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { CourseItem, PackageItem, api, AuthUser } from '../lib/api';

const CATEGORIES = [
  'Coding & Programming',
  'Web Development',
  'AI & Robotics',
  'Mathematics & Science',
  'English & Communication',
];

const DEFAULT_PACKAGE_DURATIONS = ['1 month', '2 months', '3 months', '6 months'];

interface AdminCourseManagerProps {
  currentUser?: AuthUser | null;
  onOpenLogin: () => void;
}

export function AdminCourseManager({ currentUser, onOpenLogin }: AdminCourseManagerProps) {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Edit/Create Course Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [editingCourse, setEditingCourse] = useState<Partial<CourseItem> | null>(null);
  const [coursePackages, setCoursePackages] = useState<PackageItem[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const isAdmin = currentUser?.role === 'ADMIN';

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all courses including inactive ones
      const data = await api.getCourses(undefined, true);
      setCourses(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleToggleActive = async (course: CourseItem) => {
    try {
      const updated = await api.updateCourse(course.id, { isActive: !course.isActive });
      setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setSuccessMsg(`Course "${course.title}" status updated.`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err?.message || 'Failed to update course status.');
    }
  };

  const handleOpenCreate = () => {
    setEditingCourse({
      title: '',
      category: CATEGORIES[0],
      description: '',
      learningOutcomes: [''],
      ageGroup: 'Ages 8-14',
      classLevel: 'Beginner to Intermediate',
      totalClasses: 24,
      classDuration: 60,
      currency: 'USD',
      basePrice: 599,
      isActive: true,
      icon: '🚀',
    });
    setCoursePackages(
      DEFAULT_PACKAGE_DURATIONS.map((dur, idx) => ({
        id: `pkg-${idx + 1}`,
        courseId: '',
        duration: dur,
        classesCount: (idx + 1) * 8,
        price: (idx + 1) * 199,
        currency: 'USD',
        isPopular: dur === '3 months',
        isActive: true,
      }))
    );
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (course: CourseItem) => {
    setEditingCourse({
      ...course,
      learningOutcomes: course.learningOutcomes && course.learningOutcomes.length > 0 ? course.learningOutcomes : [''],
    });
    setCoursePackages(
      course.packages && course.packages.length > 0
        ? course.packages
        : DEFAULT_PACKAGE_DURATIONS.map((dur, idx) => ({
            id: `pkg-${idx + 1}`,
            courseId: course.id,
            duration: dur,
            classesCount: (idx + 1) * 8,
            price: (idx + 1) * 199,
            currency: course.currency || 'USD',
            isPopular: dur === '3 months',
            isActive: true,
          }))
    );
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!editingCourse?.title?.trim()) errs.title = 'Course title is required.';
    if (!editingCourse?.category?.trim()) errs.category = 'Category is required.';
    if (!editingCourse?.description?.trim()) errs.description = 'Description is required.';
    if (!editingCourse?.ageGroup?.trim()) errs.ageGroup = 'Age group is required.';
    if (editingCourse?.totalClasses !== undefined && editingCourse.totalClasses <= 0) {
      errs.totalClasses = 'Total classes must be a positive number.';
    }
    if (editingCourse?.classDuration !== undefined && editingCourse.classDuration <= 0) {
      errs.classDuration = 'Class duration must be positive.';
    }
    if (editingCourse?.basePrice !== undefined && editingCourse.basePrice < 0) {
      errs.basePrice = 'Price cannot be negative.';
    }

    // Validate packages
    coursePackages.forEach((pkg, idx) => {
      if (pkg.classesCount <= 0) errs[`pkg_classes_${idx}`] = 'Classes must be > 0';
      if (pkg.price < 0) errs[`pkg_price_${idx}`] = 'Price must be >= 0';
    });

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !editingCourse) return;

    setIsSaving(true);
    setError(null);

    try {
      const outcomes = (editingCourse.learningOutcomes || []).filter((o) => o.trim().length > 0);
      let savedCourse: CourseItem;

      if (editingCourse.id) {
        // Update existing course
        savedCourse = await api.updateCourse(editingCourse.id, {
          title: editingCourse.title,
          category: editingCourse.category,
          description: editingCourse.description,
          learningOutcomes: outcomes,
          ageGroup: editingCourse.ageGroup,
          classLevel: editingCourse.classLevel,
          totalClasses: Number(editingCourse.totalClasses),
          classDuration: Number(editingCourse.classDuration),
          currency: editingCourse.currency,
          basePrice: Number(editingCourse.basePrice),
          isActive: editingCourse.isActive,
          icon: editingCourse.icon,
        });

        // Save packages
        for (const pkg of coursePackages) {
          await api.upsertPackage({
            ...pkg,
            courseId: savedCourse.id,
            classesCount: Number(pkg.classesCount),
            price: Number(pkg.price),
          });
        }
      } else {
        // Create new course
        savedCourse = await api.createCourse({
          title: editingCourse.title!,
          category: editingCourse.category!,
          description: editingCourse.description!,
          learningOutcomes: outcomes,
          ageGroup: editingCourse.ageGroup || 'Ages 8-14',
          classLevel: editingCourse.classLevel || 'Beginner',
          totalClasses: Number(editingCourse.totalClasses || 24),
          classDuration: Number(editingCourse.classDuration || 60),
          currency: editingCourse.currency || 'USD',
          basePrice: Number(editingCourse.basePrice || 499),
          isActive: editingCourse.isActive ?? true,
          icon: editingCourse.icon || '📚',
        });

        // Save packages
        for (const pkg of coursePackages) {
          await api.upsertPackage({
            ...pkg,
            courseId: savedCourse.id,
            classesCount: Number(pkg.classesCount),
            price: Number(pkg.price),
          });
        }
      }

      setIsModalOpen(false);
      setSuccessMsg(`Course "${savedCourse.title}" successfully saved!`);
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchCourses();
    } catch (err: any) {
      setError(err?.message || 'Failed to save course.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCourse = async (course: CourseItem) => {
    if (!window.confirm(`Are you sure you want to delete "${course.title}"? Existing bookings will retain course history.`)) {
      return;
    }
    try {
      await api.deleteCourse(course.id);
      setCourses((prev) => prev.filter((c) => c.id !== course.id));
      setSuccessMsg(`Course "${course.title}" deleted.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to delete course.');
    }
  };

  if (!currentUser || !isAdmin) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-[#F7E4B6] p-10 text-center space-y-4 shadow-card-warm">
        <div className="w-16 h-16 rounded-full bg-[#FFF0D2] border border-[#F7E4B6] flex items-center justify-center mx-auto text-[#F28C28]">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-heading font-extrabold text-[#713B18]">Admin Access Required</h2>
        <p className="text-sm text-[#843B13] max-w-md mx-auto">
          You must be signed in with an Administrator account to configure courses, packages, and pricing.
        </p>
        <div>
          <button
            onClick={onOpenLogin}
            className="btn-primary-gradient px-6 py-3 text-sm font-extrabold text-[#713B18] rounded-xl cursor-pointer"
          >
            Sign in as Administrator
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#F7E4B6] shadow-xs">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-[#713B18] flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#F28C28]" />
            Course & Package Management
          </h1>
          <p className="text-xs text-[#843B13] mt-1 font-semibold">
            Create, configure, and manage curriculum offerings, class counts, and package pricing.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="btn-primary-gradient px-4 py-2.5 rounded-2xl text-xs font-extrabold text-[#713B18] flex items-center gap-2 cursor-pointer shadow-btn hover:shadow-btn-hover"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Course</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Courses List */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-[#F7E4B6] p-12 text-center text-sm font-bold text-[#843B13]">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#F28C28]" />
          Loading course catalogue...
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#F7E4B6] p-12 text-center">
          <p className="text-sm font-bold text-[#843B13]">No courses configured yet.</p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 btn-primary-gradient px-4 py-2 rounded-xl text-xs font-extrabold text-[#713B18]"
          >
            Create First Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((course) => (
            <div
              key={course.id}
              className={`bg-white rounded-3xl border p-5 transition-all flex flex-col justify-between ${
                course.isActive
                  ? 'border-[#F7E4B6] shadow-xs hover:border-[#FFC52E]'
                  : 'border-slate-200 opacity-60 bg-slate-50'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-2 rounded-xl bg-[#FFF0D2] border border-[#F7E4B6]">
                      {course.icon || '📘'}
                    </span>
                    <div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#FFF0D2] text-[#843B13] border border-[#F7E4B6]">
                        {course.category}
                      </span>
                      <h3 className="text-base font-extrabold text-[#713B18] mt-1 leading-tight">
                        {course.title}
                      </h3>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleActive(course)}
                    title={course.isActive ? 'Deactivate Course' : 'Activate Course'}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold cursor-pointer transition-colors border ${
                      course.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {course.isActive ? 'Active' : 'Disabled'}
                  </button>
                </div>

                <p className="text-xs text-[#843B13]/80 line-clamp-2 mt-2 leading-relaxed">
                  {course.description}
                </p>

                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold text-[#843B13]">
                  <span className="px-2 py-0.5 rounded-lg bg-[#FFF8E8] border border-[#F7E4B6]">
                    🎯 {course.ageGroup}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-[#FFF8E8] border border-[#F7E4B6]">
                    ⏱️ {course.classDuration} mins/class
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-[#FFF8E8] border border-[#F7E4B6]">
                    📦 {course.packages?.length || 0} packages
                  </span>
                </div>
              </div>

              {/* Package Summary Preview & Actions */}
              <div className="mt-4 pt-4 border-t border-[#F7E4B6]/60 flex items-center justify-between">
                <div className="text-xs font-extrabold text-[#713B18]">
                  From <span className="text-sm font-black text-[#843B13]">${course.basePrice || course.packages?.[0]?.price || 0}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(course)}
                    className="p-2 rounded-xl bg-[#FFF0D2] hover:bg-[#FFE6B3] text-[#713B18] transition-colors cursor-pointer border border-[#F7E4B6]"
                    title="Edit Course & Packages"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer border border-rose-200"
                    title="Delete Course"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Create Course Modal */}
      {isModalOpen && editingCourse && (
        <div className="fixed inset-0 z-50 bg-[#713B18]/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl border border-[#F7E4B6] shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#FFD45A] to-[#FFB82E] px-6 py-4 flex items-center justify-between border-b border-[#F7E4B6]">
              <div className="flex items-center gap-2 font-heading font-extrabold text-[#713B18] text-lg">
                <BookOpen className="w-5 h-5" />
                <span>{editingCourse.id ? 'Edit Course & Packages' : 'Create New Course'}</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-[#713B18] hover:bg-white/40 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCourse} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Basic Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase text-[#713B18] mb-1">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    value={editingCourse.title || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                    placeholder="e.g. Python Programming & AI"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#F7E4B6] text-sm text-[#713B18] font-bold bg-[#FFF8E8]/30 focus:border-[#F28C28] outline-hidden"
                  />
                  {formErrors.title && <p className="text-xs text-rose-600 font-bold mt-1">{formErrors.title}</p>}
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase text-[#713B18] mb-1">
                    Category *
                  </label>
                  <select
                    value={editingCourse.category || CATEGORIES[0]}
                    onChange={(e) => setEditingCourse({ ...editingCourse, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#F7E4B6] text-sm text-[#713B18] font-bold bg-[#FFF8E8]/30 focus:border-[#F28C28] outline-hidden cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-[#713B18] mb-1">
                  Description *
                </label>
                <textarea
                  rows={2}
                  value={editingCourse.description || ''}
                  onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                  placeholder="Summary of course curriculum and learning experience..."
                  className="w-full px-3 py-2 rounded-xl border border-[#F7E4B6] text-xs text-[#713B18] font-medium bg-[#FFF8E8]/30 focus:border-[#F28C28] outline-hidden"
                />
                {formErrors.description && <p className="text-xs text-rose-600 font-bold mt-1">{formErrors.description}</p>}
              </div>

              {/* Age, Class Level, Duration, Icon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-[#713B18] mb-1">Age Group</label>
                  <input
                    type="text"
                    value={editingCourse.ageGroup || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, ageGroup: e.target.value })}
                    placeholder="Ages 8-14"
                    className="w-full px-3 py-2 rounded-xl border border-[#F7E4B6] text-xs font-bold text-[#713B18]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-[#713B18] mb-1">Class Level</label>
                  <input
                    type="text"
                    value={editingCourse.classLevel || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, classLevel: e.target.value })}
                    placeholder="Beginner"
                    className="w-full px-3 py-2 rounded-xl border border-[#F7E4B6] text-xs font-bold text-[#713B18]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-[#713B18] mb-1">Mins / Class</label>
                  <input
                    type="number"
                    value={editingCourse.classDuration || 60}
                    onChange={(e) => setEditingCourse({ ...editingCourse, classDuration: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[#F7E4B6] text-xs font-bold text-[#713B18]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-[#713B18] mb-1">Icon Emoji</label>
                  <input
                    type="text"
                    value={editingCourse.icon || '🚀'}
                    onChange={(e) => setEditingCourse({ ...editingCourse, icon: e.target.value })}
                    placeholder="🚀"
                    className="w-full px-3 py-2 rounded-xl border border-[#F7E4B6] text-xs font-bold text-center"
                  />
                </div>
              </div>

              {/* Learning Outcomes */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-extrabold uppercase text-[#713B18]">Learning Outcomes</label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingCourse({
                        ...editingCourse,
                        learningOutcomes: [...(editingCourse.learningOutcomes || []), ''],
                      })
                    }
                    className="text-[11px] font-bold text-[#F28C28] hover:underline cursor-pointer"
                  >
                    + Add Outcome
                  </button>
                </div>
                <div className="space-y-2">
                  {(editingCourse.learningOutcomes || ['']).map((outcome, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={outcome}
                        onChange={(e) => {
                          const updated = [...(editingCourse.learningOutcomes || [])];
                          updated[idx] = e.target.value;
                          setEditingCourse({ ...editingCourse, learningOutcomes: updated });
                        }}
                        placeholder={`Outcome ${idx + 1}...`}
                        className="flex-1 px-3 py-2 rounded-xl border border-[#F7E4B6] text-xs font-medium text-[#713B18]"
                      />
                      {(editingCourse.learningOutcomes || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (editingCourse.learningOutcomes || []).filter((_, i) => i !== idx);
                            setEditingCourse({ ...editingCourse, learningOutcomes: updated });
                          }}
                          className="p-1 text-rose-500 hover:text-rose-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Configurable Packages (1M, 2M, 3M, 6M) */}
              <div className="border-t border-[#F7E4B6] pt-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#713B18] mb-3 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#F28C28]" />
                  Configurable Packages & Pricing
                </h4>

                <div className="overflow-x-auto border border-[#F7E4B6] rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FFF0D2] text-[#713B18] font-extrabold uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Duration</th>
                        <th className="p-3">Classes</th>
                        <th className="p-3">Total Price ($)</th>
                        <th className="p-3">Price / Class</th>
                        <th className="p-3">Popular</th>
                        <th className="p-3">Active</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F7E4B6]/60 font-semibold text-[#713B18]">
                      {coursePackages.map((pkg, idx) => {
                        const pricePerClass = pkg.classesCount > 0 ? (pkg.price / pkg.classesCount).toFixed(2) : '0';
                        return (
                          <tr key={pkg.id || idx} className="hover:bg-[#FFF8E8]/50">
                            <td className="p-3 font-extrabold">{pkg.duration}</td>
                            <td className="p-3">
                              <input
                                type="number"
                                min={1}
                                value={pkg.classesCount}
                                onChange={(e) => {
                                  const updated = [...coursePackages];
                                  updated[idx].classesCount = Number(e.target.value);
                                  setCoursePackages(updated);
                                }}
                                className="w-20 px-2 py-1 rounded-lg border border-[#F7E4B6] text-xs font-bold text-center"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                min={0}
                                value={pkg.price}
                                onChange={(e) => {
                                  const updated = [...coursePackages];
                                  updated[idx].price = Number(e.target.value);
                                  setCoursePackages(updated);
                                }}
                                className="w-24 px-2 py-1 rounded-lg border border-[#F7E4B6] text-xs font-bold text-center"
                              />
                            </td>
                            <td className="p-3 text-[11px] font-bold text-[#843B13]">
                              ${pricePerClass}
                            </td>
                            <td className="p-3">
                              <input
                                type="checkbox"
                                checked={pkg.isPopular}
                                onChange={(e) => {
                                  const updated = coursePackages.map((p, i) => ({
                                    ...p,
                                    isPopular: i === idx ? e.target.checked : false,
                                  }));
                                  setCoursePackages(updated);
                                }}
                                className="w-4 h-4 accent-[#F28C28]"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="checkbox"
                                checked={pkg.isActive}
                                onChange={(e) => {
                                  const updated = [...coursePackages];
                                  updated[idx].isActive = e.target.checked;
                                  setCoursePackages(updated);
                                }}
                                className="w-4 h-4 accent-[#F28C28]"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status and Submit Buttons */}
              <div className="pt-4 border-t border-[#F7E4B6] flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingCourse.isActive}
                    onChange={(e) => setEditingCourse({ ...editingCourse, isActive: e.target.checked })}
                    className="w-4 h-4 accent-[#F28C28]"
                  />
                  <span className="text-xs font-bold text-[#713B18]">Course is active and open for bookings</span>
                </label>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#F7E4B6] text-xs font-bold text-[#713B18] hover:bg-[#FFF0D2] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn-primary-gradient px-5 py-2 rounded-xl text-xs font-extrabold text-[#713B18] flex items-center gap-1.5 cursor-pointer shadow-btn hover:shadow-btn-hover disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Save Course</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
