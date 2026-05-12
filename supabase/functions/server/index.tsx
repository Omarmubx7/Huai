import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use('*', logger(console.log));

app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// ==================== PATIENT INDEX HELPERS ====================
// We track all patient IDs in a single "patients_index" key (array of strings)
// to avoid using getByPrefix (which causes internal server errors).

const PATIENTS_INDEX_KEY = "patients_index_2063e5bc";

async function getPatientIds(): Promise<string[]> {
  const ids = await kv.get(PATIENTS_INDEX_KEY);
  return Array.isArray(ids) ? ids : [];
}

async function addPatientToIndex(id: string): Promise<void> {
  const ids = await getPatientIds();
  if (!ids.includes(id)) {
    ids.push(id);
    await kv.set(PATIENTS_INDEX_KEY, ids);
  }
}

async function removePatientFromIndex(id: string): Promise<void> {
  const ids = await getPatientIds();
  const updated = ids.filter((i) => i !== id);
  await kv.set(PATIENTS_INDEX_KEY, updated);
}

async function getAllPatients(): Promise<any[]> {
  const ids = await getPatientIds();
  if (ids.length === 0) return [];
  const patientKeys = ids.map((id) => `patient:${id}`);
  const patients = await kv.mget(patientKeys);
  // Filter out nulls (deleted patients whose IDs weren't cleaned up)
  return patients.filter((p) => p !== null && p !== undefined);
}

// ==================== PATIENTS API ====================

app.get("/make-server-2063e5bc/patients", async (c) => {
  try {
    const patients = await getAllPatients();
    return c.json({ success: true, data: patients });
  } catch (error) {
    console.error("Error fetching patients:", error);
    return c.json({ success: false, error: `Error fetching patients: ${error.message}` }, 500);
  }
});

app.get("/make-server-2063e5bc/patients/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const patient = await kv.get(`patient:${id}`);
    if (!patient) {
      return c.json({ success: false, error: "Patient not found" }, 404);
    }
    return c.json({ success: true, data: patient });
  } catch (error) {
    console.error("Error fetching patient:", error);
    return c.json({ success: false, error: `Error fetching patient: ${error.message}` }, 500);
  }
});

app.post("/make-server-2063e5bc/patients", async (c) => {
  try {
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const patient = {
      id,
      name: body.name,
      age: body.age,
      condition: body.condition,
      medications: body.medications || [],
      createdAt: new Date().toISOString(),
      lastReading: body.lastReading || null,
      lastReadingTime: body.lastReadingTime || null,
    };

    await kv.set(`patient:${id}`, patient);
    await addPatientToIndex(id);
    return c.json({ success: true, data: patient }, 201);
  } catch (error) {
    console.error("Error creating patient:", error);
    return c.json({ success: false, error: `Error creating patient: ${error.message}` }, 500);
  }
});

app.put("/make-server-2063e5bc/patients/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const existing = await kv.get(`patient:${id}`);

    if (!existing) {
      return c.json({ success: false, error: "Patient not found" }, 404);
    }

    const updated = { ...existing, ...body, id };
    await kv.set(`patient:${id}`, updated);
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating patient:", error);
    return c.json({ success: false, error: `Error updating patient: ${error.message}` }, 500);
  }
});

app.delete("/make-server-2063e5bc/patients/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(`patient:${id}`);
    await kv.del(`readings:${id}`);
    await kv.del(`chat:${id}`);
    await removePatientFromIndex(id);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting patient:", error);
    return c.json({ success: false, error: `Error deleting patient: ${error.message}` }, 500);
  }
});

// ==================== READINGS API ====================

app.post("/make-server-2063e5bc/readings/:patientId", async (c) => {
  try {
    const patientId = c.req.param("patientId");
    const body = await c.req.json();

    const existingReadings = await kv.get(`readings:${patientId}`) || [];

    const reading = {
      id: crypto.randomUUID(),
      patientId,
      value: body.value,
      timestamp: new Date().toISOString(),
      timeOfReading: body.timeOfReading || "الآن",
    };

    existingReadings.push(reading);
    await kv.set(`readings:${patientId}`, existingReadings);

    // Update patient's last reading
    const patient = await kv.get(`patient:${patientId}`);
    if (patient) {
      patient.lastReading = body.value;
      patient.lastReadingTime = reading.timestamp;
      await kv.set(`patient:${patientId}`, patient);
    }

    return c.json({ success: true, data: reading }, 201);
  } catch (error) {
    console.error("Error adding reading:", error);
    return c.json({ success: false, error: `Error adding reading: ${error.message}` }, 500);
  }
});

