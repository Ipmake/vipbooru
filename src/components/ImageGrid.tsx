import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, RefObject } from "react";
import { Box, Chip, CircularProgress, useMediaQuery } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { DanbooruPost } from "../types";
import { danbooruService } from "../services/danbooru";

type ImageLoading = "lazy" | "eager";

interface ItemLayout {
  top: number;
  left: number;
  height: number;
}

interface MasonryLayout {
  items: ItemLayout[];
  height: number;
  maxItemHeight: number;
}

interface MasonryCardProps {
  post: DanbooruPost;
  top: number;
  left: number;
  width: number;
  height: number;
  imageLoading: ImageLoading;
  onClick: (post: DanbooruPost) => void;
}

interface MasonryGridProps {
  posts: DanbooruPost[];
  onItemClick: (post: DanbooruPost) => void;
  imageLoading: ImageLoading;
}

const FETCH_LIMIT = 100;
const MAX_EMPTY_PAGE_HOPS = 5;
const LOAD_MORE_MARGIN = 850;
const COLUMN_GUTTER = 8;
const OVERSCAN = 1000;
const SCROLL_STEP = 250;
const VIDEO_EXTENSIONS = new Set(["webm", "mp4"]);
const EMPTY_LAYOUT: MasonryLayout = { items: [], height: 0, maxItemHeight: 0 };

const MasonryItem = styled(Box)(({ theme }) => ({
  position: "absolute",
  overflow: "hidden",
  borderRadius: "4px",
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
  backgroundColor: "rgba(30, 30, 30, 0.95)",
  transition: "transform 0.2s ease-out, box-shadow 0.2s ease-out",
  willChange: "transform",
  WebkitTapHighlightColor: "transparent",
  touchAction: "manipulation",

  "&:hover": {
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)",
    transform: "scale(0.98)",
    zIndex: 5,
  },

  "&:active": {
    transform: "scale(0.96)",
  },

  [theme.breakpoints.down("sm")]: {
    borderRadius: "8px",
    "&:hover": {
      transform: "none",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    },
  },
}));

const videoChipSx = {
  position: "absolute",
  top: 8,
  left: 8,
  zIndex: 10,
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  color: "#fff",
  fontWeight: "bold",
  pointerEvents: "none",
} as const;

const imageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  display: "block",
  objectFit: "cover",
  userSelect: "none",
  MozWindowDragging: "no-drag",
};

const uniqueById = (posts: DanbooruPost[]) =>
  Array.from(new Map(posts.map((post) => [post.id, post] as const)).values());

const computeLayout = (
  posts: DanbooruPost[],
  columnCount: number,
  columnWidth: number,
): MasonryLayout => {
  const columnHeights = new Array<number>(columnCount).fill(0);
  const items = new Array<ItemLayout>(posts.length);
  let maxItemHeight = 0;

  for (let index = 0; index < posts.length; index += 1) {
    const { image_width, image_height } = posts[index];
    const aspectRatio =
      image_width && image_height ? image_height / image_width : 1;
    const height = Math.round(columnWidth * aspectRatio);

    let column = 0;
    for (let i = 1; i < columnCount; i += 1) {
      if (columnHeights[i] < columnHeights[column]) column = i;
    }

    items[index] = {
      top: columnHeights[column],
      left: column * (columnWidth + COLUMN_GUTTER),
      height,
    };
    columnHeights[column] += height + COLUMN_GUTTER;
    if (height > maxItemHeight) maxItemHeight = height;
  }

  return {
    items,
    height: Math.max(0, Math.max(...columnHeights) - COLUMN_GUTTER),
    maxItemHeight,
  };
};

const firstIndexWithTopAtLeast = (items: ItemLayout[], y: number) => {
  let low = 0;
  let high = items.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (items[mid].top < y) low = mid + 1;
    else high = mid;
  }
  return low;
};

const useTargetColumnWidth = () => {
  const isMobile = useMediaQuery("(max-width:599.95px)");
  const isTablet = useMediaQuery("(max-width:959.95px)");
  if (isMobile) return 140;
  return isTablet ? 220 : 300;
};

const useElementWidth = (ref: RefObject<HTMLElement | null>) => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.floor(entry.contentRect.width)),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return width;
};

const useWindowViewport = (ref: RefObject<HTMLElement | null>) => {
  const [top, setTop] = useState(0);
  const [height, setHeight] = useState(() => window.innerHeight);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const element = ref.current;
      if (element) {
        const offset = -element.getBoundingClientRect().top;
        setTop(Math.floor(offset / SCROLL_STEP) * SCROLL_STEP);
      }
      setHeight(window.innerHeight);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [ref]);

  return { top, height };
};

const MasonryCard = memo(function MasonryCard({
  post,
  top,
  left,
  width,
  height,
  imageLoading,
  onClick,
}: MasonryCardProps) {
  const isVideo = VIDEO_EXTENSIONS.has(post.file_ext);

  return (
    <MasonryItem
      onClick={() => onClick(post)}
      style={{ top, left, width, height }}
    >
      {isVideo && (
        <Chip label="VIDEO" size="small" color="secondary" sx={videoChipSx} />
      )}
      <img
        draggable={false}
        src={
          isVideo
            ? post.preview_file_url
            : post.large_file_url || post.preview_file_url
        }
        loading={imageLoading}
        style={imageStyle}
      />
    </MasonryItem>
  );
});

