// Change this if your app talks to Danbooru through a proxy.
export const DANBOORU_URL = "https://danbooru.donmai.us";

// Danbooru's API docs say API keys are generated from the profile page.
export const API_KEY_PAGE = `${DANBOORU_URL}/profile`;

export interface DanbooruProfile {
  id: number;
  name: string;
  level: number;
  blacklisted_tags?: string;
}

export type ProfileResult =
  | { ok: true; profile: DanbooruProfile }
  | { ok: false; reason: "rejected" | "unreachable" };

// Levels as listed in Danbooru's API:Users docs.
const USER_LEVELS: Record<number, string> = {
  10: "Restricted",
  20: "Member",
  30: "Gold",
  31: "Platinum",
  32: "Builder",
  35: "Contributor",
  37: "Approver",
  40: "Moderator",
  50: "Admin",
  60: "Owner",
};

export const getLevelName = (level: number): string =>
  USER_LEVELS[level] ?? `Level ${level}`;

/**
 * Calls /profile.json with the given credentials. Danbooru answers 401 when
 * authentication fails, which we report as "rejected". Anything else that goes
 * wrong (network, CORS, 5xx, rate limit) is "unreachable" so the caller can
 * tell a bad key apart from a connectivity problem.
 */
export const fetchProfile = async (
  username: string,
  apiKey: string,
): Promise<ProfileResult> => {
  const params = new URLSearchParams({ login: username, api_key: apiKey });

  try {
    const response = await fetch(`${DANBOORU_URL}/profile.json?${params}`);

    if (response.status === 401 || response.status === 403) {
      return { ok: false, reason: "rejected" };
    }
    if (!response.ok) {
      return { ok: false, reason: "unreachable" };
    }

    const profile = (await response.json()) as Partial<DanbooruProfile>;
    if (typeof profile.id !== "number" || !profile.name) {
      return { ok: false, reason: "rejected" };
    }

    return { ok: true, profile: profile as DanbooruProfile };
  } catch {
    return { ok: false, reason: "unreachable" };
  }
};
