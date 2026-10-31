import {
  Box,
  Autocomplete,
  Chip,
  Typography,
  CircularProgress,
  InputBase,
} from "@mui/material";
import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { danbooruService } from "../services/danbooru";
import type { AutocompleteResult } from "../types";
import { danbooruUtil } from "../utils/danbooru";
import { alpha } from "@mui/material/styles";

const compactNumber = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function SearchBox() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { tags } = Object.fromEntries([...searchParams]) as { tags?: string };
  const [searchTags, setSearchTags] = React.useState<string[]>(
    tags ? tags.split(",") : [],
  );

  const [tagSuggestions, setTagSuggestions] = React.useState<
    AutocompleteResult[]
  >([]);
  const [tagInputValue, setTagInputValue] = React.useState<string>("");
  const [searchInputLoading, setSearchInputLoading] =
    React.useState<boolean>(false);
  const [autocompleteOpen, setAutocompleteOpen] =
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

    if (!document.location.href.includes("/search")) {
      // Append the search string directly to the new URL
      navigate(`/search?${newSearchParams.toString()}`);
    } else {
      // If already on the search page, just update the params
      setSearchParams(newSearchParams);
    }
  };

  return (
    <Autocomplete
      multiple
      freeSolo
      id="tags-autocomplete"
      autoHighlight
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
          typeof value === "string" ? value : value.value,
        );
        setSearchTags(stringValues);
      }}
      slotProps={{
        popper: {
          placement: "bottom-start",
          modifiers: [
            { name: "offset", options: { offset: [0, 8] } }, // [sideways, down] in px
          ],
        },
        listbox: { sx: { p: 0.5 } },
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
            <div
              style={{
                marginRight: 4,
              }}
            >
              <Chip
                key={key}
                size="small"
                variant="filled"
                label={tagText}
                sx={{
                  borderRadius: "4px",
                  fontWeight: 400,
                  height: "22px",
                  fontSize: "0.75rem",
                  "& .MuiChip-label": {
                    padding: "0 8px",
                    color: tagColor === "warning" ? "#ffffff" : undefined,
                    fontSize: "12px",
                  },
                  "& .MuiChip-deleteIcon": {
                    fontSize: "14px",
                    color: "rgba(255, 255, 255, 0.7)",
                    "&:hover": {
                      color: "white",
                    },
                  },
                  backgroundColor: tagColor,
                }}
                {...chipProps}
              />
            </div>
          );
        })
      }
      renderOption={(props, option) => {
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
              zIndex: 6,
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
                sx={{
                  ml: "auto",
                  flexShrink: 0,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {compactNumber.format(postCount)}
              </Typography>
            )}
          </Box>
        );
      }}
      loading={searchInputLoading}
      filterOptions={(x) => x}
      renderInput={(params) => {
        const { InputProps, ...restParams } = params;

        return (
          <InputBase
            {...restParams}
            ref={InputProps.ref}
            startAdornment={
              <>
                {/* <SearchIcon sx={{

                }} /> */}
                {InputProps.startAdornment}
              </>
            }
            endAdornment={
              <>
                {searchInputLoading ? (
                  <CircularProgress color="inherit" size={20} />
                ) : null}
                {/* {InputProps.endAdornment} */}
              </>
            }
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
            sx={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              fontSize: 14,
              zIndex: 11,
            }}
          />
        );
      }}
    />
  );
}

export default SearchBox;
