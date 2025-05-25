import React, { useEffect } from 'react';
import {
  CssBaseline,
  ThemeProvider,
  createTheme,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Tab,
  Tabs,
} from '@mui/material';
import { MetricsDashboard } from './components/MetricsDashboard';
import { QoSConfig } from './components/QoSConfig';
import { useNetworkStore } from './store/networkStore';
import { networkApi } from './api/networkApi';

// Create a dark theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

export const App: React.FC = () => {
  const { setPackets, setMetrics } = useNetworkStore();
  const [currentTab, setCurrentTab] = React.useState(0);

  useEffect(() => {
    // Connect to WebSocket for real-time updates
    const ws = networkApi.connectWebSocket((data) => {
      setPackets(data.packets);
      setMetrics(data.metrics);
    });

    // Cleanup on unmount
    return () => {
      ws.close();
    };
  }, [setPackets, setMetrics]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Network Traffic Optimization System
            </Typography>
          </Toolbar>
        </AppBar>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            aria-label="dashboard tabs"
          >
            <Tab label="Metrics Dashboard" />
          </Tabs>
        </Box>

        <Container maxWidth="xl">
          {currentTab === 0 && <MetricsDashboard />}
        </Container>
      </Box>
    </ThemeProvider>
  );
};
// tea