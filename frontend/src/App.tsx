// src/App.tsx
import React, { useEffect } from 'react';
import {
  CssBaseline,
  ThemeProvider,
  createTheme,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Container
} from '@mui/material';
import { MetricsDashboard } from './components/MetricsDashboard';
import LiveTraffic from './pages/LiveTraffic';
import { networkApi } from './api/networkApi';
import { useNetworkStore } from './store/networkStore';

const darkTheme = createTheme({ palette: { mode: 'dark' } });

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = React.useState(0);
  const setPackets = useNetworkStore(s => s.setPackets);
  const setMetrics = useNetworkStore(s => s.setMetrics);

  useEffect(() => {
    const ws = networkApi.connectWebSocket(({ packets, metrics }) => {
      setPackets(packets);
      setMetrics(metrics);
    });
    return () => {
      ws?.close();
    };
  }, [setPackets, setMetrics]);

  return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6">Network Traffic Optimization System</Typography>
            </Toolbar>
          </AppBar>
          <Tabs
              value={currentTab}
              onChange={(_, v) => setCurrentTab(v)}
              textColor="inherit"
              indicatorColor="secondary"
          >
            <Tab label="Metrics Dashboard" />
            <Tab label="Live Traffic" />
          </Tabs>
          <Container maxWidth="xl" sx={{ mt: 3 }}>
            {currentTab === 0 && <MetricsDashboard />}
            {currentTab === 1 && <LiveTraffic />}
          </Container>
        </Box>
      </ThemeProvider>
  );
};
 export default App;