import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";

const app = new Hono();

app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  maxAge: 600,
}));

import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import { get as dbGet, set as dbSet, del as dbDel, mget as dbMget, getByPrefix } from "./kv_store.ts";

// ==================== AUTH MIDDLEWARE ====================

// Verify JWT and extract user ID
async function verifyAuth(c: any): Promise<{ userId: string; isAdmin: boolean } | null> {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    console.error("Missing Bearer token");
    return null;
  }
  const token = authHeader.replace("Bearer ", "");
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_ANON_KEY") || "",
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      console.error("VerifyAuth Error:", error);
      return null;
    }
    const isAdmin = user.app_metadata?.role === "admin" || user.user_metadata?.role === "admin";
    return { userId: user.id, isAdmin: !!isAdmin };
  } catch (err) {
    console.error("VerifyAuth Exception:", err);
    return null;
  }
}

// Rate limiter (in-memory, per-user, for chat)
const rateLimits = new Map<string, number[]>();
function checkRateLimit(userId: string, maxPerMin = 12): boolean {
  const now = Date.now();
  const times = (rateLimits.get(userId) || []).filter(t => now - t < 60000);
  if (times.length >= maxPerMin) return false;
  times.push(now);
  rateLimits.set(userId, times);
  return true;
}

// Auth guard middleware for all API routes
app.use("/make-server-2063e5bc/*", async (c, next) => {
  // Skip OPTIONS
  if (c.req.method === "OPTIONS") return next();
  // Allow health endpoint without auth
  if (c.req.path.endsWith("/health")) return next();
  const auth = await verifyAuth(c);
  if (!auth) return c.json({ success: false, error: "Unauthorized" }, 401);
  c.set("userId", auth.userId);
  c.set("isAdmin", auth.isAdmin);
  return next();
});

// ==================== PER-USER PATIENT INDEX ====================
function patientsIndexKey(userId: string) { return `user:${userId}:patients_index`; }
function patientKey(userId: string, id: string) { return `user:${userId}:patient:${id}`; }
function readingsKey(userId: string, id: string) { return `user:${userId}:readings:${id}`; }
function chatKey(userId: string, id: string) { return `user:${userId}:chat:${id}`; }

async function getPatientIds(userId: string): Promise<string[]> {
  const ids = await dbGet(patientsIndexKey(userId));
  return Array.isArray(ids) ? ids : [];
}

async function addPatientToIndex(userId: string, id: string): Promise<void> {
  const ids = await getPatientIds(userId);
  if (!ids.includes(id)) { ids.push(id); await dbSet(patientsIndexKey(userId), ids); }
}

async function removePatientFromIndex(userId: string, id: string): Promise<void> {
  const ids = await getPatientIds(userId);
  await dbSet(patientsIndexKey(userId), ids.filter((i) => i !== id));
}

async function getAllPatients(userId: string): Promise<any[]> {
  const ids = await getPatientIds(userId);
  if (ids.length === 0) return [];
  const patients = await dbMget(ids.map((id) => patientKey(userId, id)));
  return patients.filter((p) => p !== null && p !== undefined);
}

// ==================== INPUT VALIDATION ====================
function validateAge(age: any): boolean {
  return typeof age === "number" && age >= 1 && age <= 150;
}
function validateBloodSugar(v: any): boolean {
  return typeof v === "number" && v >= 20 && v <= 600;
}
function validateBP(sys: any, dia: any): boolean {
  return typeof sys === "number" && typeof dia === "number" &&
    sys >= 40 && sys <= 300 && dia >= 20 && dia <= 200;
}

// ==================== PATIENTS API ====================
app.get("/make-server-2063e5bc/patients", async (c) => {
  try {
    const userId = c.get("userId");
    const isAdmin = c.get("isAdmin");
    let patients;
    if (isAdmin) {
      const allData = await getByPrefix("");
      patients = allData.filter((p: any) => p && typeof p === "object" && p.id && p.condition && p.name);
    } else {
      patients = await getAllPatients(userId);
    }
    return c.json({ success: true, data: patients });
  } catch (error: any) {
    return c.json({ success: false, error: `Error: ${error.message}` }, 500);
  }
});

