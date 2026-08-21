const teamSelect = document.getElementById("team-select");
const manageTeamBtn = document.getElementById("manage-team-btn");
const themeToggleBtn = document.getElementById("theme-toggle");

const die = document.getElementById("die");
const dieSolid = document.getElementById("die-solid");
const rollBtn = document.getElementById("roll-btn");
const emptyHint = document.getElementById("empty-hint");
const rosterList = document.getElementById("roster-list");
const statusLabel = document.getElementById("status-label");
const resultText = document.getElementById("result-text");


const PIPS = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};
const FACE_DEFS = [
  { value: 1, transform: "rotateY(0deg) translateZ(75px)" },
  { value: 6, transform: "rotateY(180deg) translateZ(75px)" },
  { value: 2, transform: "rotateY(90deg) translateZ(75px)" },
  { value: 5, transform: "rotateY(-90deg) translateZ(75px)" },
  { value: 3, transform: "rotateX(90deg) translateZ(75px)" },
  { value: 4, transform: "rotateX(-90deg) translateZ(75px)" },
];
const FACE_ROT = {
  1: { rx: 0, ry: 0 },
  2: { rx: 0, ry: -90 },
  3: { rx: -90, ry: 0 },
  4: { rx: 90, ry: 0 },
  5: { rx: 0, ry: 90 },
  6: { rx: 0, ry: 180 },
};

let currentRotX = 0;
let currentRotY = 0;

const manageModal = document.getElementById("manage-modal");
const teamNameInput = document.getElementById("team-name-input");
const nameInput = document.getElementById("name-input");
const addNameBtn = document.getElementById("add-name-btn");
const modalNameList = document.getElementById("modal-name-list");
const saveTeamBtn = document.getElementById("save-team-btn");
const cancelTeamBtn = document.getElementById("cancel-team-btn");

let teams = [];
let activeTeamId = null;
let editingNames = [];
let isRolling = false;

function loadState() {

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

function buildDieFaces() {
  dieSolid.innerHTML = "";
  FACE_DEFS.forEach(({ value, transform }) => {
    const face = document.createElement("div");
    face.className = "die-face";
    face.style.transform = transform;

    const active = PIPS[value];
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement("div");
      cell.className = "die-pip-cell";
      if (active.includes(i)) {
        const pip = document.createElement("div");
        pip.className = "die-pip";
        cell.appendChild(pip);
      }
      face.appendChild(cell);
    }

    dieSolid.appendChild(face);
  });
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
}

function renderRoster(winnerName) {
  rosterList.innerHTML = "";
  const team = getActiveTeam();
  const members = team ? team.members : [];

  if (members.length === 0) {
    const span = document.createElement("span");
    span.className = "text-muted";
    span.textContent = "No names yet — click \"Manage Team\" to add your team.";
    rosterList.appendChild(span);
    return;
  }

  members.forEach((name) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = name;
    if (winnerName && name === winnerName) chip.classList.add("winner");
    rosterList.appendChild(chip);
  });
}

function renderResult(state, winnerName) {
  if (state === "rolling") {
    statusLabel.textContent = "Rolling";
    resultText.textContent = "…";
    resultText.classList.remove("winner");
  } else if (state === "revealed") {
    statusLabel.textContent = "Leading today";
    resultText.textContent = winnerName;
    resultText.classList.add("winner");
  } else {
    statusLabel.textContent = "Press roll";
    resultText.textContent = "—";
    resultText.classList.remove("winner");
  }
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
  renderResult("idle");
  rollBtn.textContent = "Roll the dice";
}

const THEME_KEY = "standup-picker-theme";

function applyTheme(theme) {
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    themeToggleBtn.textContent = "☀️";
    themeToggleBtn.setAttribute("aria-label", "Switch to light mode");
  } else {
    document.documentElement.removeAttribute("data-theme");
    themeToggleBtn.textContent = "🌙";
    themeToggleBtn.setAttribute("aria-label", "Switch to dark mode");
  }
}

function loadTheme() {
  let stored = null;
  try {
    stored = localStorage.getItem(THEME_KEY);
  } catch {
    // localStorage unavailable (private browsing, blocked storage) — fall
    // back to the light default below.
  }
  applyTheme(stored === "dark" ? "dark" : "light");
}

themeToggleBtn.addEventListener("click", () => {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const next = isDark ? "light" : "dark";
  applyTheme(next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
  }
});


function randomInt(maxExclusive) {
  if (maxExclusive <= 1) return 0;
  if (!window.crypto || !window.crypto.getRandomValues) {
    return Math.floor(Math.random() * maxExclusive);
  }
  const range = 0x100000000; // 2^32
  const rejectionLimit = range - (range % maxExclusive);
  const buf = new Uint32Array(1);
  let value;
  do {
    window.crypto.getRandomValues(buf);
    value = buf[0];
  } while (value >= rejectionLimit);
  return value % maxExclusive;
}

function angleAtLeast(current, targetMod) {
  const targetNorm = ((targetMod % 360) + 360) % 360;
  const currentNorm = ((current % 360) + 360) % 360;
  let diff = targetNorm - currentNorm;
  if (diff < 0) diff += 360;
  return current + diff;
}

function rollDice() {
  const team = getActiveTeam();
  const members = team ? team.members : [];
  if (members.length === 0 || isRolling) return;

  isRolling = true;
  rollBtn.disabled = true;
  rollBtn.textContent = "Rolling…";
  renderResult("rolling");

  const winnerIndex = randomInt(members.length);
  const winner = members[winnerIndex];
  const targetFace = 1 + randomInt(6);
  const target = FACE_ROT[targetFace];

  const spinTurnsX = 2 + randomInt(2);
  const spinTurnsY = 2 + randomInt(2);
  const targetX = angleAtLeast(currentRotX, target.rx) + spinTurnsX * 360;
  const targetY = angleAtLeast(currentRotY, target.ry) + spinTurnsY * 360;

  currentRotX = targetX;
  currentRotY = targetY;
  dieSolid.style.transform = `rotateX(${targetX}deg) rotateY(${targetY}deg)`;

  dieSolid.addEventListener(
    "transitionend",
    () => {
      isRolling = false;
      rollBtn.disabled = false;
      rollBtn.textContent = "Roll again";
      renderResult("revealed", winner);
      renderRoster(winner);
    },
    { once: true }
  );
}

function openManageModal() {
  const team = getActiveTeam();
  editingNames = team ? [...team.members] : [];

  teamNameInput.value = team ? team.name : "";
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

  const team = getActiveTeam();
  team.name = name;
  team.members = [...editingNames];

  closeManageModal();
  render();
}

teamSelect.addEventListener("change", () => {
  activeTeamId = teamSelect.value;
  render();
});

manageTeamBtn.addEventListener("click", openManageModal);

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

loadTheme();
loadState();
buildDieFaces();
render();
