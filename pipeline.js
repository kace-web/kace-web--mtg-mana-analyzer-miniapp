import { CONTRACTS } from './contracts.js';

const {
  createDeckDocument, createDeckEntry, createPhysicalCardReference, createCardIdentity,
  createCardFace, createEvidenceRecord, createFactAssertion, createUserOverride,
  createProvenance, createConflict, createSourceMetadata, createCacheRecord,
  createCardCandidate, createProviderResponse, createProviderFailure,
  createCardResolutionRequest, createCardRecordRequest, createNormalizedCardRecord, createPersistenceEnvelope,
  createProviderContract, migratePersistenceEnvelope, chooseActiveAssertion, getFormatProfile, formatProfiles: FORMAT_PROFILES,
} = CONTRACTS;

export const PIPELINE_STORAGE_KEY = 'manaAnalyzer.phase2.pipeline';
export const PIPELINE_SCHEMA = 2;

const now = () => new Date().toISOString();
const clone = (value) => JSON.parse(JSON.stringify(value));
const clean = (value) => typeof value === 'string' && value.trim() ? value.trim() : null;
const normalizeName = (value) => String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
const idKey = (name, setCode, collectorNumber) => [normalizeName(name), normalizeName(setCode), normalizeName(collectorNumber)].join('|');
const isKnownBasic = (record) => record?.basicLand === true || ['basic land', 'basic'].includes(normalizeName(record?.typeLine));
const statusText = (status) => status === 'confirmed' ? 'confirmed' : status === 'candidates_available' || status === 'user_selection_required' ? 'review' : 'unresolved';

function parseSectionLabel(line) {
  const match = line.match(/^\s*([^:]{1,80})\s*:\s*$/);
  if (!match) return null;
  const label = normalizeName(match[1]);
  if (['main', 'mainboard', 'deck'].includes(label)) return { section: 'main', label: match[1].trim() };
  if (['sideboard', 'side'].includes(label)) return { section: 'sideboard', label: match[1].trim() };
  if (['commander', 'command zone'].includes(label)) return { section: 'commander', label: match[1].trim() };
  return { section: 'unknown', label: match[1].trim() };
}

function parseEntryLine(line, section, lineNumber) {
  const errors = [];
  const match = line.match(/^\s*(\d+)\s+(.+?)\s*(?:\(([A-Za-z0-9]{2,8})\)\s*([A-Za-z0-9-]+))?\s*$/);
  if (!match) {
    return createDeckEntry({ rawLine: line, quantity: 0, cardName: '', section, parseStatus: 'invalid', parseError: `Line ${lineNumber}: expected quantity followed by card name.` });
  }
  const quantity = Number(match[1]);
  if (!Number.isSafeInteger(quantity) || quantity < 1) errors.push(`Line ${lineNumber}: quantity must be at least 1.`);
  const cardName = clean(match[2]);
  if (!cardName) errors.push(`Line ${lineNumber}: card name is missing.`);
  if (section === 'unknown') errors.push(`Line ${lineNumber}: unsupported section.`);
  return createDeckEntry({ rawLine: line, quantity: errors.length ? Math.max(0, quantity || 0) : quantity, cardName: cardName ?? '', setCode: clean(match[3]), collectorNumber: clean(match[4]), section, parseStatus: errors.length ? 'unsupported' : 'parsed', parseError: errors.length ? errors.join(' ') : null });
}

export function parseDeckText(originalText = '', { format = FORMAT_PROFILES.STANDARD_CONSTRUCTED } = {}) {
  const text = String(originalText ?? '');
  const lines = text.split(/\r?\n/);
  let section = 'main';
  const entries = [];
  const warnings = [];
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    if (!line.trim()) {
      entries.push(createDeckEntry({ rawLine: line, quantity: 0, cardName: '', section, parseStatus: 'empty' }));
      return;
    }
    const sectionLabel = parseSectionLabel(line);
    if (sectionLabel) {
      section = sectionLabel.section;
      if (section === 'unknown') warnings.push(`Line ${lineNumber}: unsupported section “${sectionLabel.label}”.`);
      entries.push(createDeckEntry({ rawLine: line, quantity: 0, cardName: '', section, parseStatus: section === 'unknown' ? 'unsupported' : 'empty', parseError: section === 'unknown' ? `Unsupported section: ${sectionLabel.label}` : null }));
      return;
    }
    if (/^\s*(#|\/\/)/.test(line)) {
      entries.push(createDeckEntry({ rawLine: line, quantity: 0, cardName: '', section, parseStatus: 'unsupported', parseError: `Line ${lineNumber}: comments are preserved but not parsed as cards.` }));
      return;
    }
    const entry = parseEntryLine(line, section, lineNumber);
    entries.push(entry);
    if (entry.parseStatus !== 'parsed') warnings.push(entry.parseError ?? `Line ${lineNumber}: could not parse entry.`);
  });
  const deck = createDeckDocument({
    originalText: text,
    format,
    mainDeckEntryIds: entries.filter((entry) => entry.section === 'main' && entry.parseStatus === 'parsed').map((entry) => entry.entryId),
    commanderEntryIds: entries.filter((entry) => entry.section === 'commander' && entry.parseStatus === 'parsed').map((entry) => entry.entryId),
    validationWarnings: warnings,
  });
  deck.mainDeckCardCount = entries.filter((entry) => entry.section === 'main' && entry.parseStatus === 'parsed').reduce((sum, entry) => sum + entry.quantity, 0);
  deck.commanderCardCount = entries.filter((entry) => entry.section === 'commander' && entry.parseStatus === 'parsed').reduce((sum, entry) => sum + entry.quantity, 0);
  deck.updatedAt = now();
  return { deck, entries, warnings };
}

