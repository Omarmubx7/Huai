
import { useState } from 'react';
import { supabase } from '../../contexts/AuthContext';
import { Box, Button, TextField, Typography, Alert } from '@mui/material';

export default function CreateAdmin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleCreateAdmin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setMessage('');
    setError('');
    
    // Sign up the user and set 'role: admin' in user_metadata
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'admin'
        }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
    } else {
      setMessage('Admin account created successfully! You can now sign in.');
      setEmail('');
      setPassword('');
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 10, p: 3, border: '1px solid #ccc', borderRadius: 2 }}>
      <Typography variant='h5' mb={2}>Create Admin Account</Typography>
      {message && <Alert severity='success' sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}
      
      <form onSubmit={handleCreateAdmin}>
        <TextField 
          fullWidth 
          label='Admin Email' 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          sx={{ mb: 2 }} 
        />
        <TextField 
          fullWidth 
          label='Password' 
          type='password'
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          sx={{ mb: 2 }} 
        />
        
        <Button variant='contained' fullWidth type="submit">
          Create Admin
        </Button>
      </form>
    </Box>
  );
}
