interface CategoryIconProps {
  slug: string;
  className?: string;
}

export function CategoryIcon({ slug, className = "h-5 w-5" }: CategoryIconProps) {
  switch (slug) {
    case "power-charging":
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <rect x="5" y="4" width="14" height="17" rx="2.5" />
          <path d="M9 2h6" />
          <path d="M12.5 9l-2.5 4h4l-2.5 4" />
        </svg>
      );
    case "audio":
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M4 13a8 8 0 0 1 16 0" />
          <rect x="3" y="13" width="4" height="7" rx="1.5" />
          <rect x="17" y="13" width="4" height="7" rx="1.5" />
        </svg>
      );
    case "wearables-smart":
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <rect x="6" y="6" width="12" height="12" rx="3" />
          <path d="M9 6V3h6v3M9 18v3h6v-3" />
          <path d="M12 9.5v3l2 1.2" />
        </svg>
      );
    case "desk-creator":
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M8 20h8M12 16v4" />
          <circle cx="8" cy="10" r="1" />
          <path d="M12 10h5" />
        </svg>
      );
    case "automotive-travel":
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M5 14l1.5-5h11L19 14" />
          <rect x="3" y="14" width="18" height="5" rx="1.5" />
          <circle cx="7.5" cy="19" r="1.5" />
          <circle cx="16.5" cy="19" r="1.5" />
        </svg>
      );
    default:
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={className}
        >
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
  }
}
