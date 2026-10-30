import React from "react";
import { PrayerIcon } from "./prayer-icon.jsx";

export function PrayerReadOnlyCard({ request, bridge, index }) {
  const image = bridge.getBackgroundOptions()[request.backgroundIndex]?.src || "assets/prayer-backgrounds/prayer-1.webp";
  return <article className={`prayer-card prayer-card--${index % 4} prayer-card--readonly`} style={{ "--prayer-card-image": `url('${image}')` }}>
    <div className="prayer-card-toggle"><span>
      <small className="prayer-card-category">{request.category || "General"}</small>
      <strong className="prayer-card-title">{request.title?.trim() || "Prayer request"}</strong>
      <p className="prayer-card-preview">{request.preview || request.text}</p>
    </span></div>
    <div className="prayer-card-meta"><span className={`prayer-action profile-prayer-count${request.hasPrayed ? " is-prayed" : ""}`} aria-label={`${request.prayerCount || 0} prayers`}>
      <span>{request.prayerCount || 0}</span><PrayerIcon name="heart" />
    </span></div>
  </article>;
}
