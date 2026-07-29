import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import MenuIcon from '@mui/icons-material/Menu';
import SaveIcon from '@mui/icons-material/Save';
import LoginButton from './LoginButton.jsx';
import { logout, deleteAccount, updateProfile } from '../store/authSlice.js';
import { changeLanguage } from '../i18n/index.js';

class AppBarNav extends Component {
  state = {
    navAnchor: null,
    menuAnchor: null,
    loginAnchor: null,
    displayName: '',
    hideAvatar: false,
    settingsSaving: false,
    settingsError: null,
    confirmName: '',
    deleting: false,
    deleteError: null,
  };

  openNav = (event) => {
    this.setState({ navAnchor: event.currentTarget });
  };

  closeNav = () => {
    this.setState({ navAnchor: null });
  };

  openLogin = (event) => {
    this.setState({ loginAnchor: event.currentTarget });
  };

  closeLogin = () => {
    this.setState({ loginAnchor: null });
  };

  openMenu = (event) => {
    const { user } = this.props;
    this.setState({
      menuAnchor: event.currentTarget,
      displayName: user?.name || '',
      hideAvatar: !!user?.hideAvatar,
      settingsError: null,
      confirmName: '',
      deleteError: null,
    });
  };

  closeMenu = () => {
    if (this.state.deleting || this.state.settingsSaving) return;
    this.setState({ menuAnchor: null, confirmName: '', deleteError: null });
  };

  handleLogout = () => {
    this.closeMenu();
    this.props.logout();
  };

  handleLanguage = (_event, lang) => {
    if (lang) changeLanguage(lang);
  };

  handleHideAvatarChange = async (event) => {
    const { t } = this.props;
    const hideAvatar = event.target.checked;
    const previous = !!this.props.user?.hideAvatar;
    this.setState({ hideAvatar, settingsError: null });
    try {
      await this.props.updateProfile({ hideAvatar }).unwrap();
    } catch (err) {
      this.setState({
        hideAvatar: previous,
        settingsError: err.message || t('account.updateAvatarFailed'),
      });
    }
  };

  handleSaveDisplayName = async () => {
    const { t } = this.props;
    const name = this.state.displayName.trim();
    if (!name) {
      this.setState({ settingsError: t('account.nameRequired') });
      return;
    }
    if (name === this.props.user?.name) return;
    this.setState({ settingsSaving: true, settingsError: null });
    try {
      await this.props.updateProfile({ name }).unwrap();
      this.setState({
        settingsSaving: false,
        displayName: name,
        confirmName: '',
      });
    } catch (err) {
      this.setState({
        settingsSaving: false,
        settingsError: err.message || t('account.updateNameFailed'),
      });
    }
  };

  handleDeleteAccount = async () => {
    const { user, deleteAccount, t } = this.props;
    const { confirmName } = this.state;
    if (!user || confirmName.trim() !== user.name) {
      this.setState({ deleteError: t('account.confirmNameMismatch') });
      return;
    }
    this.setState({ deleting: true, deleteError: null });
    try {
      await deleteAccount().unwrap();
      this.setState({
        menuAnchor: null,
        confirmName: '',
        deleting: false,
      });
    } catch (err) {
      this.setState({
        deleting: false,
        deleteError: err.message || t('account.deleteFailed'),
      });
    }
  };

  render() {
    const { user, t, i18n } = this.props;
    const {
      navAnchor,
      menuAnchor,
      loginAnchor,
      displayName,
      hideAvatar,
      settingsSaving,
      settingsError,
      confirmName,
      deleting,
      deleteError,
    } = this.state;
    const menuOpen = Boolean(menuAnchor);
    const navOpen = Boolean(navAnchor);
    const loginOpen = Boolean(loginAnchor);
    const avatarSrc = user && !user.hideAvatar ? user.picture || undefined : undefined;
    const nameDirty = displayName.trim() !== (user?.name || '');
    const canSaveName = nameDirty && displayName.trim().length > 0 && !settingsSaving;
    const lang = (i18n.language || 'en').startsWith('de') ? 'de' : 'en';

    const langSwitch = (
      <ToggleButtonGroup
        size="small"
        exclusive
        value={lang}
        onChange={this.handleLanguage}
        aria-label={t('nav.language')}
        sx={{
          flexShrink: 0,
          '& .MuiToggleButton-root': {
            color: 'rgba(255,255,255,0.75)',
            borderColor: 'rgba(255,255,255,0.28)',
            px: 1,
            py: 0.25,
            fontSize: '0.75rem',
            lineHeight: 1.4,
            '&.Mui-selected': {
              color: '#fffdf8',
              bgcolor: 'rgba(255,255,255,0.16)',
              borderColor: 'rgba(255,255,255,0.4)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' },
            },
          },
        }}
      >
        <ToggleButton value="en">{t('nav.langEn')}</ToggleButton>
        <ToggleButton value="de">{t('nav.langDe')}</ToggleButton>
      </ToggleButtonGroup>
    );

