import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildActorResearch, renderActorResearch, ACTOR_FACT_FIELDS } from '../lib/actor-research.mjs';
import { sourceCreditId } from '../lib/work-import-plan.mjs';

const evidence = [{ url: 'https://example.com/performer', note: '公式プロフィールに当該作品と役の記載を確認', checkedAt: '2026-10-16T10:17:01Z' }];
function fixture() {
  const credit = { sourceActorName: '拓哉', sourceActorUrl: null, role_name: null, cast_group: 'アンサンブル' };
  const row = { id: sourceCreditId(credit), source: credit, newActor: { evidence: [{ url: 'https://example.com/work', note: '配役欄で氏名を確認', checkedAt: evidence[0].checkedAt }] } };
  return { plan: { version: 1, source: { url: 'https://example.com/work', fingerprint: 'source-hash' }, rows: [row] }, actors: [],
    research: { version: 1, sourceUrl: 'https://example.com/work', sourceFingerprint: 'source-hash', actors: [
      { sourceCreditKey: row.id, sourceActorName: '拓哉', identity: { status: 'appearance_only', evidence: [] }, facts: {}, notes: [] },
    ] } };
}
const linked = (record) => { record.identity = { status: 'profile_linked', profileUrl: evidence[0].url, evidence }; return record; };

test('a sparse credit survives without invented reading, English, gender, birthday or slug', () => {
  const input = fixture(); const result = buildActorResearch(input); const row = result.rows[0];
  assert.equal(row.profileDraft.name, '拓哉');
  for (const field of [...ACTOR_FACT_FIELDS, 'slug']) assert.equal(row.profileDraft[field], null);
  assert.equal(row.group, 'アンサンブル');
  assert.deepEqual(row.appearanceEvidence, input.plan.rows[0].newActor.evidence);
  assert.equal(row.creationReady, false); assert.equal(result.writes, 0);
});

test('a valid field source cannot attach a namesake profile without a reviewed connection', () => {
  const input = fixture(); const record = input.research.actors[0];
  record.facts.birthday = { status: 'confirmed', value: '1980-10-29', evidence };
  let row = buildActorResearch(input).rows[0];
  assert.equal(row.profileDraft.birthday, null); assert.ok(row.issues.includes('unlinked_profile_fact:birthday'));
  linked(record); row = buildActorResearch(input).rows[0];
  assert.equal(row.profileDraft.birthday, '1980-10-29');
  record.identity.evidence = []; row = buildActorResearch(input).rows[0];
  assert.equal(row.profileDraft.birthday, null); assert.ok(row.issues.includes('unverified_profile_connection'));
});

test('unconfirmed and conflicting facts remain in the dossier and never populate the draft', () => {
  const input = fixture(); const record = linked(input.research.actors[0]);
  record.facts.height_cm = { status: 'conflicting', values: [178, 180], evidence };
  record.facts.name_en = { status: 'unconfirmed', value: 'Takuya', evidence };
  const row = buildActorResearch(input).rows[0];
  assert.equal(row.profileDraft.height_cm, null); assert.equal(row.profileDraft.name_en, null);
  assert.deepEqual(row.facts.height_cm.values, [178, 180]);
});

test('malformed dates, values, evidence and unsupported fields cannot become profile facts', () => {
  const input = fixture(); const record = linked(input.research.actors[0]);
  for (const [field, value] of [['birthday', '2001-02-29'], ['height_cm', '174'], ['blood_type', 'B?'], ['gender', 'unknown'], ['kana', '<b>タクヤ</b>']]) record.facts[field] = { status: 'confirmed', value, evidence };
  record.facts.name_en = { status: 'confirmed', value: 'Takuya', evidence: [] };
  record.facts.profile = { status: 'confirmed', value: 'Invented biography', evidence };
  const row = buildActorResearch(input).rows[0];
  assert.equal(row.issues.length, 7);
  for (const field of ACTOR_FACT_FIELDS) assert.equal(row.profileDraft[field], null);
  assert.equal(Object.hasOwn(row.profileDraft, 'profile'), false);
});

test('research is occurrence scoped; altered work, source, name, orphan or duplicate records stop', () => {
  for (const mutate of [
    (input) => { input.research.sourceUrl = 'https://example.com/other-work'; },
    (input) => { input.research.sourceFingerprint = 'changed'; },
    (input) => { input.research.actors[0].sourceActorName = '拓也'; },
    (input) => { input.research.actors[0].sourceCreditKey = 'unknown'; },
    (input) => { input.research.actors.push(structuredClone(input.research.actors[0])); },
    (input) => { input.plan.rows[0].source.role_name = '変わった役'; },
  ]) { const input = fixture(); mutate(input); assert.throws(() => buildActorResearch(input)); }
});