app.get("/make-server-2063e5bc/patients/:id", async (c) => {
  try {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const patient = await dbGet(patientKey(userId, id));
    if (!patient) return c.json({ success: false, error: "Patient not found" }, 404);
    return c.json({ success: true, data: patient });
  } catch (error) {
    return c.json({ success: false, error: `Error: ${error.message}` }, 500);
  }
});

app.post("/make-server-2063e5bc/patients", async (c) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();
    if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
      return c.json({ success: false, error: "اسم المريض مطلوب" }, 400);
    }
    if (body.age !== undefined && !validateAge(body.age)) {
      return c.json({ success: false, error: "العمر يجب أن يكون بين 1 و 150" }, 400);
    }
    const id = crypto.randomUUID();
    const patient = {
      id, name: body.name.trim(), age: body.age || 30,
      condition: body.condition, medications: body.medications || [],
      createdAt: new Date().toISOString(),
      lastReading: body.lastReading || null,
      lastReadingTime: body.lastReadingTime || null,
    };
    await dbSet(patientKey(userId, id), patient);
    await addPatientToIndex(userId, id);
    return c.json({ success: true, data: patient }, 201);
  } catch (error) {
    return c.json({ success: false, error: `Error: ${error.message}` }, 500);
  }
});

app.put("/make-server-2063e5bc/patients/:id", async (c) => {
  try {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const body = await c.req.json();
    const existing = await dbGet(patientKey(userId, id));
    if (!existing) return c.json({ success: false, error: "Patient not found" }, 404);
    const updated = { ...existing, ...body, id };
    await dbSet(patientKey(userId, id), updated);
    return c.json({ success: true, data: updated });
  } catch (error) {
    return c.json({ success: false, error: `Error: ${error.message}` }, 500);
  }
});

app.delete("/make-server-2063e5bc/patients/:id", async (c) => {
  try {
    const userId = c.get("userId");
    const id = c.req.param("id");
    await dbDel(patientKey(userId, id));
    await dbDel(readingsKey(userId, id));
    await dbDel(chatKey(userId, id));
    await removePatientFromIndex(userId, id);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: `Error: ${error.message}` }, 500);
  }
});

// ==================== READINGS API ====================
app.post("/make-server-2063e5bc/readings/:patientId", async (c) => {
  try {
    const userId = c.get("userId");
    const patientId = c.req.param("patientId");
    const body = await c.req.json();
    // Validate reading value
    const patient = await dbGet(patientKey(userId, patientId));
    if (!patient) return c.json({ success: false, error: "Patient not found" }, 404);
    if (patient.condition === "diabetes") {
      if (!validateBloodSugar(body.value)) return c.json({ success: false, error: "قراءة السكر يجب أن تكون بين 20 و 600" }, 400);
    } else {
      if (!validateBP(body.value?.systolic, body.value?.diastolic)) return c.json({ success: false, error: "قراءة الضغط غير صالحة" }, 400);
    }
    const existingReadings = await dbGet(readingsKey(userId, patientId)) || [];
    const reading = { id: crypto.randomUUID(), patientId, value: body.value, timestamp: new Date().toISOString(), timeOfReading: body.timeOfReading || "الآن" };
    existingReadings.push(reading);
    await dbSet(readingsKey(userId, patientId), existingReadings);
    patient.lastReading = body.value;
    patient.lastReadingTime = reading.timestamp;
    await dbSet(patientKey(userId, patientId), patient);
    return c.json({ success: true, data: reading }, 201);
  } catch (error) {
    return c.json({ success: false, error: `Error: ${error.message}` }, 500);
  }
});

app.get("/make-server-2063e5bc/readings/:patientId", async (c) => {
  try {
    const userId = c.get("userId");
    const patientId = c.req.param("patientId");
    const readings = await dbGet(readingsKey(userId, patientId)) || [];
    return c.json({ success: true, data: readings });
  } catch (error) {
    return c.json({ success: false, error: `Error: ${error.message}` }, 500);
  }
});

