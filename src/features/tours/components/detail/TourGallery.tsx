import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  ImageOff,
  Mountain,
  Play,
} from 'lucide-react';
import type { TourMediaResponse } from '../../types/tour.types';
import { isFileNameOrPath } from '../../../../lib/utils';

interface TourGalleryProps {
  media: TourMediaResponse[];
  tourTitle: string;
}

export const TourGallery: React.FC<TourGalleryProps> = ({ media, tourTitle }) => {
  // Sort media: cover first, then by displayOrder
  const sortedMedia = useMemo(() => {
    return [...media].sort((a, b) => {
      if (a.isCover && !b.isCover) return -1;
      if (!a.isCover && b.isCover) return 1;
      return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
    });
  }, [media]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const currentMedia = sortedMedia[activeIndex] || null;

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : sortedMedia.length - 1));
  }, [sortedMedia.length]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev < sortedMedia.length - 1 ? prev + 1 : 0));
  }, [sortedMedia.length]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, handlePrev, handleNext]);

  if (!sortedMedia || sortedMedia.length === 0) {
    return (
      <div className="rounded-3xl border border-[#E6E1D8] bg-gradient-to-br from-[#FAF8F5] to-[#F1ECE1] p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-white border border-[#E6E1D8] flex items-center justify-center text-[#1F4E43] shadow-2xs">
          <Mountain className="w-7 h-7" />
        </div>
        <h3 className="font-editorial text-lg font-bold text-[#1C2526]">
          Thư viện hình ảnh hành trình
        </h3>
        <p className="text-xs sm:text-sm text-[#78716C] max-w-md flex items-center justify-center gap-1.5">
          <ImageOff className="w-4 h-4 shrink-0 text-[#A8A29E]" />
          <span>Ban điều hành tour đang cập nhật hình ảnh và video thực địa cho tuyến này.</span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Feature Media Viewport */}
      <div className="relative group h-72 sm:h-96 md:h-[460px] rounded-3xl overflow-hidden bg-stone-900 border border-[#E6E1D8] shadow-sm">
        {currentMedia?.mediaType === 'VIDEO' ? (
          <video
            src={currentMedia.url}
            controls
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={currentMedia?.url}
            alt={!isFileNameOrPath(currentMedia?.caption) ? currentMedia.caption! : tourTitle}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
          />
        )}

        {/* Gradient Overlay for Caption (Hidden if raw file name or path) */}
        {currentMedia?.caption && !isFileNameOrPath(currentMedia.caption) && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 sm:p-6 text-white pointer-events-none">
            <p className="text-xs sm:text-sm font-medium drop-shadow-sm max-w-2xl line-clamp-2">
              {currentMedia.caption}
            </p>
          </div>
        )}

        {/* Counter Badge */}
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-xs text-white text-xs font-mono font-medium px-3 py-1 rounded-full border border-white/20">
          {activeIndex + 1} / {sortedMedia.length}
        </div>

        {/* Fullscreen Trigger */}
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          className="absolute top-4 right-4 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs border border-white/20 transition-all cursor-pointer opacity-90 group-hover:opacity-100 hover:scale-105"
          title="Xem ảnh phóng to"
          aria-label="Xem ảnh phóng to"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Prev / Next Buttons on Main Viewport */}
        {sortedMedia.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-xs transition-all cursor-pointer opacity-80 hover:opacity-100 hover:scale-110"
              aria-label="Ảnh trước"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-xs transition-all cursor-pointer opacity-80 hover:opacity-100 hover:scale-110"
              aria-label="Ảnh kế tiếp"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Strip */}
      {sortedMedia.length > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar">
          {sortedMedia.map((m, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <button
                key={m.id || idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`relative w-20 h-14 sm:w-24 sm:h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#C2410C] ring-2 ring-[#C2410C]/30 scale-102'
                    : 'border-transparent opacity-65 hover:opacity-100'
                }`}
                aria-label={`Xem ảnh số ${idx + 1}`}
              >
                <img
                  src={m.url}
                  alt={!isFileNameOrPath(m.caption) ? m.caption! : `Ảnh ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                {m.mediaType === 'VIDEO' && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white">
                    <Play className="w-4 h-4 fill-white" />
                  </div>
                )}
                {m.isCover && (
                  <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-[#C2410C] text-[9px] font-bold text-white rounded">
                    Bìa
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && currentMedia && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Phóng to ảnh hành trình"
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-semibold">
                {activeIndex + 1} / {sortedMedia.length}
              </span>
              <span className="text-stone-400 text-sm hidden sm:inline">|</span>
              <h4 className="text-sm font-medium text-stone-200 truncate max-w-md hidden sm:inline">
                {!isFileNameOrPath(currentMedia.caption) ? currentMedia.caption : tourTitle}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Đóng phóng to"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Media Body */}
          <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
            {currentMedia.mediaType === 'VIDEO' ? (
              <video
                src={currentMedia.url}
                controls
                autoPlay
                className="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl"
              />
            ) : (
              <img
                src={currentMedia.url}
                alt={!isFileNameOrPath(currentMedia.caption) ? currentMedia.caption! : tourTitle}
                className="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl"
              />
            )}

            {/* Navigation buttons */}
            {sortedMedia.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-2 sm:left-4 p-3 rounded-full bg-white/15 hover:bg-white/30 text-white transition-all cursor-pointer backdrop-blur-xs"
                  aria-label="Ảnh trước"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-2 sm:right-4 p-3 rounded-full bg-white/15 hover:bg-white/30 text-white transition-all cursor-pointer backdrop-blur-xs"
                  aria-label="Ảnh tiếp theo"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Footer Caption & Thumbnail strip */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            {currentMedia.caption && !isFileNameOrPath(currentMedia.caption) && (
              <p className="text-center text-xs sm:text-sm text-stone-300 max-w-2xl mx-auto">
                {currentMedia.caption}
              </p>
            )}
            <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1 max-w-3xl mx-auto">
              {sortedMedia.map((m, idx) => (
                <button
                  key={m.id || idx}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`relative w-14 h-10 sm:w-16 sm:h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    idx === activeIndex
                      ? 'border-[#C2410C] ring-2 ring-[#C2410C]/40'
                      : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <img
                    src={m.url}
                    alt={m.caption || ''}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
