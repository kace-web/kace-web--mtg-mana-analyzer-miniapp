import { CONTRACTS } from './contracts.js';

const { formatProfiles: FORMAT_PROFILES, getFormatProfile } = CONTRACTS;
export const CALCULATOR_SCHEMA_VERSION = 3;
export const SCENARIO_STORAGE_KEY = 'manaAnalyzer.phase3.scenarios';

const t = (key, values) => window.miniappI18n?.t(key, values) ?? key;
const numberValue = (value, fallback = 0, min = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(min, parsed) : fallback;
};
const integerValue = (value, fallback = 0, min = 0) => Math.floor(numberValue(value, fallback, min));
const clone = (value) => JSON.parse(JSON.stringify(value));

export const CALCULATORS = Object.freeze({
  probability: { labelKey: 'calculators.types.probability', categoryKey: 'calculators.categories.probability', methods: ['hypergeometric'] },
  multiCard: { labelKey: 'calculators.types.multiCard', categoryKey: 'calculators.categories.probability', methods: ['hypergeometric'] },
  manaPips: { labelKey: 'calculators.types.manaPips', categoryKey: 'calculators.categories.mana', methods: ['pip_distribution', 'colored_source', 'karsten_source', 'exact_hypergeometric', 'untapped_source', 'simulation'] },
  sourceProbability: { labelKey: 'calculators.types.sourceProbability', categoryKey: 'calculators.categories.mana', methods: ['exact_hypergeometric', 'karsten_source', 'untapped_source', 'simulation'] },
  landPlayability: { labelKey: 'calculators.types.landPlayability', categoryKey: 'calculators.categories.mana', methods: ['land_classification'] },
  ramp: { labelKey: 'calculators.types.ramp', categoryKey: 'calculators.categories.mana', methods: ['deterministic_progression'] },
  pay2Life: { labelKey: 'calculators.types.pay2Life', categoryKey: 'calculators.categories.advanced', methods: ['exact_hypergeometric'] },
});

const METHOD_KEYS = Object.freeze({
  hypergeometric: 'calculators.methods.hypergeometric',
  pip_distribution: 'calculators.methods.pipDistribution',
  colored_source: 'calculators.methods.coloredSource',
  karsten_source: 'calculators.methods.karstenSource',
  exact_hypergeometric: 'calculators.methods.exactHypergeometric',
  untapped_source: 'calculators.methods.untappedSource',
  simulation: 'calculators.methods.simulation',
  land_classification: 'calculators.methods.landClassification',
  deterministic_progression: 'calculators.methods.deterministicProgression',
});

const METHOD_EXPLANATIONS = Object.freeze({
  hypergeometric: 'calculators.explanations.hypergeometric',
  pip_distribution: 'calculators.explanations.pipDistribution',
  colored_source: 'calculators.explanations.coloredSource',
  karsten_source: 'calculators.explanations.karstenSource',
  exact_hypergeometric: 'calculators.explanations.exactHypergeometric',
  untapped_source: 'calculators.explanations.untappedSource',
  simulation: 'calculators.explanations.simulation',
  land_classification: 'calculators.explanations.landClassification',
  deterministic_progression: 'calculators.explanations.deterministicProgression',
});

const FIELD_DEFS = {
  probability: [
    ['deckSize', 'calculators.fields.deckSize', 'number', 1, 1], ['copies', 'calculators.fields.copies', 'number', 0, 1],
    ['cardsDrawn', 'calculators.fields.cardsDrawn', 'number', 0, 1], ['desired', 'calculators.fields.desired', 'number', 0, 1], ['maximum', 'calculators.fields.maximum', 'number', 0, 1],
    ['relation', 'calculators.fields.relation', 'select', null, null], ['turn', 'calculators.fields.turn', 'number', 1, 1],
    ['playDraw', 'calculators.fields.playDraw', 'select', null, null], ['openingHandSize', 'calculators.fields.openingHandSize', 'number', 0, 1],
    ['drawsPerTurn', 'calculators.fields.drawsPerTurn', 'number', 0, 1],
  ],
  multiCard: [
    ['deckSize', 'calculators.fields.deckSize', 'number', 1, 1], ['copies', 'calculators.fields.copies', 'number', 0, 1], ['secondCopies', 'calculators.fields.secondCopies', 'number', 0, 1],
    ['cardsDrawn', 'calculators.fields.cardsDrawn', 'number', 0, 1], ['desired', 'calculators.fields.desired', 'number', 0, 1], ['secondDesired', 'calculators.fields.secondDesired', 'number', 0, 1],
    ['turn', 'calculators.fields.turn', 'number', 1, 1], ['playDraw', 'calculators.fields.playDraw', 'select', null, null], ['openingHandSize', 'calculators.fields.openingHandSize', 'number', 0, 1], ['drawsPerTurn', 'calculators.fields.drawsPerTurn', 'number', 0, 1],
  ],
  sourceProbability: [
    ['deckSize', 'calculators.fields.deckSize', 'number', 1, 1], ['qualifyingSources', 'calculators.fields.qualifyingSources', 'number', 0, 1],
    ['untappedSources', 'calculators.fields.untappedSources', 'number', 0, 1],
    ['cardsDrawn', 'calculators.fields.cardsDrawn', 'number', 0, 1], ['desired', 'calculators.fields.desired', 'number', 0, 1],
    ['turn', 'calculators.fields.turn', 'number', 1, 1], ['playDraw', 'calculators.fields.playDraw', 'select', null, null],
    ['openingHandSize', 'calculators.fields.openingHandSize', 'number', 0, 1], ['drawsPerTurn', 'calculators.fields.drawsPerTurn', 'number', 0, 1],
    ['targetProbability', 'calculators.fields.targetProbability', 'number', 50, 0.1], ['trials', 'calculators.fields.trials', 'number', 10000, 100],
  ],
  manaPips: [
    ['white', 'calculators.fields.whitePips', 'number', 0, 1], ['blue', 'calculators.fields.bluePips', 'number', 0, 1],
    ['black', 'calculators.fields.blackPips', 'number', 0, 1], ['red', 'calculators.fields.redPips', 'number', 0, 1],
    ['green', 'calculators.fields.greenPips', 'number', 0, 1], ['colorless', 'calculators.fields.colorlessPips', 'number', 0, 1],
    ['generic', 'calculators.fields.genericMana', 'number', 0, 1], ['totalLands', 'calculators.fields.totalLands', 'number', 24, 1],
    ['earlyWeighting', 'calculators.fields.earlyWeighting', 'number', 0, 0.1], ['targetProbability', 'calculators.fields.targetProbability', 'number', 90, 0.1],
  ],
  pay2Life: [
    ['deckSize', 'calculators.fields.deckSize', 'number', 1, 1], ['payLands', 'calculators.fields.pay2LifeLands', 'number', 0, 1], ['totalLands', 'calculators.fields.totalLands', 'number', 24, 1],
    ['turn', 'calculators.fields.turn', 'number', 10, 1], ['playDraw', 'calculators.fields.playDraw', 'select', null, null],
    ['openingHandSize', 'calculators.fields.openingHandSize', 'number', 7, 1], ['drawsPerTurn', 'calculators.fields.drawsPerTurn', 'number', 1, 1],
    ['decision', 'calculators.fields.lifeDecision', 'select', null, null], ['useRate', 'calculators.fields.useRate', 'number', 1, 0.05],
  ],
  landPlayability: [
    ['deckSize', 'calculators.fields.deckSize', 'number', 1, 1], ['totalLands', 'calculators.fields.totalLands', 'number', 0, 1],
    ['immediateLands', 'calculators.fields.immediateLands', 'number', 0, 1], ['tappedLands', 'calculators.fields.tappedLands', 'number', 0, 1],
    ['conditionalLands', 'calculators.fields.conditionalLands', 'number', 0, 1], ['utilityLands', 'calculators.fields.utilityLands', 'number', 0, 1],
    ['unknownLands', 'calculators.fields.unknownLands', 'number', 0, 1], ['coloredLands', 'calculators.fields.coloredLands', 'number', 0, 1],
    ['colorlessOnlyLands', 'calculators.fields.colorlessOnlyLands', 'number', 0, 1], ['multicolorLands', 'calculators.fields.multicolorLands', 'number', 0, 1],
    ['fetchLands', 'calculators.fields.fetchLands', 'number', 0, 1], ['mdfcLands', 'calculators.fields.mdfcLands', 'number', 0, 1],
    ['pay2LifeLands', 'calculators.fields.pay2LifeLands', 'number', 0, 1], ['turn', 'calculators.fields.turn', 'number', 1, 1],
    ['playabilityMode', 'calculators.fields.playabilityMode', 'select', null, null, 'playabilityMode'],
    ['includeConditional', 'calculators.fields.includeConditional', 'select', null, null, 'booleanInclude'],
    ['includeUtility', 'calculators.fields.includeUtility', 'select', null, null, 'booleanInclude'],
  ],
  ramp: [
    ['deckSize', 'calculators.fields.deckSize', 'number', 1, 1], ['baselineLands', 'calculators.fields.baselineLands', 'number', 0, 1],
    ['normalLandPlays', 'calculators.fields.normalLandPlays', 'number', 0, 1], ['turnHorizon', 'calculators.fields.turnHorizon', 'number', 1, 1],
    ['manaRocks', 'calculators.fields.manaRocks', 'number', 0, 1], ['manaDorks', 'calculators.fields.manaDorks', 'number', 0, 1],
    ['landRamp', 'calculators.fields.landRamp', 'number', 0, 1], ['extraLandDrops', 'calculators.fields.extraLandDrops', 'number', 0, 1],
    ['temporaryMana', 'calculators.fields.temporaryMana', 'number', 0, 1], ['costReduction', 'calculators.fields.costReduction', 'number', 0, 1],
    ['conditionalRamp', 'calculators.fields.conditionalRamp', 'number', 0, 1], ['delayedRamp', 'calculators.fields.delayedRamp', 'number', 0, 1],
    ['unknownRamp', 'calculators.fields.unknownRamp', 'number', 0, 1], ['earliestUsableTurn', 'calculators.fields.earliestUsableTurn', 'number', 1, 1],
    ['permanentSourceGain', 'calculators.fields.permanentSourceGain', 'number', 0, 1], ['temporaryManaAmount', 'calculators.fields.temporaryManaAmount', 'number', 0, 1],
    ['additionalLandDeployment', 'calculators.fields.additionalLandDeployment', 'number', 0, 1], ['costReductionAmount', 'calculators.fields.costReductionAmount', 'number', 0, 1],
    ['includeConditional', 'calculators.fields.includeConditional', 'select', null, null, 'booleanInclude'],
    ['includeDelayed', 'calculators.fields.includeDelayed', 'select', null, null, 'booleanInclude'],
    ['resolutionMode', 'calculators.fields.resolutionMode', 'select', null, null, 'rampResolution'],
  ],
};

