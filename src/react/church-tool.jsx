import React, { useState } from "react";
import { ChurchSpace } from "./church.jsx";
import { ChurchPreparation } from "./church-mode.jsx";

const tools = [
  { id: "session", label: "Session", description: "Préparez une étude, ajoutez les documents et animez un groupe." },
  { id: "mode", label: "Mode église", description: "Créez un scénario interactif pour faire vivre une discussion." },
];

export function ChurchToolPage() {
  const [activeTab, setActiveTab] = useState("session");
  return <div className="church-tool-page">
    <header className="church-tool-header">
      <span className="church-tool-eyebrow">OUTILS POUR L’ÉGLISE</span>
      <h1>Church Tool</h1>
      <p>Des outils pour enseigner la Parole et accompagner votre groupe.</p>
    </header>
    <div className="church-tool-tabs" role="tablist" aria-label="Outils d’église">
      {tools.map(tool => <button key={tool.id} type="button" role="tab" id={`church-tool-tab-${tool.id}`} aria-selected={activeTab === tool.id} aria-controls={`church-tool-panel-${tool.id}`} onClick={() => setActiveTab(tool.id)}>
        <strong>{tool.label}</strong><span>{tool.description}</span>
      </button>)}
    </div>
    <section id="church-tool-panel-session" role="tabpanel" aria-labelledby="church-tool-tab-session" hidden={activeTab !== "session"}>
      <ChurchSpace />
    </section>
    <section id="church-tool-panel-mode" role="tabpanel" aria-labelledby="church-tool-tab-mode" hidden={activeTab !== "mode"}>
      <ChurchPreparation />
    </section>
  </div>;
}
