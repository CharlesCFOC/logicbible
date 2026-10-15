import { limitStudySections, parseStudyReference, selectStudyVerses, studySourceLinks, studyEvidenceLabel, studyReflectionPrompt, studyMapSvg } from './bible-study-tools.js?v=2';

const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names = { biblical:'MAP OF THE BOOK', historical:'TIME TRAIL', summary:'CHAPTER STORY', veracity:'EVIDENCE FILE', manuscripts:'MANUSCRIPT TRAIL' };
let geographyPromise;
function geography() {
  return geographyPromise ||= fetch('assets/bible-study/geography.json').then(response => {
    if (!response.ok) throw new Error('The map could not be loaded.');
    return response.json();
  }).catch(error => { geographyPromise = undefined; throw error; });
}

export function mountStudyView({ panel, result, tabName, snapshot, loadPassage, ask, saveReflection, readReflection, formatText }) {
  const study = limitStudySections(result.study,tabName);
  const items = [];
  let disposed = false, passageController, chatController;
  const reflection = readReflection(tabName);
  const question = studyReflectionPrompt(study, result.reference);
  function referenceLink(reference) {
    if (!reference) return '';
    const parsed = parseStudyReference(reference, snapshot.books, snapshot.bookName);
    return parsed ? `<button type="button" class="study-step-reference study-reference-button" data-study-reference="${escape(reference)}" aria-label="Read ${escape(reference)}">${escape(reference)} <span aria-hidden="true">↗</span></button>` : `<span class="study-step-reference">${escape(reference)}</span>`;
  }
  function deeper(item, extra = '') {
    const index = items.push(item) - 1;
    return `<details class="study-deeper"><summary>Explore deeper</summary><div class="study-deeper-content">${item.deeper ? `<p>${escape(item.deeper)}</p>` : ''}${extra}<button class="study-text-action" type="button" data-study-ask="${index}">Ask Brother AI</button><div class="study-inline-chat" data-study-chat="${index}" hidden></div></div></details>`;
  }
  const steps = (Array.isArray(study.steps) ? study.steps : []).map((step,index) => `<article class="study-step"><span class="study-step-index">${String(index+1).padStart(2,'0')}</span><div class="study-step-copy"><span class="study-step-label">${escape(step.label)}</span><h3>${escape(step.title)}</h3>${referenceLink(step.reference)}<p>${escape(step.detail)}</p>${deeper(step)}</div></article>`).join('');
  const cards = (Array.isArray(study.cards) ? study.cards : []).map((card,index) => {
    const manuscript = card.manuscript || {};
    const links = studySourceLinks(card);
    const searchQuery = String(card.researchQuery || [card.title,result.reference].join(' '));
    const sources = links.length ? `<div class="study-source-trails"><span class="study-source-heading">Sources & research</span>${links.map(source => `<a class="study-source-link" href="${escape(source.url)}" target="_blank" rel="noopener noreferrer"><span><strong>${escape(source.title)}</strong><small>${escape(source.kind)}${source.author ? ` · ${escape(source.author)}` : ''}</small>${source.why ? `<small>${escape(source.why)}</small>` : ''}</span><span aria-hidden="true">↗</span></a>`).join('')}<p class="study-source-note">A source link is a starting point. Check its scope against this chapter and claim.</p></div>` : '';
    const research = ['veracity','manuscripts','historical'].includes(tabName) ? `<a class="study-source-search" href="https://www.google.com/search?q=${encodeURIComponent(searchQuery)}" target="_blank" rel="noopener noreferrer">Research this point <span aria-hidden="true">↗</span></a>` : '';
    const journey = tabName === 'manuscripts' ? `<ol class="study-witness-journey" aria-label="Manuscript journey">${[['Copied',manuscript.dateRange],['Discovered',manuscript.discovered],['Held today',manuscript.location]].map(([label,value]) => `<li><span>${label}</span><p>${escape(value || 'Unknown')}</p></li>`).join('')}</ol><dl class="study-manuscript-details">${[['Witness',manuscript.witness],['Findspot / provenance',manuscript.discovery],['Chapter text preserved',manuscript.coverage]].filter(([,value])=>value).map(([label,value])=>`<div><dt>${label}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>` : '';
    return `<article class="study-insight-card study-insight-card--${tabName}" style="--insight-index:${index}"><div class="study-insight-topline"><span>${escape(card.label || 'Insight')}</span>${tabName==='veracity' ? `<span class="study-evidence-status">${escape(studyEvidenceLabel(card))}</span>` : card.status ? `<span class="study-evidence-status">${escape(card.status)}</span>` : ''}</div><h3>${escape(card.title)}</h3><p>${escape(card.detail)}</p>${referenceLink(card.reference || manuscript.coverage)}${deeper(card,`${journey}${sources}${research}`)}</article>`;
  }).join('');
  const challenge = study.challenge;
  const quiz = challenge?.question && Array.isArray(challenge.choices) && challenge.choices.length===3 ? `<details class="bible-study-challenge"><summary><span class="study-challenge-spark" aria-hidden="true">✦</span><span>Quick check</span><span class="study-challenge-hint">Try it</span></summary><div class="study-challenge-content"><p>${escape(challenge.question)}</p><div class="study-challenge-choices">${challenge.choices.map((choice,index)=>`<button type="button" data-study-choice="${index}">${escape(choice)}</button>`).join('')}</div><p class="study-challenge-feedback" data-study-feedback role="status"></p></div></details>` : '';
  const layout = {biblical:'map',historical:'timeline',summary:'story',veracity:'evidence',manuscripts:'evidence'}[tabName];
  panel.innerHTML = `<div class="bible-study-result bible-study-result--${tabName}"><header class="bible-study-hero"><div class="study-mode-row"><span>${names[tabName]}</span><span class="study-reference-chip">${escape(result.reference)}</span></div><h2>${escape(study.headline)}</h2><p>${escape(study.intro)}</p></header>${tabName==='historical' ? '<details class="study-geography"><summary>Places in this chapter</summary><div data-study-geography></div></details>' : ''}${steps ? `<div class="study-steps study-steps--${layout}">${steps}</div>` : ''}${cards ? `<div class="study-insight-grid">${cards}</div>` : ''}${quiz}<details class="study-reflection"><summary>Personal reflection</summary><form data-study-reflection-form><label for="study-reflection-answer">${escape(question)}</label><textarea id="study-reflection-answer" name="answer" rows="3" maxlength="3000" placeholder="A thought, a question, or a small next step…">${escape(reflection.answer || '')}</textarea><div class="study-reflection-footer"><button class="study-text-action" type="submit">Save to Notes</button><span role="status" data-reflection-status></span></div></form></details><p class="bible-study-disclaimer">AI-generated study notes · historical details can be uncertain.</p><dialog class="study-passage-dialog" aria-labelledby="study-passage-title"><header><h3 id="study-passage-title"></h3><button class="study-passage-close" type="button" aria-label="Close passage">×</button></header><div class="study-passage-content"></div></dialog></div>`;
  const dialog = panel.querySelector('dialog');
  let passageTrigger;
  function closePassage() {
    passageController?.abort();
    dialog.close();
    if (passageTrigger?.isConnected) passageTrigger.focus();
  }
  dialog.querySelector('.study-passage-close').addEventListener('click',closePassage);
  dialog.addEventListener('cancel',()=>passageController?.abort());
  dialog.addEventListener('click',event=>{ if (event.target===dialog) { const rect=dialog.getBoundingClientRect(); if (event.clientX<rect.left || event.clientX>rect.right || event.clientY<rect.top || event.clientY>rect.bottom) closePassage(); } });
  panel.querySelectorAll('[data-study-reference]').forEach(button => button.addEventListener('click',async()=>{
    passageTrigger=button;
    passageController?.abort();
    const controller=passageController=new AbortController();
    const parsed=parseStudyReference(button.dataset.studyReference,snapshot.books,snapshot.bookName);
    dialog.querySelector('h3').textContent=button.dataset.studyReference;
    const content=dialog.querySelector('.study-passage-content');
    content.innerHTML='<p role="status">Loading passage…</p>';
    dialog.showModal();
    try {
      const passage=await loadPassage(parsed,controller.signal);
      if (disposed || controller.signal.aborted) return;
      const verses=selectStudyVerses(passage.verses,parsed);
      if (!verses.length || parsed.ranges.some(range=>!verses.some(verse=>Number(verse.number)===range.start) || !verses.some(verse=>Number(verse.number)===range.end))) throw new Error('This passage is not available in the selected translation.');
      content.innerHTML=`<p class="study-passage-version">${escape(passage.version)}</p>${verses.map(verse=>`<p><sup>${Number(verse.number)}</sup> ${escape(verse.text)}</p>`).join('')}`;
    } catch(error) { if (!controller.signal.aborted && !disposed) content.innerHTML=`<p role="status">${escape(error.message || 'The passage could not be loaded. Please try again.')}</p>`; }
  }));
  panel.querySelectorAll('[data-study-ask]').forEach(button=>button.addEventListener('click',()=>{
    const host=panel.querySelector(`[data-study-chat="${button.dataset.studyAsk}"]`);
    if (!host.hidden) { host.querySelector('textarea').focus(); return; }
    const item=items[Number(button.dataset.studyAsk)];
    host.hidden=false;
    host.innerHTML=`<form><label>Ask about “${escape(item.title)}”<textarea name="question" rows="2" maxlength="1000" required placeholder="What would you like to understand?"></textarea></label><button class="study-text-action" type="submit">Ask</button><p class="study-chat-status" role="status"></p></form><div class="study-chat-answer"></div>`;
    const form=host.querySelector('form'), input=form.elements.question, answer=host.querySelector('.study-chat-answer'), status=host.querySelector('[role="status"]');
    let lastAnswer='';
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      if (!input.value.trim()) return;
      chatController?.abort();
      const controller=chatController=new AbortController();
      form.setAttribute('aria-busy','true');form.querySelector('button').disabled=true;
      status.textContent='Brother AI is thinking…';
      try {
        const text=await ask({item,question:input.value.trim(),previous:lastAnswer,signal:controller.signal});
        if (disposed || controller.signal.aborted) return;
        lastAnswer=text;
        answer.innerHTML=formatText(text);
        status.textContent='';
      } catch(error) { if (!controller.signal.aborted && !disposed) status.textContent=error.message || 'Please try again.'; }
      finally { if (form.isConnected) { if(controller.signal.aborted)status.textContent='';form.setAttribute('aria-busy','false');form.querySelector('button').disabled=false; } }
    });
    input.focus();
  }));
  panel.querySelectorAll('[data-study-choice]').forEach(button=>button.addEventListener('click',()=>{
    const correct=Number(button.dataset.studyChoice)===Number(challenge.correctIndex);
    const feedback=panel.querySelector('[data-study-feedback]');
    feedback.textContent=correct?challenge.explanation:'Look again at the chapter and try another answer.';
    feedback.classList.toggle('is-correct',correct);
    if(correct) panel.querySelectorAll('[data-study-choice]').forEach(choice=>choice.disabled=true);
  }));
  const reflectionForm=panel.querySelector('[data-study-reflection-form]');
  reflectionForm.addEventListener('input',()=>{
    try { readReflection(tabName,{answer:reflectionForm.elements.answer.value,question});panel.querySelector('[data-reflection-status]').textContent='Draft saved on this device'; }
    catch { panel.querySelector('[data-reflection-status]').textContent='Your draft could not be saved on this device.'; }
  });
  reflectionForm.addEventListener('submit',async event=>{
    event.preventDefault();
    const answer=reflectionForm.elements.answer.value.trim();
    if(!answer) { reflectionForm.elements.answer.focus();return; }
    const status=panel.querySelector('[data-reflection-status]');
    try { await saveReflection({tab:tabName,question,answer});if(!disposed)status.textContent='Saved to Notes'; }
    catch { if(!disposed)status.textContent='Could not save. Your text is still here; please try again.'; }
  });
  const mapDetails=panel.querySelector('.study-geography');
  mapDetails?.addEventListener('toggle',async()=>{
    const host=mapDetails.querySelector('[data-study-geography]');
    if(!mapDetails.open || host.dataset.loaded) return;
    host.innerHTML='<p role="status">Loading places…</p>';
    try {
      const data=await geography();
      if(disposed) return;
      const ids=data.chapters[`${snapshot.bookId}.${snapshot.chapter}`] || [];
      const places=ids.slice(0,6).map(id=>data.places[id]);
      host.innerHTML=places.length ? `${studyMapSvg(data,places)}<ol class="study-place-legend">${places.map(place=>`<li><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place[1]},${place[2]}`)}" target="_blank" rel="noopener noreferrer">${escape(place[0])} <span aria-hidden="true">↗</span></a></li>`).join('')}</ol>` : '<p>No mapped place was identified in this chapter. This does not mean its setting is unknown.</p>';
      host.insertAdjacentHTML('beforeend',`<p class="study-map-caption">${ids.length>6?`Showing 6 of ${ids.length} places. `:''}Places mentioned, not a travel route. Approximate identifications · modern coastlines. <a href="https://www.openbible.info/geo/" target="_blank" rel="noopener noreferrer">OpenBible.info</a> · <a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener noreferrer">Natural Earth</a></p>`);
      host.dataset.loaded='true';
    } catch(error) { if(!disposed) host.innerHTML=`<p role="status">${escape(error.message)} Close and reopen to retry.</p>`; }
  });
  return ()=>{ disposed=true;passageController?.abort();chatController?.abort();if(dialog.open)dialog.close(); };
}
