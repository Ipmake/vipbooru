import React from "react";
import {
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
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

function InfoPage() {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [imageLoading, setImageLoading] = React.useState<"lazy" | "eager">(
    "lazy"
  );
  const [saved, setSaved] = React.useState(false);

  // Load saved settings on mount
  React.useEffect(() => {
    const savedApiKey = localStorage.getItem("danbooru_api_key");
    const savedUsername = localStorage.getItem("danbooru_username");
    const savedImageLoading = localStorage.getItem("image_loading") as
      | "lazy"
      | "eager"
      | null;
    if (savedApiKey) setApiKey(savedApiKey);
    if (savedUsername) setUsername(savedUsername);
    if (savedImageLoading) setImageLoading(savedImageLoading);
  }, []);

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

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleClear = () => {
    setApiKey("");
    setUsername("");
    setImageLoading("lazy");
    localStorage.removeItem("danbooru_api_key");
    localStorage.removeItem("danbooru_username");
    localStorage.removeItem("image_loading");
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
