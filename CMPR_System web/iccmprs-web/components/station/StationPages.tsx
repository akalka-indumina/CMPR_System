"use client";

import { useState } from "react";
import { Icon } from "@/components/shared/Icon";

export type StationPage =
  | "dashboard"
  | "complaints"
  | "review"
  | "assignments"
  | "officers"
  | "progress"
  | "settings"
  | "reviewCases"
  | "activeCases"
  | "map"
  | "activity"
  | "profile"
  | "assignmentDetails";

type PageProps = {
  page: StationPage;
  setPage: (page: StationPage) => void;
};

const complaints = [
  ["CMP-00125", "Theft", "N. Fernando", "Sea Street, Negombo", "High", "Under Review", "—", "30 Sep 2026"],
  ["CMP-00124", "Assault", "Authorized view", "Lewis Place", "High", "In Progress", "PO-031", "30 Sep 2026"],
  ["CMP-00123", "Lost Property", "S. Perera", "Main Street", "Low", "Completed", "PO-051", "29 Sep 2026"],
  ["CMP-00122", "Vehicle Incident", "Authorized view", "Colombo Road", "High", "Assigned", "PO-042", "29 Sep 2026"],
  ["CMP-00121", "Property Damage", "R. Silva", "Beach Road", "Medium", "Verified", "—", "28 Sep 2026"],
  ["CMP-00120", "Public Disturbance", "Authorized view", "Greens Road", "Medium", "Rejected", "—", "28 Sep 2026"],
];

const officers = [
  ["PO-024", "Kasun Perera", "Police Constable", "071 234 5678", "On Duty", "4", "32"],
  ["PO-031", "Nimali Silva", "Sergeant", "077 456 7890", "On Duty", "2", "47"],
  ["PO-042", "Ruwan Fernando", "Police Constable", "075 987 4321", "Active", "5", "28"],
  ["PO-051", "Dilshan Jayasuriya", "Sub Inspector", "076 345 8761", "Off Duty", "1", "61"],
  ["PO-063", "Tharushi De Mel", "Police Constable", "071 765 2341", "Active", "3", "24"],
];

function PageIntro({ title, description, tag }: { title: string; description: string; tag?: string }) {
  return (
    <div className="workspace-intro">
      <div><p>Station Operations</p><h1>{title}</h1><span>{description}</span></div>
      <div className="scope-chip"><Icon name="shield" /><span><strong>{tag || "Negombo Police Station"}</strong>Station-scoped data · PS-001</span></div>
    </div>
  );
}

function SummaryRow({ items }: { items: [string, string, string][] }) {
  return (
    <div className="workspace-stats">
      {items.map(([label, value, tone]) => (
        <div className="workspace-stat" key={label}><span className={tone}><Icon name={tone === "red" ? "alert" : tone === "green" ? "check" : "file"} /></span><div><small>{label}</small><strong>{value}</strong></div></div>
      ))}
    </div>
  );
}

function Status({ children }: { children: string }) {
  return <span className={`workspace-status ws-${children.toLowerCase().replaceAll(" ", "-")}`}>{children}</span>;
}

function Priority({ children }: { children: string }) {
  return <span className={`workspace-priority wp-${children.toLowerCase()}`}><i />{children}</span>;
}

function FilterBar({ officer = true }: { officer?: boolean }) {
  return (
    <div className="filter-card">
      <label className="filter-search"><span>Search</span><div><Icon name="search" /><input placeholder="Complaint ID or keyword" /></div></label>
      <label><span>Category</span><select defaultValue=""><option value="">All categories</option><option>Theft</option><option>Assault</option><option>Property Damage</option></select></label>
      <label><span>Status</span><select defaultValue=""><option value="">All statuses</option><option>Under Review</option><option>Assigned</option><option>In Progress</option><option>Completed</option></select></label>
      <label><span>Priority</span><select defaultValue=""><option value="">All priorities</option><option>High</option><option>Medium</option><option>Low</option></select></label>
      {officer && <label><span>Officer</span><select defaultValue=""><option value="">All officers</option><option>PO-024</option><option>PO-031</option><option>PO-042</option></select></label>}
      <label><span>Date Range</span><input type="date" /></label>
      <div className="filter-actions"><button className="primary-small" type="button">Search</button><button type="button">Reset</button></div>
    </div>
  );
}

function Panel({ title, subtitle, children, action }: { title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="workspace-panel">
      <header><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</header>
      {children}
    </section>
  );
}

