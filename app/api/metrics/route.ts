import { database, json, measure, readBody } from '../../../lib/exchange';
export async function GET() {
  try { const result = await database().prepare('SELECT day,event,channel,count FROM metrics ORDER BY day DESC LIMIT 500').all();
    return json({metrics:result.results,note:'Raw request and browser signals; not unique visitors or verified humans/agents. declared-* categories are spoofable user-agent claims, not verified provider traffic. Owner checks are separate where declared. No cookies, individual identifiers, full user-agent strings or full referrers are retained.'});
  } catch {return json({error:'Analytics unavailable'},503);}
}
export async function POST(request: Request) {
  try {const body=await readBody(request); if(body.event!=='browser_page_view'&&body.event!=='tool_click')return json({error:'Unknown event'},400);
    const channel=['x','bluesky','github','reddit','linkedin','search','direct'].includes(String(body.channel))?String(body.channel):'unknown';
    await measure(String(body.event),channel);return json({recorded:true});
  } catch {return json({recorded:false},503);}
}
