import React, { Component } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import AppBarNav from './components/AppBarNav.jsx';
import SiteFooter from './components/SiteFooter.jsx';
import ForumMain from './components/ForumMain.jsx';
import ForumSection from './components/ForumSection.jsx';
import ForumTopic from './components/ForumTopic.jsx';
import AdminSections from './components/AdminSections.jsx';
import StarredPage from './components/StarredPage.jsx';
import PrivacyPolicy from './components/PrivacyPolicy.jsx';

class App extends Component {
  render() {
    return (
      <BrowserRouter>
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background:
              'radial-gradient(ellipse at top left, #e8dfc8 0%, transparent 50%), radial-gradient(ellipse at bottom right, #d4e0d8 0%, transparent 45%), #f3efe6',
          }}
        >
          <AppBarNav />
          <Container maxWidth="md" sx={{ py: 3, flex: 1 }}>
            <Routes>
              <Route path="/" element={<ForumMain />} />
              <Route path="/section/:sectionId" element={<ForumSection />} />
              <Route path="/topic/:topicId" element={<ForumTopic />} />
              <Route path="/admin/sections" element={<AdminSections />} />
              <Route path="/starred" element={<StarredPage />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
            </Routes>
          </Container>
          <SiteFooter />
        </Box>
      </BrowserRouter>
    );
  }
}

export default App;