function ComplaintsPage() {
  const [selected, setSelected] = useState<string | null>(null);
  if (selected) return <ComplaintDetails id={selected} onBack={() => setSelected(null)} />;
  return (
    <>
      <PageIntro title="Complaints" description="View and manage complaints submitted to this police station." />
      <SummaryRow items={[["Total Complaints", "128", "blue"], ["Under Review", "17", "amber"], ["Active", "21", "purple"], ["Completed", "86", "green"], ["Rejected", "4", "red"]]} />
      <FilterBar />
      <Panel title="All Complaints" subtitle="128 station complaints · Updated moments ago" action={<button className="outline-action" type="button">Export list</button>}>
        <div className="workspace-table-wrap"><table className="workspace-table"><thead><tr><th>Complaint ID</th><th>Category</th><th>Citizen</th><th>Location</th><th>Priority</th><th>Status</th><th>Officer</th><th>Submitted</th><th>Action</th></tr></thead>
          <tbody>{complaints.map((row) => <tr key={row[0]}><td><strong>{row[0]}</strong></td><td>{row[1]}</td><td>{row[2]}</td><td>{row[3]}</td><td><Priority>{row[4]}</Priority></td><td><Status>{row[5]}</Status></td><td>{row[6]}</td><td>{row[7]}</td><td><button className="row-action" onClick={() => setSelected(row[0])} type="button">View Details</button></td></tr>)}</tbody>
        </table></div>
        <div className="table-footer"><span>Showing 1–6 of 128 complaints</span><div><button type="button">←</button><button className="current" type="button">1</button><button type="button">2</button><button type="button">3</button><button type="button">→</button></div></div>
      </Panel>
    </>
  );
}

function ComplaintDetails({ id, onBack }: { id: string; onBack: () => void }) {
  return (
    <>
      <button className="back-button" onClick={onBack} type="button">← Back to Complaints</button>
      <PageIntro title={`Complaint ${id}`} description="Secure complaint record and investigation information." tag="Authorized information" />
      <div className="detail-layout">
        <div>
          <Panel title="Complaint Information" action={<><Priority>High</Priority><Status>Under Review</Status></>}>
            <div className="detail-grid">
              {[["Complaint ID", id], ["Category", "Theft"], ["Location", "Sea Street, Negombo"], ["Incident Date & Time", "30 Sep 2026 · 09:48 AM"], ["Submitted Date", "30 Sep 2026 · 10:32 AM"], ["Current Status", "Under Review"]].map(([a,b]) => <div key={a}><span>{a}</span><strong>{b}</strong></div>)}
            </div>
            <div className="description-block"><span>Description</span><p>A report was submitted regarding missing personal property from a secured commercial premises. Exact personal details are restricted to authorized review staff.</p></div>
          </Panel>
          <Panel title="Secure Evidence" subtitle="Evidence access is recorded in the station audit history.">
            <div className="evidence-grid"><div><Icon name="file" /><strong>entrance_photo.jpg</strong><span>Image · 2.4 MB</span></div><div><Icon name="file" /><strong>security_clip.mp4</strong><span>Video · 18.7 MB</span></div><div><Icon name="file" /><strong>statement.pdf</strong><span>Document · 830 KB</span></div></div>
          </Panel>
        </div>
        <div>
          <Panel title="Assignment Information"><div className="empty-assignment"><Icon name="officers" /><strong>Not yet assigned</strong><span>This complaint must be verified before officer assignment.</span></div></Panel>
          <Panel title="Status History"><div className="status-timeline">{["Submitted", "Under Review", "Verified", "Assigned", "In Progress", "Completed", "Closed"].map((step, i) => <div className={i < 2 ? "done" : ""} key={step}><i>{i < 2 ? "✓" : i + 1}</i><span><strong>{step}</strong><small>{i === 0 ? "30 Sep · 10:32 AM" : i === 1 ? "Review opened · 10:40 AM" : "Pending"}</small></span></div>)}</div></Panel>
        </div>
      </div>
    </>
  );
}

