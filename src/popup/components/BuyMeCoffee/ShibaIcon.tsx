import React from "react";

interface ShibaIconProps {
  className?: string;
  size?: number;
}

/**
 * SVG icon of a black and tan shiba inu (Nori!)
 */
export const ShibaIcon: React.FC<ShibaIconProps> = ({ className, size = 16 }) => {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ears - black outer */}
      <path
        d="M6 8 L4 4 L8 6 Z"
        fill="#2C1810"
        stroke="#2C1810"
        strokeWidth="0.5"
      />
      <path
        d="M18 8 L20 4 L16 6 Z"
        fill="#2C1810"
        stroke="#2C1810"
        strokeWidth="0.5"
      />

      {/* Ears - tan inner */}
      <path
        d="M6 7 L5 5 L7 6.5 Z"
        fill="#D4A574"
      />
      <path
        d="M18 7 L19 5 L17 6.5 Z"
        fill="#D4A574"
      />

      {/* Head */}
      <circle cx="12" cy="12" r="7" fill="#2C1810" />

      {/* White markings - cheeks (larger and lower) */}
      <ellipse cx="7.5" cy="13" rx="2.5" ry="3" fill="white" />
      <ellipse cx="16.5" cy="13" rx="2.5" ry="3" fill="white" />

      {/* White markings - muzzle */}
      <ellipse cx="12" cy="15" rx="3" ry="2.5" fill="white" />

      {/* Tan markings - eyebrows/forehead */}
      <ellipse cx="9" cy="10" rx="1.5" ry="1" fill="#C8956E" />
      <ellipse cx="15" cy="10" rx="1.5" ry="1" fill="#C8956E" />

      {/* Eyes */}
      <circle cx="9.5" cy="11" r="1.2" fill="#2C1810" />
      <circle cx="14.5" cy="11" r="1.2" fill="#2C1810" />
      <circle cx="9.8" cy="10.7" r="0.4" fill="white" />
      <circle cx="14.8" cy="10.7" r="0.4" fill="white" />

      {/* Nose */}
      <ellipse cx="12" cy="14" rx="1" ry="0.8" fill="#1a1a1a" />

      {/* Mouth */}
      <path
        d="M12 14.5 Q10.5 15.5 9.5 15"
        stroke="#1a1a1a"
        strokeWidth="0.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M12 14.5 Q13.5 15.5 14.5 15"
        stroke="#1a1a1a"
        strokeWidth="0.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* White chest marking */}
      <ellipse cx="12" cy="19" rx="3" ry="1.5" fill="white" opacity="0.9" />
    </svg>
  );
};
