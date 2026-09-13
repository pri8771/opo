import { database, json } from '../../../lib/exchange';
export async function GET() {
  try {
    const db=database(); const [experiments,runs,counts]=await db.batch([
      db.prepare('SELECT * FROM experiments ORDER BY started_at DESC LIMIT 20'),
      db.prepare('SELECT * FROM runs ORDER BY created_at DESC LIMIT 20'),
      db.prepare("SELECT role,actor_type,kind,COUNT(*) AS count FROM messages GROUP BY role,actor_type,kind"),
    ]);
    return json({experiments:experiments.results,runs:runs.results,message_counts:counts.results,revenue:null,verified_external_agents:null,measurement_note:'Counts are submissions, not unique people, verified agents, qualified leads or revenue.'});
  } catch {return json({error:'Experiment storage temporarily unavailable'},503);}
}