// ==================== CHAT API ====================
app.get("/make-server-2063e5bc/chat/:patientId", async (c) => {
  try {
    const userId = c.get("userId");
    const patientId = c.req.param("patientId");
    const messages = await dbGet(chatKey(userId, patientId)) || [];
    return c.json({ success: true, data: messages });
  } catch (error) {
    return c.json({ success: false, error: `Error: ${error.message}` }, 500);
  }
});

app.post("/make-server-2063e5bc/chat/:patientId", async (c) => {
  try {
    const userId = c.get("userId");
    // Rate limit
    if (!checkRateLimit(userId)) {
      return c.json({ success: false, error: "محاولات كثيرة، يرجى الانتظار قليلاً" }, 429);
    }
    const patientId = c.req.param("patientId");
    const body = await c.req.json();
    const userMessage = body.message;
    if (!userMessage || typeof userMessage !== "string" || userMessage.trim().length === 0) {
      return c.json({ success: false, error: "الرسالة مطلوبة" }, 400);
    }
    const [patient, readings, existingChat] = await Promise.all([
      dbGet(patientKey(userId, patientId)),
      dbGet(readingsKey(userId, patientId)).then(r => r || []),
      dbGet(chatKey(userId, patientId)).then(c => c || []),
    ]);
    if (!patient) return c.json({ success: false, error: "Patient not found" }, 404);
    const userMsg = { id: crypto.randomUUID(), text: userMessage.trim(), sender: "user", timestamp: new Date().toISOString() };
    existingChat.push(userMsg);
    const aiResponse = await getAIResponse(userMessage.trim(), patient, readings, existingChat);
    const aiMsg = { id: crypto.randomUUID(), text: aiResponse, sender: "assistant", timestamp: new Date().toISOString() };
    existingChat.push(aiMsg);
    await dbSet(chatKey(userId, patientId), existingChat);
    return c.json({ success: true, data: { userMessage: userMsg, aiMessage: aiMsg } });
  } catch (error) {
    return c.json({ success: false, error: `Error: ${error.message}` }, 500);
  }
});

// ==================== AI INTEGRATION ====================
async function getAIResponse(message: string, patient: any, readings: any[], chatHistory: any[]) {
  const apiKey = Deno.env.get("groq_api_key");
  if (!apiKey) return "عذراً، لم يتم تكوين مفتاح Groq API.";
  try {
    const conditionArabic = patient?.condition === "diabetes" ? "السكري" : "ارتفاع ضغط الدم";
    const recentReadings = (readings || []).slice(-5).map((r: any) => {
      if (patient?.condition === "diabetes") return `${r.value} mg/dL`;
      return `${r.value?.systolic}/${r.value?.diastolic} mmHg`;
    }).join(", ");

    const systemPrompt = `أنت مساعد صحي متخصص في ${conditionArabic}، تتبع الإرشادات الطبية الرسمية: ADA Standards of Care 2024 وAHA/ACC 2025 وWHO.

═══════════════════════════════════════
معلومات المريض
═══════════════════════════════════════
الاسم: ${patient?.name || "المريض"}
الحالة: ${conditionArabic}
آخر قراءة: ${patient?.lastReading || "لا توجد"}
القراءات الأخيرة: ${recentReadings || "لا توجد"}
الأدوية: ${(patient?.medications || []).join("، ") || "لا يوجد"}

${patient?.condition === "diabetes" ? `
═══════════════════════════════════════
تصنيف قراءات السكر — ADA 2024
═══════════════════════════════════════
• ≤ 53 mg/dL  → انخفاض حاد — طوارئ فورية 🚨
• 54–69 mg/dL → منخفض — تدخل فوري ⬇️
• 70–99 mg/dL → طبيعي صائماً ✅
• 100–125 mg/dL → ما قبل السكري ⚠️
• 126–139 mg/dL → مرتفع قليلاً 🔸
• 140–179 mg/dL → مرتفع ⚠️
• 180–249 mg/dL → مرتفع جداً 🔴
• 250–299 mg/dL → خطير 🔴
• 300–399 mg/dL → خطير جداً 🚨
• ≥ 400 mg/dL → طارئ طبي 🚨
` : ""}

${patient?.condition === "hypertension" ? `
═══════════════════════════════════════
تصنيف ضغط الدم — AHA/ACC 2025
═══════════════════════════════════════
• < 90/60 → منخفض
• 90-119 / 60-79 → طبيعي ✅
• 120-129 / < 80 → مرتفع قليلاً ⚠️
• 130-139 / 80-89 → المرحلة الأولى ⚠️
• 140-179 / 90-119 → المرحلة الثانية 🔴
• > 180 أو > 120 → أزمة ضغط 🚨
` : ""}

═══════════════════════════════════════
قواعد الرد الإلزامية
═══════════════════════════════════════
❌ لا تعطِ تشخيصاً قاطعاً
❌ لا تقل للمريض أن يوقف دوائه
❌ لا تعطِ جرعة دواء محددة
✅ اذكر مراجعة الطبيب لكل حالة متوسطة أو خطيرة
✅ للطوارئ: اطلب الإسعاف صراحةً
✅ لغة عربية واضحة دافئة داعمة
⚠️ "هذا المساعد توعوي فقط ولا يُغني عن استشارة الطبيب المختص"`;

    const recentMessages = chatHistory.slice(-6).map((msg: any) => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text,
    }));

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: systemPrompt }, ...recentMessages, { role: "user", content: message }],
        temperature: 0.6, max_tokens: 800, top_p: 0.9,
      }),
    });
    if (!res.ok) return "عذراً، حدث خطأ في الاتصال بخدمة الذكاء الاصطناعي.";
    const data = await res.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("AI error:", error);
    return "عذراً، حدث خطأ في معالجة طلبك.";
  }
}

