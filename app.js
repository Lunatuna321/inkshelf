const STORAGE_KEY = "inkshelf-data-v3";
const LEGACY_STORAGE_KEYS = ["inkshelf-data-v2", "inkshelf-data-v1"];
const UI_PREFERENCES_KEY = "inkshelf-ui-preferences-v1";

const themeRules = [
  { label: "Self-Development", words: ["成长", "改变", "学习", "习惯", "自律", "提升", "勇气"] },
  { label: "Social Observation", words: ["社会", "时代", "制度", "城市", "阶层", "现实", "公共"] },
  { label: "Relationships", words: ["爱", "亲密", "孤独", "陪伴", "婚姻", "想念", "关系"] },
  { label: "Literary Craft", words: ["句子", "语言", "叙事", "隐喻", "细节", "描写", "诗意"] },
  { label: "Life Reflection", words: ["人生", "意义", "时间", "命运", "选择", "存在", "未来"] },
];

const styleRules = [
  { label: "Analytical", words: ["因此", "因为", "结构", "逻辑", "分析", "趋势", "判断"] },
  { label: "Lyrical", words: ["月亮", "黄昏", "风", "记忆", "柔软", "光", "影子"] },
  { label: "Sharp", words: ["荒谬", "虚伪", "麻木", "偏见", "尖锐", "压迫", "失真"] },
  { label: "Narrative", words: ["那天", "后来", "故事", "人物", "经过", "场景", "发生"] },
  { label: "Minimal", words: ["只是", "不过", "已经", "仍然", "沉默", "安静", "平静"] },
];

const moodRules = [
  { label: "Warm", words: ["温暖", "明亮", "安心", "喜欢", "拥抱", "柔和", "希望"] },
  { label: "Melancholic", words: ["难过", "遗憾", "失去", "告别", "眼泪", "孤单", "悲伤"] },
  { label: "Steady", words: ["必须", "坚持", "相信", "决定", "承担", "勇敢", "力量"] },
  { label: "Calm", words: ["安静", "缓慢", "安稳", "呼吸", "清晨", "平和", "沉静"] },
  { label: "Tense", words: ["焦虑", "不安", "混乱", "追赶", "仓促", "疲惫", "压抑"] },
];

const today = new Date().toISOString().slice(0, 10);

const els = {
  tabs: [...document.querySelectorAll(".tab-btn")],
  workspaces: {
    quotes: document.querySelector("#quotesWorkspace"),
    writing: document.querySelector("#writingWorkspace"),
    reflection: document.querySelector("#reflectionWorkspace"),
    search: document.querySelector("#searchWorkspace"),
  },
  bookCount: document.querySelector("#bookCount"),
  quoteCount: document.querySelector("#quoteCount"),
  draftCount: document.querySelector("#draftCount"),
  newBookBtn: document.querySelector("#newBookBtn"),
  bookForm: document.querySelector("#bookForm"),
  bookNameInput: document.querySelector("#bookNameInput"),
  bookAuthorInput: document.querySelector("#bookAuthorInput"),
  bookStatusInput: document.querySelector("#bookStatusInput"),
  bookColorInput: document.querySelector("#bookColorInput"),
  bookList: document.querySelector("#bookList"),
  quoteTopicList: document.querySelector("#quoteTopicList"),
  quoteTopicCount: document.querySelector("#quoteTopicCount"),
  currentBookTitle: document.querySelector("#currentBookTitle"),
  currentBookMeta: document.querySelector("#currentBookMeta"),
  editBookBtn: document.querySelector("#editBookBtn"),
  deleteBookBtn: document.querySelector("#deleteBookBtn"),
  editBookForm: document.querySelector("#editBookForm"),
  editBookNameInput: document.querySelector("#editBookNameInput"),
  editBookAuthorInput: document.querySelector("#editBookAuthorInput"),
  editBookStatusInput: document.querySelector("#editBookStatusInput"),
  editBookColorInput: document.querySelector("#editBookColorInput"),
  cancelEditBookBtn: document.querySelector("#cancelEditBookBtn"),
  quoteForm: document.querySelector("#quoteForm"),
  quoteDate: document.querySelector("#quoteDate"),
  quoteText: document.querySelector("#quoteText"),
  quoteFormHint: document.querySelector("#quoteFormHint"),
  quoteSearchInput: document.querySelector("#quoteSearchInput"),
  quoteSortMode: document.querySelector("#quoteSortMode"),
  quoteCards: document.querySelector("#quoteCards"),
  draftTopicList: document.querySelector("#draftTopicList"),
  draftTopicCount: document.querySelector("#draftTopicCount"),
  draftSearchInput: document.querySelector("#draftSearchInput"),
  draftSortMode: document.querySelector("#draftSortMode"),
  draftTitle: document.querySelector("#draftTitle"),
  draftBookSelect: document.querySelector("#draftBookSelect"),
  draftText: document.querySelector("#draftText"),
  saveDraftBtn: document.querySelector("#saveDraftBtn"),
  draftHint: document.querySelector("#draftHint"),
  matchScore: document.querySelector("#matchScore"),
  matchAdvice: document.querySelector("#matchAdvice"),
  matchResult: document.querySelector("#matchResult"),
  draftFilterCount: document.querySelector("#draftFilterCount"),
  draftCards: document.querySelector("#draftCards"),
  reflectionTopicHistory: document.querySelector("#reflectionTopicHistory"),
  reflectionTopicHistoryCount: document.querySelector("#reflectionTopicHistoryCount"),
  aiConnectionStatus: document.querySelector("#aiConnectionStatus"),
  reflectionTopic: document.querySelector("#reflectionTopic"),
  startReflectionBtn: document.querySelector("#startReflectionBtn"),
  finishReflectionBtn: document.querySelector("#finishReflectionBtn"),
  reflectionChat: document.querySelector("#reflectionChat"),
  styleProfile: document.querySelector("#styleProfile"),
  reflectionStatus: document.querySelector("#reflectionStatus"),
  reflectionReply: document.querySelector("#reflectionReply"),
  sendReflectionBtn: document.querySelector("#sendReflectionBtn"),
  globalSearchInput: document.querySelector("#globalSearchInput"),
  globalTypeFilter: document.querySelector("#globalTypeFilter"),
  globalSortMode: document.querySelector("#globalSortMode"),
  globalSearchStats: document.querySelector("#globalSearchStats"),
  globalResults: document.querySelector("#globalResults"),
  exportBackupBtn: document.querySelector("#exportBackupBtn"),
  importBackupBtn: document.querySelector("#importBackupBtn"),
  importBackupInput: document.querySelector("#importBackupInput"),
  desktopStatusPill: document.querySelector("#desktopStatusPill"),
  welcomePanel: document.querySelector("#welcomePanel"),
  dismissWelcomeBtn: document.querySelector("#dismissWelcomeBtn"),
};

