import { h } from '../../lib/h';
import { Bd } from '../../components/ui/Badge';
import { Card, Pg } from '../../components/ui/Primitives';
import { Tbl } from '../../components/ui/Table';

export function Officers({S}){const rows=S.OFF.filter(o=>o.station==S.user.station);return h`<${Pg} t="Police Officers" sub=${S.user.station+' station only'}/><${Card}><${Tbl} cols=${[['Officer ID',o=>o.id],['Name',o=>o.name,'name'],['Rank',o=>o.rank],['Contact',o=>o.tel],['Status',o=>h`<${Bd} c=${o.active?'g':'x'} t=${o.active?'Active':'Inactive'}/>`],['Assigned complaints',o=>S.C.filter(c=>c.off==o.id&&['Assigned','Under Investigation'].includes(c.status)).length]]} rows=${rows}/><//>`}
