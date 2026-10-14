import React, { useState, useEffect } from 'react';
import { Star, X, MessageSquare } from 'lucide-react';
import { useMasarifi } from '../context/MasarifiContext';

export default function ReviewModal() {
  const { isDark, isRTL, t, showReviewModal, setShowReviewModal, addReview, userReview, showToast } = useMasarifi();

  const [stars, setStars] = useState(5);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  // Pre-fill with existing review if any
  useEffect(() => {
    if (userReview) {
      setStars(userReview.stars);
      setComment(userReview.comment);
    } else {
      setStars(5);
      setComment('');
    }
    setError('');
  }, [showReviewModal, userReview]);

  if (!showReviewModal) return null;

  const handleClose = () => setShowReviewModal(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) { setError(t('review.commentRequired')); return; }
    const res = await addReview({ stars, comment });
    if (res && res.success) {
      showToast('⭐ ' + t('review.thanks'));
      handleClose();
    }
  };

  const base = `w-full px-4 py-3 rounded-2xl text-sm border outline-none transition-all focus:ring-2 focus:ring-emerald-400 ${
    isDark ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
  }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={handleClose}
    >
      <div
        className={`relative w-full max-w-lg rounded-t-3xl p-6 shadow-2xl ${
          isDark ? 'bg-slate-900 border-t border-slate-800' : 'bg-white'
        }`}
        style={{ animation: 'slideUp 0.3s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>

        {/* Drag handle */}
        <div className={`w-12 h-1 rounded-full mx-auto mb-5 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center">
              <MessageSquare size={20} className="text-amber-500" />
            </div>
            <div>
              <h2 className={`text-lg font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                {userReview ? t('review.editTitle') : t('review.title')}
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('review.subtitle')}</p>
            </div>
          </div>
          <button onClick={handleClose} className={`p-2 rounded-full ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Stars selector */}
          <div>
            <p className={`text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('review.yourRating')}</p>
            <div className="flex items-center justify-center gap-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStars(s)}
                  onMouseEnter={() => setHovered(s)}
                  onMouseLeave={() => setHovered(0)}
                  className="transition-transform hover:scale-125 active:scale-110"
                  id={`masarifi-star-${s}`}
                >
                  <Star
                    size={36}
                    className={`transition-colors ${(hovered || stars) >= s ? 'text-amber-400 fill-amber-400' : isDark ? 'text-slate-600' : 'text-slate-300'}`}
                  />
                </button>
              ))}
            </div>
            <p className={`text-center text-xs mt-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {['', t('review.star1'), t('review.star2'), t('review.star3'), t('review.star4'), t('review.star5')][hovered || stars]}
            </p>
          </div>

          {/* Comment */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {t('review.yourComment')}
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => { setComment(e.target.value); setError(''); }}
              placeholder={t('review.commentPlaceholder')}
              className={`${base} resize-none`}
              id="masarifi-review-comment"
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-4 rounded-2xl font-extrabold text-white text-base transition-all active:scale-95 shadow-lg"
            style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}
            id="masarifi-review-submit"
          >
            ⭐ {userReview ? t('review.update') : t('review.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