export function aggregatePhysicalCards(entries = [], section = 'main') {
  const groups = new Map();
  entries.filter((entry) => entry.section === section && entry.parseStatus === 'parsed').forEach((entry) => {
    const key = idKey(entry.cardName, entry.setCode, entry.collectorNumber);
    const current = groups.get(key) ?? { key, enteredName: entry.cardName, setCode: entry.setCode, collectorNumber: entry.collectorNumber, quantity: 0, deckEntryIds: [] };
    current.quantity += entry.quantity;
    current.deckEntryIds.push(entry.entryId);
    groups.set(key, current);
  });
  return [...groups.values()].map((group) => {
    const physical = createPhysicalCardReference({ quantity: group.quantity, deckEntryIds: group.deckEntryIds, identityStatus: 'unresolved' });
    return { ...group, section, deckRole: section === 'commander' ? 'commander' : 'main', physical };
  });
}

function basicClassification(record) {
  if (record?.basicLand === true) return true;
  if (record?.basicLand === false) return false;
  if (Array.isArray(record?.supertypes) && record.supertypes.some((value) => normalizeName(value) === 'basic')) return true;
  if (typeof record?.typeLine === 'string' && record.typeLine.trim()) return /^basic\s+land\b/i.test(record.typeLine.trim());
  return null;
}

export function validateFormatRules(deck, entries, physicalGroups = [], commanderGroups = []) {
  const profile = getFormatProfile(deck?.format ?? FORMAT_PROFILES.STANDARD_CONSTRUCTED);
  const warnings = [];
  const mainCount = deck?.mainDeckCardCount ?? 0;
  const commanderCount = deck?.commanderCardCount ?? 0;
  if (mainCount !== profile.mainDeck.exactCount) warnings.push(`${profile.label} main deck has ${mainCount} cards; the required count is ${profile.mainDeck.exactCount}.`);
  if (profile.commander.required && commanderCount !== profile.commander.exactCount) warnings.push(`${profile.label} requires exactly ${profile.commander.exactCount} commander card.`);
  if (!profile.commander.required && commanderCount > 0) warnings.push(`${profile.label} does not use a separate commander section.`);
  if (profile.commander.required && commanderGroups.length > 1) warnings.push(`${profile.label} allows one separate commander card, not multiple commander identities.`);
  physicalGroups.forEach((group) => {
    const basic = basicClassification(group.normalizedRecord);
    if (basic === null) {
      warnings.push(`${group.enteredName} basic/non-basic classification is unresolved.`);
      return;
    }
    if (!basic && group.quantity > profile.copyLimit.maxCopies) warnings.push(`${group.enteredName} appears ${group.quantity} times; ${profile.label} allows at most ${profile.copyLimit.maxCopies} copies of a non-basic card.`);
  });
  const copyTotals = new Map();
  physicalGroups.forEach((group) => {
    const key = normalizeName(group.identity?.sourceIdentifier ?? group.identity?.canonicalName ?? group.enteredName);
    const current = copyTotals.get(key) ?? { quantity: 0, basic: true, known: false, name: group.enteredName };
    const basic = basicClassification(group.normalizedRecord);
    current.quantity += group.quantity;
    current.basic = current.basic && basic === true;
    current.known = current.known || basic !== null;
    copyTotals.set(key, current);
  });
  copyTotals.forEach((total) => {
    if (total.known && !total.basic && total.quantity > profile.copyLimit.maxCopies) warnings.push(`${total.name} exceeds the ${profile.label} non-basic copy limit after identity aggregation.`);
  });
  commanderGroups.forEach((group) => {
    if (profile.commander.required && group.quantity > profile.commander.exactCount) warnings.push(`${group.enteredName} appears ${group.quantity} times in the commander section; only one commander copy is allowed.`);
    const commanderKey = normalizeName(group.identity?.sourceIdentifier ?? group.identity?.canonicalName ?? group.enteredName);
    if (profile.commander.required && physicalGroups.some((mainGroup) => normalizeName(mainGroup.identity?.sourceIdentifier ?? mainGroup.identity?.canonicalName ?? mainGroup.enteredName) === commanderKey)) warnings.push(`${group.enteredName} appears in both the commander section and the main deck.`);
  });
  return [...new Set(warnings)];
}

export function validateDeckStructure(deck, entries, physicalGroups = [], commanderGroups = []) {
  const warnings = [...(deck?.validationWarnings ?? [])];
  const parseFailures = entries.filter((entry) => !['parsed', 'empty'].includes(entry.parseStatus));
  if (parseFailures.length) warnings.push(`${parseFailures.length} deck line${parseFailures.length === 1 ? '' : 's'} need review.`);
  return [...new Set([...warnings, ...validateFormatRules(deck, entries, physicalGroups, commanderGroups)])];
}

