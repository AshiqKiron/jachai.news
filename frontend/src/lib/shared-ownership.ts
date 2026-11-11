import type { MediaOwnership } from "@/lib/source-media-ownership";

/** One outlet in a cluster, after ownership has been resolved. */
export type OwnershipOutlet = {
  sourceName: string;
  mediaOwnership: MediaOwnership | null;
};

export type SharedOwnershipGroup = {
  /** Normalized label, stable for list keys. */
  key: string;
  /** Parent company when that is the shared link, otherwise the operating owner. */
  label: string;
  url: string | null;
  outlets: string[];
};

export type SharedOwnershipAnalysis = {
  outletCount: number;
  ownerCount: number;
  /** Shared groups first, then single-outlet owners. */
  groups: SharedOwnershipGroup[];
};

type OutletNode = {
  sourceName: string;
  ownerName: string;
  ownerUrl: string;
  parentName: string | null;
  parentUrl: string | null;
};

function normalizeOwnerKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function countPhrase(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** English count line, e.g. "4 outlets, 2 owners". */
export function sharedOwnershipCountEn(analysis: SharedOwnershipAnalysis): string {
  return `${countPhrase(analysis.outletCount, "outlet", "outlets")}, ${countPhrase(analysis.ownerCount, "owner", "owners")}`;
}

/** Bangla count line parallel to {@link sharedOwnershipCountEn}. */
export function sharedOwnershipCountBn(analysis: SharedOwnershipAnalysis): string {
  return `${analysis.outletCount}টি আউটলেট, ${analysis.ownerCount} মালিক`;
}

/**
 * Groups cluster outlets that share an owner or parent name.
 * Returns null unless at least two outlets belong to the same group.
 * Outlets with no ownership are left out of both counts.
 */
export function analyzeSharedOwnership(
  outlets: OwnershipOutlet[],
): SharedOwnershipAnalysis | null {
  const bySource = new Map<string, OutletNode>();

  for (const outlet of outlets) {
    const ownership = outlet.mediaOwnership;
    const sourceName = outlet.sourceName.trim();
    if (!ownership || !sourceName) continue;
    const sourceKey = sourceName.toLowerCase();
    if (bySource.has(sourceKey)) continue;
    const ownerName = ownership.owner.name.trim();
    if (!ownerName) continue;
    bySource.set(sourceKey, {
      sourceName,
      ownerName,
      ownerUrl: ownership.owner.url.trim(),
      parentName: ownership.parent?.name.trim() || null,
      parentUrl: ownership.parent?.url.trim() || null,
    });
  }

  const nodes = [...bySource.values()];
  if (nodes.length < 2) return null;

  const parent = nodes.map((_, index) => index);

  function find(index: number): number {
    let root = index;
    while (parent[root] !== root) {
      root = parent[root] ?? root;
    }
    let cursor = index;
    while (parent[cursor] !== root) {
      const next = parent[cursor] ?? root;
      parent[cursor] = root;
      cursor = next;
    }
    return root;
  }

  function union(left: number, right: number): void {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parent[rightRoot] = leftRoot;
  }

  const tokenIndexes = new Map<string, number[]>();
  nodes.forEach((node, index) => {
    const tokens = [normalizeOwnerKey(node.ownerName)];
    if (node.parentName) tokens.push(normalizeOwnerKey(node.parentName));
    for (const token of tokens) {
      if (!token) continue;
      const indexes = tokenIndexes.get(token);
      if (indexes) indexes.push(index);
      else tokenIndexes.set(token, [index]);
    }
  });

  for (const indexes of tokenIndexes.values()) {
    const first = indexes[0];
    if (first === undefined) continue;
    for (const index of indexes.slice(1)) union(first, index);
  }

  const memberIndexes = new Map<number, number[]>();
  nodes.forEach((_, index) => {
    const root = find(index);
    const members = memberIndexes.get(root);
    if (members) members.push(index);
    else memberIndexes.set(root, [index]);
  });

  const groups: SharedOwnershipGroup[] = [];
  for (const indexes of memberIndexes.values()) {
    const members = indexes
      .map((index) => nodes[index])
      .filter((node): node is OutletNode => node !== undefined);
    if (members.length === 0) continue;
    const label = pickGroupLabel(members);
    groups.push({
      key: label.key,
      label: label.name,
      url: label.url,
      outlets: members
        .map((member) => member.sourceName)
        .sort((left, right) => left.localeCompare(right)),
    });
  }

  if (!groups.some((group) => group.outlets.length >= 2)) return null;

  groups.sort(
    (left, right) =>
      right.outlets.length - left.outlets.length || left.label.localeCompare(right.label),
  );

  return {
    outletCount: nodes.length,
    ownerCount: groups.length,
    groups,
  };
}

function pickGroupLabel(members: OutletNode[]): { key: string; name: string; url: string | null } {
  type Candidate = {
    key: string;
    name: string;
    url: string | null;
    isParent: boolean;
    count: number;
  };
  const candidates = new Map<string, Candidate>();

  function add(name: string, url: string | null, isParent: boolean): void {
    const key = normalizeOwnerKey(name);
    if (!key) return;
    const existing = candidates.get(key);
    if (existing) {
      existing.count += 1;
      if (isParent) existing.isParent = true;
      if (!existing.url && url) existing.url = url;
      return;
    }
    candidates.set(key, { key, name, url, isParent, count: 1 });
  }

  for (const member of members) {
    add(member.ownerName, member.ownerUrl || null, false);
    if (member.parentName) add(member.parentName, member.parentUrl, true);
  }

  const all = [...candidates.values()];
  const shared = all.filter((candidate) => candidate.count >= 2);
  const pool = shared.length > 0 ? shared : all;
  pool.sort((left, right) => {
    if (left.isParent !== right.isParent) return left.isParent ? -1 : 1;
    if (left.count !== right.count) return right.count - left.count;
    return left.name.localeCompare(right.name);
  });

  const best = pool[0];
  if (!best) {
    const fallback = members[0];
    return {
      key: normalizeOwnerKey(fallback?.ownerName ?? "owner"),
      name: fallback?.ownerName ?? "Owner",
      url: fallback?.ownerUrl || null,
    };
  }
  return { key: best.key, name: best.name, url: best.url };
}
