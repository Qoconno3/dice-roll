const teamSelect = document.getElementById("team-select");
const newTeamBtn = document.getElementById("new-team-btn");
const manageTeamBtn = document.getElementById("manage-team-btn");
const deleteTeamBtn = document.getElementById("delete-team-btn");

const die = document.getElementById("die");
const dieSolid = document.getElementById("die-solid");
const rollBtn = document.getElementById("roll-btn");
const emptyHint = document.getElementById("empty-hint");
const overflowHint = document.getElementById("overflow-hint");
const rosterList = document.getElementById("roster-list");

const MAX_FACES = 8;

// Rotation (rotateY, rotateX, rotateZ, in degrees) that places each of the 8
// faces of a regular octahedron so they meet edge-to-edge, derived from the
// actual d8 vertex geometry: rotateY/rotateX aim the face's outward normal,
// rotateZ corrects the in-plane roll so adjacent triangles' edges line up.
const FACE_GEOMETRY = [
  { x: -35.264, y: 45, z: -60 },
  { x: -35.264, y: 135, z: 60 },
  { x: -35.264, y: -45, z: 60 },
  { x: -35.264, y: -135, z: -60 },
  { x: 35.264, y: -45, z: 120 },
  { x: 35.264, y: -135, z: -120 },
  { x: 35.264, y: 45, z: -120 },
  { x: 35.264, y: 135, z: 120 },
];
const FACE_TRANSLATE_Z = 60;

let faceLabelEls = [];
let currentRotX = 0;
let currentRotY = 0;
let currentRotZ = 0;

const manageModal = document.getElementById("manage-modal");
const manageTitle = document.getElementById("manage-title");
const teamNameInput = document.getElementById("team-name-input");
const nameInput = document.getElementById("name-input");
const addNameBtn = document.getElementById("add-name-btn");
const modalNameList = document.getElementById("modal-name-list");
const saveTeamBtn = document.getElementById("save-team-btn");
const cancelTeamBtn = document.getElementById("cancel-team-btn");

let teams = [];
let activeTeamId = null;
let editingTeamId = null;
let editingNames = [];
let isRolling = false;

function loadState() {
  // Deep-copied from teams.js (loaded before this script) so in-app edits
  // never mutate the hardcoded defaults. Nothing here is persisted — a
  // reload always starts fresh from teams.js.
  teams = DEFAULT_TEAMS.map((t) => ({ ...t, members: [...t.members] }));

  if (teams.length === 0) {
    teams.push({
      id: crypto.randomUUID(),
      name: "My Team",
      members: [],
    });
  }

  activeTeamId = teams[0].id;
}

function getActiveTeam() {
  return teams.find((t) => t.id === activeTeamId) || null;
}

function getFaceMembers(team) {
  return team ? team.members.slice(0, MAX_FACES) : [];
}

function buildDieFaces() {
  dieSolid.innerHTML = "";
  faceLabelEls = FACE_GEOMETRY.map(({ x, y, z }) => {
    const face = document.createElement("div");
    face.className = "die-face";
    face.style.transform = `rotateY(${y}deg) rotateX(${x}deg) translateZ(${FACE_TRANSLATE_Z}px) rotateZ(${z}deg)`;

    const label = document.createElement("span");
    label.className = "die-face-label";
    face.appendChild(label);

    dieSolid.appendChild(face);
    return { face, label };
  });
}

function renderDieFaces() {
  const team = getActiveTeam();
  const members = getFaceMembers(team);

  faceLabelEls.forEach(({ face, label }, i) => {
    const name = members[i] || "";
    label.textContent = name;
    face.classList.toggle("blank", !name);
  });

  overflowHint.classList.toggle("hidden", !team || team.members.length <= MAX_FACES);
}

function renderTeamSelect() {
  teamSelect.innerHTML = "";
  teams.forEach((team) => {
    const option = document.createElement("option");
    option.value = team.id;
    option.textContent = team.name;
    if (team.id === activeTeamId) option.selected = true;
    teamSelect.appendChild(option);
  });
  deleteTeamBtn.disabled = teams.length <= 1;
}

function renderRoster(winnerName) {
  rosterList.innerHTML = "";
  const team = getActiveTeam();
  const members = team ? team.members : [];

  if (members.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "No names yet — click \"Manage Names\" to add your team.";
    rosterList.appendChild(li);
    return;
  }

  members.forEach((name) => {
    const li = document.createElement("li");
    li.textContent = name;
    if (winnerName && name === winnerName) li.classList.add("winner");
    rosterList.appendChild(li);
  });
}

function renderDiceState() {
  const team = getActiveTeam();
  const hasMembers = team && team.members.length > 0;
  rollBtn.disabled = !hasMembers || isRolling;
  emptyHint.classList.toggle("hidden", hasMembers);
}