function unavailableProvider() {
  const failure = () => createProviderResponse({ status: 'failed', failure: createProviderFailure({ kind: 'unsupported', message: 'No card-data provider is available in this Miniapps.ai environment.', retryable: false, providerKey: 'unavailable' }) });
  return createProviderContract({
    providerKey: 'unavailable',
    resolveCandidates: async () => failure(),
    retrieveCard: async () => failure(),
    retrieveFaces: async () => failure(),
    retrieveLegality: async () => failure(),
    getSourceMetadata: async () => createSourceMetadata({ providerKey: 'unavailable', freshness: 'unavailable', error: 'No card-data provider is available.' }),
    retrieveCached: async () => failure(),
  });
}

export function detectCardProvider() {
  const candidate = globalThis.manaAnalyzerCardProvider;
  const names = ['resolveCandidates', 'retrieveCard', 'retrieveFaces', 'retrieveLegality', 'getSourceMetadata', 'retrieveCached'];
  if (candidate && names.every((name) => typeof candidate[name] === 'function')) return candidate;
  return unavailableProvider();
}

function makeFact({ subjectId, factType, value, evidenceKind, derivationKind, reviewState, evidence, sourceMetadataId = null, isUserOverride = false, supersedesAssertionId = null }) {
  const evidenceRecord = createEvidenceRecord({ evidenceKind, sourceMetadataId, sourceField: evidence?.sourceField ?? factType, exactText: evidence?.exactText ?? null, structuredValue: evidence?.structuredValue ?? value, printingIdentity: evidence?.printingIdentity ?? null, retrievalTimestamp: evidence?.retrievalTimestamp ?? null, relatedUserInput: evidence?.relatedUserInput ?? null });
  const provenance = createProvenance({ evidenceKind, derivationKind, reviewState, sourceMetadataId, evidenceIds: [evidenceRecord.evidenceId], isUserOverride });
  const assertion = createFactAssertion({ subjectId, factType, rawValue: value, normalizedValue: value, provenance, evidenceIds: [evidenceRecord.evidenceId], supersedesAssertionId });
  return { evidenceRecord, assertion };
}

function addAssertion(state, factBundle) {
  state.evidence.push(factBundle.evidenceRecord);
  state.assertions.push(factBundle.assertion);
  return factBundle.assertion;
}

function fact(state, subjectId, factType) {
  return state.assertions.filter((assertion) => assertion.subjectId === subjectId && assertion.factType === factType && assertion.isActive !== false);
}

function sourceEvidence(sourceMetadata, sourceField, value, exactText = null) {
  return { sourceField, structuredValue: value, exactText, printingIdentity: sourceMetadata?.printingIdentity ?? null, retrievalTimestamp: sourceMetadata?.retrievedAt ?? null };
}

function faceSourceData(record) {
  if (Array.isArray(record?.faces) && record.faces.length) return record.faces;
  return [{ name: record?.name ?? record?.canonicalName ?? null, manaCost: record?.manaCost ?? null, manaValue: record?.manaValue ?? null, typeLine: record?.typeLine ?? null, supertypes: record?.supertypes ?? [], rulesText: record?.rulesText ?? null, modes: record?.modes ?? [] }];
}

function normalizeRecord(raw, group, physical, sourceMetadata) {
  const record = raw ?? {};
  const normalized = createNormalizedCardRecord({
    physicalCardId: physical.physicalCardId,
    identityId: physical.identityId,
    canonicalName: clean(record.canonicalName ?? record.name) ?? group.enteredName,
    enteredName: group.enteredName,
    setCode: clean(record.setCode ?? group.setCode),
    collectorNumber: clean(record.collectorNumber ?? group.collectorNumber),
    sourceIdentifier: clean(record.sourceIdentifier ?? record.id),
    layout: clean(record.layout),
    name: clean(record.name ?? record.canonicalName),
    manaCost: record.manaCost ?? null,
    manaValue: record.manaValue ?? null,
    typeLine: record.typeLine ?? null,
    supertypes: Array.isArray(record.supertypes) ? record.supertypes : [],
    basicLand: typeof record.basicLand === 'boolean' ? record.basicLand : typeof record.isBasicLand === 'boolean' ? record.isBasicLand : null,
    rulesText: record.rulesText ?? null,
    faces: [],
    modes: Array.isArray(record.modes) ? clone(record.modes) : [],
    legality: record.legality ?? null,
    landEntryOptions: Array.isArray(record.landEntryOptions) ? clone(record.landEntryOptions) : [],
    sourceMetadataId: sourceMetadata?.sourceMetadataId ?? null,
    status: 'partial',
  });
  return normalized;
}

