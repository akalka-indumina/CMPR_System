"use client";

import { useEffect, useState } from "react";
import StationPages, { StationPage } from "./StationPages";
import { Icon, type IconName } from "@/components/shared/Icon";

function Mark() {
  return (
    <div className="dash-logo">
      <svg aria-hidden="true" viewBox="0 0 32 38">
        <path d="M16 1.5 29 6v10.6c0 9-5.4 16-13 19.4C8.4 32.6 3 25.6 3 16.6V6l13-4.5Z" fill="currentColor" />
        <path d="m16 8 2.3 4.7 5.2.7-3.8 3.7.9 5.2-4.6-2.4-4.6 2.4.9-5.2-3.8-3.7 5.2-.7L16 8Z" fill="#fff" />
      </svg>
    </div>
  );
}

const navigation: { label: string; icon: IconName; page: StationPage }[] = [
  { label: "Dashboard", icon: "dashboard", page: "dashboard" },
  { label: "Complaints", icon: "file", page: "complaints" },
  { label: "Complaint Review", icon: "review", page: "review" },
  { label: "Assignments", icon: "clipboard", page: "assignments" },
  { label: "Police Officers", icon: "officers", page: "officers" },
  { label: "Progress Monitoring", icon: "activity", page: "progress" },
];

const reviewComplaints = [
  { id: "CMP-00125", category: "Theft", time: "10:32 AM", priority: "High" },
  { id: "CMP-00126", category: "Property Damage", time: "11:05 AM", priority: "Medium" },
  { id: "CMP-00127", category: "Lost Property", time: "12:20 PM", priority: "Low" },
];

const activeCases = [
  { id: "CMP-00118", category: "Theft", officer: "PO-024", status: "In Progress", priority: "High" },
  { id: "CMP-00120", category: "Assault", officer: "PO-031", status: "In Progress", priority: "Medium" },
  { id: "CMP-00122", category: "Vehicle Incident", officer: "PO-042", status: "Assigned", priority: "High" },
];

const stats: { label: string; value: number; hint: string; icon: IconName; tone: string }[] = [
  { label: "Total Complaints", value: 128, hint: "+12 this month", icon: "file", tone: "blue" },
  { label: "Pending Review", value: 17, hint: "Requires attention", icon: "review", tone: "amber" },
  { label: "Active Cases", value: 21, hint: "8 progressing today", icon: "cases", tone: "purple" },
  { label: "Completed Cases", value: 86, hint: "67.2% resolution", icon: "check", tone: "green" },
  { label: "High Priority", value: 4, hint: "2 newly received", icon: "alert", tone: "red" },
];

function Priority({ value }: { value: string }) {
  return <span className={`priority priority-${value.toLowerCase()}`}><i />{value}</span>;
}

function CardHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="card-header">
      <div>
        <h3>{title}</h3>
        <span className="card-rule" />
      </div>
      {action && <button className="text-action" onClick={onAction} type="button">{action} <span>→</span></button>}
    </div>
  );
}