function ReviewPage({ setPage }: { setPage: (page: StationPage) => void }) {
  const [reviewing, setReviewing] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [verified, setVerified] = useState(false);
  if (reviewing) return (
    <>
      <button className="back-button" onClick={() => setReviewing(false)} type="button">← Back to Review Queue</button>
      <PageIntro title="Review Complaint CMP-00125" description="Validate the submission and evidence before assignment." tag="Verification required" />
      <div className="review-layout">
        <div><ComplaintDetailsContent /></div>
        <Panel title="Review Decision" subtitle="Your decision will be recorded in the complaint history.">
          <div className="review-checklist"><strong>Verification checklist</strong>{["Complaint details reviewed", "Location belongs to station area", "Evidence files inspected", "Submission appears valid"].map((x) => <label key={x}><input type="checkbox" />{x}</label>)}</div>
          {verified ? <div className="verified-box"><Icon name="check" /><strong>Complaint verified</strong><span>This complaint is ready for officer assignment.</span><button onClick={() => setPage("assignments")} type="button">Proceed to Assignment →</button></div> :
          <div className="decision-actions"><button className="verify-button" onClick={() => setVerified(true)} type="button"><Icon name="check" />Verify Complaint</button><button className="reject-button" onClick={() => setRejecting(true)} type="button"><Icon name="alert" />Reject Complaint</button></div>}
        </Panel>
      </div>
      {rejecting && <div className="workspace-modal-backdrop"><div className="workspace-modal"><span className="danger-modal-icon"><Icon name="alert" /></span><h2>Reject Complaint</h2><p>A reason is mandatory and will be saved with the complaint and audit history.</p><label><span>Rejection Reason</span><textarea autoFocus placeholder="Clearly explain why this complaint cannot be verified..." /></label><div><button onClick={() => setRejecting(false)} type="button">Cancel</button><button className="danger-button" type="button">Confirm Rejection</button></div></div></div>}
    </>
  );
  return (
    <>
      <PageIntro title="Complaint Review" description="Review and validate newly submitted complaints before assigning them for investigation." />
      <SummaryRow items={[["Pending Review", "17", "amber"], ["Verified Today", "9", "green"], ["Rejected Today", "2", "red"], ["High Priority Reviews", "4", "red"]]} />
      <Panel title="Pending Review Queue" subtitle="Complaints are ordered by priority and submission time.">
        <div className="workspace-table-wrap"><table className="workspace-table"><thead><tr><th>Complaint ID</th><th>Category</th><th>Submitted Date</th><th>Priority</th><th>Evidence</th><th>Status</th><th>Action</th></tr></thead><tbody>
          {complaints.slice(0,4).map((r, i) => <tr key={r[0]}><td><strong>{r[0]}</strong></td><td>{r[1]}</td><td>{r[7]} · {["10:32 AM","11:05 AM","12:20 PM","01:14 PM"][i]}</td><td><Priority>{r[4]}</Priority></td><td><span className="evidence-count"><Icon name="file" />{i + 1} files</span></td><td><Status>Under Review</Status></td><td><button className="row-action filled" onClick={() => setReviewing(true)} type="button">Review</button></td></tr>)}
        </tbody></table></div>
      </Panel>
    </>
  );
}

function ComplaintDetailsContent() {
  return <Panel title="Complaint Information" action={<Priority>High</Priority>}><div className="detail-grid">{[["Complaint ID","CMP-00125"],["Category","Theft"],["Location","Sea Street, Negombo"],["Date / Time","30 Sep 2026 · 09:48 AM"],["Citizen","Authorized reviewer access"],["Evidence","3 secure files"]].map(([a,b]) => <div key={a}><span>{a}</span><strong>{b}</strong></div>)}</div><div className="description-block"><span>Description</span><p>Reported loss of personal property from commercial premises. Supporting security footage and a written statement are attached for authorized review.</p></div><div className="evidence-grid compact"><div><Icon name="file" /><strong>Photo evidence</strong><span>JPG · Secure</span></div><div><Icon name="file" /><strong>Security footage</strong><span>MP4 · Secure</span></div></div></Panel>;
}

function AssignmentsPage({ setPage }: { setPage: (page: StationPage) => void }) {
  const [assigning, setAssigning] = useState(false);
  return (
    <>
      <PageIntro title="Assignments" description="Assign verified complaints to police officers and monitor current assignments." tag="Authorized assignment access" />
      <SummaryRow items={[["Unassigned Verified", "8", "amber"], ["Assigned Today", "6", "blue"], ["Current Assignments", "21", "purple"], ["Overdue", "3", "red"]]} />
      <Panel title="Unassigned Verified Complaints" subtitle="Only verified complaints are eligible for assignment.">
        <div className="workspace-table-wrap"><table className="workspace-table"><thead><tr><th>Complaint ID</th><th>Category</th><th>Priority</th><th>Verified Date</th><th>Location</th><th>Action</th></tr></thead><tbody>
          {complaints.slice(3,6).map((r) => <tr key={r[0]}><td><strong>{r[0]}</strong></td><td>{r[1]}</td><td><Priority>{r[4]}</Priority></td><td>30 Sep 2026 · 11:15 AM</td><td>{r[3]}</td><td><button className="row-action filled" onClick={() => setAssigning(true)} type="button">Assign Officer</button></td></tr>)}
        </tbody></table></div>
      </Panel>
      <Panel title="Current Assignments" subtitle="Assignments active within Negombo Police Station.">
        <div className="workspace-table-wrap"><table className="workspace-table"><thead><tr><th>Complaint ID</th><th>Category</th><th>Assigned Officer</th><th>Assigned Date</th><th>Priority</th><th>Status</th><th>Action</th></tr></thead><tbody>
          {complaints.slice(1,5).map((r) => <tr key={r[0]}><td><strong>{r[0]}</strong></td><td>{r[1]}</td><td>{r[6] === "—" ? "PO-024" : r[6]}</td><td>29 Sep 2026</td><td><Priority>{r[4]}</Priority></td><td><Status>{r[5] === "Verified" ? "Assigned" : r[5]}</Status></td><td><button className="row-action" onClick={() => setPage("assignmentDetails")} type="button">View Assignment</button></td></tr>)}
        </tbody></table></div>
      </Panel>
      {assigning && <div className="workspace-modal-backdrop"><div className="workspace-modal wide"><div className="modal-heading"><span><Icon name="clipboard" /></span><div><h2>Assign Complaint</h2><p>CMP-00122 · Vehicle Incident · High Priority</p></div></div><div className="assignment-summary"><div><span>Location</span><strong>Colombo Road, Negombo</strong></div><div><span>Verified</span><strong>30 Sep · 11:15 AM</strong></div></div><div className="form-grid"><label><span>Select Police Officer</span><select defaultValue=""><option value="" disabled>Select a station officer</option><option>PO-024 — Kasun Perera · 4 active</option><option>PO-031 — Nimali Silva · 2 active</option><option>PO-051 — Dilshan Jayasuriya · 1 active</option></select></label><label><span>Priority</span><select defaultValue="High"><option>High</option><option>Medium</option><option>Low</option></select></label><label className="full"><span>Assignment Instructions</span><textarea placeholder="Add investigation instructions..." /></label><label><span>Due Date</span><input type="date" /></label></div><div className="modal-buttons"><button onClick={() => setAssigning(false)} type="button">Cancel</button><button className="primary-small" onClick={() => setAssigning(false)} type="button">Assign Complaint</button></div></div></div>}
    </>
  );
}