let state = loadState();
let aiReady = false;
let aiBusy = false;
let streamingAssistantIndex = -1;
let saveTimer = null;
let lastDesktopSave = null;
let desktopStorageInfo = null;
let uiPreferences = loadUiPreferences();

els.quoteDate.value = today;

bootstrap();

async function bootstrap() {
  bindEvents();
  activateTab(state.ui.activeTab);
  await hydrateDesktopState();
  await loadDesktopStorageInfo();
  renderAll();
  updateLiveMatch();
  renderStyleProfile();
  checkAiStatus();
  renderDesktopStatus();
  renderWelcomePanel();
}

function bindEvents() {
  els.tabs.forEach((button) => {
    button.addEventListener("click", () => activateTab(button.dataset.tab));
  });

  els.newBookBtn.addEventListener("click", () => {
    els.bookForm.classList.toggle("hidden");
  });

  els.bookForm.addEventListener("submit", (event) => {
    event.preventDefault();
    createBook();
  });
  els.editBookBtn.addEventListener("click", openEditBookForm);
  els.deleteBookBtn.addEventListener("click", deleteCurrentBook);
  els.editBookForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveBookEdits();
  });
  els.cancelEditBookBtn.addEventListener("click", () => {
    els.editBookForm.classList.add("hidden");
  });

  els.quoteForm.addEventListener("submit", (event) => {
    event.preventDefault();
    createQuote();
  });

  els.quoteSearchInput.addEventListener("input", renderQuoteArea);
  els.quoteSortMode.addEventListener("change", renderQuoteArea);

  els.draftSearchInput.addEventListener("input", renderWritingArea);
  els.draftSortMode.addEventListener("change", renderWritingArea);
  els.draftText.addEventListener("input", updateLiveMatch);
  els.saveDraftBtn.addEventListener("click", saveDraft);
  els.globalSearchInput.addEventListener("input", renderSearchArea);
  els.globalTypeFilter.addEventListener("change", renderSearchArea);
  els.globalSortMode.addEventListener("change", renderSearchArea);
  els.exportBackupBtn.addEventListener("click", exportBackup);
  els.importBackupBtn.addEventListener("click", () => {
    els.importBackupInput.click();
  });
  els.importBackupInput.addEventListener("change", importBackup);
  els.dismissWelcomeBtn.addEventListener("click", dismissWelcomePanel);

  els.startReflectionBtn.addEventListener("click", startReflection);
  els.sendReflectionBtn.addEventListener("click", sendReflectionReply);
  els.finishReflectionBtn.addEventListener("click", finishReflection);
  els.reflectionReply.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      sendReflectionReply();
    }
  });
}

function loadState() {
  const current = localStorage.getItem(STORAGE_KEY);
  if (current) {
    try {
      return normalizeState(JSON.parse(current));
    } catch {
      return normalizeState(seedState());
    }
  }

  for (const key of LEGACY_STORAGE_KEYS) {
    const raw = localStorage.getItem(key);
    if (!raw) {
      continue;
    }
    try {
      return migrateLegacyState(JSON.parse(raw));
    } catch {
      return normalizeState(seedState());
    }
  }

  return normalizeState(seedState());
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  queueDesktopSave();
  renderDesktopStatus();
}

function loadUiPreferences() {
  try {
    const raw = localStorage.getItem(UI_PREFERENCES_KEY);
    if (!raw) {
      return { welcomeDismissed: false };
    }
    const parsed = JSON.parse(raw);
    return { welcomeDismissed: Boolean(parsed.welcomeDismissed) };
  } catch {
    return { welcomeDismissed: false };
  }
}

function saveUiPreferences() {
  localStorage.setItem(UI_PREFERENCES_KEY, JSON.stringify(uiPreferences));
}

function buildBackupPayload() {
  return {
    app: "InkShelf",
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    state,
  };
}

function buildBackupFilename() {
  const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  return `inkshelf-backup-${stamp}.json`;
}

function exportBackup() {
  const payload = JSON.stringify(buildBackupPayload(), null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = buildBackupFilename();
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  window.alert("Backup exported. Keep the JSON file somewhere safe.");
}

async function importBackup(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const nextState = parsed?.state ? normalizeState(parsed.state) : normalizeState(parsed);
    state = nextState;
    saveState();
    renderAll();
    updateLiveMatch();
    renderStyleProfile();
    window.alert("Backup imported successfully.");
  } catch {
    window.alert("This backup file could not be imported.");
  } finally {
    els.importBackupInput.value = "";
  }
}

async function hydrateDesktopState() {
  if (!window.inkShelfDesktop?.isDesktop || typeof window.inkShelfDesktop.loadData !== "function") {
    return;
  }

  try {
    const raw = await window.inkShelfDesktop.loadData();
    if (!raw) {
      await saveDesktopStateNow();
      return;
    }

    const parsed = JSON.parse(raw);
    state = normalizeState(parsed);
  } catch {
    // Fall back to localStorage state if desktop hydration fails.
  }
}

async function loadDesktopStorageInfo() {
  if (!window.inkShelfDesktop?.isDesktop || typeof window.inkShelfDesktop.getStorageInfo !== "function") {
    return;
  }

  try {
    desktopStorageInfo = await window.inkShelfDesktop.getStorageInfo();
  } catch {
    desktopStorageInfo = null;
  }
}

function queueDesktopSave() {
  if (!window.inkShelfDesktop?.isDesktop || typeof window.inkShelfDesktop.saveData !== "function") {
    return;
  }

  if (saveTimer) {
    window.clearTimeout(saveTimer);
  }

  saveTimer = window.setTimeout(() => {
    saveDesktopStateNow();
  }, 250);
}

async function saveDesktopStateNow() {
  if (!window.inkShelfDesktop?.isDesktop || typeof window.inkShelfDesktop.saveData !== "function") {
    return;
  }

  try {
    const result = await window.inkShelfDesktop.saveData(JSON.stringify(state));
    lastDesktopSave = result?.savedAt || null;
    desktopStorageInfo = result || desktopStorageInfo;
    renderDesktopStatus();
  } catch {
    // Keep localStorage copy even if desktop file save fails.
  }
}

function renderDesktopStatus() {
  if (!els.desktopStatusPill) {
    return;
  }

  if (!window.inkShelfDesktop?.isDesktop) {
    els.desktopStatusPill.textContent = "Browser-only mode";
    return;
  }

  const saveText = lastDesktopSave ? `Saved ${formatTimestamp(lastDesktopSave)}` : "Desktop storage active";
  const locationText = desktopStorageInfo?.dataFile ? ` · ${shortenPath(desktopStorageInfo.dataFile)}` : "";
  els.desktopStatusPill.textContent = `${saveText}${locationText}`;
}

