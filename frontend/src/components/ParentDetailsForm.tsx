import React, { useState } from 'react';
import { User, Mail, Phone, Globe, ArrowRight, ShieldCheck } from 'lucide-react';
import { POPULAR_TIMEZONES } from '../lib/timezones';

export interface ParentFormData {
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  course: string;
  parentTimeZone: string;
}

interface ParentDetailsFormProps {
  initialData: ParentFormData;
  onSubmit: (data: ParentFormData) => void;
}

const COURSES = [
  { id: 'coding-game', title: 'Coding & Game Design (Scratch / Roblox)', age: 'Ages 6-10', icon: '🎮' },
  { id: 'python-ai', title: 'Python Programming & AI Basics', age: 'Ages 10-15', icon: '🐍' },
  { id: 'web-dev', title: 'Web Development (HTML/CSS/JS)', age: 'Ages 12-17', icon: '💻' },
  { id: 'math-olympiad', title: 'Math & STEM Olympiad Problem Solving', age: 'Ages 7-14', icon: '📐' },
];

export function ParentDetailsForm({ initialData, onSubmit }: ParentDetailsFormProps) {
  const [formData, setFormData] = useState<ParentFormData>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof ParentFormData, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ParentFormData, string>> = {};

    if (!formData.parentName.trim() || formData.parentName.trim().length < 2) {
      newErrors.parentName = 'Please enter parent full name (at least 2 characters)';
    }

    if (!formData.parentEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parentEmail.trim())) {
      newErrors.parentEmail = 'Please enter a valid email address';
    }

    if (!formData.parentPhone.trim() || formData.parentPhone.trim().length < 7) {
      newErrors.parentPhone = 'Please enter a valid phone number (with country code)';
    }

    if (!formData.course) {
      newErrors.course = 'Please select a course of interest';
    }

    if (!formData.parentTimeZone) {
      newErrors.parentTimeZone = 'Please select your preferred time zone';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
      {/* Card Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8 text-white">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-xs mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          Step 1 of 2: Parent & Student Details
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Book Your Free 1:1 Trial Class
        </h2>
        <p className="text-blue-100 text-sm mt-1.5">
          Connect with top STEM mentors for a personalized 30-minute interactive live class.
        </p>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} noValidate className="p-6 sm:p-8 space-y-6">
        {/* Parent Name */}
        <div>
          <label htmlFor="parentName" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Parent Full Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              id="parentName"
              type="text"
              value={formData.parentName}
              onChange={(e) => {
                setFormData({ ...formData, parentName: e.target.value });
                if (errors.parentName) setErrors({ ...errors, parentName: undefined });
              }}
              placeholder="e.g. John Doe"
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                errors.parentName ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
              } text-sm focus:outline-hidden focus:ring-4 transition-all`}
            />
          </div>
          {errors.parentName && (
            <p className="text-xs text-red-600 font-medium mt-1.5">{errors.parentName}</p>
          )}
        </div>

        {/* Email & Phone grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="parentEmail" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="parentEmail"
                type="email"
                value={formData.parentEmail}
                onChange={(e) => {
                  setFormData({ ...formData, parentEmail: e.target.value });
                  if (errors.parentEmail) setErrors({ ...errors, parentEmail: undefined });
                }}
                placeholder="e.g. parent@example.com"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                  errors.parentEmail ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                } text-sm focus:outline-hidden focus:ring-4 transition-all`}
              />
            </div>
            {errors.parentEmail && (
              <p className="text-xs text-red-600 font-medium mt-1.5">{errors.parentEmail}</p>
            )}
          </div>

          <div>
            <label htmlFor="parentPhone" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                id="parentPhone"
                type="tel"
                value={formData.parentPhone}
                onChange={(e) => {
                  setFormData({ ...formData, parentPhone: e.target.value });
                  if (errors.parentPhone) setErrors({ ...errors, parentPhone: undefined });
                }}
                placeholder="+1 (555) 019-2834"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                  errors.parentPhone ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                } text-sm focus:outline-hidden focus:ring-4 transition-all`}
              />
            </div>
            {errors.parentPhone && (
              <p className="text-xs text-red-600 font-medium mt-1.5">{errors.parentPhone}</p>
            )}
          </div>
        </div>

        {/* Course Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Select Course of Interest <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {COURSES.map((c) => {
              const isSelected = formData.course === c.title;
              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => {
                    setFormData({ ...formData, course: c.title });
                    if (errors.course) setErrors({ ...errors, course: undefined });
                  }}
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <span className="text-2xl select-none">{c.icon}</span>
                  <div>
                    <div className="font-bold text-xs text-slate-900 leading-snug">{c.title}</div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">{c.age}</div>
                  </div>
                </button>
              );
            })}
          </div>
          {errors.course && (
            <p className="text-xs text-red-600 font-medium mt-1.5">{errors.course}</p>
          )}
        </div>

        {/* Timezone Preference */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="parentTimeZone" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Your Time Zone <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] text-blue-600 font-medium">Auto-detected (override below)</span>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Globe className="w-4 h-4" />
            </div>
            <select
              id="parentTimeZone"
              value={formData.parentTimeZone}
              onChange={(e) => {
                setFormData({ ...formData, parentTimeZone: e.target.value });
                if (errors.parentTimeZone) setErrors({ ...errors, parentTimeZone: undefined });
              }}
              className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all cursor-pointer"
            >
              {POPULAR_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
          {errors.parentTimeZone && (
            <p className="text-xs text-red-600 font-medium mt-1.5">{errors.parentTimeZone}</p>
          )}
        </div>

        {/* Primary CTA */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer hover:shadow-lg active:scale-[0.99]"
          >
            <span>Verify and Select Time</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
