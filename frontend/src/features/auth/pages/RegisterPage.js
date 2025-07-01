import React from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';

const RegisterPage = () => {
  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Registro de Usuario
      </Typography>
      <Box component="form" sx={{ mt: 2 }}>
        <TextField
          label="Nombre completo"
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Email"
          type="email"
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Contraseña"
          type="password"
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Confirmar contraseña"
          type="password"
          fullWidth
          margin="normal"
          required
        />
        <Button
          type="submit"
          variant="contained"
          fullWidth
          sx={{ mt: 3 }}
        >
          Registrarse
        </Button>
      </Box>
    </Box>
  );
};

export default RegisterPage;