app.get("/make-server-2063e5bc/readings/:patientId", async (c) => {
  try {
    const patientId = c.req.param("patientId");
    const readings = await kv.get(`readings:${patientId}`) || [];
    return c.json({ success: true, data: readings });
  } catch (error) {
    console.error("Error fetching readings:", error);
    return c.json({ success: false, error: `Error fetching readings: ${error.message}` }, 500);
  }
});

// ==================== CHAT API ====================

app.get("/make-server-2063e5bc/chat/:patientId", async (c) => {
  try {
    const patientId = c.req.param("patientId");
    const messages = await kv.get(`chat:${patientId}`) || [];
    return c.json({ success: true, data: messages });
  } catch (error) {
    console.error("Error fetching chat:", error);
    return c.json({ success: false, error: `Error fetching chat: ${error.message}` }, 500);
  }
});

app.post("/make-server-2063e5bc/chat/:patientId", async (c) => {
  try {
    const patientId = c.req.param("patientId");
    const body = await c.req.json();
    const userMessage = body.message;

    const patient = await kv.get(`patient:${patientId}`);
    const readings = await kv.get(`readings:${patientId}`) || [];
    const existingChat = await kv.get(`chat:${patientId}`) || [];

    const userMsg = {
      id: crypto.randomUUID(),
      text: userMessage,
      sender: "user",
      timestamp: new Date().toISOString(),
    };
    existingChat.push(userMsg);

    const aiResponse = await getAIResponse(userMessage, patient, readings, existingChat);

    const aiMsg = {
      id: crypto.randomUUID(),
      text: aiResponse,
      sender: "assistant",
      timestamp: new Date().toISOString(),
    };
    existingChat.push(aiMsg);

    await kv.set(`chat:${patientId}`, existingChat);

    return c.json({ success: true, data: { userMessage: userMsg, aiMessage: aiMsg } });
  } catch (error) {
    console.error("Error in chat:", error);
    return c.json({ success: false, error: `Error in chat: ${error.message}` }, 500);
  }
});

// ==================== AI INTEGRATION ====================

