import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1b4d3e',
    },
    secondary: {
      main: '#b45309',
    },
    background: {
      default: '#f3efe6',
      paper: '#fffdf8',
    },
    text: {
      primary: '#1c1917',
      secondary: '#57534e',
    },
  },
  typography: {
    fontFamily: '"Source Sans 3", "Segoe UI", sans-serif',
    h1: {
      fontFamily: '"Source Serif 4", Georgia, serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: '"Source Serif 4", Georgia, serif',
      fontWeight: 700,
    },
    h3: {
      fontFamily: '"Source Serif 4", Georgia, serif',
      fontWeight: 600,
    },
    h4: {
      fontFamily: '"Source Serif 4", Georgia, serif',
      fontWeight: 600,
    },
    h5: {
      fontFamily: '"Source Serif 4", Georgia, serif',
      fontWeight: 600,
    },
    h6: {
      fontFamily: '"Source Serif 4", Georgia, serif',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 2,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

export default theme;