function addDirectRecordFacts(state, group, normalized, sourceMetadata, evidenceKind = 'source', reviewState = 'accepted') {
  const sourceId = sourceMetadata?.sourceMetadataId ?? null;
  const evidenceBase = (field, value, exactText = null) => sourceEvidence(sourceMetadata, field, value, exactText);
  const add = (subjectId, factType, value, field, exactText = null, derivationKind = 'direct') => {
    if (value === null || value === undefined || value === '') return null;
    const bundle = makeFact({ subjectId, factType, value, evidenceKind, derivationKind, reviewState, sourceMetadataId: sourceId, evidence: evidenceBase(field, value, exactText) });
    const assertion = addAssertion(state, bundle);
    normalized.factAssertionIds.push(assertion.assertionId);
    normalized.evidenceIds.push(...assertion.evidenceIds);
    return assertion;
  };
  add(normalized.recordId, 'card_name', normalized.name ?? normalized.canonicalName, 'name');
  add(normalized.recordId, 'printed_mana_cost', normalized.manaCost, 'manaCost');
  add(normalized.recordId, 'printed_mana_value', normalized.manaValue, 'manaValue');
  add(normalized.recordId, 'type_line', normalized.typeLine, 'typeLine');
  add(normalized.recordId, 'rules_text', normalized.rulesText, 'rulesText');
  if (normalized.legality !== null) add(normalized.recordId, 'format_legality', normalized.legality, 'legality');
  const basicLand = recordBasicFlag(normalized, sourceMetadata, state);
  if (basicLand !== null) {
    normalized.basicLand = basicLand;
    add(normalized.recordId, 'basic_land_classification', basicLand, 'basicLand');
  }
  if (normalized.manaValue === null && normalized.manaCost !== null) {
    const computed = deriveManaValue(normalized.manaCost);
    if (computed !== null) add(normalized.recordId, 'printed_mana_value', computed, 'manaValue', null, 'computed');
    normalized.manaValue = computed;
  }
  normalized.status = normalized.name && normalized.typeLine !== null ? 'complete' : 'partial';
}

function recordBasicFlag(normalized, sourceMetadata, state) {
  const raw = state._normalizingRaw;
  if (typeof raw?.basicLand === 'boolean') return raw.basicLand;
  if (typeof raw?.isBasicLand === 'boolean') return raw.isBasicLand;
  return null;
}

function deriveManaValue(manaCost) {
  if (typeof manaCost !== 'string' || !manaCost.trim()) return null;
  const tokens = manaCost.match(/\{([^}]+)\}/g) ?? [];
  if (!tokens.length) return 0;
  return tokens.reduce((total, token) => {
    const symbol = token.slice(1, -1).toUpperCase();
    if (/^\d+$/.test(symbol)) return total + Number(symbol);
    if (symbol === 'X' || symbol === 'Y' || symbol === 'Z') return total;
    if (symbol.includes('/')) return total + 1;
    if (symbol === 'C' || /^[WUBRG]$/.test(symbol)) return total + 1;
    return total + 1;
  }, 0);
}

function buildFaces(state, group, physical, normalized, raw, sourceMetadata, evidenceKind, reviewState) {
  const faces = faceSourceData(raw);
  normalized.faces = faces.map((face) => {
    const faceRecord = createCardFace({ physicalCardId: physical.physicalCardId, faceName: face.name ?? group.enteredName, faceType: face.type ?? 'unknown', raw: face, normalized: { manaCost: face.manaCost ?? null, manaValue: face.manaValue ?? null, typeLine: face.typeLine ?? null, supertypes: face.supertypes ?? [], rulesText: face.rulesText ?? null }, modeIds: [] });
    physical.faceIds.push(faceRecord.faceId);
    const addFace = (factType, value, field) => {
      if (value === null || value === undefined || value === '') return;
      const bundle = makeFact({ subjectId: faceRecord.faceId, factType, value, evidenceKind, derivationKind: 'direct', reviewState, sourceMetadataId: sourceMetadata?.sourceMetadataId ?? null, evidence: sourceEvidence(sourceMetadata, field, value) });
      const assertion = addAssertion(state, bundle);
      faceRecord.factAssertionIds.push(assertion.assertionId);
      normalized.factAssertionIds.push(assertion.assertionId);
      normalized.evidenceIds.push(...assertion.evidenceIds);
    };
    addFace('face_name', face.name ?? null, 'faces.name');
    addFace('printed_mana_cost', face.manaCost ?? null, 'faces.manaCost');
    addFace('printed_mana_value', face.manaValue ?? null, 'faces.manaValue');
    addFace('type_line', face.typeLine ?? null, 'faces.typeLine');
    addFace('rules_text', face.rulesText ?? null, 'faces.rulesText');
    state.faces.push(faceRecord);
    return faceRecord;
  });
}

function setPhysicalStatus(state, group, identity, normalized) {
  group.physical.identityId = identity.identityId;
  group.physical.identityStatus = identity.identityStatus;
  group.physical.faceIds = normalized.faces.map((face) => face.faceId);
  group.physical.factAssertionIds = normalized.factAssertionIds.slice();
  group.identity = identity;
  group.normalizedRecord = normalized;
}

