import React, { useState } from 'react';
import { ExpeditionReview, ScreenId } from '../../../types/expedition';
import { INITIAL_REVIEW } from '../../../data/mockData';
import {
  Star,
  Check,
  Plus,
  X,
  UploadCloud,
  Award,
  ThumbsUp,
  ThumbsDown,
  Minus,
  User,
  Heart,
  Users,
  ShieldCheck,
} from 'lucide-react';

export interface ProfilePageProps {
  review?: ExpeditionReview;
  onUpdateReview?: (updated: ExpeditionReview) => void;
  onNavigate?: (screen: ScreenId) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  review = INITIAL_REVIEW,
  onUpdateReview = () => {},
  onNavigate = () => {},
}) => {
  const [ratings, setRatings] = useState(review.ratings);
  const [selectedTags, setSelectedTags] = useState<string[]>(review.selectedTags);
  const [photos, setPhotos] = useState(review.photos);
  const [narrative, setNarrative] = useState(review.narrative);
  const [endorsement, setEndorsement] = useState(review.endorsement);
  const [travelerDynamic, setTravelerDynamic] = useState(review.travelerDynamic);
  const [isSubmitted, setIsSubmitted] = useState(review.isSubmitted);
  const [draftSaved, setDraftSaved] = useState(false);

  const availableTags = [
    'Pristine Nature',
    'Knowledgeable Guide',
    'Delicious Local Cuisine',
    'Great Kayaking',
    '5-Star Balcony Cabin',
    'Seamless Harbor Transfer',
    'Sunset Cocktails',
  ];

  const helperPrompts = [
    '+ Mention guide performance',
    '+ Gear & packing tip',
    '+ Kayaking highlights',
  ];

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos(photos.filter((p) => p.id !== id));
  };

  const handleAddSamplePhoto = () => {
    const newId = `photo-${Date.now()}`;
    setPhotos([
      ...photos,
      {
        id: newId,
        name: `bivouac_camp_${photos.length + 1}.jpg`,
        size: '4.1MB',
        url: '/src/assets/images/fansipan_cloud_ridge_1792001300725.jpg',
      },
    ]);
  };

  const handleInsertHelperPrompt = (prompt: string) => {
    const textToAdd = prompt.replace('+', '').trim() + ': ';
    setNarrative((prev) => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + textToAdd);
  };

  const handleSaveDraft = () => {
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    onUpdateReview({
      ...review,
      ratings,
      selectedTags,
      photos,
      narrative,
      endorsement,
      travelerDynamic,
      isSubmitted: true,
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1C2526] py-6 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Top Breadcrumb */}
        <div className="flex items-center justify-between text-xs text-[#64748B] mb-6">
          <div className="flex items-center gap-2">
            <button onClick={() => onNavigate('marketplace')} className="hover:text-[#1C2526] cursor-pointer">
              Home
            </button>
            <span>&gt;</span>
            <button onClick={() => onNavigate('eticket')} className="hover:text-[#1C2526] cursor-pointer">
              My Bookings
            </button>
            <span>&gt;</span>
            <span className="text-[#1C2526] font-semibold">Review Tour</span>
          </div>

          <button
            onClick={() => onNavigate('eticket')}
            className="hover:text-[#1C2526] transition-colors cursor-pointer"
          >
            &larr; Back to My Bookings
          </button>
        </div>

        {/* Section Header Card */}
        <div className="bg-white border border-[#E6E1D8] rounded-xl p-5 mb-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded bg-[#FAF8F5] border border-[#E6E1D8] flex items-center justify-center text-[#C2410C] shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-editorial text-2xl font-bold text-[#1C2526]">
                Submit Review - Ha Long &amp; Lan Ha Bay Cruise
              </h1>
              <span className="text-xs text-[#64748B]">
                Official verified trip debrief &amp; community field rating
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#78716C] bg-[#FAF8F5] px-2.5 py-1 rounded border border-[#E6E1D8]">
              {draftSaved ? 'Draft Saved!' : 'Draft Auto-Saved'}
            </span>
          </div>
        </div>

        {/* Expedition Reference Card */}
        <div className="bg-white border border-[#E6E1D8] rounded-xl p-4 mb-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-stone-200">
              <img
                src="/src/assets/images/lan_ha_bay_cruise_1792001303633.jpg"
                alt="Lan Ha Bay Cruise"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1 right-1 bg-black/60 text-white font-mono text-[9px] px-1 py-0.2 rounded">
                3D/2N
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200">
                  <Check className="w-3 h-3 text-emerald-600" /> Verified Expedition
                </span>
                <span className="text-[10px] font-mono text-[#78716C]">{review.expeditionBadge}</span>
              </div>
              <h2 className="font-editorial text-base sm:text-lg font-bold text-[#1C2526] leading-tight">
                {review.expeditionTitle}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748B]">
                <span>{review.completedDate}</span>
                <span>·</span>
                <span>{review.operatorName}</span>
                <span>·</span>
                <span>{review.leadGuideName}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#FAF8F5] border border-[#E6E1D8] rounded-lg p-3 text-center shrink-0 w-full sm:w-auto">
            <span className="text-[10px] font-mono uppercase text-[#78716C] block">
              EARN REWARD
            </span>
            <span className="font-editorial text-xl font-bold text-[#C2410C] flex items-center justify-center gap-1">
              <Award className="w-4 h-4" /> +{review.rewardPoints} pts
            </span>
          </div>
        </div>

        {/* Narrative Intro */}
        <div className="mb-8">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#C2410C] font-semibold block mb-1">
            EXPEDITION LOGBOOK • ENTRY #14
          </span>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C2526]">
            Welcome back, Eleanor! How was your journey on the water?
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 leading-relaxed">
            Your firsthand insights illuminate hidden grottoes and guide fellow backcountry navigators on their next departure.
          </p>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Ratings */}
          <div className="bg-white border border-[#E6E1D8] rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6E1D8]">
              <h3 className="font-editorial text-lg font-bold text-[#1C2526]">
                1. Multi-Factor Expedition Ratings
              </h3>
              <span className="text-[10px] font-mono text-[#C2410C] uppercase tracking-wider font-semibold">
                REQUIRED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#FAF8F5] border border-[#E6E1D8] rounded-lg p-4 text-center">
                <span className="text-[10px] font-mono uppercase text-[#78716C] block mb-1">
                  VOYAGE RATING
                </span>
                <strong className="text-xs text-[#1C2526] block mb-2">
                  Overall Tour Experience
                </strong>
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRatings({ ...ratings, overall: star })}
                      className="cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= ratings.overall
                            ? 'text-[#C2410C] fill-[#C2410C]'
                            : 'text-stone-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-semibold text-[#1C2526] bg-white border border-[#E6E1D8] px-2.5 py-0.5 rounded">
                  Exceptional ({ratings.overall}/5)
                </span>
              </div>

              <div className="bg-[#FAF8F5] border border-[#E6E1D8] rounded-lg p-4 text-center">
                <span className="text-[10px] font-mono uppercase text-[#78716C] block mb-1">
                  LEADERSHIP
                </span>
                <strong className="text-xs text-[#1C2526] block mb-2">
                  Guide &amp; Crew Service
                </strong>
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRatings({ ...ratings, guideCrew: star })}
                      className="cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= ratings.guideCrew
                            ? 'text-[#C2410C] fill-[#C2410C]'
                            : 'text-stone-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-semibold text-[#1C2526] bg-white border border-[#E6E1D8] px-2.5 py-0.5 rounded">
                  {ratings.guideCrew}.0 Star Navigators
                </span>
              </div>

              <div className="bg-[#FAF8F5] border border-[#E6E1D8] rounded-lg p-4 text-center">
                <span className="text-[10px] font-mono uppercase text-[#78716C] block mb-1">
                  EXCURSION QUALITY
                </span>
                <strong className="text-xs text-[#1C2526] block mb-2">
                  Kayak &amp; Excursions Scenery
                </strong>
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRatings({ ...ratings, scenery: star })}
                      className="cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= ratings.scenery
                            ? 'text-[#C2410C] fill-[#C2410C]'
                            : 'text-stone-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-semibold text-[#1C2526] bg-white border border-[#E6E1D8] px-2.5 py-0.5 rounded">
                  Unrivaled Scenery ({ratings.scenery}/5)
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-[#78716C] block mb-2">
                QUICK HIGHLIGHT TAGS (SELECT ALL THAT APPLY):
              </span>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => handleToggleTag(tag)}
                      className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#B9EADB]/50 text-[#1F4E43] border border-[#1F4E43] font-semibold'
                          : 'bg-white text-[#2D3748] border border-[#E6E1D8] hover:border-stone-400'
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 text-[#78716C]" />}
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 2: Photos */}
          <div className="bg-white border border-[#E6E1D8] rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6E1D8]">
              <div>
                <h3 className="font-editorial text-lg font-bold text-[#1C2526]">
                  2. Expedition Photography &amp; Video
                </h3>
                <p className="text-[11px] text-[#64748B]">
                  Upload trip photos or grotto footage to verify your experience.
                </p>
              </div>
              <span className="text-xs font-mono text-[#78716C]">
                {photos.length} Files · 18.4 MB
              </span>
            </div>

            <div
              onClick={handleAddSamplePhoto}
              className="border-2 border-dashed border-[#D6CEBE] rounded-xl p-6 text-center hover:bg-[#FAF8F5] transition-colors cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-[#C2410C]/10 text-[#C2410C] flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-5 h-5" />
              </div>
              <strong className="block text-xs sm:text-sm text-[#1C2526]">
                Drag &amp; drop your expedition photos &amp; videos here
              </strong>
              <span className="text-[11px] text-[#78716C] block mt-0.5">
                Accepts up to 10 photos or short clips (Max 25MB each • JPG, PNG, MP4, HEIC)
              </span>
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {photos.map((p) => (
                  <div
                    key={p.id}
                    className="relative bg-stone-100 rounded-lg overflow-hidden border border-[#E6E1D8] group h-32"
                  >
                    <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(p.id)}
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs text-white p-1 text-[10px] font-mono flex items-center justify-between">
                      <span className="truncate max-w-[80px]">{p.name}</span>
                      <span className="text-stone-300">{p.size}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Field Notes */}
          <div className="bg-white border border-[#E6E1D8] rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6E1D8]">
              <div>
                <h3 className="font-editorial text-lg font-bold text-[#1C2526]">
                  3. Field Notes &amp; Narrative
                </h3>
                <p className="text-[11px] text-[#64748B]">
                  Share your experience with other travelers (activities, guide, location)...
                </p>
              </div>
              <span className="text-xs font-mono text-[#78716C]">
                {narrative.length} / 2,000
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
              <span className="text-[10px] font-mono text-[#78716C] uppercase shrink-0">
                Helper prompts:
              </span>
              {helperPrompts.map((h, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => handleInsertHelperPrompt(h)}
                  className="bg-[#FAF8F5] hover:bg-[#F0ECE2] text-[#1C2526] border border-[#E6E1D8] px-2.5 py-1 rounded text-[11px] whitespace-nowrap cursor-pointer transition-colors"
                >
                  {h}
                </button>
              ))}
            </div>

            <textarea
              rows={5}
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              maxLength={2000}
              placeholder="Write your honest field log here..."
              className="w-full bg-[#FAF8F5] border border-[#E6E1D8] rounded-lg p-3.5 text-xs sm:text-sm text-[#1C2526] leading-relaxed focus:bg-white focus:outline-none focus:border-[#C2410C]"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-[#FAF8F5] border border-[#E6E1D8] rounded-lg p-3.5">
                <span className="text-[10px] font-mono uppercase text-[#78716C] block mb-1">
                  ENDORSEMENT
                </span>
                <strong className="text-xs text-[#1C2526] block mb-2">
                  Would you recommend this expedition?
                </strong>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEndorsement('Enthusiastically')}
                    className={`py-2 px-1 rounded text-xs font-medium flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      endorsement === 'Enthusiastically'
                        ? 'bg-[#1F4E43] text-white shadow-xs'
                        : 'bg-white text-[#2D3748] border border-[#E6E1D8] hover:bg-stone-50'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Enthusiastically</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEndorsement('Neutral')}
                    className={`py-2 px-1 rounded text-xs font-medium flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      endorsement === 'Neutral'
                        ? 'bg-[#1F4E43] text-white shadow-xs'
                        : 'bg-white text-[#2D3748] border border-[#E6E1D8] hover:bg-stone-50'
                    }`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Neutral</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEndorsement('Not Advised')}
                    className={`py-2 px-1 rounded text-xs font-medium flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      endorsement === 'Not Advised'
                        ? 'bg-[#C2410C] text-white shadow-xs'
                        : 'bg-white text-[#2D3748] border border-[#E6E1D8] hover:bg-stone-50'
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Not Advised</span>
                  </button>
                </div>
              </div>

              <div className="bg-[#FAF8F5] border border-[#E6E1D8] rounded-lg p-3.5">
                <span className="text-[10px] font-mono uppercase text-[#78716C] block mb-1">
                  EXPEDITION DYNAMIC
                </span>
                <strong className="text-xs text-[#1C2526] block mb-2">
                  What type of traveler were you?
                </strong>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTravelerDynamic('Solo')}
                    className={`py-2 px-1 rounded text-xs font-medium flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      travelerDynamic === 'Solo'
                        ? 'bg-[#C2410C] text-white shadow-xs'
                        : 'bg-white text-[#2D3748] border border-[#E6E1D8] hover:bg-stone-50'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Solo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTravelerDynamic('Couple')}
                    className={`py-2 px-1 rounded text-xs font-medium flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      travelerDynamic === 'Couple'
                        ? 'bg-[#C2410C] text-white shadow-xs'
                        : 'bg-white text-[#2D3748] border border-[#E6E1D8] hover:bg-stone-50'
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Couple</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTravelerDynamic('Family')}
                    className={`py-2 px-1 rounded text-xs font-medium flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      travelerDynamic === 'Family'
                        ? 'bg-[#C2410C] text-white shadow-xs'
                        : 'bg-white text-[#2D3748] border border-[#E6E1D8] hover:bg-stone-50'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Family</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTravelerDynamic('Friends')}
                    className={`py-2 px-1 rounded text-xs font-medium flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      travelerDynamic === 'Friends'
                        ? 'bg-[#C2410C] text-white shadow-xs'
                        : 'bg-white text-[#2D3748] border border-[#E6E1D8] hover:bg-stone-50'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Friends</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-[#FAF8F5] border border-[#E6E1D8] rounded-lg p-3.5 flex items-start gap-3 text-xs text-[#64748B]">
              <ShieldCheck className="w-4 h-4 text-[#1F4E43] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-[#1C2526] text-xs">
                  Immutable Traveler Attestation
                </strong>
                <p className="text-[11px] leading-relaxed mt-0.5">
                  By submitting this log, you certify this review represents your genuine backcountry journey. Verified posts award <strong className="text-[#1C2526]">250 Wayfarer Points</strong> immediately to your account ledger.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-4 py-2 text-xs font-semibold text-[#2D3748] bg-white border border-[#E6E1D8] rounded-lg hover:bg-[#FAF8F5] transition-colors cursor-pointer"
              >
                {draftSaved ? '✓ Draft Saved' : 'Save Draft'}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('eticket')}
                className="px-4 py-2 text-xs text-[#64748B] hover:text-[#1C2526] cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto bg-[#C2410C] hover:bg-[#9B2F00] text-white px-8 py-2.5 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Submit Verified Review</span>
            </button>
          </div>
        </form>

        {isSubmitted && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white border border-[#E6E1D8] rounded-xl p-8 max-w-md text-center shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#1F4E43] flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#C2410C] font-semibold block mb-1">
                VERIFIED FIELD LOG RECORDED
              </span>
              <h3 className="font-editorial text-2xl font-bold text-[#1C2526] mb-2">
                Thank you, Eleanor!
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed mb-6">
                Your expedition review for <strong>Ha Long &amp; Lan Ha Bay</strong> has been permanently committed to the backcountry ledger. <span className="text-emerald-700 font-bold">+250 Wayfarer Points</span> have been deposited into your climber wallet.
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="bg-[#1F4E43] hover:bg-[#15372F] text-white text-xs font-semibold px-5 py-2.5 rounded-lg cursor-pointer"
                >
                  View Published Logbook
                </button>
                <button
                  onClick={() => onNavigate('marketplace')}
                  className="bg-[#FAF8F5] hover:bg-[#EFECE4] text-[#1C2526] border border-[#E6E1D8] text-xs font-semibold px-5 py-2.5 rounded-lg cursor-pointer"
                >
                  Explore More Hikes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
