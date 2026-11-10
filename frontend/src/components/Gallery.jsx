import { useCallback, useEffect, useState } from 'react';
import { Icon } from './Icons.jsx';
import { PLACEHOLDER } from '../utils/format.js';

/** Full-screen photo viewer: arrow keys / swipe buttons, Escape to close, thumbnails strip. */
export function Lightbox({ images, start = 0, onClose, title }) {
  const [i, setI] = useState(start);
  const go = useCallback((d) => setI((x) => (x + d + images.length) % images.length), [images.length]);

  useEffect(() => {
    const key = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', key);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', key);
      document.body.style.overflow = '';
    };
  }, [go, onClose]);

  return (
    <div className="lb" role="dialog" aria-modal="true" aria-label={`${title} photos`} onClick={onClose}>
      <button className="lb-close" onClick={onClose} aria-label="Close"><Icon.Close width={26} height={26} /></button>
      <span className="lb-count">{i + 1} / {images.length}</span>
      {images.length > 1 && <button className="lb-nav prev" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous photo"><Icon.ChevL width={28} height={28} /></button>}
      <img className="lb-img" src={images[i]} alt={`${title} photo ${i + 1}`} onClick={(e) => e.stopPropagation()} onError={(e) => (e.currentTarget.src = PLACEHOLDER)} />
      {images.length > 1 && <button className="lb-nav next" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next photo"><Icon.ChevR width={28} height={28} /></button>}
      {images.length > 1 && (
        <div className="lb-strip" onClick={(e) => e.stopPropagation()}>
          {images.map((src, n) => (
            <button key={src + n} className={n === i ? 'on' : ''} onClick={() => setI(n)}><img src={src} alt="" /></button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Photo mosaic: one large photo + up to four small ones. Clicking any opens the lightbox.
 * With a single photo it shows just the large one.
 */
export default function Gallery({ images, title, children }) {
  const [open, setOpen] = useState(null); // index or null
  const list = images.length ? images : [PLACEHOLDER];
  const small = list.slice(1, 5);

  return (
    <>
      <div className={`gal gal-${Math.min(list.length, 5)}`}>
        <button className="gal-main" onClick={() => setOpen(0)} aria-label="Open photo 1">
          <img src={list[0]} alt={title} onError={(e) => (e.currentTarget.src = PLACEHOLDER)} />
        </button>
        {small.map((src, n) => (
          <button key={src + n} className="gal-small" onClick={() => setOpen(n + 1)} aria-label={`Open photo ${n + 2}`}>
            <img src={src} alt="" loading="lazy" onError={(e) => (e.currentTarget.src = PLACEHOLDER)} />
            {n === small.length - 1 && list.length > 5 && <span className="gal-more">+{list.length - 5}</span>}
          </button>
        ))}
        <button className="gal-all" onClick={() => setOpen(0)}><Icon.Expand width={16} height={16} /> View all {list.length} photo{list.length > 1 ? 's' : ''}</button>
        {children}
      </div>
      {open !== null && <Lightbox images={list} start={open} title={title} onClose={() => setOpen(null)} />}
    </>
  );
}
