// Helpers for Police Station Accounts: automatic Account ID and password strength.

// "Nuwara Eliya" -> "NuwaraEliya", "Dam Street" -> "DamStreet"
const compact = text => String(text || '')
  .split(/[^A-Za-z0-9]+/)
  .filter(Boolean)
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join('');

export const accountIdPrefix = (district, stationName) => compact(district) + compact(stationName);

// Next Account ID for a station, e.g. ColomboHomagama001, ColomboHomagama002, ...
// The number continues after the highest existing number, so an ID is never reused.
export function buildAccountId(accounts, district, stationName) {
  const prefix = accountIdPrefix(district, stationName);
  if (!prefix) return '';
  const pattern = new RegExp(`^${prefix}(\\d+)$`, 'i');
  const highest = accounts.reduce((max, account) => {
    const match = pattern.exec(account.id);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `${prefix}${String(highest + 1).padStart(3, '0')}`;
}

export const PASSWORD_RULES = [
  ['At least 8 characters', value => value.length >= 8],
  ['One uppercase letter (A-Z)', value => /[A-Z]/.test(value)],
  ['One lowercase letter (a-z)', value => /[a-z]/.test(value)],
  ['One number (0-9)', value => /\d/.test(value)],
  ['One special character (such as ! @ # $ %)', value => /[^A-Za-z0-9\s]/.test(value)],
  ['No spaces', value => !/\s/.test(value)],
];

export function checkPassword(value) {
  const results = PASSWORD_RULES.map(([label, test]) => ({ label, ok: test(value) }));
  const passed = results.filter(item => item.ok).length;
  const strong = passed === PASSWORD_RULES.length;
  let level = 0;
  if (value) level = strong ? (value.length >= 12 ? 4 : 3) : passed >= 4 ? 2 : 1;
  const labels = ['', 'Weak', 'Fair', 'Strong', 'Very strong'];
  return { results, strong, level, label: labels[level] };
}

export const POLICE_RANKS = [
  'Chief Inspector of Police (CI)',
  'Inspector of Police (IP)',
  'Sub Inspector of Police (SI)',
  'Sergeant Major (SM)',
  'Police Sergeant Class 1 (PS)',
  'Police Sergeant Class 2 (PS)',
  'Police Constable Class 1 (PC)',
  'Police Constable Class 2 (PC)',
  'Police Constable Class 3 (PC)',
  'Police Constable Class 4 (PC)',
];