test('same-name occurrences stay separate and DB name collisions produce review candidates', () => {
  const input = fixture(); const other = structuredClone(input.plan.rows[0]);
  other.source.role_name = '別役'; other.id = sourceCreditId(other.source); input.plan.rows.push(other);
  input.actors = [{ id: 'different-person', name: '拓哉', slug: 'takuya', birthday: '1999-01-01' }];
  const record = linked(input.research.actors[0]); record.facts.birthday = { status: 'confirmed', value: '1980-10-29', evidence };
  const result = buildActorResearch(input);
  assert.equal(result.rows.length, 2); assert.equal(result.rows[1].profileStatus, 'appearance_only');
  assert.equal(result.rows[1].profileDraft.birthday, null);
  assert.equal(result.rows[0].collisions[0].birthdayConflict, true);
  assert.ok(result.rows[0].issues.includes('existing_identity_candidates'));
  assert.equal(Object.hasOwn(result.rows[0], 'matchedActorId'), false);
});

test('reports are deterministic, preserve the research history and do not mutate inputs', () => {
  const input = fixture(); input.research.actors[0].searchHistory = [{ query: '拓哉 BLEACH 2006', outcome: 'no_connection', checkedAt: evidence[0].checkedAt }];
  const before = structuredClone(input); const result = buildActorResearch(input);
  assert.deepEqual(buildActorResearch(input), result); assert.deepEqual(input, before);
  assert.ok(renderActorResearch(result).includes('拓哉 BLEACH 2006'));
  assert.ok(renderActorResearch(result).includes('本番への書込み0件'));
});
test('a namesake exclusion needs evidence, differing birthdays and the current actor version', () => {
  const input = fixture(); const record = linked(input.research.actors[0]);
  record.facts.birthday = { status:'confirmed', value:'1980-10-29', evidence };
  input.actors = [{id:'other-person',name:'拓哉',slug:'takuya',birthday:'1999-01-01',updated_at:'2026-01-01T00:00:00Z'}];
  record.distinctActors = [{actorId:'other-person',expectedName:'拓哉',expectedBirthday:'1999-01-01',expectedUpdatedAt:'2026-01-01T00:00:00Z',evidence}];
  assert.deepEqual(buildActorResearch(input).rows[0].issues,[]);
  input.actors[0].updated_at='2026-02-01T00:00:00Z';
  assert.ok(buildActorResearch(input).rows[0].issues.includes('stale_or_unverified_distinct_actor'));
  input.actors[0].updated_at=record.distinctActors[0].expectedUpdatedAt;
  record.distinctActors[0].evidence=[];
  assert.ok(buildActorResearch(input).rows[0].issues.includes('existing_identity_candidates'));
});

test('the checked-in BLEACH research keeps all 15 distinct cast occurrences and sourced values', async () => {
  const research = JSON.parse(await readFile(new URL('../research/bleach2006-2.actors.json', import.meta.url), 'utf8'));
  assert.equal(research.actors.length, 15);
  assert.equal(new Set(research.actors.map((record) => record.sourceCreditKey)).size, 15);
  // This fixture checks reviewed record validity; the real snapshot/credit keys
  // are checked by the offline CLI against the captured work plan separately.
  const rows = research.actors.map((record) => {
    const source = { sourceActorName: record.sourceActorName, role_name: 'fixture', cast_group: null };
    return { id: sourceCreditId(source), source, newActor: { evidence } };
  });
  const copy = structuredClone(research);
  copy.actors.forEach((record, index) => { record.sourceCreditKey = rows[index].id; });
  const actors = copy.actors.flatMap((record) => (record.distinctActors ?? []).map((item) => ({ id: item.actorId, name: item.expectedName, birthday: item.expectedBirthday, updated_at: item.expectedUpdatedAt })));
  const result = buildActorResearch({ plan: { version: 1, source: { url: copy.sourceUrl, fingerprint: copy.sourceFingerprint }, rows }, actors, research: copy });
  assert.deepEqual(result.counts, { total: 15, profileLinked: 12, appearanceOnly: 3, confirmedFacts: 40, needsReview: 0 });
  assert.equal(result.rows.find((row) => row.sourceActorName === '立花拓也').profileDraft.birthday, null);
  const saito = result.rows.find((row) => row.sourceActorName === '齊藤来未子').profileDraft;
  assert.equal(saito.kana, 'さいとう くみこ');
  assert.equal(saito.birthday, null, 'the other Kumiko Saito must not supply this performer\'s birthday');
  assert.equal(result.rows.find((row) => row.sourceActorName === '加藤学').profileDraft.birthday, null);
  assert.equal(result.rows.find((row) => row.sourceActorName === '末吉司弥').profileDraft.birthday, '1978-05-26');
  assert.equal(result.rows.find((row) => row.sourceActorName === '岩間健児').profileDraft.birthday, '1980-10-29');
  const murakami = result.rows.find((row) => row.sourceActorName === '村上耕平').profileDraft;
  assert.equal(murakami.name_en, 'Kouhei Murakami');
  assert.equal(murakami.height_cm, 170);
  assert.equal(murakami.birthday, null, 'a month/day plus a secondary-source year must not become a verified birthday');
  assert.equal(murakami.kana, null);
});
