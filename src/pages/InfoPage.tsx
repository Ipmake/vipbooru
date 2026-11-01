import React from "react";
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Link,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha, type SxProps, type Theme } from "@mui/material/styles";
import { Add, DeleteOutline, MoreVert } from "@mui/icons-material";
import { danbooruService } from "../services/danbooru";
import {
  API_KEY_PAGE,
  DANBOORU_URL,
  fetchProfile,
  getLevelName,
  type DanbooruProfile,
} from "../services/danbooruAccount";
import { danbooruUtil } from "../utils/danbooru";
import {
  BLACKLIST_HELP_URL,
  RULE_PRESETS,
  loadBlacklist,
  normalizeRule,
  saveBlacklist,
  validateRule,
} from "../utils/blacklist";
import {
  BLACKLIST_STORAGE_KEY,
  type AutocompleteResult,
  type BlacklistTagSetting,
} from "../types";

/* ---------------------------------- helpers --------------------------------- */

type ImageLoading = "lazy" | "eager";
type AccountStatus =
  | "none"
  | "checking"
  | "verified"
  | "rejected"
  | "unverified";

interface Credentials {
  username: string;
  apiKey: string;
}

interface AddOutcome {
  added: number;
  duplicate: number;
  invalid: number;
}

const KEYS = {
  username: "danbooru_username",
  apiKey: "danbooru_api_key",
  imageLoading: "image_loading",
} as const;

const LINKS = [
  { label: "GitHub", href: "https://github.com/Ipmake/vipbooru" },
  { label: "Danbooru", href: "https://danbooru.donmai.us/" },
  { label: "API docs", href: "https://danbooru.donmai.us/wiki_pages/help:api" },
  { label: "Support on Ko-fi ☕", href: "https://ko-fi.com/ipmake" },
];

const compactNumber = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const readCredentials = (): Credentials | null => {
  const username = localStorage.getItem(KEYS.username);
  const apiKey = localStorage.getItem(KEYS.apiKey);
  return username && apiKey ? { username, apiKey } : null;
};

const loadSettings = () => ({
  imageLoading: (localStorage.getItem(KEYS.imageLoading) === "eager"
    ? "eager"
    : "lazy") as ImageLoading,
  entries: loadBlacklist(),
});

const snapshotOf = (
  imageLoading: ImageLoading,
  entries: BlacklistTagSetting[],
): string =>
  JSON.stringify([imageLoading, entries.map((e) => [e.tag, e.enabled])]);

const summarize = ({ added, duplicate, invalid }: AddOutcome): string => {
  const parts = [added === 1 ? "Added 1 rule" : `Added ${added} rules`];
  if (duplicate) parts.push(`${duplicate} already in the list`);
  if (invalid) parts.push(`${invalid} skipped`);
  return parts.join(", ");
};

const ghostIconButtonSx =
  (danger = false): SxProps<Theme> =>
  (theme) => ({
    border: "none",
    backgroundColor: "transparent",
    color: theme.palette.text.secondary,
    "&:hover": {
      border: "none",
      backgroundColor: alpha(theme.palette.common.white, 0.06),
      color: danger ? theme.palette.error.light : theme.palette.text.primary,
    },
  });

const quietChipSx: SxProps<Theme> = (theme) => ({
  height: 24,
  borderRadius: 1,
  fontSize: "0.75rem",
  backgroundColor: alpha(theme.palette.common.white, 0.04),
  border: `1px solid ${theme.palette.divider}`,
  "& .MuiChip-icon": {
    fontSize: 14,
    ml: 0.75,
    mr: -0.25,
    color: theme.palette.text.secondary,
  },
  "& .MuiChip-label": { px: 1 },
  "&:hover": { backgroundColor: alpha(theme.palette.common.white, 0.08) },
});

/* -------------------------------- small pieces ------------------------------ */

const Section: React.FC<{
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ title, description, action, children }) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 1,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        )}
      </Box>
      {action}
    </Box>
    {children}
  </Box>
);

