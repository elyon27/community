"use strict";
window.communityReady = (async () => {
  const db = window.communityDB;
  const status = document.getElementById('accountStatus');
  const message = document.getElementById('authMessage') || status;
  const form = document.getElementById('accountForm');
  const profileForm = document.getElementById('profileForm');
  const passwordForm = document.getElementById('passwordForm');
  const out = document.getElementById('signOut');
  let user = null;
  const say = text => { if(message) message.textContent = text; };
  if (!db) { say('The account service did not load. Check your connection and reload.'); return null; }
  async function sync() {
    const {data, error} = await db.auth.getUser();
    user = error ? null : data.user;
    window.communityUser = user;
    if(status) status.textContent = user ? `Signed in as ${user.email}` : 'Sign in to save entries and read member posts.';
    if(out) out.hidden = !user;
    if(form) form.hidden = !!user;
    if(profileForm) profileForm.hidden = !user;
    if(profileForm && user) {
      const result = await db.from('community_profiles').select('display_name').eq('user_id',user.id).maybeSingle();
      if(result.error) say('Profile storage is not ready: ' + result.error.message);
      document.getElementById('displayName').value = result.data?.display_name || '';
    }
    window.dispatchEvent(new Event('community-auth-changed'));
    return user;
  }
  async function action(fn) {
    const buttons = document.querySelectorAll('#accountForm button, #profileForm button, #passwordForm button, #signOut');
    buttons.forEach(b => b.disabled=true); say('Working…');
    try { await fn(); } catch(e) { say(e.message || 'Unable to complete this request.'); }
    finally { buttons.forEach(b => b.disabled=false); }
  }
  const credentials = () => ({email:document.getElementById('accountEmail').value.trim(),password:document.getElementById('accountPassword').value});
  if(form) {
    form.addEventListener('submit', e => { e.preventDefault(); action(async () => {
      const {error} = await db.auth.signInWithPassword(credentials()); if(error) throw error;
      form.reset(); await sync(); say('Signed in. Open a chamber to continue.');
    }); });
    document.getElementById('createAccount').addEventListener('click', () => {
      if(!form.reportValidity()) return;
      action(async () => {
        const info=credentials(); if(info.password.length<12) throw new Error('Use at least 12 characters for your new password.');
        const {data,error}=await db.auth.signUp({...info,options:{emailRedirectTo:location.origin+'/chambers/account.html'}});
        if(error) throw error; form.reset(); await sync();
        say(data.session ? 'Account ready. Set your display name below.' : 'Check your inbox for a confirmation link, then sign in. If you already have an account, use Sign in or Forgot password.');
      });
    });
    document.getElementById('resetPassword').addEventListener('click', () => {
      const email=document.getElementById('accountEmail'); if(!email.reportValidity()) return;
      action(async () => { const {error}=await db.auth.resetPasswordForEmail(email.value.trim(),{redirectTo:location.origin+'/chambers/account.html'}); if(error)throw error; say('If an account exists, a password reset email will be sent.'); });
    });
    profileForm.addEventListener('submit', e => {e.preventDefault();action(async () => {
      if(!user) throw new Error('Please sign in again.');
      const name=document.getElementById('displayName').value.trim(); if(!name)throw new Error('Enter a display name.');
      const {error}=await db.from('community_profiles').upsert({user_id:user.id,display_name:name});if(error)throw error;say('Display name saved.');
    });});
    passwordForm.addEventListener('submit',e=>{e.preventDefault();action(async()=>{
      const {error}=await db.auth.updateUser({password:document.getElementById('newPassword').value});if(error)throw error;passwordForm.reset();passwordForm.hidden=true;say('Password updated.');
    });});
  }
  if(out)out.addEventListener('click',()=>action(async()=>{const {error}=await db.auth.signOut();if(error)throw error;await sync();say('Signed out.');}));
  db.auth.onAuthStateChange((event) => {
    if(event==='PASSWORD_RECOVERY' && passwordForm)passwordForm.hidden=false;
    // Run outside the auth callback to avoid locking the auth client.
    if(['SIGNED_IN','SIGNED_OUT','USER_UPDATED'].includes(event))setTimeout(()=>sync().catch(e=>say(e.message)),0);
  });
  return await sync();
})();