async function resolveGroup(state, group, provider) {
  const cache = state.cache.find((item) => item.deckId === state.deck.deckId && item.identityId && (item.record?.enteredNameKey === group.key || normalizeName(item.record?.enteredName) === normalizeName(group.enteredName)));
  if (cache?.record?.normalizedRecord) {
    group.normalizedRecord = cache.record.normalizedRecord;
    group.identity = state.identities.find((item) => item.identityId === group.normalizedRecord.identityId) ?? null;
    group.physical.identityId = group.normalizedRecord.identityId;
    group.physical.identityStatus = 'confirmed';
    if (cache.freshness === 'stale') group.reviewMessage = 'Cached card data is stale and should be refreshed before trusted analysis.';
    return { status: 'cache_hit', group };
  }
  let response = await provider.resolveCandidates(createCardResolutionRequest({ enteredName: group.enteredName, setCode: group.setCode, collectorNumber: group.collectorNumber, deckId: state.deck.deckId }));
  if (response.status === 'ok' && !response.data && response.candidates?.length === 1) {
    const candidate = response.candidates[0];
    const recordResponse = await provider.retrieveCard(createCardRecordRequest({ identityId: candidate.identityId ?? null, sourceIdentifier: candidate.sourceIdentifier ?? null, deckId: state.deck.deckId }));
    if (recordResponse.status === 'ok') response = { ...recordResponse, candidates: response.candidates };
  }
  if (response.status === 'ok' && response.data) {
    const metadata = response.sourceMetadata ?? createSourceMetadata({ providerKey: provider.providerKey, freshness: 'current', retrievedAt: now() });
    let raw = response.data;
    if ((!Array.isArray(raw.faces) || !raw.faces.length) && typeof provider.retrieveFaces === 'function') {
      try {
        const faceResponse = await provider.retrieveFaces(createCardRecordRequest({ identityId: raw.identityId ?? raw.id ?? null, sourceIdentifier: raw.sourceIdentifier ?? raw.id ?? null, deckId: state.deck.deckId }));
        if (faceResponse.status === 'ok' && faceResponse.data) raw = { ...raw, faces: faceResponse.data.faces ?? faceResponse.data };
      } catch { /* Face retrieval is optional; missing faces remain unknown. */ }
    }
    if (raw.legality === undefined && typeof provider.retrieveLegality === 'function') {
      try {
        const legalityResponse = await provider.retrieveLegality(createCardRecordRequest({ identityId: raw.identityId ?? raw.id ?? null, sourceIdentifier: raw.sourceIdentifier ?? raw.id ?? null, deckId: state.deck.deckId }));
        if (legalityResponse.status === 'ok') raw = { ...raw, legality: legalityResponse.data?.legality ?? legalityResponse.data ?? null };
      } catch { /* Legality is informational and must not block the pipeline. */ }
    }
    const identity = createCardIdentity({ enteredName: group.enteredName, canonicalName: raw.canonicalName ?? raw.name ?? group.enteredName, setCode: raw.setCode ?? group.setCode, collectorNumber: raw.collectorNumber ?? group.collectorNumber, sourceIdentifier: raw.sourceIdentifier ?? raw.id ?? null, identityStatus: 'confirmed', sourceMetadataId: metadata.sourceMetadataId });
    const normalized = normalizeRecord(raw, group, group.physical, metadata);
    state._normalizingRaw = raw;
    addDirectRecordFacts(state, group, normalized, metadata);
    buildFaces(state, group, group.physical, normalized, raw, metadata, 'source', 'accepted');
    delete state._normalizingRaw;
    state.identities.push(identity);
    state.sources.push(metadata);
    setPhysicalStatus(state, group, identity, normalized);
    const cacheRecord = createCacheRecord({ deckId: state.deck.deckId, identityId: identity.identityId, sourceMetadataId: metadata.sourceMetadataId, normalizedRecordId: normalized.recordId, record: { enteredName: group.enteredName, enteredNameKey: group.key, normalizedRecord: normalized }, freshness: metadata.freshness, deckScoped: true });
    state.cache.push(cacheRecord);
    return { status: 'resolved', group };
  }
  if (response.status === 'ambiguous' || response.candidates?.length > 1) {
    group.candidates = (response.candidates ?? []).map((candidate) => createCardCandidate(candidate));
    group.physical.identityStatus = 'candidates_available';
    group.reviewMessage = response.ambiguityReason ?? 'Multiple card identities require selection.';
    return { status: 'ambiguous', group };
  }
  group.physical.identityStatus = response.status === 'failed' ? 'unknown' : 'unresolved';
  group.reviewMessage = response.failure?.message ?? 'No verified card record was available.';
  if (response.failure) state.providerFailures.push(response.failure);
  return { status: response.status === 'failed' ? 'provider_unavailable' : 'unresolved', group };
}

export async function resolveDeck(state, provider = detectCardProvider()) {
  state.providerFailures = Array.isArray(state.providerFailures) ? state.providerFailures : [];
  const allGroups = [...(state.physicalGroups ?? []), ...(state.commanderGroups ?? [])];
  const unique = new Map(allGroups.map((group) => [group.key, group]));
  const results = [];
  for (const group of unique.values()) {
    try {
      results.push(await resolveGroup(state, group, provider));
    } catch (error) {
      group.physical.identityStatus = 'unknown';
      group.reviewMessage = 'Card resolution failed safely; no fact was invented.';
      results.push({ status: 'error', group, error: String(error?.message ?? error) });
    }
  }
  state.provider = { key: provider.providerKey, available: provider.providerKey !== 'unavailable', checkedAt: now(), failures: state.providerFailures.length };
  state.deck.validationWarnings = validateDeckStructure(state.deck, state.entries, state.physicalGroups, state.commanderGroups);
  state.results = results.map(({ status, group }) => ({ status, physicalCardId: group.physical.physicalCardId }));
  return state;
}

