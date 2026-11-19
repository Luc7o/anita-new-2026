// Íconos animados de Animate UI (Lucide). Se ven quietos como siempre y se mueven solo
// dentro de un <AnimateIcon> (por ejemplo al pasar el mouse por el botón que los contiene)
// o con props como animateOnHover. Para agregar más: npm run iconos -- <nombre-lucide>
import { Heart } from "@/components/animate-ui/icons/heart.jsx";
import { Star } from "@/components/animate-ui/icons/star.jsx";
import { ShoppingCart } from "@/components/animate-ui/icons/shopping-cart.jsx";
import { Search } from "@/components/animate-ui/icons/search.jsx";
import { X } from "@/components/animate-ui/icons/x.jsx";
import { Menu } from "@/components/animate-ui/icons/menu.jsx";
import { User } from "@/components/animate-ui/icons/user.jsx";
import { ChevronLeft } from "@/components/animate-ui/icons/chevron-left.jsx";
import { ChevronRight } from "@/components/animate-ui/icons/chevron-right.jsx";
import { ArrowRight } from "@/components/animate-ui/icons/arrow-right.jsx";
import { Tag } from "@/components/animate-ui/icons/tag.jsx";
import { Gift } from "@/components/animate-ui/icons/gift.jsx";
import { Trash2 } from "@/components/animate-ui/icons/trash-2.jsx";
import { Check } from "@/components/animate-ui/icons/check.jsx";
import { MapPin } from "@/components/animate-ui/icons/map-pin.jsx";

import React from "react";

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function IconClose({ size = 16, className = "", ...resto }) {
  return <X size={size} className={className} {...resto} />;
}

export function IconMenu({ size = 18, className = "", ...resto }) {
  return <Menu size={size} className={className} {...resto} />;
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

export function IconUser({ size = 18, className = "", ...resto }) {
  return <User size={size} className={className} {...resto} />;
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

export function IconTag({ size = 18, className = "", ...resto }) {
  return <Tag size={size} className={className} {...resto} />;
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

export function IconCart({ size = 18, className = "", ...resto }) {
  return <ShoppingCart size={size} className={className} {...resto} />;
}

export function IconSearch({ size = 16, className = "", ...resto }) {
  return <Search size={size} className={className} {...resto} />;
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

export function IconTikTok({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

export function IconCheck({ size = 14, className = "", ...resto }) {
  return <Check size={size} className={className} {...resto} />;
}

export function IconMail({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
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

export function IconHeart({ size = 18, className = "", relleno = false, ...resto }) {
  return <Heart size={size} className={className} fill={relleno ? "currentColor" : "none"} {...resto} />;
}

export function IconChevronLeft({ size = 18, className = "", ...resto }) {
  return <ChevronLeft size={size} className={className} {...resto} />;
}

export function IconChevronRight({ size = 18, className = "", ...resto }) {
  return <ChevronRight size={size} className={className} {...resto} />;
}

export function IconArrowRight({ size = 16, className = "", ...resto }) {
  return <ArrowRight size={size} className={className} {...resto} />;
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

export function IconEdit({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function IconTrash({ size = 18, className = "", ...resto }) {
  return <Trash2 size={size} className={className} {...resto} />;
}

export function IconGift({ size = 18, className = "", ...resto }) {
  return <Gift size={size} className={className} {...resto} />;
}

export function IconCopy({ size = 16, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function IconClock({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export function IconStar({ size = 18, className = "", relleno = false, ...resto }) {
  return <Star size={size} className={className} fill={relleno ? "currentColor" : "none"} {...resto} />;
}

export function IconBook({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <path d="M2 5.5C4.5 4 8 4 12 6.5c4-2.5 7.5-2.5 10-1v13c-2.5-1.5-6-1.5-10 1-4-2.5-7.5-2.5-10-1v-13Z" />
      <path d="M12 6.5v13" />
    </svg>
  );
}

export function IconSun({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
    </svg>
  );
}

export function IconMoon({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
    </svg>
  );
}

export function IconReport({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M14 3v5h5M9 13h7M9 17h7" />
    </svg>
  );
}

export function IconWarehouse({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <path d="M3 21V9l9-5 9 5v12" />
      <path d="M7 21v-7h10v7M7 17.5h10" />
    </svg>
  );
}

export function IconReceipt({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={className}>
      <path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  );
}

export function IconMapPin({ size = 18, className = "", ...resto }) {
  return <MapPin size={size} className={className} {...resto} />;
}
