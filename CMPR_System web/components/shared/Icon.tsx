export type IconName =
  | "activity"
  | "alert"
  | "audit"
  | "bell"
  | "cases"
  | "check"
  | "chevron"
  | "clipboard"
  | "dashboard"
  | "file"
  | "gear"
  | "logout"
  | "officers"
  | "pin"
  | "profile"
  | "review"
  | "search"
  | "shield"
  | "moon"
  | "sun"
  | "trend";

export function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
    file: <><path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v5h5M9 13h6M9 17h5" /></>,
    review: <><path d="M9 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-3" /><path d="m13 13 7-7-2-2-7 7-1 3 3-1ZM8 9h3" /></>,
    clipboard: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4.5V3h6v1.5M9 10h6M9 14h6M9 18h4" /></>,
    officers: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20c.5-4 2.4-6 5.5-6s5 2 5.5 6M16 10a2.5 2.5 0 1 0 0-5M16 14c2.7 0 4.2 1.7 4.5 5" /></>,
    activity: <path d="M3 12h4l2.2-6 4.2 12 2.2-6H21" />,
    audit: <><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></>,
    gear: <><circle cx="12" cy="12" r="3" /><path d="M19 13.5V10.5l-2-.7-.6-1.4.9-2-2.2-2.1-1.9.9-1.4-.6L11 2H8l-.7 2.5-1.4.6L4 4.2 1.8 6.3l1 2-.6 1.4-2.2.8v3l2.2.7.6 1.4-1 2 2.2 2.1 1.9-.9 1.4.6L8 22h3l.8-2.5 1.4-.6 1.9.9 2.2-2.1-.9-2 .6-1.4 2-.8Z" transform="translate(2 0) scale(.83)" /></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" /><path d="M10 21h4" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    chevron: <path d="m8 10 4 4 4-4" />,
    shield: <path d="M12 2 20 5v6.5c0 5.2-3.3 9.2-8 10.5-4.7-1.3-8-5.3-8-10.5V5l8-3Zm-3 10 2 2 4-5" />,
    moon: <path d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.5 8.5 0 1 0 20.5 15.2Z" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21c.8-4.5 3.5-7 8-7s7.2 2.5 8 7" /></>,
    logout: <><path d="M10 4H5v16h5M14 8l4 4-4 4M8 12h10" /></>,
    cases: <><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M9 6V4h6v2M3 11h18M10 11v3h4v-3" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
    alert: <><path d="m12 3 10 18H2L12 3Z" /><path d="M12 9v5M12 18h.01" /></>,
    trend: <><path d="m4 16 5-5 4 3 7-8" /><path d="M15 6h5v5" /></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  };

  return (
    <svg aria-hidden="true" className="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

