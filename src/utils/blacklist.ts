import {
  BLACKLIST_STORAGE_KEY,
  type BlacklistTagSetting,
  type DanbooruPost,
} from "../types";

/**
 * Blacklist rules use Danbooru's own syntax (one rule per entry):
 *   tag1 tag2     all tags must be present
 *   -tag          the tag must be absent
 *   ~tag1 ~tag2   at least one of the ~ tags must be present
 *   rating:explicit | rating:questionable | rating:sensitive | rating:general
 *   status:pending | status:flagged | status:deleted
 *   score:<-5     less-than comparisons only
 *   uploaderid:1234
 *
 * A plain single tag is just the simplest rule, so entries saved by the old
 * tag-only blacklist keep working.
 */

export const BLACKLIST_HELP_URL =
  "https://danbooru.donmai.us/wiki_pages/help:blacklists";

export const RULE_PRESETS = [
  { label: "AI Slop", rule: "ai-generated" },
  { label: "Explicit", rule: "rating:explicit" },
  { label: "Questionable", rule: "rating:questionable" },
  { label: "Sensitive", rule: "rating:sensitive" },
  { label: "Deleted", rule: "status:deleted" },
  { label: "Flagged", rule: "status:flagged" },
  { label: "Score below 0", rule: "score:<0" },
] as const;

export const normalizeRule = (rule: string): string =>
  rule.trim().toLowerCase().replace(/\s+/g, " ");

const RATING_CODES = new Map([
  ["g", "g"],
  ["general", "g"],
  ["s", "s"],
  ["sensitive", "s"],
  ["q", "q"],
  ["questionable", "q"],
  ["e", "e"],
  ["explicit", "e"],
]);

const STATUSES = new Set(["pending", "flagged", "deleted"]);

interface RuleTerms {
  required: string[];
  excluded: string[];
  optional: string[];
}

const parseRule = (rule: string): RuleTerms => {
  const terms: RuleTerms = { required: [], excluded: [], optional: [] };

  for (const token of normalizeRule(rule).split(" ")) {
    if (!token) continue;
    if (token.startsWith("-")) terms.excluded.push(token.slice(1));
    else if (token.startsWith("~")) terms.optional.push(token.slice(1));
    else terms.required.push(token);
  }

  return terms;
};

const validateTerm = (term: string): string | null => {
  if (!term) return "Remove the stray - or ~";

  const separator = term.indexOf(":");
  if (separator <= 0) return null;

  const name = term.slice(0, separator);
  const arg = term.slice(separator + 1);

  switch (name) {
    case "rating":
      return RATING_CODES.has(arg) ? null : `Unknown rating "${arg}"`;
    case "status":
      return STATUSES.has(arg)
        ? null
        : "Status must be pending, flagged or deleted";
    case "score":
      return /^<-?\d+$/.test(arg)
        ? null
        : "Score only supports less-than, like score:<-5";
    case "uploaderid":
      return /^\d+$/.test(arg) ? null : "uploaderid needs a numeric user id";
    default:
      return null;
  }
};

/** Returns an error message, or null when the rule is valid. */
export const validateRule = (rule: string): string | null => {
  const { required, excluded, optional } = parseRule(rule);

  if (required.length + excluded.length + optional.length === 0) {
    return "Enter a tag";
  }

  for (const term of [...required, ...excluded, ...optional]) {
    const error = validateTerm(term);
    if (error) return error;
  }

  // A rule made only of exclusions would hide nearly every post.
  if (required.length + optional.length === 0) {
    return "Add at least one tag without a minus sign";
  }

  return null;
};

const matchesTerm = (
  post: DanbooruPost,
  tags: Set<string>,
  term: string,
): boolean => {
  const separator = term.indexOf(":");

  if (separator > 0) {
    const name = term.slice(0, separator);
    const arg = term.slice(separator + 1);

    switch (name) {
      case "rating":
        return post.rating === RATING_CODES.get(arg);
      case "status":
        if (arg === "pending") return post.is_pending;
        if (arg === "flagged") return post.is_flagged;
        if (arg === "deleted") return post.is_deleted;
        return false;
      case "score":
        return arg.startsWith("<") && post.score < Number(arg.slice(1));
      case "uploaderid":
        return post.uploader_id === Number(arg);
    }
  }

  return tags.has(term);
};

/**
 * Compiles the enabled rules once and returns a predicate that is true when a
 * post should be hidden:
 *
 *   const isHidden = createBlacklistMatcher(loadBlacklist());
 *   const visiblePosts = posts.filter((post) => !isHidden(post));
 */
export const createBlacklistMatcher = (entries: BlacklistTagSetting[]) => {
  const rules = entries
    .filter((entry) => entry.enabled && validateRule(entry.tag) === null)
    .map((entry) => parseRule(entry.tag));

  return (post: DanbooruPost): boolean => {
    if (rules.length === 0) return false;

    const tags = new Set(post.tag_string.split(/\s+/));

    return rules.some(
      ({ required, excluded, optional }) =>
        required.every((term) => matchesTerm(post, tags, term)) &&
        !excluded.some((term) => matchesTerm(post, tags, term)) &&
        (optional.length === 0 ||
          optional.some((term) => matchesTerm(post, tags, term))),
    );
  };
};

/* ---------------------------------- storage --------------------------------- */

export const sanitizeBlacklistEntries = (
  entries: BlacklistTagSetting[],
): BlacklistTagSetting[] => {
  const deduped = new Map<string, BlacklistTagSetting>();

  for (const entry of entries) {
    const rule = normalizeRule(entry.tag);
    if (!rule || deduped.has(rule)) continue;
    deduped.set(rule, { tag: rule, enabled: Boolean(entry.enabled) });
  }

  return [...deduped.values()];
};

const parseBlacklistEntries = (value: string | null): BlacklistTagSetting[] => {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];

    // Legacy format: a plain array of tag strings.
    if (parsed.every((item) => typeof item === "string")) {
      return sanitizeBlacklistEntries(
        (parsed as string[]).map((tag) => ({ tag, enabled: true })),
      );
    }

    return sanitizeBlacklistEntries(
      parsed
        .filter((item): item is BlacklistTagSetting => {
          if (typeof item !== "object" || item === null) return false;
          return typeof (item as Partial<BlacklistTagSetting>).tag === "string";
        })
        .map((item) => ({ tag: item.tag, enabled: item.enabled ?? true })),
    );
  } catch {
    return [];
  }
};

export const loadBlacklist = (): BlacklistTagSetting[] =>
  parseBlacklistEntries(localStorage.getItem(BLACKLIST_STORAGE_KEY));

export const saveBlacklist = (entries: BlacklistTagSetting[]): void => {
  localStorage.setItem(
    BLACKLIST_STORAGE_KEY,
    JSON.stringify(sanitizeBlacklistEntries(entries)),
  );
};
