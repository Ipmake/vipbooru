import React from "react";
import {
  Autocomplete,
  Chip,
  CircularProgress,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
  IconButton,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Avatar,
  Link,
  Stack,
  Switch,
  IconButton as MuiIconButton,
} from "@mui/material";
import { ArrowBack, DeleteOutline } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { danbooruService } from "../services/danbooru";
import { danbooruUtil } from "../utils/danbooru";
import {
  BLACKLIST_STORAGE_KEY,
  type AutocompleteResult,
  type BlacklistTagSetting,
} from "../types";

const normalizeTag = (tag: string): string => tag.trim().toLowerCase();

const sanitizeBlacklistEntries = (
  entries: BlacklistTagSetting[]
): BlacklistTagSetting[] => {
  const dedupedEntries = new Map<string, BlacklistTagSetting>();

  for (const entry of entries) {
    const normalizedTag = normalizeTag(entry.tag);
    if (!normalizedTag || dedupedEntries.has(normalizedTag)) {
      continue;
    }

    dedupedEntries.set(normalizedTag, {
      tag: normalizedTag,
      enabled: Boolean(entry.enabled),
    });
  }

  return [...dedupedEntries.values()];
};

const parseBlacklistEntries = (value: string | null): BlacklistTagSetting[] => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    if (parsed.every((item) => typeof item === "string")) {
      return sanitizeBlacklistEntries(
        (parsed as string[]).map((tag) => ({ tag, enabled: true }))
      );
    }

    const typedEntries = parsed
      .filter((item): item is BlacklistTagSetting => {
        if (typeof item !== "object" || item === null) {
          return false;
        }

        const maybeItem = item as Partial<BlacklistTagSetting>;
        return typeof maybeItem.tag === "string";
      })
      .map((item) => ({
        tag: item.tag,
        enabled: item.enabled ?? true,
      }));

    return sanitizeBlacklistEntries(typedEntries);
  } catch {
    return [];
  }
};

