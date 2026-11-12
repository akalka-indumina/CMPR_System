export const REGISTRATION_STATUSES = ['Pending Review', 'Approved', 'Rejected', 'Resubmitted'];

export const nextRegistrationReference = applications => {
  const year = new Date().getFullYear();
  const prefix = `REG-${year}-`;
  const used = new Set(applications.map(application => application.referenceNumber));
  let number = applications.reduce((max, application) => {
    if (!application.referenceNumber.startsWith(prefix)) return max;
    const value = Number(application.referenceNumber.slice(prefix.length));
    return Number.isSafeInteger(value) ? Math.max(max, value) : max;
  }, 0) + 1;
  let referenceNumber = `${prefix}${String(number).padStart(5, '0')}`;
  while (used.has(referenceNumber)) {
    number += 1;
    referenceNumber = `${prefix}${String(number).padStart(5, '0')}`;
  }
  return referenceNumber;
};

export const maskNic = value => value.length <= 4
  ? value
  : `${'\u2022'.repeat(Math.min(8, value.length - 4))}${value.slice(-4)}`;
