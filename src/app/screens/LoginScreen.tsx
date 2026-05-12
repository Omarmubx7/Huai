import { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Alert,
  CircularProgress,
  Divider,
  Link,
} from '@mui/material';
import { Lock, Email, Person } from '@mui/icons-material';
import { motion } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';

const MotionPaper = motion.create(Paper);

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Basic client-side validation
    if (!email.trim() || !password.trim()) {
      setError('يرجى ملء جميع الحقول');
      return;
    }
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const result = await signIn(email.trim(), password);
        if (result.error) setError(result.error);
      } else {
        if (!displayName.trim()) {
          setError('يرجى إدخال اسمك');
          setLoading(false);
          return;
        }
        const result = await signUp(email.trim(), password, displayName.trim());
        if (result.error) {
          setError(result.error);
        } else {
          setSuccess('تم إنشاء الحساب بنجاح! يمكنك الدخول الآن.');
          setMode('login');
        }
      }
    } catch {
      setError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f2027 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 3 },
      }}
    >
      <Container maxWidth="xs">
        <MotionPaper
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          elevation={24}
          sx={{
            p: { xs: 3, sm: 4 },
            backgroundColor: 'rgba(30, 41, 59, 0.9)',
            backdropFilter: 'blur(24px)',
            borderRadius: 4,
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              <Avatar
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: 'primary.main',
                  mx: 'auto',
                  mb: 2,
                  fontSize: '2.2rem',
                  boxShadow: '0 0 24px rgba(14,165,233,0.3)',
                }}
              >
                ✚
              </Avatar>
            </motion.div>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              مساعدك الصحي الذكي
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {mode === 'login' ? 'سجّل دخولك للمتابعة' : 'أنشئ حساباً جديداً'}
            </Typography>
          </Box>

          {/* Alerts */}
          {error && (
            <Alert severity="error" sx={{ mb: 2, direction: 'rtl' }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2, direction: 'rtl' }}>
              {success}
            </Alert>
          )}

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {mode === 'register' && (
              <TextField
                fullWidth
                label="الاسم الكريم"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="أدخل اسمك..."
                InputProps={{
                  startAdornment: <Person sx={{ color: 'text.secondary', mr: 1 }} />,
                  sx: { direction: 'rtl' },
                }}
              />
            )}

            <TextField
              fullWidth
              type="email"
              label="البريد الإلكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              dir="ltr"
              InputProps={{
                startAdornment: <Email sx={{ color: 'text.secondary', mr: 1 }} />,
              }}
            />

            <TextField
              fullWidth
              type="password"
              label="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              dir="ltr"
              InputProps={{
                startAdornment: <Lock sx={{ color: 'text.secondary', mr: 1 }} />,
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                boxShadow: '0 4px 16px rgba(14,165,233,0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : mode === 'login' ? (
                'تسجيل الدخول'
              ) : (
                'إنشاء الحساب'
              )}
            </Button>
          </Box>

          {/* Toggle mode */}
          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" color="text.secondary">أو</Typography>
          </Divider>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {mode === 'login' ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}{' '}
              <Link
                component="button"
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError(null);
                  setSuccess(null);
                }}
                sx={{
                  fontWeight: 700,
                  color: 'primary.main',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                {mode === 'login' ? 'أنشئ حساباً' : 'سجّل دخولك'}
              </Link>
            </Typography>
          </Box>

          {/* Medical Disclaimer */}
          <Box
            sx={{
              mt: 3,
              p: 1.5,
              bgcolor: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: 2,
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" color="warning.main" sx={{ fontSize: '0.7rem', lineHeight: 1.6 }}>
              ⚠️ هذا التطبيق للتوعية الصحية فقط ولا يُغني عن استشارة الطبيب المختص.
              لا يُقدّم تشخيصاً طبياً ولا يصف أدوية.
            </Typography>
          </Box>
        </MotionPaper>
      </Container>
    </Box>
  );
}
