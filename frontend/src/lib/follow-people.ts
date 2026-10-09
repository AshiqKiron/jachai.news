const STORAGE_KEY = "shorup_followed_people_ids_v1";

export type FollowPerson = {
  id: string;
  nameEn: string;
  nameBn: string;
  roleEn: string;
  roleBn: string;
};

/** Curated public figures commonly clustered in BD headlines (local follows until server sync). */
export const BD_FOLLOW_PEOPLE: FollowPerson[] = [
  {
    id: "yunus",
    nameEn: "Dr. Muhammad Yunus",
    nameBn: "ড. মুহাম্মদ ইউনূস",
    roleEn: "Chief Adviser",
    roleBn: "প্রধান উপদেষ্টা",
  },
  {
    id: "khaleda-zia",
    nameEn: "Begum Khaleda Zia",
    nameBn: "বেগম খালেদা জিয়া",
    roleEn: "BNP Chairperson",
    roleBn: "বিএনপি চেয়ারপার্সন",
  },
  {
    id: "tarique-rahman",
    nameEn: "Tarique Rahman",
    nameBn: "তারেক রহমান",
    roleEn: "BNP Acting Chair",
    roleBn: "বিএনপি ভারপ্রাপ্ত চেয়ারম্যান",
  },
  {
    id: "sheikh-hasina",
    nameEn: "Sheikh Hasina",
    nameBn: "শেখ হাসিনা",
    roleEn: "Former Prime Minister",
    roleBn: "সাবেক প্রধানমন্ত্রী",
  },
  {
    id: "mahfuz-anam",
    nameEn: "Mahfuz Anam",
    nameBn: "মাহফুজ আনাম",
    roleEn: "Editor, The Daily Star",
    roleBn: "সম্পাদক, দ্য ডেইলি স্টার",
  },
  {
    id: "matiur-rahman",
    nameEn: "Matiur Rahman",
    nameBn: "মতিউর রহমান",
    roleEn: "Editor, Prothom Alo",
    roleBn: "সম্পাদক, প্রথম আলো",
  },
  {
    id: "nayeem-ul-islam",
    nameEn: "Nayeemul Islam Khan",
    nameBn: "নঈমুল ইসলাম খান",
    roleEn: "Media commentator",
    roleBn: "মিডিয়া বিশ্লেষক",
  },
  {
    id: "rehana-parvin",
    nameEn: "Rehana Parvin",
    nameBn: "রেহানা পারভীন",
    roleEn: "Senior correspondent",
    roleBn: "সিনিয়র সংবাদকর্মী",
  },
];

const VALID_IDS = new Set(BD_FOLLOW_PEOPLE.map((p) => p.id));

function parseIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === "string" && VALID_IDS.has(item));
}

function readRaw(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return parseIds(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

function writeRaw(ids: string[]): void {
  if (typeof window === "undefined") return;
  const unique = [...new Set(ids)].filter((id) => VALID_IDS.has(id));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
}

export function readFollowedPeopleIds(): string[] {
  return readRaw();
}

export function isPersonFollowed(personId: string): boolean {
  return readRaw().includes(personId);
}

export function setPersonFollowed(personId: string, followed: boolean): string[] {
  if (!VALID_IDS.has(personId)) return readRaw();
  const current = new Set(readRaw());
  if (followed) current.add(personId);
  else current.delete(personId);
  const next = [...current];
  writeRaw(next);
  return next;
}

export function togglePersonFollowed(personId: string): string[] {
  return setPersonFollowed(personId, !isPersonFollowed(personId));
}

export function followPersonById(personId: string): FollowPerson | undefined {
  return BD_FOLLOW_PEOPLE.find((p) => p.id === personId);
}

/** Demo tab on profile — illustrative follows, not persisted. */
export const DEMO_FOLLOWED_PEOPLE_IDS = ["yunus", "mahfuz-anam"];