function OfficersPage() {
  const [selected, setSelected] = useState<string | null>(null);
  if (selected) return <OfficerDetails id={selected} onBack={() => setSelected(null)} />;
  return (
    <>
      <PageIntro title="Police Officers" description="View officers assigned to this police station and monitor their current workload." />
      <SummaryRow items={[["Total Officers", "42", "blue"], ["Active", "38", "green"], ["On Duty", "24", "green"], ["Off Duty", "18", "amber"], ["With Active Cases", "16", "purple"]]} />
      <div className="simple-search"><div><Icon name="search" /><input placeholder="Search by officer ID or name" /></div><select><option>All duty statuses</option><option>On Duty</option><option>Off Duty</option></select><select><option>All ranks</option><option>Sergeant</option><option>Police Constable</option></select></div>
      <Panel title="Station Officer Directory" subtitle="Only officers assigned to Negombo Police Station are shown.">
        <div className="workspace-table-wrap"><table className="workspace-table"><thead><tr><th>Officer</th><th>Name</th><th>Rank</th><th>Contact</th><th>Duty Status</th><th>Active Cases</th><th>Completed</th><th>Action</th></tr></thead><tbody>
          {officers.map((r) => <tr key={r[0]}><td><span className="officer-cell"><i>{r[0].slice(-2)}</i><strong>{r[0]}</strong></span></td><td><strong>{r[1]}</strong></td><td>{r[2]}</td><td>{r[3]}</td><td><Status>{r[4]}</Status></td><td><span className="case-count">{r[5]} Active</span></td><td>{r[6]} cases</td><td><button className="row-action" onClick={() => setSelected(r[0])} type="button">View</button></td></tr>)}
        </tbody></table></div>
      </Panel>
    </>
  );
}

function OfficerDetails({ id, onBack }: { id: string; onBack: () => void }) {
  return <><button className="back-button" onClick={onBack} type="button">← Back to Police Officers</button><PageIntro title="Officer Profile" description="Station officer details, assignments, and recent case activity." />
    <div className="officer-profile-banner"><span>KP</span><div><p>Police Constable</p><h2>Kasun Perera</h2><small>{id} · Negombo Police Station</small></div><Status>On Duty</Status></div>
    <div className="detail-layout"><div><Panel title="Current Assignments"><div className="assignment-cards">{complaints.slice(0,3).map((r,i) => <div key={r[0]}><div><strong>{r[0]} · {r[1]}</strong><Priority>{r[4]}</Priority></div><span>{r[3]}</span><div className="mini-progress"><i style={{width:`${[65,40,85][i]}%`}} /></div><small>{[65,40,85][i]}% investigation progress</small></div>)}</div></Panel></div>
    <div><Panel title="Officer Information"><div className="profile-info">{[["Officer ID",id],["Rank","Police Constable"],["Contact","071 234 5678"],["Duty Status","On Duty"],["Active Cases","4"],["Completed Cases","32"]].map(([a,b]) => <div key={a}><span>{a}</span><strong>{b}</strong></div>)}</div></Panel><Panel title="Recent Activity"><div className="compact-activity">{["Updated progress on CMP-00118","Uploaded evidence to CMP-00116","Completed investigation CMP-00109"].map((x,i) => <div key={x}><i><Icon name="activity" /></i><span><strong>{x}</strong><small>{i+1} hour{i ? "s" : ""} ago</small></span></div>)}</div></Panel></div></div>
  </>;
}

