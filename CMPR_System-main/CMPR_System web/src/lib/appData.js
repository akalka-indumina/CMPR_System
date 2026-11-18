import { U0 } from '../data/users';
import {
  REGISTRATION_STATUSES,
  SRI_LANKA_DISTRICTS,
} from './registration';

export const APP_DATA_STORAGE_KEY = 'pcms-app-data-v3';
const LEGACY_APP_DATA_STORAGE_KEYS = ['pcms-demo-data-v1', 'pcms-app-data-v2'];

export const INITIAL_APP_DATA = {
  complaints: [],
  users: U0,
  administrators: [],
  citizens: [],
  accounts: [],
  stations: [],
  officers: [],
  notifications: [],
  audit: [],
  registrationApplications: [],
};

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const hasStringFields = (value, fields) => isRecord(value)
  && fields.every(field => typeof value[field] === 'string' && value[field].length > 0);
const isEntityList = (value, fields) => Array.isArray(value)
  && value.every(item => hasStringFields(item, fields))
  && new Set(value.map(item => item.id || item.code)).size === value.length;
const isUsers = value => Array.isArray(value)
  && value.every(user => hasStringFields(user, ['id', 'email', 'role', 'profileId'])
    && ['admin', 'station', 'officer', 'citizen'].includes(user.role)
    && typeof user.active === 'boolean'
    && !Object.prototype.hasOwnProperty.call(user, 'password')
    && ((user.passwordSalt === undefined && user.passwordHash === undefined && !user.active)
      || (typeof user.passwordSalt === 'string' && user.passwordSalt.length > 0
        && typeof user.passwordHash === 'string' && user.passwordHash.length > 0)))
  && new Set(value.map(user => user.id)).size === value.length
  && new Set(value.map(user => user.email.trim().toLowerCase())).size === value.length;
const isNotifications = value => Array.isArray(value)
  && value.every(item => hasStringFields(item, ['id', 'role', 'm']) && typeof item.read === 'boolean')
  && new Set(value.map(item => item.id)).size === value.length;
const isRegistrationApplications = value => Array.isArray(value)
  && value.every(application => hasStringFields(application, [
    'id', 'referenceNumber', 'applicantId', 'fullName', 'identityNumber', 'documentType',
    'dateOfBirth', 'gender', 'email', 'mobile', 'address', 'district', 'status',
    'submittedAt', 'passwordSalt', 'passwordHash',
  ]) && typeof application.nic === 'string'
    && !Object.prototype.hasOwnProperty.call(application, 'documentNumber')
    && ['NIC', 'Driving Licence'].includes(application.documentType)
    && SRI_LANKA_DISTRICTS.includes(application.district)
    && REGISTRATION_STATUSES.includes(application.status)
    && Array.isArray(application.documentSlots)
    && application.documentSlots.every(slot => typeof slot === 'string')
    && Array.isArray(application.reviewHistory))
  && new Set(value.map(application => application.id)).size === value.length
  && new Set(value.map(application => application.referenceNumber)).size === value.length;

const normalizeRegistrationApplications = saved => Array.isArray(saved)
  ? saved.map(application => {
    if (!isRecord(application)) return application;
    const documentType = ['NIC', 'Driving Licence'].includes(application.documentType)
      ? application.documentType
      : 'NIC';
    const identityNumber = application.identityNumber || application.nic || '';
    const normalized = {
      ...application,
      documentType,
      identityNumber,
      nic: documentType === 'NIC' ? (application.nic || identityNumber) : '',
    };
    delete normalized.documentNumber;
    return normalized;
  })
  : saved;

