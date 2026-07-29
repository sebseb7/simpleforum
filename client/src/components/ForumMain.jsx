import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Link from '@mui/material/Link';
import PushPinIcon from '@mui/icons-material/PushPin';
import StarIcon from '@mui/icons-material/Star';
import { fetchSections } from '../store/sectionsSlice.js';
import DocumentMeta from './DocumentMeta.jsx';
import ForumHtmlBody from './ForumHtmlBody.jsx';
import { formatForumDate } from '../i18n/formatDate.js';
import { normalizeLang } from '../i18n/index.js';

function uiLang(i18n) {
  return normalizeLang(i18n.language);
}

function HighlightLinks({ items, icon }) {
  if (!items?.length) return null;
  return (
    <Stack spacing={0.5} sx={{ pl: 0.5 }}>
      {items.map((topic) => (
        <Stack
          key={topic.id}
          direction="row"
          spacing={1}
          component={RouterLink}
          to={`/topic/${topic.slug}`}
          sx={{
            alignItems: 'center',
            textDecoration: 'none',
            color: 'text.primary',
            py: 0.25,
            px: 1,
            borderRadius: 1,
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          {icon}
          <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }}>
            {topic.title}
          </Typography>
          {topic.starCount > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
              ★ {topic.starCount}
            </Typography>
          )}
        </Stack>
      ))}
    </Stack>
  );
}

function TopicEmbed({ topic, t, pinned = false }) {
  const replyCount = topic.postCount || 0;
  const isRoot = !!topic.isRoot;
  const titleNode = (
    <Typography
      component={pinned ? 'h3' : 'h1'}
      variant={pinned ? 'subtitle1' : 'h3'}
      noWrap={pinned}
      gutterBottom={!pinned && isRoot}
    >
      {topic.title}
    </Typography>
  );

  return (
    <Box sx={{ mt: pinned ? 1 : 0, mb: pinned ? 0 : 3 }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', mb: 1, px: pinned ? 0.5 : 0 }}
      >
        {pinned && (
          <PushPinIcon sx={{ fontSize: 16, color: 'primary.main', flexShrink: 0 }} />
        )}
        {isRoot || !topic.slug ? (
          titleNode
        ) : (
          <Link
            component={RouterLink}
            to={`/topic/${topic.slug}`}
            underline="hover"
            color="inherit"
            sx={{ flex: 1, minWidth: 0 }}
          >
            {titleNode}
          </Link>
        )}
        {topic.isClosed && <Chip size="small" label={t('topic.closed')} />}
      </Stack>

      {!isRoot && topic.authorName && (
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', mb: 1, px: pinned ? 0.5 : 0 }}
        >
          <Avatar src={topic.authorPicture || undefined} sx={{ width: 24, height: 24 }}>
            {topic.authorName?.[0]}
          </Avatar>
          <Typography variant="caption" color="text.secondary">
            {t('topic.authorMeta', {
              name: topic.authorName,
              date: formatForumDate(topic.createdAt || topic.updatedAt),
            })}
          </Typography>
        </Stack>
      )}

      {topic.bodyHtml ? (
        isRoot ? (
          <ForumHtmlBody
            html={topic.bodyHtml}
            sx={{
              color: 'text.secondary',
              maxWidth: 520,
              '& p:last-child': { mb: 0 },
            }}
          />
        ) : (
          <Paper variant="outlined" sx={{ p: 2, mb: 1, bgcolor: 'background.paper' }}>
            <ForumHtmlBody html={topic.bodyHtml} />
          </Paper>
        )
      ) : null}

      {!isRoot && (
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: 'center', px: pinned ? 0.5 : 0, flexWrap: 'wrap' }}
        >
          {replyCount > 0 && (
            <Typography variant="body2" color="text.secondary">
              {t('home.replyCount', { count: replyCount })}
            </Typography>
          )}
          {topic.slug && (
            <Link
              component={RouterLink}
              to={`/topic/${topic.slug}`}
              underline="hover"
              variant="body2"
            >
              {t('home.openTopic')}
            </Link>
          )}
        </Stack>
      )}
    </Box>
  );
}

class ForumMain extends Component {
  componentDidMount() {
    if (
      this.props.status === 'succeeded' &&
      this.props.listMode?.lang === uiLang(this.props.i18n)
    ) {
      return;
    }
    this.load();
  }

  componentDidUpdate(prevProps) {
    if (uiLang(prevProps.i18n) !== uiLang(this.props.i18n)) {
      this.load();
    }
  }

  load = () => {
    this.props.fetchSections({ lang: uiLang(this.props.i18n) });
  };

  render() {
    const { sections, status, error, welcomeTopic, t } = this.props;
    const metaDescription =
      (welcomeTopic?.bodyHtml || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 300) ||
      welcomeTopic?.title ||
      '';

    return (
      <Box>
        <DocumentMeta
          title={welcomeTopic?.title || undefined}
          description={metaDescription}
        />
        {welcomeTopic && <TopicEmbed topic={welcomeTopic} t={t} />}

        {error && <Alert severity="error">{error}</Alert>}

        <List disablePadding sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          {sections.map((section, index) => {
            const pinned = section.highlights?.pinned || [];
            const topStarred = section.highlights?.topStarred || [];
            const hasHighlights = pinned.length > 0 || topStarred.length > 0;
            return (
              <ListItem
                key={section.id}
                disablePadding
                divider={index < sections.length - 1}
                sx={{ display: 'block' }}
              >
                <ListItemButton
                  component={RouterLink}
                  to={`/section/${section.slug}`}
                  sx={{ py: 2, alignItems: 'flex-start' }}
                >
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <Typography component="h2" variant="h6">{section.title}</Typography>
                        {section.adminOnlyTopics && (
                          <Chip size="small" label={t('home.adminTopics')} variant="outlined" />
                        )}
                      </Stack>
                    }
                    secondary={
                      <>
                        {section.description}
                        <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                          {t('home.topicCount', { count: section.topicCount })}
                        </Box>
                      </>
                    }
                    slotProps={{
                      secondary: { component: 'div' },
                    }}
                  />
                </ListItemButton>
                {hasHighlights && (
                  <Box sx={{ px: 2, pb: 2, pt: 0 }}>
                    {pinned.length > 0 && (
                      <Box sx={{ mb: topStarred.length ? 2 : 0 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5, fontWeight: 600 }}>
                          {t('home.pinnedTopics')}
                        </Typography>
                        {pinned.map((topic) => (
                          <TopicEmbed key={topic.id} topic={topic} t={t} pinned />
                        ))}
                      </Box>
                    )}
                    {topStarred.length > 0 && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ pl: 1, fontWeight: 600 }}>
                          {t('home.topStarred')}
                        </Typography>
                        <HighlightLinks
                          items={topStarred}
                          icon={<StarIcon sx={{ fontSize: 16, color: 'warning.main', flexShrink: 0 }} />}
                        />
                      </Box>
                    )}
                  </Box>
                )}
              </ListItem>
            );
          })}
          {status === 'succeeded' && sections.length === 0 && (
            <ListItem sx={{ py: 3 }}>
              <ListItemText
                primary={t('home.noSections')}
                slotProps={{ primary: { color: 'text.secondary' } }}
              />
            </ListItem>
          )}
        </List>
      </Box>
    );
  }
}

const mapStateToProps = (state) => ({
  sections: state.sections.items,
  welcomeTopic: state.sections.welcomeTopic,
  status: state.sections.status,
  listMode: state.sections.listMode,
  error: state.sections.error,
});

const mapDispatchToProps = { fetchSections };

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(ForumMain));