function activeFact(state, subjectId, factType) {
  return chooseActiveAssertion(fact(state, subjectId, factType), { inclusionMode: 'verified_computed_user_confirmed' });
}

export function applyUserCardFacts(state, physicalCardId, input = {}) {
  const group = [...(state.physicalGroups ?? []), ...(state.commanderGroups ?? [])].find((item) => item.physical.physicalCardId === physicalCardId);
  if (!group) throw new Error('Card not found in this submitted deck.');
  const enteredName = clean(input.canonicalName) ?? group.enteredName;
  const existingIdentity = group.identity;
  const identity = existingIdentity ?? createCardIdentity({ enteredName: group.enteredName, canonicalName: enteredName, setCode: clean(input.setCode) ?? group.setCode, collectorNumber: clean(input.collectorNumber) ?? group.collectorNumber, identityStatus: 'confirmed' });
  identity.canonicalName = enteredName;
  identity.setCode = clean(input.setCode) ?? identity.setCode;
  identity.collectorNumber = clean(input.collectorNumber) ?? identity.collectorNumber;
  identity.identityStatus = 'confirmed';
  if (!existingIdentity) state.identities.push(identity);
  group.identity = identity;
  group.physical.identityId = identity.identityId;
  group.physical.identityStatus = 'confirmed';
  const current = group.normalizedRecord ?? createNormalizedCardRecord({ physicalCardId, identityId: identity.identityId, enteredName: group.enteredName, status: 'partial' });
  current.identityId = identity.identityId;
  current.canonicalName = enteredName;
  current.name = clean(input.name) ?? enteredName;
  current.enteredName = group.enteredName;
  current.setCode = clean(input.setCode) ?? current.setCode ?? group.setCode;
  current.collectorNumber = clean(input.collectorNumber) ?? current.collectorNumber ?? group.collectorNumber;
  const fields = [
    ['card_name', 'name', current.name], ['printed_mana_cost', 'manaCost', clean(input.manaCost)], ['printed_mana_value', 'manaValue', input.manaValue === '' || input.manaValue === undefined ? null : Number(input.manaValue)],
    ['type_line', 'typeLine', clean(input.typeLine)], ['rules_text', 'rulesText', input.rulesText ?? null], ['basic_land_classification', 'basicLand', typeof input.basicLand === 'boolean' ? input.basicLand : null], ['format_legality', 'legality', input.legality ?? null],
  ];
  fields.forEach(([factType, field, value]) => {
    if (value === null || value === undefined || value === '' || (field === 'manaValue' && Number.isNaN(value))) return;
    const previous = activeFact(state, current.recordId, factType)?.assertion ?? null;
    if (previous) previous.isActive = false;
    const bundle = makeFact({ subjectId: current.recordId, factType, value, evidenceKind: 'user', derivationKind: 'direct', reviewState: 'accepted', isUserOverride: Boolean(previous), supersedesAssertionId: previous?.assertionId ?? null, evidence: { sourceField: `user.${field}`, structuredValue: value, exactText: typeof value === 'string' ? value : null, relatedUserInput: { field, value } } });
    const assertion = addAssertion(state, bundle);
    current.factAssertionIds.push(assertion.assertionId);
    current.evidenceIds.push(...assertion.evidenceIds);
    if (previous) {
      state.overrides.push(createUserOverride({ targetType: 'fact', targetId: previous.assertionId, originalAssertionId: previous.assertionId, newAssertionId: assertion.assertionId, action: 'correct', originalValue: previous.normalizedValue, newValue: value, explanation: input.explanation ?? '' }));
      if (JSON.stringify(previous.normalizedValue) !== JSON.stringify(value)) {
        const conflict = createConflict({ subjectType: 'fact', subjectId: current.recordId, assertionIds: [previous.assertionId, assertion.assertionId], conflictType: 'user_source_value_mismatch', explanation: input.explanation || 'User evidence differs from an earlier active value.' });
        state.conflicts.push(conflict);
        previous.conflictIds = [...new Set([...(previous.conflictIds ?? []), conflict.conflictId])];
        assertion.conflictIds = [conflict.conflictId];
      }
    }
    if (field === 'basicLand') current.basicLand = value;
  });
  current.status = current.name && current.typeLine !== null ? 'complete' : 'partial';
  group.normalizedRecord = current;
  group.physical.factAssertionIds = current.factAssertionIds.slice();
  state.deck.validationWarnings = validateDeckStructure(state.deck, state.entries, state.physicalGroups, state.commanderGroups);
  return state;
}