const relationOptions = () => [['at_least', t('calculators.relations.atLeast')], ['exactly', t('calculators.relations.exactly')], ['at_most', t('calculators.relations.atMost')], ['range', t('calculators.relations.range')]];
const playDrawOptions = () => [['play', t('calculators.assumptions.play')], ['draw', t('calculators.assumptions.draw')]];
const decisionOptions = () => [['always', t('calculators.assumptions.alwaysPay')], ['never', t('calculators.assumptions.neverPay')], ['required', t('calculators.assumptions.payWhenRequired')], ['custom', t('calculators.assumptions.customDecision')]];
const booleanIncludeOptions = () => [['yes', t('calculators.assumptions.includeYes')], ['no', t('calculators.assumptions.includeNo')]];
const playabilityModeOptions = () => [['land_drop', t('calculators.assumptions.landDropPlayable')], ['mana_now', t('calculators.assumptions.manaUsableNow')]];
const rampResolutionOptions = () => [['assume_resolved', t('calculators.assumptions.assumeResolved')], ['inventory_only', t('calculators.assumptions.inventoryOnly')]];
const fieldOptionSets = { relation: relationOptions, playDraw: playDrawOptions, decision: decisionOptions, playabilityMode: playabilityModeOptions, booleanInclude: booleanIncludeOptions, rampResolution: rampResolutionOptions };

export function combinations(n, k) {
  n = integerValue(n); k = integerValue(k);
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let result = 1;
  for (let i = 1; i <= k; i += 1) result = result * (n - k + i) / i;
  return result;
}

export function hypergeometricExactly(population, successes, draws, wanted) {
  const n = integerValue(population); const s = integerValue(successes); const d = integerValue(draws); const x = integerValue(wanted);
  if (n <= 0 || s > n || d > n || x > s || d - x > n - s) return 0;
  return (combinations(s, x) * combinations(n - s, d - x)) / combinations(n, d);
}
export function hypergeometricAtLeast(population, successes, draws, wanted) {
  const max = Math.min(integerValue(successes), integerValue(draws));
  let total = 0; for (let x = integerValue(wanted); x <= max; x += 1) total += hypergeometricExactly(population, successes, draws, x);
  return Math.min(1, Math.max(0, total));
}
export function hypergeometricAtMost(population, successes, draws, wanted) {
  let total = 0; for (let x = 0; x <= integerValue(wanted); x += 1) total += hypergeometricExactly(population, successes, draws, x);
  return Math.min(1, Math.max(0, total));
}
export function hypergeometricRange(population, successes, draws, low, high) {
  let total = 0; for (let x = integerValue(low); x <= integerValue(high); x += 1) total += hypergeometricExactly(population, successes, draws, x);
  return Math.min(1, Math.max(0, total));
}
export function probabilityForRelation(inputs) {
  const relation = inputs.relation ?? 'at_least';
  if (relation === 'exactly') return hypergeometricExactly(inputs.deckSize, inputs.copies, inputs.cardsDrawn, inputs.desired);
  if (relation === 'at_most') return hypergeometricAtMost(inputs.deckSize, inputs.copies, inputs.cardsDrawn, inputs.desired);
  if (relation === 'range') return hypergeometricRange(inputs.deckSize, inputs.copies, inputs.cardsDrawn, inputs.desired, inputs.maximum ?? inputs.desired + 1);
  return hypergeometricAtLeast(inputs.deckSize, inputs.copies, inputs.cardsDrawn, inputs.desired);
}