function renderWelcomePanel() {
  if (!els.welcomePanel) {
    return;
  }
  els.welcomePanel.classList.toggle("hidden", uiPreferences.welcomeDismissed);
}

function dismissWelcomePanel() {
  uiPreferences.welcomeDismissed = true;
  saveUiPreferences();
  renderWelcomePanel();
}

function seedState() {
  const sampleBookId = crypto.randomUUID();
  const sampleQuote = {
    id: crypto.randomUUID(),
    bookId: sampleBookId,
    date: today,
    text: "The best sentences are not the most complex ones, but the ones that reveal a real feeling in the quietest place.",
    theme: "Literary Craft",
    style: "Lyrical",
    mood: "Calm",
    createdAt: new Date().toISOString(),
  };

  return {
    books: [
      {
        id: sampleBookId,
        title: "Sample Book",
        author: "Sample Author",
        status: "Reading",
        color: "sun",
        createdAt: new Date().toISOString(),
        quotes: [sampleQuote],
      },
    ],
    drafts: [
      {
        id: crypto.randomUUID(),
        title: "Sample Draft",
        date: today,
        text: "I want to write with more precision, not just with louder words.",
        theme: "Self-Development",
        style: "Minimal",
        mood: "Steady",
        createdAt: new Date().toISOString(),
        bookId: sampleBookId,
      },
    ],
    reflections: [],
    ui: {
      activeTab: "quotes",
      selectedBookId: sampleBookId,
    },
    reflectionSession: emptyReflectionSession(),
  };
}

function migrateLegacyState(legacy) {
  if (Array.isArray(legacy.books)) {
    return normalizeState(legacy);
  }

  const bookMap = new Map();
  const legacyQuotes = Array.isArray(legacy.quotes) ? legacy.quotes : [];
  legacyQuotes.forEach((quote) => {
    const title = quote.book || "Untitled Book";
    const author = quote.author || "Unknown Author";
    const key = `${title}__${author}`;
    if (!bookMap.has(key)) {
      bookMap.set(key, {
        id: crypto.randomUUID(),
        title,
        author,
        status: "Reading",
        color: "sun",
        createdAt: quote.createdAt || new Date().toISOString(),
        quotes: [],
      });
    }

    bookMap.get(key).quotes.push({
      id: quote.id || crypto.randomUUID(),
      bookId: "",
      date: quote.date || today,
      text: quote.text || "",
      theme: quote.theme || analyzeText(quote.text || "").theme,
      style: quote.style || analyzeText(quote.text || "").style,
      mood: quote.mood || analyzeText(quote.text || "").mood,
      createdAt: quote.createdAt || new Date().toISOString(),
    });
  });

  const books = [...bookMap.values()].map((book) => {
    book.quotes = book.quotes.map((quote) => ({ ...quote, bookId: book.id }));
    return book;
  });

  const fallbackBookId = books[0]?.id || crypto.randomUUID();

  return normalizeState({
    books: books.length
      ? books
      : [
          {
            id: fallbackBookId,
            title: "Untitled Book",
            author: "Unknown Author",
            createdAt: new Date().toISOString(),
            quotes: [],
          },
        ],
    drafts: Array.isArray(legacy.drafts)
      ? legacy.drafts.map((draft) => ({
          id: draft.id || crypto.randomUUID(),
          title: draft.title || "Untitled Draft",
          date: draft.date || today,
          text: draft.text || "",
          theme: draft.theme || analyzeText(draft.text || "").theme,
          style: draft.style || analyzeText(draft.text || "").style,
          mood: draft.mood || analyzeText(draft.text || "").mood,
          source: draft.source,
          bookId: draft.bookId || fallbackBookId,
          createdAt: draft.createdAt || new Date().toISOString(),
        }))
      : [],
    reflections: [],
    ui: {
      activeTab: "quotes",
      selectedBookId: fallbackBookId,
    },
    reflectionSession: emptyReflectionSession(),
  });
}

function normalizeState(input) {
  const books = Array.isArray(input.books) ? input.books : [];
  const normalizedBooks = books.map((book) => ({
    id: book.id || crypto.randomUUID(),
    title: book.title || "Untitled Book",
    author: book.author || "Unknown Author",
    status: normalizeBookStatus(book.status),
    color: book.color || "sun",
    createdAt: book.createdAt || new Date().toISOString(),
    quotes: Array.isArray(book.quotes)
      ? book.quotes.map((quote) => ({
          id: quote.id || crypto.randomUUID(),
          bookId: quote.bookId || book.id,
          date: quote.date || today,
          text: quote.text || "",
          theme: quote.theme || analyzeText(quote.text || "").theme,
          style: quote.style || analyzeText(quote.text || "").style,
          mood: quote.mood || analyzeText(quote.text || "").mood,
          createdAt: quote.createdAt || new Date().toISOString(),
        }))
      : [],
  }));

  const selectedBookId = input.ui?.selectedBookId || normalizedBooks[0]?.id || null;

  return {
    books: normalizedBooks,
    drafts: Array.isArray(input.drafts)
      ? input.drafts.map((draft) => ({
          id: draft.id || crypto.randomUUID(),
          title: draft.title || "Untitled Draft",
          date: draft.date || today,
          text: draft.text || "",
          theme: draft.theme || analyzeText(draft.text || "").theme,
          style: draft.style || analyzeText(draft.text || "").style,
          mood: draft.mood || analyzeText(draft.text || "").mood,
          source: draft.source || "manual",
          bookId: draft.bookId || selectedBookId,
          createdAt: draft.createdAt || new Date().toISOString(),
        }))
      : [],
    reflections: Array.isArray(input.reflections)
      ? input.reflections.map((item) => ({
          id: item.id || crypto.randomUUID(),
          topic: item.topic || "Untitled Reflection",
          createdAt: item.createdAt || new Date().toISOString(),
          summaryDraftId: item.summaryDraftId || null,
          transcript: Array.isArray(item.transcript) ? item.transcript : [],
        }))
      : [],
    ui: {
      activeTab: ["quotes", "writing", "reflection", "search"].includes(input.ui?.activeTab)
        ? input.ui.activeTab
        : "quotes",
      selectedBookId,
    },
    reflectionSession: normalizeReflectionSession(input.reflectionSession),
  };
}

function emptyReflectionSession() {
  return {
    topic: "",
    messages: [],
    previousResponseId: null,
    selectedHistoryId: null,
  };
}

function normalizeReflectionSession(session) {
  return {
    topic: session?.topic || "",
    messages: Array.isArray(session?.messages) ? session.messages : [],
    previousResponseId: session?.previousResponseId || null,
    selectedHistoryId: session?.selectedHistoryId || null,
  };
}

