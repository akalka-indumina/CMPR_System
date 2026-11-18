import { h } from '../../lib/h';
import { Ic } from '../../components/ui/Icon';
import { B1, PORTALS } from '../../lib/constants';

export function Landing({ go }) {
  return h`<div className="min-h-screen flex items-center justify-center p-4"><div className="w-full max-w-2xl space-y-6"><div className="text-center"><div className="w-12 h-12 mx-auto rounded-xl bg-pr flex items-center justify-center mb-2"><${Ic} n="shield" s=${26}/></div><h1 className="font-bold text-xl">Community Safety and Police Complaint Management</h1><p className="text-mu text-sm">Choose your portal to continue.</p></div><div className="grid sm:grid-cols-2 gap-4">${Object.entries(PORTALS).map(([k, p]) => h`<div key=${k} className="bg-cd border border-bd rounded-xl p-6 space-y-3"><h2 className="font-semibold">${p.title}</h2><p className="text-mu text-sm">${p.sub}</p><button className=${B1 + ' w-full py-2.5'} onClick=${() => go('login-' + k)}>Open portal</button></div>`)}</div></div></div>`;
}