// ==================== STATS API ====================
app.get("/make-server-2063e5bc/stats", async (c) => {
  try {
    const userId = c.get("userId");
    const isAdmin = c.get("isAdmin");
    let patients;
    if (isAdmin) {
      const allData = await getByPrefix("");
      patients = allData.filter((p: any) => p && typeof p === "object" && p.id && p.condition && p.name);
    } else {
      patients = await getAllPatients(userId);
    }
    const totalPatients = patients.length;
    const diabetesPatients = patients.filter((p: any) => p?.condition === "diabetes").length;
    const hypertensionPatients = patients.filter((p: any) => p?.condition === "hypertension").length;
    const needsAttention = patients.filter((p: any) => {
      if (!p?.lastReading) return true;
      if (p.condition === "diabetes") { const v = Number(p.lastReading); return !isNaN(v) && (v > 180 || v < 70); }
      return p.lastReading?.systolic > 140 || p.lastReading?.diastolic > 90;
    }).length;
    return c.json({ success: true, data: { totalPatients, diabetesPatients, hypertensionPatients, needsAttention } });
  } catch (error: any) {
    return c.json({ success: false, error: `Error: ${error.message}` }, 500);
  }
});

// ==================== ADMIN MIGRATE ====================
app.post("/make-server-2063e5bc/admin/migrate", async (c) => {
  try {
    const userId = c.get("userId");
    const isAdmin = c.get("isAdmin");
    if (!isAdmin) return c.json({ success: false, error: "Unauthorized" }, 403);
    
    const legacyIds = await dbGet("patients_index");
    if (!legacyIds || !Array.isArray(legacyIds)) {
      return c.json({ success: true, message: "لا توجد بيانات قديمة للترحيل" });
    }
    
    let migratedCount = 0;
    for (const id of legacyIds) {
      const patient = await dbGet(`patient:${id}`);
      if (patient) {
        await dbSet(patientKey(userId, id), patient);
        await addPatientToIndex(userId, id);
        
        const readings = await dbGet(`readings:${id}`);
        if (readings) await dbSet(readingsKey(userId, id), readings);
        
        const chat = await dbGet(`chat:${id}`);
        if (chat) await dbSet(chatKey(userId, id), chat);
        
        migratedCount++;
      }
    }
    await dbDel("patients_index");
    return c.json({ success: true, message: `تم ترحيل ${migratedCount} مريض بنجاح إلى حسابك.` });
  } catch (error: any) {
    return c.json({ success: false, error: `Error: ${error.message}` }, 500);
  }
});

// ==================== HEALTH CHECK (sanitized) ====================
app.get("/make-server-2063e5bc/health", async (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

Deno.serve(app.fetch);