function InfoPage() {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [imageLoading, setImageLoading] = React.useState<"lazy" | "eager">(
    "lazy"
  );
  const [blacklistEntries, setBlacklistEntries] = React.useState<
    BlacklistTagSetting[]
  >([]);
  const [blacklistSuggestions, setBlacklistSuggestions] = React.useState<
    AutocompleteResult[]
  >([]);
  const [blacklistInputValue, setBlacklistInputValue] = React.useState("");
  const [blacklistInputLoading, setBlacklistInputLoading] = React.useState(false);
  const [blacklistAutocompleteOpen, setBlacklistAutocompleteOpen] =
    React.useState(false);
  const [saved, setSaved] = React.useState(false);

  // Load saved settings on mount
  React.useEffect(() => {
    const savedApiKey = localStorage.getItem("danbooru_api_key");
    const savedUsername = localStorage.getItem("danbooru_username");
    const savedImageLoading = localStorage.getItem("image_loading") as
      | "lazy"
      | "eager"
      | null;
    const savedBlacklistEntries = parseBlacklistEntries(
      localStorage.getItem(BLACKLIST_STORAGE_KEY)
    );

    if (savedApiKey) setApiKey(savedApiKey);
    if (savedUsername) setUsername(savedUsername);
    if (savedImageLoading) setImageLoading(savedImageLoading);
    setBlacklistEntries(savedBlacklistEntries);
  }, []);

  React.useEffect(() => {
    const debounceTimer = setTimeout(() => {
      const query = blacklistInputValue.trim();

      if (!query) {
        setBlacklistSuggestions([]);
        setBlacklistInputLoading(false);
        return;
      }

      setBlacklistInputLoading(true);

      danbooruService
        .searchAutocomplete(query)
        .then((results) => {
          setBlacklistSuggestions(results);
        })
        .finally(() => {
          setBlacklistInputLoading(false);
        });
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [blacklistInputValue]);

  const mergeBlacklistTags = React.useCallback(
    (rawTags: string[]) => {
      setBlacklistEntries((previousEntries) => {
        const previousEntriesByTag = new Map(
          previousEntries.map((entry) => [normalizeTag(entry.tag), entry])
        );

        const mergedEntries: BlacklistTagSetting[] = [];
        const seenTags = new Set<string>();

        for (const rawTag of rawTags) {
          const normalizedTag = normalizeTag(rawTag);

          if (!normalizedTag || seenTags.has(normalizedTag)) {
            continue;
          }

          seenTags.add(normalizedTag);
          const previousEntry = previousEntriesByTag.get(normalizedTag);

          mergedEntries.push({
            tag: normalizedTag,
            enabled: previousEntry?.enabled ?? true,
          });
        }

        return mergedEntries;
      });
    },
    [setBlacklistEntries]
  );

  const toggleBlacklistTag = (tag: string) => {
    const normalizedTag = normalizeTag(tag);

    setBlacklistEntries((previousEntries) =>
      previousEntries.map((entry) =>
        normalizeTag(entry.tag) === normalizedTag
          ? { ...entry, enabled: !entry.enabled }
          : entry
      )
    );
  };

  const removeBlacklistTag = (tag: string) => {
    const normalizedTag = normalizeTag(tag);

    setBlacklistEntries((previousEntries) =>
      previousEntries.filter((entry) => normalizeTag(entry.tag) !== normalizedTag)
    );
  };

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem("danbooru_api_key", apiKey.trim());
    } else {
      localStorage.removeItem("danbooru_api_key");
    }

    if (username.trim()) {
      localStorage.setItem("danbooru_username", username.trim());
    } else {
      localStorage.removeItem("danbooru_username");
    }

    localStorage.setItem("image_loading", imageLoading);
    localStorage.setItem(
      BLACKLIST_STORAGE_KEY,
      JSON.stringify(sanitizeBlacklistEntries(blacklistEntries))
    );

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleClear = () => {
    setApiKey("");
    setUsername("");
    setImageLoading("lazy");
    setBlacklistEntries([]);
    localStorage.removeItem("danbooru_api_key");
    localStorage.removeItem("danbooru_username");
    localStorage.removeItem("image_loading");
    localStorage.removeItem(BLACKLIST_STORAGE_KEY);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        overflow: "auto",
        WebkitOverflowScrolling: "touch",
        display: "flex",
        flexDirection: "column",
        px: { xs: 1.5, sm: 3, md: 4 },
        py: { xs: 2, sm: 3 },
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: { xs: 2, sm: 3 } }}>
        <IconButton
          onClick={() => navigate(-1)}
          sx={{
            mr: { xs: 1, sm: 2 },
            color: "primary.main",
            width: { xs: 40, sm: 48 },
            height: { xs: 40, sm: 48 },
          }}
        >
          <ArrowBack />
        </IconButton>
        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{ fontSize: { xs: "1.5rem", sm: "2.125rem" } }}
        >
          Info & Settings
        </Typography>
      </Box>

      <Box sx={{ maxWidth: 800, mx: "auto", width: "100%" }}>
        {/* About Section */}
        <Paper
          sx={{
            p: { xs: 2, sm: 3 },
            mb: { xs: 2, sm: 3 },
            backgroundColor: "rgba(30, 30, 30, 0.95)",
            borderRadius: 2,
          }}
        >
          <Typography
            variant="h5"
            gutterBottom
            fontWeight="bold"
            sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
          >
            About VipBooru
          </Typography>
          <Typography
            variant="body1"
            paragraph
            color="text.secondary"
            sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
          >
            VipBooru is a modern, fast alternative interface for browsing
            Danbooru. Long story short, I got tired of Danbooru's clunky and
            outdates "1990s ahhh" interface, so I made my own.
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
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
                sx={{
                  color: "text.secondary",
                  textDecoration: "none",
                  fontWeight: "bold",
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                Ipmake
              </Link>
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Support me on{" "}
              <Link
                href="https://ko-fi.com/ipmake"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: "text.secondary",
                  textDecoration: "none",
                  fontWeight: "bold",
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                Ko-fi ☕
              </Link>
            </Typography>
          </Box>
        </Paper>

        {/* Settings Section */}
        <Paper
          sx={{
            p: { xs: 2, sm: 3 },
            backgroundColor: "rgba(30, 30, 30, 0.95)",
            borderRadius: 2,
          }}
        >
          <Typography
            variant="h5"
            gutterBottom
            fontWeight="bold"
            sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
          >
            Danbooru API Settings
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            paragraph
            sx={{ fontSize: { xs: "0.85rem", sm: "0.875rem" } }}
          >
            Optional: Provide your Danbooru API credentials to access your
            favorites and increase rate limits. Your credentials are stored
            locally in your browser.
          </Typography>

          <Divider sx={{ my: 2 }} />

          {saved && (
            <Alert
              severity="success"
              sx={{ mb: 2, fontSize: { xs: "0.85rem", sm: "0.875rem" } }}
            >
              Settings saved successfully!
            </Alert>
          )}

          <TextField
            label="Username (optional)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
            helperText="Your Danbooru account username"
            InputProps={{
              sx: { fontSize: { xs: "0.9rem", sm: "1rem" } },
            }}
          />

          <TextField
            label="API Key (optional)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            fullWidth
            type="password"
            sx={{ mb: 3 }}
            helperText="Your Danbooru API key from your account settings"
            InputProps={{
              sx: { fontSize: { xs: "0.9rem", sm: "1rem" } },
            }}
          />

          <Divider sx={{ my: 3 }} />

          <Typography
            variant="h6"
            gutterBottom
            fontWeight="bold"
            sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" } }}
          >
            Display Settings
          </Typography>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="image-loading-label">Image Loading</InputLabel>
            <Select
              labelId="image-loading-label"
              value={imageLoading}
              label="Image Loading"
              onChange={(e) =>
                setImageLoading(e.target.value as "lazy" | "eager")
              }
              sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
            >
              <MenuItem value="lazy">
                Lazy (Load as needed - Recommended)
              </MenuItem>
              <MenuItem value="eager">
                Eager (Load all immediately - May cause rate limiting)
              </MenuItem>
            </Select>
            <FormHelperText sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
              Lazy loading improves performance by only loading images as you
              scroll. Eager loading provides a smoother experience but may cause
              you to be rate-limited.
            </FormHelperText>
          </FormControl>

          <Divider sx={{ my: 3 }} />

          <Typography
            variant="h6"
            gutterBottom
            fontWeight="bold"
            sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" } }}
          >
            Blacklist Settings
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1.5, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}
          >
            Add tags to blacklist and toggle each one on or off. Enabled tags
            are filtered out of all fetched posts.
          </Typography>

          <Autocomplete
            multiple
            freeSolo
            options={blacklistSuggestions}
            open={blacklistAutocompleteOpen}
            onOpen={() => setBlacklistAutocompleteOpen(true)}
            onClose={() => setBlacklistAutocompleteOpen(false)}
            getOptionLabel={(option) =>
              typeof option === "string" ? option : option.label
            }
            value={blacklistEntries.map((entry) => entry.tag)}
            inputValue={blacklistInputValue}
            onInputChange={(_, value) => setBlacklistInputValue(value)}
            onChange={(_, newValue) => {
              const nextTags = newValue.map((item) =>
                typeof item === "string" ? item : item.value
              );
              mergeBlacklistTags(nextTags);
            }}
            filterOptions={(x) => x}
            renderValue={(value, getTagProps) =>
              value.map((option, index) => {
                const isString = typeof option === "string";
                const tagText = isString ? option : option.label;
                const { key, ...chipProps } = getTagProps({ index });
                const entry = blacklistEntries.find(
                  (item) => normalizeTag(item.tag) === normalizeTag(tagText)
                );

                return (
                  <Chip
                    key={key}
                    size="small"
                    variant={entry?.enabled === false ? "outlined" : "filled"}
                    label={tagText}
                    color={danbooruUtil.getTagColor(tagText)}
                    sx={{
                      borderRadius: "4px",
                      fontWeight: 400,
                      height: "24px",
                      fontSize: "0.75rem",
                      opacity: entry?.enabled === false ? 0.65 : 1,
                      "& .MuiChip-label": {
                        padding: "0 8px",
                      },
                      "& .MuiChip-deleteIcon": {
                        fontSize: "16px",
                        color: "rgba(255, 255, 255, 0.7)",
                        "&:hover": {
                          color: "white",
                        },
                      },
                    }}
                    {...chipProps}
                  />
                );
              })
            }
            renderOption={(props, option) => {
              const isString = typeof option === "string";
              const label = isString ? option : option.label;
              const category = !isString ? option.category : undefined;
              const postCount = !isString ? option.post_count : undefined;

              return (
                <Box
                  component="li"
                  {...props}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 10px",
                    borderLeft: "3px solid",
                    borderLeftColor: !isString
                      ? danbooruUtil.getCategoryColor(category as number)
                      : "transparent",
                    "&:hover": {
                      backgroundColor: "rgba(108, 99, 255, 0.1)",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    {!isString && category !== undefined && (
                      <Typography
                        variant="caption"
                        sx={{
                          mr: 1,
                          py: 0.2,
                          px: 0.8,
                          borderRadius: "4px",
                          backgroundColor:
                            danbooruUtil.getCategoryColor(category),
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: "0.65rem",
                          letterSpacing: 0.3,
                        }}
                      >
                        {danbooruUtil.getCategoryName(category)}
                      </Typography>
                    )}
                    <Typography>{label}</Typography>
                  </Box>
                  {!isString && postCount !== undefined && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: "rgba(255, 255, 255, 0.5)",
                        ml: 2,
                      }}
                    >
                      {postCount.toLocaleString()} posts
                    </Typography>
                  )}
                </Box>
              );
            }}
            loading={blacklistInputLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                placeholder="Add blacklisted tags..."
                slotProps={{
                  input: {
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {blacklistInputLoading ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                    sx: {
                      p: "2px 4px",
                      borderRadius: "8px",
                    },
                  },
                }}
              />
            )}
            sx={{ mb: 2 }}
          />

          {blacklistEntries.length > 0 ? (
            <Stack spacing={1} sx={{ mb: 3 }}>
              {blacklistEntries.map((entry) => (
                <Box
                  key={entry.tag}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                  }}
                >
                  <Chip
                    label={entry.tag}
                    size="small"
                    color={danbooruUtil.getTagColor(entry.tag)}
                    variant={entry.enabled ? "filled" : "outlined"}
                    sx={{ opacity: entry.enabled ? 1 : 0.65 }}
                  />
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ minWidth: 46, textAlign: "right" }}
                    >
                      {entry.enabled ? "ON" : "OFF"}
                    </Typography>
                    <Switch
                      checked={entry.enabled}
                      size="small"
                      onChange={() => toggleBlacklistTag(entry.tag)}
                    />
                    <MuiIconButton
                      size="small"
                      color="error"
                      onClick={() => removeBlacklistTag(entry.tag)}
                    >
                      <DeleteOutline fontSize="small" />
                    </MuiIconButton>
                  </Box>
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 3, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}
            >
              No blacklisted tags yet.
            </Typography>
          )}

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
            }}
          >
            <Button
              variant="contained"
              onClick={handleSave}
              sx={{
                flex: 1,
                height: { xs: "44px", sm: "auto" },
                fontSize: { xs: "0.95rem", sm: "0.875rem" },
              }}
            >
              Save Settings
            </Button>
            <Button
              variant="outlined"
              onClick={handleClear}
              sx={{
                height: { xs: "44px", sm: "auto" },
                fontSize: { xs: "0.95rem", sm: "0.875rem" },
              }}
            >
              Clear
            </Button>
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 2 }}
          >
            Note: Your API credentials are stored locally and never sent to any
            third-party servers.
          </Typography>
        </Paper>

        {/* Links Section */}
        <Paper
          sx={{
            p: { xs: 2, sm: 3 },
            mt: { xs: 2, sm: 3 },
            backgroundColor: "rgba(30, 30, 30, 0.95)",
            borderRadius: 2,
          }}
        >
          <Typography
            variant="h6"
            gutterBottom
            fontWeight="bold"
            sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" } }}
          >
            Useful Links
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Button
              variant="text"
              href="https://danbooru.donmai.us/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                justifyContent: "flex-start",
                height: { xs: "44px", sm: "auto" },
                fontSize: { xs: "0.9rem", sm: "0.875rem" },
              }}
            >
              Danbooru Official Site
            </Button>
            <Button
              variant="text"
              href="https://danbooru.donmai.us/wiki_pages/help:api"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                justifyContent: "flex-start",
                height: { xs: "44px", sm: "auto" },
                fontSize: { xs: "0.9rem", sm: "0.875rem" },
              }}
            >
              Danbooru API Documentation
            </Button>
            <Button
              variant="text"
              href="https://github.com/Ipmake/vipbooru"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                justifyContent: "flex-start",
                height: { xs: "44px", sm: "auto" },
                fontSize: { xs: "0.9rem", sm: "0.875rem" },
              }}
            >
              GitHub Repository
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

export default InfoPage;