function activateTab(tabName) {
  state.ui.activeTab = tabName;
  els.tabs.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabName);
  });
  Object.entries(els.workspaces).forEach(([key, node]) => {
    node.classList.toggle("active", key === tabName);
  });
  saveState();
}

function renderAll() {
  saveState();
  renderTopStats();
  renderQuoteArea();
  renderWritingArea();
  renderReflectionArea();
  renderSearchArea();
}

function renderTopStats() {
  els.bookCount.textContent = String(state.books.length);
  els.quoteCount.textContent = String(getAllQuotes().length);
  els.draftCount.textContent = String(state.drafts.length);
}

function renderQuoteArea() {
  renderBookList();
  renderCurrentBook();
  renderQuoteSidebar();
  renderQuoteCards();
  renderDraftBookOptions();
}

function renderBookList() {
  if (!state.books.length) {
    els.bookList.innerHTML = `<div class="empty-state">No book folders yet.</div>`;
    return;
  }

  els.bookList.innerHTML = state.books
    .map((book) => {
      const active = book.id === state.ui.selectedBookId;
      return `
        <button class="sidebar-item ${active ? "active" : ""}" type="button" data-book-id="${book.id}">
          <span class="book-chip ${escapeHtml(book.color || "sun")}"></span>
          <strong>${escapeHtml(book.title)}</strong>
          <p>${escapeHtml(book.author)} · ${escapeHtml(book.status)} · ${book.quotes.length} excerpts</p>
        </button>
      `;
    })
    .join("");

  [...els.bookList.querySelectorAll("[data-book-id]")].forEach((button) => {
    button.addEventListener("click", () => {
      state.ui.selectedBookId = button.dataset.bookId;
      renderAll();
    });
  });
}

function renderCurrentBook() {
  const book = getSelectedBook();
  if (!book) {
    els.currentBookTitle.textContent = "No book selected yet";
    els.currentBookMeta.textContent = "Create a book once, then keep saving excerpts without repeating the title and author.";
    return;
  }

  els.currentBookTitle.textContent = book.title;
  els.currentBookMeta.textContent = `${book.author} · ${book.status} · ${book.quotes.length} excerpts in this folder. InkShelf will remember this as your last active book.`;
  els.editBookNameInput.value = book.title;
  els.editBookAuthorInput.value = book.author;
  els.editBookStatusInput.value = book.status;
  els.editBookColorInput.value = book.color || "sun";
}

function renderQuoteSidebar() {
  const quotes = getFilteredQuotes();
  els.quoteTopicCount.textContent = `${quotes.length} items`;
  els.quoteTopicList.innerHTML = quotes.length
    ? quotes
        .map(
          (quote) => `
            <button class="sidebar-item" type="button" data-quote-jump="${quote.id}">
              <strong>${escapeHtml(makeTopic(quote.text))}</strong>
              <p>${escapeHtml(quote.theme)} · ${escapeHtml(quote.style)}</p>
            </button>
          `
        )
        .join("")
    : `<div class="empty-state">No excerpts to show for this book.</div>`;

  [...els.quoteTopicList.querySelectorAll("[data-quote-jump]")].forEach((button) => {
    button.addEventListener("click", () => jumpToCard(`quote-card-${button.dataset.quoteJump}`));
  });
}

function renderQuoteCards() {
  const quotes = getFilteredQuotes();
  els.quoteCards.innerHTML = quotes.length
    ? quotes.map((quote) => renderQuoteCard(quote, getBookById(quote.bookId))).join("")
    : `<div class="empty-state">No matching excerpts found.</div>`;
  bindCardActions();
}

function renderWritingArea() {
  renderDraftSidebar();
  renderDraftCards();
}

function renderDraftSidebar() {
  const drafts = getFilteredDrafts();
  els.draftTopicCount.textContent = `${drafts.length} drafts`;
  els.draftTopicList.innerHTML = drafts.length
    ? drafts
        .map(
          (draft) => `
            <button class="sidebar-item" type="button" data-draft-jump="${draft.id}">
              <strong>${escapeHtml(draft.title)}</strong>
              <p>${escapeHtml(makeTopic(draft.text))}</p>
            </button>
          `
        )
        .join("")
    : `<div class="empty-state">No drafts yet.</div>`;

  [...els.draftTopicList.querySelectorAll("[data-draft-jump]")].forEach((button) => {
    button.addEventListener("click", () => jumpToCard(`draft-card-${button.dataset.draftJump}`));
  });
}

function renderDraftCards() {
  const drafts = getFilteredDrafts();
  els.draftFilterCount.textContent = `${drafts.length} drafts`;
  els.draftCards.innerHTML = drafts.length
    ? drafts.map(renderDraftCard).join("")
    : `<div class="empty-state">No matching drafts found.</div>`;
  bindCardActions();
}

function renderReflectionArea() {
  renderReflectionHistory();
  renderReflectionChat();
}

function renderSearchArea() {
  const query = els.globalSearchInput.value.trim().toLowerCase();
  const type = els.globalTypeFilter.value;
  const sortMode = els.globalSortMode.value;
  const quoteResults = getAllQuotes()
    .filter((item) => matchesQuery(item, query))
    .map((item) => ({ kind: "quote", item }));
  const draftResults = state.drafts
    .filter((item) => matchesQuery(item, query))
    .map((item) => ({ kind: "draft", item }));
  let results = [...quoteResults, ...draftResults];

  if (type !== "all") {
    results = results.filter((result) => result.kind === type);
  }

  results.sort((left, right) => compareEntries(left.item, right.item, sortMode));
  els.globalSearchStats.textContent = results.length ? `${results.length} results found.` : "No matching content found.";
  els.globalResults.innerHTML = results.length
    ? results
        .map((result) =>
          result.kind === "quote"
            ? renderQuoteCard(result.item, getBookById(result.item.bookId))
            : renderDraftCard(result.item)
        )
        .join("")
    : `<div class="empty-state">No matching content found.</div>`;
  bindCardActions();
}

