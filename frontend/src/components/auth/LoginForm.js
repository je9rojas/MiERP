import React from 'react';

const LoginForm = () => {
  return (
    <form>
      <input type="text" placeholder="Usuario" />
      <input type="password" placeholder="Contraseña" />
      <button type="submit">Ingresar</button>
    </form>
  );
};

export default LoginForm;