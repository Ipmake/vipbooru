import React from "react";
import { Box, CircularProgress } from "@mui/material";
import type { DanbooruPost } from "../types";
import { useNavigate, useSearchParams } from "react-router-dom";
import { danbooruService } from "../services/danbooru";

interface MasonryGridProps {
  posts: DanbooruPost[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  onItemClick: (post: DanbooruPost) => void;
}

interface ItemPosition {
  top: number;
  left: number;
  height: number;
  column: number;
}

const MasonryGrid: React.FC<MasonryGridProps> = ({ posts, containerRef, onItemClick }) => {
  const [containerWidth, setContainerWidth] = React.useState(0);
  const [scrollTop, setScrollTop] = React.useState(0);
  const [containerHeight, setContainerHeight] = React.useState(0);
  const [itemHeights, setItemHeights] = React.useState<Map<number, number>>(new Map());
  const imageRefs = React.useRef<Map<number, HTMLDivElement>>(new Map());

  const columnWidth = 300;
  const columnGutter = 12;
  const columnCount = Math.max(1, Math.floor((containerWidth + columnGutter) / (columnWidth + columnGutter)));
  const actualColumnWidth = (containerWidth - (columnCount - 1) * columnGutter) / columnCount;

  // Track container dimensions
  React.useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateDimensions = () => {
      setContainerWidth(element.clientWidth);
      setContainerHeight(element.clientHeight);
    };

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(element);
    updateDimensions();

    return () => resizeObserver.disconnect();
  }, [containerRef]);

  // Track scroll position
  React.useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const handleScroll = () => {
      setScrollTop(element.scrollTop);
    };

    element.addEventListener('scroll', handleScroll, { passive: true });
    return () => element.removeEventListener('scroll', handleScroll);
  }, [containerRef]);

  // Measure image heights as they load
  const handleImageLoad = React.useCallback((index: number) => {
    const element = imageRefs.current.get(index);
    if (element) {
      const height = element.offsetHeight;
      setItemHeights(prev => {
        const newMap = new Map(prev);
        newMap.set(index, height);
        return newMap;
      });
    }
  }, []);

  // Calculate positions for all items
  const positions = React.useMemo(() => {
    const positions: ItemPosition[] = [];
    const columnHeights = new Array(columnCount).fill(0);

    posts.forEach((_, index) => {
      // Find shortest column
      const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));
      const left = shortestColumn * (actualColumnWidth + columnGutter);
      const top = columnHeights[shortestColumn];
      
      // Use measured height or estimate
      const height = itemHeights.get(index) || 400;

      positions.push({
        top,
        left,
        height,
        column: shortestColumn,
      });

      columnHeights[shortestColumn] += height + columnGutter;
    });

    return positions;
  }, [posts, columnCount, actualColumnWidth, columnGutter, itemHeights]);

  // Calculate total height
  const totalHeight = positions.length > 0 
    ? Math.max(...positions.map(p => p.top + p.height)) + columnGutter
    : 0;

  // Determine visible items (virtualization)
  const visibleItems = React.useMemo(() => {
    const overscan = 2000; // pixels - load images 2000px before/after visible area
    const startY = scrollTop - overscan;
    const endY = scrollTop + containerHeight + overscan;

    return positions
      .map((pos, index) => ({ pos, index }))
      .filter(({ pos }) => {
        return pos.top + pos.height >= startY && pos.top <= endY;
      });
  }, [positions, scrollTop, containerHeight]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: totalHeight,
      }}
    >
      {visibleItems.map(({ pos, index }) => {
        const post = posts[index];
        return (
          <Box
            key={post.id}
            ref={(el) => {
              if (el) imageRefs.current.set(index, el as HTMLDivElement);
              else imageRefs.current.delete(index);
            }}
            onClick={() => onItemClick(post)}
            sx={{
              position: 'absolute',
              top: pos.top,
              left: pos.left,
              width: actualColumnWidth,
              overflow: 'hidden',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              backgroundColor: 'background.paper',

              "&:hover": {
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
                transform: 'translateY(-4px) scale(1.03)',
                transition: 'all 0.3s ease',
              },

              transition: 'all 0.3s ease',
            }}
          >
            <img 
              src={post.large_file_url || post.file_url} 
              alt={post.tag_string}
              onLoad={() => handleImageLoad(index)}
              style={{ 
                width: '100%',
                height: 'auto',
                display: 'block',
                objectFit: 'cover',
              }}
            />
          </Box>
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
  const scrollableRef = React.useRef<HTMLDivElement>(null);

  const [searchParams] = useSearchParams();

  const { tags } = Object.fromEntries([...searchParams]) as { tags?: string };

  // Reset and fetch initial posts when tags change
  React.useEffect(() => {
    setLoading(true);
    setPage(1);
    setHasMore(true);
    scrollableRef.current?.scrollTo({ top: 0 });

    danbooruService.fetchPosts(tags?.split(",") || [], 1, 100)
      .then(fetchedPosts => {
        const posts = fetchedPosts.filter(post => post.file_url); // Filter out posts without file_url
        setPosts(posts);
        setHasMore(true);
      })
      .catch(error => {
        console.error("Error fetching posts:", error);
        setHasMore(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [tags]);

  // Load more posts
  const loadMorePosts = React.useCallback(() => {
    if (loading || !hasMore) return;

    setLoading(true);
    const nextPage = page + 1;

    danbooruService.fetchPosts(tags?.split(",") || [], nextPage, 100)
      .then(fetchedPosts => {
        if (fetchedPosts.length > 0) {
          const posts = fetchedPosts.filter(post => post.file_url);
          setPosts(prev => [...prev, ...posts]);
          setPage(nextPage);
          setHasMore(true);
        } else {
          setHasMore(false);
        }
      })
      .catch(error => {
        console.error("Error fetching more posts:", error);
        setHasMore(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [loading, hasMore, page, tags]);

  // Handle scroll event
  const handleScroll = React.useCallback(() => {
    const scrollableDiv = scrollableRef.current;
    if (!scrollableDiv) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollableDiv;
    // Load more when user is within 850px of the bottom
    if (scrollHeight - scrollTop - clientHeight < 850) {
      loadMorePosts();
    }
  }, [loadMorePosts]);

  // Attach scroll listener
  React.useEffect(() => {
    const scrollableDiv = scrollableRef.current;
    if (!scrollableDiv) return;

    scrollableDiv.addEventListener('scroll', handleScroll);
    return () => scrollableDiv.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleItemClick = React.useCallback((post: DanbooruPost) => {
    const tags = searchParams.get("tags") ? searchParams.get("tags")!.split(",") : [];
    navigate(`/search/${post.id}?tags=${encodeURIComponent([...tags].join(","))}`);
  }, [navigate, searchParams]);

  return (
    <Box
      ref={scrollableRef}
      id="scrollableDiv"
      sx={{
        height: "100%",
        overflow: "auto",
        scrollbarWidth: "thin",
        "&::-webkit-scrollbar": {
          width: "4px",
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
        px: 1,
      }}
    >
      {posts.length > 0 && (
        <MasonryGrid 
          posts={posts}
          containerRef={scrollableRef}
          onItemClick={handleItemClick}
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
