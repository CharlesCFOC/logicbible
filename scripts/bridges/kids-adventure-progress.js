// Adapter used by React; installed at the original bootstrap point.
function installKidsAdventureProgressBridge() {
window.kidsAdventureProgressBridge = {
  queue(adventureId) {
    markPendingSync(`brother.kidsAdventure.v1.${adventureId}`);
    markPendingSync("brother.kidsAdventure.last");
    void syncPendingState();
  },
};
}