const RuleText: React.FC<{ rule: string }> = ({ rule }) => (
  <Typography component="div" variant="body2" noWrap>
    {rule.split(" ").map((token, index) => {
      const isMeta = /^[-~]?(rating|status|score|uploaderid):/.test(token);
      return (
        <Box
          key={index}
          component="span"
          sx={{
            mr: 1,
            color: token.startsWith("-")
              ? "error.light"
              : isMeta
                ? "text.secondary"
                : "text.primary",
          }}
        >
          {token}
        </Box>
      );
    })}
  </Typography>
);

const renderSuggestion = (
  props: React.HTMLAttributes<HTMLLIElement> & { key?: React.Key },
  option: AutocompleteResult | string,
) => {
  const { key, ...liProps } = props;
  const isString = typeof option === "string";
  const label = isString ? option : option.label;
  const category = isString ? undefined : option.category;
  const postCount = isString ? undefined : option.post_count;
  const color =
    category !== undefined
      ? danbooruUtil.getCategoryColor(category)
      : undefined;

  return (
    <Box
      component="li"
      key={key}
      {...liProps}
      sx={(theme) => ({
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        px: 1.5,
        py: 0.75,
        borderRadius: 1,
        transition: "background-color 0.15s ease",
        "&:hover, &.Mui-focused, &[aria-selected='true']": {
          backgroundColor: alpha(theme.palette.common.white, 0.06),
        },
      })}
    >
      {color && (
        <Box
          component="span"
          sx={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: color,
            flexShrink: 0,
          }}
        />
      )}
      <Typography variant="body2" noWrap sx={{ minWidth: 0 }}>
        {label}
      </Typography>
      {category !== undefined && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ flexShrink: 0, textTransform: "lowercase" }}
        >
          {danbooruUtil.getCategoryName(category)}
        </Typography>
      )}
      {postCount !== undefined && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ ml: "auto", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}
        >
          {compactNumber.format(postCount)}
        </Typography>
      )}
    </Box>
  );
};

/* ------------------------------------ page ---------------------------------- */

