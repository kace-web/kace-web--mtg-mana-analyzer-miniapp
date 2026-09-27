import {
  createPipelineState,
  loadPipelineState,
  savePipelineState,
  resolveDeck,
  applyUserCardFacts,
  summary,
  runPhase2SelfAudit,
} from './pipeline.js';
import { CONTRACTS } from './contracts.js';
import { buildDeckManaProfile } from './mana-profile.js';
import {
  CALCULATOR_SCHEMA_VERSION,
  CALCULATORS,
  defaultInputs,
  deriveDeckInputs,
  fieldDefinitions,
  formatOptions,
  methodOptions,
  calculate,
  renderFields,
  renderResult,
  calculatorMethodExplanation,
  createCalculatorScenario,
  saveCalculatorScenario,
  loadCalculatorScenarios,
} from './calculator-engine.js';

const t = (key, values) => window.miniappI18n?.t(key, values) ?? key;
const $ = (id) => document.getElementById(id);
let state = null;
let manaProfile = null;

const ui = {
  deckText: $('deckText'), parseButton: $('parseButton'), loadSavedButton: $('loadSavedButton'), resolveButton: $('resolveButton'),
  providerBadge: $('providerBadge'), pipelineStatus: $('pipelineStatus'), summaryPanel: $('summaryPanel'), summaryGrid: $('summaryGrid'),
  warningList: $('warningList'), cardsPanel: $('cardsPanel'), cardList: $('cardList'), cardCountLabel: $('cardCountLabel'),
  factPanel: $('factPanel'), factForm: $('factForm'), closeFactButton: $('closeFactButton'), factContext: $('factContext'),
  factPhysicalId: $('factPhysicalId'), factCanonicalName: $('factCanonicalName'), factSetCode: $('factSetCode'), factCollectorNumber: $('factCollectorNumber'),
  factManaCost: $('factManaCost'), factManaValue: $('factManaValue'), factTypeLine: $('factTypeLine'), factRulesText: $('factRulesText'),
  factBasicLand: $('factBasicLand'), factExplanation: $('factExplanation'),
  calculatorSource: $('calculatorSource'), calculatorFormat: $('calculatorFormat'), calculatorType: $('calculatorType'), calculatorMethod: $('calculatorMethod'),
  calculatorMethodExplanation: $('calculatorMethodExplanation'), calculatorFields: $('calculatorFields'), calculateButton: $('calculateButton'),
  saveScenarioButton: $('saveScenarioButton'), savedScenarioSelect: $('savedScenarioSelect'), loadScenarioButton: $('loadScenarioButton'),
  calculatorStatus: $('calculatorStatus'), calculatorResult: $('calculatorResult'), calculatorContext: $('calculatorContext'),
  appFormat: $('appFormat'), deckFormat: $('deckFormat'), shellStatus: $('shellStatus'), themeButton: $('themeButton'),
  primaryMenuButton: $('primaryMenuButton'), toolsMenuButton: $('toolsMenuButton'), primaryMenu: $('primaryMenu'), toolsMenu: $('toolsMenu'),
  sampleCardButton: $('sampleCardButton'), sampleDeckButton: $('sampleDeckButton'), sampleCalculatorButton: $('sampleCalculatorButton'), sampleOutput: $('sampleOutput'), sampleFormat: $('sampleFormat'),
  roadmapCurrentBuild: $('roadmapCurrentBuild'), roadmapPhases: $('roadmapPhases'), roadmapCalculators: $('roadmapCalculators'), roadmapNotes: $('roadmapNotes'),
};

const calculatorState = {
  type: 'probability', method: 'hypergeometric', format: CONTRACTS.formatProfiles.STANDARD_CONSTRUCTED,
  sourceMode: 'manual', inputs: defaultInputs('probability', CONTRACTS.formatProfiles.STANDARD_CONSTRUCTED), origins: {}, originalDerived: {}, overrides: {}, result: null, scenarios: [],
};

const THEME_STORAGE_KEY = 'manaAnalyzer.theme';
const FORMAT_STORAGE_KEY = 'manaAnalyzer.format';
const DEFAULT_FORMAT = CONTRACTS.formatProfiles.STANDARD_CONSTRUCTED;

const ROADMAP_STATUS = Object.freeze({
  full: { label: 'roadmap.status.full', className: 'full' },
  visible: { label: 'roadmap.status.visible', className: 'visible' },
  partial: { label: 'roadmap.status.partial', className: 'partial' },
  architecture: { label: 'roadmap.status.architecture', className: 'architecture' },
  planned: { label: 'roadmap.status.planned', className: 'planned' },
  experimental: { label: 'roadmap.status.experimental', className: 'experimental' },
  issue: { label: 'roadmap.status.issue', className: 'issue' },
});

