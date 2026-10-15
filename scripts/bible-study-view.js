import { mountStudyChat } from './bible-study-chat.js?v=6';
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

export function mountStudyView({ panel, result, tabName, snapshot, loadPassage, ask, saveReflection, readReflection, formatText, accountScope, accountReady }) {
  const study = limitStudySections(result.study,tabName);
  const items = [];
  let disposed = false, passageController;
  const reflection = readReflection(tabName);
  const question = studyReflectionPrompt(study, result.reference);
  function referenceLink(reference) {
    if (!reference) return '';
    const parsed = parseStudyReference(reference, snapshot.books, snapshot.bookName);
    return parsed ? `<button type="button" class="study-step-reference study-reference-button" data-study-reference="${escape(reference)}" aria-label="Read ${escape(reference)}">${escape(reference)} <span aria-hidden="true">↗</span></button>` : `<span class="study-step-reference">${escape(reference)}</span>`;
  }
  function deeper(item, extra = '', chatId) {
    const index = items.push({...item,chatId}) - 1;
    return `<details class="study-deeper"><summary>Explore deeper</summary><div class="study-deeper-content">${item.deeper ? `<p>${escape(item.deeper)}</p>` : ''}${extra}<button class="study-text-action" type="button" data-study-ask="${index}"><span class="study-ai-icon" aria-hidden="true"></span><span>Ask Brother AI</span></button><div class="study-discussion-preview" data-study-chat="${index}" hidden></div></div></details>`;
  }
  const steps = (Array.isArray(study.steps) ? study.steps : []).map((step,index) => `<article class="study-step"><span class="study-step-index">${String(index+1).padStart(2,'0')}</span><div class="study-step-copy"><span class="study-step-label">${escape(step.label)}</span><h3>${escape(step.title)}</h3>${referenceLink(step.reference)}<p>${escape(step.detail)}</p>${deeper(step,'',`step:${index}`)}</div></article>`).join('');
  const cards = (Array.isArray(study.cards) ? study.cards : []).map((card,index) => {
    const manuscript = card.manuscript || {};
    const links = studySourceLinks(card);
    const searchQuery = String(card.researchQuery || [card.title,result.reference].join(' '));
    const sources = links.length ? `<div class="study-source-trails"><span class="study-source-heading">Sources & research</span>${links.map(source => `<a class="study-source-link" href="${escape(source.url)}" target="_blank" rel="noopener noreferrer"><span><strong>${escape(source.title)}</strong><small>${escape(source.kind)}${source.author ? ` · ${escape(source.author)}` : ''}</small>${source.why ? `<small>${escape(source.why)}</small>` : ''}</span><span aria-hidden="true">↗</span></a>`).join('')}<p class="study-source-note">A source link is a starting point. Check its scope against this chapter and claim.</p></div>` : '';
    const research = ['veracity','manuscripts','historical'].includes(tabName) ? `<a class="study-source-search" href="https://www.google.com/search?q=${encodeURIComponent(searchQuery)}" target="_blank" rel="noopener noreferrer">Research this point <span aria-hidden="true">↗</span></a>` : '';
    const journey = tabName === 'manuscripts' ? `<ol class="study-witness-journey" aria-label="Manuscript journey">${[['Copied',manuscript.dateRange],['Discovered',manuscript.discovered],['Held today',manuscript.location]].map(([label,value]) => `<li><span>${label}</span><p>${escape(value || 'Unknown')}</p></li>`).join('')}</ol><dl class="study-manuscript-details">${[['Witness',manuscript.witness],['Findspot / provenance',manuscript.discovery],['Chapter text preserved',manuscript.coverage]].filter(([,value])=>value).map(([label,value])=>`<div><dt>${label}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>` : '';
    return `<article class="study-insight-card study-insight-card--${tabName}" style="--insight-index:${index}"><div class="study-insight-topline"><span>${escape(card.label || 'Insight')}</span>${tabName==='veracity' ? `<span class="study-evidence-status">${escape(studyEvidenceLabel(card))}</span>` : card.status ? `<span class="study-evidence-status">${escape(card.status)}</span>` : ''}</div><h3>${escape(card.title)}</h3><p>${escape(card.detail)}</p>${referenceLink(card.reference || manuscript.coverage)}${deeper(card,`${journey}${sources}${research}`,`card:${index}`)}</article>`;
  }).join('');
  const challenge = study.challenge;
  const quiz = challenge?.question && Array.isArray(challenge.choices) && challenge.choices.length===3 ? `<details class="bible-study-challenge"><summary class="bible-study-quiz-toggle"><span>Quiz</span></summary><div class="study-challenge-content"><p>${escape(challenge.question)}</p><div class="study-challenge-choices">${challenge.choices.map((choice,index)=>`<button type="button" data-study-choice="${index}">${escape(choice)}</button>`).join('')}</div><p class="study-challenge-feedback" data-study-feedback role="status"></p></div></details>` : '';
  const layout = {biblical:'map',historical:'timeline',summary:'story',veracity:'evidence',manuscripts:'evidence'}[tabName];
  const cardSection = study.cards.length > 1 ? `<section class="study-card-carousel" role="region" aria-roledescription="carousel" aria-label="Study insights"><div class="study-card-indicators" role="group" aria-label="Choose a study card">${study.cards.map((card,index)=>`<button type="button" data-study-slide="${index}" aria-label="Show card ${index+1} of ${study.cards.length}: ${escape(card.title)}" aria-current="${index===0?'true':'false'}"><span aria-hidden="true"></span></button>`).join('')}</div><div class="study-card-track">${cards}</div></section>` : cards ? `<div class="study-insight-grid">${cards}</div>` : '';
  panel.innerHTML = `<div class="bible-study-result bible-study-result--${tabName}"><header class="bible-study-hero"><div class="study-mode-row"><span>${names[tabName]}</span><span class="study-reference-chip">${escape(result.reference)}</span></div><h2>${escape(study.headline)}</h2><p>${escape(study.intro)}</p></header>${tabName==='historical' ? '<details class="study-geography" open><summary>Places in this chapter</summary><div data-study-geography></div></details>' : ''}${steps ? `<div class="study-steps study-steps--${layout}">${steps}</div>` : ''}${cardSection}${quiz}<details class="study-reflection"><summary>Personal reflection</summary><form data-study-reflection-form><label for="study-reflection-answer">${escape(question)}</label><textarea id="study-reflection-answer" name="answer" rows="3" maxlength="3000" placeholder="A thought, a question, or a small next step…">${escape(reflection.answer || '')}</textarea><div class="study-reflection-footer"><button class="study-text-action" type="submit">Save to Notes</button><span role="status" data-reflection-status></span></div></form></details><p class="bible-study-disclaimer">AI-generated study notes · historical details can be uncertain.</p><dialog class="study-passage-dialog" aria-labelledby="study-passage-title"><header><h3 id="study-passage-title"></h3><button class="study-passage-close" type="button" aria-label="Close passage">×</button></header><div class="study-passage-content"></div></dialog></div>`;
  const track = panel.querySelector('.study-card-track');
  let carouselObserver, carouselFrame;
  if (track) {
    const slides = [...track.children];
    const indicators = [...panel.querySelectorAll('[data-study-slide]')];
    let active = 0, measuredWidth = track.clientWidth, pointer, dragged = false;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function resizeSlide() {
      const height = `${slides[active].offsetHeight + 6}px`;
      if (track.style.height !== height) track.style.height = height;
    }
    function selectSlide(index) {
      active = Math.max(0, Math.min(slides.length - 1, index));
      slides.forEach((slide,i)=>{
        slide.inert = i !== active;
        slide.setAttribute('aria-hidden',String(i !== active));
        indicators[i].setAttribute('aria-current',String(i === active));
      });
      resizeSlide();
    }
    function goToSlide(index) {
      selectSlide(index);
      track.scrollTo({left:slides[active].offsetLeft,behavior:reducedMotion?'instant':'smooth'});
    }
    function nearestSlide() {
      return slides.reduce((nearest,slide,index)=>Math.abs(slide.offsetLeft-track.scrollLeft)<Math.abs(slides[nearest].offsetLeft-track.scrollLeft)?index:nearest,0);
    }
    slides.forEach((slide,index)=>{
      slide.setAttribute('role','group');
      slide.setAttribute('aria-roledescription','slide');
      slide.setAttribute('aria-label',`${index+1} of ${slides.length}`);
    });
    indicators.forEach((button,index)=>button.addEventListener('click',()=>goToSlide(index)));
    track.addEventListener('scroll',()=>{
      cancelAnimationFrame(carouselFrame);
      carouselFrame=requestAnimationFrame(()=>{if(!disposed && !pointer?.dragging)selectSlide(nearestSlide());});
    },{passive:true});
    panel.querySelector('.study-card-indicators').addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault();event.stopPropagation();
      const target=event.key==='Home'?0:event.key==='End'?slides.length-1:active+(event.key==='ArrowRight'?1:-1);
      goToSlide(target);indicators[active].focus();
    });
    // Touch and trackpads use native scrolling; mouse dragging starts only off controls.
    track.addEventListener('pointerdown',event=>{
      if(event.pointerType!=='mouse' || event.button!==0 || event.target.closest('button,a,input,textarea,summary')) return;
      pointer={id:event.pointerId,x:event.clientX,y:event.clientY,left:track.scrollLeft,dragging:false};dragged=false;
    });
    track.addEventListener('pointermove',event=>{
      if(!pointer || pointer.id!==event.pointerId) return;
      const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
      if(!pointer.dragging && Math.abs(dx)>8 && Math.abs(dx)>Math.abs(dy)) {
        pointer.dragging=true;dragged=true;track.classList.add('is-dragging');track.setPointerCapture(event.pointerId);
      }
      if(pointer.dragging) {event.preventDefault();track.scrollLeft=pointer.left-dx;}
    });
    function finishDrag(event) {
      if(!pointer || pointer.id!==event.pointerId) return;
      const wasDragging=pointer.dragging;pointer=undefined;track.classList.remove('is-dragging');
      if(track.hasPointerCapture(event.pointerId))track.releasePointerCapture(event.pointerId);
      if(wasDragging)goToSlide(nearestSlide());
    }
    track.addEventListener('pointerup',finishDrag);
    track.addEventListener('pointercancel',finishDrag);
    track.addEventListener('pointerleave',event=>{if(pointer && !pointer.dragging)finishDrag(event);});
    track.addEventListener('click',event=>{if(dragged){event.preventDefault();event.stopPropagation();dragged=false;}},true);
    selectSlide(0);
    carouselObserver=new ResizeObserver(()=>{
      if(disposed)return;
      if(track.clientWidth!==measuredWidth) {measuredWidth=track.clientWidth;track.scrollTo({left:slides[active].offsetLeft,behavior:'instant'});}
      resizeSlide();
    });
    slides.forEach(slide=>carouselObserver.observe(slide));carouselObserver.observe(track);
  }
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
  const disposeChat=mountStudyChat({panel,items,snapshot,tabName,reference:result.reference,accountScope,accountReady,ask,formatText});
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
  async function loadChapterMap() {
    const host=mapDetails.querySelector('[data-study-geography]');
    if(!mapDetails.open || host.dataset.loaded || host.dataset.loading) return;
    host.dataset.loading='true';
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
    finally { delete host.dataset.loading; }
  }
  mapDetails?.addEventListener('toggle',loadChapterMap);
  if(mapDetails?.open)loadChapterMap();
  return ()=>{ disposed=true;carouselObserver?.disconnect();cancelAnimationFrame(carouselFrame);passageController?.abort();disposeChat();if(dialog.open)dialog.close(); };
}