function renderReflectionHistory() {
  els.reflectionTopicHistoryCount.textContent = `${state.reflections.length} threads`;
  els.reflectionTopicHistory.innerHTML = state.reflections.length
    ? state.reflections
        .map((item) => {
          const active = item.id === state.reflectionSession.selectedHistoryId;
          return `
            <button class="sidebar-item ${active ? "active" : ""}" type="button" data-reflection-id="${item.id}">
              <strong>${escapeHtml(item.topic)}</strong>
              <p>${formatDate(item.createdAt.slice(0, 10))}</p>
            </button>
          `;
        })
        .join("")
    : `<div class="empty-state">No completed reflection threads yet.</div>`;

  [...els.reflectionTopicHistory.querySelectorAll("[data-reflection-id]")].forEach((button) => {
    button.addEventListener("click", () => {
      const record = state.reflections.find((item) => item.id === button.dataset.reflectionId);
      if (!record) {
        return;
      }
      state.reflectionSession.selectedHistoryId = record.id;
      state.reflectionSession.topic = record.topic;
      state.reflectionSession.messages = record.transcript;
      state.reflectionSession.previousResponseId = null;
      els.reflectionTopic.value = record.topic;
      renderReflectionChat();
      saveState();
    });
  });
}

function renderReflectionChat() {
  els.reflectionTopic.value = state.reflectionSession.topic || "";
  if (!state.reflectionSession.messages.length) {
    els.reflectionChat.innerHTML = `<div class="empty-state">No dialogue yet.</div>`;
    return;
  }

  els.reflectionChat.innerHTML = state.reflectionSession.messages
    .map(
      (message) => `
        <article class="chat-bubble ${message.role}">
          <span class="chat-role">${message.role === "ai" ? "Reflection Coach" : "You"}</span>
          <div>${escapeHtml(message.text)}</div>
        </article>
      `
    )
    .join("");

  els.reflectionChat.scrollTop = els.reflectionChat.scrollHeight;
}

function renderDraftBookOptions() {
  const options = [
    `<option value="">No linked book</option>`,
    ...state.books.map(
      (book) => `
        <option value="${book.id}" ${book.id === state.ui.selectedBookId ? "selected" : ""}>
          ${escapeHtml(book.title)} · ${escapeHtml(book.author)}
        </option>
      `
    ),
  ];
  els.draftBookSelect.innerHTML = options.join("");
}

function createBook() {
  const title = els.bookNameInput.value.trim();
  const author = els.bookAuthorInput.value.trim();
  const status = els.bookStatusInput.value;
  if (!title || !author) {
    return;
  }

  const book = {
    id: crypto.randomUUID(),
    title,
    author,
    status,
    color: els.bookColorInput.value,
    createdAt: new Date().toISOString(),
    quotes: [],
  };

  state.books.unshift(book);
  state.ui.selectedBookId = book.id;
  els.bookNameInput.value = "";
  els.bookAuthorInput.value = "";
  els.bookStatusInput.value = "Reading";
  els.bookColorInput.value = "sun";
  els.bookForm.classList.add("hidden");
  renderAll();
}

function openEditBookForm() {
  const book = getSelectedBook();
  if (!book) {
    return;
  }
  els.editBookNameInput.value = book.title;
  els.editBookAuthorInput.value = book.author;
  els.editBookStatusInput.value = book.status;
  els.editBookColorInput.value = book.color || "sun";
  els.editBookForm.classList.toggle("hidden");
}

function saveBookEdits() {
  const book = getSelectedBook();
  if (!book) {
    return;
  }
  const title = els.editBookNameInput.value.trim();
  const author = els.editBookAuthorInput.value.trim();
  if (!title || !author) {
    return;
  }
  book.title = title;
  book.author = author;
  book.status = els.editBookStatusInput.value;
  book.color = els.editBookColorInput.value;
  els.editBookForm.classList.add("hidden");
  renderAll();
}

function deleteCurrentBook() {
  const book = getSelectedBook();
  if (!book) {
    return;
  }
  const confirmed = window.confirm(`Delete "${book.title}"? Its excerpts will be removed, and any linked draft references will be detached.`);
  if (!confirmed) {
    return;
  }
  state.books = state.books.filter((item) => item.id !== book.id);
  state.drafts = state.drafts.map((draft) => ({
    ...draft,
    bookId: draft.bookId === book.id ? null : draft.bookId,
  }));
  state.ui.selectedBookId = state.books[0]?.id || null;
  els.editBookForm.classList.add("hidden");
  renderAll();
}

function createQuote() {
  const book = getSelectedBook();
  if (!book) {
    els.quoteFormHint.textContent = "Create or select a book first, then save excerpts into it.";
    return;
  }

  const text = els.quoteText.value.trim();
  if (!text) {
    return;
  }

  const quote = {
    id: crypto.randomUUID(),
    bookId: book.id,
    date: els.quoteDate.value || today,
    text,
    ...analyzeText(text),
    createdAt: new Date().toISOString(),
  };

  book.quotes.unshift(quote);
  els.quoteText.value = "";
  els.quoteDate.value = today;
  els.quoteFormHint.textContent = `Saved to "${book.title}".`;
  renderAll();
  renderStyleProfile();
}

function saveDraft() {
  const text = els.draftText.value.trim();
  if (!text) {
    els.draftHint.textContent = "Write a little more before saving.";
    return;
  }

  const title = els.draftTitle.value.trim() || `Draft ${state.drafts.length + 1}`;
  const draft = {
    id: crypto.randomUUID(),
    title,
    date: today,
    text,
    ...analyzeText(text),
    bookId: els.draftBookSelect.value || null,
    createdAt: new Date().toISOString(),
    source: "manual",
  };

  state.drafts.unshift(draft);
  els.draftTitle.value = "";
  els.draftText.value = "";
  els.draftHint.textContent = "Saved. You can keep writing the next piece.";
  renderAll();
  updateLiveMatch();
  renderStyleProfile();
}

function getFilteredQuotes() {
  const query = els.quoteSearchInput.value.trim().toLowerCase();
  const sortMode = els.quoteSortMode.value;
  const currentBookId = state.ui.selectedBookId;
  const base = currentBookId
    ? getSelectedBook()?.quotes || []
    : [];
  return sortEntries(base.filter((item) => matchesQuery(item, query)), sortMode);
}

function getFilteredDrafts() {
  const query = els.draftSearchInput.value.trim().toLowerCase();
  const sortMode = els.draftSortMode.value;
  return sortEntries(state.drafts.filter((item) => matchesQuery(item, query)), sortMode);
}

function sortEntries(items, sortMode) {
  const copy = [...items];
  copy.sort((a, b) => compareEntries(a, b, sortMode));
  return copy;
}

function compareEntries(a, b, sortMode) {
  if (sortMode === "date-asc") {
    return a.date.localeCompare(b.date);
  }
  if (sortMode === "date-desc") {
    return b.date.localeCompare(a.date);
  }
  if (sortMode === "theme") {
    return a.theme.localeCompare(b.theme);
  }
  if (sortMode === "style") {
    return a.style.localeCompare(b.style);
  }
  if (sortMode === "mood") {
    return a.mood.localeCompare(b.mood);
  }
  return 0;
}

