import { useState, useEffect } from 'react';
import {
  Search,
  ArrowUpDown,
  RefreshCw,
  X,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { api, BookingResponseData, CourseItem, MentorItem, AuthUser } from '../lib/api';

interface AdminBookingsViewProps {
  currentUser: AuthUser | null;
  onOpenLogin: () => void;
}

export function AdminBookingsView({ currentUser, onOpenLogin }: AdminBookingsViewProps) {
  const [bookings, setBookings] = useState<BookingResponseData[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [mentors, setMentors] = useState<MentorItem[]>([]);

  // Filter States
  const [search, setSearch] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('ALL');
  const [selectedMentor, setSelectedMentor] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [datePreset, setDatePreset] = useState<'ALL' | 'TODAY' | 'TOMORROW' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM'>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Sort State
  const [sortBy, setSortBy] = useState<'startAt' | 'createdAt' | 'parentName' | 'studentName' | 'course' | 'mentor' | 'status'>('startAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // UI State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingResponseData | null>(null);

  // 1. Fetch courses and mentors for dropdowns
  useEffect(() => {
    if (currentUser) {
      api.getCourses(undefined, true).then(setCourses).catch(() => {});
      api.getMentors().then(setMentors).catch(() => {});
    }
  }, [currentUser]);

  // 2. Fetch bookings whenever filters change
  const fetchBookings = () => {
    if (!currentUser) return;
    setIsLoading(true);
    setError(null);

    // Calculate dates based on preset
    let queryStartDate = startDate;
    let queryEndDate = endDate;

    const now = new Date();
    if (datePreset === 'TODAY') {
      const todayStr = now.toISOString().split('T')[0]!;
      queryStartDate = `${todayStr}T00:00:00.000Z`;
      queryEndDate = `${todayStr}T23:59:59.999Z`;
    } else if (datePreset === 'TOMORROW') {
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const tomorrowStr = tomorrow.toISOString().split('T')[0]!;
      queryStartDate = `${tomorrowStr}T00:00:00.000Z`;
      queryEndDate = `${tomorrowStr}T23:59:59.999Z`;
    } else if (datePreset === 'THIS_WEEK') {
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
      queryStartDate = startOfWeek.toISOString();
      queryEndDate = endOfWeek.toISOString();
    } else if (datePreset === 'THIS_MONTH') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      queryStartDate = startOfMonth.toISOString();
      queryEndDate = endOfMonth.toISOString();
    }

    api.getAdminBookings({
      search,
      courseId: selectedCourse !== 'ALL' ? selectedCourse : undefined,
      mentorId: selectedMentor !== 'ALL' ? selectedMentor : undefined,
      status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
      startDate: queryStartDate || undefined,
      endDate: queryEndDate || undefined,
      sortBy,
      sortOrder,
      limit: 50,
    })
      .then((data) => {
        setBookings(data.bookings);
        setTotalCount(data.total);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch admin trial bookings');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchBookings();
  }, [currentUser, search, selectedCourse, selectedMentor, selectedStatus, datePreset, startDate, endDate, sortBy, sortOrder]);

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedCourse('ALL');
    setSelectedMentor('ALL');
    setSelectedStatus('ALL');
    setDatePreset('ALL');
    setStartDate('');
    setEndDate('');
    setSortBy('startAt');
    setSortOrder('desc');
  };

  const hasActiveFilters =
    search !== '' ||
    selectedCourse !== 'ALL' ||
    selectedMentor !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    datePreset !== 'ALL';

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-[#F7E4B6] shadow-card-warm text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-[#FFF0D2] flex items-center justify-center mx-auto border border-[#F7E4B6] text-[#F28C28]">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-heading font-extrabold text-[#713B18]">
            Administrator Authentication Required
          </h2>
          <p className="text-xs sm:text-sm text-[#713B18]/80 max-w-md mx-auto mt-1 font-medium">
            Trial booking management, parent identity records, and mentor assignments are restricted to authorized administrators.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={onOpenLogin}
            className="btn-primary-gradient px-8 py-3.5 text-sm font-extrabold text-[#713B18] rounded-2xl inline-flex items-center gap-2 cursor-pointer shadow-btn"
          >
            <span>Sign In to Admin Portal</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Stats Bar */}
      <div className="bg-white rounded-3xl p-6 border border-[#F7E4B6] shadow-card-warm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FFF0D2] text-[#843B13] text-[11px] font-extrabold border border-[#F7E4B6]">
            <Sparkles className="w-3.5 h-3.5 text-[#F28C28]" />
            <span>Academic Operations Portal</span>
          </div>
          <h1 className="text-2xl font-heading font-extrabold text-[#713B18] mt-1">
            Trial Bookings Management
          </h1>
          <p className="text-xs text-[#713B18]/70 font-medium">
            Search, inspect, and filter student trial appointments across global time zones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#FFF8E8] px-4 py-2 rounded-2xl border border-[#F7E4B6] text-right">
            <span className="text-[10px] font-bold text-[#713B18]/50 block">Total Records</span>
            <span className="text-base font-extrabold text-[#713B18]">{totalCount} Bookings</span>
          </div>
          <button
            onClick={fetchBookings}
            title="Refresh Data"
            className="p-2.5 rounded-xl bg-[#FFF0D2] hover:bg-[#FFE6B3] text-[#843B13] border border-[#F7E4B6] cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#F7E4B6] shadow-card-warm space-y-4">
        {/* Search Bar */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#713B18]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Parent Name, Student (e.g. 'Aarav'), Email, Booking ID, Course, Mentor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FFF8E8]/70 border border-[#F7E4B6] text-xs font-bold text-[#713B18] placeholder:text-[#713B18]/40 focus:outline-none focus:ring-2 focus:ring-[#FFD45A]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-[#713B18]/50 hover:text-[#713B18]"
              >
                ✕
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-4 py-2.5 rounded-2xl bg-[#FFF0D2] hover:bg-[#FFE6B3] text-[#843B13] text-xs font-extrabold border border-[#F7E4B6] cursor-pointer transition-colors shrink-0"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Date Range Preset */}
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#843B13] block mb-1">
              Date Filter
            </label>
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as any)}
              className="w-full py-2 px-3 rounded-xl bg-[#FFF8E8]/70 border border-[#F7E4B6] text-xs font-bold text-[#713B18] focus:outline-none focus:ring-2 focus:ring-[#FFD45A]"
            >
              <option value="ALL">All Dates</option>
              <option value="TODAY">Today</option>
              <option value="TOMORROW">Tomorrow</option>
              <option value="THIS_WEEK">This Week</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="CUSTOM">Custom Date Range</option>
            </select>
          </div>

          {/* Course Filter */}
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#843B13] block mb-1">
              Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-[#FFF8E8]/70 border border-[#F7E4B6] text-xs font-bold text-[#713B18] focus:outline-none focus:ring-2 focus:ring-[#FFD45A]"
            >
              <option value="ALL">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Mentor Filter */}
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#843B13] block mb-1">
              Assigned Mentor
            </label>
            <select
              value={selectedMentor}
              onChange={(e) => setSelectedMentor(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-[#FFF8E8]/70 border border-[#F7E4B6] text-xs font-bold text-[#713B18] focus:outline-none focus:ring-2 focus:ring-[#FFD45A]"
            >
              <option value="ALL">All Mentors</option>
              {mentors.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.timeZone.split('/')[1] || m.timeZone})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#843B13] block mb-1">
              Booking Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-[#FFF8E8]/70 border border-[#F7E4B6] text-xs font-bold text-[#713B18] focus:outline-none focus:ring-2 focus:ring-[#FFD45A]"
            >
              <option value="ALL">All Statuses</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>

        {/* Custom Date Pickers (if CUSTOM selected) */}
        {datePreset === 'CUSTOM' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#F7E4B6]/60">
            <div>
              <label className="text-[10px] font-bold text-[#713B18] block mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full py-1.5 px-3 rounded-xl bg-[#FFF8E8] border border-[#F7E4B6] text-xs font-bold text-[#713B18]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#713B18] block mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full py-1.5 px-3 rounded-xl bg-[#FFF8E8] border border-[#F7E4B6] text-xs font-bold text-[#713B18]"
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl animate-in fade-in">
          {error}
        </div>
      )}

      {/* Bookings Table View */}
      <div className="bg-white rounded-3xl border border-[#F7E4B6] shadow-card-warm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FFF0D2] border-b border-[#F7E4B6] text-[#843B13] font-extrabold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 cursor-pointer hover:bg-[#FFE6B3]" onClick={() => handleSort('startAt')}>
                  <div className="flex items-center gap-1">
                    <span>Date & Time</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3.5 px-4 cursor-pointer hover:bg-[#FFE6B3]" onClick={() => handleSort('parentName')}>
                  <div className="flex items-center gap-1">
                    <span>Parent & Student</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3.5 px-4 cursor-pointer hover:bg-[#FFE6B3]" onClick={() => handleSort('course')}>
                  <div className="flex items-center gap-1">
                    <span>Course</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3.5 px-4 cursor-pointer hover:bg-[#FFE6B3]" onClick={() => handleSort('mentor')}>
                  <div className="flex items-center gap-1">
                    <span>Assigned Mentor</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3.5 px-4 cursor-pointer hover:bg-[#FFE6B3]" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#F7E4B6]/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#713B18]/60 font-medium">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#F28C28] mb-2" />
                    <span>Loading trial booking records...</span>
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#713B18]/60 font-medium">
                    <Search className="w-8 h-8 mx-auto text-[#713B18]/30 mb-2" />
                    <p className="font-bold">No trial bookings match your current search and filters.</p>
                    <button
                      onClick={resetFilters}
                      className="text-xs text-[#843B13] font-extrabold underline mt-1 cursor-pointer"
                    >
                      Clear all filters
                    </button>
                  </td>
                </tr>
              ) : (
                bookings.map((b) => {
                  const isSelected = selectedBooking?.id === b.id;
                  return (
                    <tr
                      key={b.id}
                      onClick={() => setSelectedBooking(b)}
                      className={`hover:bg-[#FFF8E8] transition-colors cursor-pointer ${
                        isSelected ? 'bg-[#FFF0D2]/50' : ''
                      }`}
                    >
                      {/* Date & Time */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-[#713B18]">
                          {b.parent.localStartTime.split(' ')[0]}
                        </div>
                        <div className="text-[11px] font-bold text-[#843B13]">
                          {b.parent.localStartTime.split(' ')[1]} {b.parent.localStartTime.split(' ')[2]}
                        </div>
                        <span className="text-[10px] text-[#713B18]/50 block">
                          {b.parent.timeZone}
                        </span>
                      </td>

                      {/* Parent & Student */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-[#713B18]">{b.parent.name}</div>
                        {b.studentName && (
                          <div className="text-[11px] font-bold text-[#843B13]">
                            Student: {b.studentName}
                          </div>
                        )}
                        <div className="text-[11px] text-[#713B18]/60">{b.parent.email}</div>
                      </td>

                      {/* Course */}
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-[#713B18] block max-w-[200px] truncate">
                          {b.course}
                        </span>
                        <span className="text-[10px] font-bold text-[#843B13] bg-[#FFF0D2] px-2 py-0.5 rounded-md inline-block mt-0.5">
                          1:1 Trial
                        </span>
                      </td>

                      {/* Mentor */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-[#713B18]">{b.mentor.name}</div>
                        <div className="text-[11px] text-[#713B18]/60">
                          {b.mentor.localStartTime.split(' ')[1]} {b.mentor.localStartTime.split(' ')[2]} ({b.mentor.timeZone.split('/')[1] || b.mentor.timeZone})
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full ${
                            b.status === 'CONFIRMED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{b.status}</span>
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBooking(b);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#FFF0D2] hover:bg-[#FFE6B3] text-[#843B13] text-xs font-extrabold border border-[#F7E4B6] transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>Details</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side Detail Modal / Drawer */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-[#F7E4B6] shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setSelectedBooking(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#FFF0D2] flex items-center justify-center text-[#713B18] hover:bg-[#FFD45A] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF0D2] text-[#843B13] text-xs font-extrabold border border-[#F7E4B6]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Confirmed Trial Appointment</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-[#713B18] mt-1.5">
                {selectedBooking.course}
              </h2>
              <p className="text-xs text-[#713B18]/60 font-mono">
                Booking ID: {selectedBooking.id}
              </p>
            </div>

            {/* Key Info Grid */}
            <div className="space-y-4">
              {/* Parent & Student Section */}
              <div className="bg-[#FFF8E8] rounded-2xl p-4 border border-[#F7E4B6] space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#843B13]">
                  Student & Parent Identity
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-[#713B18]/50 block">Parent Name</span>
                    <span className="font-extrabold text-[#713B18]">{selectedBooking.parent.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#713B18]/50 block">Student Name</span>
                    <span className="font-extrabold text-[#713B18]">
                      {selectedBooking.studentName || 'Not specified'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#713B18]/50 block">Parent Email</span>
                    <span className="font-bold text-[#713B18]">{selectedBooking.parent.email}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#713B18]/50 block">Parent Phone</span>
                    <span className="font-bold text-[#713B18]">{selectedBooking.parent.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Timezone Schedule Section */}
              <div className="bg-[#FFF8E8] rounded-2xl p-4 border border-[#F7E4B6] space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#843B13]">
                  Dual Timezone Schedule
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-[#F7E4B6]">
                    <span className="text-[10px] font-extrabold text-[#843B13] block">Parent Local Time</span>
                    <span className="font-extrabold text-[#713B18] block">{selectedBooking.parent.localStartTime}</span>
                    <span className="text-[10px] text-[#713B18]/60">{selectedBooking.parent.timeZone}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-[#F7E4B6]">
                    <span className="text-[10px] font-extrabold text-[#843B13] block">Mentor Local Time</span>
                    <span className="font-extrabold text-[#713B18] block">{selectedBooking.mentor.localStartTime}</span>
                    <span className="text-[10px] text-[#713B18]/60">{selectedBooking.mentor.timeZone}</span>
                  </div>
                </div>
              </div>

              {/* Assigned Mentor & Meeting URL */}
              <div className="bg-[#FFF8E8] rounded-2xl p-4 border border-[#F7E4B6] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#713B18]/50 block">Assigned Mentor</span>
                    <span className="text-sm font-extrabold text-[#713B18]">{selectedBooking.mentor.name}</span>
                    <span className="text-xs text-[#713B18]/70">{selectedBooking.mentor.email}</span>
                  </div>
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                    2 Classes/Day Limit Active
                  </span>
                </div>

                <div className="pt-2 border-t border-[#F7E4B6]/60">
                  <span className="text-[10px] font-bold text-[#713B18]/50 block mb-1">Meeting Room URL</span>
                  <a
                    href={selectedBooking.demoClassUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-[#843B13] hover:underline break-all flex items-center gap-1"
                  >
                    <span>{selectedBooking.demoClassUrl}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedBooking(null)}
                className="btn-primary-gradient px-6 py-2.5 text-xs font-extrabold text-[#713B18] rounded-xl cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
