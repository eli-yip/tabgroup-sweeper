// Sweep all tabs that belong to a tab group, leaving ungrouped tabs open.
// Group membership is read live from chrome.tabs (groupId) + chrome.tabGroups —
// exact, never inferred from URLs.

// Chromium's eight named group colors + grey, mapped to display swatches.
const GROUP_COLORS: Record<chrome.tabGroups.ColorEnum, string> = {
  grey: "#5f6368",
  blue: "#1a73e8",
  red: "#d93025",
  yellow: "#f9ab00",
  green: "#188038",
  pink: "#d01884",
  purple: "#9334e6",
  cyan: "#007b83",
  orange: "#fa903e",
};

const NONE = chrome.tabGroups.TAB_GROUP_ID_NONE; // -1: tab is in no group

const statusEl = document.getElementById("status");
const listEl = document.getElementById("groupList");
const sweepBtn = document.getElementById(
  "sweepBtn",
) as HTMLButtonElement | null;

interface GroupRow {
  title: string;
  color: chrome.tabGroups.ColorEnum;
  tabIds: number[];
}

function setStatus(text: string, color: string): void {
  if (!statusEl) return;
  statusEl.textContent = text;
  statusEl.style.color = color;
}

// One row per tab group, across all windows, with the live tab ids in it.
async function collectGroups(): Promise<GroupRow[]> {
  const [groups, tabs] = await Promise.all([
    chrome.tabGroups.query({}),
    chrome.tabs.query({}),
  ]);

  const idsByGroup = new Map<number, number[]>();
  for (const tab of tabs) {
    if (tab.groupId === NONE || tab.id === undefined) continue;
    const ids = idsByGroup.get(tab.groupId) ?? [];
    ids.push(tab.id);
    idsByGroup.set(tab.groupId, ids);
  }

  return groups.map((g) => ({
    title: g.title ?? "",
    color: g.color,
    tabIds: idsByGroup.get(g.id) ?? [],
  }));
}

function render(rows: GroupRow[]): void {
  if (!listEl || !sweepBtn) return;
  listEl.replaceChildren();

  const totalTabs = rows.reduce((n, r) => n + r.tabIds.length, 0);

  if (totalTabs === 0) {
    sweepBtn.disabled = true;
    sweepBtn.textContent = "没有分组标签页";
    setStatus("当前没有任何标签组", "#888");
    return;
  }

  for (const r of rows) {
    if (r.tabIds.length === 0) continue;

    const item = document.createElement("div");
    item.className = "group-item";

    const dot = document.createElement("span");
    dot.className = "dot";
    dot.style.background = GROUP_COLORS[r.color];

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = r.title || "(未命名)";

    const count = document.createElement("span");
    count.className = "count";
    count.textContent = String(r.tabIds.length);

    item.append(dot, name, count);
    listEl.appendChild(item);
  }

  const groupCount = rows.filter((r) => r.tabIds.length > 0).length;
  sweepBtn.disabled = false;
  sweepBtn.textContent = `关闭 ${totalTabs} 个标签页（${groupCount} 个分组）`;
  setStatus("", "#888");
}

async function refresh(): Promise<void> {
  render(await collectGroups());
}

sweepBtn?.addEventListener("click", async () => {
  try {
    // Re-read at click time so the ids are fresh, then remove in one call.
    const rows = await collectGroups();
    const ids = rows.flatMap((r) => r.tabIds);
    if (ids.length === 0) return;

    await chrome.tabs.remove(ids);
    await refresh();
    setStatus(`已关闭 ${ids.length} 个标签页`, "green");
  } catch (error) {
    setStatus(
      `失败：${error instanceof Error ? error.message : String(error)}`,
      "red",
    );
  }
});

void refresh();