const ROADMAP = Object.freeze({
  currentBuild: [
    { status: 'full', title: 'roadmap.build.formatsTitle', body: 'roadmap.build.formatsBody', items: ['roadmap.build.formatsConstructed', 'roadmap.build.formatsBrawl', 'roadmap.build.formatsSingleton'] },
    { status: 'full', title: 'roadmap.build.calculatorsTitle', body: 'roadmap.build.calculatorsBody', items: ['roadmap.build.hypergeometric', 'roadmap.build.manaPips', 'roadmap.build.sourceProbability', 'roadmap.build.pay2Life'] },
    { status: 'partial', title: 'roadmap.build.calculatorPrototypesTitle', body: 'roadmap.build.calculatorPrototypesBody', items: ['roadmap.build.landPlayability', 'roadmap.build.ramp'] },
    { status: 'full', title: 'roadmap.build.appTitle', body: 'roadmap.build.appBody', items: ['roadmap.build.manual', 'roadmap.build.currentDeck', 'roadmap.build.tryIt', 'roadmap.build.guide', 'roadmap.build.aboutLegal', 'roadmap.build.theme', 'roadmap.build.savedScenarios', 'roadmap.build.roadmap'] },
    { status: 'visible', title: 'roadmap.build.pipelineTitle', body: 'roadmap.build.pipelineBody', items: ['roadmap.build.parsing', 'roadmap.build.resolution', 'roadmap.build.evidence', 'roadmap.build.cache', 'roadmap.build.persistence'], note: 'roadmap.build.pipelineNote' },
  ],
  phases: [
    { status: 'full', title: 'roadmap.phases.phase0Title', body: 'roadmap.phases.phase0Body', items: ['roadmap.phases.phase0Item1', 'roadmap.phases.phase0Item2'] },
    { status: 'full', title: 'roadmap.phases.phase1Title', body: 'roadmap.phases.phase1Body', items: ['roadmap.phases.phase1Item1', 'roadmap.phases.phase1Item2', 'roadmap.phases.phase1Item3'] },
    { status: 'visible', title: 'roadmap.phases.phase2Title', body: 'roadmap.phases.phase2Body', items: ['roadmap.phases.phase2Item1', 'roadmap.phases.phase2Item2', 'roadmap.phases.phase2Item3', 'roadmap.phases.phase2Item4', 'roadmap.phases.phase2Item5', 'roadmap.phases.phase2Item6'], note: 'roadmap.phases.phase2Note' },
    { status: 'full', title: 'roadmap.phases.phase3Title', body: 'roadmap.phases.phase3Body', items: ['roadmap.phases.phase3Item1', 'roadmap.phases.phase3Item2', 'roadmap.phases.phase3Item3', 'roadmap.phases.phase3Item4'], note: 'roadmap.phases.phase3Note' },
    { status: 'planned', title: 'roadmap.phases.phase4Title', body: 'roadmap.phases.phase4Body', items: ['roadmap.phases.phase4Item1', 'roadmap.phases.phase4Item2'] },
    { status: 'planned', title: 'roadmap.phases.futureTitle', body: 'roadmap.phases.futureBody', items: ['roadmap.phases.futureItem1', 'roadmap.phases.futureItem2'] },
  ],
  calculators: [
    { group: 'roadmap.calculatorGroups.implementedTitle', status: 'full', items: ['roadmap.calculators.probability', 'roadmap.calculators.multiCard', 'roadmap.calculators.manaPips', 'roadmap.calculators.sourceProbability', 'roadmap.calculators.pay2Life'] },
    { group: 'roadmap.calculatorGroups.prototypeTitle', status: 'partial', items: ['roadmap.calculators.landPlayability', 'roadmap.calculators.ramp'] },
    { group: 'roadmap.calculatorGroups.methodsTitle', status: 'full', items: ['roadmap.calculators.hypergeometric', 'roadmap.calculators.pipDistribution', 'roadmap.calculators.coloredSource', 'roadmap.calculators.karsten', 'roadmap.calculators.exactSource', 'roadmap.calculators.untapped', 'roadmap.calculators.simulation'] },
    { group: 'roadmap.calculatorGroups.foundationTitle', status: 'architecture', items: ['roadmap.calculators.foundation'] },
    { group: 'roadmap.calculatorGroups.plannedTitle', status: 'planned', items: ['roadmap.calculators.landDrops', 'roadmap.calculators.manaByTurn', 'roadmap.calculators.multipleColors', 'roadmap.calculators.castability', 'roadmap.calculators.manaBaseAudit'] },
  ],
  notes: [
    { status: 'issue', title: 'roadmap.notes.providerTitle', body: 'roadmap.notes.providerBody' },
    { status: 'visible', title: 'roadmap.notes.syntheticTitle', body: 'roadmap.notes.syntheticBody' },
    { status: 'experimental', title: 'roadmap.notes.simulationTitle', body: 'roadmap.notes.simulationBody' },
  ],
});