    return (
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'rgba(27, 77, 62, 0.95)',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <Toolbar
          sx={{
            gap: { xs: 0.5, sm: 1.5 },
            minHeight: { xs: 56, sm: 64 },
            px: { xs: 1, sm: 2 },
            overflow: 'hidden',
          }}
        >
          <IconButton
            color="inherit"
            aria-label={t('nav.openNav')}
            onClick={this.openNav}
            sx={{ display: { xs: 'inline-flex', sm: 'none' }, flexShrink: 0 }}
          >
            <MenuIcon />
          </IconButton>
          <Menu
            anchorEl={navAnchor}
            open={navOpen}
            onClose={this.closeNav}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          >
            <MenuItem component={RouterLink} to="/" onClick={this.closeNav}>
              {t('nav.forums')}
            </MenuItem>
            <MenuItem component={RouterLink} to="/starred" onClick={this.closeNav}>
              {t('nav.starred')}
            </MenuItem>
            {user?.isAdmin && (
              <MenuItem component={RouterLink} to="/admin/sections" onClick={this.closeNav}>
                {t('nav.admin')}
              </MenuItem>
            )}
          </Menu>

          <Typography
            component={RouterLink}
            to="/"
            variant="h5"
            sx={{
              color: '#fffdf8',
              textDecoration: 'none',
              fontFamily: '"Source Serif 4", Georgia, serif',
              letterSpacing: '0.02em',
              flexGrow: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: { xs: '1.15rem', sm: '1.5rem' },
            }}
          >
            {t('brand')}
          </Typography>

          <Box
            sx={{
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              gap: 0.5,
              flexShrink: 0,
            }}
          >
            <Button color="inherit" component={RouterLink} to="/">
              {t('nav.forums')}
            </Button>
            <Button color="inherit" component={RouterLink} to="/starred">
              {t('nav.starred')}
            </Button>
            {user?.isAdmin && (
              <Button color="inherit" component={RouterLink} to="/admin/sections">
                {t('nav.admin')}
              </Button>
            )}
          </Box>

          {langSwitch}

          {user ? (
            <>
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}
                onClick={this.openMenu}
              >
                <IconButton size="small" sx={{ p: 0 }} aria-label={t('account.menu')}>
                  <Avatar src={avatarSrc} sx={{ width: 32, height: 32 }}>
                    {user.name?.[0]}
                  </Avatar>
                </IconButton>
                <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                  <Typography variant="body2" color="inherit" noWrap>
                    {user.name}
                  </Typography>
                </Box>
              </Stack>
              <Popover
                open={menuOpen}
                anchorEl={menuAnchor}
                onClose={this.closeMenu}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{
                  paper: {
                    sx: { p: 2, width: 320, maxWidth: 'calc(100vw - 32px)' },
                  },
                }}
              >
                <Typography variant="subtitle1" fontWeight={600}>
                  {user.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  {user.email}
                </Typography>
                <Button fullWidth variant="outlined" onClick={this.handleLogout} sx={{ mb: 2 }}>
                  {t('account.logOut')}
                </Button>

                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  {t('account.settings')}
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  label={t('account.displayName')}
                  value={displayName}
                  onChange={(e) =>
                    this.setState({
                      displayName: e.target.value,
                      settingsError: null,
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && canSaveName) {
                      e.preventDefault();
                      this.handleSaveDisplayName();
                    }
                  }}
                  disabled={settingsSaving}
                  sx={{ mb: 1 }}
                  slotProps={{
                    input: {
                      endAdornment: nameDirty ? (
                        <InputAdornment position="end">
                          <IconButton
                            edge="end"
                            size="small"
                            aria-label={t('account.saveDisplayName')}
                            onClick={this.handleSaveDisplayName}
                            disabled={!canSaveName}
                          >
                            <SaveIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ) : null,
                    },
                  }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={hideAvatar}
                      onChange={this.handleHideAvatarChange}
                      disabled={settingsSaving}
                    />
                  }
                  label={t('account.hideAvatar')}
                  sx={{ mb: 1 }}
                />
                {settingsError && (
                  <Alert severity="error" sx={{ mb: 1 }}>
                    {settingsError}
                  </Alert>
                )}

                <Divider sx={{ mb: 2, mt: 1 }} />
                <Typography variant="subtitle2" color="error" gutterBottom>
                  {t('account.deleteAccount')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  {t('account.deleteAccountBody', { name: user.name })}
                </Typography>
                {deleteError && (
                  <Alert severity="error" sx={{ mb: 1.5 }}>
                    {deleteError}
                  </Alert>
                )}
                <TextField
                  fullWidth
                  size="small"
                  label={t('account.confirmDisplayName')}
                  value={confirmName}
                  onChange={(e) => this.setState({ confirmName: e.target.value })}
                  disabled={deleting}
                  sx={{ mb: 1.5 }}
                />
                <Button
                  fullWidth
                  color="error"
                  variant="contained"
                  onClick={this.handleDeleteAccount}
                  disabled={deleting || confirmName.trim() !== user.name}
                >
                  {deleting ? t('account.deleting') : t('account.deleteMyAccount')}
                </Button>
              </Popover>
            </>
          ) : (
            <>
              <Button
                color="inherit"
                onClick={this.openLogin}
                sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
              >
                {t('nav.signIn')}
              </Button>
              <Popover
                open={loginOpen}
                anchorEl={loginAnchor}
                onClose={this.closeLogin}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{
                  paper: {
                    sx: { p: 2 },
                  },
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  {t('nav.signInHint')}
                </Typography>
                <LoginButton />
              </Popover>
            </>
          )}
        </Toolbar>
      </AppBar>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.auth.user,
});

const mapDispatchToProps = { logout, deleteAccount, updateProfile };

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(AppBarNav));
