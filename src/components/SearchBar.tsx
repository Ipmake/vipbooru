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
  Tooltip,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import CloseIcon from "@mui/icons-material/Close";
import type { AutocompleteResult } from "../types";
import { useSearchParams } from "react-router-dom";
import { danbooruService } from "../services/danbooru";
import { danbooruUtil } from "../utils/danbooru";

const SearchBar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { tags } = Object.fromEntries([...searchParams]) as { tags?: string };
  const [searchTags, setSearchTags] = React.useState<string[]>(tags ? tags.split(',') : []);

  const [tagSuggestions, setTagSuggestions] = React.useState<AutocompleteResult[]>([]);
  const [tagInputValue, setTagInputValue] = React.useState<string>("");
  const [searchInputLoading, setSearchInputLoading] = React.useState<boolean>(false);

  const [showHelp, setShowHelp] = React.useState<boolean>(false);
  const searchBarRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (tagInputValue.trim() === "") {
        setTagSuggestions([]);
        return;
      }

      setSearchInputLoading(true);

      danbooruService.searchAutocomplete(tagInputValue.trim()).then((results) => {
        setTagSuggestions(results);
        setSearchInputLoading(false);
      });
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [tagInputValue]);

  useEffect(() => {
    setSearchTags(tags ? tags.split(',') : []);
  }, [tags]);

  return (
    <Box
      ref={searchBarRef}
      sx={{
        py: 1,
        px: { xs: 1, md: 1 },
        position: "relative",
        zIndex: 1000,
      }}
    >
      <Paper
        elevation={1}
        sx={{
          p: { xs: 1, sm: 1 },
          mb: 1,
          borderRadius: 1,
          backgroundColor: "rgba(30, 30, 30, 0.85)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          position: "relative",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ position: "relative", flexGrow: 1 }}>
              <Autocomplete
                multiple
                freeSolo
                id="tags-autocomplete"
                options={tagSuggestions}
                getOptionLabel={(option) =>
                  typeof option === "string" ? option : option.label
                }
                value={searchTags}
                inputValue={tagInputValue}
                onInputChange={(_, value) => setTagInputValue(value)}
                onChange={(_, newValue) => {
                  const stringValues = newValue.map(value => 
                    typeof value === "string" ? value : value.value
                  );
                  setSearchTags(stringValues);
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const isString = typeof option === "string";
                    const tagText = isString ? option : option.label;
                    const tagColor = isString
                      ? danbooruUtil.getTagColor(tagText)
                      : (option as AutocompleteResult).category !== undefined
                      ? "default"
                      : danbooruUtil.getTagColor(tagText);

                    return (
                      <Chip
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
                        {...getTagProps({ index })}
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
                              backgroundColor: danbooruUtil.getCategoryColor(category),
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
                    placeholder="Search tags (e.g. cat, rating:safe)"
                    onKeyDown={(key) => {
                      if (key.key === "Enter") {
                        key.preventDefault();
                        const newSearchParams = new URLSearchParams();
                        if (searchTags.length > 0) {
                          newSearchParams.set("tags", searchTags.join(","));
                        }
                        setSearchParams(newSearchParams);
                      }
                    }}
                    InputProps={{
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
                    }}
                  />
                )}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "rgba(18, 18, 18, 0.7)",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    position: "relative",
                    "& fieldset": {
                      borderColor: "transparent",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(160, 160, 160, 0.3)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#a0a0a0",
                    },
                  },
                }}
              />
            </Box>

            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                const newSearchParams = new URLSearchParams();
                if (searchTags.length > 0) {
                  newSearchParams.set("tags", searchTags.join(","));
                }
                setSearchParams(newSearchParams);
              }}
              startIcon={<SearchIcon />}
              size="small"
              sx={{
                height: "48px",
                px: 1.5,
                backgroundColor: "#a0a0a0",
                borderRadius: "2px",
                "&:hover": {
                  backgroundColor: "#808080",
                },
              }}
            >
              Search
            </Button>

            <Tooltip title="Search Help">
              <IconButton
                color="primary"
                onClick={() => setShowHelp(!showHelp)}
                sx={{
                  backgroundColor: "rgba(160, 160, 160, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  height: "32px",
                  width: "32px",
                  padding: "4px",
                  "&:hover": {
                    backgroundColor: "rgba(160, 160, 160, 0.2)",
                  },
                }}
              >
                {showHelp ? <CloseIcon /> : <HelpOutlineIcon />}
              </IconButton>
            </Tooltip>
          </Box>

          <Collapse in={showHelp}>
            <Paper
              sx={{
                p: 1.5,
                mb: 1,
                backgroundColor: "rgba(25, 25, 25, 0.7)",
                borderRadius: 1,
                border: "1px solid rgba(255, 255, 255, 0.05)",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                Search Tips
              </Typography>
              <Typography variant="body2" sx={{ mb: 1.5, color: "rgba(255, 255, 255, 0.7)" }}>
                Use these operators to refine your search:
              </Typography>
              
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Box>
                  <Typography variant="body2" fontWeight={500} sx={{ color: "#FFB74A" }}>
                    Basic Search
                  </Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.6)", display: "block", mt: 0.5 }}>
                    • Press enter or click a tag to add it to your search, press enter again to execute the search
                  </Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.6)", display: "block" }}>
                    • Use underscores for multi-word tags (e.g., <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 4px", borderRadius: "2px" }}>long_hair</code>)
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" fontWeight={500} sx={{ color: "#FF5D8F" }}>
                    Exclusion
                  </Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.6)", display: "block", mt: 0.5 }}>
                    • Use <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 4px", borderRadius: "2px" }}>-</code> to exclude tags (e.g., <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 4px", borderRadius: "2px" }}>cat -dog</code>)
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" fontWeight={500} sx={{ color: "#56C991" }}>
                    Rating Filters
                  </Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.6)", display: "block", mt: 0.5 }}>
                    • <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 4px", borderRadius: "2px" }}>rating:general</code> or <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 4px", borderRadius: "2px" }}>rating:g</code> - Safe for work content
                  </Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.6)", display: "block" }}>
                    • <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 4px", borderRadius: "2px" }}>rating:sensitive</code> or <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 4px", borderRadius: "2px" }}>rating:s</code> - Mildly suggestive
                  </Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.6)", display: "block" }}>
                    • <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 4px", borderRadius: "2px" }}>rating:questionable</code> or <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 4px", borderRadius: "2px" }}>rating:q</code> - Questionable content
                  </Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.6)", display: "block" }}>
                    • <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 4px", borderRadius: "2px" }}>rating:explicit</code> or <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 4px", borderRadius: "2px" }}>rating:e</code> - Explicit content
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" fontWeight={500} sx={{ color: "#5E81F4" }}>
                    Wildcards
                  </Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.6)", display: "block", mt: 0.5 }}>
                    • Use <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 4px", borderRadius: "2px" }}>*</code> for partial matches (e.g., <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 4px", borderRadius: "2px" }}>*girl</code>, <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 4px", borderRadius: "2px" }}>cat*</code>)
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" fontWeight={500} sx={{ color: "#B388FF" }}>
                    Meta Tags
                  </Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.6)", display: "block", mt: 0.5 }}>
                    • <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 4px", borderRadius: "2px" }}>order:score</code> - Sort by score
                  </Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.6)", display: "block" }}>
                    • <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 4px", borderRadius: "2px" }}>order:favcount</code> - Sort by favorites
                  </Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.6)", display: "block" }}>
                    • <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 4px", borderRadius: "2px" }}>order:date</code> - Sort by upload date (newest first)
                  </Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.6)", display: "block" }}>
                    • <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 4px", borderRadius: "2px" }}>order:random</code> - Random order
                  </Typography>
                </Box>

                <Box sx={{ mt: 1, pt: 1, borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.5)", fontStyle: "italic" }}>
                    💡 Tip: You can combine multiple tags and operators for precise searches
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Collapse>
        </Box>
      </Paper>
    </Box>
  );
};

export default SearchBar;