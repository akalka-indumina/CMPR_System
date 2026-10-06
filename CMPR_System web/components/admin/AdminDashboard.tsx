"use client";

import { useState } from "react";
import { Icon } from "@/components/shared/Icon";

type AdminPage = "dashboard" | "stations" | "officers" | "accounts" | "reports" | "audit" | "notifications" | "settings";

const nav: { page: AdminPage; label: string; icon: Parameters<typeof Icon>[0]["name"] }[] = [
  { page: "dashboard", label: "Dashboard", icon: "dashboard" },
  { page: "stations", label: "Police Stations", icon: "cases" },
  { page: "officers", label: "Police Officers", icon: "officers" },
  { page: "accounts", label: "Account Management", icon: "profile" },
  { page: "reports", label: "System Reports", icon: "trend" },
  { page: "audit", label: "Audit Logs", icon: "audit" },
  { page: "notifications", label: "Notifications", icon: "bell" },
  { page: "settings", label: "Settings", icon: "gear" },
];

const pageDescriptions: Record<AdminPage, string> = {
  dashboard: "System administration overview",
  stations: "Manage registered police stations",
  officers: "Manage officer accounts and organization",
  accounts: "Authorized system account administration",
  reports: "System-wide performance and statistics",
  audit: "Secure record of system actions",
  notifications: "Security and system notifications",
  settings: "Administrative profile and security",
};

function AdminMark() {
  return <div className="admin-mark"><svg viewBox="0 0 34 40" aria-hidden="true"><path d="M17 1.5 31 6.7v11.1c0 9.5-5.8 16.9-14 20.5C8.8 34.7 3 27.3 3 17.8V6.7L17 1.5Z" fill="currentColor" /><path d="M10 18h14M12 18v9m5-9v9m5-9v9M9 27h16M17 8l8 6H9l8-6Z" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg></div>;
}

function AdminShellHeader({ page, setPage, onLogout }: { page: AdminPage; setPage: (p: AdminPage) => void; onLogout: () => void }) {
  const [notices, setNotices] = useState(false);
  const [profile, setProfile] = useState(false);
  const [confirm, setConfirm] = useState(false);
  return <>
    <header className="admin-topbar">
      <div className="admin-mobile-brand"><AdminMark /><strong>Community Safety</strong></div>
      <div className="topbar-page-title"><strong>{nav.find(n => n.page === page)?.label}</strong><span>Super Admin <i>/</i> {pageDescriptions[page]}</span></div>
      <div className="admin-header-actions">
        <div className="dropdown-anchor">
          <button className="admin-bell" onClick={() => { setNotices(!notices); setProfile(false); }} aria-label="Notifications, 5 unread" type="button"><Icon name="bell" /><span>5</span></button>
          {notices && <div className="header-dropdown notification-dropdown admin-dropdown">
            <div className="dropdown-title"><strong>System Notifications</strong><span>5 unread</span></div>
            {[
              ["alert","Security alert","Multiple failed logins detected for PS-015"],
              ["profile","Account change","Officer PO-104 account was deactivated"],
              ["cases","Station requires attention","PS-025 account configuration is incomplete"],
              ["activity","Important system event","Scheduled security scan completed"],
            ].map(([icon,title,copy]) => <button className="admin-notice-row" key={title} onClick={() => { setPage("notifications"); setNotices(false); }} type="button"><i><Icon name={icon as Parameters<typeof Icon>[0]["name"]} /></i><span><strong>{title}</strong><small>{copy}</small></span></button>)}
            <button className="dropdown-footer" onClick={() => { setPage("notifications"); setNotices(false); }} type="button">View All Notifications <span>→</span></button>
          </div>}
        </div>
        <div className="topbar-divider" />
        <div className="dropdown-anchor">
          <button className="profile-button admin-profile-button" onClick={() => { setProfile(!profile); setNotices(false); }} type="button"><span className="admin-avatar">SA</span><span className="profile-copy"><strong>System Administrator</strong><small>Super Admin</small></span><Icon name="chevron" /></button>
          {profile && <div className="header-dropdown profile-dropdown admin-dropdown"><div className="dropdown-profile"><span className="admin-avatar">SA</span><div><strong>System Administrator</strong><span>ADM-001 · Super Admin</span></div></div><button onClick={() => { setPage("settings"); setProfile(false); }} type="button"><Icon name="profile" />Profile</button><button onClick={() => { setPage("settings"); setProfile(false); }} type="button"><Icon name="gear" />Settings</button><hr /><button className="logout-menu-item" onClick={() => { setConfirm(true); setProfile(false); }} type="button"><Icon name="logout" />Logout</button></div>}
        </div>
      </div>
    </header>
    {confirm && <div className="modal-backdrop"><div className="logout-modal admin-logout-modal" role="dialog" aria-modal="true"><div className="modal-icon"><Icon name="logout" /></div><h2>Are you sure you want to log out?</h2><p>Your Super Admin session will be securely ended. You will need your Admin ID and password to sign in again.</p><div className="modal-actions"><button onClick={() => setConfirm(false)} type="button">Cancel</button><button onClick={onLogout} type="button">Logout</button></div></div></div>}
  </>;
}