export function applyCandidateSelection(state, physicalCardId, candidateId) {
  const group = [...(state.physicalGroups ?? []), ...(state.commanderGroups ?? [])].find((item) => item.physical.physicalCardId === physicalCardId);
  const candidate = group?.candidates?.find((item) => item.candidateId === candidateId);
  if (!group || !candidate) throw new Error('Candidate is not available for this submitted card.');
  const identity = createCardIdentity({ enteredName: group.enteredName, canonicalName: candidate.canonicalName, setCode: candidate.setCode, collectorNumber: candidate.collectorNumber, sourceIdentifier: candidate.sourceIdentifier, candidateIds: [candidate.candidateId], identityStatus: 'confirmed', sourceMetadataId: candidate.sourceMetadataId });
  group.identity = identity;
  group.physical.identityId = identity.identityId;
  group.physical.identityStatus = 'confirmed';
  group.normalizedRecord = createNormalizedCardRecord({ physicalCardId: group.physical.physicalCardId, identityId: identity.identityId, canonicalName: candidate.canonicalName, enteredName: group.enteredName, setCode: candidate.setCode, collectorNumber: candidate.collectorNumber, sourceIdentifier: candidate.sourceIdentifier, layout: candidate.layout, status: 'unresolved' });
  state.identities.push(identity);
  return state;
}

export function createPipelineState(originalText = '', { format = FORMAT_PROFILES.STANDARD_CONSTRUCTED } = {}) {
  const parsed = parseDeckText(originalText, { format });
  const physicalGroups = aggregatePhysicalCards(parsed.entries, 'main');
  const commanderGroups = aggregatePhysicalCards(parsed.entries, 'commander');
  return {
    pipelineSchema: PIPELINE_SCHEMA, deck: parsed.deck, entries: parsed.entries, physicalGroups, commanderGroups,
    identities: [], faces: [], sources: [], evidence: [], assertions: [], overrides: [], conflicts: [], cache: [], providerFailures: [], results: [],
    provider: { key: 'unavailable', available: false, checkedAt: null },
    updatedAt: now(),
  };
}

export function summary(state) {
  const groups = state?.physicalGroups ?? [];
  return { format: state?.deck?.format ?? FORMAT_PROFILES.STANDARD_CONSTRUCTED, mainDeckCardCount: state?.deck?.mainDeckCardCount ?? 0, commanderCardCount: state?.deck?.commanderCardCount ?? 0, uniqueCards: groups.length, commanderUniqueCards: (state?.commanderGroups ?? []).length, confirmed: groups.filter((group) => group.physical.identityStatus === 'confirmed').length, ambiguous: groups.filter((group) => ['candidates_available', 'user_selection_required'].includes(group.physical.identityStatus)).length, unresolved: groups.filter((group) => ['unresolved', 'unknown'].includes(group.physical.identityStatus)).length, parseIssues: (state?.entries ?? []).filter((entry) => ['invalid', 'unsupported'].includes(entry.parseStatus)).length, warnings: state?.deck?.validationWarnings?.length ?? 0 };
}

export async function savePipelineState(state) {
  if (!globalThis.miniappsAI?.storage?.setItem) return { saved: false, reason: 'storage_unavailable' };
  try {
    const envelope = createPersistenceEnvelope({ data: { ...state, _normalizingRaw: undefined } });
    await globalThis.miniappsAI.storage.setItem(PIPELINE_STORAGE_KEY, JSON.stringify(envelope));
    return { saved: true };
  } catch (error) {
    return { saved: false, reason: error?.message ?? 'storage_error' };
  }
}

function migratePipelineState(data) {
  const state = data && typeof data === 'object' ? data : null;
  if (!state) return null;
  state.pipelineSchema = PIPELINE_SCHEMA;
  state.deck = state.deck ?? {};
  state.deck.format = state.deck.format ?? FORMAT_PROFILES.STANDARD_CONSTRUCTED;
  state.deck.commanderEntryIds = Array.isArray(state.deck.commanderEntryIds) ? state.deck.commanderEntryIds : [];
  state.deck.commanderCardCount = Number.isInteger(state.deck.commanderCardCount) ? state.deck.commanderCardCount : 0;
  state.commanderGroups = Array.isArray(state.commanderGroups) ? state.commanderGroups : [];
  return state;
}

export async function loadPipelineState() {
  if (!globalThis.miniappsAI?.storage?.getItem) return { state: null, reason: 'storage_unavailable' };
  try {
    const raw = await globalThis.miniappsAI.storage.getItem(PIPELINE_STORAGE_KEY);
    if (!raw) return { state: null, reason: 'empty' };
    const envelope = migratePersistenceEnvelope(JSON.parse(raw));
    return { state: envelope.data?.pipelineSchema ? migratePipelineState(envelope.data) : null, reason: 'loaded' };
  } catch (error) {
    return { state: null, reason: error?.message ?? 'storage_error' };
  }
}

