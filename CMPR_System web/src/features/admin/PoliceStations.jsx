import { useMemo, useState } from 'react';
import { h } from '../../lib/h';
import { Bd } from '../../components/ui/Badge';
import { Bar, Card, Modal, Pg, Sel } from '../../components/ui/Primitives';
import { Tbl } from '../../components/ui/Table';
import { B2 } from '../../lib/constants';

const PAGE_SIZE = 20;

export function Stations({ S }) {
  const [query, setQuery] = useState('');
  const [district, setDistrict] = useState('');
  const [page, setPage] = useState(0);
  const [viewing, setViewing] = useState(null);

  // Each district appears only once, in A-Z order.
  const districts = useMemo(
    () => [...new Set(S.STN.map(station => station.district))].sort((a, b) => a.localeCompare(b)),
    [S.STN],
  );

  const text = query.trim().toLowerCase();
  const matched = S.STN
    .filter(station => (
      (!district || station.district === district)
      && `${station.name} ${station.code} ${station.district}`.toLowerCase().includes(text)
    ))
    .sort((a, b) => a.district.localeCompare(b.district) || a.name.localeCompare(b.name));

  const pageCount = Math.max(1, Math.ceil(matched.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const rows = matched.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const toggle = station => S.ask(
    `${station.active ? 'Deactivate' : 'Activate'} ${station.name} station?`,
    () => {
      S.setSTN(S.STN.map(item => (item.code === station.code ? { ...item, active: !item.active } : item)));
      S.toast(`${station.name} ${station.active ? 'deactivated' : 'activated'}`);
    },
  );

  return h`
    <${Pg} t="Police Stations" sub="Predefined master data. Stations cannot be added here."/>
    <${Card}>
      <${Bar} q=${query} sq=${value => { setQuery(value); setPage(0); }}>
        <${Sel} v=${district} set=${value => { setDistrict(value); setPage(0); }} opts=${districts} ph="All districts"/>
      <//>
      <p className="text-xs text-mu mb-2">${matched.length} station(s)${district ? ' in ' + district : ' in ' + districts.length + ' districts'}</p>
      <${Tbl} cols=${[
        ['Code', station => station.code],
        ['Station', station => station.name],
        ['District', station => station.district],
        ['Contact', station => station.tel],
        ['Email', station => station.email],
        ['Status', station => h`<${Bd} c=${station.active ? 'g' : 'x'} t=${station.active ? 'Active' : 'Inactive'}/>`],
        ['Actions', station => h`<div className="flex gap-1">
          <button className=${B2} onClick=${() => setViewing(station)}>View</button>
          <button className=${B2} onClick=${() => toggle(station)}>${station.active ? 'Deactivate' : 'Activate'}</button>
        </div>`],
      ]} rows=${rows}/>
      ${matched.length > PAGE_SIZE && h`<div className="flex items-center justify-between mt-3 text-xs">
        <span className="text-mu">Page ${safePage + 1} of ${pageCount}</span>
        <div className="flex gap-2">
          <button className=${B2} disabled=${safePage === 0} onClick=${() => setPage(safePage - 1)}>Previous</button>
          <button className=${B2} disabled=${safePage + 1 >= pageCount} onClick=${() => setPage(safePage + 1)}>Next</button>
        </div>
      </div>`}
    <//>
    ${viewing && h`<${Modal} t=${viewing.name + ' Police Station'} close=${() => setViewing(null)} w="max-w-md">
      <div className="space-y-2 text-sm">${[
        ['Code', viewing.code], ['District', viewing.district], ['Address', viewing.addr],
        ['Contact', viewing.tel], ['Email', viewing.email],
        ['Accounts', S.ACC.filter(a => a.stationCode === viewing.code).length],
        ['Officers', S.OFF.filter(o => o.stationCode === viewing.code).length],
      ].map(([label, value]) => h`<div key=${label} className="flex justify-between border-b border-bd py-1">
        <span className="text-mu">${label}</span>${value}
      </div>`)}</div>
    <//>`}
  `;
}