function ProgressPage() {
  const [selected, setSelected] = useState(false);
  if (selected) return <ProgressDetails onBack={() => setSelected(false)} />;
  const rows = [["CMP-00118","Theft","PO-024","High","In Progress","25 min ago","68"],["CMP-00120","Assault","PO-031","Medium","In Progress","1 hr ago","44"],["CMP-00122","Vehicle Incident","PO-042","High","Assigned","2 hrs ago","20"],["CMP-00116","Property Damage","PO-024","Low","In Progress","Yesterday","82"]];
  return <><PageIntro title="Progress Monitoring" description="Monitor the progress of complaints assigned to police officers." />
    <SummaryRow items={[["Assigned","8","blue"],["In Progress","21","purple"],["Completed","86","green"],["Overdue","3","red"]]} /><FilterBar />
    <Panel title="Investigation Progress" subtitle="Live progress from officers assigned to this station."><div className="workspace-table-wrap"><table className="workspace-table progress-table"><thead><tr><th>Complaint</th><th>Officer</th><th>Priority</th><th>Status</th><th>Last Updated</th><th>Progress</th><th>Action</th></tr></thead><tbody>{rows.map(r => <tr key={r[0]}><td><strong>{r[0]}</strong><small>{r[1]}</small></td><td>{r[2]}</td><td><Priority>{r[3]}</Priority></td><td><Status>{r[4]}</Status></td><td>{r[5]}</td><td><div className="table-progress"><span><i style={{width:`${r[6]}%`}} /></span><b>{r[6]}%</b></div></td><td><button className="row-action" onClick={() => setSelected(true)} type="button">View Progress</button></td></tr>)}</tbody></table></div></Panel>
  </>;
}

function ProgressDetails({ onBack }: { onBack: () => void }) {
  return <><button className="back-button" onClick={onBack} type="button">← Back to Progress Monitoring</button><PageIntro title="Complaint Progress" description="CMP-00118 · Theft · Investigation monitoring" />
    <div className="progress-hero"><div><span>Overall investigation progress</span><strong>68%</strong></div><div className="large-progress"><i /></div><p>Last updated 25 minutes ago by PO-024</p></div>
    <div className="detail-layout"><Panel title="Investigation Timeline"><div className="investigation-timeline">{[["Assigned","29 Sep · 09:20 AM","Complaint assigned to PO-024"],["Investigation Started","29 Sep · 10:05 AM","Officer acknowledged and began investigation"],["Evidence Updated","30 Sep · 08:45 AM","Two evidence records added"],["Investigation Completed","Pending","Awaiting officer completion"],["Waiting for Closure","Pending","Final station review required"]].map((x,i) => <div className={i<3?"complete":""} key={x[0]}><i>{i<3?"✓":i+1}</i><span><strong>{x[0]}</strong><small>{x[1]}</small><p>{x[2]}</p></span></div>)}</div></Panel>
    <div><Panel title="Case Information"><div className="profile-info">{[["Complaint","CMP-00118"],["Category","Theft"],["Assigned Officer","PO-024 · Kasun Perera"],["Priority","High"],["Current Status","In Progress"],["Latest Update","Evidence review ongoing"]].map(([a,b]) => <div key={a}><span>{a}</span><strong>{b}</strong></div>)}</div></Panel><Panel title="Latest Update"><div className="latest-update"><Icon name="activity" /><p>Security footage collected and two witness statements recorded. Evidence comparison is currently underway.</p><span>PO-024 · 25 minutes ago</span></div></Panel></div></div>
  </>;
}

