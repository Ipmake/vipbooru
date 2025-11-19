import {
  Box,
} from "@mui/material";

// Component imports
import SearchBar from "../components/SearchBar";
import ImageGrid from "../components/ImageGrid";
import ImagePreviewDrawer from "../components/ImagePreviewDrawer";

function SearchPage() {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        px: { xs: 1, sm: 2, md: 3 },
      }}
    >
      {/* Search area */}
      <SearchBar />
      
      {/* Main content area */}
      <ImageGrid />
      
      {/* Image preview drawer */}
      <ImagePreviewDrawer />

      {/* Scroll to top button */}
      {/* <Zoom in={showScrollTop}>
        <Fab
          color="primary"
          size="medium"
          aria-label="scroll back to top"
          onClick={() => {
            const scrollableDiv = document.getElementById("scrollableDiv");
            if (scrollableDiv) {
              scrollableDiv.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: 'linear-gradient(135deg, #8A84FF, #6158E8)',
            "&:hover": {
              transform: "translateY(-3px)",
            },
            boxShadow: "0 6px 20px rgba(138, 132, 255, 0.4)",
            zIndex: 1000,
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '30%',
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), rgba(255,255,255,0))',
              borderRadius: '50% 50% 0 0',
              pointerEvents: 'none',
            },
          }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      </Zoom> */}
    </Box>
  );
}

export default SearchPage;