async function getAIResponse(message: string, patient: any, readings: any[], chatHistory: any[]) {
  const apiKey = Deno.env.get("groq_api_key");

  if (!apiKey) {
    return "عذراً، لم يتم تكوين مفتاح Groq API. يرجى إضافته في إعدادات البيئة.";
  }

  try {
    const conditionArabic = patient.condition === "diabetes" ? "السكري" : "ارتفاع ضغط الدم";
    const lastReading = patient.lastReading || "لا يوجد";
    const recentReadings = readings.slice(-5).map(r => {
      if (patient.condition === "diabetes") {
        return `${r.value} mg/dL`;
      } else {
        return `${r.value.systolic}/${r.value.diastolic} mmHg`;
      }
    }).join(", ");

    const systemPrompt = `أنت مساعد صحي متخصص في ${conditionArabic} تتبع الإرشادات الطبية من AHA/ACC 2025 وADA Standards of Care 2024.

═══════════════════════════════════════
معلومات المريض
═══════════════════════════════════════
الاسم: ${patient.name}
الحالة: ${conditionArabic}
آخر قراءة: ${lastReading}
القراءات الأخيرة: ${recentReadings || "لا يوجد"}
الأدوية: ${patient.medications.join("، ") || "لا يوجد"}

═══════════════════════════════════════
القواعد الطبية — السكري
═══════════════════════════════════════
${patient.condition === "diabetes" ? `
قراءات السكر:
• أقل من 54: انخفاض حاد — طوارئ فورية 🚨 (اتصل بالإسعاف فوراً)
• 54-69: منخفض — تدخل فوري (15 غرام كربوهيدرات سريعة)
• 70-99: طبيعي صائماً ✅
• 100-125: ما قبل السكري ⚠️
• 126-139: مرتفع قليلاً
• 140-179: مرتفع ⚠️ (مشي خفيف يساعد)
• 180-249: مرتفع جداً 🔴 (اشرب ماء، راجع الطبيب اليوم)
• 250-299: خطير 🔴 (راجع الطبيب أو الطوارئ فوراً)
• 300-399: خطير جداً 🚨 (اذهب للطوارئ الآن)
• 400+: طارئ طبي 🚨 (اتصل بالإسعاف فوراً)
` : ""}

═══════════════════════════════════════
القواعد الطبية — ضغط الدم
═══════════════════════════════════════
${patient.condition === "hypertension" ? `
تصنيف الضغط (AHA/ACC 2025):
• < 90/60: منخفض
• 90-119 / 60-79: طبيعي ✅
• 120-129 / < 80: مرتفع قليلاً ⚠️
• 130-139 / 80-89: المرحلة الأولى ⚠️
• 140-179 / 90-119: المرحلة الثانية 🔴
• ≥ 180 / ≥ 120: أزمة ضغط — طوارئ فورية 🚨
` : ""}

═══════════════════════════════════════
قواعد الرد الإلزامية
═══════════════════════════════════════
يجب التصعيد فوراً: سكر < 54 أو > 400، ضغط > 180/120، ألم صدر + ضيق تنفس، فقدان وعي.
ممنوع: تشخيص قاطع، إيقاف دواء، جرعة محددة، تطمين على أعراض خطيرة.
يجب: ذكر مراجعة الطبيب للحالات المتوسطة، لغة عربية واضحة ودافئة.

═══════════════════════════════════════
تنسيق الرد
═══════════════════════════════════════
📊 **تقييم القراءة:** (حالة القراءة)
💊 **التوصيات:** • نقطة • نقطة
⚠️ **متى تراجع الطبيب:** (الحالات)
🏥 "هذه المعلومات توعوية فقط ولا تُغني عن استشارة الطبيب المختص"`;

    const recentMessages = chatHistory.slice(-6).map(msg => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text
    }));

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...recentMessages,
          { role: "user", content: message }
        ],
        temperature: 0.6,
        max_tokens: 800,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq API error:", errText);
      return "عذراً، حدث خطأ في الاتصال بخدمة الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.";
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    console.error("AI response error:", error);
    return "عذراً، حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى لاحقاً.";
  }
}

// ==================== STATS API ====================

app.get("/make-server-2063e5bc/stats", async (c) => {
  try {
    const patients = await getAllPatients();

    const totalPatients = patients.length;
    const diabetesPatients = patients.filter(p => p?.condition === "diabetes").length;
    const hypertensionPatients = patients.filter(p => p?.condition === "hypertension").length;

    const needsAttention = patients.filter(p => {
      if (!p || !p.lastReading) return true;
      if (p.condition === "diabetes") {
        const reading = Number(p.lastReading);
        return !isNaN(reading) && (reading > 180 || reading < 70);
      } else {
        return p.lastReading?.systolic > 140 || p.lastReading?.diastolic > 90;
      }
    }).length;

    return c.json({
      success: true,
      data: { totalPatients, diabetesPatients, hypertensionPatients, needsAttention }
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return c.json({ success: false, error: `Error fetching stats: ${error.message}` }, 500);
  }
});

// ==================== HEALTH CHECK ====================

app.get("/make-server-2063e5bc/health", async (c) => {
  const health: any = {
    status: "ok",
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!Deno.env.get("SUPABASE_URL"),
      hasServiceRoleKey: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      hasGroqKey: !!Deno.env.get("groq_api_key"),
    },
  };

  try {
    const ids = await getPatientIds();
    health.database = "connected";
    health.patientsCount = ids.length;
  } catch (error) {
    health.database = "error";
    health.databaseError = error.message;
  }

  return c.json(health);
});

Deno.serve(app.fetch);