function AStatus({ children }: { children: string }) {
  return <span className={`admin-status as-${children.toLowerCase().replaceAll(" ","-")}`}>{children}</span>;
}

function APanel({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className="admin-panel"><header><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</header>{children}</section>;
}

function AdminIntro({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="admin-intro"><div><p>Police IT Head Office</p><h1>{title}</h1><span>{description}</span></div>{action || <div className="admin-clearance"><Icon name="shield" /><span><strong>Super Admin Access</strong>System-wide administrative scope</span></div>}</div>;
}

function AdminStats({ items }: { items: [string,string,string][] }) {
  return <div className="admin-stats">{items.map(([label,value,tone]) => <article key={label}><span className={tone}><Icon name={tone === "green" ? "check" : tone === "red" ? "alert" : tone === "gold" ? "shield" : "profile"} /></span><div><small>{label}</small><strong>{value}</strong><p>{tone === "red" ? "Requires review" : "System-wide"}</p></div></article>)}</div>;
}

const stationRows = [
  ["PS-001","Negombo Police Station","Negombo, Western","031 222 2222","24","18","Active"],
  ["PS-002","Colombo Fort Police Station","Colombo, Western","011 242 1052","42","31","Active"],
  ["PS-003","Kandy Police Station","Kandy, Central","081 222 2222","19","12","Active"],
  ["PS-008","Galle Police Station","Galle, Southern","091 223 3333","28","16","Attention"],
  ["PS-015","Jaffna Police Station","Jaffna, Northern","021 222 2222","21","9","Inactive"],
];

const officerRows = [
  ["PO-024","Kasun Perera","Police Constable","Negombo · PS-001","071 234 5678","Active","On Duty"],
  ["PO-031","Nimali Silva","Sergeant","Negombo · PS-001","077 456 7890","Active","On Duty"],
  ["PO-072","Ruwan Fernando","Sub Inspector","Galle · PS-008","075 987 4321","Active","Off Duty"],
  ["PO-104","Dilshan Perera","Police Constable","Colombo · PS-002","076 345 8761","Inactive","Off Duty"],
  ["PO-118","Tharushi De Mel","Inspector","Kandy · PS-003","071 765 2341","Active","On Duty"],
];

function AdminTable({ headers, rows, actions }: { headers: string[]; rows: string[][]; actions?: (row: string[]) => React.ReactNode }) {
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr>{headers.map(h => <th key={h}>{h}</th>)}{actions && <th>Action</th>}</tr></thead><tbody>{rows.map(row => <tr key={row[0]}>{row.map((cell,i) => <td key={i}>{i === 0 ? <strong>{cell}</strong> : i === row.length-1 && ["Active","Inactive","Attention","On Duty","Off Duty"].includes(cell) ? <AStatus>{cell}</AStatus> : cell}</td>)}{actions && <td>{actions(row)}</td>}</tr>)}</tbody></table></div>;
}

function DashboardPage({ setPage }: { setPage: (p: AdminPage) => void }) {
  const [stationPopup, setStationPopup] = useState(false);
  return <>
    <AdminIntro title="Welcome, System Administrator" description="Police System Administration Overview" action={<div className="admin-date"><span>30</span><div><strong>September 2026</strong><small>Wednesday · System operational</small></div></div>} />
    <AdminStats items={[["Total Police Stations","24","gold"],["Active Police Stations","22","green"],["Total Police Officers","486","blue"],["Active Officers","451","green"],["Station Accounts","24","purple"],["Pending Account Actions","5","red"]]} />
    <div className="admin-grid">
      <APanel title="Police Station Overview" subtitle="Registered stations and current operational state" action={<button className="admin-link" onClick={() => setPage("stations")} type="button">View All Police Stations →</button>}>
        <AdminTable headers={["Station ID","Station Name","Officers","Active Cases","Account Status"]} rows={stationRows.slice(0,3).map(r => [r[0],r[1],`${r[4]} Officers`,`${r[5]} Active Cases`,r[6]])} actions={() => <button className="admin-row-action" onClick={() => setPage("stations")} type="button">View</button>} />
      </APanel>
      <APanel title="Officer Account Overview" subtitle="System-wide workforce status"><div className="admin-donut-area"><div className="admin-donut"><div><strong>486</strong><span>Officers</span></div></div><div className="admin-chart-legend">{[["Active","451"],["Inactive","35"],["On Duty","312"],["Off Duty","174"]].map(([a,b],i)=><div key={a}><span><i className={`legend-${i}`} />{a}</span><strong>{b}</strong></div>)}</div></div></APanel>
      <APanel title="Complaint System Overview" subtitle="Aggregated statistics · No citizen information displayed"><div className="admin-complaint-summary">{[["Total","3,842"],["Under Review","312"],["Active","687"],["Completed","2,611"],["Rejected","232"]].map(([a,b])=><div key={a}><span>{a}</span><strong>{b}</strong></div>)}</div><div className="admin-line-chart"><div className="chart-y"><span>800</span><span>600</span><span>400</span><span>200</span><span>0</span></div><svg viewBox="0 0 500 150" preserveAspectRatio="none"><path className="grid-lines" d="M0 10h500M0 43h500M0 76h500M0 109h500M0 142h500" /><path className="area" d="M0 125 80 104 160 111 240 69 320 80 400 35 500 48V150H0Z" /><path className="line" d="M0 125 80 104 160 111 240 69 320 80 400 35 500 48" /></svg><div className="chart-x"><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span></div></div></APanel>
      <APanel title="Complaints by Category"><div className="category-bars">{[["Theft",72],["Property",54],["Traffic",48],["Assault",39],["Other",31]].map(([a,b])=><div key={a}><span>{a}</span><i><b style={{width:`${b}%`}} /></i><strong>{b}%</strong></div>)}</div></APanel>
      <APanel title="Police Station Network" subtitle="Administrative station status overview" action={<button className="admin-link" onClick={() => setPage("stations")} type="button">View network →</button>}><div className="admin-map"><svg viewBox="0 0 600 240" preserveAspectRatio="none"><path className="admin-map-land" d="M0 0h600v240H0z" /><path className="admin-map-road" d="M-20 200C90 155 117 41 245 77s172 112 375 34M105-10c58 62 94 109 69 260M323-10c-36 75 16 131 118 260M0 72c145 45 324 26 620 125" /></svg><button className="station-pin pin-1" onClick={() => setStationPopup(!stationPopup)} aria-label="Negombo Police Station" type="button"><Icon name="cases" /></button><button className="station-pin pin-2" type="button"><Icon name="cases" /></button><button className="station-pin pin-3 attention" type="button"><Icon name="cases" /></button><button className="station-pin pin-4 inactive" type="button"><Icon name="cases" /></button><button className="station-pin pin-5" type="button"><Icon name="cases" /></button>{stationPopup && <div className="station-map-popup"><strong>Negombo Police Station</strong><span>Station ID: PS-001</span><span>Officers: 24 · Active Cases: 18</span><AStatus>Active</AStatus><button onClick={() => setPage("stations")} type="button">View Station →</button></div>}<div className="admin-map-legend"><span><i />Active</span><span><i className="attention" />Attention</span><span><i className="inactive" />Inactive</span></div></div></APanel>
      <APanel title="System Alerts" subtitle="Items requiring administrative attention"><div className="admin-alert-list">{[["high","Multiple failed login attempts","Account PS-015 · 8 minutes ago"],["medium","Station account requires attention","PS-025 configuration incomplete"],["low","Station information requires updating","PS-008 · Contact record expired"]].map(([tone,title,copy])=><button key={title} type="button"><i className={tone}><Icon name="alert" /></i><span><strong>{title}</strong><small>{copy}</small></span><b>→</b></button>)}</div></APanel>
      <APanel title="Recent System Activity" action={<button className="admin-link" onClick={() => setPage("audit")} type="button">View Full Audit Logs →</button>}><div className="admin-activity">{[["10:32 AM","Admin created Police Station account PS-025"],["11:05 AM","Officer account PO-104 deactivated"],["11:30 AM","Officer PO-072 transferred to PS-008"],["12:15 PM","Police Station PS-001 updated information"],["1:05 PM","New Operations Officer account created"]].map(([t,c],i)=><div key={t}><i className={`event-${i}`}><Icon name={i===1?"alert":i===2?"officers":"activity"} /></i><span><strong>{c}</strong><small>{t} · Today</small></span></div>)}</div></APanel>
    </div>
  </>;
}

function AdminFilters({ type }: { type: "stations" | "officers" | "audit" }) {
  const fields = type === "stations" ? ["Station ID","Station Name","Status","Location"] : type === "officers" ? ["Officer ID","Officer Name","Police Station","Rank","Account Status","Duty Status"] : ["Date Range","User","Role","Action Type","Police Station","Complaint ID"];
  return <div className="admin-filters">{fields.map((f,i)=><label key={f}><span>{f}</span>{f.includes("ID") || f.includes("Name") || f === "User" ? <input placeholder={`Search ${f.toLowerCase()}`} /> : <select defaultValue=""><option value="">All {f.toLowerCase()}</option><option>Active</option><option>Inactive</option></select>}</label>)}<div><button className="admin-primary" type="button">Search</button><button type="button">Reset</button></div></div>;
}

function StationsPage() {
  const [mode,setMode] = useState<"list"|"details"|"add"|"edit">("list");
  if (mode === "details") return <><button className="admin-back" onClick={()=>setMode("list")} type="button">← Back to Police Stations</button><AdminIntro title="Negombo Police Station" description="Station information, account status, and administrative activity" action={<button className="admin-primary" onClick={()=>setMode("edit")} type="button">Edit Station</button>} /><div className="admin-detail-grid"><APanel title="Station Information"><div className="admin-info-grid">{[["Station ID","PS-001"],["Station Name","Negombo Police Station"],["Address","Main Street, Negombo"],["Contact","031 222 2222"],["Email","negombo@police.gov.lk"],["Status","Active"]].map(([a,b])=><div key={a}><span>{a}</span><strong>{b}</strong></div>)}</div></APanel><APanel title="Officer Summary"><div className="detail-metrics"><div><strong>24</strong><span>Total Officers</span></div><div><strong>22</strong><span>Active</span></div><div><strong>2</strong><span>Inactive</span></div></div></APanel><APanel title="Station Account"><div className="admin-info-grid">{[["Account ID","STA-PS001"],["Account Status","Active"],["Last Login","30 Sep · 07:42 AM"],["Created Date","14 Jan 2024"]].map(([a,b])=><div key={a}><span>{a}</span><strong>{b}</strong></div>)}</div></APanel><APanel title="Recent Station Activity"><div className="admin-activity compact">{["Station information updated","Officer PO-024 status changed","Complaint summary synchronized"].map((x,i)=><div key={x}><i><Icon name="activity" /></i><span><strong>{x}</strong><small>{i+1} hour ago</small></span></div>)}</div></APanel></div></>;
  if (mode === "add" || mode === "edit") return <><button className="admin-back" onClick={()=>setMode(mode==="edit"?"details":"list")} type="button">← Back</button><AdminIntro title={mode === "add" ? "Add Police Station" : "Edit Police Station"} description="Create and configure an authorized police station record." /><APanel title="Station Information" subtitle="All changes are recorded in system audit logs."><div className="admin-form">{["Police Station ID","Station Name","Address","Contact Number","Email","Service Area"].map((f,i)=><label className={f==="Address"?"wide":""} key={f}><span>{f}</span><input defaultValue={mode==="edit"?["PS-001","Negombo Police Station","Main Street, Negombo","031 222 2222","negombo@police.gov.lk","Negombo Municipal Area"][i]:""} placeholder={`Enter ${f.toLowerCase()}`} /></label>)}<label><span>Status</span><select><option>Active</option><option>Inactive</option><option>Requires Attention</option></select></label></div><div className="admin-form-actions"><button onClick={()=>setMode("list")} type="button">Cancel</button><button className="admin-primary" onClick={()=>setMode("details")} type="button">{mode==="add"?"Create Police Station":"Save Changes"}</button></div></APanel></>;
  return <><AdminIntro title="Police Stations" description="Manage and monitor registered police stations across the system." action={<button className="admin-primary" onClick={()=>setMode("add")} type="button">+ Add Police Station</button>} /><AdminStats items={[["Total Stations","24","gold"],["Active Stations","22","green"],["Inactive Stations","1","red"],["Requiring Attention","1","red"]]} /><AdminFilters type="stations" /><APanel title="Registered Police Stations" subtitle="24 stations across the national police network"><AdminTable headers={["Station ID","Station Name","Location","Contact","Officers","Active Cases","Status"]} rows={stationRows} actions={()=><div className="admin-table-actions"><button onClick={()=>setMode("details")} type="button">View</button><button onClick={()=>setMode("edit")} type="button">Edit</button></div>} /><TablePagination count="24 stations" /></APanel></>;
}

function OfficersPage() {
  const [mode,setMode] = useState<"list"|"details"|"add"|"edit">("list");
  const [inactive,setInactive] = useState(false);
  const [transfer,setTransfer] = useState(false);
  if (mode === "details") return <><button className="admin-back" onClick={()=>setMode("list")} type="button">← Back to Police Officers</button><AdminIntro title="Kasun Perera" description="Police Constable · PO-024 · Officer administrative record" action={<div className="admin-heading-actions"><button onClick={()=>setTransfer(true)} type="button">Transfer Station</button><button className="admin-primary" onClick={()=>setMode("edit")} type="button">Edit Officer</button></div>} /><div className="admin-detail-grid"><APanel title="Personal / Official Information"><div className="admin-info-grid">{[["Officer ID","PO-024"],["Full Name","Kasun Perera"],["Rank","Police Constable"],["Contact","071 234 5678"],["Email","kasun.perera@police.gov.lk"],["Official ID","NIC ••••••482V"]].map(([a,b])=><div key={a}><span>{a}</span><strong>{b}</strong></div>)}</div></APanel><APanel title="Current Workload"><div className="detail-metrics"><div><strong>4</strong><span>Active Complaints</span></div><div><strong>32</strong><span>Completed</span></div><div><strong>86%</strong><span>Resolution</span></div></div></APanel><APanel title="Organizational Information"><div className="admin-info-grid">{[["Police Station","Negombo · PS-001"],["Current Assignment","Patrol & Investigation"],["Account Status",inactive?"Inactive":"Active"],["Duty Status","On Duty"]].map(([a,b])=><div key={a}><span>{a}</span><strong>{b}</strong></div>)}</div><div className="account-danger"><span>Administrative account control</span><button onClick={()=>setInactive(!inactive)} type="button">{inactive?"Activate Account":"Deactivate Account"}</button></div></APanel><APanel title="Account Activity"><div className="admin-info-grid">{[["Last Login","30 Sep · 08:12 AM"],["Account Created","12 Feb 2024"],["Last Password Change","18 Aug 2026"],["Recent Action","Updated CMP-00118"]].map(([a,b])=><div key={a}><span>{a}</span><strong>{b}</strong></div>)}</div></APanel></div>{transfer && <AdminModal title="Transfer Police Station" copy="Officer PO-024 · Kasun Perera" onClose={()=>setTransfer(false)}><label><span>Current Station</span><input disabled value="Negombo Police Station · PS-001" readOnly /></label><label><span>New Police Station</span><select><option>Galle Police Station · PS-008</option><option>Kandy Police Station · PS-003</option></select></label><label><span>Transfer Reason</span><textarea placeholder="Enter authorized transfer reason..." /></label></AdminModal>}</>;
  if (mode === "add" || mode === "edit") return <><button className="admin-back" onClick={()=>setMode("list")} type="button">← Back</button><AdminIntro title={mode==="add"?"Add Police Officer":"Edit Police Officer"} description="Create and manage an authorized police officer account." /><APanel title="Officer Account Information" subtitle="No public registration is available. Accounts are created by Super Admin."><div className="admin-form">{["Officer ID","Full Name","NIC / Official Identification","Rank","Police Station","Contact Number","Email"].map(f=><label key={f}><span>{f}</span>{f==="Police Station"||f==="Rank"?<select><option>{f==="Rank"?"Police Constable":"Negombo Police Station · PS-001"}</option></select>:<input placeholder={`Enter ${f.toLowerCase()}`} />}</label>)}<label><span>Account Status</span><select><option>Active</option><option>Inactive</option></select></label></div><div className="admin-form-actions"><button onClick={()=>setMode("list")} type="button">Cancel</button><button className="admin-primary" onClick={()=>setMode("details")} type="button">{mode==="add"?"Create Police Officer":"Save Changes"}</button></div></APanel></>;
  return <><AdminIntro title="Police Officers" description="Manage police officer accounts and organizational information." action={<button className="admin-primary" onClick={()=>setMode("add")} type="button">+ Add Police Officer</button>} /><AdminStats items={[["Total Officers","486","gold"],["Active","451","green"],["Inactive","35","red"],["On Duty","312","green"],["Off Duty","174","blue"]]} /><AdminFilters type="officers" /><APanel title="Police Officer Directory" subtitle="System-wide authorized officer accounts"><AdminTable headers={["Officer ID","Name","Rank","Police Station","Contact","Account Status","Duty Status"]} rows={officerRows} actions={()=><div className="admin-table-actions"><button onClick={()=>setMode("details")} type="button">View</button><button onClick={()=>setMode("edit")} type="button">Edit</button></div>} /><TablePagination count="486 officers" /></APanel></>;
}

function AccountsPage() {
  const [tab,setTab] = useState<"station"|"officer"|"operations">("station");
  const [create,setCreate] = useState(false);
  const data = tab==="station" ? stationRows.slice(0,4).map(r=>[r[0],r[1],r[6],"30 Sep · 07:42 AM","14 Jan 2024"]) : tab==="officer" ? officerRows.slice(0,4).map(r=>[r[0],r[1],r[3],r[5],"30 Sep · 08:12 AM"]) : [["OPS-011","Malini De Silva","Negombo · PS-001","Active","30 Sep · 06:55 AM"],["OPS-018","Arun Jayasinghe","Colombo · PS-002","Active","29 Sep · 09:10 AM"],["OPS-024","S. Wickramasinghe","Kandy · PS-003","Inactive","24 Sep · 11:30 AM"]];
  return <><AdminIntro title="Account Management" description="Create, manage, activate, deactivate, and monitor authorized system accounts." action={<button className="admin-primary" onClick={()=>setCreate(true)} type="button">+ Create Account</button>} /><div className="account-security-note"><Icon name="shield" /><span><strong>Authorized account administration</strong>Every account change is recorded in the system audit log. Public registration is disabled.</span></div><APanel title="System Accounts" subtitle="Manage account access by authorized category"><div className="account-tabs">{[["station","Police Station Accounts"],["officer","Police Officer Accounts"],["operations","Operations Officer Accounts"]].map(([id,label])=><button className={tab===id?"active":""} onClick={()=>setTab(id as typeof tab)} key={id} type="button">{label}</button>)}</div><AdminTable headers={tab==="station"?["Station ID","Station Name","Status","Last Login","Created Date"]:tab==="officer"?["Officer ID","Name","Station","Status","Last Login"]:["User ID","Name","Police Station","Status","Last Login"]} rows={data} actions={()=><div className="account-action-menu"><button type="button">Manage Account</button><button aria-label="More account actions" type="button">•••</button></div>} /><TablePagination count={`${data.length} displayed accounts`} /></APanel>{create&&<AdminModal title="Create Authorized Account" copy="New account actions are automatically audited." onClose={()=>setCreate(false)}><label><span>Account Type</span><select><option>Police Station</option><option>Police Officer</option><option>Operations Officer</option></select></label><label><span>Account / User ID</span><input placeholder="Enter assigned identifier" /></label><label><span>Associated Station</span><select><option>Negombo Police Station · PS-001</option><option>Colombo Fort · PS-002</option></select></label><label><span>Temporary Password</span><input type="password" placeholder="Create secure temporary password" /></label></AdminModal>}</>;
}

function ReportsPage() {
  return <><AdminIntro title="System Reports" description="View administrative statistics and system-wide performance information." action={<div className="admin-heading-actions"><button type="button">Export Report</button><button className="admin-primary" type="button">Generate Report</button></div>} /><div className="report-filters"><span>Date range</span>{["Today","This Week","This Month","Custom Range"].map((x,i)=><button className={i===2?"active":""} key={x} type="button">{x}</button>)}</div><div className="report-grid">
    <APanel title="Police Stations by Status" subtitle="24 registered stations"><div className="report-donut"><div className="admin-donut"><div><strong>24</strong><span>Stations</span></div></div><div className="report-big-legend"><div><i className="active" /><span>Active<strong>22</strong></span></div><div><i className="attention" /><span>Attention<strong>1</strong></span></div><div><i className="inactive" /><span>Inactive<strong>1</strong></span></div></div></div></APanel>
    <APanel title="Officers by Police Station" subtitle="Top six stations by officer count"><div className="vertical-bars">{[["Colombo",88],["Kandy",62],["Galle",54],["Negombo",48],["Jaffna",42],["Matara",36]].map(([a,b])=><div key={a}><span>{b}</span><i style={{height:`${Number(b)}%`}} /><small>{a}</small></div>)}</div></APanel>
    <APanel title="Complaints by Month" subtitle="System-wide volume"><div className="admin-line-chart report-line"><svg viewBox="0 0 500 170" preserveAspectRatio="none"><path className="grid-lines" d="M0 10h500M0 50h500M0 90h500M0 130h500M0 169h500" /><path className="area" d="M0 135 80 115 160 126 240 82 320 94 400 42 500 58V170H0Z" /><path className="line" d="M0 135 80 115 160 126 240 82 320 94 400 42 500 58" /></svg><div className="chart-x"><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span></div></div></APanel>
    <APanel title="Officer Account Status"><div className="horizontal-report-bars">{[["Active officers",93],["On duty",64],["Off duty",36],["Inactive accounts",7]].map(([a,b])=><div key={a}><span>{a}</span><i><b style={{width:`${b}%`}} /></i><strong>{b}%</strong></div>)}</div></APanel>
    <APanel title="System Account Activity" subtitle="Administrative changes this month"><div className="report-metrics">{[["128","Successful logins"],["16","Accounts created"],["4","Accounts deactivated"],["3","Officer transfers"]].map(([a,b])=><div key={b}><strong>{a}</strong><span>{b}</span></div>)}</div></APanel>
    <APanel title="Complaint Status Distribution"><div className="category-bars">{[["Completed",68],["In Progress",18],["Under Review",9],["Rejected",5]].map(([a,b])=><div key={a}><span>{a}</span><i><b style={{width:`${b}%`}} /></i><strong>{b}%</strong></div>)}</div></APanel>
  </div></>;
}

function AuditPage() {
  const logs=[["30 Sep · 10:32 AM","ADM-001","System Admin","Super Admin","Account Created","PS-025","Created police station account"],["30 Sep · 11:05 AM","ADM-001","System Admin","Super Admin","Officer Deactivated","PO-104","Officer account access deactivated"],["30 Sep · 11:30 AM","ADM-001","System Admin","Super Admin","Officer Transferred","PO-072","Transferred officer to PS-008"],["30 Sep · 12:15 PM","PS-001","Negombo Police Station","Police Station","Complaint Verified","CMP-00125","Complaint validated by station"],["30 Sep · 1:05 PM","ADM-001","System Admin","Super Admin","Account Created","OPS-029","Operations Officer account created"]];
  return <><AdminIntro title="Audit Logs" description="Monitor important actions performed throughout the system." action={<div className="readonly-badge"><Icon name="shield" />Read-only security record</div>} /><AdminFilters type="audit" /><APanel title="System Audit Records" subtitle="Audit records cannot be edited or deleted"><AdminTable headers={["Timestamp","User ID","User Name","Role","Action","Target","Description"]} rows={logs} /><TablePagination count="12,482 audit records" /></APanel></>;
}

function NotificationsPage() {
  const [filter,setFilter]=useState("All");
  const [read,setRead]=useState<string[]>([]);
  const items=[["Security Alerts","critical","Multiple failed login attempts detected","Account PS-015 recorded 7 failed login attempts from an unrecognized device.","8 min ago"],["Account Notifications","medium","Officer account deactivated","Officer PO-104 account was deactivated by ADM-001.","32 min ago"],["Police Station Notifications","high","Station configuration required","Police Station PS-025 requires account and service area configuration.","1 hr ago"],["System Notifications","low","Scheduled security scan complete","The daily platform security scan completed successfully with no critical issues.","2 hrs ago"],["Account Notifications","medium","New Operations Officer account","Account OPS-029 was created and is awaiting first login.","3 hrs ago"]];
  return <><AdminIntro title="Notifications" description="Review security alerts, account changes, and important system events." action={<button className="admin-primary" onClick={()=>setRead(items.map(i=>i[2]))} type="button">Mark All as Read</button>} /><div className="notification-filters">{["All","Security Alerts","Account Notifications","Police Station Notifications","System Notifications"].map(x=><button className={filter===x?"active":""} onClick={()=>setFilter(x)} key={x} type="button">{x}</button>)}</div><APanel title="System Notifications" subtitle={`${5-read.length} unread notifications`}><div className="admin-notification-list">{items.filter(i=>filter==="All"||i[0]===filter).map(([category,tone,title,copy,time])=><article className={read.includes(title)?"read":""} key={title}><i className={tone}><Icon name={tone==="critical"?"alert":tone==="high"?"cases":tone==="medium"?"profile":"check"} /></i><div><span>{category}</span><strong>{title}</strong><p>{copy}</p><small>{time}</small></div><div><button onClick={()=>setRead([...read,title])} type="button">{read.includes(title)?"Read":"Mark as Read"}</button><button type="button">View Details</button></div></article>)}</div></APanel></>;
}

function SettingsPage() {
  const [tab,setTab]=useState<"profile"|"security"|"preferences">("profile");
  return <><AdminIntro title="Settings" description="Manage administrator profile, security, and system preferences." /><div className="admin-settings"><aside>{[["profile","Admin Profile","profile"],["security","Security","shield"],["preferences","System Preferences","gear"]].map(([id,label,icon])=><button className={tab===id?"active":""} onClick={()=>setTab(id as typeof tab)} key={id} type="button"><Icon name={icon as Parameters<typeof Icon>[0]["name"]} />{label}</button>)}</aside><div>
    {tab==="profile"&&<APanel title="Admin Profile" subtitle="Police IT Head Office administrator identity"><div className="admin-profile-hero"><span className="admin-avatar">SA</span><div><strong>System Administrator</strong><small>ADM-001 · Super Admin</small></div><button type="button">Edit Profile</button></div><div className="admin-info-grid settings-info">{[["Name","System Administrator"],["Admin ID","ADM-001"],["Email","admin@police.gov.lk"],["Contact","+94 11 242 1111"],["Role","Super Admin"],["Department","Police IT Head Office"]].map(([a,b])=><div key={a}><span>{a}</span><strong>{b}</strong></div>)}</div></APanel>}
    {tab==="security"&&<><APanel title="Account Security"><div className="security-setting-list">{[["Change Password","Last changed 28 days ago","Update"],["Two-Factor Authentication","Enabled with authenticator app","Manage"],["Active Sessions","2 secure administrative sessions","Review Sessions"],["Last Login","30 Sep 2026 · 07:35 AM","View Activity"]].map(([a,b,c])=><div key={a}><span><Icon name="shield" /><i><strong>{a}</strong><small>{b}</small></i></span><button type="button">{c}</button></div>)}</div></APanel><APanel title="Login Security Settings"><div className="setting-toggle-row"><span><strong>Login anomaly alerts</strong><small>Notify when unusual administrator login activity is detected.</small></span><input type="checkbox" defaultChecked /></div></APanel></>}
    {tab==="preferences"&&<APanel title="System Preferences"><div className="preference-form"><label><span>Notification Preferences</span><select><option>Security and account alerts</option></select></label><label><span>Session Timeout</span><select><option>30 minutes</option><option>60 minutes</option></select></label><label><span>Display Density</span><select><option>Comfortable</option><option>Compact</option></select></label><div className="setting-toggle-row"><span><strong>Email critical alerts</strong><small>Send high-severity security events to administrator email.</small></span><input type="checkbox" defaultChecked /></div><button className="admin-primary" type="button">Save Preferences</button></div></APanel>}
  </div></div></>;
}

function TablePagination({ count }: { count: string }) {
  return <div className="admin-pagination"><span>Showing {count}</span><div><button type="button">←</button><button className="active" type="button">1</button><button type="button">2</button><button type="button">3</button><button type="button">→</button></div></div>;
}

function AdminModal({ title, copy, onClose, children }: { title: string; copy: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="workspace-modal-backdrop"><div className="workspace-modal admin-modal"><div className="modal-heading"><span><Icon name="shield" /></span><div><h2>{title}</h2><p>{copy}</p></div></div><div className="admin-modal-form">{children}</div><div className="modal-buttons"><button onClick={onClose} type="button">Cancel</button><button className="admin-primary" onClick={onClose} type="button">Confirm Action</button></div></div></div>;
}

function AdminPages({ page, setPage }: { page: AdminPage; setPage: (p: AdminPage) => void }) {
  return <main className="admin-main">
    {page==="dashboard"&&<DashboardPage setPage={setPage} />}
    {page==="stations"&&<StationsPage />}
    {page==="officers"&&<OfficersPage />}
    {page==="accounts"&&<AccountsPage />}
    {page==="reports"&&<ReportsPage />}
    {page==="audit"&&<AuditPage />}
    {page==="notifications"&&<NotificationsPage />}
    {page==="settings"&&<SettingsPage />}
  </main>;
}

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [page,setPage]=useState<AdminPage>("dashboard");
  return <div className="admin-app"><aside className="admin-sidebar"><div className="admin-brand"><AdminMark /><div><strong>Community Safety</strong><span>Police Response System</span></div></div><div className="super-admin-label"><Icon name="shield" /><span><small>Authorized environment</small><strong>SUPER ADMIN</strong></span></div><nav><p>Administration</p>{nav.slice(0,5).map(item=><button className={page===item.page?"active":""} onClick={()=>setPage(item.page)} key={item.page} type="button"><Icon name={item.icon} /><span>{item.label}</span></button>)}<p>System & Security</p>{nav.slice(5).map(item=><button className={page===item.page?"active":""} onClick={()=>setPage(item.page)} key={item.page} type="button"><Icon name={item.icon} /><span>{item.label}</span>{item.page==="notifications"&&<b>5</b>}</button>)}</nav><div className="admin-sidebar-security"><Icon name="shield" /><span><strong>Secured Administration</strong>Police IT Head Office</span></div><small className="admin-version">ICCMPRS Admin Console · v2.4</small></aside><div className="admin-content"><AdminShellHeader page={page} setPage={setPage} onLogout={onLogout} /><AdminPages page={page} setPage={setPage} /></div></div>;
}
