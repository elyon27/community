"use strict";
(async () => {
  const form=document.getElementById('chamberForm'); if(!form)return;
  const db=window.communityDB;
  const status=document.getElementById('entryStatus');
  const savedStatus=document.getElementById('savedStatus');
  const mine=document.getElementById('savedEntries');
  const shared=document.getElementById('sharedEntries');
  const chamber=location.pathname.split('/').pop().replace('.html','');
  let current=null, visibility='private', revision=0, loading=0, previousUser=null;
  const buttons=[document.getElementById('savePrivate'),document.getElementById('shareEntry')];
  form.addEventListener('input',()=>revision++);
  const text=(tag,value,className)=>{const el=document.createElement(tag);el.textContent=value;if(className)el.className=className;return el;};
  function clearEditor(){current=null;visibility='private';form.reset();document.getElementById('entryDate').value=(()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;})();document.getElementById('previewPanel').hidden=true;form.dispatchEvent(new Event('entry-saved'));revision++;}
  async function identity(){const {data,error}=await db.auth.getUser();if(error||!data.user)throw new Error('Please sign in through My account first.');return data.user;}
  function render(rows,host,owned){
    host.replaceChildren();
    if(!rows.length){host.append(text('p',owned?'No saved entries in this chamber yet.':'No shared posts in this chamber yet.'));return;}
    for(const row of rows){
      const card=document.createElement('article');
      card.append(text('h3',row.title),text('p',`${row.entry_date} · ${row.visibility==='shared'?'Shared with members':'Private'}${owned?'':' · '+(row.community_profiles?.display_name||'Community member')}`));
      card.append(text('p',row.body,'entry-text'),text('p',row.next_step,'entry-text'));
      if(owned){
        const actions=document.createElement('div');actions.className='chamber-actions';
        const edit=text('button','Open / edit','ghost-btn');edit.type='button';edit.onclick=()=>{
          if(form.querySelector('textarea').value && !confirm('Replace the writing in this editor with the saved entry?'))return;
          current=row.id;visibility=row.visibility;document.getElementById('entryDate').value=row.entry_date;
          ['title','body','next_step'].forEach((field,i)=>document.getElementById('entry'+i).value=row[field]);
          document.getElementById('previewPanel').hidden=true;form.dispatchEvent(new Event('entry-saved'));revision++;
          status.textContent='Editing saved entry. Current visibility: '+row.visibility+'.';form.scrollIntoView({block:'start'});
        };
        const del=text('button','Delete','ghost-btn');del.type='button';del.onclick=async()=>{
          if(!confirm('Delete this saved entry? This cannot be undone.'))return;
          del.disabled=true;
          try{const user=await identity();const {data,error}=await db.from('community_chamber_entries').delete().eq('id',row.id).eq('user_id',user.id).select('id');if(error)throw error;if(!data.length)throw new Error('Entry was not deleted. Refresh and try again.');if(current===row.id)clearEditor();status.textContent='Entry deleted.';await load();}catch(e){status.textContent=e.message;}finally{del.disabled=false;}
        };
        actions.append(edit,del);card.append(actions);
      }
      host.append(card);
    }
  }
  async function load(){
    const ticket=++loading; mine.replaceChildren();shared.replaceChildren();
    const user=window.communityUser;
    if(previousUser && previousUser!==user?.id)clearEditor();previousUser=user?.id||null;
    buttons.forEach(b=>b.disabled=!user||!db);
    if(!user||!db){savedStatus.textContent='Sign in to see saved entries and shared posts.';return;}
    savedStatus.textContent='Loading entries…';
    try{
      const [a,b]=await Promise.all([
        db.from('community_chamber_entries').select('*').eq('chamber',chamber).eq('user_id',user.id).order('created_at',{ascending:false}).limit(100),
        db.from('community_chamber_entries').select('*,community_profiles(display_name)').eq('chamber',chamber).eq('visibility','shared').order('created_at',{ascending:false}).limit(100)
      ]);
      if(ticket!==loading)return;
      if(a.error)throw a.error;if(b.error)throw b.error;
      render(a.data,mine,true);render(b.data,shared,false);savedStatus.textContent='Showing up to 100 most recent entries in each list. Use Refresh entries to check for new posts.';
    }catch(e){if(ticket===loading)savedStatus.textContent='Unable to load entries: '+e.message;}
  }
  async function save(target){
    if(!form.reportValidity())return;
    if(target==='shared'&&!confirm('Share this entry with all signed-in community members? Do not include private contact or personal information.'))return;
    buttons.forEach(b=>b.disabled=true);status.textContent='Saving…';const startRevision=revision;
    try{
      if(!db)throw new Error('Account service unavailable. Reload and try again.');
      const user=await identity();
      const profile=await db.from('community_profiles').select('user_id').eq('user_id',user.id).maybeSingle();if(profile.error)throw profile.error;
      if(!profile.data)throw new Error('Set your display name on My account before saving your first entry.');
      const payload={user_id:user.id,chamber,entry_date:document.getElementById('entryDate').value,title:document.getElementById('entry0').value.trim(),body:document.getElementById('entry1').value.trim(),next_step:document.getElementById('entry2').value.trim(),visibility:target};
      if(!payload.title||!payload.body||!payload.next_step)throw new Error('Complete all three writing fields.');
      const query=current?db.from('community_chamber_entries').update(payload).eq('id',current).eq('user_id',user.id):db.from('community_chamber_entries').insert(payload);
      const {data,error}=await query.select('id').single();if(error)throw error;
      current=data.id;visibility=target;if(revision===startRevision)form.dispatchEvent(new Event('entry-saved'));
      status.textContent=(target==='shared'?'Entry shared with members.':'Entry saved privately to your account.')+(revision!==startRevision?' You have newer unsaved edits.':'');
      await load();
    }catch(e){status.textContent='Not saved: '+e.message;}finally{buttons.forEach(b=>b.disabled=!window.communityUser);}
  }
  buttons.forEach(b=>b.disabled=true);
  buttons[0].onclick=()=>save('private');buttons[1].onclick=()=>save('shared');
  document.getElementById('refreshEntries').onclick=load;
  document.getElementById('newEntry').onclick=()=>{if(confirm('Start a new entry? Download or save any current changes first.')){clearEditor();status.textContent='New entry ready.';}};
  window.addEventListener('community-auth-changed',load);
  await window.communityReady;await load();
})();
