import { useState, useRef, useEffect } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Avatar,
  Chip,
  Card,
  CardContent,
  LinearProgress,
  Badge,
  Fab,
  Grid,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Send, SmartToy, FiberManualRecord, Add, People } from "@mui/icons-material";
import { motion, AnimatePresence } from "motion/react";
import { usePatient } from "../../contexts/PatientContext";
import { api, Message } from "../../utils/api";
import { useNavigate } from "react-router";
import FormattedMessage from "../components/FormattedMessage";
import { getBPStatus, getBPCategory } from "../../utils/medicalUtils";

const MotionBox = motion.create(Box);

export default function PatientDashboardHypertension() {
  const { currentPatient, updateCurrentPatient } = usePatient();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reading dialog state
  const [readingDialogOpen, setReadingDialogOpen] = useState(false);
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [timeOfReading, setTimeOfReading] = useState("الآن");
  const [savingReading, setSavingReading] = useState(false);

  const quickSuggestions = [
    "صداع شديد",
    "دوخة مفاجئة",
    "ضغطي مرتفع",
    "أشعر بضيق صدر",
    "نسيت دوائي",
    "هل الملح خطر؟",
    "تعب عام",
  ];

  useEffect(() => {
    if (!currentPatient) {
      navigate("/select-patient");
      return;
    }
    if (currentPatient.condition !== "hypertension") {
      navigate("/patient/diabetes");
      return;
    }
    loadChatHistory();
  }, [currentPatient]);

  const loadChatHistory = async () => {
    if (!currentPatient) return;
    try {
      setLoading(true);
      const history = await api.chat.getHistory(currentPatient.id);
      if (history.length === 0) {
        const reading = currentPatient.lastReading;
        const readingText = reading ? `${reading.systolic}/${reading.diastolic} mmHg` : "";
        const statusText = reading && (reading.systolic > 140 || reading.diastolic > 90) ? " وهي مرتفعة قليلاً" : "";
        const initialMessage = `مرحباً ${currentPatient.name}! أنا مساعدك الصحي المتخصص في ضغط الدم. ${
          reading ? `لاحظت أن آخر قراءة لك كانت ${readingText}${statusText}.` : ""
        } كيف تشعر الآن؟`;
        const response = await api.chat.sendMessage(currentPatient.id, "مرحباً");
        setMessages([{ id: response.aiMessage.id, text: initialMessage, sender: "assistant", timestamp: response.aiMessage.timestamp }]);
      } else {
        setMessages(history);
      }
    } catch (error) {
      console.error("Error loading chat:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || !currentPatient) return;

    const tempUserMsg: Message = { id: Date.now().toString(), text: messageText, sender: "user", timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, tempUserMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await api.chat.sendMessage(currentPatient.id, messageText);
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
        return [...filtered, response.userMessage, response.aiMessage];
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), text: "عذراً، حدث خطأ في إرسال الرسالة. يرجى المحاولة مرة أخرى.", sender: "assistant", timestamp: new Date().toISOString() },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSaveReading = async () => {
    if (!systolic || !diastolic || !currentPatient) return;
    const sysVal = Number(systolic);
    const diaVal = Number(diastolic);
    if (isNaN(sysVal) || isNaN(diaVal) || sysVal <= 0 || diaVal <= 0) return;

    setSavingReading(true);
    try {
      const value = { systolic: sysVal, diastolic: diaVal };
      await api.readings.add(currentPatient.id, { value, timeOfReading });
      updateCurrentPatient({ lastReading: value, lastReadingTime: new Date().toISOString() });
      setReadingDialogOpen(false);
      setSystolic("");
      setDiastolic("");
      setTimeOfReading("الآن");

      const bpStatus =
        sysVal >= 180 || diaVal >= 120 ? "أزمة ضغط 🚨" :
        sysVal >= 140 || diaVal >= 90 ? "ارتفاع المرحلة الثانية 🔴" :
        sysVal >= 130 || diaVal >= 80 ? "ارتفاع المرحلة الأولى ⚠️" :
        sysVal >= 120 ? "مرتفع قليلاً" : "طبيعي ✅";

      await handleSend(`سجلت قراءة ضغط جديدة: ${sysVal}/${diaVal} mmHg (${timeOfReading}) — الحالة: ${bpStatus}`);
    } catch (error) {
      console.error("Error saving reading:", error);
      alert("حدث خطأ في حفظ القراءة. يرجى المحاولة مرة أخرى.");
    } finally {
      setSavingReading(false);
    }
  };

  if (!currentPatient) return null;

  const reading = currentPatient.lastReading;
  const bpStatus = reading ? getBPStatus(reading.systolic, reading.diastolic) : null;

  const getSystolicProgress = () => {
    if (!reading) return 0;
    return Math.min((reading.systolic / 200) * 100, 100);
  };

  const bpDialogStatus = systolic && diastolic && Number(systolic) > 0 && Number(diastolic) > 0
    ? getBPStatus(Number(systolic), Number(diastolic))
    : null;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", p: { xs: 0, sm: 2 }, overflow: "hidden" }}>
      <Container maxWidth="sm" sx={{ height: { xs: "100vh", sm: "95vh" }, display: "flex", flexDirection: "column", px: { xs: 0, sm: 3 } }}>
        <Paper elevation={24} sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", bgcolor: "background.paper", borderRadius: { xs: 0, sm: 4 } }}>
          {/* Header */}
          <Box sx={{ background: "linear-gradient(135deg, #2d0000 0%, #1a0000 100%)", borderTop: "3px solid #ef4444", p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Avatar sx={{ width: { xs: 44, sm: 56 }, height: { xs: 44, sm: 56 }, background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", fontSize: "1.3rem" }}>❤️</Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: "1rem", sm: "1.25rem" } }}>{currentPatient.name}</Typography>
                  <Typography variant="caption" color="text.secondary">ارتفاع ضغط الدم</Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Tooltip title="تغيير المريض">
                  <IconButton size="small" onClick={() => navigate("/select-patient")} sx={{ color: "text.secondary" }}>
                    <People fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Badge badgeContent="متصل" color="success" sx={{ "& .MuiBadge-badge": { fontSize: "0.7rem", height: 20, minWidth: 20, borderRadius: 10 } }}>
                  <FiberManualRecord sx={{ color: "success.main", fontSize: 12 }} />
                </Badge>
              </Box>
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={{ xs: 1, sm: 1.5 }}>
              <Grid item size={{ xs: 4 }}>
                <Card sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }}>
                  <CardContent sx={{ p: { xs: 1, sm: 1.5 }, "&:last-child": { pb: { xs: 1, sm: 1.5 } } }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>آخر قراءة</Typography>
                    <Typography variant="h6" sx={{ color: bpStatus ? bpStatus.color : "#ef4444", my: 0.5, fontSize: { xs: "1rem", sm: "1.25rem" } }}>
                      {reading ? `${reading.systolic}/${reading.diastolic}` : "--"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6rem" }}>mmHg</Typography>
                    {bpStatus && <Chip label={bpStatus.label} size="small" color={bpStatus.chipColor} sx={{ mt: 0.5, height: 20, fontSize: "0.6rem", display: "flex" }} />}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item size={{ xs: 4 }}>
                <Card sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }}>
                  <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>الانقباضي</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, my: 0.5, fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
                      {currentPatient.lastReading?.systolic || "--"}
                    </Typography>
                    <LinearProgress variant="determinate" value={getSystolicProgress()} sx={{ mt: 1, height: 4, bgcolor: "rgba(255, 255, 255, 0.1)", "& .MuiLinearProgress-bar": { bgcolor: "#ef4444" } }} />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item size={{ xs: 4 }}>
                <Card
                  sx={{ bgcolor: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", cursor: "pointer", "&:hover": { bgcolor: "rgba(239,68,68,0.25)" } }}
                  onClick={() => setReadingDialogOpen(true)}
                >
                  <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 }, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 70 }}>
                    <Add sx={{ color: "#ef4444", fontSize: 28 }} />
                    <Typography variant="caption" sx={{ color: "#ef4444", fontSize: "0.65rem", textAlign: "center", fontWeight: 600 }}>
                      أضف قراءة
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

          {/* Chat Area */}
          <Box sx={{ flex: 1, overflow: "auto", p: 2, bgcolor: "#0f172a" }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                <CircularProgress />
              </Box>
            ) : (
              <AnimatePresence>
                {messages.map((message) => (
                  <MotionBox
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    sx={{ display: "flex", justifyContent: message.sender === "user" ? "flex-start" : "flex-end", alignItems: "flex-end", gap: 1, mb: 2 }}
                  >
                    {message.sender === "assistant" && (
                      <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
                        <SmartToy fontSize="small" />
                      </Avatar>
                    )}
                    <Box sx={{ maxWidth: "80%" }}>
                      <Paper
                        elevation={2}
                        sx={{
                          p: 1.5,
                          bgcolor: message.sender === "user" ? "primary.main" : "rgba(255, 255, 255, 0.05)",
                          borderRadius: 3,
                          borderBottomLeftRadius: message.sender === "assistant" ? 4 : 12,
                          borderBottomRightRadius: message.sender === "user" ? 4 : 12,
                          wordBreak: "break-word",
                          overflowWrap: "break-word",
                        }}
                      >
                        {message.sender === "assistant" ? (
                          <FormattedMessage text={message.text} />
                        ) : (
                          <Typography variant="body2" sx={{ lineHeight: 1.6 }}>{message.text}</Typography>
                        )}
                      </Paper>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, textAlign: message.sender === "user" ? "left" : "right", fontSize: "0.7rem" }}>
                        {new Date(message.timestamp).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                      </Typography>
                    </Box>
                  </MotionBox>
                ))}
              </AnimatePresence>
            )}

            {isTyping && (
              <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} sx={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-end", gap: 1 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
                  <SmartToy fontSize="small" />
                </Avatar>
                <Paper elevation={2} sx={{ p: 1.5, bgcolor: "rgba(255, 255, 255, 0.05)", borderRadius: 3 }}>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    {[0, 1, 2].map((i) => (
                      <motion.div key={i} animate={{ y: [0, -8, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "primary.light" }} />
                      </motion.div>
                    ))}
                  </Box>
                </Paper>
              </MotionBox>
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Quick Suggestions — wrapped, no horizontal scroll */}
          <Box sx={{ px: 2, py: 1, bgcolor: "#0f172a" }}>
            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
              {quickSuggestions.map((suggestion, i) => (
                <Chip
                  key={i}
                  label={suggestion}
                  onClick={() => handleSend(suggestion)}
                  size="small"
                  sx={{ bgcolor: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.3)", color: "primary.light", "&:hover": { bgcolor: "rgba(14,165,233,0.2)" }, mb: 0.5 }}
                />
              ))}
            </Box>
          </Box>

          {/* Input Area */}
          <Box sx={{ p: 2, bgcolor: "#0f172a" }}>
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-end" }}>
              <Fab color="primary" size="small" onClick={() => handleSend()} disabled={!input.trim() || isTyping} sx={{ flexShrink: 0 }}>
                <Send sx={{ transform: "rotate(180deg)" }} />
              </Fab>
              <TextField
                fullWidth
                multiline
                maxRows={3}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="اكتب كيف تشعر الآن..."
                variant="outlined"
                size="small"
                disabled={isTyping}
                InputProps={{ sx: { direction: "rtl", bgcolor: "rgba(255, 255, 255, 0.05)" } }}
              />
            </Box>
          </Box>
        </Paper>
      </Container>

      {/* Add Reading Dialog */}
      <Dialog open={readingDialogOpen} onClose={() => setReadingDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>❤️ إضافة قراءة ضغط جديدة</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, justifyContent: "center" }}>
              <TextField
                type="number"
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
                label="الانقباضي"
                autoFocus
                sx={{ width: 120 }}
                InputProps={{ sx: { fontSize: "1.5rem", direction: "ltr" } }}
                inputProps={{ min: 60, max: 250 }}
              />
              <Typography variant="h4" color="text.secondary">/</Typography>
              <TextField
                type="number"
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
                label="الانبساطي"
                sx={{ width: 120 }}
                InputProps={{ sx: { fontSize: "1.5rem", direction: "ltr" } }}
                inputProps={{ min: 40, max: 150 }}
              />
            </Box>
            {bpDialogStatus && (
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: bpDialogStatus.color }}>
                  {systolic} / {diastolic}{" "}
                  <Typography component="span" variant="body2" color="text.secondary">mmHg</Typography>
                </Typography>
                <Chip label={bpDialogStatus.label} color={bpDialogStatus.chipColor} />
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, px: 1 }}>
                  {bpDialogStatus.action}
                </Typography>
              </Box>
            )}
            <FormControl fullWidth>
              <InputLabel>متى أجريت القراءة؟</InputLabel>
              <Select value={timeOfReading} onChange={(e) => setTimeOfReading(e.target.value)} label="متى أجريت القراءة؟">
                <MenuItem value="الآن">الآن</MenuItem>
                <MenuItem value="الصباح الباكر">الصباح الباكر (بعد الاستيقاظ)</MenuItem>
                <MenuItem value="قبل الدواء">قبل الدواء</MenuItem>
                <MenuItem value="بعد الدواء">بعد الدواء</MenuItem>
                <MenuItem value="قبل النوم">قبل النوم</MenuItem>
                <MenuItem value="منذ ساعة">منذ ساعة</MenuItem>
                <MenuItem value="أمس">أمس</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReadingDialogOpen(false)} disabled={savingReading}>إلغاء</Button>
          <Button variant="contained" color="error" onClick={handleSaveReading} disabled={!systolic || !diastolic || Number(systolic) <= 0 || Number(diastolic) <= 0 || savingReading}>
            {savingReading ? "جاري الحفظ..." : "حفظ وإرسال للمساعد"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