function showView(viewId) {
  document.querySelectorAll('.app-view').forEach((view) => { view.hidden = view.id !== viewId; });
  ui.primaryMenu.hidden = true; ui.toolsMenu.hidden = true;
  ui.primaryMenuButton.setAttribute('aria-expanded', 'false'); ui.toolsMenuButton.setAttribute('aria-expanded', 'false');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setShellStatus(message, kind = '') {
  ui.shellStatus.textContent = message;
  ui.shellStatus.className = `shell-status ${kind}`.trim();
}

function roadmapStatus(status) {
  return ROADMAP_STATUS[status] ?? ROADMAP_STATUS.planned;
}

function createRoadmapStatus(status) {
  const definition = roadmapStatus(status);
  const badge = document.createElement('span');
  badge.className = `roadmap-status ${definition.className}`;
  const marker = document.createElement('span');
  marker.className = 'roadmap-marker';
  marker.setAttribute('aria-hidden', 'true');
  const label = document.createElement('span');
  label.textContent = t(definition.label);
  badge.append(marker, label);
  return badge;
}

function createRoadmapCard(entry, className = '') {
  const card = document.createElement('article');
  card.className = `roadmap-card ${className}`.trim();
  const header = document.createElement('div');
  header.className = 'roadmap-card-header';
  const title = document.createElement('h3');
  title.textContent = t(entry.title);
  header.append(title, createRoadmapStatus(entry.status));
  card.append(header);
  if (entry.body) {
    const body = document.createElement('p');
    body.className = 'roadmap-copy';
    body.textContent = t(entry.body);
    card.append(body);
  }
  if (entry.items?.length) {
    const list = document.createElement('ul');
    list.className = 'roadmap-list';
    entry.items.forEach((key) => { const item = document.createElement('li'); item.textContent = t(key); list.append(item); });
    card.append(list);
  }
  if (entry.note) {
    const note = document.createElement('p');
    note.className = 'roadmap-note';
    note.textContent = t(entry.note);
    card.append(note);
  }
  return card;
}

function renderRoadmap() {
  if (!ui.roadmapCurrentBuild) return;
  ui.roadmapCurrentBuild.replaceChildren(...ROADMAP.currentBuild.map((entry) => createRoadmapCard(entry)));
  ui.roadmapPhases.replaceChildren(...ROADMAP.phases.map((entry) => createRoadmapCard(entry, 'phase-card')));
  ui.roadmapCalculators.replaceChildren(...ROADMAP.calculators.map((group) => {
    const wrapper = document.createElement('section');
    wrapper.className = 'roadmap-calculator-group';
    const heading = document.createElement('div');
    heading.className = 'roadmap-group-heading';
    const title = document.createElement('h3');
    title.textContent = t(group.group);
    heading.append(title, createRoadmapStatus(group.status));
    const list = document.createElement('ul');
    list.className = 'roadmap-list';
    group.items.forEach((key) => { const item = document.createElement('li'); item.textContent = t(key); list.append(item); });
    wrapper.append(heading, list);
    return wrapper;
  }));
  ui.roadmapNotes.replaceChildren(...ROADMAP.notes.map((entry) => createRoadmapCard(entry, 'note-card')));
}

function renderFormatSelects(format = DEFAULT_FORMAT) {
  [ui.appFormat, ui.deckFormat].forEach((select) => {
    if (!select) return;
    select.replaceChildren();
    if (select === ui.appFormat) {
      const none = document.createElement('option'); none.value = ''; none.textContent = t('calculators.noFormatSelected'); select.append(none);
    }
    formatOptions().forEach((option) => { const item = document.createElement('option'); item.value = option.value; item.textContent = option.label; select.append(item); });
    select.value = select === ui.deckFormat && !format ? DEFAULT_FORMAT : format;
  });
}

function setSelectedFormat(format, { resetCalculator = true } = {}) {
  const next = format === '' ? '' : formatOptions().some((option) => option.value === format) ? format : DEFAULT_FORMAT;
  renderFormatSelects(next);
  calculatorState.format = next;
  if (ui.calculatorFormat) ui.calculatorFormat.value = next;
  if (resetCalculator) resetCalculatorInputs();
}

function applyTheme(theme) {
  const next = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  ui.themeButton.textContent = t(next === 'dark' ? 'shell.themeLight' : 'shell.themeDark');
}

async function loadTheme() {
  try { const raw = await miniappsAI.storage.getItem(THEME_STORAGE_KEY); applyTheme(raw || 'dark'); } catch { applyTheme('dark'); }
}

async function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  applyTheme(next);
  try { await miniappsAI.storage.setItem(THEME_STORAGE_KEY, next); } catch { setShellStatus(t('shell.themeSaveError'), 'warning'); }
}

function renderSample(kind) {
  ui.sampleOutput.replaceChildren();
  const title = document.createElement('h3'); const body = document.createElement('p'); const note = document.createElement('p'); note.className = 'sample-note';
  const format = ui.sampleFormat.value;
  const label = format ? t(`calculators.formats.${format}`) : t('sample.noFormat');
  if (kind === 'card') { title.textContent = t('sample.cardTitle'); body.textContent = t('sample.cardBody', { format: label }); }
  else { title.textContent = t('sample.deckTitle'); body.textContent = t('sample.deckBody', { format: label }); }
  note.textContent = t('sample.syntheticNote'); ui.sampleOutput.append(title, body, note);
}