export function probabilityForTwoRequirements({ deckSize, firstCopies, secondCopies, cardsDrawn, firstWanted = 1, secondWanted = 1 }) {
  const n = integerValue(deckSize); const a = integerValue(firstCopies); const b = integerValue(secondCopies); const d = integerValue(cardsDrawn);
  if (a + b > n || d > n) return 0;
  let total = 0;
  for (let first = integerValue(firstWanted); first <= Math.min(a, d); first += 1) {
    for (let second = integerValue(secondWanted); second <= Math.min(b, d - first); second += 1) total += combinations(a, first) * combinations(b, second) * combinations(n - a - b, d - first - second);
  }
  return total / combinations(n, d);
}

export function cardsByTurn({ turn, playDraw = 'play', openingHandSize = 7, drawsPerTurn = 1 }) {
  const drawTurns = playDraw === 'draw' ? integerValue(turn, 1, 0) : Math.max(0, integerValue(turn, 1, 0) - 1);
  return integerValue(openingHandSize, 7) + drawTurns * integerValue(drawsPerTurn, 1);
}

function simulateAtLeast({ deckSize, successes, draws, desired, trials = 10000, seed = 731 }) {
  let state = seed >>> 0; let hits = 0;
  const random = () => { state = (1664525 * state + 1013904223) >>> 0; return state / 4294967296; };
  for (let trial = 0; trial < trials; trial += 1) {
    const deck = Array.from({ length: integerValue(deckSize) }, (_, index) => index < integerValue(successes));
    for (let i = deck.length - 1; i > 0; i -= 1) { const j = Math.floor(random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    if (deck.slice(0, integerValue(draws)).filter(Boolean).length >= integerValue(desired)) hits += 1;
  }
  return hits / Math.max(1, integerValue(trials, 10000));
}

function validateInputs(type, inputs) {
  const errors = [];
  const deckSize = integerValue(inputs.deckSize); const draws = integerValue(inputs.cardsDrawn);
  if (['probability', 'sourceProbability'].includes(type) && deckSize < 1) errors.push(t('calculators.errors.deckSize'));
  if (['probability', 'sourceProbability'].includes(type) && draws > deckSize) errors.push(t('calculators.errors.draws'));
  if (type === 'probability' && integerValue(inputs.copies) > deckSize) errors.push(t('calculators.errors.copies'));
  if (type === 'multiCard' && integerValue(inputs.copies) + integerValue(inputs.secondCopies) > deckSize) errors.push(t('calculators.errors.comboCopies'));
  if (type === 'sourceProbability' && integerValue(inputs.qualifyingSources) > deckSize) errors.push(t('calculators.errors.sources'));
  if (type === 'sourceProbability' && integerValue(inputs.untappedSources) > deckSize) errors.push(t('calculators.errors.sources'));
  if (type === 'manaPips' && integerValue(inputs.totalLands) < 1) errors.push(t('calculators.errors.lands'));
  if (type === 'pay2Life' && integerValue(inputs.payLands) > integerValue(inputs.totalLands)) errors.push(t('calculators.errors.payLands'));
  if (type === 'pay2Life' && integerValue(inputs.deckSize) < integerValue(inputs.totalLands)) errors.push(t('calculators.errors.deckLandRelation'));
  if (type === 'pay2Life' && integerValue(inputs.totalLands) < 1) errors.push(t('calculators.errors.lands'));
  if (type === 'landPlayability') {
    const total = integerValue(inputs.totalLands); const primary = ['immediateLands', 'tappedLands', 'conditionalLands', 'utilityLands', 'unknownLands'].reduce((sum, key) => sum + integerValue(inputs[key]), 0);
    if (deckSize < 1) errors.push(t('calculators.errors.deckSize'));
    if (total > deckSize) errors.push(t('calculators.errors.deckLandRelation'));
    if (primary !== total) errors.push(t('calculators.errors.landClasses'));
    ['coloredLands', 'colorlessOnlyLands', 'multicolorLands', 'fetchLands', 'mdfcLands', 'pay2LifeLands'].forEach((key) => { if (integerValue(inputs[key]) > total) errors.push(t('calculators.errors.landAttributeCount')); });
    if (integerValue(inputs.coloredLands) + integerValue(inputs.colorlessOnlyLands) > total) errors.push(t('calculators.errors.landColorOverlap'));
    if (integerValue(inputs.turn, 1) < 1) errors.push(t('calculators.errors.turn'));
  }
  if (type === 'ramp') {
    const categories = ['manaRocks', 'manaDorks', 'landRamp', 'extraLandDrops', 'temporaryMana', 'costReduction', 'conditionalRamp', 'delayedRamp', 'unknownRamp'];
    const categoryTotal = categories.reduce((sum, key) => sum + integerValue(inputs[key]), 0);
    if (deckSize < 1) errors.push(t('calculators.errors.deckSize'));
    if (integerValue(inputs.baselineLands) > deckSize) errors.push(t('calculators.errors.deckLandRelation'));
    if (integerValue(inputs.turnHorizon, 1) < 3) errors.push(t('calculators.errors.turnHorizon'));
    if (categoryTotal > deckSize) errors.push(t('calculators.errors.rampCards'));
    if (integerValue(inputs.earliestUsableTurn, 1) < 1 || integerValue(inputs.earliestUsableTurn, 1) > integerValue(inputs.turnHorizon, 1)) errors.push(t('calculators.errors.earliestRampTurn'));
    ['permanentSourceGain', 'temporaryManaAmount', 'additionalLandDeployment', 'costReductionAmount'].forEach((key) => { if (numberValue(inputs[key]) < 0) errors.push(t('calculators.errors.effectAmount')); });
    if (numberValue(inputs.permanentSourceGain) > 0 && !['manaRocks', 'manaDorks', 'landRamp', 'conditionalRamp', 'delayedRamp', 'unknownRamp'].some((key) => integerValue(inputs[key]) > 0)) errors.push(t('calculators.errors.permanentEffectCategory'));
    const hasConditionalOrDelayed = integerValue(inputs.conditionalRamp) + integerValue(inputs.delayedRamp) > 0;
    if (numberValue(inputs.temporaryManaAmount) > 0 && integerValue(inputs.temporaryMana) < 1 && !hasConditionalOrDelayed && integerValue(inputs.unknownRamp) < 1) errors.push(t('calculators.errors.temporaryEffectCategory'));
    if (numberValue(inputs.additionalLandDeployment) > 0 && integerValue(inputs.landRamp) + integerValue(inputs.extraLandDrops) < 1 && !hasConditionalOrDelayed && integerValue(inputs.unknownRamp) < 1) errors.push(t('calculators.errors.landDeploymentCategory'));
    if (numberValue(inputs.costReductionAmount) > 0 && integerValue(inputs.costReduction) < 1 && !hasConditionalOrDelayed && integerValue(inputs.unknownRamp) < 1) errors.push(t('calculators.errors.costReductionCategory'));
  }
  return errors;
}

function methodResult(type, method, value, inputs, notes = []) {
  return { value, unit: 'probability', exact: method !== 'simulation', estimated: method === 'simulation', method, methodLabel: t(METHOD_KEYS[method]), explanation: t(METHOD_EXPLANATIONS[method]), inputs: clone(inputs), assumptions: assumptionSummary(type, inputs), notes, calculatorVersion: CALCULATOR_SCHEMA_VERSION, generatedAt: new Date().toISOString() };
}
function assumptionSummary(type, inputs) {
  const assumptions = [t('calculators.assumptions.noMulligan')];
  if (inputs.playDraw) assumptions.push(inputs.playDraw === 'play' ? t('calculators.assumptions.play') : t('calculators.assumptions.draw'));
  if (type === 'pay2Life') assumptions.push(t(`calculators.assumptions.${inputs.decision ?? 'always'}`));
  return assumptions;
}

function calculateProbability(inputs) {
  const normalized = { ...inputs, deckSize: integerValue(inputs.deckSize, 60, 1), copies: integerValue(inputs.copies, 1), cardsDrawn: integerValue(inputs.cardsDrawn, 7), desired: integerValue(inputs.desired, 1), relation: inputs.relation ?? 'at_least' };
  if (inputs.turn !== undefined && inputs.turn !== '') normalized.cardsDrawn = cardsByTurn(inputs);
  const value = probabilityForRelation(normalized);
  return methodResult('probability', 'hypergeometric', value, normalized, [t('calculators.notes.noMulligan')]);
}

function calculateMultiCard(inputs) {
  const normalized = { ...inputs, deckSize: integerValue(inputs.deckSize, 60, 1), copies: integerValue(inputs.copies, 4), secondCopies: integerValue(inputs.secondCopies, 4), cardsDrawn: integerValue(inputs.cardsDrawn, 7), desired: integerValue(inputs.desired, 1), secondDesired: integerValue(inputs.secondDesired, 1) };
  if (inputs.turn !== undefined && inputs.turn !== '') normalized.cardsDrawn = cardsByTurn(inputs);
  const value = probabilityForTwoRequirements({ deckSize: normalized.deckSize, firstCopies: normalized.copies, secondCopies: normalized.secondCopies, cardsDrawn: normalized.cardsDrawn, firstWanted: normalized.desired, secondWanted: normalized.secondDesired });
  return methodResult('multiCard', 'hypergeometric', value, normalized, [t('calculators.notes.comboCategories')]);
}

function calculateSource(inputs, method) {
  const normalized = { ...inputs, deckSize: integerValue(inputs.deckSize, 60, 1), qualifyingSources: integerValue(inputs.qualifyingSources), desired: integerValue(inputs.desired, 1), openingHandSize: integerValue(inputs.openingHandSize, 7), drawsPerTurn: integerValue(inputs.drawsPerTurn, 1), turn: integerValue(inputs.turn, 1, 0) };
  normalized.cardsDrawn = normalized.turn !== undefined && normalized.turn !== '' ? cardsByTurn(normalized) : integerValue(normalized.cardsDrawn);
  if (method === 'karsten_source') {
    const target = numberValue(normalized.targetProbability, 90, 0.1) / 100;
    let sourceCount = 0; while (sourceCount < normalized.deckSize && hypergeometricAtLeast(normalized.deckSize, sourceCount, normalized.cardsDrawn, normalized.desired) < target) sourceCount += 1;
    return methodResult('sourceProbability', method, sourceCount, normalized, [t('calculators.notes.sourceCount')]).withUnit?.('sources') ?? { ...methodResult('sourceProbability', method, sourceCount, normalized, [t('calculators.notes.sourceCount')]), unit: 'sources' };
  }
  if (method === 'simulation') {
    const value = simulateAtLeast({ deckSize: normalized.deckSize, successes: normalized.qualifyingSources, draws: normalized.cardsDrawn, desired: normalized.desired, trials: normalized.trials });
    return methodResult('sourceProbability', method, value, normalized, [t('calculators.notes.trialCount', { count: integerValue(normalized.trials, 10000) })]);
  }
  const sourceCount = method === 'untapped_source' ? integerValue(normalized.untappedSources ?? normalized.qualifyingSources) : normalized.qualifyingSources;
  const value = hypergeometricAtLeast(normalized.deckSize, sourceCount, normalized.cardsDrawn, normalized.desired);
  return methodResult('sourceProbability', method, value, { ...normalized, qualifyingSources: sourceCount }, [method === 'untapped_source' ? t('calculators.notes.untappedOnly') : t('calculators.notes.noReplacement')]);
}

function calculatePips(inputs, method) {
  const colors = ['white', 'blue', 'black', 'red', 'green', 'colorless'];
  const normalized = Object.fromEntries(colors.concat(['generic', 'totalLands', 'earlyWeighting', 'targetProbability']).map((key) => [key, numberValue(inputs[key])]));
  const totalColored = colors.slice(0, 5).reduce((sum, color) => sum + normalized[color], 0);
  if (method === 'pip_distribution') {
    const allocations = Object.fromEntries(colors.slice(0, 5).map((color) => [color, totalColored ? normalized[color] / totalColored * normalized.totalLands : 0]));
    allocations.colorless = normalized.totalLands * (normalized.colorless / Math.max(1, totalColored + normalized.colorless));
    return { ...methodResult('manaPips', method, allocations, normalized, [t('calculators.notes.pipNotProbability')]), unit: 'land allocation' };
  }
  if (method === 'colored_source') {
    const allocations = Object.fromEntries(colors.slice(0, 5).map((color) => [color, Math.ceil(totalColored ? normalized[color] / totalColored * normalized.totalLands : 0)]));
    return { ...methodResult('manaPips', method, allocations, normalized, [t('calculators.notes.sourceHeuristic')]), unit: 'recommended sources' };
  }
  const totalPips = totalColored + normalized.colorless;
  if (method === 'karsten_source') {
    const desired = Math.max(1, Math.ceil(totalColored / 3));
    const sourceInputs = { deckSize: 60, qualifyingSources: normalized.totalLands, desired, turn: 3, openingHandSize: 7, drawsPerTurn: 1, targetProbability: normalized.targetProbability };
    const result = calculateSource(sourceInputs, method);
    return { ...result, notes: [...result.notes, t('calculators.notes.pipDemand', { count: totalPips })] };
  }
  if (method === 'exact_hypergeometric' || method === 'untapped_source') {
    const sourceInputs = { deckSize: 60, qualifyingSources: normalized.totalLands, desired: Math.max(1, Math.ceil(totalColored / 3)), cardsDrawn: 9 };
    const result = calculateSource(sourceInputs, method);
    return { ...result, notes: [...result.notes, t('calculators.notes.pipDemand', { count: totalPips })] };
  }
  if (method === 'simulation') {
    const value = simulateAtLeast({ deckSize: 60, successes: normalized.totalLands, draws: 9, desired: Math.max(1, Math.ceil(totalColored / 3)), trials: 10000 });
    return methodResult('manaPips', method, value, normalized, [t('calculators.notes.pipSimulation')]);
  }
  return methodResult('manaPips', method, normalized.totalLands ? totalPips / normalized.totalLands : 0, normalized, [t('calculators.notes.pipNotProbability')]);
}

function percent(part, total) { return total > 0 ? Number((part / total * 100).toFixed(1)) : 0; }

function calculateLandPlayability(inputs) {
  const normalized = {
    ...inputs,
    deckSize: integerValue(inputs.deckSize, 60, 1), totalLands: integerValue(inputs.totalLands), turn: integerValue(inputs.turn, 1, 1),
    immediateLands: integerValue(inputs.immediateLands), tappedLands: integerValue(inputs.tappedLands), conditionalLands: integerValue(inputs.conditionalLands),
    utilityLands: integerValue(inputs.utilityLands), unknownLands: integerValue(inputs.unknownLands), coloredLands: integerValue(inputs.coloredLands),
    colorlessOnlyLands: integerValue(inputs.colorlessOnlyLands), multicolorLands: integerValue(inputs.multicolorLands), fetchLands: integerValue(inputs.fetchLands),
    mdfcLands: integerValue(inputs.mdfcLands), pay2LifeLands: integerValue(inputs.pay2LifeLands), playabilityMode: inputs.playabilityMode ?? 'mana_now',
    includeConditional: inputs.includeConditional !== 'no', includeUtility: inputs.includeUtility === 'yes',
  };
  const classified = normalized.totalLands - normalized.unknownLands;
  const selectedConditional = normalized.includeConditional ? normalized.conditionalLands : 0;
  const selectedUtility = normalized.includeUtility ? normalized.utilityLands : 0;
  const playableAsLandDrop = normalized.immediateLands + normalized.tappedLands + selectedConditional + selectedUtility;
  const manaUsableNow = normalized.immediateLands + selectedConditional + selectedUtility;
  const scenarioUsable = normalized.playabilityMode === 'land_drop' ? playableAsLandDrop : manaUsableNow;
  const result = methodResult('landPlayability', 'land_classification', {
    totalLands: normalized.totalLands, classifiedLands: classified, unknownLands: normalized.unknownLands,
    scenarioUsable, playableAsLandDrop, manaUsableNow, immediateLands: normalized.immediateLands, tappedLands: normalized.tappedLands,
    conditionalLands: normalized.conditionalLands, utilityLands: normalized.utilityLands, coloredLands: normalized.coloredLands,
    colorlessOnlyLands: normalized.colorlessOnlyLands, multicolorLands: normalized.multicolorLands, fetchLands: normalized.fetchLands,
    mdfcLands: normalized.mdfcLands, pay2LifeLands: normalized.pay2LifeLands,
    percentages: { classified: percent(classified, normalized.totalLands), scenarioUsable: percent(scenarioUsable, normalized.totalLands), tapped: percent(normalized.tappedLands, normalized.totalLands), conditional: percent(normalized.conditionalLands, normalized.totalLands), utility: percent(normalized.utilityLands, normalized.totalLands), colored: percent(normalized.coloredLands, normalized.totalLands), colorlessOnly: percent(normalized.colorlessOnlyLands, normalized.totalLands), multicolor: percent(normalized.multicolorLands, normalized.totalLands), unknown: percent(normalized.unknownLands, normalized.totalLands) },
    scenario: { turn: normalized.turn, mode: normalized.playabilityMode, conditionalIncluded: normalized.includeConditional, utilityIncluded: normalized.includeUtility },
  }, [t('calculators.notes.landNoProbability')]);
  result.presentation = 'landPlayability'; result.unit = 'land classification'; result.assumptions = [
    normalized.playabilityMode === 'land_drop' ? t('calculators.assumptions.landDropPlayable') : t('calculators.assumptions.manaUsableNow'),
    normalized.includeConditional ? t('calculators.assumptions.conditionalIncluded') : t('calculators.assumptions.conditionalExcluded'),
    normalized.includeUtility ? t('calculators.assumptions.utilityIncluded') : t('calculators.assumptions.utilityExcluded'),
    t('calculators.assumptions.turnInformational', { turn: normalized.turn }),
    t('calculators.assumptions.noProbability'),
  ];
  if (normalized.deckDataWarning) result.notes.push(normalized.deckDataWarning);
  return result;
}

function calculateRamp(inputs) {
  const normalized = {
    ...inputs,
    deckSize: integerValue(inputs.deckSize, 60, 1), baselineLands: integerValue(inputs.baselineLands, 24), normalLandPlays: integerValue(inputs.normalLandPlays, 1),
    turnHorizon: integerValue(inputs.turnHorizon, 6, 1), earliestUsableTurn: integerValue(inputs.earliestUsableTurn, 2, 1),
    includeConditional: inputs.includeConditional === 'yes', includeDelayed: inputs.includeDelayed === 'yes', resolutionMode: inputs.resolutionMode ?? 'assume_resolved',
  };
  const categoryKeys = ['manaRocks', 'manaDorks', 'landRamp', 'extraLandDrops', 'temporaryMana', 'costReduction'];
  const categories = Object.fromEntries(categoryKeys.concat(['conditionalRamp', 'delayedRamp', 'unknownRamp']).map((key) => [key, integerValue(normalized[key])]));
  const reliableRampCards = categoryKeys.reduce((sum, key) => sum + categories[key], 0);
  const knownRampCards = reliableRampCards + categories.conditionalRamp + categories.delayedRamp;
  const selectedRampCards = reliableRampCards + (normalized.includeConditional ? categories.conditionalRamp : 0) + (normalized.includeDelayed ? categories.delayedRamp : 0);
  const modeled = normalized.resolutionMode === 'assume_resolved';
  const conditionalExcluded = !normalized.includeConditional && categories.conditionalRamp > 0;
  const delayedExcluded = !normalized.includeDelayed && categories.delayedRamp > 0;
  const effectsBlockedBySelection = conditionalExcluded || delayedExcluded;
  const selectedEffectCategory = (keys) => keys.some((key) => categories[key] > 0 && (key !== 'conditionalRamp' || normalized.includeConditional) && (key !== 'delayedRamp' || normalized.includeDelayed));
  const effectsActive = modeled && !effectsBlockedBySelection;
  const effectIsModeled = (keys) => effectsActive && selectedEffectCategory(keys);
  const permanentEffectModeled = effectIsModeled(['manaRocks', 'manaDorks', 'landRamp', 'conditionalRamp', 'delayedRamp', 'unknownRamp']);
  const temporaryEffectModeled = effectIsModeled(['temporaryMana', 'conditionalRamp', 'delayedRamp', 'unknownRamp']);
  const landDeploymentModeled = effectIsModeled(['landRamp', 'extraLandDrops', 'conditionalRamp', 'delayedRamp', 'unknownRamp']);
  const costReductionModeled = effectIsModeled(['costReduction', 'conditionalRamp', 'delayedRamp', 'unknownRamp']);
  const rows = [];
  for (let turn = 1; turn <= normalized.turnHorizon; turn += 1) {
    const baselineLands = Math.min(normalized.baselineLands, turn * normalized.normalLandPlays);
    const active = modeled && turn >= normalized.earliestUsableTurn;
    const additionalLands = active && landDeploymentModeled ? numberValue(normalized.additionalLandDeployment) : 0;
    const permanentSources = active && permanentEffectModeled ? numberValue(normalized.permanentSourceGain) : 0;
    const temporaryMana = active && turn === normalized.earliestUsableTurn && temporaryEffectModeled ? numberValue(normalized.temporaryManaAmount) : 0;
    const costReduction = active && costReductionModeled ? numberValue(normalized.costReductionAmount) : 0;
    rows.push({ turn, baselineLands, additionalLandDeployment: additionalLands, permanentSourceGain: permanentSources, temporaryMana, baselineMana: baselineLands, modeledMana: baselineLands + additionalLands + permanentSources + temporaryMana, costReduction });
  }
  const usableBy = (turn) => modeled && turn >= normalized.earliestUsableTurn ? selectedRampCards : null;
  const result = methodResult('ramp', 'deterministic_progression', {
    totalRampCards: knownRampCards, reliableRampCards, unknownRampCards: categories.unknownRamp, categoryCounts: categories,
    inventoryOnly: !modeled, earliestUsableTurn: modeled && selectedRampCards > 0 ? normalized.earliestUsableTurn : null,
    usableByTurn: { turn2: usableBy(2), turn3: usableBy(3), horizon: usableBy(normalized.turnHorizon) },
    modeledPermanentSourceGain: permanentEffectModeled ? numberValue(normalized.permanentSourceGain) : 0,
    modeledTemporaryMana: temporaryEffectModeled ? numberValue(normalized.temporaryManaAmount) : 0,
    modeledAdditionalLandDeployment: landDeploymentModeled ? numberValue(normalized.additionalLandDeployment) : 0,
    modeledCostReduction: costReductionModeled ? numberValue(normalized.costReductionAmount) : 0,
    rows,
  }, [t('calculators.notes.rampNoProbability'), modeled ? t('calculators.notes.rampResolved') : t('calculators.notes.rampInventoryOnly'), ...(effectsBlockedBySelection ? [t('calculators.notes.rampEffectsExcluded')] : [])]);
  result.presentation = 'ramp'; result.unit = 'ramp inventory'; result.assumptions = [
    t('calculators.assumptions.normalLandProgression', { plays: normalized.normalLandPlays }),
    modeled ? t('calculators.assumptions.rampEffectsResolved', { turn: normalized.earliestUsableTurn }) : t('calculators.assumptions.rampEffectsNotModeled'),
    t('calculators.assumptions.costReductionSeparate'),
    t('calculators.assumptions.noProbability'),
  ];
  if (normalized.deckDataWarning) result.notes.push(normalized.deckDataWarning);
  return result;
}

function calculatePay2Life(inputs) {
  const normalized = { ...inputs, deckSize: integerValue(inputs.deckSize, 60, 1), payLands: integerValue(inputs.payLands), totalLands: integerValue(inputs.totalLands, 24, 1), turn: integerValue(inputs.turn, 10), openingHandSize: integerValue(inputs.openingHandSize, 7), drawsPerTurn: integerValue(inputs.drawsPerTurn, 1), playDraw: inputs.playDraw ?? 'play', decision: inputs.decision ?? 'always', useRate: numberValue(inputs.useRate, 1, 0) };
  const rows = []; let expectedUses = 0;
  for (let turn = 1; turn <= normalized.turn; turn += 1) {
    const draws = cardsByTurn({ ...normalized, turn });
    const access = hypergeometricAtLeast(normalized.deckSize, normalized.payLands, Math.min(draws, normalized.deckSize), 1);
    const decisionRate = normalized.decision === 'never' ? 0 : normalized.decision === 'custom' ? Math.min(1, normalized.useRate) : 1;
    const uses = access * decisionRate;
    expectedUses += uses;
    rows.push({ turn, cardsSeen: draws, accessProbability: access, expectedUses: uses, cumulativeLife: expectedUses * 2 });
  }
  return { ...methodResult('pay2Life', 'exact_hypergeometric', rows, normalized, [t('calculators.notes.lifeApproximation')]), value: expectedUses * 2, unit: 'life', rows };
}

const resultCache = new Map();
export function calculate(type, method, inputValues = {}, format = FORMAT_PROFILES.STANDARD_CONSTRUCTED) {
  const inputs = clone(inputValues); const key = JSON.stringify({ type, method, inputs, format, version: CALCULATOR_SCHEMA_VERSION });
  if (resultCache.has(key)) return clone(resultCache.get(key));
  const errors = validateInputs(type, inputs); if (errors.length) return { error: errors.join(' '), errors };
  let result;
  if (type === 'probability') result = calculateProbability(inputs);
  else if (type === 'multiCard') result = calculateMultiCard(inputs);
  else if (type === 'sourceProbability') result = calculateSource(inputs, method);
  else if (type === 'manaPips') result = calculatePips(inputs, method);
  else if (type === 'landPlayability') result = calculateLandPlayability(inputs);
  else if (type === 'ramp') result = calculateRamp(inputs);
  else if (type === 'pay2Life') result = calculatePay2Life(inputs);
  else result = { error: t('calculators.errors.unknown') };
  result.format = format || ''; result.formatLabel = format ? t(`calculators.formats.${format}`) : t('calculators.noFormatSelected'); resultCache.set(key, clone(result)); return result;
}

export function defaultInputs(type, format = FORMAT_PROFILES.STANDARD_CONSTRUCTED) {
  const profile = getFormatProfile(format || FORMAT_PROFILES.STANDARD_CONSTRUCTED); const defaults = {};
  FIELD_DEFS[type].forEach(([key]) => { defaults[key] = key === 'deckSize' ? profile.mainDeck.exactCount : key === 'playDraw' ? 'play' : key === 'relation' ? 'at_least' : key === 'decision' ? 'always' : key === 'cardsDrawn' ? 7 : key === 'desired' ? 1 : key === 'turn' ? 3 : key === 'openingHandSize' ? 7 : key === 'drawsPerTurn' ? 1 : key === 'trials' ? 10000 : key === 'targetProbability' ? 90 : key === 'useRate' ? 1 : key === 'totalLands' ? 24 : key === 'qualifyingSources' ? 24 : key === 'untappedSources' ? 24 : key === 'copies' ? 4 : 0; });
  if (type === 'probability') { defaults.turn = 1; defaults.maximum = 2; }
  if (type === 'multiCard') { defaults.turn = 1; defaults.secondCopies = 4; defaults.secondDesired = 1; }
  if (type === 'landPlayability') { defaults.totalLands = 24; defaults.immediateLands = 24; defaults.unknownLands = 0; defaults.playabilityMode = 'mana_now'; defaults.includeConditional = 'yes'; defaults.includeUtility = 'no'; defaults.turn = 3; }
  if (type === 'ramp') { defaults.baselineLands = 24; defaults.normalLandPlays = 1; defaults.turnHorizon = 6; defaults.earliestUsableTurn = 2; defaults.includeConditional = 'no'; defaults.includeDelayed = 'no'; defaults.resolutionMode = 'assume_resolved'; }
  if (type === 'pay2Life') defaults.deckSize = profile.mainDeck.exactCount;
  return defaults;
}

export function fieldDefinitions(type) { return FIELD_DEFS[type] ?? []; }
export function methodOptions(type) { return (CALCULATORS[type]?.methods ?? []).map((method) => ({ value: method, label: t(METHOD_KEYS[method]), explanation: t(METHOD_EXPLANATIONS[method]) })); }
export function formatOptions() { return Object.values(FORMAT_PROFILES).map((value) => ({ value, label: t(`calculators.formats.${value}`) })); }
export { deriveDeckInputs } from './calculator-deck-inputs.js';

export function createCalculatorScenario({ type, method, inputs, assumptions, format, deckId = null, result = null, sourceMode = 'manual', origins = {}, originalDerived = {}, overrides = {} }) {
  return { schema: 'calculatorScenario', schemaVersion: CALCULATOR_SCHEMA_VERSION, scenarioId: `calc_${Date.now()}_${Math.random().toString(36).slice(2)}`, calculatorType: type, method, inputs: clone(inputs), assumptions: clone(assumptions), format, deckId, result: clone(result), sourceMode, origins: clone(origins), originalDerived: clone(originalDerived), overrides: clone(overrides), createdAt: new Date().toISOString() };
}

export async function saveCalculatorScenario(scenario) {
  if (!globalThis.miniappsAI?.storage?.getItem || !globalThis.miniappsAI?.storage?.setItem) return { saved: false, reason: 'storage_unavailable' };
  try { const raw = await globalThis.miniappsAI.storage.getItem(SCENARIO_STORAGE_KEY); const list = raw ? JSON.parse(raw) : []; const next = [scenario, ...list.filter((item) => item.scenarioId !== scenario.scenarioId)].slice(0, 20); await globalThis.miniappsAI.storage.setItem(SCENARIO_STORAGE_KEY, JSON.stringify(next)); return { saved: true }; } catch (error) { return { saved: false, reason: error?.message ?? 'storage_error' }; }
}
export async function loadCalculatorScenarios() {
  if (!globalThis.miniappsAI?.storage?.getItem) return { scenarios: [], reason: 'storage_unavailable' };
  try { const raw = await globalThis.miniappsAI.storage.getItem(SCENARIO_STORAGE_KEY); return { scenarios: raw ? JSON.parse(raw) : [] }; } catch (error) { return { scenarios: [], reason: error?.message ?? 'storage_error' }; }
}

function addField(container, key, labelKey, type, min, step, values, onChange, origins = {}, originalDerived = {}) {
  const label = document.createElement('label'); label.className = 'calculator-field';
  const heading = document.createElement('span'); heading.className = 'field-label'; heading.textContent = t(labelKey);
  const origin = document.createElement('small'); origin.className = 'field-origin';
  if (origins[key] === 'deck') origin.textContent = t('calculators.origin.deck');
  else if (origins[key] === 'unknown') origin.textContent = t('calculators.origin.unknown');
  else if (origins[key] === 'manualOverride') origin.textContent = t('calculators.origin.manualOverrideValue', { value: String(originalDerived[key]?.value ?? '—') });
  else if (origins[key] === 'manual') origin.textContent = t('calculators.origin.manual');
  else origin.textContent = t('calculators.origin.assumed');
  const wrap = document.createElement('span'); wrap.className = 'field-control';
  const control = document.createElement(type === 'select' ? 'select' : 'input'); control.id = `calc-${key}`; control.name = key;
  if (type === 'select') { const options = (fieldOptionSets[key] ?? decisionOptions)(); options.forEach(([value, text]) => { const option = document.createElement('option'); option.value = value; option.textContent = text; control.append(option); }); } else { control.type = type; control.min = String(min ?? 0); control.step = String(step ?? 1); }
  control.value = values[key] ?? ''; control.addEventListener('input', () => onChange(key, control.value)); control.addEventListener('change', () => onChange(key, control.value));
  wrap.append(control); label.append(heading, origin, wrap); container.append(label);
}

export function renderFields(container, type, values, onChange, origins = {}, originalDerived = {}) { container.replaceChildren(); fieldDefinitions(type).forEach(([key, labelKey, inputType, min, step]) => addField(container, key, labelKey, inputType, min, step, values, onChange, origins, originalDerived)); }

function appendResultChrome(container, result, interpretationKey) {
  const method = document.createElement('p'); method.className = 'result-method'; method.textContent = `${t('calculators.result.method')}: ${result.methodLabel}`;
  const explanation = document.createElement('p'); explanation.className = 'muted-copy'; explanation.textContent = result.explanation;
  const meta = document.createElement('p'); meta.className = 'result-meta'; meta.textContent = `${t('calculators.result.format')}: ${result.formatLabel} · ${result.exact ? t('calculators.result.exact') : t('calculators.result.estimated')}`;
  const interpretation = document.createElement('p'); interpretation.className = 'result-interpretation'; interpretation.textContent = t(interpretationKey);
  const assumptionsLabel = document.createElement('h4'); assumptionsLabel.className = 'result-subheading'; assumptionsLabel.textContent = t('calculators.result.assumptionsHeading');
  const assumptions = document.createElement('ul'); assumptions.className = 'result-list';
  [...(result.assumptions ?? []), ...(result.notes ?? [])].forEach((item) => { const li = document.createElement('li'); li.textContent = item; assumptions.append(li); });
  container.append(method, explanation, meta, interpretation, assumptionsLabel, assumptions);
}

function appendMetricGrid(container, entries) {
  const grid = document.createElement('div'); grid.className = 'allocation-grid';
  entries.forEach((entry) => { const item = document.createElement('span'); item.textContent = entry; grid.append(item); });
  container.append(grid);
}

function renderLandPlayabilityResult(container, result) {
  const value = result.value; const title = document.createElement('div'); title.className = 'result-value';
  title.textContent = t(value.scenario.mode === 'land_drop' ? 'calculators.result.landDropSummary' : 'calculators.result.landManaSummary', { usable: value.scenarioUsable, total: value.totalLands }); container.append(title);
  appendResultChrome(container, result, 'calculators.result.interpretLandPlayability');
  const compositionHeading = document.createElement('h4'); compositionHeading.className = 'result-subheading'; compositionHeading.textContent = t('calculators.result.landCompositionHeading'); container.append(compositionHeading);
  const total = Math.max(0, value.totalLands);
  const metric = (labelKey, count, percent) => t('calculators.result.landMetric', { label: t(labelKey), count, total, percent: Number(percent ?? 0).toFixed(1) });
  appendMetricGrid(container, [
    metric('calculators.result.landTotal', value.totalLands, 100), metric('calculators.result.landClassified', value.classifiedLands, value.percentages.classified), metric('calculators.result.landUnknown', value.unknownLands, value.percentages.unknown),
    metric('calculators.result.landImmediate', value.immediateLands, percent(value.immediateLands, total)), metric('calculators.result.landTapped', value.tappedLands, value.percentages.tapped), metric('calculators.result.landConditional', value.conditionalLands, value.percentages.conditional), metric('calculators.result.landUtility', value.utilityLands, value.percentages.utility),
  ]);
  const attributeHeading = document.createElement('h4'); attributeHeading.className = 'result-subheading'; attributeHeading.textContent = t('calculators.result.landAttributesHeading'); container.append(attributeHeading);
  appendMetricGrid(container, [
    metric('calculators.result.landColored', value.coloredLands, value.percentages.colored), metric('calculators.result.landColorless', value.colorlessOnlyLands, value.percentages.colorlessOnly), metric('calculators.result.landMulticolor', value.multicolorLands, value.percentages.multicolor), metric('calculators.result.landFetch', value.fetchLands, percent(value.fetchLands, total)), metric('calculators.result.landMdfc', value.mdfcLands, percent(value.mdfcLands, total)), metric('calculators.result.landPay2Life', value.pay2LifeLands, percent(value.pay2LifeLands, total)),
  ]);
  const scenarioHeading = document.createElement('h4'); scenarioHeading.className = 'result-subheading'; scenarioHeading.textContent = t('calculators.result.landScenarioHeading'); container.append(scenarioHeading);
  const scenario = document.createElement('div'); scenario.className = 'result-table';
  const scenarioRows = [t('calculators.result.landScenarioMode', { mode: t(`calculators.assumptions.${value.scenario.mode === 'land_drop' ? 'landDropPlayable' : 'manaUsableNow'}`), turn: value.scenario.turn }), t(value.scenario.mode === 'land_drop' ? 'calculators.result.landScenarioLandDrop' : 'calculators.result.landScenarioManaNow', { count: value.scenarioUsable, total }), t('calculators.result.landScenarioTapped', { count: value.tappedLands }), t('calculators.result.landScenarioConditional', { count: value.conditionalLands, included: value.scenario.conditionalIncluded ? t('calculators.result.included') : t('calculators.result.excluded') }), t('calculators.result.landScenarioUnknown', { count: value.unknownLands })];
  scenarioRows.forEach((text) => { const row = document.createElement('div'); row.textContent = text; scenario.append(row); }); container.append(scenario);
}

function renderRampResult(container, result) {
  const value = result.value; const title = document.createElement('div'); title.className = 'result-value'; title.textContent = t('calculators.result.rampSummary', { count: value.totalRampCards, unknown: value.unknownRampCards }); container.append(title);
  appendResultChrome(container, result, 'calculators.result.interpretRamp');
  const inventoryHeading = document.createElement('h4'); inventoryHeading.className = 'result-subheading'; inventoryHeading.textContent = t('calculators.result.rampInventoryHeading'); container.append(inventoryHeading);
  const labels = { manaRocks: 'rampManaRocks', manaDorks: 'rampManaDorks', landRamp: 'rampLandRamp', extraLandDrops: 'rampExtraLandDrops', temporaryMana: 'rampTemporaryMana', costReduction: 'rampCostReduction', conditionalRamp: 'rampConditional', delayedRamp: 'rampDelayed', unknownRamp: 'rampUnknown' };
  appendMetricGrid(container, Object.entries(labels).map(([key, labelKey]) => t('calculators.result.rampMetric', { label: t(`calculators.result.${labelKey}`), count: value.categoryCounts[key] ?? 0 })));
  const timingHeading = document.createElement('h4'); timingHeading.className = 'result-subheading'; timingHeading.textContent = t('calculators.result.rampTimingHeading'); container.append(timingHeading);
  if (value.inventoryOnly) { const inventoryNote = document.createElement('p'); inventoryNote.className = 'muted-copy'; inventoryNote.textContent = t('calculators.result.rampInventoryTimingNote'); container.append(inventoryNote); return; }
  appendMetricGrid(container, [t('calculators.result.rampEarliest', { turn: value.earliestUsableTurn ?? '—' }), t('calculators.result.rampByTurn', { turn: 2, count: value.usableByTurn.turn2 }), t('calculators.result.rampByTurn', { turn: 3, count: value.usableByTurn.turn3 }), t('calculators.result.rampByHorizon', { count: value.usableByTurn.horizon })]);
  const progressionHeading = document.createElement('h4'); progressionHeading.className = 'result-subheading'; progressionHeading.textContent = t('calculators.result.rampProgressionHeading'); container.append(progressionHeading);
  const table = document.createElement('div'); table.className = 'result-table'; value.rows.forEach((row) => { const line = document.createElement('div'); line.textContent = t('calculators.result.rampTurnRow', { turn: row.turn, baseline: row.baselineMana, modeled: row.modeledMana, permanent: row.permanentSourceGain, temporary: row.temporaryMana, lands: row.additionalLandDeployment, reduction: row.costReduction }); table.append(line); }); container.append(table);
  const effectsHeading = document.createElement('h4'); effectsHeading.className = 'result-subheading'; effectsHeading.textContent = t('calculators.result.rampEffectsHeading'); container.append(effectsHeading);
  appendMetricGrid(container, [t('calculators.result.rampPermanentSources', { count: value.modeledPermanentSourceGain }), t('calculators.result.rampTemporaryOutput', { count: value.modeledTemporaryMana }), t('calculators.result.rampLandDeployment', { count: value.modeledAdditionalLandDeployment }), t('calculators.result.rampCostReductionOutput', { count: value.modeledCostReduction })]);
}

export function renderResult(container, result, origins = {}) {
  container.replaceChildren(); if (!result) return;
  if (result.error) { const error = document.createElement('p'); error.className = 'result-error'; error.textContent = result.error; container.append(error); return; }
  if (result.presentation === 'landPlayability') { renderLandPlayabilityResult(container, result); return; }
  if (result.presentation === 'ramp') { renderRampResult(container, result); return; }
  const title = document.createElement('div'); title.className = 'result-value';
  if (Array.isArray(result.value)) title.textContent = t('calculators.result.turnTable', { value: result.value.length });
  else if (typeof result.value === 'object') title.textContent = t('calculators.result.objectValue');
  else title.textContent = result.unit === 'sources' ? `${result.value}` : result.unit === 'life' ? `${Number(result.value).toFixed(2)} ${t('calculators.result.life')}` : `${(Number(result.value) * 100).toFixed(1)}%`;
  const method = document.createElement('p'); method.className = 'result-method'; method.textContent = `${t('calculators.result.method')}: ${result.methodLabel}`;
  const explanation = document.createElement('p'); explanation.className = 'muted-copy'; explanation.textContent = result.explanation;
  const meta = document.createElement('p'); meta.className = 'result-meta'; meta.textContent = `${t('calculators.result.format')}: ${result.formatLabel} · ${result.exact ? t('calculators.result.exact') : t('calculators.result.estimated')}`;
  const interpretation = document.createElement('p'); interpretation.className = 'result-interpretation'; interpretation.textContent = Array.isArray(result.rows) ? t('calculators.result.interpretTurnTable') : result.unit === 'sources' ? t('calculators.result.interpretSources') : result.unit === 'life' ? t('calculators.result.interpretLife') : result.unit === 'land allocation' || result.unit === 'recommended sources' ? t('calculators.result.interpretAllocation') : t('calculators.result.interpretProbability');
  const assumptionsLabel = document.createElement('h4'); assumptionsLabel.className = 'result-subheading'; assumptionsLabel.textContent = t('calculators.result.assumptionsHeading');
  const assumptions = document.createElement('ul'); assumptions.className = 'result-list'; (result.assumptions ?? []).forEach((item) => { const li = document.createElement('li'); li.textContent = item; assumptions.append(li); });
  if (result.notes?.length) result.notes.forEach((item) => { const li = document.createElement('li'); li.textContent = item; assumptions.append(li); });
  container.append(title, method, explanation, meta, interpretation, assumptionsLabel, assumptions);
  if (Array.isArray(result.rows)) { const table = document.createElement('div'); table.className = 'result-table'; result.rows.slice(0, 12).forEach((row) => { const line = document.createElement('div'); line.textContent = t('calculators.result.turnRow', { turn: row.turn, value: (Number(row.accessProbability ?? 0) * 100).toFixed(1), uses: Number(row.expectedUses ?? 0).toFixed(2), life: Number(row.cumulativeLife ?? 0).toFixed(2) }); table.append(line); }); container.append(table); }
  if (result.value && typeof result.value === 'object' && !Array.isArray(result.value)) { const grid = document.createElement('div'); grid.className = 'allocation-grid'; Object.entries(result.value).forEach(([key, value]) => { const item = document.createElement('span'); item.textContent = `${key}: ${Number(value).toFixed(1)}`; grid.append(item); }); container.append(grid); }
}

export function calculatorMethodLabel(method) { return t(METHOD_KEYS[method] ?? method); }
export function calculatorMethodExplanation(method) { return t(METHOD_EXPLANATIONS[method] ?? method); }
export { FIELD_DEFS };
