import { h } from '../../lib/h';
import { BG, SC } from '../../lib/constants';

export const Bd=({c,t})=>h`<span className=${'px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap '+BG[c||'x']}>${t}</span>`;
export const Badge=({s})=>h`<${Bd} c=${SC[s]} t=${s}/>`;