export async function runPhase2SelfAudit() {
  const parsed = parseDeckText('4 Forest\n4 Forest\n1 Example (SET) 1\n\nSideboard:\n2 Other Card\nnot a card');
  const grouped = aggregatePhysicalCards(parsed.entries);
  const constructedFixture = parseDeckText('4 Nonbasic Card', { format: FORMAT_PROFILES.STANDARD_CONSTRUCTED });
  const constructedWarnings = validateFormatRules(constructedFixture.deck, constructedFixture.entries, [{ enteredName: 'Nonbasic Card', quantity: 4, normalizedRecord: { basicLand: false } }], []);
  const singletonFixture = parseDeckText('2 Nonbasic Card', { format: FORMAT_PROFILES.STANDARD_SINGLETON });
  const singletonWarnings = validateFormatRules(singletonFixture.deck, singletonFixture.entries, [{ enteredName: 'Nonbasic Card', quantity: 2, normalizedRecord: { basicLand: false } }], []);
  const brawlFixture = parseDeckText('59 Plains\nCommander:\n1 Commander Card', { format: FORMAT_PROFILES.STANDARD_BRAWL });
  const brawlCommanderGroups = aggregatePhysicalCards(brawlFixture.entries, 'commander');
  const brawlWarnings = validateFormatRules(brawlFixture.deck, brawlFixture.entries, aggregatePhysicalCards(brawlFixture.entries, 'main'), brawlCommanderGroups);
  const manualState = createPipelineState('1 Sample Card');
  const manualGroup = manualState.physicalGroups[0];
  applyUserCardFacts(manualState, manualGroup.physical.physicalCardId, { canonicalName: 'Sample Card', manaCost: '{G}', manaValue: 1, typeLine: 'Creature', rulesText: 'Sample text', basicLand: false });
  const originalAssertionCount = manualState.assertions.length;
  applyUserCardFacts(manualState, manualGroup.physical.physicalCardId, { canonicalName: 'Sample Card', manaCost: '{1}', manaValue: 1, typeLine: 'Creature', rulesText: 'Sample text', basicLand: false });
  const sourceMetadata = createSourceMetadata({ providerKey: 'phase2-test', sourceRecordId: 'sample-1', sourceVersion: 'fixture', retrievedAt: now(), freshness: 'current' });
  const fixtureRecord = { id: 'sample-1', name: 'Fixture Card', canonicalName: 'Fixture Card', manaCost: '{1}{G}', manaValue: 2, typeLine: 'Creature', rulesText: 'Fixture text', basicLand: false, faces: [{ name: 'Fixture Card', manaCost: '{1}{G}', manaValue: 2, typeLine: 'Creature', rulesText: 'Fixture text' }] };
  const fixtureProvider = createProviderContract({
    providerKey: 'phase2-test',
    resolveCandidates: async () => createProviderResponse({ status: 'ok', data: fixtureRecord, sourceMetadata }),
    retrieveCard: async () => createProviderResponse({ status: 'ok', data: fixtureRecord, sourceMetadata }),
    retrieveFaces: async () => createProviderResponse({ status: 'ok', data: { faces: fixtureRecord.faces }, sourceMetadata }),
    retrieveLegality: async () => createProviderResponse({ status: 'ok', data: { legality: { standard: 'legal' } }, sourceMetadata }),
    getSourceMetadata: async () => sourceMetadata,
    retrieveCached: async () => createProviderResponse({ status: 'not_found', sourceMetadata }),
  });
  const providerState = createPipelineState('1 Fixture Card');
  await resolveDeck(providerState, fixtureProvider);
  const firstResolution = providerState.results[0]?.status === 'resolved' && providerState.assertions.some((item) => item.factType === 'printed_mana_cost' && item.provenance.evidenceKind === 'source');
  await resolveDeck(providerState, fixtureProvider);
  const cacheHit = providerState.results[0]?.status === 'cache_hit';
  providerState.cache[0].freshness = 'stale';
  await resolveDeck(providerState, fixtureProvider);
  const staleReview = providerState.physicalGroups[0].reviewMessage?.includes('stale') === true;
  const checks = [
    ['duplicate aggregation', grouped.find((item) => item.enteredName === 'Forest')?.quantity === 8],
    ['constructed profile allows four non-basic copies', !constructedWarnings.some((warning) => warning.includes('at most 4 copies'))],
    ['singleton profile applies one-copy limit', singletonWarnings.some((warning) => warning.includes('at most 1 copy'))],
    ['brawl profile preserves commander section', brawlFixture.deck.format === FORMAT_PROFILES.STANDARD_BRAWL && brawlFixture.deck.commanderCardCount === 1 && brawlCommanderGroups.length === 1],
    ['brawl profile validates 59 plus commander structure', !brawlWarnings.some((warning) => warning.includes('main deck has') || warning.includes('requires exactly'))],
    ['blank preservation', parsed.entries.some((entry) => entry.parseStatus === 'empty')],
    ['malformed preservation', parsed.entries.some((entry) => entry.parseStatus === 'invalid')],
    ['sideboard exclusion', parsed.deck.mainDeckCardCount === 9],
    ['no provider fallback', detectCardProvider().providerKey === 'unavailable'],
    ['manual evidence assertions', originalAssertionCount > 0 && manualState.evidence.length > 0],
    ['override preserves history', manualState.assertions.length > originalAssertionCount && manualState.overrides.length > 0],
    ['conflict is represented', manualState.conflicts.length > 0],
    ['provider source normalization', firstResolution],
    ['deck-scoped cache hit', cacheHit],
    ['stale cache is visible', staleReview],
  ];
  return { passed: checks.every(([, passed]) => passed), checks };
}
