// Source of truth for teams and their members.
//
// To permanently add, remove, or rename a team (or its members), edit this
// file and push/deploy the change. Anything changed through the app's
// "Manage Names" / "New Team" buttons is temporary — it only lasts for the
// current browser tab and is never written back here.
const DEFAULT_TEAMS = [
  {
    id: "engineering",
    name: "Engineering",
    members: ["Alex", "Bailey", "Casey"],
  },
  {
    id: "design",
    name: "Design",
    members: ["Dana", "Riley"],
  },
];