function InfoPage() {
  // Display + blacklist (saved together with the Save bar)
  const [imageLoading, setImageLoading] = React.useState<ImageLoading>("lazy");
  const [entries, setEntries] = React.useState<BlacklistTagSetting[]>([]);
  const [savedSnapshot, setSavedSnapshot] = React.useState<string | null>(null);

  // Rule input
  const [ruleInput, setRuleInput] = React.useState("");
  const [ruleError, setRuleError] = React.useState<string | null>(null);
  const [suggestions, setSuggestions] = React.useState<AutocompleteResult[]>(
    [],
  );
  const [suggestLoading, setSuggestLoading] = React.useState(false);
  const [listQuery, setListQuery] = React.useState("");
  const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(null);
  const [importing, setImporting] = React.useState(false);

  // Account (connected on its own, not part of the Save bar)
  const [credentials, setCredentials] = React.useState<Credentials | null>(
    null,
  );
  const [profile, setProfile] = React.useState<DanbooruProfile | null>(null);
  const [accountStatus, setAccountStatus] =
    React.useState<AccountStatus>("none");
  const [form, setForm] = React.useState({ username: "", apiKey: "" });
  const [connecting, setConnecting] = React.useState(false);
  const [connectError, setConnectError] = React.useState<{
    message: string;
    canForce: boolean;
  } | null>(null);

  const [toast, setToast] = React.useState<string | null>(null);

  // Load saved settings, then re-check any saved login in the background
  React.useEffect(() => {
    const settings = loadSettings();
    setImageLoading(settings.imageLoading);
    setEntries(settings.entries);
    setSavedSnapshot(snapshotOf(settings.imageLoading, settings.entries));

    const saved = readCredentials();
    if (!saved) return;

    setCredentials(saved);
    setAccountStatus("checking");

    let cancelled = false;
    fetchProfile(saved.username, saved.apiKey).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setProfile(result.profile);
        setAccountStatus("verified");
      } else if (result.reason === "rejected") {
        setAccountStatus("rejected");
        setForm({ username: saved.username, apiKey: "" });
      } else {
        setAccountStatus("unverified");
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Tag suggestions for the token currently being typed
  React.useEffect(() => {
    const token = ruleInput.split(/\s+/).pop()?.replace(/^[-~]/, "") ?? "";

    if (!token) {
      setSuggestions([]);
      setSuggestLoading(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      setSuggestLoading(true);
      danbooruService
        .searchAutocomplete(token)
        .then((results) => {
          if (!cancelled) setSuggestions(results);
        })
        .catch(() => {
          if (!cancelled) setSuggestions([]);
        })
        .finally(() => {
          if (!cancelled) setSuggestLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [ruleInput]);

  /* ------------------------------- blacklist ------------------------------- */

  const dirty =
    savedSnapshot !== null &&
    snapshotOf(imageLoading, entries) !== savedSnapshot;
  const activeCount = entries.filter((e) => e.enabled).length;
  const connected = credentials !== null && accountStatus !== "rejected";

  const addRules = (raw: string[]): AddOutcome => {
    const existing = new Set(entries.map((e) => e.tag));
    const fresh: BlacklistTagSetting[] = [];
    const outcome: AddOutcome = { added: 0, duplicate: 0, invalid: 0 };

    for (const item of raw) {
      const rule = normalizeRule(item);
      if (!rule) continue;
      if (validateRule(rule)) {
        outcome.invalid++;
      } else if (existing.has(rule)) {
        outcome.duplicate++;
      } else {
        existing.add(rule);
        fresh.push({ tag: rule, enabled: true });
      }
    }

    if (fresh.length > 0) setEntries((prev) => [...fresh, ...prev]);
    outcome.added = fresh.length;
    return outcome;
  };

  const submitRule = (raw: string) => {
    const rule = normalizeRule(raw);
    if (!rule) return;

    const error = validateRule(rule);
    if (error) {
      setRuleError(error);
      return;
    }
    if (entries.some((e) => e.tag === rule)) {
      setRuleError("Already in the list");
      return;
    }

    addRules([rule]);
    setRuleInput("");
    setRuleError(null);
  };

  // Picking a suggestion commits a lone tag right away. Once the input already
  // has other tokens (or a - / ~ prefix) it replaces the last token so the
  // rule can keep growing.
  const pickSuggestion = (option: AutocompleteResult) => {
    const tokens = ruleInput.trimStart().split(/\s+/);
    const last = tokens.pop() ?? "";
    const prefix = /^[-~]/.exec(last)?.[0] ?? "";
    const next = [...tokens, prefix + option.value].join(" ");

    if (tokens.length === 0 && !prefix) {
      submitRule(next);
    } else {
      setRuleInput(`${next} `);
      setRuleError(null);
    }
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    const text = event.clipboardData.getData("text");
    if (!/[\r\n]/.test(text.trim())) return;

    event.preventDefault();
    setToast(summarize(addRules(text.split(/\r?\n/))));
  };

  const toggleRule = (rule: string) =>
    setEntries((prev) =>
      prev.map((e) => (e.tag === rule ? { ...e, enabled: !e.enabled } : e)),
    );

  const removeRule = (rule: string) =>
    setEntries((prev) => prev.filter((e) => e.tag !== rule));

  const setAllEnabled = (enabled: boolean) =>
    setEntries((prev) => prev.map((e) => ({ ...e, enabled })));

  const copyRules = async () => {
    try {
      await navigator.clipboard.writeText(entries.map((e) => e.tag).join("\n"));
      setToast(`Copied ${entries.length} rules`);
    } catch {
      setToast("Couldn't copy to the clipboard");
    }
  };

  const importFromAccount = async () => {
    if (!credentials) return;

    setImporting(true);
    const result = await fetchProfile(credentials.username, credentials.apiKey);
    setImporting(false);

    if (!result.ok) {
      setToast(
        result.reason === "rejected"
          ? "Danbooru rejected the saved API key"
          : "Couldn't reach Danbooru",
      );
      return;
    }

    const lines = (result.profile.blacklisted_tags ?? "")
      .split(/\r?\n/)
      .filter((line) => line.trim());

    setToast(
      lines.length === 0
        ? "Your Danbooru blacklist is empty"
        : summarize(addRules(lines)),
    );
  };

  const save = () => {
    localStorage.setItem(KEYS.imageLoading, imageLoading);
    saveBlacklist(entries);
    setSavedSnapshot(snapshotOf(imageLoading, entries));
    setToast("Settings saved");
  };

  const discard = () => {
    const settings = loadSettings();
    setImageLoading(settings.imageLoading);
    setEntries(settings.entries);
  };

  const resetAll = () => {
    if (!window.confirm("Reset all settings, including your Danbooru login?")) {
      return;
    }

    [
      KEYS.username,
      KEYS.apiKey,
      KEYS.imageLoading,
      BLACKLIST_STORAGE_KEY,
    ].forEach((key) => localStorage.removeItem(key));

    setImageLoading("lazy");
    setEntries([]);
    setCredentials(null);
    setProfile(null);
    setAccountStatus("none");
    setForm({ username: "", apiKey: "" });
    setConnectError(null);
    setSavedSnapshot(snapshotOf("lazy", []));
    setToast("Settings reset");
  };

  /* -------------------------------- account -------------------------------- */

  const connect = async (event?: React.FormEvent, force = false) => {
    event?.preventDefault();
    const username = form.username.trim();
    const apiKey = form.apiKey.trim();
    if (!username || !apiKey) return;

    setConnectError(null);

    let verified: DanbooruProfile | null = null;
    if (!force) {
      setConnecting(true);
      const result = await fetchProfile(username, apiKey);
      setConnecting(false);

      if (!result.ok) {
        setConnectError(
          result.reason === "rejected"
            ? {
                message: "Danbooru rejected that username and API key.",
                canForce: false,
              }
            : {
                message: "Couldn't reach Danbooru to check these credentials.",
                canForce: true,
              },
        );
        return;
      }
      verified = result.profile;
    }

    localStorage.setItem(KEYS.username, username);
    localStorage.setItem(KEYS.apiKey, apiKey);
    setCredentials({ username, apiKey });
    setProfile(verified);
    setAccountStatus(verified ? "verified" : "unverified");
    setForm({ username: "", apiKey: "" });
    setToast(verified ? `Connected as ${verified.name}` : "Login saved");
  };

  const disconnect = () => {
    localStorage.removeItem(KEYS.username);
    localStorage.removeItem(KEYS.apiKey);
    setCredentials(null);
    setProfile(null);
    setAccountStatus("none");
    setConnectError(null);
    setToast("Disconnected");
  };

  const accountSubtitle =
    accountStatus === "checking"
      ? "Checking login…"
      : accountStatus === "unverified"
        ? "Couldn't reach Danbooru to check this login"
        : profile
          ? getLevelName(profile.level)
          : "";

  const showListFilter = entries.length > 8;
  const query = showListFilter ? normalizeRule(listQuery) : "";
  const visibleEntries = query
    ? entries.filter((e) => e.tag.includes(query))
    : entries;
  const availablePresets = RULE_PRESETS.filter(
    (preset) => !entries.some((e) => e.tag === preset.rule),
  );

  /* ---------------------------------- view ---------------------------------- */

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        overflow: "auto",
        WebkitOverflowScrolling: "touch",
        px: { xs: 2, sm: 3, md: 4 },
        pt: { xs: 11, sm: 12 },
        pb: 4,
      }}
    >
      <Box sx={{ maxWidth: 1100, mx: "auto", width: "100%" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "minmax(0, 5fr) minmax(0, 7fr)",
            },
            alignItems: "start",
          }}
        >
          {/* Left: about, account, display */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 3.5,
              pr: { md: 5 },
              minWidth: 0,
            }}
          >
            <Section
              title="About VipBooru"
              description={
                <>
                  A modern, fast alternative interface for browsing Danbooru.
                  Long story short, I got tired of Danbooru&apos;s clunky and
                  outdated &quot;1990s ahhh&quot; interface, so I made my own.
                </>
              }
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Avatar
                  src="https://kllfkvpwiqiwvauovdmw.supabase.co/storage/v1/object/public/assets/other/logo.png"
                  alt="Ipmake"
                  sx={{ width: 24, height: 24 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Created by{" "}
                  <Link
                    href="https://ipmake.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    sx={{ color: "text.primary", fontWeight: 600 }}
                  >
                    Ipmake
                  </Link>
                </Typography>
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                {LINKS.map(({ label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    variant="body2"
                    color="text.secondary"
                    sx={{ "&:hover": { color: "text.primary" } }}
                  >
                    {label}
                  </Link>
                ))}
              </Box>
            </Section>

            <Divider />

            <Section
              title="Danbooru account"
              description="Optional. Connect your account to use your favorites and import your Danbooru blacklist."
            >
              {accountStatus === "rejected" && (
                <Alert severity="warning" variant="outlined">
                  Danbooru rejected the saved API key. Enter a new one to
                  reconnect.
                </Alert>
              )}

              {connected && credentials ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Avatar
                    sx={(theme) => ({
                      width: 32,
                      height: 32,
                      fontSize: "0.875rem",
                      color: "text.primary",
                      backgroundColor: alpha(theme.palette.common.white, 0.08),
                    })}
                  >
                    {(profile?.name ?? credentials.username)[0]?.toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    {profile ? (
                      <Link
                        href={`${DANBOORU_URL}/users/${profile.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="hover"
                        color="text.primary"
                        variant="body2"
                        noWrap
                        sx={{ display: "block", fontWeight: 600 }}
                      >
                        {profile.name}
                      </Link>
                    ) : (
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{ fontWeight: 600 }}
                      >
                        {credentials.username}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {accountSubtitle}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    color="inherit"
                    onClick={disconnect}
                    sx={{ py: 0.5, px: 1.5 }}
                  >
                    Disconnect
                  </Button>
                </Box>
              ) : (
                <Box
                  component="form"
                  onSubmit={(event: React.FormEvent) => connect(event)}
                  sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                >
                  <TextField
                    size="small"
                    label="Username"
                    name="username"
                    autoComplete="username"
                    value={form.username}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, username: e.target.value }))
                    }
                    fullWidth
                  />
                  <TextField
                    size="small"
                    label="API key"
                    name="api_key"
                    type="password"
                    autoComplete="current-password"
                    value={form.apiKey}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, apiKey: e.target.value }))
                    }
                    fullWidth
                  />
                  <Typography variant="caption" color="text.secondary">
                    Generate a key on your{" "}
                    <Link
                      href={API_KEY_PAGE}
                      target="_blank"
                      rel="noopener noreferrer"
                      underline="hover"
                      color="inherit"
                      sx={{ fontWeight: 600 }}
                    >
                      Danbooru profile
                    </Link>
                    . It gives full access to your account, so treat it like a
                    password. It&apos;s stored in this browser only.
                  </Typography>

                  {connectError && (
                    <Alert
                      severity="error"
                      variant="outlined"
                      action={
                        connectError.canForce ? (
                          <Button
                            size="small"
                            color="inherit"
                            onClick={() => connect(undefined, true)}
                          >
                            Save anyway
                          </Button>
                        ) : undefined
                      }
                    >
                      {connectError.message}
                    </Alert>
                  )}

                  <Box>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={
                        connecting ||
                        !form.username.trim() ||
                        !form.apiKey.trim()
                      }
                      startIcon={
                        connecting ? (
                          <CircularProgress size={14} color="inherit" />
                        ) : undefined
                      }
                      sx={{ py: 0.75, px: 2 }}
                    >
                      Connect
                    </Button>
                  </Box>
                </Box>
              )}
            </Section>

            <Divider />

            <Section
              title="Image loading"
              description="Lazy loads images as you scroll and is recommended. Eager loads everything up front and may get you rate-limited."
            >
              <ToggleButtonGroup
                exclusive
                size="small"
                value={imageLoading}
                onChange={(_, value: ImageLoading | null) => {
                  if (value) setImageLoading(value);
                }}
              >
                <ToggleButton value="lazy" sx={{ px: 2 }}>
                  Lazy
                </ToggleButton>
                <ToggleButton value="eager" sx={{ px: 2 }}>
                  Eager
                </ToggleButton>
              </ToggleButtonGroup>
            </Section>

            <Box>
              <Button
                size="small"
                color="inherit"
                onClick={resetAll}
                sx={{ px: 0, py: 0.5, color: "text.secondary" }}
              >
                Reset all settings
              </Button>
            </Box>
          </Box>

          {/* Right: blacklist */}
          <Box
            sx={(theme) => ({
              display: "flex",
              flexDirection: "column",
              gap: 2,
              minWidth: 0,
              pl: { md: 5 },
              pt: { xs: 4, md: 0 },
              mt: { xs: 4, md: 0 },
              borderLeft: {
                xs: "none",
                md: `1px solid ${theme.palette.divider}`,
              },
              borderTop: {
                xs: `1px solid ${theme.palette.divider}`,
                md: "none",
              },
            })}
          >
            <Section
              title="Blacklist"
              description={
                entries.length === 0
                  ? "Hide posts that match a rule."
                  : `${activeCount} of ${entries.length} rules active`
              }
              action={
                <IconButton
                  size="small"
                  aria-label="Blacklist actions"
                  sx={ghostIconButtonSx()}
                  onClick={(event) => setMenuAnchor(event.currentTarget)}
                >
                  <MoreVert fontSize="small" />
                </IconButton>
              }
            />

            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
            >
              <MenuItem
                disabled={!connected || importing}
                onClick={() => {
                  setMenuAnchor(null);
                  importFromAccount();
                }}
              >
                <ListItemText
                  primary="Import from Danbooru account"
                  secondary={
                    !connected ? "Connect your account first" : undefined
                  }
                />
              </MenuItem>
              <MenuItem
                disabled={entries.length === 0}
                onClick={() => {
                  setMenuAnchor(null);
                  copyRules();
                }}
              >
                Copy as text
              </MenuItem>
              <Divider sx={{ my: 0.5 }} />
              <MenuItem
                disabled={entries.length === 0}
                onClick={() => {
                  setMenuAnchor(null);
                  setAllEnabled(true);
                }}
              >
                Enable all
              </MenuItem>
              <MenuItem
                disabled={entries.length === 0}
                onClick={() => {
                  setMenuAnchor(null);
                  setAllEnabled(false);
                }}
              >
                Disable all
              </MenuItem>
              <Divider sx={{ my: 0.5 }} />
              <MenuItem
                disabled={entries.length === 0}
                sx={{ color: "error.light" }}
                onClick={() => {
                  setMenuAnchor(null);
                  setEntries([]);
                }}
              >
                Remove all
              </MenuItem>
            </Menu>

            <Box>
              <Autocomplete
                freeSolo
                size="small"
                options={suggestions}
                value={null}
                inputValue={ruleInput}
                loading={suggestLoading}
                filterOptions={(options) => options}
                getOptionLabel={(option) =>
                  typeof option === "string" ? option : option.label
                }
                onInputChange={(_, value, reason) => {
                  if (reason === "input" || reason === "clear") {
                    setRuleInput(value);
                    setRuleError(null);
                  }
                }}
                onChange={(_, value, reason) => {
                  if (!value) return;
                  if (typeof value === "string") {
                    if (reason === "createOption") submitRule(value);
                    return;
                  }
                  pickSuggestion(value);
                }}
                renderOption={renderSuggestion}
                slotProps={{
                  popper: {
                    placement: "bottom-start",
                    modifiers: [
                      { name: "offset", options: { offset: [0, 8] } },
                    ],
                  },
                  listbox: { sx: { p: 0.5 } },
                  paper: {
                    sx: (theme: Theme) => ({
                      border: `1px solid ${theme.palette.divider}`,
                      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
                    }),
                  },
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    error={Boolean(ruleError)}
                    placeholder="Add a tag or rule, like furry -rating:g"
                    slotProps={{
                      input: {
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {suggestLoading ? (
                              <CircularProgress color="inherit" size={16} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      },
                      htmlInput: { ...params.inputProps, onPaste: handlePaste },
                    }}
                  />
                )}
              />
              <Typography
                variant="caption"
                color={ruleError ? "error.light" : "text.secondary"}
                sx={{ display: "block", mt: 0.75 }}
              >
                {ruleError ?? (
                  <>
                    Enter adds a rule. Combine tags with spaces, exclude with -,
                    match any with ~.{" "}
                    <Link
                      href={BLACKLIST_HELP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      underline="hover"
                      color="inherit"
                      sx={{ fontWeight: 600 }}
                    >
                      Syntax help
                    </Link>
                  </>
                )}
              </Typography>
            </Box>

            {availablePresets.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 0.75,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mr: 0.5 }}
                >
                  Quick add
                </Typography>
                {availablePresets.map((preset) => (
                  <Chip
                    key={preset.rule}
                    size="small"
                    icon={<Add />}
                    label={preset.label}
                    onClick={() => addRules([preset.rule])}
                    sx={quietChipSx}
                  />
                ))}
              </Box>
            )}

            {showListFilter && (
              <TextField
                size="small"
                placeholder="Filter rules"
                value={listQuery}
                onChange={(e) => setListQuery(e.target.value)}
                fullWidth
              />
            )}

            {entries.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No rules yet. Add a tag above or paste your Danbooru blacklist.
              </Typography>
            ) : visibleEntries.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No rules match that filter.
              </Typography>
            ) : (
              <Box>
                {visibleEntries.map((entry) => (
                  <Box
                    key={entry.tag}
                    sx={(theme) => ({
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      py: 0.5,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      "&:last-of-type": { borderBottom: "none" },
                    })}
                  >
                    <Switch
                      size="small"
                      checked={entry.enabled}
                      onChange={() => toggleRule(entry.tag)}
                      inputProps={{ "aria-label": `Toggle ${entry.tag}` }}
                    />
                    <Box
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        opacity: entry.enabled ? 1 : 0.45,
                        transition: "opacity 0.15s ease",
                      }}
                    >
                      <RuleText rule={entry.tag} />
                    </Box>
                    <IconButton
                      size="small"
                      aria-label={`Remove ${entry.tag}`}
                      sx={ghostIconButtonSx(true)}
                      onClick={() => removeRule(entry.tag)}
                    >
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>

        {dirty && (
          <Box
            sx={(theme) => ({
              position: "sticky",
              bottom: 16,
              zIndex: 5,
              mt: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              px: 2,
              py: 1,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.background.paper, 0.9),
              backdropFilter: "blur(12px)",
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
            })}
          >
            <Typography variant="body2" color="text.secondary">
              Unsaved changes
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                size="small"
                color="inherit"
                onClick={discard}
                sx={{ py: 0.5, px: 1.5 }}
              >
                Discard
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={save}
                sx={{ py: 0.5, px: 2 }}
              >
                Save
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      <Snackbar
        open={toast !== null}
        autoHideDuration={3500}
        onClose={(_, reason) => {
          if (reason !== "clickaway") setToast(null);
        }}
        message={toast ?? ""}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      />
    </Box>
  );
}

export default InfoPage;