function SettingsPage() {
  const [saved, setSaved] = useState(false);
  return <><PageIntro title="Settings" description="Manage station profile, account security, and notification preferences." />
    <div className="settings-layout"><aside><button className="active" type="button"><Icon name="profile" />Station Profile</button><button type="button"><Icon name="shield" />Account Security</button><button type="button"><Icon name="bell" />Notifications</button></aside>
    <div><Panel title="Station Profile" subtitle="Core station details are visible only to authorized users."><div className="settings-form"><label><span>Police Station Name</span><input defaultValue="Negombo Police Station" /></label><label><span>Station ID</span><input defaultValue="PS-001" disabled /></label><label className="full"><span>Address</span><input defaultValue="Main Street, Negombo, Western Province" /></label><label><span>Contact Number</span><input defaultValue="+94 31 222 2222" /></label><label><span>Email</span><input defaultValue="negombo.station@police.gov.lk" /></label></div><div className="settings-save"><span>{saved && "Changes saved securely."}</span><button className="primary-small" onClick={() => setSaved(true)} type="button">Save Changes</button></div></Panel>
    <Panel title="Account Security"><div className="security-rows"><div><span><Icon name="shield" /><i><strong>Change Password</strong><small>Last changed 42 days ago</small></i></span><button type="button">Update Password</button></div><div><span><Icon name="activity" /><i><strong>Active Sessions</strong><small>1 authorized station device</small></i></span><button type="button">View Sessions</button></div><div><span><Icon name="audit" /><i><strong>Last Login</strong><small>30 September 2026 · 07:42 AM</small></i></span><Status>Secure</Status></div></div></Panel>
    <Panel title="Notification Preferences"><div className="notification-settings">{[["New Complaint Notifications","Receive an alert when a new complaint is submitted."],["High Priority Notifications","Immediate alerts for high-priority complaints."],["Officer Progress Notifications","Updates when officers change investigation progress."]].map((x,i)=><label key={x[0]}><span><strong>{x[0]}</strong><small>{x[1]}</small></span><input defaultChecked={i<2} type="checkbox" /></label>)}</div></Panel></div></div>
  </>;
}

function ReviewCasesPage({ setPage }: { setPage: (page: StationPage) => void }) {
  return <>
    <button className="back-button" onClick={() => setPage("dashboard")} type="button">← Back to Dashboard</button>
    <PageIntro title="Review Required Cases" description="All complaints awaiting verification by Negombo Police Station." tag="17 cases require review" />
    <SummaryRow items={[["Pending Review","17","amber"],["High Priority","4","red"],["Evidence Attached","13","blue"],["Submitted Today","9","green"]]} />
    <FilterBar officer={false} />
    <Panel title="Cases Requiring Police Review" subtitle="Prioritized by severity and submission time.">
      <div className="workspace-table-wrap"><table className="workspace-table"><thead><tr><th>Complaint ID</th><th>Category</th><th>Submitted</th><th>Location</th><th>Priority</th><th>Evidence</th><th>Status</th><th>Action</th></tr></thead><tbody>
        {complaints.concat(complaints.slice(0,2)).map((r,i) => <tr key={`${r[0]}-${i}`}><td><strong>{r[0]}</strong></td><td>{r[1]}</td><td>{r[7]} · {["10:32 AM","11:05 AM","12:20 PM","1:14 PM"][i%4]}</td><td>{r[3]}</td><td><Priority>{r[4]}</Priority></td><td><span className="evidence-count"><Icon name="file" />{i%3+1} files</span></td><td><Status>Under Review</Status></td><td><button className="row-action filled" onClick={() => setPage("review")} type="button">Review</button></td></tr>)}
      </tbody></table></div>
    </Panel>
  </>;
}

function ActiveCasesPage({ setPage }: { setPage: (page: StationPage) => void }) {
  const rows = [
    ["CMP-00118","Theft","PO-024","In Progress","High","68%","25 min ago"],
    ["CMP-00120","Assault","PO-031","In Progress","Medium","44%","1 hr ago"],
    ["CMP-00122","Vehicle Incident","PO-042","Assigned","High","20%","2 hrs ago"],
    ["CMP-00116","Property Damage","PO-024","In Progress","Low","82%","Yesterday"],
    ["CMP-00112","Public Disturbance","PO-051","Assigned","Medium","15%","Yesterday"],
  ];
  return <>
    <button className="back-button" onClick={() => setPage("dashboard")} type="button">← Back to Dashboard</button>
    <PageIntro title="Active Cases" description="All assigned and in-progress cases belonging to this police station." />
    <SummaryRow items={[["Active Cases","21","blue"],["In Progress","13","purple"],["Assigned","8","blue"],["High Priority","4","red"]]} />
    <FilterBar />
    <Panel title="Current Active Cases" subtitle="Station-scoped assignments and investigation progress."><div className="workspace-table-wrap"><table className="workspace-table progress-table"><thead><tr><th>Complaint</th><th>Assigned Officer</th><th>Status</th><th>Priority</th><th>Progress</th><th>Last Updated</th><th>Action</th></tr></thead><tbody>
      {rows.map(r => <tr key={r[0]}><td><strong>{r[0]}</strong><small>{r[1]}</small></td><td>{r[2]}</td><td><Status>{r[3]}</Status></td><td><Priority>{r[4]}</Priority></td><td><div className="table-progress"><span><i style={{width:r[5]}} /></span><b>{r[5]}</b></div></td><td>{r[6]}</td><td><button className="row-action" onClick={() => setPage("progress")} type="button">View Progress</button></td></tr>)}
    </tbody></table></div></Panel>
  </>;
}