function sampleDeckText(format) {
  const profile = CONTRACTS.getFormatProfile(format);
  const main = format === CONTRACTS.formatProfiles.STANDARD_BRAWL ? '59 Example Basic Land' : `${profile.mainDeck.exactCount} Example Basic Land`;
  return format === CONTRACTS.formatProfiles.STANDARD_BRAWL ? `${main}\n\nCommander:\n1 Example Commander` : main;
}

function initShell() {
  renderFormatSelects(calculatorState.format);
  formatOptions().forEach((option) => { const item = document.createElement('option'); item.value = option.value; item.textContent = option.label; ui.sampleFormat.append(item); });
  document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => showView(button.dataset.view)));
  ui.primaryMenuButton.addEventListener('click', () => { const open = ui.primaryMenu.hidden; ui.primaryMenu.hidden = !open; ui.toolsMenu.hidden = true; ui.primaryMenuButton.setAttribute('aria-expanded', String(open)); ui.toolsMenuButton.setAttribute('aria-expanded', 'false'); });
  ui.toolsMenuButton.addEventListener('click', () => { const open = ui.toolsMenu.hidden; ui.toolsMenu.hidden = !open; ui.toolsMenuButton.setAttribute('aria-expanded', String(open)); ui.primaryMenu.hidden = true; ui.primaryMenuButton.setAttribute('aria-expanded', 'false'); });
  ui.themeButton.addEventListener('click', () => { toggleTheme().catch(() => setShellStatus(t('shell.themeSaveError'), 'warning')); });
  [ui.appFormat, ui.deckFormat].forEach((select) => select.addEventListener('change', () => { setSelectedFormat(select.value); miniappsAI.storage.setItem(FORMAT_STORAGE_KEY, select.value).catch(() => setShellStatus(t('shell.formatSaveError'), 'warning')); }));
  ui.sampleCardButton.addEventListener('click', () => renderSample('card'));
  ui.sampleDeckButton.addEventListener('click', () => { const format = ui.sampleFormat.value || [CONTRACTS.formatProfiles.STANDARD_CONSTRUCTED, CONTRACTS.formatProfiles.STANDARD_BRAWL, CONTRACTS.formatProfiles.STANDARD_SINGLETON][Math.floor(Math.random() * 3)]; ui.deckText.value = sampleDeckText(format); renderSample('deck'); showView('analyzerView'); setShellStatus(t('sample.loaded'), 'success'); });
  ui.sampleCalculatorButton.addEventListener('click', () => { calculatorState.type = 'probability'; calculatorState.method = 'hypergeometric'; calculatorState.inputs = { ...defaultInputs('probability', calculatorState.format), deckSize: calculatorState.format === CONTRACTS.formatProfiles.STANDARD_BRAWL ? 59 : 60, copies: 8, cardsDrawn: 7, desired: 2, relation: 'at_least', turn: '' }; calculatorState.origins = {}; ui.calculatorType.value = calculatorState.type; renderCalculatorFormats(); renderCalculatorMethods(); renderCalculatorFields(); showView('calculatorView'); runCalculator(); });
  loadTheme().catch(() => applyTheme('dark'));
  if (globalThis.miniappsAI?.storage?.getItem) globalThis.miniappsAI.storage.getItem(FORMAT_STORAGE_KEY).then((format) => { if (format) setSelectedFormat(format, { resetCalculator: false }); }).catch(() => {});
}

function setNotice(message, kind = '') {
  ui.pipelineStatus.textContent = message;
  ui.pipelineStatus.className = `notice ${kind}`.trim();
  ui.pipelineStatus.hidden = !message;
}

function setProviderBadge() {
  const available = state?.provider?.available;
  ui.providerBadge.textContent = available ? t('pipeline.providerReady') : t('pipeline.providerUnavailable');
  ui.providerBadge.className = `status-pill ${available ? 'good' : 'muted'}`;
}

function stat(label, value) {
  const item = document.createElement('div');
  item.className = 'summary-stat';
  const strong = document.createElement('strong');
  strong.textContent = String(value);
  const span = document.createElement('span');
  span.textContent = label;
  item.append(strong, span);
  return item;
}

function renderSummary() {
  if (!state) return;
  const counts = summary(state);
  ui.summaryGrid.replaceChildren(
    stat(t('summary.mainDeck'), counts.mainDeckCardCount),
    stat(t('summary.uniqueCards'), counts.uniqueCards),
    stat(t('summary.confirmed'), counts.confirmed),
    stat(t('summary.needsReview'), counts.ambiguous + counts.unresolved),
  );
  ui.warningList.replaceChildren();
  const warnings = state.deck.validationWarnings ?? [];
  warnings.forEach((warning) => {
    const paragraph = document.createElement('p');
    paragraph.textContent = warning;
    ui.warningList.append(paragraph);
  });
  ui.warningList.hidden = warnings.length === 0;
  ui.summaryPanel.hidden = false;
}

