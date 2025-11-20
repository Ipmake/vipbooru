import React, { useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Drawer,
  Paper,
  Chip,
  Fade,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import DownloadIcon from "@mui/icons-material/Download";
import type { DanbooruPost } from "../types";
import { useNavigate, useParams } from "react-router-dom";
import { danbooruService } from "../services/danbooru";
import { generateFilenameFromTags } from "../utils/filenameUtils";
import { danbooruUtil } from "../utils/danbooru";

const ImagePreviewDrawer: React.FC = () => {
  const navigate = useNavigate();
  const [post, setPost] = React.useState<DanbooruPost | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);

  const { postId } = useParams<{ postId?: string }>();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const drawerWidth = isMobile ? "100%" : "70%";

  const drawerOpen = Boolean(post);

  useEffect(() => {
    if(!postId) {
      setPost(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    danbooruService.fetchPostById(Number(postId))
      .then(fetchedPost => {
        setPost(fetchedPost);
      })
      .catch(error => {
        console.error("Error fetching post by ID:", error);
        setPost(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [postId]);

  const closeDrawer = () => {
    navigate(-1)
  }

  return (
    <Drawer
      anchor="right"
      open={drawerOpen && !loading}
      onClose={closeDrawer}
      sx={{
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          backgroundColor: "rgba(18, 18, 18, 0.95)",
          borderLeft: "1px solid rgba(255, 255, 255, 0.05)",
          padding: 0,
          overflowY: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "100%",
          WebkitOverflowScrolling: "touch",
        },
      }}
    >
      {!loading && post && (
        <Box sx={{ p: 0, height: "100%", position: "relative", display: "flex", flexDirection: "column" }}>
          <Fade in={true} timeout={300}>
            <Box sx={{ display: "flex", flexDirection: "column", height: "100%", maxHeight: "100%" }}>
              {/* Image preview section */}
              <Box
                sx={{
                  position: "relative",
                  height: { xs: "40%", sm: "50%" },
                  minHeight: { xs: "200px", sm: "300px" },
                  overflow: "hidden",
                  backgroundColor: "rgba(18, 18, 18, 0.95)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.05)"
                }}
              >
                {/* Close button */}
                <IconButton
                  aria-label="close"
                  onClick={closeDrawer}
                  size="small"
                  sx={{
                    position: "absolute",
                    top: { xs: 12, sm: 16 },
                    right: { xs: 12, sm: 16 },
                    width: { xs: 40, sm: 36 },
                    height: { xs: 40, sm: 36 },
                    backgroundColor: "rgba(30, 30, 30, 0.5)",
                    color: "#e0e0e0",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    "&:hover": {
                      backgroundColor: "rgba(70, 70, 70, 0.5)",
                    },
                    zIndex: 10,
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>

                {/* Download button */}
                <IconButton
                  aria-label="download"
                  onClick={async () => {
                    if (!post) return;
                    const url = post.file_url;
                    try {
                      const response = await fetch(url);
                      if (!response.ok) throw new Error(`Network response was not ok: ${response.status}`);
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
                      // Fallback: open the image in a new tab (download attribute may be ignored for cross-origin URLs)
                      window.open(url, "_blank", "noopener,noreferrer");
                    }
                  }}
                  size="small"
                  sx={{
                    position: "absolute",
                    top: 16,
                    right: 64,
                    backgroundColor: "rgba(30, 30, 30, 0.5)",
                    color: "#e0e0e0",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    "&:hover": {
                      backgroundColor: "rgba(70, 70, 70, 0.5)",
                    },
                    zIndex: 10,
                  }}
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>

                {/* Fullscreen button */}
                <IconButton
                  aria-label="fullscreen"
                  onClick={() => {
                    if (!post) return;
                    const url = post.large_file_url || post.file_url;
                    window.open(url, "_blank");
                  }}
                  size="small"
                  sx={{
                    position: "absolute",
                    top: 16,
                    right: 112,
                    backgroundColor: "rgba(30, 30, 30, 0.5)",
                    color: "#e0e0e0",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    "&:hover": {
                      backgroundColor: "rgba(70, 70, 70, 0.5)",
                    },
                    zIndex: 10,
                  }}
                >
                  <FullscreenIcon fontSize="small" />
                </IconButton>

                {/* Image */}
                  {post.file_ext === "webm" || post.file_ext === "mp4" ? (
                  <video
                    src={post.large_file_url || post.file_url}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      display: "block",
                    }}
                    controls
                    preload="metadata"
                  />
                  ) : (
                  <img
                    src={post.large_file_url || post.file_url}
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

              {/* Image details section */}
              <Box
                sx={{
                  p: 2,
                  flex: 1,
                  overflow: "auto",
                  maxHeight: "50%", 
                  backgroundColor: "rgba(18, 18, 18, 0.95)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  pb: 6,
                  '&::-webkit-scrollbar': {
                    width: '4px',
                    background: 'rgba(30, 30, 30, 0.2)',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: 'rgba(160, 160, 160, 0.3)',
                    borderRadius: '2px',
                    '&:hover': {
                      background: 'rgba(160, 160, 160, 0.4)',
                    },
                  },
                }}
              >
                <Paper
                  sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: "4px",
                    background: "rgba(30, 30, 30, 0.7)",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    position: "relative",
                    overflow: "hidden",
                    width: "100%",
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    sx={{
                      fontWeight: 600,
                      color: "#e0e0e0",
                      mb: 1.5,
                      letterSpacing: 0.5,
                    }}
                  >
                    Details
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1.2,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ 
                        color: "rgba(224, 224, 224, 0.75)",
                        fontWeight: 400,
                      }}
                    >
                      ID:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#e0e0e0",
                        fontWeight: 500,
                      }}
                    >
                      {post.id}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1.2,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(255, 255, 255, 0.5)" }}
                    >
                      Size:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(255, 255, 255, 0.9)",
                        fontWeight: 500,
                      }}
                    >
                      {post.image_width} × {post.image_height}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1.2,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(255, 255, 255, 0.5)" }}
                    >
                      Format:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(255, 255, 255, 0.9)",
                        fontWeight: 500,
                      }}
                    >
                      {post.file_ext.toUpperCase()}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1.2,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(255, 255, 255, 0.5)" }}
                    >
                      Uploaded:
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "rgba(255, 255, 255, 0.9)",
                          fontWeight: 500,
                        }}
                      >
                        {new Date(post.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </Typography>
                      <Chip
                        size="small"
                        label={danbooruUtil.getDaysAgo(post.created_at)}
                        sx={{
                          ml: 1,
                          height: "18px",
                          fontSize: "0.65rem",
                          fontWeight: 600,
                          backgroundColor: "rgba(40, 40, 40, 0.7)",
                          color: "#e0e0e0",
                          border: "1px solid rgba(255, 255, 255, 0.05)",
                          borderRadius: "4px",
                        }}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(224, 224, 224, 0.75)" }}
                    >
                      Rating:
                    </Typography>
                    <Chip
                      label={post.rating.toUpperCase()}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        height: "22px",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        color: "#FFFFFF",
                        backgroundColor: post.rating === "s" 
                          ? "rgba(86, 180, 140, 0.7)" 
                          : post.rating === "q"
                          ? "rgba(200, 150, 0, 0.7)"
                          : "rgba(200, 70, 70, 0.7)",
                        border: "none",
                      }}
                    />
                  </Box>
                  
                  {/* Add Artist information */}
                  {post.tag_string_artist && (
                    <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1.2 }}>
                      <Typography
                        variant="body2"
                        sx={{ color: "rgba(224, 224, 224, 0.75)" }}
                      >
                        Artist:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#e0e0e0",
                          fontWeight: 500,
                        }}
                      >
                        {post.tag_string_artist.split(" ").join(", ")}
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Add Copyright/Source information */}
                  {post.tag_string_copyright && (
                    <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1.2 }}>
                      <Typography
                        variant="body2"
                        sx={{ color: "rgba(224, 224, 224, 0.75)" }}
                      >
                        From:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#e0e0e0",
                          fontWeight: 500,
                          maxWidth: "70%",
                          textAlign: "right"
                        }}
                      >
                        {post.tag_string_copyright.split(" ").join(", ")}
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Add Character information */}
                  {post.tag_string_character && (
                    <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1.2 }}>
                      <Typography
                        variant="body2"
                        sx={{ color: "rgba(224, 224, 224, 0.75)" }}
                      >
                        Characters:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#e0e0e0",
                          fontWeight: 500,
                          maxWidth: "70%",
                          textAlign: "right"
                        }}
                      >
                        {post.tag_string_character.split(" ").join(", ")}
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Add Source URL if available */}
                  {post.source && post.source.trim() !== "" && (
                    <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1.2 }}>
                      <Typography
                        variant="body2"
                        sx={{ color: "rgba(224, 224, 224, 0.75)" }}
                      >
                        Source:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#e0e0e0",
                          fontWeight: 500,
                          maxWidth: "70%",
                          textAlign: "right",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {post.source}
                      </Typography>
                    </Box>
                  )}
                </Paper>

                <Paper
                  sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: "4px",
                    background: "rgba(30, 30, 30, 0.7)",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    position: "relative",
                    overflow: "hidden",
                    width: "100%",
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    sx={{
                      fontWeight: 600,
                      color: "#e0e0e0",
                      mb: 1.5,
                      letterSpacing: 0.5,
                    }}
                  >
                    Tags
                  </Typography>
                  <Box sx={{ 
                    display: "flex", 
                    flexWrap: "wrap", 
                    gap: 1,
                    maxHeight: "300px",
                    overflowY: "auto",
                    pr: 1,
                    '&::-webkit-scrollbar': {
                      width: '4px',
                      background: 'rgba(30, 30, 30, 0.2)',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: 'rgba(160, 160, 160, 0.3)',
                      borderRadius: '2px',
                      '&:hover': {
                        background: 'rgba(160, 160, 160, 0.4)',
                      },
                    },
                  }}>
                    {post.tag_string.split(" ").map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        onClick={() => {
                          navigate(`/search?tags=${encodeURIComponent(tag)}`);
                        }}
                        sx={{
                          borderRadius: "4px",
                          fontWeight: 400,
                          backgroundColor: "rgba(40, 40, 40, 0.7)",
                          color: "#e0e0e0",
                          border: "1px solid rgba(255, 255, 255, 0.05)",
                          margin: "2px",
                          height: "22px",
                          "&:hover": {
                            backgroundColor: "rgba(70, 70, 70, 0.7)",
                            color: "white",
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Paper>
              </Box>
            </Box>
          </Fade>
        </Box>
      )}
    </Drawer>
  );
};

export default ImagePreviewDrawer;