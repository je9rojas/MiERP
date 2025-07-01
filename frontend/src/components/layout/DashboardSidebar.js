// src/components/layout/DashboardSidebar.js
import React from 'react';
import { 
  Box,
  Typography,
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider,
  Collapse,
  useTheme,
  styled
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Store as StoreIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: theme.mixins.drawerWidth,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: theme.mixins.drawerWidth,
    boxSizing: 'border-box',
    borderRight: 'none',
    background: theme.palette.background.default,
    boxShadow: theme.shadows[1],
  },
}));

const SidebarHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(3, 2),
  backgroundColor: theme.palette.primary.dark,
  color: theme.palette.primary.contrastText,
}));

const DashboardSidebar = ({ mobileOpen, handleDrawerToggle }) => {
  const theme = useTheme();
  const [openReports, setOpenReports] = React.useState(false);

  const handleReportsClick = () => {
    setOpenReports(!openReports);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon /> },
    { text: 'Usuarios', icon: <PeopleIcon /> },
    { text: 'Productos', icon: <InventoryIcon /> },
    { text: 'Sucursales', icon: <StoreIcon /> },
    { 
      text: 'Reportes', 
      icon: <BarChartIcon />,
      subItems: [
        { text: 'Ventas' },
        { text: 'Inventario' },
        { text: 'Financiero' },
      ]
    },
  ];

  const drawer = (
    <div>
      <SidebarHeader>
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{ 
            width: 60, 
            height: 60, 
            backgroundColor: theme.palette.primary.light, 
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 10px'
          }}>
            <Typography variant="h5" fontWeight="bold">M</Typography>
          </Box>
          <Typography variant="h6" fontWeight="bold">MiERP PRO</Typography>
          <Typography variant="caption">Enterprise Resource Planning</Typography>
        </Box>
      </SidebarHeader>
      
      <List sx={{ p: 2 }}>
        {menuItems.map((item, index) => (
          <React.Fragment key={index}>
            {!item.subItems ? (
              <ListItem 
                button 
                sx={{ 
                  borderRadius: 2,
                  mb: 0.5,
                  '&:hover': { backgroundColor: theme.palette.action.hover },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: theme.palette.primary.main }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Typography variant="body1" fontWeight="medium">
                      {item.text}
                    </Typography>
                  } 
                />
              </ListItem>
            ) : (
              <>
                <ListItem 
                  button 
                  onClick={handleReportsClick}
                  sx={{ 
                    borderRadius: 2,
                    mb: 0.5,
                    '&:hover': { backgroundColor: theme.palette.action.hover },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: theme.palette.primary.main }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Typography variant="body1" fontWeight="medium">
                        {item.text}
                      </Typography>
                    } 
                  />
                  {openReports ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </ListItem>
                <Collapse in={openReports} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding sx={{ pl: 4 }}>
                    {item.subItems.map((subItem, subIndex) => (
                      <ListItem 
                        button 
                        key={subIndex}
                        sx={{ 
                          borderRadius: 2,
                          mb: 0.5,
                          '&:hover': { backgroundColor: theme.palette.action.hover },
                        }}
                      >
                        <ListItemText 
                          primary={
                            <Typography variant="body2">
                              {subItem.text}
                            </Typography>
                          } 
                        />
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </>
            )}
          </React.Fragment>
        ))}
      </List>
      
      <Divider sx={{ mx: 2 }} />
      
      <List sx={{ p: 2, mt: 'auto' }}>
        <ListItem 
          button 
          sx={{ 
            borderRadius: 2,
            mb: 0.5,
            '&:hover': { backgroundColor: theme.palette.action.hover },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: theme.palette.primary.main }}>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText 
            primary={
              <Typography variant="body1" fontWeight="medium">
                Configuración
              </Typography>
            } 
          />
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box 
      component="nav"
      sx={{ 
        width: { sm: theme.mixins.drawerWidth }, 
        flexShrink: { sm: 0 } 
      }}
    >
      <StyledDrawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
        }}
      >
        {drawer}
      </StyledDrawer>
      <StyledDrawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
        }}
        open
      >
        {drawer}
      </StyledDrawer>
    </Box>
  );
};

export default DashboardSidebar;