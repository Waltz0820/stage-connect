import type { ActorLink } from "./stage-connect";

export type CastCredit = { roleName: string | null; note: string | null };
export type GroupedPlayCast = {
  name: string | null;
  items: Array<ActorLink & { credits: CastCredit[] }>;
};

// Keep each note attached to its original role(s), even when an actor has
// several rows. Grouping must not turn a single-date guest into an all-run cast.
export const groupPlayCast = (cast: readonly ActorLink[]): GroupedPlayCast[] => {
  const groups = new Map<string | null, GroupedPlayCast>();
  for (const item of cast) {
    const name = item.castGroup?.trim() || null;
    let group = groups.get(name);
    if (!group) {
      group = { name, items: [] };
      groups.set(name, group);
    }
    const credit = { roleName: item.roleName?.trim() || null, note: item.note?.trim() || null };
    const existing = group.items.find((entry) => entry.slug === item.slug);
    if (!existing) {
      group.items.push({ ...item, ...credit, credits: [credit] });
      continue;
    }
    if (!existing.credits.some((entry) => entry.roleName === credit.roleName && entry.note === credit.note)) {
      existing.credits.push(credit);
    }
    const roles = Array.from(new Set(
      `${existing.roleName ?? ""} / ${credit.roleName ?? ""}`.split("/").map((role) => role.trim()).filter(Boolean)
    ));
    existing.roleName = roles.length ? roles.join(" / ") : null;
    existing.isStarring = Boolean(existing.isStarring || item.isStarring);
  }
  return Array.from(groups.values());
};
