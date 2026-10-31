import { alpha, createTheme } from '@mui/material/styles';

const primaryMain = "#909090";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: primaryMain,
      light: "#909090",
      dark: "#242424",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#2e1a47",
      light: "#3b2a5c",
      dark: "#1f1330",
      contrastText: "#d8b4fe",
    },
    background: {
      default: "#101010",
      paper: "#161616",
    },
    text: {
      primary: "#f3f4f6",
      secondary: "#a1a1aa",
    },
    error: {
      main: "#ef4444",
      light: "#f87171",
      dark: "#dc2626",
    },
    success: {
      main: "#8b5cf6",
      light: "#a78bfa",
      dark: "#7c3aed",
    },
    divider: "#FFFFFF1A",
  },
  shape: {
    borderRadius: 4,
  },
  typography: {
    fontFamily: "'Inter Variable', sans-serif",
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 500,
      textTransform: "none",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          padding: "10px 22px",
          boxShadow: "none",
          textTransform: "none",
          fontWeight: 600,
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            borderRadius: 6,
          },
          "&:active": {
            borderRadius: 12,
          },
        },
        outlined: {
          color: primaryMain,
          border: `1px solid ${alpha(primaryMain, 0.2)}`,
          "&:hover": {
            border: `1px solid ${primaryMain}`,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          border: `1px solid ${alpha(primaryMain, 0.2)}`,
          color: primaryMain,
          backgroundColor: "#161616",
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          borderRadius: 12,
          "&:hover": {
            border: `1px solid ${primaryMain}`,
            backgroundColor: "#161616",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
        elevation1: {
          backgroundColor: "#161616",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          overflow: "hidden",
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          marginBottom: 8,
          "&:before": { display: "none" },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          border: `1px solid #ffffff1a`,
          borderRadius: 8,

          animation: "modalPopIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards",
          "@keyframes modalPopIn": {
            "0%": { opacity: 0, transform: "scale(0.9) translateY(20px)" },
            "100%": { opacity: 1, transform: "scale(1) translateY(0)" },
          },

          "&:focus": {
            outline: "none",
          },
          "&:focus-visible": {
            outline: "none",
          },
        },
        container: {
          border: `1px solid #ffffff1a`,
          borderRadius: 12,
        },
      },
      defaultProps: {
        disableEnforceFocus: true,
        disableAutoFocus: true,
        disableRestoreFocus: true,
        autoFocus: false,
      },
    },
    MuiModal: {
      defaultProps: {
        disableEnforceFocus: true,
        disableAutoFocus: true,
        disableRestoreFocus: true,
        autoFocus: false,
      },
      styleOverrides: {
        root: {
          "&:focus": {
            outline: "none",
          },
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          color: primaryMain,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          border: `1px solid #FFFFFF1A`,
          animation: "popoverPopIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards",
          "@keyframes popoverPopIn": {
            "0%": { opacity: 0, transform: "scale(0.9) translateY(-10px)" },
            "100%": { opacity: 1, transform: "scale(1) translateY(0)" },
          },
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          border: `1px solid #FFFFFF1A`,
          animation: "popoverPopIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards",
          "@keyframes popoverPopIn": {
            "0%": { opacity: 0, transform: "scale(0.9) translateY(-10px)" },
            "100%": { opacity: 1, transform: "scale(1) translateY(0)" },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${alpha(primaryMain, 0.15)}`,
          boxShadow: "none",
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "#1f2937",
          color: "#f3f4f6",
          fontSize: "0.75rem",
          padding: "6px 10px",
          pointerEvents: "none", // Prevents tooltip from blocking interactions
        },
        arrow: {
          color: "#1f2937",
        },
      },
    },
  },
});

export default theme;
