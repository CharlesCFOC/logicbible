import React from "react";

const icons = {
  send: ["m22 2-7 20-4-9-9-4Z", "M22 2 11 13"],
  share: ["M14 5h5v5", "M19 5l-9 9", "M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"],
  heart: ["M20.8 8.8c0 5.4-8.8 10.2-8.8 10.2S3.2 14.2 3.2 8.8A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.7Z"],
  handHeart: ["M20.8 8.8c0 5.4-8.8 10.2-8.8 10.2S3.2 14.2 3.2 8.8A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.7Z", "M7 15h4l2-3 2 2h3"],
  chevron: ["m6 9 6 6 6-6"],
};

export function PrayerIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {icons[name].map((path) => <path key={path} d={path} />)}
    </svg>
  );
}
