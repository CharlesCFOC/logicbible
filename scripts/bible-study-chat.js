const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function studyChatStorageKey({accountScope='guest',versionId,bookId,chapter,tabName,cardId}) {
  return `thinkbible.localStudyChat.${JSON.stringify([accountScope,versionId,bookId,chapter,tabName,cardId])}`;
}

export function readStudyChats(storage,key) {
  try {
    const saved=JSON.parse(storage.getItem(key) || 'null');
    if(!Array.isArray(saved?.threads))return [];
    return saved.threads.filter(thread=>thread && typeof thread.id==='string' && Array.isArray(thread.messages)).map(thread=>({
      ...thread,
      messages:thread.messages.filter(message=>message && ['user','assistant'].includes(message.role) && typeof message.text==='string'),
      status:thread.status==='pending'?'interrupted':thread.status,
    })).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
  } catch { return []; }
}

export function saveStudyChats(storage,key,threads) {
  try {storage.setItem(key,JSON.stringify({version:1,threads}));return true;}
  catch {return false;}
}

export function studyChatTitle(thread) {
  return (thread.messages.find(message=>message.role==='user')?.text || 'New discussion').replace(/\s+/g,' ').slice(0,90);
}

export function mountStudyChat({panel,items,snapshot,tabName,reference,accountScope,accountReady,ask,formatText}) {
  const stores=new Map();
  let storage;
  try {storage=window.localStorage;}catch {storage=null;}
  let disposed=false,activeStore,activeThread,trigger;
  const pendingRequests=new Map();
  const dialog=document.createElement('dialog');
  dialog.className='study-chat-dialog';
  dialog.setAttribute('aria-labelledby','study-chat-heading');
  dialog.innerHTML=`<div class="study-chat-layout"><header class="study-chat-header"><div><h3 id="study-chat-heading"><span class="study-ai-icon" aria-hidden="true"></span>Brother AI</h3><p data-chat-context-title></p></div><div class="study-chat-header-actions"><button type="button" data-chat-history aria-label="View discussion history" title="Discussion history"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 10a9 9 0 1 1 2.5 8M3 4v6h6M12 7v5l3 2"/></svg></button><button type="button" data-chat-new aria-label="New discussion" title="New discussion">+</button><button type="button" data-chat-close aria-label="Close discussion">×</button></div></header><details class="study-chat-context" open><summary>Study context</summary><p data-chat-context-copy></p></details><div class="study-chat-main"><div class="study-chat-thread" aria-label="Discussion messages" tabindex="0"></div><section class="study-chat-history" aria-label="Saved discussions" hidden><h4>Discussions about this point</h4><div data-chat-history-list></div><button type="button" class="study-text-action" data-chat-back>Back to discussion</button></section></div><form class="study-chat-composer"><div class="study-chat-feedback" role="status" aria-live="polite"></div><div class="study-chat-compose-row"><textarea name="question" rows="2" maxlength="1000" placeholder="Ask about this point…" aria-label="Message Brother AI" required></textarea><button type="submit" class="study-chat-send" aria-label="Send message"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m5 12 14-8-4 16-3-6-7-2Zm7 2 7-10"/></svg></button></div><small data-chat-storage-note>Discussions saved on this device.</small></form></div>`;
  panel.append(dialog);
  const threadHost=dialog.querySelector('.study-chat-thread');
  const historyHost=dialog.querySelector('.study-chat-history');
  const form=dialog.querySelector('form');
  const input=form.elements.question;
  const feedback=dialog.querySelector('.study-chat-feedback');
  const storageNote=dialog.querySelector('[data-chat-storage-note]');
  function positionChat() {
    const frame=panel.closest('.phone-frame')?.getBoundingClientRect();
    const viewport=window.visualViewport;
    const width=viewport?.width || window.innerWidth,height=viewport?.height || window.innerHeight;
    const offsetX=viewport?.offsetLeft || 0,offsetY=viewport?.offsetTop || 0;
    const chatWidth=Math.min(560,width-32,frame?frame.width-24:width-32);
    const chatHeight=Math.min(680,height-32,frame?frame.height-24:height-32);
    dialog.style.width=`${chatWidth}px`;dialog.style.height=`${chatHeight}px`;
    dialog.style.left=`${offsetX+Math.max(16+chatWidth/2,Math.min(width-16-chatWidth/2,frame?frame.left+frame.width/2-offsetX:width/2))}px`;
    dialog.style.top=`${offsetY+Math.max(16+chatHeight/2,Math.min(height-16-chatHeight/2,frame?frame.top+frame.height/2-offsetY:height/2))}px`;
  }
  window.addEventListener('resize',positionChat);
  window.visualViewport?.addEventListener('resize',positionChat);
  function storeFor(index) {
    if(!stores.has(index)) {
      const item=items[index];
      const key=studyChatStorageKey({accountScope,versionId:snapshot.versionId,bookId:snapshot.bookId,chapter:snapshot.chapter,tabName,cardId:item.chatId});
      let threads=readStudyChats(storage,key);
      if(!threads.length){
        const legacyKey=key.replace('thinkbible.localStudyChat.','brother.studyChat.');
        const legacy=readStudyChats(storage,legacyKey);
        if(legacy.length && saveStudyChats(storage,key,legacy)){threads=legacy;try{storage.removeItem(legacyKey);}catch{}}
      }
      stores.set(index,{index,item,key,threads,saved:true});
    }
    return stores.get(index);
  }
  function persist(store) {
    store.threads.sort((a,b)=>b.updatedAt-a.updatedAt);
    store.saved=saveStudyChats(storage,store.key,store.threads);
    refreshPreview(store);
    if(store===activeStore)storageNote.textContent=store.saved?'Discussions saved on this device.':'Could not save on this device. Your discussion remains available during this visit.';
  }
  function refreshPreview(store) {
    const host=panel.querySelector(`[data-study-chat="${store.index}"]`);
    const discussions=store.threads.filter(thread=>thread.messages.length).sort((a,b)=>b.updatedAt-a.updatedAt);
    host.hidden=!discussions.length;
    if(!discussions.length){host.replaceChildren();return;}
    const latest=discussions[0];
    host.innerHTML=`<button type="button" class="study-discussion-resume" data-resume-thread="${escape(latest.id)}"><span class="study-discussion-title">${escape(studyChatTitle(latest))}</span><span class="study-discussion-meta">${latest.messages.length} ${latest.messages.length===1?'message':'messages'} <span aria-hidden="true">↗</span></span></button>${discussions.length>1?`<button type="button" class="study-discussion-all">View all (${discussions.length})</button>`:''}`;
    host.querySelector('[data-resume-thread]').addEventListener('click',event=>openChat(store,latest,event.currentTarget));
    host.querySelector('.study-discussion-all')?.addEventListener('click',event=>{openChat(store,latest,event.currentTarget);showHistory();});
  }
  function newThread(store) {
    const thread={id:crypto.randomUUID(),createdAt:Date.now(),updatedAt:Date.now(),messages:[],draft:'',status:'ready'};
    store.threads.unshift(thread);persist(store);return thread;
  }
  function renderThread({scroll=true}={}) {
    if(disposed || !activeThread)return;
    historyHost.hidden=true;threadHost.hidden=false;
    form.hidden=false;
    threadHost.innerHTML=activeThread.messages.length?activeThread.messages.map(message=>`<article class="study-chat-message study-chat-message--${message.role}"><span class="study-chat-speaker">${message.role==='user'?'You':'Brother AI'}</span><div>${message.role==='user'?`<p>${escape(message.text).replace(/\n/g,'<br>')}</p>`:formatText(message.text)}</div></article>`).join(''):`<div class="study-chat-welcome"><span class="study-ai-icon" aria-hidden="true"></span><h4>Let’s explore this together</h4><p>Ask a question about “${escape(activeStore.item.title)}” in ${escape(reference)}.</p></div>`;
    input.value=activeThread.draft || '';
    const pending=pendingRequests.has(activeThread);
    form.querySelector('[type="submit"]').disabled=pending;
    form.setAttribute('aria-busy',String(pending));
    feedback.replaceChildren();
    if(pending)feedback.innerHTML='<span class="bible-study-loading-spinner" aria-hidden="true"></span><span>Brother AI is thinking…</span>';
    else if(['error','interrupted'].includes(activeThread.status)) {
      const message=document.createElement('span');message.textContent=activeThread.error || 'The reply was interrupted.';
      const retry=document.createElement('button');retry.type='button';retry.className='study-chat-retry';retry.textContent='Retry';
      retry.addEventListener('click',()=>sendMessage(true));feedback.append(message,retry);
    }
    storageNote.textContent=activeStore.saved?'Discussions saved on this device.':'Could not save on this device. Your discussion remains available during this visit.';
    if(scroll)requestAnimationFrame(()=>{if(!disposed)threadHost.scrollTop=threadHost.scrollHeight;});
  }
  function openChat(store,thread,source) {
    activeStore=store;activeThread=thread || store.threads[0] || newThread(store);trigger=source;
    dialog.querySelector('[data-chat-context-title]').textContent=`${reference} · ${store.item.title}`;
    dialog.querySelector('[data-chat-context-copy]').textContent=[store.item.detail,store.item.deeper].filter(Boolean).join(' ');
    dialog.querySelector('.study-chat-context').open=true;
    positionChat();renderThread();if(!dialog.open)dialog.showModal();input.focus();
  }
  function closeChat() {dialog.close();}
  dialog.addEventListener('close',()=>{
    if(disposed)return;
    if(trigger?.isConnected)trigger.focus();
    else panel.querySelector(`[data-study-ask="${activeStore.index}"]`)?.focus();
  });
  dialog.querySelector('[data-chat-close]').addEventListener('click',closeChat);
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom)closeChat();}});
  dialog.querySelector('[data-chat-new]').addEventListener('click',()=>{activeThread=newThread(activeStore);renderThread();input.focus();});
  function showHistory() {
    threadHost.hidden=true;historyHost.hidden=false;form.hidden=true;
    const discussions=activeStore.threads.filter(thread=>thread.messages.length).sort((a,b)=>b.updatedAt-a.updatedAt);
    const list=historyHost.querySelector('[data-chat-history-list]');
    list.innerHTML=discussions.length?discussions.map(thread=>`<button type="button" data-history-thread="${escape(thread.id)}"><strong>${escape(studyChatTitle(thread))}</strong><span>${thread.messages.length} ${thread.messages.length===1?'message':'messages'} · ${escape(new Date(thread.updatedAt).toLocaleDateString('en',{month:'short',day:'numeric'}))}</span></button>`).join(''):'<p>No discussion yet for this point.</p>';
    list.querySelectorAll('[data-history-thread]').forEach(button=>button.addEventListener('click',()=>{activeThread=activeStore.threads.find(thread=>thread.id===button.dataset.historyThread);renderThread();input.focus();}));
  }
  dialog.querySelector('[data-chat-history]').addEventListener('click',showHistory);
  dialog.querySelector('[data-chat-back]').addEventListener('click',()=>{renderThread();input.focus();});
  input.addEventListener('input',()=>{activeThread.draft=input.value;persist(activeStore);});
  input.addEventListener('keydown',event=>{if(event.key==='Enter' && !event.shiftKey && !event.isComposing){event.preventDefault();form.requestSubmit();}});
  async function sendMessage(retry=false) {
    if(pendingRequests.has(activeThread))return;
    const store=activeStore,thread=activeThread;
    const lastUser=thread.messages.findLast(message=>message.role==='user');
    const question=retry?lastUser?.text:input.value.trim();
    if(!question)return;
    const history=retry?thread.messages.slice(0,-1):[...thread.messages];
    if(!retry)thread.messages.push({role:'user',text:question,createdAt:Date.now()});
    thread.draft='';thread.status='pending';delete thread.error;thread.updatedAt=Date.now();
    const currentController=new AbortController();
    pendingRequests.set(thread,currentController);
    persist(store);renderThread();
    try {
      const text=await ask({item:store.item,question,history,signal:currentController.signal});
      if(disposed || currentController.signal.aborted)return;
      thread.messages.push({role:'assistant',text,createdAt:Date.now()});thread.status='ready';
    } catch(error) {
      if(!disposed){thread.status=error.name==='AbortError'?'interrupted':'error';thread.error=error.name==='AbortError'?'The reply was interrupted.':(error.message || 'The reply could not be loaded.');}
    } finally {
      pendingRequests.delete(thread);
      if(!disposed){thread.updatedAt=Date.now();persist(store);if(activeThread===thread && historyHost.hidden)renderThread();else if(activeStore===store && !historyHost.hidden)showHistory();}
    }
  }
  form.addEventListener('submit',event=>{event.preventDefault();sendMessage();});
  const buttons=[...panel.querySelectorAll('[data-study-ask]')];
  const accountResolved=Promise.resolve(accountReady || accountScope).catch(()=>accountScope || 'guest').then(scope=>{
    accountScope=scope || 'guest';
    if(!disposed)buttons.forEach(button=>refreshPreview(storeFor(Number(button.dataset.studyAsk))));
  });
  buttons.forEach(button=>button.addEventListener('click',async()=>{
    button.setAttribute('aria-busy','true');await accountResolved;button.removeAttribute('aria-busy');
    if(!disposed)openChat(storeFor(Number(button.dataset.studyAsk)),null,button);
  }));
  return ()=>{
    disposed=true;
    window.removeEventListener('resize',positionChat);window.visualViewport?.removeEventListener('resize',positionChat);
    for(const [thread,controller] of pendingRequests){thread.status='interrupted';controller.abort();const store=[...stores.values()].find(store=>store.threads.includes(thread));if(store)persist(store);}
    pendingRequests.clear();if(dialog.open)dialog.close();dialog.remove();
  };
}