function displayStatus(group) {
  const status = group.physical.identityStatus;
  if (status === 'confirmed') return { label: t('cards.confirmed'), className: 'good' };
  if (status === 'candidates_available' || status === 'user_selection_required') return { label: t('cards.ambiguous'), className: 'warn' };
  if (status === 'unknown') return { label: t('cards.unavailable'), className: 'muted' };
  return { label: t('cards.unresolved'), className: 'muted' };
}

function renderCards() {
  if (!state) return;
  ui.cardList.replaceChildren();
  const groups = state.physicalGroups ?? [];
  ui.cardCountLabel.textContent = t('cards.count', { count: groups.length });
  groups.forEach((group) => {
    const row = document.createElement('article');
    row.className = 'card-row';
    const main = document.createElement('div');
    main.className = 'card-main';
    const name = document.createElement('div');
    name.className = 'card-name';
    name.textContent = group.normalizedRecord?.name ?? group.identity?.canonicalName ?? group.enteredName;
    const meta = document.createElement('div');
    meta.className = 'card-meta';
    const status = displayStatus(group);
    const badge = document.createElement('span');
    badge.className = `status-pill ${status.className}`;
    badge.textContent = status.label;
    const quantity = document.createElement('span');
    quantity.textContent = t('cards.copies', { count: group.quantity });
    const cost = document.createElement('span');
    const manaCost = group.normalizedRecord?.manaCost;
    cost.textContent = manaCost ? t('cards.cost', { cost: manaCost }) : t('cards.costUnknown');
    meta.append(badge, quantity, cost);
    if (group.reviewMessage) {
      const note = document.createElement('div');
      note.className = 'muted-copy';
      note.style.marginTop = '7px';
      note.textContent = group.reviewMessage;
      main.append(name, meta, note);
    } else main.append(name, meta);
    const actions = document.createElement('div');
    actions.className = 'card-actions';
    const qty = document.createElement('span');
    qty.className = 'card-quantity';
    qty.textContent = `×${group.quantity}`;
    const edit = document.createElement('button');
    edit.className = 'button secondary';
    edit.type = 'button';
    edit.textContent = group.physical.identityStatus === 'confirmed' ? t('cards.editEvidence') : t('cards.addEvidence');
    edit.addEventListener('click', () => openFactEditor(group));
    actions.append(qty, edit);
    row.append(main, actions);
    ui.cardList.append(row);
  });
  ui.cardsPanel.hidden = false;
}

function renderAll() {
  if (!state) return;
  manaProfile = buildDeckManaProfile(state);
  ui.deckText.value = state.deck.originalText ?? '';
  setProviderBadge();
  renderSummary();
  renderCards();
  if (calculatorState.sourceMode === 'deck') syncCalculatorFromDeck();
}

function setCalculatorStatus(message, kind = '') {
  ui.calculatorStatus.textContent = message;
  ui.calculatorStatus.className = `calculator-status ${kind}`.trim();
  ui.calculatorStatus.hidden = !message;
}

function renderCalculatorFormats() {
  ui.calculatorFormat.replaceChildren();
  const none = document.createElement('option'); none.value = ''; none.textContent = t('calculators.noFormatSelected'); ui.calculatorFormat.append(none);
  formatOptions().forEach((option) => {
    const element = document.createElement('option'); element.value = option.value; element.textContent = option.label; ui.calculatorFormat.append(element);
  });
  ui.calculatorFormat.value = calculatorState.format || '';
}

function renderCalculatorMethods() {
  ui.calculatorMethod.replaceChildren();
  methodOptions(calculatorState.type).forEach((option) => {
    const element = document.createElement('option'); element.value = option.value; element.textContent = option.label; ui.calculatorMethod.append(element);
  });
  if (!methodOptions(calculatorState.type).some((option) => option.value === calculatorState.method)) calculatorState.method = methodOptions(calculatorState.type)[0]?.value;
  ui.calculatorMethod.value = calculatorState.method;
  ui.calculatorMethodExplanation.textContent = `${calculatorMethodExplanation(calculatorState.method)} ${t('calculators.methodNote')}`;
}

