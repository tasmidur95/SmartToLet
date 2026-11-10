import { useEffect } from 'react';

/** Sets the document title and meta description for the current page (basic SEO for a SPA). */
export function usePageMeta(title, description) {
  useEffect(() => {
    if (title) document.title = `${title} – Smart Tolet`;
    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement('meta');
        tag.name = 'description';
        document.head.appendChild(tag);
      }
      tag.content = description;
    }
  }, [title, description]);
}
