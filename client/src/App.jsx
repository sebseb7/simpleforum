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
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background:
              'radial-gradient(ellipse at top left, #e8dfc8 0%, transparent 50%), radial-gradient(ellipse at bottom right, #d4e0d8 0%, transparent 45%), #f3efe6',
          }}
        >
          <AppBarNav />
          <Box
            component="main"
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              // Overlay-style scrollbar: paints over content, no layout gutter.
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(28, 25, 23, 0.35) transparent',
              '&::-webkit-scrollbar': {
                width: 10,
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(28, 25, 23, 0.35)',
                borderRadius: 8,
                border: '2px solid transparent',
                backgroundClip: 'content-box',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                backgroundColor: 'rgba(28, 25, 23, 0.5)',
              },
            }}
          >
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
        </Box>
      </BrowserRouter>
    );
  }
}

export default App;
