import React, { useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Drawer,
  Chip,
  Fade,
  Divider,
  Link,
  Tooltip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { alpha, type SxProps, type Theme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import DownloadIcon from "@mui/icons-material/Download";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import type { DanbooruPost } from "../types";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { danbooruService } from "../services/danbooru";
import { generateFilenameFromTags } from "../utils/filenameUtils";
import { danbooruUtil } from "../utils/danbooru";

const SWIPE_DISTANCE_THRESHOLD = 24;

// Change this if your app talks to a different Danbooru instance.
const POST_URL = "https://danbooru.donmai.us/posts";

const GREEN = "#56b48c";
const AMBER = "#c89600";
const RED = "#c84646";

const RATINGS: Record<string, { label: string; color: string }> = {
  g: { label: "General", color: GREEN },
  s: { label: "Sensitive", color: GREEN },
  q: { label: "Questionable", color: AMBER },
  e: { label: "Explicit", color: RED },
};

// Danbooru category ids, in the order they're usually displayed.
const TAG_GROUPS = [
  { category: 1, tags: "tag_string_artist", count: "tag_count_artist" },
  { category: 3, tags: "tag_string_copyright", count: "tag_count_copyright" },
  { category: 4, tags: "tag_string_character", count: "tag_count_character" },
  { category: 0, tags: "tag_string_general", count: "tag_count_general" },
  { category: 5, tags: "tag_string_meta", count: "tag_count_meta" },
] as const;

const getTagList = (tagString: string): string[] =>
  tagString.split(/\s+/).filter(Boolean);

const formatBytes = (bytes?: number): string => {
  if (!bytes) return "Unknown";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const ellipsisSx = {
  display: "block",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;

const toolbarButtonSx: SxProps<Theme> = (theme) => ({
  width: { xs: 40, sm: 36 },
  height: { xs: 40, sm: 36 },
  color: theme.palette.text.primary,
  backgroundColor: alpha(theme.palette.background.default, 0.6),
  backdropFilter: "blur(8px)",
  border: `1px solid ${theme.palette.divider}`,
  "&:hover": {
    backgroundColor: alpha(theme.palette.background.paper, 0.9),
    border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
  },
});

const tagChipSx =
  (color: string): SxProps<Theme> =>
  (theme) => ({
    height: 24,
    borderRadius: 1,
    fontSize: "0.75rem",
    color: theme.palette.text.primary,
    backgroundColor: alpha(theme.palette.common.white, 0.04),
    border: `1px solid ${theme.palette.divider}`,
    transition: "all 0.15s ease",
    "& .MuiChip-label": { px: 1 },
    "&:hover": {
      backgroundColor: alpha(theme.palette.common.white, 0.08),
      borderColor: color,
    },
  });

const Dot: React.FC<{ color: string }> = ({ color }) => (
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
);

const DetailRow: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: 2,
    }}
  >
    <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
      {label}
    </Typography>
    <Typography
      component="div"
      variant="body2"
      sx={{
        minWidth: 0,
        overflow: "hidden",
        textAlign: "right",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {children}
    </Typography>
  </Box>
);

const Stat: React.FC<{
  icon: React.ReactNode;
  value: number;
  title: string;
}> = ({ icon, value, title }) => (
  <Tooltip title={title}>
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        color: "text.secondary",
      }}
    >
      {icon}
      <Typography
        variant="body2"
        color="text.primary"
        sx={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value.toLocaleString()}
      </Typography>
    </Box>
  </Tooltip>
);

interface PostDetailsProps {
  post: DanbooruPost;
  onTagClick: (tag: string) => void;
}

const PostDetails: React.FC<PostDetailsProps> = ({ post, onTagClick }) => {
  const rating = RATINGS[post.rating] ?? {
    label: post.rating.toUpperCase(),
    color: "#a1a1aa",
  };

  const flags = [
    post.is_pending && { label: "Pending", color: AMBER },
    post.is_flagged && { label: "Flagged", color: AMBER },
    post.is_deleted && { label: "Deleted", color: RED },
    post.is_banned && { label: "Banned", color: RED },
  ].filter(Boolean) as { label: string; color: string }[];

  const wasUpdated =
    Math.abs(
      new Date(post.updated_at).getTime() - new Date(post.created_at).getTime(),
    ) > 60000;

  const fileSize = post.file_size || post.media_asset?.file_size;
  const duration = post.media_asset?.duration;
  const source = post.source?.trim();
  const sourceIsUrl = !!source && /^https?:\/\//i.test(source);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            #{post.id}
          </Typography>
          <Tooltip title="Open on Danbooru">
            <Link
              href={`${POST_URL}/${post.id}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open on Danbooru"
              color="text.secondary"
              sx={{
                display: "inline-flex",
                "&:hover": { color: "text.primary" },
              }}
            >
              <OpenInNewIcon sx={{ fontSize: 16 }} />
            </Link>
          </Tooltip>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Dot color={rating.color} />
          <Typography variant="body2" color="text.secondary">
            {rating.label}
          </Typography>
        </Box>
      </Box>

      {/* Stats and status */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2.5,
        }}
      >
        <Stat
          icon={<ArrowUpwardIcon sx={{ fontSize: 16 }} />}
          value={post.score}
          title={`${post.up_score} up, ${Math.abs(post.down_score)} down`}
        />
        <Stat
          icon={<FavoriteBorderIcon sx={{ fontSize: 16 }} />}
          value={post.fav_count}
          title="Favorites"
        />
        {flags.map(({ label, color }) => (
          <Chip
            key={label}
            label={label}
            size="small"
            variant="outlined"
            sx={{
              height: 22,
              fontSize: "0.7rem",
              color,
              borderColor: alpha(color, 0.4),
            }}
          />
        ))}
      </Box>

      <Divider />

      {/* Details */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
        <DetailRow label="Dimensions">
          {post.image_width} × {post.image_height}
        </DetailRow>
        <DetailRow label="File">
          {post.file_ext.toUpperCase()}, {formatBytes(fileSize)}
        </DetailRow>
        {duration ? (
          <DetailRow label="Duration">{formatDuration(duration)}</DetailRow>
        ) : null}
        <DetailRow label="Uploaded">
          {formatDate(post.created_at)}
          <Typography
            component="span"
            variant="body2"
            color="text.secondary"
            sx={{ ml: 1 }}
          >
            {danbooruUtil.getDaysAgo(post.created_at)}
          </Typography>
        </DetailRow>
        {wasUpdated && (
          <DetailRow label="Updated">{formatDate(post.updated_at)}</DetailRow>
        )}
        <DetailRow label="Uploader">#{post.uploader_id}</DetailRow>
        {post.approver_id && (
          <DetailRow label="Approver">#{post.approver_id}</DetailRow>
        )}
        {post.pixiv_id && (
          <DetailRow label="Pixiv">
            <Link
              href={`https://www.pixiv.net/artworks/${post.pixiv_id}`}
              target="_blank"
              rel="noopener noreferrer"
              color="inherit"
              underline="hover"
            >
              #{post.pixiv_id}
            </Link>
          </DetailRow>
        )}
        {post.parent_id && (
          <DetailRow label="Parent">
            <Link
              component="button"
              color="inherit"
              underline="hover"
              onClick={() => onTagClick(`parent:${post.parent_id}`)}
              sx={{ verticalAlign: "baseline" }}
            >
              #{post.parent_id}
            </Link>
          </DetailRow>
        )}
        {post.has_visible_children && (
          <DetailRow label="Children">
            <Link
              component="button"
              color="inherit"
              underline="hover"
              onClick={() => onTagClick(`parent:${post.id}`)}
              sx={{ verticalAlign: "baseline" }}
            >
              View
            </Link>
          </DetailRow>
        )}
        {source && (
          <DetailRow label="Source">
            {sourceIsUrl ? (
              <Link
                href={source}
                target="_blank"
                rel="noopener noreferrer"
                color="inherit"
                underline="hover"
                sx={ellipsisSx}
              >
                {source.replace(/^https?:\/\/(www\.)?/i, "")}
              </Link>
            ) : (
              <Box sx={ellipsisSx}>{source}</Box>
            )}
          </DetailRow>
        )}
      </Box>

      <Divider />

      {/* Tags */}
      <Box>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Tags
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {post.tag_count}
          </Typography>
        </Box>

        {TAG_GROUPS.map(({ category, tags, count }) => {
          const list = getTagList(post[tags] || "");
          if (list.length === 0) return null;
          const color = danbooruUtil.getCategoryColor(category);

          return (
            <Box key={category} sx={{ mt: 2 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <Dot color={color} />
                <Typography variant="caption" color="text.secondary">
                  {danbooruUtil.getCategoryName(category)}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ opacity: 0.6 }}
                >
                  {post[count]}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {list.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    onClick={() => onTagClick(tag)}
                    sx={tagChipSx(color)}
                  />
                ))}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

const ImagePreviewDrawer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [post, setPost] = React.useState<DanbooruPost | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [isDetailsExpanded, setIsDetailsExpanded] =
    React.useState<boolean>(false);
  const swipeStartYRef = React.useRef<number | null>(null);
  const swipeStartXRef = React.useRef<number | null>(null);
  const swipeTriggeredRef = React.useRef(false);

  const { postId } = useParams<{ postId?: string }>();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const drawerWidth = isMobile ? "100%" : "90%";
  const drawerOpen = Boolean(post);

  useEffect(() => {
    if (!postId) {
      setPost(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setIsDetailsExpanded(false);

    danbooruService
      .fetchPostById(Number(postId))
      .then((fetchedPost) => {
        setPost(fetchedPost);
      })
      .catch((error) => {
        console.error("Error fetching post by ID:", error);
        setPost(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [postId]);

  const closeDrawer = () => {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      const tags = document.location.search;
      navigate("/search" + tags);
    }
  };

  const handleTagClick = React.useCallback(
    (tag: string) => {
      navigate(`/search?tags=${encodeURIComponent(tag)}`);
    },
    [navigate],
  );

  const handleDownload = React.useCallback(async () => {
    if (!post) return;
    const url = post.file_url;
    try {
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`Network response was not ok: ${response.status}`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = generateFilenameFromTags(post);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed, opening in new tab as fallback:", err);
      // Fallback: the download attribute may be ignored for cross-origin URLs
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }, [post]);

  const handleFullscreen = React.useCallback(() => {
    if (!post) return;
    window.open(post.large_file_url || post.file_url, "_blank");
  }, [post]);

  const handleTouchStart = React.useCallback(
    (event: React.TouchEvent) => {
      if (!isMobile) return;

      swipeTriggeredRef.current = false;
      swipeStartYRef.current = event.touches[0].clientY;
      swipeStartXRef.current = event.touches[0].clientX;
    },
    [isMobile],
  );

  const handleTouchEnd = React.useCallback(
    (event: React.TouchEvent) => {
      if (
        !isMobile ||
        swipeStartYRef.current === null ||
        swipeStartXRef.current === null
      ) {
        return;
      }

      const deltaY = event.changedTouches[0].clientY - swipeStartYRef.current;
      const deltaX = event.changedTouches[0].clientX - swipeStartXRef.current;

      swipeStartYRef.current = null;
      swipeStartXRef.current = null;

      if (
        Math.abs(deltaY) < SWIPE_DISTANCE_THRESHOLD ||
        Math.abs(deltaY) <= Math.abs(deltaX)
      ) {
        return;
      }

      swipeTriggeredRef.current = true;
      setIsDetailsExpanded(deltaY < 0);
    },
    [isMobile],
  );

  const handleDetailsToggleClick = React.useCallback(() => {
    if (swipeTriggeredRef.current) {
      swipeTriggeredRef.current = false;
      return;
    }

    setIsDetailsExpanded((previousValue) => !previousValue);
  }, []);

  return (
    <Drawer
      anchor="right"
      open={drawerOpen && !loading}
      onClose={closeDrawer}
      sx={(t) => ({
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          backgroundColor: t.palette.background.default,
          borderLeft: `1px solid ${t.palette.divider}`,
          padding: 0,
          overflowY: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "100%",
          WebkitOverflowScrolling: "touch",
        },
      })}
    >
      {!loading && post && (
        <Fade in={true} timeout={300}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              height: "100%",
              maxHeight: "100%",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Media */}
            <Box
              sx={{
                position: "relative",
                height: "100%",
                minWidth: 0,
                width: { xs: "100%", md: "auto" },
                flex: { md: 1 },
                order: { md: 2 },
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: { xs: 12, sm: 16 },
                  right: { xs: 12, sm: 16 },
                  display: "flex",
                  gap: 1,
                  zIndex: 10,
                }}
              >
                <Tooltip title="Open full size">
                  <IconButton
                    aria-label="fullscreen"
                    onClick={handleFullscreen}
                    size="small"
                    sx={toolbarButtonSx}
                  >
                    <FullscreenIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download">
                  <IconButton
                    aria-label="download"
                    onClick={handleDownload}
                    size="small"
                    sx={toolbarButtonSx}
                  >
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Close">
                  <IconButton
                    aria-label="close"
                    onClick={closeDrawer}
                    size="small"
                    sx={toolbarButtonSx}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              {post.file_ext === "webm" || post.file_ext === "mp4" ? (
                <video
                  src={post.file_url}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                  controls
                  muted
                  preload="metadata"
                />
              ) : (
                <img
                  src={post.file_url}
                  alt={`Image ${post.id}`}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                  loading="lazy"
                />
              )}
            </Box>

            {/* Details panel (side panel on desktop, bottom sheet on mobile) */}
            <Box
              sx={(t) => ({
                width: { xs: "100%", md: 420 },
                flexShrink: 0,
                height: {
                  xs: isDetailsExpanded ? "75%" : "60px",
                  md: "100%",
                },
                transition: "height 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                position: { xs: "absolute", md: "relative" },
                bottom: 0,
                left: 0,
                zIndex: 20,
                order: { md: 1 },
                overflowY: {
                  xs: isDetailsExpanded ? "auto" : "hidden",
                  md: "auto",
                },
                backgroundColor: t.palette.background.paper,
                px: 2.5,
                pt: { xs: 5, md: 2.5 },
                pb: 4,
                borderTopLeftRadius: { xs: 16, md: 0 },
                borderTopRightRadius: { xs: 16, md: 0 },
                borderTop: { xs: `1px solid ${t.palette.divider}`, md: "none" },
                borderRight: {
                  xs: "none",
                  md: `1px solid ${t.palette.divider}`,
                },
                boxShadow: { xs: "0 -4px 20px rgba(0,0,0,0.4)", md: "none" },
                scrollbarWidth: "thin",
                scrollbarColor: `${alpha(t.palette.common.white, 0.2)} transparent`,
                "&::-webkit-scrollbar": { width: "4px" },
                "&::-webkit-scrollbar-thumb": {
                  background: alpha(t.palette.common.white, 0.2),
                  borderRadius: "2px",
                },
              })}
            >
              {/* Mobile drag handle */}
              <Box
                onClick={handleDetailsToggleClick}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                sx={{
                  display: { xs: "flex", md: "none" },
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: 36,
                  position: "absolute",
                  top: 0,
                  left: 0,
                  cursor: "pointer",
                  zIndex: 25,
                }}
              >
                <Box
                  sx={(t) => ({
                    width: 40,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: alpha(t.palette.common.white, 0.2),
                  })}
                />
              </Box>

              <PostDetails post={post} onTagClick={handleTagClick} />
            </Box>
          </Box>
        </Fade>
      )}
    </Drawer>
  );
};

export default ImagePreviewDrawer;
