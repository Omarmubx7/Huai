import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { api } from "../../utils/api";
import { usePatient } from "../../contexts/PatientContext";
import { useAuth } from "../../contexts/AuthContext";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Avatar,
  Grid,
  CircularProgress,
} from "@mui/material";
import { Favorite, Bloodtype, ArrowForward, Logout } from "@mui/icons-material";
import { motion } from "motion/react";
import MedicationAutocomplete from "../components/MedicationAutocomplete";
import { getDiabetesStatus, getBPStatus } from "../../utils/medicalUtils";

type Condition = "diabetes" | "hypertension" | null;

const MotionPaper = motion.create(Paper);
const MotionCard = motion.create(Card);

export default function Onboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { setCurrentPatient, refreshPatients, currentPatient, loading: patientLoading } = usePatient();
  const [activeStep, setActiveStep] = useState(0);
  const isNewPatientFlow = new URLSearchParams(location.search).get("mode") === "new";

  // Auto-redirect if patient already saved
  useEffect(() => {
    if (!patientLoading && currentPatient && !isNewPatientFlow) {
      if (currentPatient.condition === "diabetes") {
        navigate("/patient/diabetes", { replace: true });
      } else {
        navigate("/patient/hypertension", { replace: true });
      }
    }
  }, [patientLoading, currentPatient, isNewPatientFlow, navigate]);
  const [condition, setCondition] = useState<Condition>(null);
  const [name, setName] = useState("");
  const [medications, setMedications] = useState<string[]>([]);
  const [reading, setReading] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [timeOfReading, setTimeOfReading] = useState("الآن");
  const [loading, setLoading] = useState(false);

  const steps = ["اختر الحالة", "أدخل اسمك", "اختر الأدوية", "أدخل القراءة"];

  const handleConditionSelect = (selected: Condition) => {
    setCondition(selected);
    setActiveStep(1);
  };

  const handleNameSubmit = () => {
    if (name.trim()) {
      setActiveStep(2);
    }
  };

  const handleMedicationSubmit = () => {
    setActiveStep(3);
  };

  const handleStart = async () => {
    if (!name || !condition) return;

    setLoading(true);
    try {
      // Determine reading value based on condition
      let readingValue;
      if (condition === "diabetes") {
        readingValue = reading ? Number(reading) : null;
      } else {
        readingValue = systolic && diastolic ? { systolic: Number(systolic), diastolic: Number(diastolic) } : null;
      }

      const defaultMedications = condition === "diabetes"
        ? ["ميتفورمين 1000mg"]
        : ["أملوديبين 5mg"];

      // Create patient
      const newPatient = await api.patients.create({
        name,
        age: 30, // Default age, can be made configurable
        condition,
        medications: medications.length > 0 ? medications : defaultMedications,
        lastReading: readingValue,
        lastReadingTime: new Date().toISOString(),
      });

      // Add initial reading if provided
      if (readingValue) {
        await api.readings.add(newPatient.id, {
          value: readingValue,
          timeOfReading,
        });
      }

      // Set as current patient
      setCurrentPatient(newPatient);
      await refreshPatients();

      // Navigate to appropriate dashboard
      if (condition === "diabetes") {
        navigate("/patient/diabetes");
      } else {
        navigate("/patient/hypertension");
      }
    } catch (error) {
      console.error("Error creating patient:", error);
      alert("حدث خطأ في إنشاء الملف الشخصي. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  const getReadingStatus = (value: number) => {
    const s = getDiabetesStatus(value);
    return { text: s.label, color: s.chipColor };
  };

  const getBPStatusLabel = (sys: number, dia: number) => {
    const s = getBPStatus(sys, dia);
    return { text: s.label, color: s.chipColor };
  };

  if (patientLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f2027 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 3,
        }}
      >
        <Avatar sx={{ width: 80, height: 80, bgcolor: "primary.main", fontSize: "2.5rem" }}>✚</Avatar>
        <CircularProgress size={40} />
        <Typography variant="body1" color="text.secondary">
          جاري تحميل حسابك...
        </Typography>
      </Box>
    );
  }

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
      <Container maxWidth="sm" sx={{ px: { xs: 1, sm: 3 } }}>
        <MotionPaper
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          elevation={24}
          sx={{
            p: { xs: 2, sm: 4 },
            backgroundColor: "rgba(30, 41, 59, 0.8)",
            backdropFilter: "blur(20px)",
            borderRadius: { xs: 2, sm: 4 },
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: "center", mb: { xs: 3, sm: 4 } }}>
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Avatar
                sx={{
                  width: { xs: 64, sm: 80 },
                  height: { xs: 64, sm: 80 },
                  bgcolor: "primary.main",
                  mx: "auto",
                  mb: { xs: 1.5, sm: 2 },
                  fontSize: { xs: "2rem", sm: "2.5rem" },
                }}
              >
                ✚
              </Avatar>
            </motion.div>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: "1.5rem", sm: "2.125rem" } }}>
              مرحباً بك في مساعدك الصحي
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
              نظام ذكاء اصطناعي متخصص في السكري وضغط الدم
            </Typography>
            <Button size="small" startIcon={<Logout />} onClick={signOut} sx={{ mt: 1, color: 'text.secondary' }}>
              تسجيل الخروج
            </Button>
          </Box>

          {/* Medical Disclaimer */}
          <Box sx={{ mb: 2, p: 1.5, bgcolor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="warning.main" sx={{ fontSize: '0.7rem', lineHeight: 1.6 }}>
              ⚠️ هذا التطبيق للتوعية الصحية فقط ولا يُغني عن استشارة الطبيب المختص.
            </Typography>
          </Box>

          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: { xs: 3, sm: 4 } }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step 1: Condition Selection */}
          {activeStep === 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <MotionCard
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    sx={{
                      backgroundColor: "rgba(245, 158, 11, 0.1)",
                      border: "2px solid transparent",
                      "&:hover": {
                        border: "2px solid #f59e0b",
                      },
                    }}
                  >
                    <CardActionArea onClick={() => handleConditionSelect("diabetes")} sx={{ p: 3 }}>
                      <CardContent sx={{ textAlign: "center" }}>
                        <Bloodtype sx={{ fontSize: 48, color: "#f59e0b", mb: 2 }} />
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                          السكري
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          متابعة سكر الدم
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </MotionCard>
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <MotionCard
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    sx={{
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      border: "2px solid transparent",
                      "&:hover": {
                        border: "2px solid #ef4444",
                      },
                    }}
                  >
                    <CardActionArea onClick={() => handleConditionSelect("hypertension")} sx={{ p: 3 }}>
                      <CardContent sx={{ textAlign: "center" }}>
                        <Favorite sx={{ fontSize: 48, color: "#ef4444", mb: 2 }} />
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                          ضغط الدم
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          متابعة ضغط الدم
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </MotionCard>
                </Grid>
              </Grid>
            </motion.div>
          )}

          {/* Step 2: Name Input */}
          {activeStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <TextField
                  fullWidth
                  label="ما اسمك؟"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="أدخل اسمك الكريم..."
                  variant="outlined"
                  InputProps={{
                    sx: { direction: "rtl" },
                  }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleNameSubmit}
                  disabled={!name.trim()}
                  endIcon={<ArrowForward sx={{ transform: "rotate(180deg)" }} />}
                >
                  التالي
                </Button>
              </Box>
            </motion.div>
          )}

          {/* Step 3: Medication Selection */}
          {activeStep === 2 && condition && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <MedicationAutocomplete
                  category={condition}
                  selectedMedications={medications}
                  onChange={setMedications}
                />
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
                  يمكنك تخطي هذه الخطوة إذا لم تكن تتناول أدوية حالياً
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleMedicationSubmit}
                  endIcon={<ArrowForward sx={{ transform: "rotate(180deg)" }} />}
                >
                  التالي
                </Button>
              </Box>
            </motion.div>
          )}

          {/* Step 4: Reading Input - Diabetes */}
          {activeStep === 3 && condition === "diabetes" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="آخر قراءة لسكر الدم (mg/dL)"
                  value={reading}
                  onChange={(e) => setReading(e.target.value)}
                  placeholder="أدخل القراءة..."
                  variant="outlined"
                  InputProps={{
                    sx: { fontSize: "1.5rem", textAlign: "center" },
                  }}
                />
                {reading && (
                  <Box sx={{ textAlign: "center" }}>
                    <Chip
                      label={getReadingStatus(Number(reading)).text}
                      color={getReadingStatus(Number(reading)).color}
                      size="medium"
                    />
                  </Box>
                )}
                <FormControl fullWidth>
                  <InputLabel>متى أجريت القراءة؟</InputLabel>
                  <Select
                    value={timeOfReading}
                    onChange={(e) => setTimeOfReading(e.target.value)}
                    label="متى أجريت القراءة؟"
                  >
                    <MenuItem key="now" value="الآن">الآن</MenuItem>
                    <MenuItem key="1h" value="منذ ساعة">منذ ساعة</MenuItem>
                    <MenuItem key="2h" value="منذ ساعتين">منذ ساعتين</MenuItem>
                    <MenuItem key="3h" value="منذ 3 ساعات">منذ 3 ساعات</MenuItem>
                    <MenuItem key="morning" value="اليوم الصبح">اليوم الصبح</MenuItem>
                    <MenuItem key="yesterday" value="أمس">أمس</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleStart}
                  disabled={!reading || loading}
                  endIcon={<ArrowForward sx={{ transform: "rotate(180deg)" }} />}
                >
                  {loading ? "جاري الإنشاء..." : "ابدأ المحادثة"}
                </Button>
              </Box>
            </motion.div>
          )}

          {/* Step 4: Reading Input - Hypertension */}
          {activeStep === 3 && condition === "hypertension" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Typography variant="subtitle1" sx={{ textAlign: "center" }}>
                  آخر قراءة لضغط الدم
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, justifyContent: "center" }}>
                  <TextField
                    type="number"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    label="الانقباضي"
                    sx={{ width: 120 }}
                    InputProps={{
                      sx: { fontSize: "1.5rem", textAlign: "center" },
                    }}
                  />
                  <Typography variant="h4" color="text.secondary">
                    /
                  </Typography>
                  <TextField
                    type="number"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    label="الانبساطي"
                    sx={{ width: 120 }}
                    InputProps={{
                      sx: { fontSize: "1.5rem", textAlign: "center" },
                    }}
                  />
                </Box>
                {systolic && diastolic && (
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="h4" gutterBottom>
                      {systolic} / {diastolic}{" "}
                      <Typography component="span" variant="body2" color="text.secondary">
                        mmHg
                      </Typography>
                    </Typography>
                    <Chip
                      label={getBPStatusLabel(Number(systolic), Number(diastolic)).text}
                      color={getBPStatusLabel(Number(systolic), Number(diastolic)).color}
                      size="medium"
                    />
                  </Box>
                )}
                <FormControl fullWidth>
                  <InputLabel>متى أجريت القراءة؟</InputLabel>
                  <Select
                    value={timeOfReading}
                    onChange={(e) => setTimeOfReading(e.target.value)}
                    label="متى أجريت القراءة؟"
                  >
                    <MenuItem key="now" value="الآن">الآن</MenuItem>
                    <MenuItem key="1h" value="منذ ساعة">منذ ساعة</MenuItem>
                    <MenuItem key="2h" value="منذ ساعتين">منذ ساعتين</MenuItem>
                    <MenuItem key="3h" value="منذ 3 ساعات">منذ 3 ساعات</MenuItem>
                    <MenuItem key="morning" value="اليوم الصبح">اليوم الصبح</MenuItem>
                    <MenuItem key="yesterday" value="أمس">أمس</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleStart}
                  disabled={!systolic || !diastolic || loading}
                  endIcon={<ArrowForward sx={{ transform: "rotate(180deg)" }} />}
                >
                  {loading ? "جاري الإنشاء..." : "ابدأ المحادثة"}
                </Button>
              </Box>
            </motion.div>
          )}
        </MotionPaper>
      </Container>
    </Box>
  );
}
