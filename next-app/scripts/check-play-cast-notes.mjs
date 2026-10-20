import assert from 'node:assert/strict';
import * as cheerio from 'cheerio';

const base = process.env.STAGE_VERIFY_BASE_URL || 'http://127.0.0.1:8139';
const cases = [
  ['allout2017', 'hagino-takashi', 'コーチ', 'Coach'],
  ['enstars-the-stage-witness-of-miracle', 'hashimoto-shinichi', '大阪公演（2022年11月3日〜6日）は、一部楽曲を除くライブシーンで橋本真一の歌唱録音を使用。ストーリー場面も身体の負担を考慮し、一部台詞のカット・話者変更あり。', "For the Osaka performances (November 3–6, 2022), Shinichi Hashimoto's recorded vocals were used in the live concert scenes, except for some songs. To reduce physical strain, some lines in the story scenes were also cut or reassigned."],
  ...[
    ['fujita-ray', '7月11日14:00／18:30', 'July 11, 14:00 / 18:30'],
    ['kawahara-kazuma', '7月11日14:00／18:30', 'July 11, 14:00 / 18:30'],
    ['nemoto-masakazu', '7月13日14:00／18:30', 'July 13, 14:00 / 18:30'],
    ['nanaki-kanon', '7月12日14:00／18:30、7月14日12:30／17:00', 'July 12, 14:00 / 18:30; July 14, 12:30 / 17:00'],
    ['daigo-cecile', '7月12日14:00／18:30、7月13日14:00／18:30', 'July 12, 14:00 / 18:30; July 13, 14:00 / 18:30'],
    ['kominami-koji', '7月15日12:00', 'July 15, 12:00'],
    ['akazawa-ryotaro', '7月15日12:00', 'July 15, 12:00'],
    ['yamauchi-yuka', '7月14日12:30／17:00', 'July 14, 12:30 / 17:00'],
  ].map(([actor, ja, en]) => ['moriarty-musical-concert-2024', actor, `ゲスト出演：${ja}公演。`, `Guest appearance: ${en}.`]),
];
const report = [];
for (const prefix of ['', '/en']) {
  for (const slug of new Set(cases.map(row => row[0]))) {
    const path = `${prefix}/plays/${slug}`;
    const response = await fetch(base + path);
    assert.equal(response.status, 200, path);
    const $ = cheerio.load(await response.text());
    assert.equal($('html').attr('lang'), prefix ? 'en' : 'ja');
    assert.equal($('link[rel="canonical"]').attr('href'), 'https://stageconnect.jp' + path);
    for (const [, actor, ja, en] of cases.filter(row => row[0] === slug)) {
      const card = $(`#cast .cast-card-link[href="${prefix}/actors/${actor}"]`);
      assert.equal(card.length, 1, path + ' ' + actor);
      assert.equal(card.find('.cast-note').text(), prefix ? en : ja, path + ' ' + actor);
      assert.ok(card.find('.cast-role').text().trim(), path + ' role kept');
    }
    assert.equal($('#cast .cast-note').length, cases.filter(row => row[0] === slug).length, path + ' no duplicates');
    assert.equal($('.oshi-choice').length, 10, path + ' voting retained');
    assert.ok($('#performances').length && $('#streaming').length, path + ' information retained');
    report.push({ path, notes: $('#cast .cast-note').length });
  }
}
console.log(JSON.stringify({ passed: true, pages: report.length, notes: cases.length * 2, report }, null, 2));
