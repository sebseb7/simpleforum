import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { starItem, unstarItem } from '../store/starsSlice.js';
import { applyStarOnTopic } from '../store/topicsSlice.js';
import { applyStarOnPost } from '../store/postsSlice.js';

class ForumStarButton extends Component {
  handleToggle = () => {
    const { user, targetType, targetId, starredByMe, starItem, unstarItem } = this.props;
    if (!user) return;
    if (starredByMe) {
      unstarItem({ targetType, targetId }).then((action) => {
        if (action.payload) this.applyLocal(action.payload, false);
      });
    } else {
      starItem({ targetType, targetId }).then((action) => {
        if (action.payload) this.applyLocal(action.payload, true);
      });
    }
  };

  applyLocal = (payload, starredByMe) => {
    const data = {
      targetId: payload.targetId,
      starCount: payload.starCount,
      starredByMe,
    };
    if (payload.targetType === 'topic') {
      this.props.applyStarOnTopic(data);
    } else {
      this.props.applyStarOnPost(data);
    }
  };

  render() {
    const { user, starredByMe, starCount, t } = this.props;
    const label = user
      ? starredByMe
        ? t('star.unstar')
        : t('star.star')
      : t('star.signInToStar');
    return (
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
        <Tooltip title={label}>
          <span>
            <IconButton
              size="small"
              onClick={this.handleToggle}
              disabled={!user}
              color={starredByMe ? 'secondary' : 'default'}
              aria-label={label}
            >
              {starredByMe ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
            </IconButton>
          </span>
        </Tooltip>
        <Typography variant="body2" color="text.secondary">
          {starCount || 0}
        </Typography>
      </Stack>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.auth.user,
});

const mapDispatchToProps = {
  starItem,
  unstarItem,
  applyStarOnTopic,
  applyStarOnPost,
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(ForumStarButton));