function FullMapPage({ setPage }: { setPage: (page: StationPage) => void }) {
  const [zoom, setZoom] = useState(1);
  return <div className="full-map-page">
    <div className="full-map-toolbar"><button onClick={() => setPage("dashboard")} type="button">← Back</button><div><h1>Complaint Map</h1><span>Negombo Police Station service area · Live operational overview</span></div></div>
    <div className="full-map-canvas">
      <svg aria-hidden="true" viewBox="0 0 1200 700" preserveAspectRatio="none" style={{transform:`scale(${zoom})`}}>
        <path className="full-map-water" d="M0 0h310c-38 115 36 190 2 290-45 130 26 224-8 410H0Z" />
        <g className="full-map-roads"><path d="M260-30c167 137 176 275 83 415-80 120 15 213 73 355M175 177c260 28 559-4 1040-134M214 568c243-112 570-134 1030-66M641-20c-51 158 23 286 211 359 170 66 263 195 317 390M360 350c256 5 410 85 537 231M923 42c-100 180-84 359 54 554" /><path className="minor" d="M251 85c288 180 597 218 948 128M288 650c210-220 490-360 880-370M546 179c75 180 67 357-35 531M784 0c123 244 259 404 421 495" /></g>
      </svg>
      <span className="full-map-label sea">Laccadive Sea</span><span className="full-map-label city">NEGOMBO</span><span className="full-map-label area">Katana Service Area</span>
      <span className="large-map-marker police"><Icon name="shield" /><b>Negombo Police Station</b></span>
      {[
        ["high","18%","68%","CMP-00125 · High Priority"],["high","73%","24%","CMP-00118 · High Priority"],["active","47%","36%","CMP-00120 · Active"],["active","81%","58%","CMP-00122 · Active"],["review","59%","73%","CMP-00127 · Under Review"],["review","34%","82%","CMP-00126 · Under Review"],
      ].map(([tone,left,top,label]) => <button className={`large-map-marker complaint ${tone}`} style={{left,top}} key={label} title={label} type="button"><i /><span>{label}</span></button>)}
      <div className="full-map-controls"><button onClick={() => setZoom(Math.min(1.25,zoom+.1))} aria-label="Zoom in" type="button">+</button><button onClick={() => setZoom(Math.max(.85,zoom-.1))} aria-label="Zoom out" type="button">−</button><button onClick={() => setZoom(1)} aria-label="Reset map" type="button"><Icon name="pin" /></button></div>
      <div className="full-map-legend"><strong>Map Legend</strong><span><i className="police" />Police Station</span><span><i className="high" />High Priority</span><span><i className="active" />Active Case</span><span><i className="review" />Under Review</span></div>
      <div className="map-security-note"><Icon name="shield" />Station-scoped operational data only</div>
    </div>
  </div>;
}

function ActivityLogPage({ setPage }: { setPage: (page: StationPage) => void }) {
  const activities = [
    ["10:32 AM","New complaint CMP-00125 received","New Complaint","alert"],
    ["10:45 AM","CMP-00120 verified by station reviewer","Verification","check"],
    ["11:02 AM","CMP-00120 assigned to PO-031","Assignment","clipboard"],
    ["11:30 AM","PO-024 updated progress on CMP-00118","Progress Update","activity"],
    ["12:05 PM","CMP-00114 marked as completed","Completion","check"],
    ["12:28 PM","Evidence uploaded to CMP-00116","Evidence","file"],
    ["1:14 PM","CMP-00127 submitted for review","New Complaint","review"],
  ];
  return <><button className="back-button" onClick={() => setPage("dashboard")} type="button">← Back to Dashboard</button><PageIntro title="Recent Activity" description="Recent complaint, assignment, and officer activity for this police station." tag="Station activity only" />
    <div className="simple-search"><div><Icon name="search" /><input placeholder="Search activity or complaint ID" /></div><select><option>All activity types</option><option>Complaint</option><option>Assignment</option><option>Progress</option></select><input type="date" /></div>
    <Panel title="Station Activity Log" subtitle="Operational activity for Negombo Police Station"><div className="full-activity-list">{activities.map(([time,copy,type,icon],i)=><div key={`${time}-${copy}`}><span className={`activity-dot dot-${i%5}`}><Icon name={icon as Parameters<typeof Icon>[0]["name"]} /></span><div><strong>{copy}</strong><span>{type} · PS-001</span></div><time>{time}<small>30 Sep 2026</small></time></div>)}</div></Panel>
  </>;
}

