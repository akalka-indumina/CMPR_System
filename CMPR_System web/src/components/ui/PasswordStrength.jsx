import { h } from '../../lib/h';
import { checkPassword } from '../../lib/stationAccounts';

const LEVEL_COLOURS = ['bg-bd', 'bg-red-500', 'bg-orange-500', 'bg-green-500', 'bg-green-600'];
const LEVEL_TEXT = ['text-mu', 'text-red-400', 'text-orange-400', 'text-green-400', 'text-green-400'];

// Live strength bar and rule checklist shown under a password field.
export function PasswordStrength({ value }) {
  const { results, level, label } = checkPassword(value);
  return h`<div className="sm:col-span-2 rounded-lg border border-bd p-3 text-xs">
    <div className="flex items-center justify-between mb-2">
      <span className="text-mu">Password strength</span>
      <span className=${'font-semibold ' + LEVEL_TEXT[level]}>${value ? label : 'Not entered'}</span>
    </div>
    <div className="flex gap-1 mb-3">${[1, 2, 3, 4].map(step => h`<div key=${step}
      className=${'h-1.5 flex-1 rounded-full ' + (level >= step ? LEVEL_COLOURS[level] : 'bg-bd')}></div>`)}</div>
    <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1">${results.map(item => h`<li key=${item.label}
      className=${item.ok ? 'text-green-400' : value ? 'text-red-400' : 'text-mu'}>
      ${item.ok ? '✓' : '•'} ${item.label}</li>`)}</ul>
  </div>`;
}
