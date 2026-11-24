import { useMemo, useState } from 'react';
import { h } from '../../lib/h';
import { Bd } from '../../components/ui/Badge';
import { Bar, Card, Fld, Modal, Pg, Sel } from '../../components/ui/Primitives';
import { Tbl } from '../../components/ui/Table';
import { B1, B2, INP } from '../../lib/constants';
import { createUniqueId } from '../../lib/helpers';
import { hashPassword } from '../../lib/credentials';
import { PasswordStrength } from '../../components/ui/PasswordStrength';
import { buildAccountId, checkPassword } from '../../lib/stationAccounts';

const READ_ONLY = INP + ' opacity-80 cursor-not-allowed';

export function StationAccounts({ S }) {
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
  const allDistricts = useMemo(
    () => [...new Set(S.ACC.map(account => account.district).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [S.ACC],
  );

  const rows = S.ACC.filter(account => (
    `${account.id} ${account.station} ${account.district || ''}`.toLowerCase().includes(query.trim().toLowerCase())
    && (!districtFilter || account.district === districtFilter)
    && (!activeFilter || (account.active ? 'Active' : 'Inactive') === activeFilter)
  ));

  const data = form?.data || {};
  const stationOptions = useMemo(
    () => stations.filter(station => station.district === data.district)
      .sort((a, b) => a.name.localeCompare(b.name)),
    [stations, data.district],
  );
  const station = S.STN.find(item => item.code === data.stationCode);
  const accountId = form?.edit ? data.id : (station ? buildAccountId(S.ACC, station.district, station.name) : '');

  const update = changes => setForm(current => ({ ...current, data: { ...current.data, ...changes } }));

  const openNew = () => {
    setErrors({});
    setShowPassword(false);
    setForm({ edit: false, data: { district: '', stationCode: '', pw: '', pw2: '', active: true } });
  };
  const openEdit = account => {
    setErrors({});
    setShowPassword(false);
    setForm({ edit: true, data: { ...account, pw: '', pw2: '' } });
  };

  const save = async () => {
    const values = form.data;
    const existingUser = S.USERS.find(user => user.role === 'station' && user.profileId === values.id);
    const nextErrors = {};
    if (!form.edit) {
      if (!values.district) nextErrors.district = 'Select a district';
      if (!station) nextErrors.stationCode = 'Select a police station';
    }
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
      const id = form.edit ? values.id : buildAccountId(S.ACC, station.district, station.name);
      const credentials = values.pw ? await hashPassword(values.pw) : {
        passwordSalt: existingUser.passwordSalt,
        passwordHash: existingUser.passwordHash,
      };
      const profile = form.edit
        ? { id, name: id, district: values.district, station: values.station, stationCode: values.stationCode, tel: values.tel, active: Boolean(values.active) }
        : { id, name: id, district: station.district, station: station.name, stationCode: station.code, tel: station.tel || '', active: Boolean(values.active) };
      const authUser = {
        id: existingUser?.id || createUniqueId('USR'),
        email: (station?.email || existingUser?.email || '').trim().toLowerCase(),
        ...credentials,
        role: 'station',
        profileId: id,
        active: profile.active,
      };
      S.setACC(current => form.edit
        ? current.map(item => item.id === id ? { ...item, ...profile } : item)
        : [profile, ...current]);
      S.setU(current => existingUser
        ? current.map(user => user.id === existingUser.id ? authUser : user)
        : [...current, authUser]);
      setForm(null);
      S.toast(form.edit ? `Station account ${id} updated` : `Station account ${id} created`);
    } catch (error) {
      console.error('Station account could not be saved.', error);
      S.toast(error instanceof Error ? error.message : 'Station account could not be saved.', 'err');
    }
  };

  const toggle = account => {
    const authUser = S.USERS.find(user => user.role === 'station' && user.profileId === account.id);
    if (!account.active && !authUser?.passwordHash) {
      S.toast('Set a password before activating this account.', 'err');
      return;
    }
    const active = !account.active;
    S.ask(`${active ? 'Activate' : 'Deactivate'} ${account.id}?`, () => {
      S.setACC(current => current.map(item => item.id === account.id ? { ...item, active } : item));
      S.setU(current => current.map(user => (
        user.role === 'station' && user.profileId === account.id ? { ...user, active } : user
      )));
      S.toast(`${account.id} ${active ? 'activated' : 'deactivated'}`);
    });
  };

  const select = INP;

  return h`
    <${Pg} t="Station Accounts" sub="Create and manage sign-in accounts for police stations">
      <button className=${B1} onClick=${openNew}>+ Add Station Account</button>
    <//>
    <${Card}>
      <${Bar} q=${query} sq=${setQuery}>
        <${Sel} v=${districtFilter} set=${setDistrictFilter} opts=${allDistricts} ph="All districts"/>
        <${Sel} v=${activeFilter} set=${setActiveFilter} opts=${['Active', 'Inactive']} ph="All statuses"/>
      <//>
      <${Tbl}
        cols=${[
          ['Account ID', account => h`<span className="font-mono text-xs">${account.id}</span>`, 'id'],
          ['District', account => account.district || '—', 'district'],
          ['Police Station', account => account.station, 'station'],
          ['Contact', account => account.tel || '—'],
          ['Status', account => h`<${Bd} c=${account.active ? 'g' : 'x'} t=${account.active ? 'Active' : 'Inactive'}/>`],
          ['Actions', account => h`<div className="flex gap-1">
            <button className=${B2} onClick=${() => setView(account)}>View</button>
            <button className=${B2} onClick=${() => openEdit(account)}>Edit</button>
            <button className=${B2} onClick=${() => toggle(account)}>${account.active ? 'Deactivate' : 'Activate'}</button>
          </div>`],
        ]}
        rows=${rows}
      />
    <//>
    ${view && h`<${Modal} t=${view.id} close=${() => setView(null)} w="max-w-md">
      <div className="space-y-2 text-sm">${[
        ['Account ID', view.id], ['District', view.district || '—'], ['Police Station', view.station],
        ['Contact Number', view.tel || '—'], ['Email', view.email || '—'],
        ['Status', view.active ? 'Active' : 'Inactive'],
      ].map(([label, value]) => h`<div key=${label} className="flex justify-between border-b border-bd py-1">
        <span className="text-mu">${label}</span><span>${value}</span>
      </div>`)}</div>
    <//>`}
    ${form && h`<${Modal} t=${form.edit ? 'Edit Station Account' : 'Add Station Account'} close=${() => setForm(null)}>
      <div className="grid sm:grid-cols-2 gap-3">
        <${Fld} l="District" err=${errors.district}>
          <select className=${select} disabled=${form.edit} value=${data.district || ''}
            onChange=${event => update({ district: event.target.value, stationCode: '', station: '' })}>
            <option value="">Select district</option>
            ${(form.edit ? [data.district] : districts).map(name => h`<option key=${name} value=${name}>${name}</option>`)}
          </select>
        <//>
        <${Fld} l="Police Station" err=${errors.stationCode}>
          <select className=${select} disabled=${form.edit || !data.district} value=${data.stationCode || ''}
            onChange=${event => update({ stationCode: event.target.value })}>
            <option value="">${data.district ? 'Select police station' : 'Select a district first'}</option>
            ${(form.edit ? [{ code: data.stationCode, name: data.station }] : stationOptions)
              .map(item => h`<option key=${item.code} value=${item.code}>${item.name}</option>`)}
          </select>
        <//>
        <${Fld} l="Account ID (used to sign in)">
          <input className=${READ_ONLY} readOnly value=${accountId} placeholder="Generated after selecting a station"/>
        <//>
        <${Fld} l="Account Status">
          <${Sel} v=${data.active ? 'Active' : 'Inactive'} set=${value => update({ active: value === 'Active' })} opts=${['Active', 'Inactive']}/>
        <//>
        <${Fld} l="Contact Number (station)">
          <input className=${READ_ONLY} readOnly value=${(form.edit ? S.ACC.find(item => item.id === data.id)?.tel : station?.tel) || ''} placeholder="Taken from the police station"/>
        <//>
        <${Fld} l="Email (station)">
          <input className=${READ_ONLY} readOnly value=${(form.edit ? S.ACC.find(item => item.id === data.id)?.email : station?.email) || ''} placeholder="Taken from the police station"/>
        <//>
        <${Fld} l=${form.edit ? 'New Password (leave blank to keep the current one)' : 'Password'} err=${errors.pw}>
          <input className=${INP} type=${showPassword ? 'text' : 'password'} autoComplete="new-password" value=${data.pw || ''}
            onChange=${event => update({ pw: event.target.value })}/>
        <//>
        <${Fld} l="Confirm Password" err=${errors.pw2}>
          <input className=${INP} type=${showPassword ? 'text' : 'password'} autoComplete="new-password" value=${data.pw2 || ''}
            onChange=${event => update({ pw2: event.target.value })}/>
        <//>
        <label className="sm:col-span-2 flex items-center gap-2 text-xs text-mu">
          <input type="checkbox" checked=${showPassword} onChange=${() => setShowPassword(value => !value)}/>
          Show passwords
        </label>
        ${(!form.edit || data.pw) && h`<${PasswordStrength} value=${data.pw || ''}/>`}
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className=${B2} onClick=${() => setForm(null)}>Cancel</button>
        <button className=${B1} onClick=${save}>Save station account</button>
      </div>
    <//>`}
  `;
}
