// Small line icons for the top bar (shown with labels on phones).
const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
const Svg = ({ children }) => <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">{children}</svg>;

export const IconReading = () => <Svg><rect x="3" y="6" width="7" height="12" rx="1.2" {...P} /><rect x="14" y="6" width="7" height="12" rx="1.2" {...P} /><path d="M6.5 10.5l.9 1.6-.9 1.6-.9-1.6z" {...P} /></Svg>;
export const IconDecks = () => <Svg><rect x="8" y="4" width="10" height="15" rx="1.4" transform="rotate(10 13 11.5)" {...P} /><rect x="5" y="5" width="10" height="15" rx="1.4" {...P} /></Svg>;
export const IconBrowse = () => <Svg><rect x="4" y="4" width="6.5" height="6.5" rx="1" {...P} /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1" {...P} /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1" {...P} /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" {...P} /></Svg>;
export const IconHistory = () => <Svg><path d="M20 14.5A8 8 0 1 1 9.5 4a6.3 6.3 0 0 0 10.5 10.5z" {...P} /></Svg>;
export const IconGuide = () => <Svg><path d="M4 5.5C6.5 4.5 9.5 4.5 12 6c2.5-1.5 5.5-1.5 8-.5v13c-2.5-1-5.5-1-8 .5-2.5-1.5-5.5-1.5-8-.5z" {...P} /><path d="M12 6v13.5" {...P} /></Svg>;
export const IconTheme = () => <Svg><path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.3 0 1.8-1 1.2-2-.7-1.2.1-2.5 1.5-2.5H17a3.5 3.5 0 0 0 3.5-3.5c0-5-3.8-9-8.5-9z" {...P} /><circle cx="7.8" cy="11" r="1.2" fill="currentColor" /><circle cx="10.5" cy="7.3" r="1.2" fill="currentColor" /><circle cx="15" cy="7.8" r="1.2" fill="currentColor" /></Svg>;
export const IconSound = ({ on }) => <Svg><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" {...P} />{on ? <><path d="M15.5 9a4 4 0 0 1 0 6" {...P} /><path d="M18 6.5a7.5 7.5 0 0 1 0 11" {...P} /></> : <path d="M16 9.5l5 5M21 9.5l-5 5" {...P} />}</Svg>;