function AssignmentDetailsPage({ setPage }: { setPage: (page: StationPage) => void }) {
  return <><button className="back-button" onClick={() => setPage("assignments")} type="button">← Back to Assignments</button><PageIntro title="Assignment Details" description="ASN-00842 · CMP-00120 · Authorized station assignment record" tag="Station assignment" />
    <div className="assignment-detail-hero"><div><span>Current status</span><Status>In Progress</Status></div><div><span>Investigation progress</span><strong>44%</strong><i><b /></i></div><div className="assignment-detail-actions"><button type="button">Reassign Officer</button><button className="primary-small" onClick={() => setPage("progress")} type="button">View Full Progress</button></div></div>
    <div className="detail-layout"><div><Panel title="Assignment Information"><div className="detail-grid">{[["Assignment ID","ASN-00842"],["Complaint ID","CMP-00120"],["Complaint Category","Assault"],["Assigned Officer","PO-031 · Nimali Silva"],["Assignment Date","29 Sep 2026 · 11:02 AM"],["Priority","Medium"],["Current Status","In Progress"],["Due Date","05 Oct 2026"],["Complaint Location","Lewis Place, Negombo"]].map(([a,b])=><div key={a}><span>{a}</span><strong>{b}</strong></div>)}</div><div className="description-block"><span>Instructions / Task Description</span><p>Review attached evidence, record relevant witness statements, and submit an investigation progress update before the assigned due date.</p></div></Panel>
      <Panel title="Relevant Actions"><div className="assignment-actions-list"><button type="button"><Icon name="profile" /><span><strong>View Officer Profile</strong><small>Open PO-031 station profile</small></span>→</button><button onClick={() => setPage("complaints")} type="button"><Icon name="file" /><span><strong>View Complaint</strong><small>Open CMP-00120 complaint details</small></span>→</button></div></Panel></div>
      <Panel title="Progress / Status Timeline"><div className="investigation-timeline">{[["Complaint Verified","29 Sep · 10:45 AM","Approved for officer assignment"],["Officer Assigned","29 Sep · 11:02 AM","Assigned to PO-031"],["Investigation Started","29 Sep · 1:20 PM","Officer acknowledged assignment"],["Initial Update","30 Sep · 9:15 AM","Witness contact initiated"],["Investigation Completed","Pending","Awaiting completion"]].map((x,i)=><div className={i<4?"complete":""} key={x[0]}><i>{i<4?"✓":i+1}</i><span><strong>{x[0]}</strong><small>{x[1]}</small><p>{x[2]}</p></span></div>)}</div></Panel>
    </div>
  </>;
}

function ProfilePage({ setPage }: { setPage: (page: StationPage) => void }) {
  return <><PageIntro title="Station Profile" description="Authorized Police Station account identity and access information." tag="Police Station Account" /><div className="officer-profile-banner station-profile-banner"><span>NP</span><div><p>Police Station Account</p><h2>Negombo Police Station</h2><small>PS-001 · Western Province</small></div><Status>Active</Status></div>
    <div className="detail-layout"><Panel title="Profile Information"><div className="profile-info">{[["Station Name","Negombo Police Station"],["Station ID","PS-001"],["Account Type","Police Station"],["Email","negombo.station@police.gov.lk"],["Contact","+94 31 222 2222"],["Service Area","Negombo Municipal Area"]].map(([a,b])=><div key={a}><span>{a}</span><strong>{b}</strong></div>)}</div><div className="profile-settings-link"><span>Manage account security and notification preferences.</span><button onClick={() => setPage("settings")} type="button">Open Settings →</button></div></Panel><Panel title="Access & Security"><div className="security-rows"><div><span><Icon name="shield" /><i><strong>Role-Based Access</strong><small>Station-scoped permissions enabled</small></i></span><Status>Secure</Status></div><div><span><Icon name="activity" /><i><strong>Last Login</strong><small>30 September 2026 · 07:42 AM</small></i></span></div><div><span><Icon name="check" /><i><strong>Account Status</strong><small>Authorized by Police IT Head Office</small></i></span><Status>Active</Status></div></div></Panel></div>
  </>;
}

export default function StationPages({ page, setPage }: PageProps) {
  return (
    <main className="workspace-main">
      {page === "complaints" && <ComplaintsPage />}
      {page === "review" && <ReviewPage setPage={setPage} />}
      {page === "assignments" && <AssignmentsPage setPage={setPage} />}
      {page === "officers" && <OfficersPage />}
      {page === "progress" && <ProgressPage />}
      {page === "settings" && <SettingsPage />}
      {page === "reviewCases" && <ReviewCasesPage setPage={setPage} />}
      {page === "activeCases" && <ActiveCasesPage setPage={setPage} />}
      {page === "map" && <FullMapPage setPage={setPage} />}
      {page === "activity" && <ActivityLogPage setPage={setPage} />}
      {page === "profile" && <ProfilePage setPage={setPage} />}
      {page === "assignmentDetails" && <AssignmentDetailsPage setPage={setPage} />}
    </main>
  );
}