function matchesQuery(item, query) {
  if (!query) {
    return true;
  }
  const book = item.bookId ? getBookById(item.bookId) : null;
  const haystack = [
    item.title,
    item.text,
    item.theme,
    item.style,
    item.mood,
    item.date,
    book?.title,
    book?.author,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function updateLiveMatch() {
  const text = els.draftText.value.trim();
  const allQuotes = getAllQuotes();
  if (!text || !allQuotes.length) {
    els.matchScore.textContent = "Similarity 0%";
    els.matchAdvice.textContent = "Write a little more and the app will begin comparing structure and tone.";
    els.matchResult.textContent = "No reference excerpt yet";
    els.matchResult.classList.add("empty");
    return;
  }

  const matches = allQuotes
    .map((quote) => ({ quote, score: getSimilarity(text, quote.text) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const best = matches[0];
  els.matchScore.textContent = `Similarity ${Math.round(best.score * 100)}%`;
  els.matchAdvice.textContent = buildAdvice(best.score, best.quote);
  els.matchResult.classList.remove("empty");
  els.matchResult.innerHTML = matches
    .map(({ quote, score }) => {
      const book = getBookById(quote.bookId);
      return `
        <article>
          <strong>${Math.round(score * 100)}% · ${escapeHtml(book?.title || "No linked book")}</strong><br />
          <span class="card-meta">${escapeHtml(quote.theme)} ｜ ${escapeHtml(quote.style)} ｜ ${escapeHtml(quote.mood)}</span>
          <p>${escapeHtml(quote.text)}</p>
        </article>
      `;
    })
    .join("<hr />");
}

async function checkAiStatus() {
  try {
    const response = await fetch("/api/status");
    const data = await response.json();
    aiReady = Boolean(data.ok);
    els.aiConnectionStatus.textContent = aiReady
      ? `AI is connected. The local service is using ${data.model || "gpt-5"}.`
      : "The local service is running, but no OPENAI_API_KEY was detected.";
  } catch {
    aiReady = false;
    els.aiConnectionStatus.textContent = "The local AI service is not connected yet. Start it with node server.js.";
  }
}

async function startReflection() {
  const topic = els.reflectionTopic.value.trim();
  if (!topic) {
    els.reflectionStatus.textContent = "Enter a topic first so the AI can begin the conversation.";
    return;
  }

  state.reflectionSession = {
    topic,
    messages: [],
    previousResponseId: null,
    selectedHistoryId: null,
  };

  renderReflectionChat();

  if (!aiReady) {
    const opening = `Let's not define it too quickly. When you think about "${topic}", what arrives first: an image, a memory, or a sentence you still can't put down?`;
    pushReflectionMessage("ai", opening);
    els.reflectionStatus.textContent = "Real AI is not connected right now, so the app is continuing in offline questioning mode.";
    return;
  }

  await askAi({
    mode: "start",
    topic,
    userText: "",
  });
}

async function sendReflectionReply() {
  const reply = els.reflectionReply.value.trim();
  if (!reply) {
    els.reflectionStatus.textContent = "Write a little of what you think first, then continue.";
    return;
  }

  if (!state.reflectionSession.topic) {
    els.reflectionStatus.textContent = "Start a topic first, then send your reply.";
    return;
  }

  pushReflectionMessage("user", reply);
  els.reflectionReply.value = "";

  if (!aiReady) {
    const follow = buildOfflineFollowUp(state.reflectionSession.topic, state.reflectionSession.messages);
    pushReflectionMessage("ai", follow);
    els.reflectionStatus.textContent = "You are in offline questioning mode. Start the local AI service to enable full multi-turn dialogue.";
    return;
  }

  await askAi({
    mode: "continue",
    topic: state.reflectionSession.topic,
    userText: reply,
  });
}

async function finishReflection() {
  const topic = state.reflectionSession.topic;
  const transcript = state.reflectionSession.messages;
  const userMessages = transcript.filter((item) => item.role === "user");

  if (!topic || !userMessages.length) {
    els.reflectionStatus.textContent = "Share at least a little of your thinking first so the generated piece can sound more like you.";
    return;
  }

  let article = "";
  if (aiReady) {
    article = await summarizeWithAi(topic, transcript);
  }

  if (!article) {
    article = buildOfflineArticle(topic, userMessages.map((item) => item.text));
  }

  const draft = {
    id: crypto.randomUUID(),
    title: `Reflection Piece: ${topic}`,
    date: today,
    text: article,
    ...analyzeText(article),
    bookId: state.ui.selectedBookId,
    createdAt: new Date().toISOString(),
    source: "reflection",
  };

  state.drafts.unshift(draft);
  const historyItem = {
    id: crypto.randomUUID(),
    topic,
    createdAt: new Date().toISOString(),
    summaryDraftId: draft.id,
    transcript: [...transcript],
  };
  state.reflections.unshift(historyItem);
  state.reflectionSession.selectedHistoryId = historyItem.id;
  pushReflectionMessage("ai", "I've shaped the conversation into a short piece and saved it to your drafts.");
  els.reflectionStatus.textContent = "The reflection piece has been generated and saved to your draft library.";
  renderAll();
  renderStyleProfile();
}

async function askAi({ mode, topic, userText }) {
  if (aiBusy) {
    return;
  }

  aiBusy = true;
  streamingAssistantIndex = -1;
  els.reflectionStatus.textContent = "The AI is shaping the next question.";

  try {
    const styleProfile = getStyleProfile();
    const styleSamples = getStyleSamples();
    const response = await fetch("/api/reflection/chat-stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        topic,
        userText,
        previousResponseId: state.reflectionSession.previousResponseId,
        transcript: state.reflectionSession.messages,
        styleProfile,
        styleSamples,
      }),
    });

    if (!response.ok) {
      throw new Error("chat_failed");
    }

    startStreamingAssistantMessage();
    await consumeChatStream(response);
    els.reflectionStatus.textContent = "The AI has responded. Keep following the thought.";
  } catch {
    if (streamingAssistantIndex >= 0 && !state.reflectionSession.messages[streamingAssistantIndex].text.trim()) {
      state.reflectionSession.messages.pop();
      streamingAssistantIndex = -1;
    }
    const offlineReply = buildOfflineFollowUp(topic, state.reflectionSession.messages);
    pushReflectionMessage("ai", offlineReply);
    els.reflectionStatus.textContent = "The real AI request failed, so the app switched back to offline questioning mode.";
  } finally {
    aiBusy = false;
  }
}

async function summarizeWithAi(topic, transcript) {
  try {
    const response = await fetch("/api/reflection/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        transcript,
        styleProfile: getStyleProfile(),
        styleSamples: getStyleSamples(),
      }),
    });

    if (!response.ok) {
      throw new Error("summary_failed");
    }

    const data = await response.json();
    return data.article || "";
  } catch {
    return "";
  }
}

