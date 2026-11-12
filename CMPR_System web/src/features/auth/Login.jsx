import { useState } from 'react';
import { h } from '../../lib/h';
import { Fld } from '../../components/ui/Primitives';
import { B1, B2, INP, PORTALS, RL } from '../../lib/constants';
import { Ic } from '../../components/ui/Icon';
import { verifyPassword } from '../../lib/credentials';

export function Login({ go, portal, users, applications = [], onLogin, onStatus, toast }) {
  const P = PORTALS[portal] || PORTALS.staff;
  const first = P.roles[0];
  const [role, setRole] = useState(first);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState(users[first].email);
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState('');
  const [application, setApplication] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const changeRole = selectedRole => {
    setRole(selectedRole);
    setEmail(users[selectedRole].email);
    setPassword('demo1234');
    setError('');
    setApplication(null);
  };

  const signIn = async () => {
    if (!P.roles.includes(role)) {
      setError('Choose a role available in this portal.');
      return;
    }
    setSubmitting(true);
    setApplication(null);
    try {
      const candidates = role === 'citizen'
        ? [users.citizen, ...(users.citizens || []).filter(user => user.status === 'Approved')]
        : [users[role]];
      const normalizedEmail = email.trim().toLowerCase();
      let account = null;
      for (const candidate of candidates) {
        if (candidate.email?.trim().toLowerCase() === normalizedEmail
          && await verifyPassword(password, candidate)) {
          account = candidate;
          break;
        }
      }
      if (account) {
        setError('');
        toast('Signed in as ' + RL[role] + '.');
        onLogin({ role, id: account.id });
        return;
      }

      let matchingApplication = null;
      if (role === 'citizen') {
        const possibleApplications = [...applications]
          .filter(item => item.email.trim().toLowerCase() === normalizedEmail && item.status !== 'Approved')
          .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
        for (const item of possibleApplications) {
          if (await verifyPassword(password, item)) {
            matchingApplication = item;
            break;
          }
        }
      }
      if (matchingApplication) {
        setApplication(matchingApplication);
        const message = matchingApplication.status === 'Rejected'
          ? `This application was rejected. Reference: ${matchingApplication.referenceNumber}.`
          : `Application ${matchingApplication.referenceNumber} is pending review. Dashboard access is not available yet.`;
        setError(message);
        toast(message, 'err');
        return;
      }
      setError('Incorrect email or password.');
      toast('Incorrect email or password.', 'err');
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : 'Could not verify credentials.';
      setError(message);
      toast(message, 'err');
    } finally {
      setSubmitting(false);
    }
  };

  return h`<div className="min-h-screen flex items-center justify-center p-4"><div className="w-full max-w-md bg-cd border border-bd rounded-xl p-6 space-y-4">
    <div className="text-center"><div className="w-12 h-12 mx-auto rounded-xl bg-pr flex items-center justify-center mb-2"><${Ic} n="shield" s=${26}/></div><h1 className="font-bold text-lg">${P.title}</h1><p className="text-mu text-sm">${P.sub}. Sign in to continue.</p></div>
    <div className="grid grid-cols-2 gap-2">${P.roles.map(k=>h`<button key=${k} type="button" onClick=${()=>changeRole(k)} className=${'p-2 rounded-lg text-xs border min-h-[44px] '+(role==k?'border-pr bg-pr/15 text-white':'border-bd text-mu hover:bg-ip')}>${RL[k]}</button>`)}</div>
    <${Fld} l="User ID / Email"><input className=${INP} autoComplete="username" value=${email} onChange=${event=>{setEmail(event.target.value);setError('');setApplication(null)}}/><//>
    <${Fld} l="Password"><div className="relative"><input className=${INP} autoComplete="current-password" type=${showPassword?'text':'password'} value=${password} onChange=${event=>{setPassword(event.target.value);setError('');setApplication(null)}}/><button type="button" className="absolute right-2 top-2 text-xs text-mu" onClick=${()=>setShowPassword(!showPassword)}>${showPassword?'Hide':'Show'}</button></div><//>
    ${error&&h`<p role="alert" className="text-red-400 text-xs">${error}</p>`}
    ${application&&h`<button type="button" className="text-red-400 text-xs underline" onClick=${()=>onStatus(application.referenceNumber)}>Check application status</button>`}
    <div className="flex justify-between text-xs text-mu"><label className="flex gap-1"><input type="checkbox"/>Remember me</label><button type="button" className="text-red-400" onClick=${()=>alert('Demo: password recovery requires a secure backend.')}>Forgot password?</button></div>
    <button className=${B1+' w-full py-2.5 text-sm'} disabled=${submitting} onClick=${signIn}>${submitting?'Checking...':'Sign in as '+RL[role]}</button>
    <p className="text-center text-xs text-mu">${portal=='public'&&h`<span>Citizen without an account? <button type="button" className="text-red-400" onClick=${()=>go('register')}>Register</button> \u00b7 </span>`}Frontend demo only; local data is not secure authentication. <button type="button" className="text-red-400" onClick=${()=>go('landing')}>Switch portal</button></p>
  </div></div>`;
}
