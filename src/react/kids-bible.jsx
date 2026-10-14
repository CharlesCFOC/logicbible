import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { KidsAdventureHub } from './kids-adventures.jsx';
import { kidsBooks, kidsAdventures } from './kids-adventures-data.js';
import { createKidsBadgeStore } from './kids-badges-store.js';

export function KidsBiblePage() {
  const [bookId, setBookId] = useState(null);
  const [tab, setTab] = useState('adventures');
  const [store] = useState(() => createKidsBadgeStore(window.kidsBadgesBridge));
  const badges = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const book = kidsBooks.find(book => book.id === bookId);
  useEffect(() => {
    const sync = () => { void store.sync(); };
    sync();
    document.addEventListener('profile:auth-change', sync);
    window.addEventListener('online', sync);
    const timer = window.setInterval(sync, 60_000);
    return () => { document.removeEventListener('profile:auth-change', sync); window.removeEventListener('online', sync); window.clearInterval(timer); };
  }, [store]);
  const selectTab = value => { setTab(value); document.getElementById('kids-bible')?.scrollTo({ top: 0, behavior: 'auto' }); };
  const tabKey = event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 'adventures' : event.key === 'End' ? 'badges' : tab === 'adventures' ? 'badges' : 'adventures';
    selectTab(next);
    document.getElementById(`kids-tab-${next}`)?.focus();
  };
  const message = badges.status === 'guest' ? 'Your badges stay on this device. Sign in on the Profile page to save them to your account.'
    : badges.status === 'loading' ? 'Saving and loading your badges…'
      : badges.status === 'pending' ? 'Your badges are saved on this device. They will sync when your connection is available.'
        : 'Your badges are saved to your account.';
  return <>
    <header className="kids-bible-header"><div><h1>Kids Bible {tab === 'adventures' && book && <em className="kids-bible-book-title">{book.title}</em>}</h1></div></header>
    <nav className="kids-page-tabs" role="tablist" aria-label="Kids Bible" onKeyDown={tabKey}>
      {[['adventures', 'Adventures'], ['badges', 'My badges']].map(([id, label]) => <button key={id} id={`kids-tab-${id}`} type="button" role="tab" className={tab === id ? "is-active" : ""} aria-selected={tab === id} aria-controls={`kids-panel-${id}`} tabIndex={tab === id ? 0 : -1} onClick={() => selectTab(id)}><span>{label}</span>{id === 'badges' && <span className="kids-tab-count">{badges.records.length}</span>}</button>)}
    </nav>
    <div id="kids-panel-adventures" role="tabpanel" aria-labelledby="kids-tab-adventures" hidden={tab !== 'adventures'}>
      <KidsAdventureHub bookId={bookId} onBookChange={setBookId} earnedIds={badges.records.map(r => r.adventureId)} onEarn={store.earn} />
    </div>
    <div id="kids-panel-badges" role="tabpanel" aria-labelledby="kids-tab-badges" hidden={tab !== 'badges'}>
      <section className="kids-adventure-collection kids-badges-page" aria-label="My earned badges"><div><h2>My badges</h2><span>{badges.records.length} / {kidsAdventures.length}</span></div><p className="kids-badges-sync" role="status">{message}</p>
        {badges.status === 'pending' && <button className="kids-badges-retry" type="button" onClick={() => void store.sync()}>Retry saving</button>}
        {badges.records.length ? <div className="kids-adventure-earned">{badges.records.map(record => {
          const a = kidsAdventures.find(a => a.id === record.adventureId);
          return <article className="kids-earned-badge" key={a.id}><span aria-hidden="true">{a.icon}</span><h3>{a.badge}</h3><p>{a.title}</p><small>{kidsBooks.find(b => b.id === a.bookId)?.title}</small></article>;
        })}</div> : <div className="kids-badges-empty"><span aria-hidden="true">✦</span><h3>Your first badge is waiting!</h3><p>Finish an adventure to start your collection.</p><button type="button" onClick={() => selectTab('adventures')}>Choose an adventure →</button></div>}
      </section>
    </div>
  </>;
}
