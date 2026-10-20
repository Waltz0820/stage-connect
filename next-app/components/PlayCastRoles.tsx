import type { CastCredit } from "../lib/play-cast";
import { translateAnnotatedDisplayTextEn, translateCastNoteEn } from "../lib/en-copy";

export function PlayCastRoles({ roleName, credits, locale }: {
  roleName: string | null;
  credits: readonly CastCredit[];
  locale: "ja" | "en";
}) {
  const roleText = (value: string) => locale === "en" ? translateAnnotatedDisplayTextEn(value) : value;

  if (credits.some((credit) => credit.note)) {
    return credits.filter((credit) => credit.roleName || credit.note).map((credit) => (
      <div className="cast-credit" key={JSON.stringify([credit.roleName, credit.note])}>
        {credit.roleName ? <div className="cast-role">{roleText(credit.roleName)}</div> : null}
        {credit.note ? (
          <div className="cast-note">{locale === "en" ? translateCastNoteEn(credit.note) : credit.note}</div>
        ) : null}
      </div>
    ));
  }

  if (!roleName) return null;
  const translated = roleText(roleName);
  const roles = translated.split(" / ").map((role) => role.trim()).filter(Boolean);
  const text = roles.length <= 3 ? translated : `${roles.slice(0, 3).join(" / ")} / ${locale === "en" ? `${roles.length - 3} more` : `ほか${roles.length - 3}役`}`;
  return <div className="cast-role">{text}</div>;
}
