const STORAGE_KEY = "standup-picker-teams";
const ACTIVE_TEAM_KEY = "standup-picker-active-team";

const teamSelect = document.getElementById("team-select");
const newTeamBtn = document.getElementById("new-team-btn");
const manageTeamBtn = document.getElementById("manage-team-btn");
const deleteTeamBtn = document.getElementById("delete-team-btn");

const die = document.getElementById("die");
const dieFace = document.getElementById("die-face");
const rollBtn = document.getElementById("roll-btn");
const emptyHint = document.getElementById("empty-hint");
const rosterList = document.getElementById("roster-list");

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
  try {
    teams = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    teams = [];
  }
  activeTeamId = localStorage.getItem(ACTIVE_TEAM_KEY);

  if (teams.length === 0) {
    teams.push({
      id: crypto.randomUUID(),
      name: "My Team",
      members: [],
    });
  }

  if (!teams.some((t) => t.id === activeTeamId)) {
    activeTeamId = teams[0].id;
  }

  saveState();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
  if (activeTeamId) {
    localStorage.setItem(ACTIVE_TEAM_KEY, activeTeamId);
  }
}

function getActiveTeam() {
  return teams.find((t) => t.id === activeTeamId) || null;
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
  if (!hasMembers) {
    dieFace.textContent = "?";
  }
}

function render(winnerName) {
  renderTeamSelect();
  renderRoster(winnerName);
  renderDiceState();
}

function rollDice() {
  const team = getActiveTeam();
  if (!team || team.members.length === 0 || isRolling) return;

  isRolling = true;
  rollBtn.disabled = true;
  die.classList.add("rolling");
  die.classList.remove("landed");

  const members = team.members;
  const totalTicks = 16;
  let tick = 0;
  let delay = 80;

  function step() {
    const randomName = members[Math.floor(Math.random() * members.length)];
    dieFace.textContent = randomName;
    tick++;

    if (tick >= totalTicks) {
      const winner = members[Math.floor(Math.random() * members.length)];
      dieFace.textContent = winner;
      die.classList.remove("rolling");
      die.classList.add("landed");
      isRolling = false;
      rollBtn.disabled = false;
      renderRoster(winner);
      return;
    }

    delay += 12;
    setTimeout(step, delay);
  }

  setTimeout(step, delay);
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

  saveState();
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
  saveState();
  render();
}

teamSelect.addEventListener("change", () => {
  activeTeamId = teamSelect.value;
  saveState();
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
render();
