import React, { useRef, useCallback, useMemo } from "react";
import { Box, Chip, CircularProgress, Typography } from "@mui/material";
import type { DanbooruPost } from "../types";
import { useNavigate, useSearchParams } from "react-router-dom";
import { danbooruService } from "../services/danbooru";
import { styled } from "@mui/material/styles";

const MasonryItem = styled(Box)(({ theme }) => ({
  position: "absolute",
  overflow: "hidden",
  borderRadius: "12px",
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
  backgroundColor: "rgba(30, 30, 30, 0.95)",
  transition: "all 0.3s ease",
  willChange: "transform",
  WebkitTapHighlightColor: "transparent",
  touchAction: "manipulation",

  "&:hover": {
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)",
    transform: "translateY(-4px) scale(1.03)",
    zIndex: 10,
    borderRadius: "16px",
  },

  "&:active": {
    transform: "scale(0.98)",
  },

  [theme.breakpoints.down("sm")]: {
    borderRadius: "8px",
    "&:hover": {
      transform: "none",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    },
  },
}));

interface MasonryGridProps {
  posts: DanbooruPost[];
  onItemClick: (post: DanbooruPost) => void;
  scrollableRef: React.RefObject<HTMLDivElement | null>;
  imageLoading?: "lazy" | "eager";
}

interface ItemPosition {
  top: number;
  left: number;
  height: number;
  column: number;
}

