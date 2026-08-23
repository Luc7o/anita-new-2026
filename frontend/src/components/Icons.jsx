import React from "react";

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function IconClose({ size = 16, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function IconMenu({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

export function IconEye({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconEyeOff({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.1A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a13.6 13.6 0 0 1-3.1 3.9M6.3 6.9C4 8.6 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4.6-1.1" />
      <path d="M9.5 9.8A3 3 0 0 0 12 15a3 3 0 0 0 2.2-1" />
    </svg>
  );
}

export function IconUser({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
    </svg>
  );
}

export function IconChevronDown({ size = 14, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function IconDashboard({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

export function IconBag({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <path d="M6 8h12l1 12H5L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

export function IconTag({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <path d="M20.6 12.3 12.3 20.6a2 2 0 0 1-2.8 0l-6.1-6.1a2 2 0 0 1 0-2.8L11.7 3.4a2 2 0 0 1 1.4-.6H19a2 2 0 0 1 2 2v5.9a2 2 0 0 1-.6 1.4Z" />
      <circle cx="15.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconPackage({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
      <path d="M20 16.5V7.5a1.8 1.8 0 0 0-.9-1.6l-6.2-3.6a1.8 1.8 0 0 0-1.8 0L4.9 5.9A1.8 1.8 0 0 0 4 7.5v9a1.8 1.8 0 0 0 .9 1.6l6.2 3.6a1.8 1.8 0 0 0 1.8 0l6.2-3.6a1.8 1.8 0 0 0 .9-1.6Z" />
    </svg>
  );
}

export function IconLogout({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export function IconStore({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <path d="M3 9l1.5-5h15L21 9" />
      <path d="M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9Z" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

export function IconCart({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <path d="M3 4h2l2.4 12.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L20 8H6" />
      <circle cx="9" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="17" cy="20" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconSearch({ size = 16, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3-3" />
    </svg>
  );
}

export function IconReceipt({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  );
}

export function IconTruck({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <path d="M3 7h11v9H3z" />
      <path d="M14 10h4l3 3v3h-7z" />
      <circle cx="7.5" cy="18" r="1.6" />
      <circle cx="17.5" cy="18" r="1.6" />
    </svg>
  );
}

export function IconUsers({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5" />
      <circle cx="17" cy="8.5" r="2.6" />
      <path d="M15.5 14.7c2.7.4 5 2.3 5 5.3" />
    </svg>
  );
}

export function IconUpload({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <path d="M12 16V4M7 9l5-5 5 5" />
      <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

export function IconSettings({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

export function IconFacebook({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <path d="M14 9V6.5a1.5 1.5 0 0 1 1.5-1.5H17V2h-2.5A4.5 4.5 0 0 0 10 6.5V9H7v3h3v10h4V12h3l1-3h-4Z" />
    </svg>
  );
}

export function IconInstagram({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconWhatsApp({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <path d="M4 20.5 5.3 16A8.4 8.4 0 1 1 8.6 19l-4.6 1.5Z" />
      <path d="M8.7 8.7c-.2.9.1 2 .9 3.1 1 1.4 2.2 2.4 3.6 3 1 .4 1.9.3 2.4-.5l.4-.7c.2-.3 0-.7-.3-.9l-1.5-.9c-.3-.2-.6-.1-.8.1l-.4.5c-.7-.3-1.5-.9-2.1-1.7-.5-.7-.8-1.4-.9-2l.5-.4c.2-.2.3-.5.2-.8l-.8-1.6c-.1-.3-.5-.5-.8-.3l-.4.2Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconCheck({ size = 14, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth={3} className={className}>
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

export function IconMail({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

export function IconLock({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function IconArrowLeft({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </svg>
  );
}

export function IconCheckCircle({ size = 40, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </svg>
  );
}

export function IconHeart({ size = 18, className = "", relleno = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={relleno ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 20.5s-7.5-4.6-10-9.3C.5 7.8 2.3 4.5 5.8 4c2-.3 3.9.6 5 2.3a1 1 0 0 0 1.4 0c1.1-1.7 3-2.6 5-2.3 3.5.5 5.3 3.8 3.8 7.2-2.5 4.7-10 9.3-10 9.3Z" />
    </svg>
  );
}

export function IconChevronLeft({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <path d="m15 6-6 6 6 6" />
    </svg>
  );
}

export function IconChevronRight({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function IconArrowRight({ size = 16, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function IconHome({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
    </svg>
  );
}

export function IconHelp({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.3 9a2.7 2.7 0 1 1 3.9 2.4c-.8.5-1.2 1-1.2 1.9" />
      <circle cx="12" cy="17" r="0.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconShield({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <path d="M12 3 4 6v6c0 4.5 3 8 8 9 5-1 8-4.5 8-9V6l-8-3Z" />
    </svg>
  );
}

export function IconKey({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="m11 12 8-8" />
      <path d="m17 6 3 3" />
      <path d="m14 9 2.5 2.5" />
    </svg>
  );
}

export function IconGlobe({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.5 3.8 5.8 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.8-3.8-9S9.5 5.5 12 3Z" />
    </svg>
  );
}

export function IconInfo({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6" />
      <circle cx="12" cy="7.5" r="0.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconFileText({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M9 12h6M9 16h6M9 8h3" />
    </svg>
  );
}

export function IconRefresh({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <path d="M20 11a8 8 0 0 0-14.9-3.5M4 13a8 8 0 0 0 14.9 3.5" />
      <path d="M5 4v4h4M19 20v-4h-4" />
    </svg>
  );
}

export function IconApple({ size = 16, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M16.4 1.4c.1 1.1-.3 2.2-1 3-.7.8-1.9 1.5-3 1.4-.1-1.1.4-2.3 1-3 .8-.9 2-1.5 3-1.4Zm3.2 16.6c-.5 1.1-.7 1.6-1.4 2.6-.9 1.4-2.2 3.1-3.8 3.1-1.4 0-1.8-.9-3.7-.9-1.9 0-2.4.9-3.7.9-1.6 0-2.8-1.6-3.7-3-2.5-3.9-2.8-8.5-1.2-10.9 1.1-1.7 2.8-2.7 4.5-2.7 1.7 0 2.8 1 4.2 1 1.4 0 2.2-1 4.2-1 1.5 0 3 .8 4.1 2.2-3.6 2-3 7.2.5 8.7Z" />
    </svg>
  );
}

export function IconPlay({ size = 16, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M5 3.5c0-1 1.1-1.7 2-1.2l13 9.7c.8.6.8 1.9 0 2.5l-13 9.7c-.9.5-2-.2-2-1.2V3.5Z" />
    </svg>
  );
}

export function IconEdit({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function IconTrash({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function IconGift({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <rect x="3" y="9" width="18" height="11" rx="1.5" />
      <path d="M3 9h18M12 9v11" />
      <path d="M7.5 9a2.5 2.5 0 0 1 0-5C10 4 12 7 12 9c0-2 2-5 4.5-5a2.5 2.5 0 0 1 0 5" />
    </svg>
  );
}

export function IconStar({ size = 18, className = "", relleno = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={relleno ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinejoin="round"
      className={className}
    >
      <path d="m12 2.5 2.9 6.06 6.6.82-4.85 4.6 1.27 6.6L12 17.5l-5.92 3.08 1.27-6.6-4.85-4.6 6.6-.82L12 2.5Z" />
    </svg>
  );
}
