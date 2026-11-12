import { h } from '../lib/h';
import { CT } from '../components/complaints/ComplaintTable';
import { Pg } from '../components/ui/Primitives';
import { AdDash } from '../features/admin/AdminDashboard';
import { Audit } from '../features/admin/AuditLogs';
import { CompOv } from '../features/admin/ComplaintsOverview';
import { Crud } from '../features/admin/ManageUsers';
import { Stations } from '../features/admin/PoliceStations';
import { Reports } from '../features/admin/ReportsAnalytics';
import { Settings } from '../features/admin/Settings';
import { CitHome } from '../features/citizen/CitizenHome';
import { Track } from '../features/citizen/ComplaintTracking';
import { Submit } from '../features/citizen/SubmitComplaint';
import { OfDash } from '../features/officer/OfficerDashboard';
import { Notifs } from '../features/shared/Notifications';
import { Profile } from '../features/shared/Profile';
import { StDash } from '../features/station/StationDashboard';
import { Officers } from '../features/station/StationOfficers';
import { mine } from '../lib/helpers';

export const PAGES={admin:{dash:AdDash,stations:Stations,accounts:S=>h`<${Crud} S=${S.S} kind="acc"/>`,officers:S=>h`<${Crud} S=${S.S} kind="off"/>`,complaints:CompOv,audit:Audit,reports:Reports,settings:Settings},
station:{dash:StDash,incoming:({S})=>h`<${Pg} t="Incoming complaints" sub="All complaints received by your station"/><${CT} S=${S} rows=${mine(S)} keys=${['id','cit','cat','date','prio','status']} btn="Review"/>`,validation:({S})=>h`<${Pg} t="Complaint validation" sub="Accept, reject or request more information, then assign"/><${CT} S=${S} rows=${mine(S).filter(c=>['Submitted','Received','Under Review','Additional Info Requested','Accepted'].includes(c.status))} keys=${['id','title','cit','date','prio','status']} btn="Review"/>`,assigned:({S})=>h`<${Pg} t="Assigned complaints" sub="Monitor investigation progress"/><${CT} S=${S} rows=${mine(S).filter(c=>c.off&&['Assigned','Under Investigation','Investigation Completed'].includes(c.status))} keys=${['id','off','ad','status','upd']} btn="View progress"/>`,officers:Officers,history:({S})=>h`<${Pg} t="Complaint history"/><${CT} S=${S} rows=${mine(S).filter(c=>['Resolved / Closed','Rejected'].includes(c.status))} keys=${['id','title','cat','date','status']} btn="View"/>`,reports:({S})=>h`<${Reports} S=${S} rows=${mine(S)} title="Station reports"/>`,notifs:Notifs,profile:Profile},
officer:{dash:OfDash,mine:({S})=>h`<${Pg} t="My assigned complaints" sub="Only complaints assigned to you"/><${CT} S=${S} rows=${mine(S)} keys=${['id','title','cat','ad','prio','status']}/>`,updates:({S})=>h`<${Pg} t="Investigation updates" sub="Add progress or send completed work to the station"/><${CT} S=${S} rows=${mine(S).filter(c=>['Assigned','Under Investigation'].includes(c.status))} keys=${['id','title','status','upd']} btn="Add update"/>`,completed:({S})=>h`<${Pg} t="Completed complaints"/><${CT} S=${S} rows=${mine(S).filter(c=>['Investigation Completed','Resolved / Closed'].includes(c.status))} keys=${['id','title','cat','upd','status']} btn="View"/>`,notifs:Notifs,profile:Profile},
citizen:{home:CitHome,submit:Submit,my:({S})=>h`<${Pg} t="My complaints"/><${CT} S=${S} rows=${mine(S)} keys=${['id','title','date','stn','status']}/>`,track:Track,notifs:Notifs,profile:Profile}};