function renderCalculatorFields() {
  renderFields(ui.calculatorFields, calculatorState.type, calculatorState.inputs, (key, value) => {
    const previousOrigin = calculatorState.origins[key];
    const previousValue = calculatorState.inputs[key];
    calculatorState.inputs[key] = value;
    if (previousOrigin === 'deck' || previousOrigin === 'manualOverride') {
      if (calculatorState.originalDerived[key] === undefined) calculatorState.originalDerived[key] = { value: previousValue, provenance: 'deck' };
      calculatorState.overrides[key] = { original: calculatorState.originalDerived[key], current: value, provenance: 'manualOverride' };
      calculatorState.origins[key] = 'manualOverride';
    } else calculatorState.origins[key] = 'manual';
    const origin = ui.calculatorFields.querySelector(`#calc-${key}`)?.closest('label')?.querySelector('.field-origin');
    if (origin) origin.textContent = calculatorState.origins[key] === 'manualOverride' ? t('calculators.origin.manualOverrideValue', { value: String(calculatorState.originalDerived[key]?.value ?? '—') }) : t(`calculators.origin.${calculatorState.origins[key]}`);
  }, calculatorState.origins, calculatorState.originalDerived);
}

function renderCalculatorContext() {
  if (!ui.calculatorContext) return;
  const source = calculatorState.sourceMode === 'deck' ? t('calculators.currentDeck') : t('calculators.manual');
  const format = calculatorState.format ? t(`calculators.formats.${calculatorState.format}`) : t('calculators.noFormatSelected');
  ui.calculatorContext.textContent = t('calculators.context', { source, format });
}

function renderSavedScenarios() {
  ui.savedScenarioSelect.replaceChildren();
  const empty = document.createElement('option'); empty.value = ''; empty.textContent = t('calculators.noSavedScenarios'); ui.savedScenarioSelect.append(empty);
  calculatorState.scenarios.forEach((scenario) => { const option = document.createElement('option'); option.value = scenario.scenarioId; option.textContent = `${t(`calculators.types.${scenario.calculatorType}`)} · ${new Date(scenario.createdAt).toLocaleDateString()}`; ui.savedScenarioSelect.append(option); });
}

function syncCalculatorFromDeck() {
  if (!state) { setCalculatorStatus(t('calculators.status.noDeck'), 'warning'); return; }
  const derived = deriveDeckInputs(state, calculatorState.type, {}, manaProfile);
  const nextInputs = { ...calculatorState.inputs };
  if (['landPlayability', 'ramp'].includes(calculatorState.type)) fieldDefinitions(calculatorState.type).forEach(([key]) => { if (!calculatorState.origins[key]) calculatorState.origins[key] = 'unknown'; });
  const keys = calculatorState.type === 'probability' || calculatorState.type === 'multiCard' ? ['deckSize'] : calculatorState.type === 'sourceProbability' ? ['deckSize', 'qualifyingSources', 'untappedSources'] : calculatorState.type === 'manaPips' ? fieldDefinitions('manaPips').map(([key]) => key).filter((key) => ['white', 'blue', 'black', 'red', 'green', 'colorless', 'generic', 'totalLands'].includes(key)) : calculatorState.type === 'landPlayability' || calculatorState.type === 'ramp' ? (derived.derivedKeys ?? []) : ['deckSize', 'payLands', 'totalLands'];
  keys.forEach((key) => {
    if (derived.unsupportedKeys?.includes(key)) { if (!calculatorState.origins[key]) calculatorState.origins[key] = 'unknown'; return; }
    if (derived[key] === undefined) return;
    if (calculatorState.origins[key] !== 'manualOverride' || calculatorState.originalDerived[key] === undefined) calculatorState.originalDerived[key] = { value: derived[key], provenance: 'deck' };
    if (calculatorState.origins[key] !== 'manualOverride') { nextInputs[key] = derived[key]; calculatorState.origins[key] = 'deck'; }
  });
  calculatorState.inputs = { ...nextInputs, deckDataWarning: derived.deckDataWarning };
  renderCalculatorFields();
  setCalculatorStatus(t('calculators.status.deckPopulated'), 'success');
}

function resetCalculatorInputs() {
  calculatorState.inputs = defaultInputs(calculatorState.type, calculatorState.format);
  calculatorState.origins = {}; calculatorState.originalDerived = {}; calculatorState.overrides = {};
  calculatorState.result = null;
  if (calculatorState.sourceMode === 'deck') syncCalculatorFromDeck(); else renderCalculatorFields();
  renderCalculatorOutput();
}

function renderCalculatorOutput() {
  renderCalculatorContext();
  renderResult(ui.calculatorResult, calculatorState.result, calculatorState.origins);
  if (!calculatorState.result || calculatorState.result.error) return;
  const source = document.createElement('p'); source.className = 'result-meta'; source.textContent = `${t('calculators.result.inputSource')}: ${calculatorState.sourceMode === 'deck' ? t('calculators.result.currentDeck') : t('calculators.result.manualInput')}`;
  ui.calculatorResult.append(source);
}

function runCalculator() {
  const result = calculate(calculatorState.type, calculatorState.method, calculatorState.inputs, calculatorState.format);
  result.inputOrigins = { ...calculatorState.origins }; result.originalDerived = { ...calculatorState.originalDerived }; result.overrides = { ...calculatorState.overrides };
  calculatorState.result = result;
  renderCalculatorOutput();
  if (result.error) setCalculatorStatus(result.error, 'error');
  else setCalculatorStatus(t('calculators.status.calculated'), 'success');
}