export default function PoliceDashboard({ onLogout }: { onLogout: () => void }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [page, setPage] = useState<StationPage>("dashboard");
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const pageTitles: Record<StationPage, string> = {
    dashboard: "Dashboard",
    complaints: "Complaints",
    review: "Complaint Review",
    assignments: "Assignments",
    officers: "Police Officers",
    progress: "Progress Monitoring",
    settings: "Settings",
    reviewCases: "Review Required Cases",
    activeCases: "Active Cases",
    map: "Complaint Map",
    activity: "Recent Activity",
    profile: "Profile",
    assignmentDetails: "Assignment Details",
  };

  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(now ?? new Date(0));
  const formattedTime = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now ?? new Date(0));

  const toggleProfile = () => {
    setProfileOpen((open) => !open);
    setNotificationsOpen(false);
  };

  const toggleNotifications = () => {
    setNotificationsOpen((open) => !open);
    setProfileOpen(false);
  };

  return (
    <div className={darkMode ? "dashboard-app dark" : "dashboard-app"}>
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <Mark />
          <div>
            <strong>ICCMPRS</strong>
            <span>Police Response System</span>
          </div>
        </div>
        <div className="station-access">
          <span><Icon name="shield" /></span>
          <div><small>Station account</small><strong>PS-001</strong></div>
        </div>
        <nav aria-label="Primary navigation">
          <p>Operations</p>
          {navigation.slice(0, 6).map((item) => (
            <button className={page === item.page ? "nav-item active" : "nav-item"} key={item.label} onClick={() => setPage(item.page)} type="button">
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.label === "Complaint Review" && <b>17</b>}
            </button>
          ))}
        </nav>
        <div className="access-scope">
          <Icon name="shield" />
          <div><strong>Protected workspace</strong><span>Station-scoped access only</span></div>
        </div>
        <div className="sidebar-version">ICCMPRS · Secure Network <span>v2.4</span></div>
      </aside>

      <div className="dashboard-content">
        <header className="dashboard-topbar">
          <div className="mobile-dashboard-brand"><Mark /><strong>ICCMPRS</strong></div>
          <div className="topbar-page-title">
            <strong>{pageTitles[page]}</strong>
            <span>Community Safety <i>/</i> {page === "dashboard" ? "Overview" : pageTitles[page]}</span>
          </div>
          <div className="topbar-actions">
            <div className="header-datetime" aria-label={`${formattedDate}, ${formattedTime}`}>
              <span>{formattedDate}</span>
              <i />
              <strong>{formattedTime}</strong>
            </div>
            <button
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              aria-pressed={darkMode}
              className="theme-toggle"
              onClick={() => setDarkMode((enabled) => !enabled)}
              title={darkMode ? "Light mode" : "Dark mode"}
              type="button"
            >
              <Icon name={darkMode ? "sun" : "moon"} />
            </button>
            <div className="dropdown-anchor">
              <button aria-label="Notifications, 4 unread" className="bell-button" onClick={toggleNotifications} type="button">
                <Icon name="bell" /><span>4</span>
              </button>
              {notificationsOpen && (
                <div className="header-dropdown notification-dropdown">
                  <div className="dropdown-title"><strong>Notifications</strong><span>4 unread</span></div>
                  <div className="notification-item urgent"><i><Icon name="alert" /></i><div><strong>High-priority complaint received</strong><span>CMP-00125 · 2 min ago</span></div></div>
                  <div className="notification-item"><i><Icon name="review" /></i><div><strong>3 complaints require review</strong><span>8 min ago</span></div></div>
                  <div className="notification-item"><i><Icon name="check" /></i><div><strong>Officer completed assigned complaint</strong><span>CMP-00114 · 24 min ago</span></div></div>
                  <div className="notification-item"><i><Icon name="activity" /></i><div><strong>CMP-00125 requires action</strong><span>35 min ago</span></div></div>
                  <button className="dropdown-footer" type="button">View All Notifications <span>→</span></button>
                </div>
              )}
            </div>
            <div className="topbar-divider" />
            <div className="dropdown-anchor">
              <button aria-expanded={profileOpen} className="profile-button" onClick={toggleProfile} type="button">
                <span className="profile-avatar">NP</span>
                <span className="profile-copy"><strong>Negombo Police Station</strong><small>Station Administrator</small></span>
                <Icon name="chevron" />
              </button>
              {profileOpen && (
                <div className="header-dropdown profile-dropdown">
                  <div className="dropdown-profile"><span className="profile-avatar">NP</span><div><strong>Negombo Police Station</strong><span>PS-001</span></div></div>
                  <button onClick={() => { setPage("profile"); setProfileOpen(false); }} type="button"><Icon name="profile" />Profile</button>
                  <button onClick={() => { setPage("settings"); setProfileOpen(false); }} type="button"><Icon name="gear" />Settings</button>
                  <hr />
                  <button className="logout-menu-item" onClick={() => { setProfileOpen(false); setLogoutOpen(true); }} type="button"><Icon name="logout" />Logout</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {page === "dashboard" ? <main className="dashboard-main">
          <section className="dashboard-greeting">
            <div>
              <p>Police Station Dashboard</p>
              <h1>Good Morning, Police Station</h1>
              <div className="station-line"><strong>Negombo Police Station</strong><span />Station ID: PS-001</div>
            </div>
          </section>

          <section className="stats-grid" aria-label="Complaint summary">
            {stats.map((stat) => (
              <article className={`stat-card ${stat.tone === "amber" ? "attention" : ""}`} key={stat.label}>
                <div className={`stat-icon ${stat.tone}`}><Icon name={stat.icon} /></div>
                <div className="stat-card-top"><span>{stat.label}</span><button aria-label={`View ${stat.label}`} type="button">•••</button></div>
                <strong className="stat-value">{stat.value}</strong>
                <div className={`stat-hint ${stat.tone}`}><Icon name={stat.tone === "amber" || stat.tone === "red" ? "alert" : "trend"} />{stat.hint}</div>
                <span className={`stat-indicator ${stat.tone}`} />
              </article>
            ))}
          </section>
          <div className="dashboard-summary-action">
            <button className="text-action" onClick={() => setPage("complaints")} type="button">View All Complaints <span>→</span></button>
          </div>

          <section className="dashboard-grid">
            <article className="dashboard-card review-card">
              <CardHeader title="Complaints Requiring Review" action="View All Cases" onAction={() => setPage("reviewCases")} />
              <div className="table-scroll">
                <table>
                  <thead><tr><th>Complaint ID</th><th>Category</th><th>Date / Time</th><th>Priority</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>
                    {reviewComplaints.map((item) => (
                      <tr key={item.id}>
                        <td><strong>{item.id}</strong></td><td>{item.category}</td><td><span className="table-date">30 Sep</span>{item.time}</td><td><Priority value={item.priority} /></td>
                        <td><span className="status status-review">Under Review</span></td><td><button className="review-button" type="button">Review <span>→</span></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="dashboard-card status-card">
              <CardHeader title="Complaint Status Overview" />
              <div className="chart-wrap">
                <div className="donut-chart"><div><strong>128</strong><span>Total</span></div></div>
                <div className="chart-legend">
                  {[["Under Review", "17", "orange"], ["Verified", "12", "cyan"], ["Assigned", "8", "purple"], ["In Progress", "21", "blue"], ["Completed", "66", "green"], ["Rejected", "4", "gray"]].map(([label, value, color]) => (
                    <div key={label}><span><i className={color} />{label}</span><strong>{value}</strong></div>
                  ))}
                </div>
              </div>
              <div className="resolution-note"><Icon name="trend" /><span><strong>8.4% increase</strong> in case resolution this month</span></div>
            </article>

            <article className="dashboard-card active-card">
              <CardHeader title="Active Cases" action="View All Cases" onAction={() => setPage("activeCases")} />
              <div className="table-scroll">
                <table>
                  <thead><tr><th>Complaint ID</th><th>Category</th><th>Assigned Officer</th><th>Current Status</th><th>Priority</th></tr></thead>
                  <tbody>
                    {activeCases.map((item) => (
                      <tr key={item.id}><td><strong>{item.id}</strong></td><td>{item.category}</td><td><span className="officer-avatar">{item.officer.slice(-2)}</span><strong className="officer-id">{item.officer}</strong></td><td><span className={`status ${item.status === "Assigned" ? "status-assigned" : "status-progress"}`}>{item.status}</span></td><td><Priority value={item.priority} /></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="dashboard-card map-card">
              <CardHeader title="Live Complaint Map" action="View Full Map" onAction={() => setPage("map")} />
              <div className="map-visual">
                <svg aria-hidden="true" viewBox="0 0 500 265" preserveAspectRatio="none">
                  <path className="map-water" d="M0 0h150c-8 34 21 55 5 92-17 39 15 62-5 101-11 22-7 48 4 72H0Z" />
                  <g className="map-roads"><path d="M168-10c55 43 69 80 48 119-27 49 15 101 33 165M137 71c88 9 164 5 240-39M146 197c79-32 171-37 366-19M278 0c-15 51 7 91 72 120 58 27 91 75 105 153M214 111c75 5 122 29 151 73M367 32c-33 60-30 111 8 152" /><path className="minor" d="M159 35c99 55 213 67 341 36M183 238c65-77 165-121 300-130M257 77c21 63 15 126-18 188M328 6c37 86 90 140 166 163" /></g>
                </svg>
                <span className="map-label label-sea">Laccadive Sea</span><span className="map-label label-negombo">NEGOMBO</span><span className="map-label label-katana">Katana</span>
                <span className="map-marker station-marker"><Icon name="shield" /><b>Negombo Police</b></span>
                <span className="map-marker high-marker marker-a"><i /><b>High</b></span><span className="map-marker high-marker marker-b"><i /></span>
                <span className="map-marker active-marker marker-c"><i /></span><span className="map-marker active-marker marker-d"><i /></span><span className="map-marker review-marker marker-e"><i /></span>
                <div className="map-legend"><span><i className="station" />Station</span><span><i className="high" />High priority</span><span><i className="active" />Active</span><span><i className="review" />Review</span></div>
              </div>
            </article>

            <article className="dashboard-card workload-card">
              <CardHeader title="Officer Workload" action="View Officers" onAction={() => setPage("officers")} />
              <div className="workload-list">
                {[["PO-024", "4", "80"], ["PO-031", "2", "40"], ["PO-042", "5", "100"], ["PO-051", "1", "20"]].map(([officer, count, load], index) => (
                  <div className="workload-row" key={officer}>
                    <span className={`officer-avatar color-${index}`}>{officer.slice(-2)}</span>
                    <div className="workload-main"><div><strong>{officer}</strong><span>{count} Active Complaint{count === "1" ? "" : "s"}</span></div><div className="load-track"><i style={{ width: `${load}%` }} /></div></div>
                    <b>{count}/5</b>
                  </div>
                ))}
              </div>
            </article>

            <article className="dashboard-card activity-card">
              <CardHeader title="Recent Activity" action="View Activity" onAction={() => setPage("activity")} />
              <div className="activity-list">
                {[
                  ["10:32 AM", "New complaint CMP-00125 received", "alert"],
                  ["10:45 AM", "CMP-00120 verified", "check"],
                  ["11:02 AM", "CMP-00120 assigned to PO-031", "clipboard"],
                  ["11:30 AM", "PO-024 updated CMP-00118", "activity"],
                  ["12:05 PM", "CMP-00114 marked as completed", "check"],
                ].map(([time, copy, icon], index) => (
                  <div className="activity-row" key={time}><span className={`activity-dot dot-${index}`}><Icon name={icon as IconName} /></span><div><strong>{copy}</strong><span>{time} · Today</span></div></div>
                ))}
              </div>
            </article>
          </section>
          <footer className="dashboard-footer"><span>Station-scoped secure workspace</span><span><Icon name="shield" /> Role-Based Access Control enabled</span></footer>
        </main> : <StationPages page={page} setPage={setPage} />}
      </div>

      {logoutOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setLogoutOpen(false)}>
          <div aria-labelledby="logout-title" aria-modal="true" className="logout-modal" onMouseDown={(event) => event.stopPropagation()} role="dialog">
            <div className="modal-icon"><Icon name="logout" /></div>
            <h2 id="logout-title">Are you sure you want to log out?</h2>
            <p>You will need your Police Station ID and password to securely access the dashboard again.</p>
            <div className="modal-actions"><button onClick={() => setLogoutOpen(false)} type="button">Cancel</button><button onClick={onLogout} type="button">Logout</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
