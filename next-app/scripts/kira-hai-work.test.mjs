import test from 'node:test';
import assert from 'node:assert/strict';
import { parseKiraHaiWork } from '../lib/kira-hai-work.mjs';

test('work extraction keeps unlinked actors and ensemble but excludes social links and comments', () => {
  const html = `<head><meta property="og:title" content="舞台の題名 | kirakira俳優ちゃんネット"></head>
    <h1>site logo</h1><h1>舞台の題名</h1>
    <h3>公演日程</h3><p>2006年8月10日-13日 大阪の会場<br>2006年8月16日-21日 東京の会場</p>
    <h3>キャスト</h3><p>役A：<a href="/actor-a">俳優A</a><br>役B：俳優B<br>＜アンサンブル＞<br>俳優C</p>
    <div>Facebook Twitter B! はてブ Pocket LINEへ送る</div><div>コメントの人名</div>`;
  const result = parseKiraHaiWork(html, 'https://kira-hai.net/work');
  assert.equal(result.title, '舞台の題名');
  assert.equal(result.cast.length, 3);
  assert.equal(result.cast[0].sourceActorUrl, 'https://kira-hai.net/actor-a');
  assert.equal(result.cast[1].sourceActorName, '俳優B');
  assert.equal(result.cast[1].sourceActorUrl, null);
  assert.equal(result.cast[2].cast_group, 'アンサンブル');
  assert.equal(result.scheduleLines.length, 2);
  assert.deepEqual(result.unparsed, []);
});

test('back dancers remain a separate group with no invented character roles', () => {
  const result = parseKiraHaiWork('<h3>キャスト</h3><p>加州清光：佐藤流司<br>＜バックダンサー＞<br>金子直行<br>大野涼太</p><div>Facebook Twitter</div>', 'https://kira-hai.net/work');
  assert.equal(result.cast.length, 3);
  assert.equal(result.cast[1].cast_group, 'バックダンサー');
  assert.equal(result.cast[1].role_name, null);
  assert.deepEqual(result.unparsed, []);
});

test('festival dancers keep their exact group, missing profile links and null roles', () => {
  const result = parseKiraHaiWork(`<h3>キャスト</h3>
    <p>＜fine＞<br>伏見弓弦：<a href="/watanabe-takaki">渡邉駿輝</a><br>
    ＜あんステダンサー＞<br>木本雄<br><a href="/nakada-shoji">仲田祥司</a><br>岡本笙<br>
    ＜未確認区分＞<br>補足の文章</p><h3>関連商品</h3><p>商品名</p>`, 'https://kira-hai.net/ensta2018-2');
  assert.equal(result.cast.length, 4);
  assert.deepEqual(result.cast.slice(1), [
    { sourceActorName: '木本雄', sourceActorUrl: null, role_name: null, cast_group: 'あんステダンサー' },
    { sourceActorName: '仲田祥司', sourceActorUrl: 'https://kira-hai.net/nakada-shoji', role_name: null, cast_group: 'あんステダンサー' },
    { sourceActorName: '岡本笙', sourceActorUrl: null, role_name: null, cast_group: 'あんステダンサー' },
  ]);
  assert.equal(result.cast[0].role_name, '伏見弓弦');
  assert.equal(result.cast[0].cast_group, 'fine');
  assert.deepEqual(result.unparsed, ['補足の文章']);
});
