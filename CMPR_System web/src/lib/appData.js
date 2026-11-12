import { ACC0 } from '../data/accounts';
import { AUD0 } from '../data/audit';
import { CMP0 } from '../data/complaints';
import { OFF0 } from '../data/officers';
import { STN } from '../data/stations';
import { U0 } from '../data/users';
import { REGISTRATION_STATUSES } from './registration';

export const APP_DATA_STORAGE_KEY = 'pcms-demo-data-v1';

const NOTIFICATIONS0 = [
  { id: 'NTF-001', role: 'citizen', m: 'Complaint CMP-2026-0102 was assigned to an officer.', read: false },
  { id: 'NTF-002', role: 'citizen', m: 'Your complaint CMP-2026-0103 is under review.', read: false },
  { id: 'NTF-003', role: 'station', m: 'New complaint CMP-2026-0105 received.', read: false },
  { id: 'NTF-004', role: 'station', m: 'Investigation completed on CMP-2026-0107. Review required.', read: false },
  { id: 'NTF-005', role: 'officer', m: 'CMP-2026-0102 assigned to you.', read: false },
  { id: 'NTF-006', role: 'admin', m: 'Monthly report is ready.', read: true },
];

export const INITIAL_APP_DATA = {
  complaints: CMP0,
  users: U0,
  accounts: ACC0,
  stations: STN,
  officers: OFF0,
  notifications: NOTIFICATIONS0,
  audit: AUD0,
  registrationApplications: [],
};

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const hasStringFields = (value, fields) => isRecord(value)
  && fields.every(field => typeof value[field] === 'string' && value[field].length > 0);
const isEntityList = (value, fields) => Array.isArray(value)
  && value.every(item => hasStringFields(item, fields))
  && new Set(value.map(item => item.id || item.code)).size === value.length;
const isNotifications = value => Array.isArray(value)
  && value.every(item => hasStringFields(item, ['id', 'role', 'm']) && typeof item.read === 'boolean')
  && new Set(value.map(item => item.id)).size === value.length;
const hasCredential = user => (typeof user.password === 'string' && user.password.length > 0)
  || (typeof user.passwordSalt === 'string' && user.passwordSalt.length > 0
    && typeof user.passwordHash === 'string' && user.passwordHash.length > 0);
const isUsers = value => {
  if (!isRecord(value)
    || !['admin', 'station', 'officer', 'citizen'].every(role => hasStringFields(value[role], ['id', 'name', 'email']))
    || !Array.isArray(value.citizens)
    || Object.prototype.hasOwnProperty.call(value.citizen, 'documentNumber')
    || !value.citizens.every(user => hasStringFields(user, ['id', 'name', 'email', 'nic', 'tel', 'addr'])
      && user.role === 'citizen' && user.status === 'Approved'
      && !Object.prototype.hasOwnProperty.call(user, 'documentNumber'))) return false;

  const allUsers = ['admin', 'station', 'officer', 'citizen'].map(role => value[role]).concat(value.citizens);
  const emails = allUsers.map(user => user.email.trim().toLowerCase());
  const ids = allUsers.map(user => user.id);
  const nics = [value.citizen, ...value.citizens].map(user => user.nic?.trim().toUpperCase());
  return allUsers.every(hasCredential)
    && new Set(emails).size === emails.length
    && new Set(ids).size === ids.length
    && new Set(nics).size === nics.length;
};
const isRegistrationApplications = value => Array.isArray(value)
  && value.every(application => hasStringFields(application, [
    'id', 'referenceNumber', 'applicantId', 'fullName', 'nic', 'documentType',
    'dateOfBirth', 'gender', 'email', 'mobile', 'address', 'district', 'status',
    'submittedAt', 'passwordSalt', 'passwordHash',
  ]) && !Object.prototype.hasOwnProperty.call(application, 'documentNumber')
    && REGISTRATION_STATUSES.includes(application.status)
    && Array.isArray(application.documentSlots)
    && application.documentSlots.every(slot => typeof slot === 'string')
    && Array.isArray(application.reviewHistory))
  && new Set(value.map(application => application.id)).size === value.length
  && new Set(value.map(application => application.referenceNumber)).size === value.length;

const normalizeUsers = saved => {
  if (!isRecord(saved)) return saved;
  const users = { ...INITIAL_APP_DATA.users, ...saved };
  for (const role of ['admin', 'station', 'officer', 'citizen']) {
    const stored = isRecord(saved[role]) ? saved[role] : {};
    users[role] = {
      ...INITIAL_APP_DATA.users[role],
      ...stored,
      password: typeof stored.password === 'string' && stored.password
        ? stored.password
        : INITIAL_APP_DATA.users[role].password,
    };
    if (role === 'citizen') delete users[role].documentNumber;
  }
  if (!Object.prototype.hasOwnProperty.call(saved, 'citizens')) users.citizens = [];
  else if (Array.isArray(saved.citizens)) {
    users.citizens = saved.citizens.map(user => {
      if (!isRecord(user)) return user;
      const citizen = { ...user, status: user.status || 'Approved' };
      delete citizen.documentNumber;
      return citizen;
    });
  }
  return users;
};

const normalizeRegistrationApplications = saved => Array.isArray(saved)
  ? saved.map(application => {
    if (!isRecord(application)) return application;
    const normalized = { ...application };
    delete normalized.documentNumber;
    return normalized;
  })
  : saved;

const VALIDATORS = {
  complaints: value => isEntityList(value, ['id', 'title', 'cit', 'stationCode'])
    && value.every(item => typeof item.citizenId === 'string'),
  users: isUsers,
  accounts: value => isEntityList(value, ['id', 'name', 'station', 'stationCode']),
  stations: value => isEntityList(value, ['code', 'name', 'district']),
  officers: value => isEntityList(value, ['id', 'name', 'station', 'stationCode']),
  notifications: isNotifications,
  audit: value => isEntityList(value, ['id', 'user', 'role', 'action', 'desc', 'dt', 'ip']),
  registrationApplications: isRegistrationApplications,
};

export function loadAppData() {
  if (typeof window === 'undefined') return INITIAL_APP_DATA;

  let saved;
  try {
    const raw = window.localStorage.getItem(APP_DATA_STORAGE_KEY);
    if (raw === null) return INITIAL_APP_DATA;
    saved = JSON.parse(raw);
  } catch (error) {
    console.warn('Saved demo data could not be read; using the sample data.', error);
    return INITIAL_APP_DATA;
  }

  if (!isRecord(saved)) {
    console.warn('Saved demo data has an invalid format; using the sample data.');
    return INITIAL_APP_DATA;
  }

  return Object.keys(INITIAL_APP_DATA).reduce((data, key) => {
    if (!Object.prototype.hasOwnProperty.call(saved, key)) return data;
    const value = key === 'users'
      ? normalizeUsers(saved[key])
      : key === 'registrationApplications'
        ? normalizeRegistrationApplications(saved[key])
        : saved[key];
    if (!VALIDATORS[key](value)) {
      console.warn(`Saved demo ${key} data is invalid; using the sample data for that collection.`);
      return data;
    }
    return { ...data, [key]: value };
  }, INITIAL_APP_DATA);
}

export function persistAppData(data) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(APP_DATA_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Demo data could not be saved to localStorage.', error);
  }
}