async function saveCurrentScenario() {
  if (!calculatorState.result) runCalculator();
  if (!calculatorState.result || calculatorState.result.error) return;
  const scenario = createCalculatorScenario({ type: calculatorState.type, method: calculatorState.method, inputs: calculatorState.inputs, assumptions: calculatorState.result.assumptions, format: calculatorState.format, deckId: state?.deck?.deckId ?? null, result: calculatorState.result, sourceMode: calculatorState.sourceMode, origins: calculatorState.origins, originalDerived: calculatorState.originalDerived, overrides: calculatorState.overrides });
  const saved = await saveCalculatorScenario(scenario);
  if (!saved.saved) { setCalculatorStatus(t('calculators.status.scenarioUnavailable'), 'warning'); return; }
  calculatorState.scenarios = [scenario, ...calculatorState.scenarios.filter((item) => item.scenarioId !== scenario.scenarioId)].slice(0, 20);
  renderSavedScenarios(); setCalculatorStatus(t('calculators.status.scenarioSaved'), 'success');
}

function loadSelectedScenario() {
  const scenario = calculatorState.scenarios.find((item) => item.scenarioId === ui.savedScenarioSelect.value);
  if (!scenario) return;
  const calculator = CALCULATORS[scenario.calculatorType];
  if (!calculator || !calculator.methods.includes(scenario.method)) { setCalculatorStatus(t('calculators.status.scenarioIncompatible'), 'warning'); return; }
  const scenarioFormat = formatOptions().some((option) => option.value === scenario.format) ? scenario.format : '';
  const scenarioSource = scenario.sourceMode === 'deck' ? 'deck' : 'manual';
  const resultCompatible = scenario.schemaVersion === CALCULATOR_SCHEMA_VERSION && scenario.result?.calculatorVersion === CALCULATOR_SCHEMA_VERSION;
  calculatorState.type = scenario.calculatorType; calculatorState.method = scenario.method; calculatorState.format = scenarioFormat; calculatorState.inputs = { ...defaultInputs(calculatorState.type, scenarioFormat), ...(scenario.inputs ?? {}) }; calculatorState.sourceMode = scenarioSource; calculatorState.origins = { ...(scenario.origins ?? {}) }; calculatorState.originalDerived = { ...(scenario.originalDerived ?? {}) }; calculatorState.overrides = { ...(scenario.overrides ?? {}) }; calculatorState.result = resultCompatible ? scenario.result : null;
  ui.calculatorType.value = calculatorState.type; ui.calculatorSource.value = calculatorState.sourceMode; renderCalculatorFormats(); renderCalculatorMethods(); renderCalculatorFields(); if (!calculatorState.result) runCalculator(); else renderCalculatorOutput(); setCalculatorStatus(t('calculators.status.scenarioLoaded'), 'success');
}

function initCalculators() {
  renderCalculatorFormats(); renderCalculatorMethods(); renderCalculatorFields(); renderCalculatorContext();
  ui.calculatorSource.addEventListener('change', () => { calculatorState.sourceMode = ui.calculatorSource.value; if (calculatorState.sourceMode === 'deck') syncCalculatorFromDeck(); else { calculatorState.origins = {}; calculatorState.originalDerived = {}; calculatorState.overrides = {}; renderCalculatorFields(); renderCalculatorContext(); setCalculatorStatus(t('calculators.status.manualMode'), 'success'); } });
  ui.calculatorFormat.addEventListener('change', () => { calculatorState.format = ui.calculatorFormat.value; resetCalculatorInputs(); renderCalculatorContext(); });
  ui.calculatorType.addEventListener('change', () => { calculatorState.type = ui.calculatorType.value; calculatorState.method = methodOptions(calculatorState.type)[0]?.value; resetCalculatorInputs(); renderCalculatorMethods(); renderCalculatorContext(); });
  ui.calculatorMethod.addEventListener('change', () => { calculatorState.method = ui.calculatorMethod.value; ui.calculatorMethodExplanation.textContent = `${calculatorMethodExplanation(calculatorState.method)} ${t('calculators.methodNote')}`; calculatorState.result = null; renderCalculatorOutput(); });
  ui.calculateButton.addEventListener('click', runCalculator);
  ui.saveScenarioButton.addEventListener('click', () => { saveCurrentScenario().catch(() => setCalculatorStatus(t('calculators.status.scenarioUnavailable'), 'error')); });
  ui.loadScenarioButton.addEventListener('click', loadSelectedScenario);
  loadCalculatorScenarios().then((loaded) => { calculatorState.scenarios = loaded.scenarios ?? []; renderSavedScenarios(); }).catch(() => setCalculatorStatus(t('calculators.status.scenarioUnavailable'), 'warning'));
}