function render(winnerName) {
  renderTeamSelect();
  renderRoster(winnerName);
  renderDiceState();
  renderDieFaces();
}

// Smallest angle >= current that is congruent to targetMod (degrees) mod 360.
function angleAtLeast(current, targetMod) {
  const targetNorm = ((targetMod % 360) + 360) % 360;
  const currentNorm = ((current % 360) + 360) % 360;
  let diff = targetNorm - currentNorm;
  if (diff < 0) diff += 360;
  return current + diff;
}

function rollDice() {
  const team = getActiveTeam();
  const members = getFaceMembers(team);
  if (members.length === 0 || isRolling) return;

  isRolling = true;
  rollBtn.disabled = true;
  die.classList.remove("landed");
  die.classList.add("rolling");

  const winnerIndex = Math.floor(Math.random() * members.length);
  const winner = members[winnerIndex];
  const { x, y, z } = FACE_GEOMETRY[winnerIndex];

  const spinTurnsX = 2 + Math.floor(Math.random() * 2);
  const spinTurnsY = 2 + Math.floor(Math.random() * 2);
  const spinTurnsZ = 2 + Math.floor(Math.random() * 2);
  const targetX = angleAtLeast(currentRotX, -x) + spinTurnsX * 360;
  const targetY = angleAtLeast(currentRotY, -y) + spinTurnsY * 360;
  const targetZ = angleAtLeast(currentRotZ, -z) + spinTurnsZ * 360;

  currentRotX = targetX;
  currentRotY = targetY;
  currentRotZ = targetZ;
  dieSolid.style.transform = `rotateZ(${targetZ}deg) rotateX(${targetX}deg) rotateY(${targetY}deg)`;

  dieSolid.addEventListener(
    "transitionend",
    () => {
      die.classList.remove("rolling");
      die.classList.add("landed");
      isRolling = false;
      rollBtn.disabled = false;
      renderRoster(winner);
    },
    { once: true }
  );
}

function openManageModal(isNewTeam) {
  const team = isNewTeam ? null : getActiveTeam();
  editingTeamId = isNewTeam ? null : team.id;
  editingNames = isNewTeam ? [] : [...team.members];

  manageTitle.textContent = isNewTeam ? "New Team" : "Manage Names";
  teamNameInput.value = isNewTeam ? "" : team.name;
  nameInput.value = "";
  renderModalNameList();
  manageModal.classList.remove("hidden");
  teamNameInput.focus();
}

function closeManageModal() {
  manageModal.classList.add("hidden");
}

function renderModalNameList() {
  modalNameList.innerHTML = "";
  editingNames.forEach((name, index) => {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = name;
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "✕";
    removeBtn.setAttribute("aria-label", `Remove ${name}`);
    removeBtn.addEventListener("click", () => {
      editingNames.splice(index, 1);
      renderModalNameList();
    });
    li.appendChild(span);
    li.appendChild(removeBtn);
    modalNameList.appendChild(li);
  });
}

function addNameFromInput() {
  const value = nameInput.value.trim();
  if (!value) return;
  editingNames.push(value);
  nameInput.value = "";
  nameInput.focus();
  renderModalNameList();
}

function saveTeamFromModal() {
  const name = teamNameInput.value.trim();
  if (!name) {
    teamNameInput.focus();
    return;
  }

  if (editingTeamId) {
    const team = teams.find((t) => t.id === editingTeamId);
    team.name = name;
    team.members = [...editingNames];
  } else {
    const newTeam = {
      id: crypto.randomUUID(),
      name,
      members: [...editingNames],
    };
    teams.push(newTeam);
    activeTeamId = newTeam.id;
  }

  closeManageModal();
  render();
}

function deleteActiveTeam() {
  if (teams.length <= 1) return;
  const team = getActiveTeam();
  if (!team) return;
  if (!confirm(`Delete team "${team.name}"? This cannot be undone.`)) return;

  teams = teams.filter((t) => t.id !== team.id);
  activeTeamId = teams[0].id;
  render();
}

teamSelect.addEventListener("change", () => {
  activeTeamId = teamSelect.value;
  render();
});

newTeamBtn.addEventListener("click", () => openManageModal(true));
manageTeamBtn.addEventListener("click", () => openManageModal(false));
deleteTeamBtn.addEventListener("click", deleteActiveTeam);

addNameBtn.addEventListener("click", addNameFromInput);
nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addNameFromInput();
  }
});

saveTeamBtn.addEventListener("click", saveTeamFromModal);
cancelTeamBtn.addEventListener("click", closeManageModal);
manageModal.addEventListener("click", (e) => {
  if (e.target === manageModal) closeManageModal();
});

rollBtn.addEventListener("click", rollDice);

loadState();
buildDieFaces();
render();
