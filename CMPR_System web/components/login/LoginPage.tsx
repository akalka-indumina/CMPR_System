"use client";

import { FormEvent, useId, useState } from "react";
import { useRouter } from "next/navigation";

type Role = "admin" | "station";

function ShieldMark() {
  return (
    <svg
      aria-hidden="true"
      className="shield-mark"
      viewBox="0 0 48 56"
      fill="none"
    >
      <path
        d="M24 2.75 43 10v15.25C43 38.1 35.1 48.45 24 53 12.9 48.45 5 38.1 5 25.25V10l19-7.25Z"
        fill="currentColor"
      />
      <path
        d="m24 13 3.25 6.6 7.28 1.06-5.27 5.13 1.25 7.25L24 29.62l-6.51 3.42 1.25-7.25-5.27-5.13 7.28-1.06L24 13Z"
        fill="white"
      />
      <path
        d="M24 2.75 43 10v15.25C43 38.1 35.1 48.45 24 53 12.9 48.45 5 38.1 5 25.25V10l19-7.25Z"
        stroke="white"
        strokeOpacity=".5"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function AdminIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 13.25a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM4.75 20c.8-3.22 3.42-5 7.25-5s6.45 1.78 7.25 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="m17.2 7.65.9.52v1.05l-.9.52-.9-.52V8.17l.9-.52Z"
        fill="currentColor"
      />
    </svg>
  );
}

function StationIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 20h18M5.5 20V9.5h13V20M4 9.5h16L12 4 4 9.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M9 20v-5h6v5M8 12h.01M12 12h.01M16 12h.01"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EyeIcon({ visible }: { visible: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      {visible ? (
        <>
          <path
            d="M2.75 12s3.35-5.25 9.25-5.25S21.25 12 21.25 12 17.9 17.25 12 17.25 2.75 12 2.75 12Z"
            stroke="currentColor"
            strokeWidth="1.65"
            strokeLinejoin="round"
          />
          <circle
            cx="12"
            cy="12"
            r="2.35"
            stroke="currentColor"
            strokeWidth="1.65"
          />
        </>
      ) : (
        <>
          <path
            d="M9.62 6.98A10.7 10.7 0 0 1 12 6.75c5.9 0 9.25 5.25 9.25 5.25a14.9 14.9 0 0 1-2.08 2.54M6.04 8.5C3.92 9.96 2.75 12 2.75 12s3.35 5.25 9.25 5.25c1.07 0 2.04-.17 2.92-.45M4 4l16 16"
            stroke="currentColor"
            strokeWidth="1.65"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}

function LockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.65"
      />
      <path
        d="M8.25 10V7.6a3.75 3.75 0 0 1 7.5 0V10M12 14v2.5"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("admin");
  const [showPassword, setShowPassword] = useState(false);
  const idInputId = useId();
  const passwordInputId = useId();
  const isAdmin = role === "admin";

  const selectRole = (nextRole: Role) => {
    setRole(nextRole);
    setShowPassword(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: replace with a real authentication call (see README, "Next steps").
    router.push(isAdmin ? "/admin" : "/station");
  };

  return (
    <main className="login-page" data-role={role}>
      <section className="brand-panel" aria-label="System introduction">
        <div className="brand-glow" />
        <div className="brand-grid" aria-hidden="true" />

        <header className="brand-header">
          <div className="logo-tile">
            <ShieldMark />
          </div>
          <div>
            <p className="brand-kicker">Public Safety Network</p>
            <p className="brand-short">ICCMPRS</p>
          </div>
        </header>

        <div className="brand-content">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            Secure response coordination
          </div>
          <h1>
            Safer communities.
            <br />
            <span>Faster response.</span>
          </h1>
          <p className="brand-description">
            Integrated Community Complaint Management and Police Response
            System
          </p>

          <div className="network-visual" aria-hidden="true">
            <div className="visual-orbit orbit-one" />
            <div className="visual-orbit orbit-two" />
            <div className="visual-core">
              <ShieldMark />
            </div>
            <span className="visual-node node-one" />
            <span className="visual-node node-two" />
            <span className="visual-node node-three" />
            <span className="visual-node node-four" />
          </div>

          <div className="trust-row">
            <div className="trust-item">
              <span className="trust-check">✓</span>
              <div>
                <strong>Protected access</strong>
                <small>Encrypted &amp; monitored</small>
              </div>
            </div>
            <div className="trust-divider" />
            <div className="trust-item">
              <span className="trust-check">✓</span>
              <div>
                <strong>Role-based control</strong>
                <small>Authorized personnel only</small>
              </div>
            </div>
          </div>
        </div>

        <footer className="brand-footer">
          <span>Government Public Safety Infrastructure</span>
          <span className="footer-status">
            <i />
            Network secure
          </span>
        </footer>
      </section>

      <section className="form-panel" aria-label="Login">
        <div className="system-status">
          <span />
          All systems operational
        </div>

        <div className="login-shell">
          <div className="mobile-brand">
            <div className="logo-tile">
              <ShieldMark />
            </div>
            <div>
              <p className="brand-kicker">Public Safety Network</p>
              <p className="brand-short">ICCMPRS</p>
            </div>
          </div>

          <div className="login-heading">
            <p className="section-label">Authorized access</p>
            <h2>Welcome back</h2>
            <p>Select your role and enter your assigned credentials.</p>
          </div>

          <div className="role-tabs" role="tablist" aria-label="Login role">
            <button
              aria-selected={isAdmin}
              className={isAdmin ? "role-tab active" : "role-tab"}
              onClick={() => selectRole("admin")}
              role="tab"
              type="button"
            >
              <span className="role-icon">
                <AdminIcon />
              </span>
              <span>
                <small>System access</small>
                Admin
              </span>
              <i className="selected-mark">✓</i>
            </button>
            <button
              aria-selected={!isAdmin}
              className={!isAdmin ? "role-tab active" : "role-tab"}
              onClick={() => selectRole("station")}
              role="tab"
              type="button"
            >
              <span className="role-icon">
                <StationIcon />
              </span>
              <span>
                <small>Field access</small>
                Police Station
              </span>
              <i className="selected-mark">✓</i>
            </button>
          </div>

          <div className="role-banner">
            <span className="banner-icon">
              {isAdmin ? <AdminIcon /> : <StationIcon />}
            </span>
            <div>
              <strong>
                {isAdmin ? "Administrator portal" : "Police station portal"}
              </strong>
              <p>
                {isAdmin
                  ? "Manage stations, access controls, and system operations."
                  : "Access assigned complaints and coordinate police response."}
              </p>
            </div>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="field-group">
              <label htmlFor={idInputId}>
                {isAdmin ? "Admin ID" : "Police Station ID"}
              </label>
              <div className="input-wrap">
                <span className="input-icon">
                  {isAdmin ? <AdminIcon /> : <StationIcon />}
                </span>
                <input
                  autoComplete="username"
                  id={idInputId}
                  name="username"
                  placeholder={
                    isAdmin ? "Enter your admin ID" : "Enter your station ID"
                  }
                  required
                  type="text"
                />
              </div>
            </div>

            <div className="field-group">
              <label htmlFor={passwordInputId}>Password</label>
              <div className="input-wrap">
                <span className="input-icon">
                  <LockIcon />
                </span>
                <input
                  autoComplete="current-password"
                  id={passwordInputId}
                  name="password"
                  placeholder="Enter your password"
                  required
                  type={showPassword ? "text" : "password"}
                />
                <button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  type="button"
                >
                  <EyeIcon visible={showPassword} />
                </button>
              </div>
            </div>

            <button className="login-button" type="submit">
              Sign in to {isAdmin ? "Admin Portal" : "Station Portal"}
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <p className="access-note">
            <LockIcon />
            Accounts are issued and managed by the system administrator.
          </p>
        </div>

        <footer className="form-footer">
          <span>© 2025 ICCMPRS</span>
          <span>Secure access portal · v2.4</span>
        </footer>
      </section>
    </main>
  );
}