const MasonryGrid: React.FC<MasonryGridProps> = ({
  posts,
  onItemClick,
  scrollableRef,
  imageLoading = "lazy",
}) => {
  const [containerWidth, setContainerWidth] = React.useState(0);
  const [scrollTop, setScrollTop] = React.useState(0);
  const [containerHeight, setContainerHeight] = React.useState(0);

  // Only keep refs for visible items
  const visibleImageRefs = React.useRef<Map<string, HTMLDivElement>>(new Map());
  const itemHeightsRef = React.useRef<Map<number, number>>(new Map());
  const positionsCache = React.useRef<ItemPosition[]>([]);
  const needsRecalc = React.useRef(false);
  const [layoutVersion, setLayoutVersion] = React.useState(0);

  // Responsive column width based on screen size
  const getColumnWidth = () => {
    if (typeof window === "undefined") return 300;
    const width = window.innerWidth;
    if (width < 600) return 140; // Mobile - 2-3 columns
    if (width < 960) return 220; // Tablet - 3-4 columns
    return 300; // Desktop
  };

  const columnWidth = getColumnWidth();
  const columnGutter = 12;
  const columnCount = Math.max(
    1,
    Math.floor((containerWidth + columnGutter) / (columnWidth + columnGutter))
  );
  const totalGutterWidth = (columnCount - 1) * columnGutter;
  const actualColumnWidth = Math.floor(
    (containerWidth - totalGutterWidth) / columnCount
  );

  const listContainerRef = useRef<HTMLElement>(null);

  // Track container dimensions
  React.useEffect(() => {
    const element = listContainerRef.current;
    if (!element) return;

    const updateDimensions = () => {
      const newWidth = element.clientWidth;
      if (newWidth !== containerWidth) {
        setContainerWidth(newWidth);
        needsRecalc.current = true;
      }
    };

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(element);
    updateDimensions();

    return () => resizeObserver.disconnect();
  }, [containerWidth]);

  // Throttled scroll tracking
  React.useEffect(() => {
    const element = scrollableRef.current;
    if (!element) return;

    let rafId: number | null = null;

    const updateScrollAndHeight = () => {
      setScrollTop(element.scrollTop);
      setContainerHeight(element.clientHeight);
    };

    const handleScroll = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          setScrollTop(element.scrollTop);
          rafId = null;
        });
      }
    };

    updateScrollAndHeight();
    element.addEventListener("scroll", handleScroll, { passive: true });
    const resizeObserver = new ResizeObserver(updateScrollAndHeight);
    resizeObserver.observe(element);

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      element.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
    };
  }, [scrollableRef]);

  // Optimized image load handler - batch updates
  const recalcTimeoutRef = useRef<number | null>(null);

  const handleImageLoad = useCallback(
    (index: number, uniqueKey: string) => {
      const element = visibleImageRefs.current.get(uniqueKey);
      if (element) {
        const height = element.offsetHeight;
        const currentHeight = itemHeightsRef.current.get(index);

        if (currentHeight !== height && height > 0) {
          itemHeightsRef.current.set(index, height);
          needsRecalc.current = true;

          // For early items (first few rows), recalculate immediately to prevent overlap
          if (index < columnCount * 4) {
            // Clear any pending timeout
            if (recalcTimeoutRef.current !== null) {
              clearTimeout(recalcTimeoutRef.current);
              recalcTimeoutRef.current = null;
            }
            needsRecalc.current = false;
            setLayoutVersion((v) => v + 1);
          } else {
            // For later items, debounce to batch multiple updates
            if (recalcTimeoutRef.current !== null) {
              clearTimeout(recalcTimeoutRef.current);
            }
            recalcTimeoutRef.current = window.setTimeout(() => {
              if (needsRecalc.current) {
                needsRecalc.current = false;
                setLayoutVersion((v) => v + 1);
              }
              recalcTimeoutRef.current = null;
            }, 50);
          }
        }
      }
    },
    [columnCount]
  );
  // Calculate positions with caching
  const positions = useMemo(() => {
    // Use cache if available and no recalc needed
    if (
      positionsCache.current.length === posts.length &&
      !needsRecalc.current
    ) {
      return positionsCache.current;
    }

    const positions: ItemPosition[] = [];
    const columnHeights = new Array(columnCount).fill(0);

    for (let index = 0; index < posts.length; index++) {
      const post = posts[index];
      const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));
      const left = shortestColumn * (actualColumnWidth + columnGutter);
      const top = columnHeights[shortestColumn];

      let height = itemHeightsRef.current.get(index);
      if (!height) {
        if (post.image_width && post.image_height) {
          const aspectRatio = post.image_height / post.image_width;
          height = actualColumnWidth * aspectRatio;
        } else {
          // Use a more reasonable default height
          height = actualColumnWidth * 1.2; // Assume roughly portrait orientation
        }
      }

      positions.push({ top, left, height, column: shortestColumn });
      columnHeights[shortestColumn] += height + columnGutter;
    }

    positionsCache.current = positions;
    needsRecalc.current = false;

    return positions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    posts.length,
    columnCount,
    actualColumnWidth,
    columnGutter,
    layoutVersion,
  ]);

  const totalHeight = useMemo(() => {
    if (positions.length === 0) return 0;
    return Math.max(...positions.map((p) => p.top + p.height)) + columnGutter;
  }, [positions]);

  // Optimized visible items calculation
  const visibleItems = useMemo(() => {
    const overscan = 800;
    const startY = Math.max(0, scrollTop - overscan);
    const endY = scrollTop + containerHeight + overscan;

    const visible: Array<{
      pos: ItemPosition;
      index: number;
      post: DanbooruPost;
    }> = [];

    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      if (pos.top + pos.height >= startY && pos.top <= endY) {
        visible.push({ pos, index: i, post: posts[i] });
      } else if (pos.top > endY) {
        break; // Positions are sorted, no need to check further
      }
    }

    // Preload next items
    if (visible.length > 0) {
      const lastIndex = visible[visible.length - 1].index;
      const preloadCount = Math.min(20, posts.length - lastIndex - 1);

      for (let i = 1; i <= preloadCount; i++) {
        const idx = lastIndex + i;
        if (positions[idx]) {
          visible.push({ pos: positions[idx], index: idx, post: posts[idx] });
        }
      }
    }

    return visible;
  }, [positions, scrollTop, containerHeight, posts]);

  // Aggressive cleanup of refs
  React.useEffect(() => {
    const visibleKeys = new Set(
      visibleItems.map(
        ({ post }) => `${post.id}-${new Date(post.created_at).getTime()}`
      )
    );

    // Keep only visible refs
    const keysToDelete: string[] = [];
    visibleImageRefs.current.forEach((_, key) => {
      if (!visibleKeys.has(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => visibleImageRefs.current.delete(key));
  }, [visibleItems]);

  // Cleanup heights for removed posts
  React.useEffect(() => {
    if (itemHeightsRef.current.size > posts.length * 1.5) {
      const validIndices = new Set(posts.map((_, i) => i));
      const heightsToDelete: number[] = [];

      itemHeightsRef.current.forEach((_, index) => {
        if (!validIndices.has(index)) {
          heightsToDelete.push(index);
        }
      });

      heightsToDelete.forEach((index) => itemHeightsRef.current.delete(index));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts.length]);

  return (
    <Box
      sx={{ position: "relative", width: "100%" }}
      style={{ height: totalHeight }}
      ref={listContainerRef}
    >
      <Box
        sx={{
          px: 1,
          py: 1,
          background: (theme) => theme.palette.background.paper + "EE",
          zIndex: 10000,
          position: "fixed",
          bottom: 16,
          left: 16,
          display: { xs: "none", md: "block" },
        }}
      >
        <Typography
          variant="body2"
          color="textSecondary"
          fontFamily="monospace"
        >
          Pos: {scrollTop} | Items: {posts.length} | Rendered:{" "}
          {visibleItems.length} | Page: {Math.ceil(posts.length / 100)} | Refs:{" "}
          {visibleImageRefs.current.size}
        </Typography>
      </Box>

      {visibleItems.map(({ pos, index, post }) => {
        const uniqueKey = `${post.id}-${new Date(post.created_at).getTime()}`;
        return (
          <MasonryItem
            key={uniqueKey}
            ref={(el) => {
              if (el) {
                visibleImageRefs.current.set(uniqueKey, el as HTMLDivElement);
              }
            }}
            onClick={() => onItemClick(post)}
            style={{
              top: pos.top + columnGutter,
              left: pos.left,
              width: actualColumnWidth,
            }}
          >
            {(post.file_ext === "webm" || post.file_ext === "mp4") && (
              <Chip
                label="VIDEO"
                size="small"
                color="secondary"
                sx={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  zIndex: 10,
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  color: "#fff",
                  fontWeight: "bold",
                  pointerEvents: "none",
                }}
              />
            )}
            <img
              src={
                post.file_ext === "webm" || post.file_ext === "mp4"
                  ? post.preview_file_url
                  : post.large_file_url || post.preview_file_url
              }
              alt={post.tag_string}
              loading={imageLoading}
              onLoad={() => handleImageLoad(index, uniqueKey)}
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                objectFit: "cover",
              }}
            />
          </MasonryItem>
        );
      })}
    </Box>
  );
};