function openFactEditor(group) {
  const record = group.normalizedRecord ?? {};
  ui.factPhysicalId.value = group.physical.physicalCardId;
  ui.factContext.textContent = t('fact.context', { name: group.enteredName, count: group.quantity });
  ui.factCanonicalName.value = group.identity?.canonicalName ?? record.canonicalName ?? group.enteredName;
  ui.factSetCode.value = group.identity?.setCode ?? record.setCode ?? group.setCode ?? '';
  ui.factCollectorNumber.value = group.identity?.collectorNumber ?? record.collectorNumber ?? group.collectorNumber ?? '';
  ui.factManaCost.value = record.manaCost ?? '';
  ui.factManaValue.value = record.manaValue ?? '';
  ui.factTypeLine.value = record.typeLine ?? '';
  ui.factRulesText.value = record.rulesText ?? '';
  ui.factBasicLand.value = record.basicLand === true ? 'true' : record.basicLand === false ? 'false' : '';
  ui.factExplanation.value = '';
  ui.factPanel.hidden = false;
  ui.factPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  ui.factCanonicalName.focus();
}

async function processDeck() {
  const text = ui.deckText.value;
  if (!text.trim()) {
    setNotice(t('deck.empty'), 'warning');
    ui.summaryPanel.hidden = true;
    ui.cardsPanel.hidden = true;
    return;
  }
  setNotice(t('deck.processing'), '');
  state = createPipelineState(text, { format: ui.deckFormat.value || DEFAULT_FORMAT });
  state = await resolveDeck(state);
  const saved = await savePipelineState(state);
  renderAll();
  if (!state.provider.available) {
    setNotice(t('pipeline.noProvider'), 'warning');
  } else if (saved.saved) {
    setNotice(t('pipeline.saved'), 'success');
  } else {
    setNotice(t('pipeline.ready'), 'success');
  }
}

async function reloadSaved() {
  setNotice(t('deck.loading'), '');
  const result = await loadPipelineState();
  if (!result.state) {
    setNotice(result.reason === 'storage_unavailable' ? t('storage.unavailable') : t('storage.empty'), 'warning');
    return;
  }
  state = result.state;
  setSelectedFormat(state.deck?.format ?? DEFAULT_FORMAT, { resetCalculator: false });
  renderAll();
  setNotice(t('storage.loaded'), 'success');
}

async function recheckCards() {
  if (!state) return;
  setNotice(t('pipeline.checking'), '');
  state = await resolveDeck(state);
  await savePipelineState(state);
  renderAll();
  setNotice(state.provider.available ? t('pipeline.ready') : t('pipeline.noProvider'), state.provider.available ? 'success' : 'warning');
}

ui.parseButton.addEventListener('click', () => { processDeck().catch((error) => setNotice(t('errors.pipeline'), 'error')); });
ui.loadSavedButton.addEventListener('click', () => { reloadSaved().catch(() => setNotice(t('errors.storage'), 'error')); });
ui.resolveButton.addEventListener('click', () => { recheckCards().catch(() => setNotice(t('errors.pipeline'), 'error')); });
ui.closeFactButton.addEventListener('click', () => { ui.factPanel.hidden = true; });
ui.factForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!state) return;
  try {
    applyUserCardFacts(state, ui.factPhysicalId.value, {
      canonicalName: ui.factCanonicalName.value,
      setCode: ui.factSetCode.value,
      collectorNumber: ui.factCollectorNumber.value,
      manaCost: ui.factManaCost.value,
      manaValue: ui.factManaValue.value,
      typeLine: ui.factTypeLine.value,
      rulesText: ui.factRulesText.value,
      basicLand: ui.factBasicLand.value === 'true' ? true : ui.factBasicLand.value === 'false' ? false : null,
      explanation: ui.factExplanation.value,
    });
    await savePipelineState(state);
    ui.factPanel.hidden = true;
    renderAll();
    setNotice(t('fact.saved'), 'success');
  } catch (error) {
    setNotice(t('errors.fact'), 'error');
  }
});

window.manaAnalyzerContracts = CONTRACTS;
window.manaAnalyzerPhase2 = { getState: () => state, runSelfAudit: runPhase2SelfAudit };
window.manaAnalyzerPhase3 = { getCalculatorState: () => calculatorState, calculate: runCalculator };
window.manaAnalyzerPhase1A = { getProfile: () => manaProfile, buildProfile: buildDeckManaProfile };

document.addEventListener('DOMContentLoaded', async () => {
  initShell();
  renderRoadmap();
  initCalculators();
  try {
    const audit = await runPhase2SelfAudit();
    console.info('Phase 2 self-audit', audit);
  } catch {
    console.warn('Phase 2 self-audit could not complete.');
  }
  const loaded = await loadPipelineState();
  if (loaded.state) {
    state = loaded.state;
    setSelectedFormat(state.deck?.format ?? DEFAULT_FORMAT, { resetCalculator: false });
    renderAll();
    setNotice(t('storage.loaded'), 'success');
  }
});
