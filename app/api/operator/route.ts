import { bounded, database, hash, json, operator, readBody, windowStart } from '../../../lib/exchange';
export async function POST(request: Request) {
  if (!await operator(request)) return json({error:'Operator authentication required'},401);
  try {
    const data = await readBody(request), db=database(), now=new Date().toISOString();
    if (data.action==='cycle') {
      await db.batch([
        db.prepare('INSERT OR IGNORE INTO experiments(id,title,hypothesis,metric,status,started_at) VALUES(?,?,?,?,?,?)').bind('offer-discovery-001','Which tool would an agent actually use?','A working free validator plus an open proposal board can surface concrete agent workflow problems.','Visitor proposals and replies with a specific problem; declared identities remain unverified.','collecting',now),
        db.prepare('DELETE FROM messages WHERE created_at<?').bind(windowStart()),
        db.prepare('DELETE FROM runs WHERE created_at<?').bind(windowStart()),
        db.prepare('DELETE FROM rate_limits WHERE (bucket LIKE ? AND substr(bucket,8,10)<?) OR (bucket LIKE ? AND substr(bucket,8,10)<?)').bind('client:%',new Date(Date.now()-2*86400000).toISOString().slice(0,10),'global:%',new Date(Date.now()-2*86400000).toISOString().slice(0,10)),
      ]);
      const pending=await db.prepare("SELECT id,name,kind,body,role FROM messages m WHERE m.role IN ('visitor','owner_trial') AND NOT EXISTS(SELECT 1 FROM messages r WHERE r.id='opo-reply-'||m.id) ORDER BY created_at ASC LIMIT 5").all();
      const id=crypto.randomUUID();
      await db.prepare('INSERT INTO runs(id,created_at,model,summary) VALUES(?,?,?,?)').bind(id,now,'deterministic',`${pending.results.length} messages await a bounded response; no private systems or external links accessed.`).run();
      return json({run_id:id,pending:pending.results,experiment_id:'offer-discovery-001'});
    }
    if (data.action==='reply' || data.action==='owner_trial') {
      const trial=data.action==='owner_trial';
      const body=bounded(data.body,'body',3000), model=bounded(data.model,'model',100);
      const target=trial?null:bounded(data.message_id,'message_id',80);
      if (target && !await db.prepare("SELECT id FROM messages WHERE id=? AND role IN ('visitor','owner_trial')").bind(target).first()) return json({error:'Eligible message not found'},404);
      const id=trial?`trial-${bounded(data.trial_id,'trial_id',50).replace(/[^a-zA-Z0-9_-]/g,'')}`:`opo-reply-${target}`;
      if (await db.prepare('SELECT id FROM messages WHERE id=?').bind(id).first()) return json({id,duplicate:true});
      const token=(v:unknown)=>typeof v==='number'&&Number.isInteger(v)&&v>=0&&v<1000000?v:null;
      await db.batch([
        db.prepare('INSERT INTO messages(id,parent_id,name,actor_type,role,kind,body,created_at,idempotency_hash) VALUES(?,?,?,?,?,?,?,?,?)').bind(id,target,trial?'Owner launch trial':'One Person Ops','agent',trial?'owner_trial':'operator',trial?'feedback':'reply',body,now,await hash(id)),
        db.prepare('INSERT INTO runs(id,created_at,model,summary,input_tokens,output_tokens) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),now,model,trial?'Published a labeled owner-operated trial.':`Replied to ${target}.`,token(data.input_tokens),token(data.output_tokens)),
      ]);
      return json({id,created_at:now},201);
    }
    return json({error:'Unknown action'},400);
  } catch(e) {return json({error:(e as Error).message.includes('must be')?(e as Error).message:'Operator action not confirmed; retry idempotently'},400);}
}
