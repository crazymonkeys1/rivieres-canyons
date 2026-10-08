// Turns stored values into the words the site shows (French). Pages call these; components get the result.
import { t } from './site';
import { PLACE_FACTS, OFFER_FACTS, GEAR_ICONS, KEY_FACT_ICONS, RISKS, RISK_DEFAULT_ICON } from './site.config';
import type { FactDefinition } from '@orbit/core/content';

/** 45 → "45 min", 90 → "1 h 30", 120 → "2 h". */
export function minutes(n: number): string {
  if (n < 60) return t('place.minutes', { n });
  const h = Math.floor(n / 60), m = n % 60;
  return m ? t('place.hours_minutes', { h, m: String(m).padStart(2, '0') }) : t('place.hours', { h });
}
export function minutesRange(r: { min: number; max: number; note: string | null }): string {
  const base = r.max > r.min ? t('place.range', { a: minutes(r.min), b: minutes(r.max) }) : minutes(r.min);
  return base;
}

/** A fact's value as words, or null when unknown. */
export function factValue(def: FactDefinition, v: unknown): string | null {
  if (v === null || v === undefined) return null;
  switch (def.type) {
    case 'minutes_range': return minutesRange(v as any);
    case 'number': return def.unit === 'ans' ? t('place.age_plus', { n: v as number }) : def.unit === 'min' ? minutes(v as number) : `${v}${def.unit ? ` ${def.unit}` : ''}`;
    case 'choice': return def.labels?.[v as string] ?? String(v);
    case 'choices': return (v as string[]).map((x) => def.labels?.[x] ?? x).join(', ');
    case 'boolean': return v ? t('place.yes') : t('place.no');
    case 'text': return String(v);
  }
}

/** The key facts of a record, in declaration order, with the "à confirmer" flag. */
export function keyFacts(record: { facts: Record<string, unknown>; estimated_fields?: string[] }, defs: readonly FactDefinition[]) {
  return defs.filter((d) => d.key_fact).flatMap((d) => {
    const value = factValue(d, record.facts[d.key]);
    return value ? [{ key: d.key, label: d.label, value, emoji: d.icon, estimated: !!record.estimated_fields?.includes(`facts.${d.key}`) }] : [];
  });
}
export const placeFact = (key: string) => PLACE_FACTS.find((d) => d.key === key)!;
export const offerFact = (key: string) => OFFER_FACTS.find((d) => d.key === key)!;

const pick = (table: [string, string][], label: string, fallback?: string) => table.find(([k]) => label.toLowerCase().includes(k.toLowerCase()))?.[1] ?? fallback;
export const gearIcon = (label: string) => pick(GEAR_ICONS, label);
export const keyFactIcon = (label: string) => pick(KEY_FACT_ICONS, label, '🔹');
export const risk = (key: string) => ({ label: (RISKS as any)[key]?.label ?? key, emoji: (RISKS as any)[key]?.icon ?? RISK_DEFAULT_ICON });

/** "2026-10-02" → "2 octobre 2026". */
export const date = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

