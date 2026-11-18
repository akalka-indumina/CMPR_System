
import { useState } from 'react';
import { h } from '../../lib/h';
import { Fld } from '../../components/ui/Primitives';
import { B1, INP, PORTALS, RL } from '../../lib/constants';
import { verifyPassword } from '../../lib/credentials';

export function Login({
  go,
  portal,
  users,
  applications = [],
  onLogin,
  onStatus,
  toast
}) {
  const P = PORTALS[portal] || PORTALS.staff;
  const first = P.roles[0];

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState(users[first].email);
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState('');
  const [application, setApplication] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // LOGIN FUNCTION - ORIGINAL FUNCTIONALITY
  const signIn = async () => {
    setSubmitting(true);
    setApplication(null);

    try {
      const candidates = P.roles.flatMap(role => {
        const accounts = role === 'citizen'
          ? [
              users.citizen,
              ...(users.citizens || []).filter(
                user => user.status === 'Approved'
              )
            ]
          : [users[role]];

        return accounts.map(account => ({ role, account }));
      });

      const normalizedEmail = email.trim().toLowerCase();
      let matchedAccount = null;

      for (const candidate of candidates) {
        const identifiers = [
          candidate.account.email,
          candidate.account.id
        ]
          .filter(Boolean)
          .map(identifier => identifier.trim().toLowerCase());

        if (
          identifiers.includes(normalizedEmail) &&
          await verifyPassword(password, candidate.account)
        ) {
          matchedAccount = candidate;
          break;
        }
      }

      if (matchedAccount) {
        setError('');
        toast('Signed in as ' + RL[matchedAccount.role] + '.');

        onLogin({
          role: matchedAccount.role,
          id: matchedAccount.account.id
        });

        return;
      }

      let matchingApplication = null;

      if (P.roles.includes('citizen')) {
        const possibleApplications = [...applications]
          .filter(
            item =>
              item.email.trim().toLowerCase() === normalizedEmail &&
              item.status !== 'Approved'
          )
          .sort((a, b) =>
            b.submittedAt.localeCompare(a.submittedAt)
          );

        for (const item of possibleApplications) {
          if (await verifyPassword(password, item)) {
            matchingApplication = item;
            break;
          }
        }
      }

      if (matchingApplication) {
        setApplication(matchingApplication);

        const message =
          matchingApplication.status === 'Rejected'
            ? `This application was rejected. Reference: ${matchingApplication.referenceNumber}.`
            : `Application ${matchingApplication.referenceNumber} is pending review. Dashboard access is not available yet.`;

        setError(message);
        toast(message, 'err');

        return;
      }

      setError('Incorrect email or password.');
      toast('Incorrect email or password.', 'err');

    } catch (loginError) {
      const message =
        loginError instanceof Error
          ? loginError.message
          : 'Could not verify credentials.';

      setError(message);
      toast(message, 'err');

    } finally {
      setSubmitting(false);
    }
  };

  // LOGIN DASHBOARD DESIGN
  return h`
    <div className="relative min-h-screen flex items-center
      overflow-hidden bg-slate-950">

      <!-- BACKGROUND IMAGE -->

      <img
        src="src/features/auth/public/police-headquarters.jpg"
        alt="Sri Lanka Police Headquarters"
        className="absolute inset-0 w-full h-full object-cover"
      />

      <!-- DARK OVERLAY -->

      <div className="absolute inset-0 bg-slate-950/55"></div>

      <div className="absolute inset-0
        bg-gradient-to-r from-slate-950/70
        via-slate-950/35 to-slate-950/65">
      </div>

      <!-- MAIN CONTENT -->

      <div className="relative z-10 w-full max-w-7xl
        mx-auto px-6 py-10">

        <div className="grid md:grid-cols-2
          gap-10 lg:gap-20 items-center">

          <!-- LEFT SIDE: POLICE BRANDING -->

          <div className="text-white space-y-6">

            <img
              src="src/features/auth/public/sri-lanka-police-logo.png"
              alt="Sri Lanka Police Official Logo"
              className="w-28 h-28 md:w-36 md:h-36
                object-contain drop-shadow-xl"
            />

            <div className="space-y-3">

              <p className="text-red-400 text-xs
                md:text-sm font-bold tracking-[0.3em]">
                OFFICIAL POLICE SERVICE
              </p>

              <h1 className="text-4xl md:text-6xl
                font-extrabold tracking-tight leading-tight">
                SRI LANKA

                <span className="block text-blue-300">
                  POLICE
                </span>
              </h1>

              <div className="w-24 h-1
                bg-red-600 rounded-full">
              </div>

              <h2 className="text-xl md:text-2xl
                font-semibold">
                Complaint Management System
              </h2>

              <p className="text-slate-200 text-sm
                md:text-base max-w-lg leading-relaxed">
                An integrated platform for managing,
                monitoring and handling public complaints
                efficiently.
              </p>

            </div>

            <div className="pt-4">

              <p className="text-slate-300 text-xs
                tracking-[0.2em]">
                JUSTICE · SERVICE · INTEGRITY
              </p>

            </div>

          </div>

          <!-- RIGHT SIDE: LOGIN FORM -->

          <div className="w-full max-w-md mx-auto
            md:ml-auto">

            <div className="bg-slate-950/75
              backdrop-blur-xl
              border border-white/20
              rounded-2xl shadow-2xl
              p-7 md:p-9">

              <!-- LOGIN HEADING -->

              <div className="mb-7">

                <p className="text-red-400 text-xs
                  font-bold tracking-widest mb-2">
                  SECURE ACCESS
                </p>

                <h2 className="text-white text-3xl
                  font-bold">
                  Welcome Back
                </h2>

                <p className="text-slate-300 text-sm mt-2">
                  ${P.sub}. Sign in to continue.
                </p>

              </div>

              <!-- USERNAME -->

              <${Fld} l="Username or Email">

                <input
                  className=${INP}
                  autoComplete="username"
                  value=${email}
                  onChange=${event => {
                    setEmail(event.target.value);
                    setError('');
                    setApplication(null);
                  }}
                />

              <//>

              <!-- PASSWORD -->

              <${Fld} l="Password">

                <div className="relative">

                  <input
                    className=${INP}
                    autoComplete="current-password"
                    type=${showPassword ? 'text' : 'password'}
                    value=${password}
                    onChange=${event => {
                      setPassword(event.target.value);
                      setError('');
                      setApplication(null);
                    }}
                  />

                  <button
                    type="button"
                    className="absolute right-2 top-2
                      text-xs text-mu"
                    onClick=${() =>
                      setShowPassword(!showPassword)}
                  >
                    ${showPassword ? 'Hide' : 'Show'}
                  </button>

                </div>

              <//>

              <!-- LOGIN ERROR -->

              ${error && h`
                <p role="alert"
                  className="text-red-400 text-xs mt-3">
                  ${error}
                </p>
              `}

              <!-- APPLICATION STATUS -->

              ${application && h`
                <button
                  type="button"
                  className="text-red-400 text-xs underline mt-2"
                  onClick=${() =>
                    onStatus(application.referenceNumber)}
                >
                  Check application status
                </button>
              `}

              <!-- REMEMBER ME -->

              <div className="flex justify-between
                items-center text-xs text-slate-200 my-4">

                <label className="flex gap-2 items-center">
                  <input type="checkbox"/>
                  Remember me
                </label>

                <button
                  type="button"
                  className="text-red-400 hover:text-red-300"
                  onClick=${() =>
                    alert('Demo: password recovery requires a secure backend.')}
                >
                  Forgot password?
                </button>

              </div>

              <!-- SIGN IN BUTTON -->

              <button
                className=${B1 + ' w-full py-3 text-sm font-bold tracking-wide'}
                disabled=${submitting}
                onClick=${signIn}
              >
                ${submitting ? 'Checking...' : 'SIGN IN'}
              </button>

              <!-- CITIZEN REGISTRATION -->

              ${
                portal === 'public' && h`
                  <p className="text-center
                    text-slate-300 text-xs mt-4">

                    Citizen without an account?

                    <button
                      type="button"
                      className="text-red-400 ml-1"
                      onClick=${() => go('register')}
                    >
                      Register
                    </button>

                  </p>
                `
              }

              <!-- FOOTER -->

              <div className="border-t border-white/15
                mt-6 pt-4">

                <p className="text-center
                  text-slate-400 text-xs">
                  SRI LANKA POLICE
                </p>

                <p className="text-center
                  text-slate-500 text-xs mt-1">
                  Authorized Access Only
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  `;
}