const MasonryGrid = ({
  posts,
  onItemClick,
  imageLoading,
}: MasonryGridProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerWidth = useElementWidth(containerRef);
  const viewport = useWindowViewport(containerRef);
  const targetColumnWidth = useTargetColumnWidth();

  const columnCount = Math.max(
    1,
    Math.floor(
      (containerWidth + COLUMN_GUTTER) / (targetColumnWidth + COLUMN_GUTTER),
    ),
  );
  const columnWidth = Math.floor(
    (containerWidth - (columnCount - 1) * COLUMN_GUTTER) / columnCount,
  );

  const layout = useMemo(
    () =>
      columnWidth > 0
        ? computeLayout(posts, columnCount, columnWidth)
        : EMPTY_LAYOUT,
    [posts, columnCount, columnWidth],
  );

  const visibleIndices = useMemo(() => {
    const startY = viewport.top - OVERSCAN;
    const endY = viewport.top + SCROLL_STEP + viewport.height + OVERSCAN;
    const from = firstIndexWithTopAtLeast(
      layout.items,
      startY - layout.maxItemHeight,
    );
    const to = firstIndexWithTopAtLeast(layout.items, endY);

    const indices: number[] = [];
    for (let index = from; index < to; index += 1) {
      const { top, height } = layout.items[index];
      if (top + height >= startY) indices.push(index);
    }
    return indices;
  }, [layout, viewport.top, viewport.height]);

  return (
    <Box
      ref={containerRef}
      sx={{ position: "relative", width: "100%" }}
      style={{ height: layout.height }}
    >
      {visibleIndices.map((index) => {
        const post = posts[index];
        const { top, left, height } = layout.items[index];
        return (
          <MasonryCard
            key={post.id}
            post={post}
            top={top}
            left={left}
            width={columnWidth}
            height={height}
            imageLoading={imageLoading}
            onClick={onItemClick}
          />
        );
      })}
    </Box>
  );
};

const ImageGrid = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tags = searchParams.get("tags") || "";
  const activeTags = useMemo(
    () =>
      tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    [tags],
  );

  const [posts, setPosts] = useState<DanbooruPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [imageLoading] = useState<ImageLoading>(() =>
    localStorage.getItem("image_loading") === "eager" ? "eager" : "lazy",
  );
  const pageRef = useRef(1);
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchVisibleBatch = useCallback(
    async (startPage: number) => {
      let currentPage = startPage;
      let hasMoreFromApi = true;

      for (let attempt = 0; attempt < MAX_EMPTY_PAGE_HOPS; attempt += 1) {
        const result = await danbooruService.fetchPosts(
          activeTags,
          currentPage,
          FETCH_LIMIT,
        );
        hasMoreFromApi = result.hasMore;

        const batch = uniqueById(result.posts.filter((post) => post.file_url));
        if (batch.length > 0 || !hasMoreFromApi) {
          return { posts: batch, page: currentPage, hasMore: hasMoreFromApi };
        }

        currentPage += 1;
      }

      return { posts: [], page: currentPage - 1, hasMore: hasMoreFromApi };
    },
    [activeTags],
  );

  useEffect(() => {
    const fetchInitialPosts = async () => {
      loadingRef.current = true;
      setLoading(true);
      setHasMore(true);
      setPosts([]);
      pageRef.current = 1;
      window.scrollTo({ top: 0, behavior: "auto" });

      try {
        const result = await fetchVisibleBatch(1);
        setPosts(result.posts);
        pageRef.current = result.page;
        setHasMore(result.hasMore);
      } catch (error) {
        console.error("Error fetching posts:", error);
        setHasMore(false);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    };

    fetchInitialPosts();
  }, [fetchVisibleBatch]);

  const loadMorePosts = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;

    loadingRef.current = true;
    setLoading(true);

    try {
      const result = await fetchVisibleBatch(pageRef.current + 1);
      if (result.posts.length > 0) {
        setPosts((prev) => uniqueById([...prev, ...result.posts]));
      }
      pageRef.current = result.page;
      setHasMore(result.hasMore);
    } catch (error) {
      console.error("Error fetching more posts:", error);
      setHasMore(false);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [fetchVisibleBatch, hasMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || loading || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMorePosts();
      },
      { rootMargin: `0px 0px ${LOAD_MORE_MARGIN}px 0px` },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loading, hasMore, loadMorePosts]);

  const handleItemClick = useCallback(
    (post: DanbooruPost) =>
      navigate(`/search/${post.id}?tags=${encodeURIComponent(tags)}`),
    [navigate, tags],
  );

  const hasPosts = posts.length > 0;

  return (
    <Box sx={{ px: { xs: 0.5, sm: 1, md: 2 }, pr: { xs: 0.5, sm: 2 } }}>
      {hasPosts && (
        <MasonryGrid
          posts={posts}
          onItemClick={handleItemClick}
          imageLoading={imageLoading}
        />
      )}

      <div ref={sentinelRef} />

      {loading && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            ...(hasPosts ? { py: 4 } : { height: "50vh" }),
          }}
        >
          <CircularProgress size={hasPosts ? 40 : 60} thickness={4} />
        </Box>
      )}

      {!loading && !hasMore && hasPosts && (
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