function pushReflectionMessage(role, text) {
  state.reflectionSession.messages.push({ role, text });
  renderReflectionChat();
  saveState();
}

function startStreamingAssistantMessage() {
  state.reflectionSession.messages.push({ role: "ai", text: "" });
  streamingAssistantIndex = state.reflectionSession.messages.length - 1;
  renderReflectionChat();
  saveState();
}

function appendStreamingAssistant(delta) {
  if (streamingAssistantIndex < 0) {
    startStreamingAssistantMessage();
  }
  state.reflectionSession.messages[streamingAssistantIndex].text += delta;
  renderReflectionChat();
  saveState();
}

async function consumeChatStream(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    lines.forEach((line) => {
      if (!line.trim()) {
        return;
      }
      const event = JSON.parse(line);
      if (event.type === "delta") {
        appendStreamingAssistant(event.delta || "");
      }
      if (event.type === "done") {
        state.reflectionSession.previousResponseId = event.responseId || null;
        if (!state.reflectionSession.messages[streamingAssistantIndex].text.trim()) {
          state.reflectionSession.messages[streamingAssistantIndex].text = "I'm here. Let's keep going.";
        }
      }
      if (event.type === "error") {
        throw new Error(event.message || "stream_error");
      }
    });
  }
  streamingAssistantIndex = -1;
}

function getStyleProfile() {
  const materials = [...getAllQuotes(), ...state.drafts];
  const styleCounter = countBy(materials.map((item) => item.style).filter(Boolean));
  const moodCounter = countBy(materials.map((item) => item.mood).filter(Boolean));
  const avgLength = materials.length
    ? Math.round(materials.reduce((sum, item) => sum + (item.text?.length || 0), 0) / materials.length)
    : 80;

  return {
    style: topLabel(styleCounter, "Minimal"),
    mood: topLabel(moodCounter, "Calm"),
    rhythm: avgLength > 110 ? "longer sentences, slower build" : "shorter sentences, tighter phrasing",
  };
}

function renderStyleProfile() {
  const profile = getStyleProfile();
  els.styleProfile.textContent = `Your current preference reads closest to ${profile.style} + ${profile.mood} + ${profile.rhythm}. The AI will lean in that direction when shaping new text.`;
}

function getStyleSamples() {
  const combined = [...state.drafts, ...getAllQuotes()]
    .slice(0, 8)
    .map((item) => item.text)
    .filter(Boolean);
  return combined;
}

function buildOfflineFollowUp(topic, messages) {
  const userMessages = messages.filter((item) => item.role === "user").map((item) => item.text);
  if (userMessages.length === 0) {
    return `Let's begin with the most immediate feeling. When you think about "${topic}", what are you instinctively moving toward?`;
  }
  if (userMessages.length === 1) {
    return `If "${topic}" were placed directly inside your own life, in what moment would it feel heaviest? What is hardest to describe about that moment?`;
  }
  if (userMessages.length === 2) {
    return `Of the feelings you just named, which ones are you willing to carry, and which ones are you still trying to escape?`;
  }
  return `If you had to write one private definition of "${topic}" right now, which words would you refuse to remove?`;
}

function buildOfflineArticle(topic, thoughts) {
  const profile = getStyleProfile();
  const joined = thoughts.slice(0, 4).join(" ");
  if (profile.style === "Lyrical") {
    return `"${topic}" feels like a stone resting quietly in the chest: never loud, yet slowly revealing its full weight in the stillest hours. ${joined} In the end, what feels heavy may not be the thing itself, but the willingness to face the feelings that cannot be gently moved aside.`;
  }
  if (profile.style === "Analytical") {
    return `Reconsidering "${topic}" makes it clear that it is not a concept that can be easily praised or dismissed. ${joined} Its weight comes not only from the thing itself, but from the way a person understands it, carries it, and gives it language.`;
  }
  return `The more I return to "${topic}", the less abstract it feels. ${joined} My understanding of it may still be unfinished, but that is exactly why it deserves to be revisited, tested, and reshaped through language again and again.`;
}

function analyzeText(text) {
  return {
    theme: pickBestLabel(text, themeRules, "Life Reflection"),
    style: pickBestLabel(text, styleRules, text.length > 90 ? "Narrative" : "Minimal"),
    mood: pickBestLabel(text, moodRules, "Calm"),
  };
}

function pickBestLabel(text, rules, fallback) {
  const normalized = text.toLowerCase();
  let winner = { label: fallback, score: 0 };
  rules.forEach((rule) => {
    const score = rule.words.reduce((sum, word) => sum + (normalized.includes(word) ? 1 : 0), 0);
    if (score > winner.score) {
      winner = { label: rule.label, score };
    }
  });
  return winner.label;
}

function getSimilarity(left, right) {
  const a = tokenize(left);
  const b = tokenize(right);
  if (!a.size || !b.size) {
    return 0;
  }
  let intersection = 0;
  a.forEach((piece) => {
    if (b.has(piece)) {
      intersection += 1;
    }
  });
  const union = new Set([...a, ...b]).size;
  const charBonus = sharedCharacters(left, right);
  return Math.min(1, (intersection / union) * 0.78 + charBonus * 0.22);
}

function tokenize(text) {
  const compact = text.replace(/\s+/g, "");
  const chunks = new Set();
  for (let index = 0; index < compact.length - 1; index += 1) {
    chunks.add(compact.slice(index, index + 2));
  }
  return chunks;
}

function sharedCharacters(left, right) {
  const leftSet = new Set(left.replace(/\s+/g, "").split(""));
  const rightSet = new Set(right.replace(/\s+/g, "").split(""));
  if (!leftSet.size || !rightSet.size) {
    return 0;
  }
  let hits = 0;
  leftSet.forEach((char) => {
    if (rightSet.has(char)) {
      hits += 1;
    }
  });
  return hits / new Set([...leftSet, ...rightSet]).size;
}

function buildAdvice(score, quote) {
  const book = getBookById(quote.bookId);
  if (score >= 0.65) {
    return `This passage is already close to the expression found in "${book?.title || "this book"}". Study its pacing, transitions, and the way it lands on specific words.`;
  }
  if (score >= 0.35) {
    return `You are moving toward this register of writing. Look closely at sentence shape, emotional progression, and what kind of detail gets emphasized.`;
  }
  return "The similarity is still low, which usually means your own voice is moving somewhere different. Use these excerpts as contrast and support, not as a template.";
}

