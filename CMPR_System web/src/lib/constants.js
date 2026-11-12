export const TODAY='2026-11-11';
export const ST=['Submitted','Received','Under Review','Additional Info Requested','Accepted','Assigned','Under Investigation','Investigation Completed','Resolved / Closed','Rejected'];
export const SC={Submitted:'y',Received:'y','Under Review':'o','Additional Info Requested':'o',Accepted:'s',Assigned:'p','Under Investigation':'r','Investigation Completed':'g','Resolved / Closed':'g',Rejected:'x'};
export const BG={y:'bg-yellow-500/15 text-yellow-400',o:'bg-orange-500/15 text-orange-400',s:'bg-sky-400/15 text-sky-400',p:'bg-purple-500/15 text-purple-400',r:'bg-red-500/15 text-red-400',g:'bg-green-500/15 text-green-400',x:'bg-gray-500/20 text-gray-400'};
export const PC={High:'r',Medium:'o',Low:'g'};
export const GL=['Pending','In review','Investigation','Resolved','Rejected'],GC=['#EAB308','#F97316','#DC2626','#22C55E','#6B7280'];
export const INP='w-full bg-ip border border-bd rounded-lg px-3 py-2 text-sm text-tx outline-none focus:border-pr';
export const B1='px-3 py-1.5 rounded-lg text-xs font-medium bg-pr hover:bg-ph text-white min-h-[36px]';
export const B2='px-3 py-1.5 rounded-lg text-xs font-medium border border-bd hover:bg-ip text-tx min-h-[36px]';
export const NAV={admin:[['dash','Dashboard','home'],['registrations','Citizen Registration Requests','file'],['stations','Police Stations','shield'],['accounts','Station Accounts','user'],['officers','Police Officers','user'],['complaints','Complaints Overview','file'],['audit','Audit Logs','file'],['reports','Reports and Analytics','chart'],['settings','Settings','settings']],station:[['dash','Dashboard','home'],['incoming','Incoming Complaints','file'],['validation','Complaint Validation','check'],['assigned','Assigned Complaints','file'],['officers','Police Officers','user'],['history','Complaint History','file'],['reports','Reports','chart'],['profile','Profile','user']],officer:[['dash','Dashboard','home'],['mine','My Assigned Complaints','file'],['updates','Investigation Updates','plus'],['completed','Completed Complaints','check'],['profile','Profile','user']],citizen:[['home','Home','home'],['submit','Submit Complaint','plus'],['my','My Complaints','file'],['track','Complaint Tracking','shield'],['profile','Profile','user']]};
export const RL={admin:'Super Administrator',station:'Police Station Account',officer:'Police Officer',citizen:'Citizen'};
export const IDX={Submitted:0,Received:1,'Under Review':2,'Additional Info Requested':2,Accepted:2,Assigned:3,'Under Investigation':4,'Investigation Completed':5,'Resolved / Closed':6};

export const PORTALS={staff:{title:'Staff Administration Portal',sub:'For Super Administrators and Police Station Accounts',roles:['admin','station']},public:{title:'Citizen and Officer Portal',sub:'For Citizens and Police Officers',roles:['citizen','officer']}};
export const PORTAL_OF={admin:'staff',station:'staff',citizen:'public',officer:'public'};
