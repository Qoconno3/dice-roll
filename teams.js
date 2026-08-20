// Source of truth for teams and their members.
//
// To permanently add, remove, or rename a team (or its members), edit this
// file and push/deploy the change. Anything changed through the app's
// "Manage Names" / "New Team" buttons is temporary — it only lasts for the
// current browser tab and is never written back here.
const DEFAULT_TEAMS = [
  {
    id: "pyxis",
    name: "Pyxis",
    members: ["Adam", "Ben", "Mike", "Shayne", "Joe", "Quincy", "Aaron"],
  },
  {
    id: "taurus",
    name: "Taurus",
    members: ["Adam", "Sathish", "Josh", "Ben", "Joe", "Sylvia", "Quincy"],
  },
];
