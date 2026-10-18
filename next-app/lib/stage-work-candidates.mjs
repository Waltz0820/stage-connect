import { createHash } from 'node:crypto';
import { isEnsembleOnlyCredit, sourceCreditId } from './work-import-plan.mjs';

export function buildWorkCandidateBatch(plan) {
  if (plan?.version !== 1 || plan.mode !== 'review_only' || plan.blockers?.length || !plan.play?.id || !plan.rows?.length) throw new Error('作品の照合を完了してから候補を保存してください。');
  if (plan.rows.some((row) => row.action !== 'keep' && isEnsembleOnlyCredit(row.source))) throw new Error('役名のないアンサンブル・ダンサーは作品クレジットへ転記してください。');
  if (plan.rows.some((row) => row.action === 'hold' || row.issues?.length)) throw new Error('保留の配役があります。確認してから候補を保存してください。');
  const url = new URL(plan.source.url);
  if (url.origin !== 'https://kira-hai.net' || !/^\/[a-z0-9_-]+\/?$/u.test(url.pathname)) throw new Error('キラハイの作品URLを指定してください。');
  const years = [...plan.source.title.matchAll(/\b(?:19|20)\d{2}\b/gu)].map((match) => Number(match[0]));
  const items = plan.rows.map((row) => {
    if (row.id !== sourceCreditId(row.source)) throw new Error('配役原文と照合キーが一致しません。準備案を作り直してください。');
    if (row.source.sourceActorUrl && new URL(row.source.sourceActorUrl).protocol !== 'https:') throw new Error('俳優URLはHTTPSが必要です。');
    return {
      source_actor_name: row.source.sourceActorName, source_actor_url: row.source.sourceActorUrl ?? null,
      source_work_title: plan.source.title, source_year: years.length === 1 ? years[0] : null,
      source_role_raw: row.source.role_name ?? null, source_role_names: row.source.role_name ? [row.source.role_name] : [],
      source_cast_group: row.source.cast_group ?? null, source_order: row.sourceOrder, source_credit_key: row.id,
      source_evidence: { links: row.evidence, source_fingerprint: plan.source.fingerprint,
        review_fingerprint: plan.reviewFingerprint, snapshot_fingerprint: plan.snapshotFingerprint, identity: row.identity },
      matched_actor_id: row.actor?.id ?? null, matched_play_id: plan.play.id,
      status: row.actor ? 'pending' : 'needs_review',
    };
  });
  if (new Set(items.map((item) => item.source_credit_key)).size !== items.length) throw new Error('配役が重複しています。');
  const key = createHash('sha256').update(JSON.stringify({ workUrl: url.href, items })).digest('hex');
  return { workUrl: url.href, key, items };
}

export async function stageWorkCandidates(supabase, plan, { write = false } = {}) {
  const batch = buildWorkCandidateBatch(plan);
  if (!write) return { status: 'dry_run', batch, writes: 0 };
  const { data, error } = await supabase.rpc('stage_external_work_cast_candidates', {
    p_work_url: batch.workUrl, p_batch_key: batch.key, p_items: batch.items,
  });
  if (error) {
    if (error.code === 'PGRST202') throw Object.assign(new Error('作品単位の候補保存SQLが未適用です。候補への書込みは行っていません。'), { code: 'WORK_STORAGE_UNAVAILABLE' });
    throw error;
  }
  if (data?.rows?.length !== batch.items.length) throw new Error('保存結果を確認できません。同じ準備案で再確認してください。');
  const returnedKeys = new Set(data.rows.map((row) => row.source_credit_key));
  if (returnedKeys.size !== batch.items.length || data.rows.some((row) => !row.candidate_id) || batch.items.some((item) => !returnedKeys.has(item.source_credit_key))) throw new Error('保存した配役候補の対応を確認できません。同じ準備案で再確認してください。');
  return { status: 'staged', ...data, batchKey: batch.key };
}
