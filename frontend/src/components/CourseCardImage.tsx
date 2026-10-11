import { useState } from 'react';
import { Sparkles, BookOpen } from 'lucide-react';
import { CourseItem } from '../lib/api';

interface CourseCardImageProps {
  course: Partial<CourseItem> & { title: string; category?: string; ageGroup?: string };
  variant?: 'card' | 'hero' | 'compact';
  className?: string;
}

export function CourseCardImage({ course, variant = 'card', className = '' }: CourseCardImageProps) {
  const [imageFailed, setImageFailed] = useState<boolean>(false);

  const hasValidImageUrl = Boolean(course.imageUrl && course.imageUrl.trim().length > 0 && !imageFailed);

  // Clean Text-Only Fallback Presentation (Zero generic emojis)
  const renderTextOnlyFallback = () => {
    if (variant === 'compact') {
      return (
        <div
          data-testid="course-cover-fallback"
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFD45A]/30 to-[#F28C28]/20 border border-[#F7E4B6] flex items-center justify-center shrink-0"
        >
          <BookOpen className="w-5 h-5 text-[#843B13]" />
        </div>
      );
    }

    return (
      <div
        data-testid="course-cover-fallback"
        className={`w-full bg-gradient-to-br from-[#FFF0D2] via-[#FFF8E8] to-[#F7E4B6]/50 border-b border-[#F7E4B6] flex flex-col justify-between p-5 select-none relative overflow-hidden ${
          variant === 'hero' ? 'h-52 sm:h-64' : 'h-40'
        }`}
      >
        {/* Subtle Decorative Background Geometry */}
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-[#FFD45A]/20 pointer-events-none blur-xl" />
        <div className="absolute -left-6 -bottom-6 w-28 h-28 rounded-full bg-[#F28C28]/15 pointer-events-none blur-xl" />

        <div className="flex items-center justify-between z-10">
          <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/80 text-[#843B13] border border-[#F7E4B6] shadow-2xs">
            {course.category || 'STEM Curriculum'}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#843B13] px-2 py-0.5 rounded-md bg-[#FFD45A]/30">
            <Sparkles className="w-3 h-3 text-[#F28C28]" />
            1:1 Live
          </span>
        </div>

        <div className="z-10 mt-auto">
          <h4 className="text-base sm:text-lg font-heading font-extrabold text-[#713B18] line-clamp-1 leading-snug">
            {course.title}
          </h4>
          {course.ageGroup && (
            <p className="text-xs font-bold text-[#843B13] mt-0.5">
              {course.ageGroup}
            </p>
          )}
        </div>
      </div>
    );
  };

  if (variant === 'compact') {
    if (hasValidImageUrl) {
      return (
        <div className={`w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-[#F7E4B6] bg-[#FFF0D2] ${className}`}>
          <img
            data-testid="course-cover-image"
            src={course.imageUrl || undefined}
            alt={`${course.title} course cover image`}
            onError={() => setImageFailed(true)}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      );
    }
    return renderTextOnlyFallback();
  }

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      {hasValidImageUrl ? (
        <div className={`w-full bg-[#FFF0D2] relative overflow-hidden ${variant === 'hero' ? 'h-56 sm:h-72 rounded-3xl border border-[#F7E4B6]' : 'h-44'}`}>
          <img
            data-testid="course-cover-image"
            src={course.imageUrl || undefined}
            alt={`${course.title} course cover image`}
            onError={() => setImageFailed(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 text-white z-10 flex items-center justify-between">
            <span className="text-xs font-bold bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
              {course.category}
            </span>
            <span className="text-[11px] font-semibold bg-[#F28C28]/90 text-white px-2 py-0.5 rounded-md">
              {course.ageGroup}
            </span>
          </div>
        </div>
      ) : (
        renderTextOnlyFallback()
      )}
    </div>
  );
}
