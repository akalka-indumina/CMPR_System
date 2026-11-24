import { useMemo, useState } from 'react';
import { h } from '../../lib/h';
import { Bd } from '../../components/ui/Badge';
import { PasswordStrength } from '../../components/ui/PasswordStrength';
import { Bar, Card, Fld, Modal, Pg, Sel } from '../../components/ui/Primitives';
import { Tbl } from '../../components/ui/Table';
import { B1, B2, INP } from '../../lib/constants';
import { createUniqueId } from '../../lib/helpers';
import { hashPassword } from '../../lib/credentials';
import { POLICE_RANKS, checkPassword } from '../../lib/stationAccounts';

const OFFICER_ID_PATTERN = /^SLP-\d{6}$/;
const PHONE_PATTERN = /^(?:\+94|0)\d{9}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const READ_ONLY = INP + ' opacity-80 cursor-not-allowed';

export function PoliceOfficers({ S }) {
  const [query, setQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [form, setForm] = useState(null);
  const [view, setView] = useState(null);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const stations = useMemo(() => S.STN.filter(station => station.active !== false), [S.STN]);
  const districts = useMemo(
    () => [...new Set(stations.map(station => station.district))].sort((a, b) => a.localeCompare(b)),
    [stations],
  );
  const officerDistricts = useMemo(
    () => [...new Set(S.OFF.map(officer => officer.district).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [S.OFF],
  );

  const rows = S.OFF.filter(officer => (
    `${officer.id} ${officer.name} ${officer.email || ''} ${officer.station}`.toLowerCase().includes(query.trim().toLowerCase())
    && (!districtFilter || officer.district === districtFilter)
    && (!activeFilter || (officer.active ? 'Active' : 'Inactive') === activeFilter)
  ));

  const data = form?.data || {};
  const stationOptions = useMemo(
    () => stations.filter(station => station.district === data.district)
      .sort((a, b) => a.name.localeCompare(b.name)),
    [stations, data.district],
  );

  // An Officer ID may be used by one officer only (not case sensitive).
  const idTaken = id => S.OFF.some(officer => officer.id.toLowerCase() === id.trim().toLowerCase());
  const typedId = (data.id || '').trim();
  const idMessage = form && !form.edit && typedId
    ? (!OFFICER_ID_PATTERN.test(typedId)
      ? { ok: false, text: 'Use the format SLP-000000 (SLP, a hyphen, then 6 digits)' }
      : idTaken(typedId)
        ? { ok: false, text: 'This Officer ID is already in use' }
        : { ok: true, text: 'Officer ID is available' })
    : null;

  const update = changes => setForm(current => ({ ...current, data: { ...current.data, ...changes } }));
  const openNew = () => {
    setErrors({});
    setShowPassword(false);
    setForm({
      edit: false,
      data: { id: '', name: '', email: '', tel: '', rank: '', district: '', stationCode: '', pw: '', pw2: '', active: true },
    });
  };
  const openEdit = officer => {
    const station = S.STN.find(item => item.code === officer.stationCode);
    setErrors({});
    setShowPassword(false);
    setForm({
      edit: true,
      data: { ...officer, district: station?.district || officer.district || '', pw: '', pw2: '' },
    });
  };

  const save = async () => {
    const values = form.data;
    const id = (values.id || '').trim();
    const email = (values.email || '').trim().toLowerCase();
    const tel = (values.tel || '').replace(/[\s-]/g, '');
    const station = S.STN.find(item => item.code === values.stationCode);
    const existingUser = S.USERS.find(user => user.role === 'officer' && user.profileId === values.id);
    const nextErrors = {};

    if (!form.edit) {
      if (!id) nextErrors.id = 'Required';
      else if (!OFFICER_ID_PATTERN.test(id)) nextErrors.id = 'Use the format SLP-000000 (SLP, a hyphen, then 6 digits)';
      else if (idTaken(id)) nextErrors.id = 'This Officer ID is already in use';
    }
    if (!String(values.name || '').trim()) nextErrors.name = 'Required';
    if (!email) nextErrors.email = 'Required';
    else if (!EMAIL_PATTERN.test(email)) nextErrors.email = 'Enter a valid email address';
    else if (S.USERS.some(user => user.role !== 'station' && user.id !== existingUser?.id
      && user.email.toLowerCase() === email)) nextErrors.email = 'Email is already in use';
    if (!tel) nextErrors.tel = 'Required';
    else if (!PHONE_PATTERN.test(tel)) nextErrors.tel = 'Enter a valid number, e.g. 0771234567';
    if (!values.rank) nextErrors.rank = 'Select a rank';
    if (!values.district) nextErrors.district = 'Select a district';
    if (!station) nextErrors.stationCode = 'Select a police station';
    if (!form.edit || values.pw || !existingUser?.passwordHash) {
      if (!values.pw) nextErrors.pw = 'A password is required';
      else if (!checkPassword(values.pw).strong) nextErrors.pw = 'Password is not strong enough';
    }
    if (values.pw !== values.pw2) nextErrors.pw2 = 'Passwords do not match';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      S.toast('Please fix the highlighted fields.', 'err');
      return;
    }

    try {
      const officerId = form.edit ? values.id : id;
      const credentials = values.pw ? await hashPassword(values.pw) : {
        passwordSalt: existingUser.passwordSalt,
        passwordHash: existingUser.passwordHash,
      };
      const profile = {
        id: officerId,
        name: values.name.trim(),
        rank: values.rank,
        tel,
        district: station.district,
        station: station.name,
        stationCode: station.code,
        active: Boolean(values.active),
      };
      const authUser = {
        id: existingUser?.id || createUniqueId('USR'),
        email,
        ...credentials,
        role: 'officer',
        profileId: officerId,
        active: profile.active,
      };
      S.setOFF(current => form.edit
        ? current.map(item => item.id === officerId ? { ...item, ...profile } : item)
        : [profile, ...current]);
      S.setU(current => existingUser
        ? current.map(user => user.id === existingUser.id ? authUser : user)
        : [...current, authUser]);
      setForm(null);
      S.toast(form.edit ? `Officer ${officerId} updated` : `Officer ${officerId} created`);
    } catch (error) {
      console.error('Officer could not be saved.', error);
      S.toast(error instanceof Error ? error.message : 'Officer could not be saved.', 'err');
    }
  };

  const toggle = officer => {
    const authUser = S.USERS.find(user => user.role === 'officer' && user.profileId === officer.id);
    if (!officer.active && !authUser?.passwordHash) {
      S.toast('Set a password before activating this officer.', 'err');
      return;
    }
    const active = !officer.active;
    S.ask(`${active ? 'Activate' : 'Deactivate'} ${officer.name}?`, () => {
      S.setOFF(current => current.map(item => item.id === officer.id ? { ...item, active } : item));
      S.setU(current => current.map(user => (
        user.role === 'officer' && user.profileId === officer.id ? { ...user, active } : user
      )));
      S.toast(`${officer.name} ${active ? 'activated' : 'deactivated'}`);
    });
  };

  // Keep a rank that is not in the official list selectable while editing an older record.
  const rankOptions = data.rank && !POLICE_RANKS.includes(data.rank) ? [data.rank, ...POLICE_RANKS] : POLICE_RANKS;

  return h`
    <${Pg} t="Police Officers" sub="Manage police officer records">
      <button className=${B1} onClick=${openNew}>+ Add Police Officer</button>
    <//>
    <${Card}>
      <${Bar} q=${query} sq=${setQuery}>
        <${Sel} v=${districtFilter} set=${setDistrictFilter} opts=${officerDistricts} ph="All districts"/>
        <${Sel} v=${activeFilter} set=${setActiveFilter} opts=${['Active', 'Inactive']} ph="All statuses"/>
      <//>
      <${Tbl}
        cols=${[
          ['Officer ID', officer => h`<span className="font-mono text-xs">${officer.id}</span>`, 'id'],
          ['Name', officer => officer.name, 'name'],
          ['Rank', officer => officer.rank || '—', 'rank'],
          ['District', officer => officer.district || '—', 'district'],
          ['Station', officer => officer.station, 'station'],
          ['Contact', officer => officer.tel || '—'],
          ['Status', officer => h`<${Bd} c=${officer.active ? 'g' : 'x'} t=${officer.active ? 'Active' : 'Inactive'}/>`],
          ['Actions', officer => h`<div className="flex gap-1">
            <button className=${B2} onClick=${() => setView(officer)}>View</button>
            <button className=${B2} onClick=${() => openEdit(officer)}>Edit</button>
            <button className=${B2} onClick=${() => toggle(officer)}>${officer.active ? 'Deactivate' : 'Activate'}</button>
          </div>`],
        ]}
        rows=${rows}
      />
    <//>
    ${view && h`<${Modal} t=${view.name} close=${() => setView(null)} w="max-w-md">
      <div className="space-y-2 text-sm">${[
        ['Officer ID', view.id], ['Full Name', view.name], ['Rank', view.rank || '—'],
        ['District', view.district || '—'], ['Police Station', view.station],
        ['Email', view.email || '—'], ['Contact Number', view.tel || '—'],
        ['Status', view.active ? 'Active' : 'Inactive'],
      ].map(([label, value]) => h`<div key=${label} className="flex justify-between gap-4 border-b border-bd py-1">
        <span className="text-mu">${label}</span><span className="text-right">${value}</span>
      </div>`)}</div>
    <//>`}
    ${form && h`<${Modal} t=${form.edit ? 'Edit Police Officer' : 'Add Police Officer'} close=${() => setForm(null)}>
      <div className="grid sm:grid-cols-2 gap-3">
        <${Fld} l="Officer ID" err=${errors.id}>
          <input className=${form.edit ? READ_ONLY : INP} readOnly=${form.edit} value=${data.id || ''} autoComplete="off"
            onChange=${event => { update({ id: event.target.value }); setErrors(current => ({ ...current, id: undefined })); }}/>
          ${idMessage && h`<span className=${'text-xs ' + (idMessage.ok ? 'text-green-400' : 'text-red-400')}>${idMessage.text}</span>`}
        <//>
        <${Fld} l="Full Name" err=${errors.name}>
          <input className=${INP} value=${data.name || ''} onChange=${event => update({ name: event.target.value })}/>
        <//>
        <${Fld} l="Email Address" err=${errors.email}>
          <input className=${INP} type="email" autoComplete="off" value=${data.email || ''} onChange=${event => update({ email: event.target.value })}/>
        <//>
        <${Fld} l="Contact Number" err=${errors.tel}>
          <input className=${INP} value=${data.tel || ''} placeholder="0771234567" onChange=${event => update({ tel: event.target.value })}/>
        <//>
        <div className="sm:col-span-2">
          <${Fld} l="Rank" err=${errors.rank}>
            <select className=${INP} value=${data.rank || ''} onChange=${event => update({ rank: event.target.value })}>
              <option value="">Select rank</option>
              ${rankOptions.map(rank => h`<option key=${rank} value=${rank}>${rank}</option>`)}
            </select>
          <//>
        </div>
        <${Fld} l="District" err=${errors.district}>
          <select className=${INP} value=${data.district || ''}
            onChange=${event => update({ district: event.target.value, stationCode: '' })}>
            <option value="">Select district</option>
            ${districts.map(name => h`<option key=${name} value=${name}>${name}</option>`)}
          </select>
        <//>
        <${Fld} l="Police Station" err=${errors.stationCode}>
          <select className=${INP} disabled=${!data.district} value=${data.stationCode || ''}
            onChange=${event => update({ stationCode: event.target.value })}>
            <option value="">${data.district ? 'Select police station' : 'Select a district first'}</option>
            ${stationOptions.map(item => h`<option key=${item.code} value=${item.code}>${item.name}</option>`)}
          </select>
        <//>
        <${Fld} l=${form.edit ? 'New Password (leave blank to keep the current one)' : 'Password'} err=${errors.pw}>
          <input className=${INP} type=${showPassword ? 'text' : 'password'} autoComplete="new-password" value=${data.pw || ''}
            onChange=${event => update({ pw: event.target.value })}/>
        <//>
        <${Fld} l="Confirm Password" err=${errors.pw2}>
          <input className=${INP} type=${showPassword ? 'text' : 'password'} autoComplete="new-password" value=${data.pw2 || ''}
            onChange=${event => update({ pw2: event.target.value })}/>
        <//>
        <${Fld} l="Account Status">
          <${Sel} v=${data.active ? 'Active' : 'Inactive'} set=${value => update({ active: value === 'Active' })} opts=${['Active', 'Inactive']}/>
        <//>
        <label className="flex items-center gap-2 text-xs text-mu sm:self-end sm:pb-2">
          <input type="checkbox" checked=${showPassword} onChange=${() => setShowPassword(value => !value)}/>
          Show passwords
        </label>
        ${(!form.edit || data.pw) && h`<${PasswordStrength} value=${data.pw || ''}/>`}
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className=${B2} onClick=${() => setForm(null)}>Cancel</button>
        <button className=${B1} onClick=${save}>Save police officer</button>
      </div>
    <//>`}
  `;
}