function renderQuoteCard(quote, book) {
  return `
    <article class="card-item" id="quote-card-${quote.id}">
      <h4>${escapeHtml(makeTopic(quote.text))}</h4>
      <div class="card-meta">
        <span class="book-chip ${escapeHtml(book?.color || "sun")}"></span>
        <span>${escapeHtml(book?.title || "No linked book")}</span>
        <span>${escapeHtml(book?.author || "")}</span>
        <span>${escapeHtml(quote.date)}</span>
      </div>
      <div class="tag-row">
        <span class="pill-tag">Theme: ${escapeHtml(quote.theme)}</span>
        <span class="pill-tag">Style: ${escapeHtml(quote.style)}</span>
        <span class="pill-tag">Mood: ${escapeHtml(quote.mood)}</span>
      </div>
      <p>${escapeHtml(quote.text)}</p>
      <div class="card-actions">
        <button class="mini-btn" type="button" data-edit-quote="${quote.id}">Edit</button>
        <button class="mini-btn" type="button" data-delete-quote="${quote.id}">Delete</button>
      </div>
    </article>
  `;
}

function renderDraftCard(draft) {
  const book = draft.bookId ? getBookById(draft.bookId) : null;
  return `
    <article class="card-item" id="draft-card-${draft.id}">
      <h4>${escapeHtml(draft.title)}</h4>
      <div class="card-meta">
        <span>${escapeHtml(draft.date)}</span>
        <span class="book-chip ${escapeHtml(book?.color || "sun")}"></span>
        <span>${escapeHtml(book?.title || "No linked book")}</span>
        ${draft.source === "reflection" ? "<span>From reflection</span>" : ""}
      </div>
      <div class="tag-row">
        <span class="pill-tag">Theme: ${escapeHtml(draft.theme)}</span>
        <span class="pill-tag">Style: ${escapeHtml(draft.style)}</span>
        <span class="pill-tag">Mood: ${escapeHtml(draft.mood)}</span>
      </div>
      <p>${escapeHtml(draft.text)}</p>
      <div class="card-actions">
        <button class="mini-btn" type="button" data-edit-draft="${draft.id}">Edit</button>
        <button class="mini-btn" type="button" data-delete-draft="${draft.id}">Delete</button>
        <button class="mini-btn" type="button" data-rewrite-draft="${draft.id}">AI Rewrite</button>
      </div>
    </article>
  `;
}

function bindCardActions() {
  [...document.querySelectorAll("[data-edit-quote]")].forEach((button) => {
    button.onclick = () => editQuote(button.dataset.editQuote);
  });
  [...document.querySelectorAll("[data-delete-quote]")].forEach((button) => {
    button.onclick = () => deleteQuote(button.dataset.deleteQuote);
  });
  [...document.querySelectorAll("[data-edit-draft]")].forEach((button) => {
    button.onclick = () => editDraft(button.dataset.editDraft);
  });
  [...document.querySelectorAll("[data-delete-draft]")].forEach((button) => {
    button.onclick = () => deleteDraft(button.dataset.deleteDraft);
  });
  [...document.querySelectorAll("[data-rewrite-draft]")].forEach((button) => {
    button.onclick = () => rewriteDraft(button.dataset.rewriteDraft);
    button.disabled = !aiReady;
  });
}

function editQuote(id) {
  const book = state.books.find((item) => item.quotes.some((quote) => quote.id === id));
  const quote = book?.quotes.find((item) => item.id === id);
  if (!quote) {
    return;
  }
  const next = window.prompt("Edit this excerpt:", quote.text);
  if (next === null) {
    return;
  }
  const text = next.trim();
  if (!text) {
    return;
  }
  Object.assign(quote, { text, ...analyzeText(text) });
  renderAll();
}

function deleteQuote(id) {
  const book = state.books.find((item) => item.quotes.some((quote) => quote.id === id));
  if (!book) {
    return;
  }
  book.quotes = book.quotes.filter((item) => item.id !== id);
  renderAll();
}

function editDraft(id) {
  const draft = state.drafts.find((item) => item.id === id);
  if (!draft) {
    return;
  }
  const title = window.prompt("Edit title:", draft.title);
  if (title === null) {
    return;
  }
  const text = window.prompt("Edit body text:", draft.text);
  if (text === null) {
    return;
  }
  draft.title = title.trim() || draft.title;
  draft.text = text.trim() || draft.text;
  Object.assign(draft, analyzeText(draft.text));
  renderAll();
}

function deleteDraft(id) {
  state.drafts = state.drafts.filter((item) => item.id !== id);
  renderAll();
}

async function rewriteDraft(id) {
  const draft = state.drafts.find((item) => item.id === id);
  if (!draft || !aiReady) {
    return;
  }
  const targetStyle = window.prompt("What direction should the rewrite take? For example: more restrained / more lyrical / sharper", "more lyrical");
  if (targetStyle === null) {
    return;
  }
  try {
    const response = await fetch("/api/draft/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: draft.title,
        text: draft.text,
        targetStyle,
        styleProfile: getStyleProfile(),
        styleSamples: getStyleSamples(),
      }),
    });
    if (!response.ok) {
      throw new Error("rewrite_failed");
    }
    const data = await response.json();
    if (!data.text) {
      return;
    }
    state.drafts.unshift({
      id: crypto.randomUUID(),
      title: `${draft.title} · Rewrite`,
      date: today,
      text: data.text,
      ...analyzeText(data.text),
      bookId: draft.bookId,
      createdAt: new Date().toISOString(),
      source: "rewrite",
    });
    renderAll();
  } catch {
    window.alert("The AI rewrite failed for now. Please try again in a moment.");
  }
}

function makeTopic(text) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 18 ? `${clean.slice(0, 18)}...` : clean;
}

function getSelectedBook() {
  return state.books.find((book) => book.id === state.ui.selectedBookId) || null;
}

function getBookById(bookId) {
  return state.books.find((book) => book.id === bookId) || null;
}

function getAllQuotes() {
  return state.books.flatMap((book) => book.quotes);
}

function countBy(list) {
  return list.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});
}

function topLabel(counter, fallback) {
  const entries = Object.entries(counter);
  if (!entries.length) {
    return fallback;
  }
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

function formatDate(date) {
  return date;
}

function formatTimestamp(value) {
  try {
    return new Date(value).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "recently";
  }
}

function shortenPath(value) {
  if (!value) {
    return "";
  }
  return value.length > 56 ? `...${value.slice(-53)}` : value;
}

function normalizeBookStatus(status) {
  if (status === "在读") {
    return "Reading";
  }
  if (status === "读完") {
    return "Finished";
  }
  if (status === "想读") {
    return "To Read";
  }
  return status || "Reading";
}

function jumpToCard(id) {
  const target = document.getElementById(id);
  if (!target) {
    return;
  }
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  target.classList.add("focused");
  window.setTimeout(() => target.classList.remove("focused"), 1400);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
