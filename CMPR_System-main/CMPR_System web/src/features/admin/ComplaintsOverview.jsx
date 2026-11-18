import { h } from '../../lib/h';
import { CT } from '../../components/complaints/ComplaintTable';
import { Grid, Pg, Stat } from '../../components/ui/Primitives';
import { grp } from '../../lib/helpers';

export function CompOv({S}){const g=i=>S.C.filter(c=>grp(c.status)==i).length;return h`<${Pg} t="Complaints Overview" sub="Monitoring and reporting only. Complaint handling stays with station accounts."/><${Grid} n=${6}><${Stat} l="Total" v=${S.C.length}/><${Stat} l="Pending" v=${g(0)} c="text-yellow-400"/><${Stat} l="Under review" v=${g(1)} c="text-orange-400"/><${Stat} l="Under investigation" v=${g(2)} c="text-red-400"/><${Stat} l="Resolved" v=${g(3)} c="text-green-400"/><${Stat} l="Rejected" v=${g(4)} c="text-mu"/><//><div className="mt-4"><${CT} S=${S} rows=${S.C} keys=${['id','title','cat','stn','date','status']} btn="View"/></div>`}
