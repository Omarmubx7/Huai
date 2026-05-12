import { useState, useEffect } from "react";
import { usePatient } from "../../contexts/PatientContext";
import { api, Patient } from "../../utils/api";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  Badge,
  Card,
  CardContent,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  InputAdornment,
  Grid,
} from "@mui/material";
import {
  Dashboard,
  People,
  Bloodtype,
  Favorite,
  Notifications,
  Settings,
  Logout,
  Search,
  Add,
  Visibility,
  NotificationAdd,
  Delete,
  Warning,
} from "@mui/icons-material";
import { motion } from "motion/react";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../utils/api";

const drawerWidth = 260;

const MotionCard = motion.create(Card);

export default function AdminDashboard() {
  const { patients: allPatients, refreshPatients } = usePatient();
  const { isAdmin, signOut, user } = useAuth();
  const [activeNav, setActiveNav] = useState("overview");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMigrating, setIsMigrating] = useState(false);
  const [newPatientType, setNewPatientType] = useState<"diabetes" | "hypertension">("diabetes");
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientAge, setNewPatientAge] = useState("");
  const [newPatientReading, setNewPatientReading] = useState("");
  const [stats, setStats] = useState({ totalPatients: 0, diabetesPatients: 0, hypertensionPatients: 0, needsAttention: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, [allPatients]);

  const loadStats = async () => {
    try {
      const data = await api.stats.get();
      if (data) {
        setStats(data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
      // Keep default stats on error
      setStats({ totalPatients: 0, diabetesPatients: 0, hypertensionPatients: 0, needsAttention: 0 });
    }
  };

  const getPatientStatus = (patient: Patient): "normal" | "warning" | "danger" | "none" => {
    if (!patient.lastReading) return "none";
    if (patient.condition === "diabetes") {
      const value = patient.lastReading as number;
      if (value > 180 || value < 70) return "danger";
      if (value > 130) return "warning";
      return "normal";
    } else {
      const reading = patient.lastReading as { systolic: number; diastolic: number };
      if (reading.systolic > 140 || reading.diastolic > 90) return "danger";
      if (reading.systolic > 130 || reading.diastolic > 85) return "warning";
      return "normal";
    }
  };

  const getLastReading = (patient: Patient): string => {
    if (!patient.lastReading) return "—";
    if (patient.condition === "diabetes") {
      return `${patient.lastReading} mg/dL`;
    } else {
      const reading = patient.lastReading as { systolic: number; diastolic: number };
      return `${reading.systolic}/${reading.diastolic} mmHg`;
    }
  };

  const getTimeAgo = (timestamp: string | null): string => {
    if (!timestamp) return "—";
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now.getTime() - time.getTime()) / 1000 / 60);

    if (diff < 1) return "الآن";
    if (diff < 60) return `منذ ${diff} دقيقة`;
    if (diff < 1440) return `منذ ${Math.floor(diff / 60)} ساعة`;
    return `منذ ${Math.floor(diff / 1440)} يوم`;
  };

  const handleAddPatient = async () => {
    if (!newPatientName || !newPatientAge) return;

    setLoading(true);
    try {
      await api.patients.create({
        name: newPatientName,
        age: parseInt(newPatientAge),
        condition: newPatientType,
        medications: newPatientType === "diabetes"
          ? ["ميتفورمين 1000mg", "جليبيزيد 5mg"]
          : ["أملوديبين 5mg", "لوسارتان 50mg"],
        lastReading: newPatientReading ? (newPatientType === "diabetes" ? Number(newPatientReading) : null) : null,
        lastReadingTime: newPatientReading ? new Date().toISOString() : null,
      });

      await refreshPatients();
      setShowAddModal(false);
      setNewPatientName("");
      setNewPatientAge("");
      setNewPatientReading("");
    } catch (error) {
      console.error("Error adding patient:", error);
      alert("حدث خطأ في إضافة المريض");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المريض؟")) return;

    try {
      await api.patients.delete(patientId);
      await refreshPatients();
    } catch (error) {
      console.error("Error deleting patient:", error);
      alert("حدث خطأ في حذف المريض");
    }
  };

  const navItems = [
    { id: "overview", icon: <Dashboard />, label: "نظرة عامة" },
    { id: "patients", icon: <People />, label: "المرضى" },
    { id: "diabetes", icon: <Bloodtype />, label: "مرضى السكري" },
    { id: "hypertension", icon: <Favorite />, label: "مرضى الضغط" },
    { id: "alerts", icon: <Notifications />, label: "التنبيهات" },
    { id: "settings", icon: <Settings />, label: "الإعدادات" },
  ];

  const handleSendAlert = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowAlertModal(true);
  };

  const handleMigrate = async () => {
    setIsMigrating(true);
    try {
      const msg = await api.admin.migrateLegacyData();
      alert(msg);
      await refreshPatients();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsMigrating(false);
    }
  };

  // Admin gate
  if (!isAdmin) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 3 }}>
        <Avatar sx={{ width: 80, height: 80, bgcolor: 'error.main', fontSize: '2.5rem' }}>🔒</Avatar>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>غير مصرح بالدخول</Typography>
        <Typography variant="body2" color="text.secondary">ليس لديك صلاحيات المسؤول. تواصل مع الإدارة.</Typography>
        <Button variant="outlined" onClick={() => window.history.back()}>رجوع</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", height: "100vh", bgcolor: "#0f172a", flexDirection: { xs: "column", md: "row" } }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            bgcolor: "background.paper",
            borderLeft: 1,
            borderColor: "divider",
          },
        }}
        anchor="right"
      >
        <Box sx={{ p: 3, textAlign: "center", borderBottom: 1, borderColor: "divider" }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: "primary.main",
              mx: "auto",
              mb: 1,
              fontSize: "1.5rem",
            }}
          >
            ✚
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            لوحة الإدارة
          </Typography>
          <Typography variant="caption" color="text.secondary">
            مدير النظام
          </Typography>
        </Box>

        <List sx={{ flex: 1, p: 2 }}>
          {navItems.map((item) => (
            <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={activeNav === item.id}
                onClick={() => setActiveNav(item.id)}
                sx={{
                  borderRadius: 2,
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    "&:hover": {
                      bgcolor: "primary.dark",
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ color: activeNav === item.id ? "white" : "text.secondary", minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <Avatar sx={{ bgcolor: "secondary.main", width: 40, height: 40 }}>د.م</Avatar>
            <Typography variant="body2">د. محمد أحمد</Typography>
          </Box>
          <Button
            fullWidth
            variant="outlined"
            color="error"
            startIcon={<Logout />}
            onClick={signOut}
            sx={{ justifyContent: "flex-start" }}
          >
            تسجيل الخروج
          </Button>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, overflow: "auto", width: { xs: "100%", md: "auto" } }}>
        {/* App Bar */}
        <AppBar position="static" elevation={0} sx={{ bgcolor: "background.paper", borderBottom: 1, borderColor: "divider" }}>
          <Toolbar sx={{ flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "flex-start", sm: "center" }, py: { xs: 2, sm: 0 } }}>
            <Box sx={{ flex: 1, width: { xs: "100%", sm: "auto" } }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
                مساء الخير، د. محمد 👋
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                الثلاثاء، 12 مايو 2026
              </Typography>
            </Box>
            <IconButton color="inherit">
              <Badge badgeContent={3} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Stats Overview */}
          <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 3, sm: 4 } }}>
            <Grid item size={{ xs: 6, sm: 6, md: 3 }}>
              <MotionCard whileHover={{ scale: 1.02 }} sx={{ borderRight: 4, borderColor: "primary.main" }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: { xs: 1, sm: 2 } }}>
                    <People sx={{ fontSize: { xs: 28, sm: 40 }, color: "text.secondary" }} />
                    <Typography variant="h3" sx={{ fontWeight: 700, color: "primary.main", fontSize: { xs: "1.75rem", sm: "3rem" } }}>
                      {stats?.totalPatients ?? 0}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.7rem", sm: "0.875rem" } }}>
                    إجمالي المرضى
                  </Typography>
                </CardContent>
              </MotionCard>
            </Grid>

            <Grid item size={{ xs: 6, sm: 6, md: 3 }}>
              <MotionCard whileHover={{ scale: 1.02 }} sx={{ borderRight: 4, borderColor: "secondary.main" }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: { xs: 1, sm: 2 } }}>
                    <Bloodtype sx={{ fontSize: { xs: 28, sm: 40 }, color: "text.secondary" }} />
                    <Typography variant="h3" sx={{ fontWeight: 700, color: "secondary.main", fontSize: { xs: "1.75rem", sm: "3rem" } }}>
                      {stats?.diabetesPatients ?? 0}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.7rem", sm: "0.875rem" } }}>
                    مرضى السكري
                  </Typography>
                </CardContent>
              </MotionCard>
            </Grid>

            <Grid item size={{ xs: 6, sm: 6, md: 3 }}>
              <MotionCard whileHover={{ scale: 1.02 }} sx={{ borderRight: 4, borderColor: "error.main" }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: { xs: 1, sm: 2 } }}>
                    <Favorite sx={{ fontSize: { xs: 28, sm: 40 }, color: "text.secondary" }} />
                    <Typography variant="h3" sx={{ fontWeight: 700, color: "error.main", fontSize: { xs: "1.75rem", sm: "3rem" } }}>
                      {stats?.hypertensionPatients ?? 0}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.7rem", sm: "0.875rem" } }}>
                    مرضى الضغط
                  </Typography>
                </CardContent>
              </MotionCard>
            </Grid>

            <Grid item size={{ xs: 6, sm: 6, md: 3 }}>
              <MotionCard whileHover={{ scale: 1.02 }} sx={{ borderRight: 4, borderColor: "warning.main" }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: { xs: 1, sm: 2 } }}>
                    <Warning sx={{ fontSize: { xs: 28, sm: 40 }, color: "text.secondary" }} />
                    <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1 } }}>
                      <Typography variant="h3" sx={{ fontWeight: 700, color: "warning.main", fontSize: { xs: "1.75rem", sm: "3rem" } }}>
                        {stats?.needsAttention ?? 0}
                      </Typography>
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                        <Box sx={{ width: { xs: 8, sm: 10 }, height: { xs: 8, sm: 10 }, bgcolor: "error.main", borderRadius: "50%" }} />
                      </motion.div>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.7rem", sm: "0.875rem" } }}>
                    يحتاجون متابعة
                  </Typography>
                </CardContent>
              </MotionCard>
            </Grid>
          </Grid>

          {/* Alerts Section */}
          <Box sx={{ mb: { xs: 3, sm: 4 } }}>
            <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1, fontSize: { xs: "1rem", sm: "1.25rem" } }}>
              <Warning color="error" sx={{ fontSize: { xs: 20, sm: 24 } }} />
              تنبيهات تحتاج انتباه فوري
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {allPatients
                .filter(p => {
                  const status = getPatientStatus(p);
                  return status === "danger" || status === "warning";
                })
                .slice(0, 5)
                .map((patient) => {
                  const status = getPatientStatus(patient);
                  return (
                    <Alert
                      key={patient.id}
                      severity={status === "danger" ? "error" : "warning"}
                      action={
                        <Button color="inherit" size="small" onClick={() => handleSendAlert(patient)}>
                          إرسال تنبيه
                        </Button>
                      }
                      icon={patient.condition === "diabetes" ? <Bloodtype /> : <Favorite />}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {patient.name} — {patient.condition === "diabetes" ? "سكر" : "ضغط"}: {getLastReading(patient)}{" "}
                        {status === "danger" ? "🔴" : "⚠️"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getTimeAgo(patient.lastReadingTime)}
                      </Typography>
                    </Alert>
                  );
                })}
              {allPatients.filter(p => {
                const status = getPatientStatus(p);
                return status === "danger" || status === "warning";
              }).length === 0 && (
                <Alert severity="success">
                  <Typography variant="body2">
                    ✅ لا توجد حالات تحتاج انتباه فوري
                  </Typography>
                </Alert>
              )}
            </Box>
          </Box>

          {/* Patients Table */}
          <Box>
            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" }, mb: 2, gap: { xs: 2, sm: 0 } }}>
              <Typography variant="h6" sx={{ fontSize: { xs: "1.125rem", sm: "1.25rem" } }}>جميع المرضى</Typography>
              <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
                <Button 
                  variant="outlined" 
                  color="warning" 
                  onClick={handleMigrate}
                  disabled={isMigrating}
                >
                  {isMigrating ? "جاري..." : "استرجاع القديم"}
                </Button>
                <TextField
                  size="small"
                  placeholder="ابحث عن مريض..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                    sx: { direction: "rtl" },
                  }}
                  sx={{ width: { xs: "100%", sm: 250 } }}
                />
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setShowAddModal(true)}
                  fullWidth={true}
                  sx={{ display: { xs: "flex", sm: "inline-flex" } }}
                >
                  إضافة مريض
                </Button>
              </Box>
            </Box>

            <TableContainer component={Paper} sx={{ bgcolor: "rgba(255, 255, 255, 0.02)", overflowX: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell align="right">الاسم</TableCell>
                    <TableCell align="right">النوع</TableCell>
                    <TableCell align="right">آخر قراءة</TableCell>
                    <TableCell align="right">الحالة</TableCell>
                    <TableCell align="right">آخر تسجيل</TableCell>
                    <TableCell align="right">إجراءات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allPatients
                    .filter((patient) =>
                      searchQuery === "" || patient.name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((patient) => {
                      const status = getPatientStatus(patient);
                      return (
                        <TableRow key={patient.id} hover>
                          <TableCell align="right">{patient.name}</TableCell>
                          <TableCell align="right">
                            <Chip
                              icon={patient.condition === "diabetes" ? <Bloodtype /> : <Favorite />}
                              label={patient.condition === "diabetes" ? "سكري" : "ضغط"}
                              size="small"
                              color={patient.condition === "diabetes" ? "warning" : "error"}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">{getLastReading(patient)}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={
                                status === "normal"
                                  ? "✅ طبيعي"
                                  : status === "warning"
                                  ? "⚠️ مرتفع"
                                  : status === "danger"
                                  ? "🔴 مرتفع جداً"
                                  : "⚠️ لا يوجد"
                              }
                              size="small"
                              color={
                                status === "normal"
                                  ? "success"
                                  : status === "warning"
                                  ? "warning"
                                  : status === "danger"
                                  ? "error"
                                  : "default"
                              }
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">
                              {getTimeAgo(patient.lastReadingTime)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <IconButton size="small" color="primary">
                                <Visibility fontSize="small" />
                              </IconButton>
                              <IconButton size="small" color="warning" onClick={() => handleSendAlert(patient)}>
                                <NotificationAdd fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeletePatient(patient.id)}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      </Box>

      {/* Add Patient Dialog */}
      <Dialog open={showAddModal} onClose={() => setShowAddModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>إضافة مريض جديد</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}>
            <TextField
              fullWidth
              label="الاسم الكريم"
              variant="outlined"
              value={newPatientName}
              onChange={(e) => setNewPatientName(e.target.value)}
              InputProps={{ sx: { direction: "rtl" } }}
            />

            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                نوع الحالة
              </Typography>
              <ToggleButtonGroup
                value={newPatientType}
                exclusive
                onChange={(_, value) => value && setNewPatientType(value)}
                fullWidth
              >
                <ToggleButton value="diabetes" sx={{ gap: 1 }}>
                  <Bloodtype />
                  سكري
                </ToggleButton>
                <ToggleButton value="hypertension" sx={{ gap: 1 }}>
                  <Favorite />
                  ضغط
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <TextField
              fullWidth
              type="number"
              label="العمر"
              variant="outlined"
              value={newPatientAge}
              onChange={(e) => setNewPatientAge(e.target.value)}
            />
            <TextField
              fullWidth
              label={newPatientType === "diabetes" ? "آخر قراءة (mg/dL)" : "آخر قراءة (Systolic)"}
              variant="outlined"
              value={newPatientReading}
              onChange={(e) => setNewPatientReading(e.target.value)}
              placeholder={newPatientType === "diabetes" ? "مثال: 120" : "مثال: 120"}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddModal(false)} disabled={loading}>
            إلغاء
          </Button>
          <Button
            variant="contained"
            onClick={handleAddPatient}
            disabled={!newPatientName || !newPatientAge || loading}
          >
            {loading ? "جاري الإضافة..." : "إضافة المريض"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Alert Dialog */}
      <Dialog open={showAlertModal} onClose={() => setShowAlertModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <NotificationAdd />
            إرسال تنبيه
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
            {selectedPatient && (
              <Box>
                <Chip
                  label={selectedPatient.name}
                  icon={selectedPatient.condition === "diabetes" ? <Bloodtype /> : <Favorite />}
                  color={selectedPatient.condition === "diabetes" ? "warning" : "error"}
                  sx={{ width: "fit-content" }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {selectedPatient.condition === "diabetes" ? "مريض سكري" : "مريض ضغط"} • آخر قراءة: {getLastReading(selectedPatient)}
                </Typography>
              </Box>
            )}
            <TextField
              fullWidth
              multiline
              rows={4}
              label="رسالة التنبيه"
              placeholder="اكتب رسالة التنبيه للمريض..."
              variant="outlined"
              InputProps={{ sx: { direction: "rtl" } }}
            />
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip label="قراءتك مرتفعة، راجع الطبيب" size="small" variant="outlined" clickable />
              <Chip label="تذكير بالدواء" size="small" variant="outlined" clickable />
              <Chip label="موعد متابعة" size="small" variant="outlined" clickable />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAlertModal(false)}>إلغاء</Button>
          <Button variant="contained" startIcon={<NotificationAdd />} onClick={() => setShowAlertModal(false)}>
            إرسال التنبيه
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
