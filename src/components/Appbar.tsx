import { Box, Stack, Typography } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import SearchBox from "./SearchBox";

const navitems: {
  label: string;
  path: string;
}[] = [
  {
    label: "Home",
    path: "/search",
  },
  {
    label: "About",
    path: "/info",
  },
];

function Appbar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        width: "100%",

        px: 2,
        pb: 1,

        position: "fixed",
        zIndex: 10,

        backgroundColor: "background.default",
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: "64px",
          py: 1.5,
          px: 2,

          backgroundColor: "background.default",
          borderRadius: 1,

          border: "1px solid",
          borderColor: "divider",

          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        {/* Left side */}
        <Stack
          direction="row"
          spacing={3}
          sx={{
            alignItems: "center",
            width: "30%",
          }}
        >
          <img
            src="./logo.png"
            alt="Site logo"
            style={{
              aspectRatio: "1/1",
              width: "auto",
              height: "32px",
            }}
          />

          <Stack direction="row" spacing={1}>
            {navitems.map((item) => (
              <Box
                sx={{
                  cursor: "pointer",
                  userSelect: "none",

                  position: "relative",
                  overflow: "hidden",

                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",

                  px: 2,
                  py: 1,
                }}
                onClick={() => navigate(item.path)}
              >
                <Typography
                  sx={{
                    color: "",
                    fontSize: 14,
                    fontWeight: "bold",
                    zIndex: 1,
                  }}
                >
                  {item.label}
                </Typography>

                <Box
                  sx={{
                    width: "100%",
                    height: "100%",

                    position: "absolute",
                    top: 0,
                    left: 0,

                    transform: `scale(${
                      location.pathname.startsWith(item.path) ? 1 : 0
                    })`,

                    transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",

                    backgroundColor: "primary.dark",

                    borderRadius: 1,
                  }}
                />
              </Box>
            ))}
          </Stack>
        </Stack>

        {/* Center */}
        <Stack
          direction="row"
          spacing={2}
          sx={{
            alignItems: "center",
            width: "40%",
            height: "100%",
          }}
        >
          <Box
            sx={{
              width: "100%",
              backgroundColor: "primary.dark",

              borderRadius: 1,

              px: 1,
              py: 0.75,

              display: "flex",
              alignItems: "center",
            }}
          >
            <SearchBox />
          </Box>
        </Stack>

        {/* Right side */}
        <Stack
          direction="row"
          spacing={3}
          sx={{
            alignItems: "center",
            width: "30%",
          }}
        ></Stack>
      </Box>
    </Box>
  );
}

export default Appbar;
