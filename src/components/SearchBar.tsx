import React, { useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  Collapse,
  IconButton,
  TextField,
  Autocomplete,
  CircularProgress,
  Divider,
  Stack,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import InfoIcon from "@mui/icons-material/Info";
import CloseIcon from "@mui/icons-material/Close";
import type { AutocompleteResult } from "../types";
import { useSearchParams, useNavigate } from "react-router-dom";
import { danbooruService } from "../services/danbooru";
import { danbooruUtil } from "../utils/danbooru";

const SearchBar = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { tags } = Object.fromEntries([...searchParams]) as { tags?: string };
  const [searchTags, setSearchTags] = React.useState<string[]>(
    tags ? tags.split(",") : []
  );

  const [tagSuggestions, setTagSuggestions] = React.useState<
    AutocompleteResult[]
  >([]);
  const [tagInputValue, setTagInputValue] = React.useState<string>("");
  const [searchInputLoading, setSearchInputLoading] =
    React.useState<boolean>(false);
  const [autocompleteOpen, setAutocompleteOpen] =
    React.useState<boolean>(false);

  const [showHelp, setShowHelp] = React.useState<boolean>(false);
  const [showDesktopButtons, setShowDesktopButtons] =
    React.useState<boolean>(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (tagInputValue.trim() === "") {
        setTagSuggestions([]);
        return;
      }

      setSearchInputLoading(true);

      danbooruService
        .searchAutocomplete(tagInputValue.trim())
        .then((results) => {
          setTagSuggestions(results);
          setSearchInputLoading(false);
        });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [tagInputValue]);

  useEffect(() => {
    setSearchTags(tags ? tags.split(",") : []);
  }, [tags]);

  const handleSearch = () => {
    const newSearchParams = new URLSearchParams();
    if (searchTags.length > 0) {
      newSearchParams.set("tags", searchTags.join(","));
    }
    setSearchParams(newSearchParams);
  };

  return (
    <Box
      sx={{
        width: "100%",
        px: { xs: 0, sm: 2 },
        py: { xs: 1, sm: 1.5 },
      }}
      onMouseEnter={() => setShowDesktopButtons(true)}
      onMouseLeave={() => setShowDesktopButtons(false)}
    >
      {/* Main Search Container */}
      <Paper
        elevation={0}
        sx={{
          overflow: "hidden",
          borderRadius: { xs: 2, sm: 2 },
          backgroundColor: "rgba(18, 18, 18, 0.95)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Search Input Area */}
        <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Stack spacing={{ xs: 1, sm: 1.5 }}>
            {/* Search Input and Button Row */}
            <Box
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "flex-start",
                flexDirection: { xs: "column", sm: "row" },
                width: "100%",
              }}
            >
              <Autocomplete
                multiple
                freeSolo
                id="tags-autocomplete"
                options={tagSuggestions}
                open={autocompleteOpen}
                onOpen={() => setAutocompleteOpen(true)}
                onClose={() => setAutocompleteOpen(false)}
                getOptionLabel={(option) =>
                  typeof option === "string" ? option : option.label
                }
                value={searchTags}
                inputValue={tagInputValue}
                onInputChange={(_, value) => setTagInputValue(value)}
                onChange={(_, newValue) => {
                  const stringValues = newValue.map((value) =>
                    typeof value === "string" ? value : value.value
                  );
                  setSearchTags(stringValues);
                }}
                sx={{ flex: 1, width: { xs: "100%", sm: "auto" } }}
                renderValue={(value, getTagProps) =>
                  value.map((option, index) => {
                    const isString = typeof option === "string";
                    const tagText = isString ? option : option.label;
                    const tagColor = isString
                      ? danbooruUtil.getTagColor(tagText)
                      : (option as AutocompleteResult).category !== undefined
                      ? "default"
                      : danbooruUtil.getTagColor(tagText);
                    const { key, ...chipProps } = getTagProps({ index });

                    return (
                      <Chip
                        key={key}
                        size="small"
                        variant="filled"
                        label={tagText}
                        color={tagColor}
                        sx={{
                          borderRadius: "4px",
                          fontWeight: 400,
                          height: "24px",
                          fontSize: "0.75rem",
                          "& .MuiChip-label": {
                            padding: "0 8px",
                            color: tagColor === "warning" ? "#ffffff" : undefined,
                          },
                          "& .MuiChip-deleteIcon": {
                            fontSize: "16px",
                            color: "rgba(255, 255, 255, 0.7)",
                            "&:hover": {
                              color: "white",
                            },
                          },
                          backgroundColor: !isString
                            ? danbooruUtil.getCategoryColor((option as AutocompleteResult).category)
                            : undefined,
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
                loading={searchInputLoading}
                filterOptions={(x) => x}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    placeholder="Search tags..."
                    onKeyDown={(key) => {
                      if (key.key === "Enter") {
                        // Only submit search if autocomplete menu is closed
                        if (!autocompleteOpen) {
                          key.preventDefault();
                          handleSearch();
                        }
                      }
                    }}
                    slotProps={{
                      input: {
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {searchInputLoading ? (
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
              />

              {/* Search Button - Icon only on desktop, full button on mobile */}
              <Box
                sx={{
                  display: { xs: "none", sm: "flex" },
                  alignItems: "stretch",
                }}
              >
                <IconButton
                  onClick={handleSearch}
                  sx={{
                    height: "100%",
                    minHeight: 56,
                    width: 56,
                    borderRadius: 2,
                    backgroundColor: "#a0a0a0",
                    color: "#fff",
                    "&:hover": {
                      backgroundColor: "#909090",
                    },
                  }}
                >
                  <SearchIcon sx={{ fontSize: 22 }} />
                </IconButton>
              </Box>
            </Box>

            {/* Mobile Action Buttons Row */}
            <Box
              sx={{
                display: { xs: "flex", sm: "none" },
                gap: 1,
              }}
            >
              <Button
                variant="contained"
                size="medium"
                onClick={handleSearch}
                startIcon={<SearchIcon sx={{ fontSize: 18 }} />}
                sx={{
                  flex: 1,
                  height: 38,
                  borderRadius: 2,
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textTransform: "none",
                  backgroundColor: "#a0a0a0",
                  color: "#fff",
                  boxShadow: "none",
                  "&:hover": {
                    backgroundColor: "#909090",
                    boxShadow: "none",
                  },
                }}
              >
                Search
              </Button>

              <IconButton
                onClick={() => setShowHelp(!showHelp)}
                sx={{
                  height: 38,
                  width: 38,
                  borderRadius: 2,
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  backgroundColor: showHelp
                    ? "rgba(160, 160, 160, 0.1)"
                    : "transparent",
                  color: "rgba(255, 255, 255, 0.85)",
                }}
              >
                {showHelp ? (
                  <CloseIcon sx={{ fontSize: 18 }} />
                ) : (
                  <HelpOutlineIcon sx={{ fontSize: 18 }} />
                )}
              </IconButton>

              <IconButton
                onClick={() => navigate("/info")}
                sx={{
                  height: 38,
                  width: 38,
                  borderRadius: 2,
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  backgroundColor: "transparent",
                  color: "rgba(255, 255, 255, 0.85)",
                }}
              >
                <InfoIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>

            {/* Desktop Action Buttons Row - Appears on hover */}
            <Collapse
              in={showDesktopButtons}
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  justifyContent: "flex-end",
                  pt: 1,
                }}
              >
                <Button
                  variant="outlined"
                  size="medium"
                  onClick={() => setShowHelp(!showHelp)}
                  startIcon={
                    showHelp ? (
                      <CloseIcon sx={{ fontSize: 20 }} />
                    ) : (
                      <HelpOutlineIcon sx={{ fontSize: 20 }} />
                    )
                  }
                  sx={{
                    minWidth: 100,
                    height: 40,
                    borderRadius: 2,
                    fontSize: "0.9rem",
                    fontWeight: 500,
                    textTransform: "none",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    backgroundColor: showHelp
                      ? "rgba(160, 160, 160, 0.2)"
                      : "transparent",
                    color: "rgba(255, 255, 255, 0.85)",
                  }}
                >
                  {showHelp ? "Close" : "Help"}
                </Button>

                <IconButton
                  onClick={() => navigate("/info")}
                  sx={{
                    height: 40,
                    width: 40,
                    borderRadius: 2,
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    backgroundColor: "transparent",
                    color: "rgba(255, 255, 255, 0.85)",
                  }}
                >
                  <InfoIcon sx={{ fontSize: 22 }} />
                </IconButton>
              </Box>
            </Collapse>
          </Stack>
        </Box>

        {/* Help Section */}
        <Collapse in={showHelp}>
          <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.06)" }} />
          <Box
            sx={{
              p: { xs: 1.5, sm: 2 },
              backgroundColor: "rgba(0, 0, 0, 0.2)",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                fontWeight: 600,
                fontSize: { xs: "0.95rem", sm: "1rem" },
                color: "rgba(255, 255, 255, 0.95)",
              }}
            >
              Search Guide
            </Typography>

            <Stack spacing={1.5}>
              <HelpSection
                title="Basic Usage"
                color="#FFB74A"
                items={[
                  "Type tags and press Enter to add them",
                  <>
                    Use underscores for phrases: <Code>long_hair</Code>
                  </>,
                ]}
              />

              <HelpSection
                title="Exclude Tags"
                color="#FF5D8F"
                items={[
                  <>
                    Add <Code>-</Code> before tags: <Code>cat -dog</Code>
                  </>,
                ]}
              />

              <HelpSection
                title="Content Ratings"
                color="#56C991"
                items={[
                  <>
                    <Code>rating:g</Code> Safe for work
                  </>,
                  <>
                    <Code>rating:s</Code> Mildly suggestive
                  </>,
                  <>
                    <Code>rating:q</Code> Questionable
                  </>,
                  <>
                    <Code>rating:e</Code> Explicit
                  </>,
                ]}
              />

              <HelpSection
                title="Wildcards"
                color="#5E81F4"
                items={[
                  <>
                    Use <Code>*</Code> for partial matches: <Code>*girl</Code>
                  </>,
                ]}
              />

              <HelpSection
                title="Sort Options"
                color="#B388FF"
                items={[
                  <>
                    <Code>order:score</Code> Highest rated
                  </>,
                  <>
                    <Code>order:favcount</Code> Most favorited
                  </>,
                  <>
                    <Code>order:date</Code> Newest uploads
                  </>,
                  <>
                    <Code>order:random</Code> Random
                  </>,
                ]}
              />

              <Box
                sx={{
                  mt: 1,
                  pt: 1.5,
                  borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255, 255, 255, 0.5)",
                    fontSize: { xs: "0.8rem", sm: "0.85rem" },
                  }}
                >
                  💡 Combine multiple tags and operators for precise searches
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Collapse>
      </Paper>
    </Box>
  );
};

// Helper Components
interface HelpSectionProps {
  title: string;
  color: string;
  items: React.ReactNode[];
}

const HelpSection: React.FC<HelpSectionProps> = ({ title, color, items }) => (
  <Box>
    <Typography
      variant="subtitle2"
      sx={{
        fontWeight: 600,
        color,
        fontSize: { xs: "0.8rem", sm: "0.85rem" },
        mb: 0.75,
      }}
    >
      {title}
    </Typography>
    <Stack spacing={0.5} sx={{ pl: { xs: 1.5, sm: 2 } }}>
      {items.map((item, i) => (
        <Typography
          key={i}
          variant="body2"
          sx={{
            color: "rgba(255, 255, 255, 0.7)",
            fontSize: { xs: "0.75rem", sm: "0.8rem" },
            lineHeight: 1.6,
          }}
        >
          • {item}
        </Typography>
      ))}
    </Stack>
  </Box>
);

const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <code
    style={{
      background: "rgba(255, 255, 255, 0.08)",
      padding: "2px 6px",
      borderRadius: "4px",
      fontSize: "0.9em",
      fontFamily: "monospace",
      fontWeight: 500,
    }}
  >
    {children}
  </code>
);

export default SearchBar;
