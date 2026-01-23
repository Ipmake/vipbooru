import {
  ThemeProvider,
  CssBaseline,
} from '@mui/material';
import theme from './theme';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import InfoPage from './pages/InfoPage';
import { OpenPanel } from '@openpanel/web';
import { useEffect } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export const op = new OpenPanel({
  clientId: '23bab4b6-1e09-4d5e-9a54-371067c45d06',
  apiUrl: 'https://inquiry2.ipmake.dev/api',
  trackScreenViews: true,
  trackOutgoingLinks: true,
  trackAttributes: true,
});

function App() {
  // const muiTheme = useTheme();
  // const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  useEffect(() => {
    op.init();

    window.addEventListener('error', (event) => {
      op.track('page_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error ? event.error.toString() : 'null',
      });
    });
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/search?tags=rating%3Ageneral" replace />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/search/:postId" element={<SearchPage />} />
          <Route path="/search/*" element={<SearchPage />} />
          <Route path="/info" element={<InfoPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
