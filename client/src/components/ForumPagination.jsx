import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';

class ForumPagination extends Component {
  handleChange = (_event, page) => {
    const { limit, onPageChange } = this.props;
    const offset = (page - 1) * limit;
    onPageChange(offset);
  };

  render() {
    const { total = 0, offset = 0, limit = 20, t } = this.props;
    if (total <= limit) return null;

    const page = Math.floor(offset / limit) + 1;
    const pageCount = Math.max(1, Math.ceil(total / limit));
    const from = total === 0 ? 0 : offset + 1;
    const to = Math.min(offset + limit, total);

    return (
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        sx={{
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          my: 2,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {t('pagination.showing', { from, to, total })}
        </Typography>
        <Pagination
          count={pageCount}
          page={page}
          onChange={this.handleChange}
          color="primary"
          shape="rounded"
          siblingCount={1}
          boundaryCount={1}
        />
      </Stack>
    );
  }
}

export default withTranslation()(ForumPagination);
