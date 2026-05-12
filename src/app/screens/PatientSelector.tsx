import { useNavigate } from "react-router";
import {
  Box,
  Container,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  Avatar,
  Chip,
  Button,
  Paper,
  Grid,
  CircularProgress,
} from "@mui/material";
import { Add, Lock, Bloodtype, Favorite } from "@mui/icons-material";
import { motion } from "motion/react";
import { usePatient } from "../../contexts/PatientContext";
import { Patient } from "../../utils/api";

const MotionCard = motion.create(Card);

export default function PatientSelector() {
  const navigate = useNavigate();
  const { patients, setCurrentPatient, loading } = usePatient();

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}.${parts[1][0]}`;
    }
    return name.substring(0, 2);
  };

  const getLastReading = (patient: Patient) => {
    if (!patient.lastReading) return "لا يوجد";
    if (patient.condition === "diabetes") {
      return `${patient.lastReading} mg/dL`;
    } else {
      return `${patient.lastReading.systolic}/${patient.lastReading.diastolic} mmHg`;
    }
  };

  const getColor = (condition: string) => {
    return condition === "diabetes"
      ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
      : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";
  };

  const handlePatientSelect = (patient: Patient) => {
    setCurrentPatient(patient);
    if (patient.condition === "diabetes") {
      navigate("/patient/diabetes");
    } else {
      navigate("/patient/hypertension");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f2027 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 2, sm: 3 },
      }}
    >
      <Container maxWidth="md" sx={{ px: { xs: 1, sm: 3 } }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Box sx={{ textAlign: "center", mb: { xs: 4, sm: 8 } }}>
            <Avatar
              sx={{
                width: { xs: 64, sm: 80 },
                height: { xs: 64, sm: 80 },
                bgcolor: "primary.main",
                mx: "auto",
                mb: { xs: 2, sm: 3 },
                fontSize: { xs: "2rem", sm: "2.5rem" },
              }}
            >
              ✚
            </Avatar>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: "1.75rem", sm: "3rem" } }}>
              اختر ملفك الشخصي
            </Typography>
            <Typography variant="body1" color="text.secondary">
              اختر الملف الشخصي للدخول إلى حسابك الصحي
            </Typography>
          </Box>
        </motion.div>

        {/* Patient Grid */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : patients.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              لا يوجد مرضى مسجلين
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ابدأ بإضافة مريض جديد
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {patients.map((patient, i) => (
              <Grid item size={{ xs: 12, sm: 6 }} key={patient.id}>
                <MotionCard
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.03, boxShadow: "0 8px 32px rgba(14, 165, 233, 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  sx={{
                    bgcolor: "rgba(30, 41, 59, 0.8)",
                    backdropFilter: "blur(20px)",
                    border: "2px solid transparent",
                    transition: "all 0.3s",
                    "&:hover": {
                      border: "2px solid",
                      borderColor: "primary.main",
                    },
                  }}
                >
                  <CardActionArea onClick={() => handlePatientSelect(patient)} sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                      <Avatar
                        sx={{
                          width: 64,
                          height: 64,
                          background: getColor(patient.condition),
                          fontSize: "1.5rem",
                          fontWeight: 700,
                        }}
                      >
                        {getInitials(patient.name)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                          {patient.name}
                        </Typography>
                        <Chip
                          icon={patient.condition === "diabetes" ? <Bloodtype /> : <Favorite />}
                          label={patient.condition === "diabetes" ? "سكري" : "ضغط"}
                          size="small"
                          color={patient.condition === "diabetes" ? "warning" : "error"}
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      آخر قراءة: {getLastReading(patient)}
                    </Typography>
                  </CardActionArea>
                </MotionCard>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Add New Patient Button */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Paper
            sx={{
              bgcolor: "rgba(30, 41, 59, 0.5)",
              backdropFilter: "blur(20px)",
              border: "2px dashed",
              borderColor: "rgba(255, 255, 255, 0.2)",
              transition: "all 0.3s",
              "&:hover": {
                borderColor: "primary.main",
                bgcolor: "rgba(30, 41, 59, 0.8)",
              },
            }}
          >
            <CardActionArea onClick={() => navigate("/")} sx={{ p: 4 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: "rgba(14, 165, 233, 0.1)",
                    color: "primary.main",
                  }}
                >
                  <Add />
                </Avatar>
                <Typography variant="h6" color="text.secondary" sx={{ "&:hover": { color: "primary.main" } }}>
                  إضافة مريض جديد
                </Typography>
              </Box>
            </CardActionArea>
          </Paper>
        </motion.div>

        {/* Admin Access Link */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <Button
              onClick={() => navigate("/admin")}
              startIcon={<Lock />}
              sx={{
                color: "text.secondary",
                "&:hover": {
                  color: "primary.main",
                },
              }}
            >
              دخول الإدارة 🔐
            </Button>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}
