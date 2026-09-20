const paths = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
  tables: <><path d="M5 10h14" /><path d="M7 10V6h10v4" /><path d="M6 10v9M18 10v9M9 14h6" /></>,
  products: <><path d="M4 7h16l-1.4 13H5.4L4 7Z" /><path d="M8 7a4 4 0 0 1 8 0" /><path d="M9 12h6" /></>,
  receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6M9 12h6" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
  revenue: <><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
  cup: <><path d="M5 8h12v5a6 6 0 0 1-12 0V8Z" /><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17M6 21h10M8 4v1M12 3v2M16 4v1" /></>,
  chair: <><path d="M6 12h12v6H6zM8 18v3M16 18v3M7 12V7a5 5 0 0 1 10 0v5" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
  trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6" /></>,
  refresh: <><path d="M20 11a8 8 0 1 0-2.34 5.66" /><path d="M20 4v7h-7" /></>,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  alert: <><circle cx="12" cy="12" r="10" /><path d="M12 8v5M12 16h.01" /></>,
  empty: <><path d="M4 7h16l-2 13H6L4 7Z" /><path d="M9 11a3 3 0 0 0 6 0" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  minus: <path d="M5 12h14" />,
  cart: <><circle cx="9" cy="20" r="1" /><circle cx="19" cy="20" r="1" /><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6" /></>,
  note: <><path d="M4 4h16v16H4z" /><path d="M8 9h8M8 13h6" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  back: <path d="m15 18-6-6 6-6M9 12h11" />,
};

function Icon({ name, size = 20, className = "" }) {
  return <svg aria-hidden="true" className={className} fill="none" height={size} viewBox="0 0 24 24" width={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">{paths[name]}</svg>;
}

export default Icon;
