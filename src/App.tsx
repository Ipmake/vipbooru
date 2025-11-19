import {
  ThemeProvider,
  CssBaseline,
} from '@mui/material';
import theme from './theme';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import SearchPage from './pages/SearchPage';

function App() {
  // const muiTheme = useTheme();
  // const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/search?tags=rating%3Ageneral" replace />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/search/:postId" element={<SearchPage />} />
          <Route path="/search/*" element={<SearchPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