const VALIDATORS = {
  complaints: value => isEntityList(value, ['id', 'title', 'cit', 'stationCode'])
    && value.every(item => typeof item.citizenId === 'string'),
  users: isUsers,
  administrators: value => isEntityList(value, ['id', 'name']),
  citizens: value => isEntityList(value, ['id', 'name', 'tel', 'addr'])
    && value.every(citizen => typeof citizen.status === 'string'
      && typeof citizen.identityNumber === 'string'
      && (citizen.district === undefined || SRI_LANKA_DISTRICTS.includes(citizen.district))),
  accounts: value => isEntityList(value, ['id', 'name', 'station', 'stationCode']),
  stations: value => isEntityList(value, ['code', 'name', 'district']),
  officers: value => isEntityList(value, ['id', 'name', 'station', 'stationCode']),
  notifications: isNotifications,
  audit: value => isEntityList(value, ['id', 'user', 'role', 'action', 'desc', 'dt'])
    && value.every(item => typeof item.ip === 'string'),
  registrationApplications: isRegistrationApplications,
};

export function loadAppData() {
  if (typeof window === 'undefined') return INITIAL_APP_DATA;

  let saved;
  try {
    LEGACY_APP_DATA_STORAGE_KEYS.forEach(key => window.localStorage.removeItem(key));
    const raw = window.localStorage.getItem(APP_DATA_STORAGE_KEY);
    if (raw === null) return INITIAL_APP_DATA;
    saved = JSON.parse(raw);
  } catch (error) {
    console.warn('Saved application data could not be read; using empty defaults.', error);
    return INITIAL_APP_DATA;
  }

  if (!isRecord(saved)) {
    console.warn('Saved application data has an invalid format; using empty defaults.');
    return INITIAL_APP_DATA;
  }

  return Object.keys(INITIAL_APP_DATA).reduce((data, key) => {
    if (!Object.prototype.hasOwnProperty.call(saved, key)) return data;
    const value = key === 'registrationApplications'
      ? normalizeRegistrationApplications(saved[key])
      : saved[key];
    if (!VALIDATORS[key](value)) {
      console.warn(`Saved ${key} data is invalid; using empty defaults for that collection.`);
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

const SHARED_DATA_ENDPOINT = '/api/data';
const SHARED_DOCUMENT_ENDPOINT = '/api/documents';

async function sharedDataRequest(method, data) {
  const response = await fetch(SHARED_DATA_ENDPOINT, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || `Shared demo data request failed (${response.status}).`);
  }
  return result.data;
}

export async function initializeSharedAppData(data, portal) {
  const existingData = await loadSharedAppData();
  if (existingData) return existingData;
  if (portal === 'staff') await new Promise(resolve => setTimeout(resolve, 1500));
  return sharedDataRequest('POST', data);
}

export async function loadSharedAppData() {
  const response = await fetch(SHARED_DATA_ENDPOINT);
  if (response.status === 404) return null;
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || `Shared demo data request failed (${response.status}).`);
  }
  return result.data;
}

export async function persistSharedAppData(data) {
  return sharedDataRequest('PUT', data);
}

const readFileAsDataUrl = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(reader.error || new Error('Could not read the registration document.'));
  reader.readAsDataURL(file);
});

export async function saveSharedRegistrationDocuments(applicationId, files) {
  const documents = {};
  for (const [slot, file] of Object.entries(files)) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const type = file.type || (extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : 'image/png');
    documents[slot] = { name: file.name, type, dataUrl: await readFileAsDataUrl(file) };
  }
  const response = await fetch(`${SHARED_DOCUMENT_ENDPOINT}/${encodeURIComponent(applicationId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documents }),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || `Registration document upload failed (${response.status}).`);
  }
}

export async function loadSharedRegistrationDocuments(applicationId) {
  const response = await fetch(`${SHARED_DOCUMENT_ENDPOINT}/${encodeURIComponent(applicationId)}`);
  if (response.status === 404) return null;
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || `Registration document request failed (${response.status}).`);
  }
  return Object.fromEntries(Object.entries(result.documents || {}).map(([slot, document]) => [slot, document.dataUrl]));
}

export async function deleteSharedRegistrationDocuments(applicationId) {
  const response = await fetch(`${SHARED_DOCUMENT_ENDPOINT}/${encodeURIComponent(applicationId)}`, {
    method: 'DELETE',
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || `Registration document cleanup failed (${response.status}).`);
  }
}
