// roles.js - small constants shared by the server files (no imports, easy to test).
export const PROFILE_COLLECTIONS = {
  admin: 'administrators',
  station: 'accounts',
  officer: 'officers',
  citizen: 'citizens',
};

export const PORTAL_ROLES = {
  staff: ['admin', 'station', 'officer'],
  public: ['citizen'],
};