const ImageGrid = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = React.useState<DanbooruPost[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [page, setPage] = React.useState<number>(1);
  const [hasMore, setHasMore] = React.useState<boolean>(true);
  const [imageLoading, setImageLoading] = React.useState<"lazy" | "eager">(
    "lazy"
  );
  const scrollableRef = React.useRef<HTMLDivElement>(null);
  const loadingRef = React.useRef(false);

  const [searchParams] = useSearchParams();
  const tags = searchParams.get("tags") || "";

  // Load image loading preference
  React.useEffect(() => {
    const savedImageLoading = localStorage.getItem("image_loading") as
      | "lazy"
      | "eager"
      | null;
    if (savedImageLoading) {
      setImageLoading(savedImageLoading);
    }
  }, []);

  React.useEffect(() => {
    setLoading(true);
    loadingRef.current = true;
    setPage(1);
    setHasMore(true);
    setPosts([]);
    scrollableRef.current?.scrollTo({ top: 0 });

    danbooruService
      .fetchPosts(tags?.split(",") || [], 1, 100)
      .then((fetchedPosts) => {
        const postsWithFiles = fetchedPosts.filter((post) => post.file_url);
        const uniquePosts = Array.from(
          new Map(postsWithFiles.map((post) => [post.id, post])).values()
        );
        setPosts(uniquePosts);
        setHasMore(fetchedPosts.length === 100);
      })
      .catch((error) => {
        console.error("Error fetching posts:", error);
        setHasMore(false);
      })
      .finally(() => {
        setLoading(false);
        loadingRef.current = false;
      });
  }, [tags]);

  const loadMorePosts = useCallback(() => {
    if (loadingRef.current || !hasMore) return;

    loadingRef.current = true;
    setLoading(true);
    const nextPage = page + 1;

    danbooruService
      .fetchPosts(tags?.split(",") || [], nextPage, 100)
      .then((fetchedPosts) => {
        if (fetchedPosts.length > 0) {
          const postsWithFiles = fetchedPosts.filter((post) => post.file_url);
          setPosts((prev) => {
            const combined = [...prev, ...postsWithFiles];
            const uniquePosts = Array.from(
              new Map(combined.map((post) => [post.id, post])).values()
            );
            return uniquePosts;
          });
          setPage(nextPage);
          setHasMore(fetchedPosts.length === 100);
        } else {
          setHasMore(false);
        }
      })
      .catch((error) => {
        console.error("Error fetching more posts:", error);
        setHasMore(false);
      })
      .finally(() => {
        setLoading(false);
        loadingRef.current = false;
      });
  }, [hasMore, page, tags]);

  const handleScroll = useCallback(() => {
    const scrollableDiv = scrollableRef.current;
    if (!scrollableDiv || loadingRef.current || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollableDiv;
    if (scrollHeight - scrollTop - clientHeight < 850) {
      loadMorePosts();
    }
  }, [loadMorePosts, hasMore]);

  React.useEffect(() => {
    const scrollableDiv = scrollableRef.current;
    if (!scrollableDiv) return;

    let rafId: number | null = null;
    const throttledScroll = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          handleScroll();
          rafId = null;
        });
      }
    };

    scrollableDiv.addEventListener("scroll", throttledScroll, {
      passive: true,
    });
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      scrollableDiv.removeEventListener("scroll", throttledScroll);
    };
  }, [handleScroll]);

  const handleItemClick = useCallback(
    (post: DanbooruPost) => {
      const tags = searchParams.get("tags")?.split(",") || [];
      navigate(`/search/${post.id}?tags=${encodeURIComponent(tags.join(","))}`);
    },
    [navigate, searchParams]
  );

  return (
    <Box
      ref={scrollableRef}
      id="scrollableDiv"
      sx={{
        height: "100%",
        overflow: "auto",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "thin",
        "&::-webkit-scrollbar": {
          width: { xs: "2px", sm: "4px" },
        },
        "&::-webkit-scrollbar-track": {
          background: "rgba(30, 30, 30, 0.2)",
        },
        "&::-webkit-scrollbar-thumb": {
          background: "rgba(160, 160, 160, 0.3)",
          borderRadius: "2px",
          "&:hover": {
            background: "rgba(160, 160, 160, 0.4)",
          },
        },
        px: { xs: 0.5, sm: 1, md: 2 },
        pr: { xs: 0.5, sm: 2 },
      }}
    >
      {posts.length > 0 && (
        <MasonryGrid
          posts={posts}
          onItemClick={handleItemClick}
          scrollableRef={scrollableRef}
          imageLoading={imageLoading}
        />
      )}

      {loading && posts.length === 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "50vh",
          }}
        >
          <CircularProgress size={60} thickness={4} />
        </Box>
      )}

      {loading && posts.length > 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 4,
          }}
        >
          <CircularProgress size={40} thickness={4} />
        </Box>
      )}

      {!loading && !hasMore && posts.length > 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 4,
            color: "text.secondary",
            fontSize: "0.875rem",
          }}
        >
          No more images to load
        </Box>
      )}
    </Box>
  );
};

export default ImageGrid;
