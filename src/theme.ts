import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#a0a0a0', // Neutral gray as primary
      light: '#c0c0c0',
      dark: '#808080',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#606060', // Darker gray as secondary
      light: '#909090',
      dark: '#404040',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#121212', // Simple dark background
      paper: '#1e1e1e', // Slightly lighter for cards
    },
    error: {
      main: '#cf6679', // Muted red
      light: '#ff95a2',
      dark: '#9b3e53',
    },
    warning: {
      main: '#d4a056', // Muted amber
      light: '#ffd085',
      dark: '#9c732c',
    },
    info: {
      main: '#5c7d99', // Muted blue
      light: '#8aacc8',
      dark: '#2f526d',
    },
    success: {
      main: '#6b9b76', // Muted green
      light: '#9ecca5',
      dark: '#3c6d49',
    },
    text: {
      primary: '#e0e0e0', // Light gray for text
      secondary: 'rgba(224, 224, 224, 0.75)', 
      disabled: 'rgba(224, 224, 224, 0.40)',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: "rgba(160, 160, 160, 0.3) rgba(30, 30, 30, 0.2)",
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
            backgroundColor: "rgba(30, 30, 30, 0.2)",
            width: '4px',
            height: '4px',
          },
          "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
            borderRadius: 2,
            backgroundColor: "rgba(160, 160, 160, 0.3)",
            minHeight: 24,
          },
          "&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus": {
            backgroundColor: "rgba(160, 160, 160, 0.5)",
          },
          "&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active": {
            backgroundColor: "rgba(160, 160, 160, 0.6)",
          },
          "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "rgba(160, 160, 160, 0.4)",
          },
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(18, 18, 18, 0.9)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(18, 18, 18, 0.95)',
          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)',
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(30, 30, 30, 0.8)',
          borderRadius: 4,
          border: '1px solid rgba(255, 255, 255, 0.05)',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          },
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 4,
          fontWeight: 500,
          letterSpacing: '0.01em',
          padding: '6px 16px',
          boxShadow: 'none',
          transition: 'all 0.2s ease',
        },
        contained: {
          backgroundColor: '#a0a0a0',
          '&:hover': {
            backgroundColor: '#808080',
          },
        },
        outlined: {
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          color: '#e0e0e0',
          '&:hover': {
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.2)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          },
        },
        text: {
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          }
        }
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(30, 30, 30, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: 4,
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        },
        elevation2: {
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(35, 35, 35, 0.7)',
          borderRadius: '4px',
          transition: 'all 0.2s ease',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          '&:hover': {
            backgroundColor: 'rgba(40, 40, 40, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          },
          '&.Mui-focused': {
            backgroundColor: 'rgba(45, 45, 45, 0.85)',
            boxShadow: '0 0 0 2px rgba(160, 160, 160, 0.25)',
            border: '1px solid rgba(160, 160, 160, 0.3)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(40, 40, 40, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '4px',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(70, 70, 70, 0.7)',
          }
        },
        filled: {
          backgroundColor: 'rgba(160, 160, 160, 0.15)',
          '&:hover': {
            backgroundColor: 'rgba(160, 160, 160, 0.25)',
          }
        },
        outlined: {
          borderColor: 'rgba(160, 160, 160, 0.3)',
          '&:hover': {
            backgroundColor: 'rgba(160, 160, 160, 0.08)',
          }
        }
      }
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          borderRadius: 4,
        },
        icon: {
          color: 'rgba(224, 224, 224, 0.6)'
        }
      }
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          overflow: 'hidden',
        },
        bar: {
          borderRadius: 4,
          backgroundColor: 'rgba(160, 160, 160, 0.9)'
        }
      }
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(160, 160, 160, 0.1)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(160, 160, 160, 0.15)',
            '&:hover': {
              backgroundColor: 'rgba(160, 160, 160, 0.2)',
            }
          }
        }
      }
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease',
        }
      }
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          '&.Mui-checked': {
            '& .MuiSvgIcon-root': {
              filter: 'drop-shadow(0 0 2px rgba(160, 160, 160, 0.3))',
            }
          }
        }
      }
    },
    MuiCircularProgress: {
      styleOverrides: {
        circle: {
          strokeLinecap: 'round',
        }
      }
    },
    MuiCardMedia: {
      styleOverrides: {
        root: {
          transition: 'filter 0.2s ease-out',
          '&:hover': {
            filter: 'brightness(1.03)',
          }
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: 'rgba(30, 30, 30, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          fontSize: '0.75rem',
          padding: '6px 12px',
          borderRadius: 4,
        },
        arrow: {
          color: 'rgba(30, 30, 30, 0.85)',
        }
      }
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          boxShadow: '0 0 0 2px #1e1e1e',
          borderRadius: 4,
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(30, 30, 30, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 4,
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 4,
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            '&.Mui-focused fieldset': {
              borderColor: 'rgba(160, 160, 160, 0.3)',
            },
          },
        }
      }
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          padding: 8,
        },
        track: {
          backgroundColor: 'rgba(160, 160, 160, 0.3)',
          opacity: 1,
        },
        thumb: {
          backgroundColor: '#e0e0e0',
        },
        switchBase: {
          '&.Mui-checked': {
            '& + .MuiSwitch-track': {
              backgroundColor: 'rgba(160, 160, 160, 0.6)',
              opacity: 1,
            },
            '& .MuiSwitch-thumb': {
              backgroundColor: '#ffffff',
            }
          }
        }
      }
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          height: 8,
          padding: '15px 0',
        },
        thumb: {
          backgroundColor: '#e0e0e0',
          '&:focus, &:hover, &.Mui-active': {
            boxShadow: '0 0 0 8px rgba(160, 160, 160, 0.16)',
          }
        },
        track: {
          backgroundColor: 'rgba(160, 160, 160, 0.7)',
          border: 'none',
        },
        rail: {
          backgroundColor: 'rgba(160, 160, 160, 0.3)',
        },
        mark: {
          backgroundColor: 'rgba(160, 160, 160, 0.5)',
        },
        markLabel: {
          color: 'rgba(224, 224, 224, 0.7)',
        },
      }
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.6rem',
      fontWeight: 500,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontSize: '1.3rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.1rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.7,
      letterSpacing: '0.01em',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.7,
      letterSpacing: '0.01em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
    caption: {
      letterSpacing: '0.02em',
    },
    subtitle1: {
      letterSpacing: '0.01em',
      lineHeight: 1.5,
    },
    subtitle2: {
      letterSpacing: '0.01em',
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 4,
  },
});

export default theme;
