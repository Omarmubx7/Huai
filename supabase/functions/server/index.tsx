import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";

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

// ==================== DIRECT SUPABASE REST HELPERS ====================
// Bypasses the supabase-js client and calls the PostgREST REST API directly.
// This avoids any supabase-js client initialization issues.

const TABLE = "kv_store_2063e5bc";

function getSupabaseHeaders() {
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  return {
    "apikey": key,
    "Authorization": `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

function supabaseUrl(path: string) {
  const base = (Deno.env.get("SUPABASE_URL") || "").replace(/\/$/, "");
  return `${base}/rest/v1/${path}`;
}

async function dbGet(key: string): Promise<any> {
  const res = await fetch(
    supabaseUrl(`${TABLE}?key=eq.${encodeURIComponent(key)}&select=value`),
    { headers: getSupabaseHeaders() }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`dbGet failed [${res.status}]: ${body}`);
  }
  const rows = await res.json();
  return rows.length > 0 ? rows[0].value : null;
}

async function dbSet(key: string, value: any): Promise<void> {
  const res = await fetch(supabaseUrl(TABLE), {
    method: "POST",
    headers: { ...getSupabaseHeaders(), "Prefer": "resolution=merge-duplicates" },
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`dbSet failed [${res.status}]: ${body}`);
  }
}

async function dbDel(key: string): Promise<void> {
  const res = await fetch(
    supabaseUrl(`${TABLE}?key=eq.${encodeURIComponent(key)}`),
    { method: "DELETE", headers: getSupabaseHeaders() }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`dbDel failed [${res.status}]: ${body}`);
  }
}

async function dbMget(keys: string[]): Promise<any[]> {
  if (keys.length === 0) return [];
  const list = keys.map((k) => `"${k}"`).join(",");
  const res = await fetch(
    supabaseUrl(`${TABLE}?key=in.(${list})&select=key,value`),
    { headers: getSupabaseHeaders() }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`dbMget failed [${res.status}]: ${body}`);
  }
  const rows: { key: string; value: any }[] = await res.json();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return keys.map((k) => map.get(k) ?? null);
}

// ==================== PATIENT INDEX HELPERS ====================

const PATIENTS_INDEX_KEY = "patients_index_2063e5bc";

async function getPatientIds(): Promise<string[]> {
  const ids = await dbGet(PATIENTS_INDEX_KEY);
  return Array.isArray(ids) ? ids : [];
}

async function addPatientToIndex(id: string): Promise<void> {
  const ids = await getPatientIds();
  if (!ids.includes(id)) {
    ids.push(id);
    await dbSet(PATIENTS_INDEX_KEY, ids);
  }
}

async function removePatientFromIndex(id: string): Promise<void> {
  const ids = await getPatientIds();
  await dbSet(PATIENTS_INDEX_KEY, ids.filter((i) => i !== id));
}

async function getAllPatients(): Promise<any[]> {
  const ids = await getPatientIds();
  if (ids.length === 0) return [];
  const patients = await dbMget(ids.map((id) => `patient:${id}`));
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
    const patient = await dbGet(`patient:${id}`);
    if (!patient) return c.json({ success: false, error: "Patient not found" }, 404);
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
    await dbSet(`patient:${id}`, patient);
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
    const existing = await dbGet(`patient:${id}`);
    if (!existing) return c.json({ success: false, error: "Patient not found" }, 404);
    const updated = { ...existing, ...body, id };
    await dbSet(`patient:${id}`, updated);
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating patient:", error);
    return c.json({ success: false, error: `Error updating patient: ${error.message}` }, 500);
  }
});

app.delete("/make-server-2063e5bc/patients/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await dbDel(`patient:${id}`);
    await dbDel(`readings:${id}`);
    await dbDel(`chat:${id}`);
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
    const existingReadings = await dbGet(`readings:${patientId}`) || [];
    const reading = {
      id: crypto.randomUUID(),
      patientId,
      value: body.value,
      timestamp: new Date().toISOString(),
      timeOfReading: body.timeOfReading || "الآن",
    };
    existingReadings.push(reading);
    await dbSet(`readings:${patientId}`, existingReadings);
    const patient = await dbGet(`patient:${patientId}`);
    if (patient) {
      patient.lastReading = body.value;
      patient.lastReadingTime = reading.timestamp;
      await dbSet(`patient:${patientId}`, patient);
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
    const readings = await dbGet(`readings:${patientId}`) || [];
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
    const messages = await dbGet(`chat:${patientId}`) || [];
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

    const [patient, readings, existingChat] = await Promise.all([
      dbGet(`patient:${patientId}`),
      dbGet(`readings:${patientId}`).then(r => r || []),
      dbGet(`chat:${patientId}`).then(c => c || []),
    ]);

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

    await dbSet(`chat:${patientId}`, existingChat);
    return c.json({ success: true, data: { userMessage: userMsg, aiMessage: aiMsg } });
  } catch (error) {
    console.error("Error in chat:", error);
    return c.json({ success: false, error: `Error in chat: ${error.message}` }, 500);
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
  الإجراء: اتصل بالإسعاف فوراً. خطر فقدان الوعي. لا تعطِ سائل لمريض فاقد الوعي.

• 54–69 mg/dL → منخفض — تدخل فوري ⬇️
  الإجراء: 15 غرام كربوهيدرات سريعة (4 أقراص غلوكوز أو نصف كوب عصير برتقال أو 3 ملاعق سكر). أعد القياس بعد 15 دقيقة.

• 70–99 mg/dL → طبيعي صائماً ✅
  الإجراء: قراءة ممتازة. استمر في نمط حياتك الصحي.

• 100–125 mg/dL → ما قبل السكري ⚠️
  الإجراء: مراجعة طبيب وتغيير نمط الحياة. قابل للعكس بالتغذية والرياضة.

• 126–139 mg/dL → مرتفع قليلاً 🔸
  الإجراء: تجنب السكريات والنشويات البيضاء. شرب الماء يساعد.

• 140–179 mg/dL → مرتفع ⚠️
  الإجراء: تجنب الأكل السكري. المشي الخفيف 15 دقيقة قد يساعد.

• 180–249 mg/dL → مرتفع جداً 🔴
  الإجراء: اشرب ماء كثيراً. لا تمارس رياضة شاقة. راجع الطبيب اليوم.

• 250–299 mg/dL → خطير 🔴
  الإجراء: تحقق من كيتونات البول. راجع الطوارئ فوراً.

• 300–399 mg/dL → خطير جداً 🚨
  الإجراء: اذهب للطوارئ الآن. خطر الحماض الكيتوني (DKA).

• ≥ 400 mg/dL → طارئ طبي 🚨
  الإجراء: اتصل بالإسعاف فوراً. مهدد للحياة.

─────────────────────────────────────
الرياضة والسكر — ADA 2024
─────────────────────────────────────
• سكر < 100 → تناول 15-30 غرام كربوهيدرات قبل البدء
• 100–250 → آمن لممارسة الرياضة المعتدلة
• > 250 → تجنب الرياضة الشاقة، تحقق من الكيتونات (النوع الأول)
• > 300 → لا تمارس رياضة حتى ينخفض السكر

─────────────────────────────────────
التغذية — السكري
─────────────────────────────────────
تجنب: مشروبات غازية، عصائر معلبة، سكر أبيض، خبز أبيض، فواكه بكميات كبيرة (تمر، مانجو، عنب).
مسموح: خضروات ورقية، دجاج بدون جلد، سمك، بيض، مكسرات غير مملحة، ماء 8-10 أكواب.

─────────────────────────────────────
معلومات الأدوية — السكري
─────────────────────────────────────
• ميتفورمين: مع الأكل. غثيان في البداية طبيعي. نقص B12 على المدى الطويل.
• غليبنكلاميد/جليبيزيد: قبل الأكل بـ30 دقيقة. ⚠️ خطر انخفاض السكر إذا تأخر الأكل.
• سيتاغليبتين: في أي وقت. نادر الآثار الجانبية.
• إمباغليفلوزين: الصباح. قد يسبب التهاب مسالك بولية. أوقفه قبل العمليات بـ3 أيام.
• الأنسولين: في الثلاجة قبل الفتح. بعد الفتح في الغرفة 28 يوم. دوّر مواضع الحقن.
` : ""}

${patient?.condition === "hypertension" ? `
═══════════════════════════════════════
تصنيف ضغط الدم — AHA/ACC 2025
═══════════════════════════════════════
• < 90/60 → منخفض
  الإجراء: اشرب سوائل. إذا شعرت بدوخة اجلس فوراً. راجع الطبيب إذا تكرر.

• 90-119 / 60-79 → طبيعي ✅
  الإجراء: قراءة ممتازة. حافظ على نمط حياتك.

• 120-129 / < 80 → مرتفع قليلاً ⚠️
  الإجراء: تجنب الملح والتوتر. الرياضة تساعد.

• 130-139 / 80-89 → المرحلة الأولى ⚠️
  الإجراء: تقليل الملح، رياضة، خفض الوزن. قد يحتاج بدء دواء.

• 140-179 / 90-119 → المرحلة الثانية 🔴
  الإجراء: راجع الطبيب قريباً. يحتاج دوائين أو أكثر. تجنب المجهود الشديد.

• > 180 انقباضي أو > 120 انبساطي → أزمة ضغط 🚨
  الإجراء: اتصل بالإسعاف فوراً. اجلس وارتاح. لا تأخذ دواء إضافي.

─────────────────────────────────────
أعراض أزمة الضغط — صعّد فوراً
─────────────────────────────────────
🚨 صداع شديد مفاجئ في مؤخرة الرأس
🚨 ضبابية الرؤية أو فقدان البصر المفاجئ
🚨 ألم شديد في الصدر
🚨 ضيق في التنفس المفاجئ
🚨 ضعف أو تنميل في الوجه أو الذراع
🚨 صعوبة في الكلام أو فقدان التوازن

─────────────────────────────────────
التغذية — نظام DASH
─────────────────────────────────────
الصوديوم: أقل من 2300 ملغ يومياً (ملعقة صغيرة). الهدف: 1500 ملغ.
تجنب: الملح الزائد، المعلبات، المخللات، اللحوم المصنعة، وجبات سريعة.
مسموح: خضروات وفواكه، أسماك دهنية، ألبان قليلة الدسم، ثوم.

─────────────────────────────────────
معلومات الأدوية — ضغط الدم
─────────────────────────────────────
• أملوديبين: مرة يومياً في أي وقت. تورم الكاحلين شائع في البداية.
• لوسارتان: مرة أو مرتين. ⚠️ ممنوع تماماً أثناء الحمل.
• ليسينوبريل: مرة يومياً. سعال جاف شائع — راجع الطبيب إذا ظهر.
• هيدروكلوروثيازيد: الصباح فقط. راقب البوتاسيوم.
• أتينولول: ⚠️ لا توقفه فجأة — قلل تدريجياً تحت إشراف طبي.
` : ""}

═══════════════════════════════════════
التصعيد الفوري — دائماً
═══════════════════════════════════════
🚨 فقدان الوعي أو التشنجات
🚨 ألم صدر + ضيق تنفس معاً
🚨 شلل أو تنميل في وجه أو طرف
🚨 صعوبة كلام مفاجئة أو فقدان بصر
🚨 صداع رعدي (الأشد في الحياة)

═══════════════════════════════════════
قواعد الرد الإلزامية
═══════════════════════════════════════
❌ لا تعطِ تشخيصاً قاطعاً
❌ لا تقل للمريض أن يوقف دوائه
❌ لا تعطِ جرعة دواء محددة
❌ لا تطمئن على أعراض خطيرة

✅ اذكر مراجعة الطبيب لكل حالة متوسطة أو خطيرة
✅ للطوارئ: اطلب الإسعاف صراحةً
✅ لغة عربية واضحة دافئة داعمة

═══════════════════════════════════════
تنسيق الرد
═══════════════════════════════════════
📊 **تقييم القراءة:** (التصنيف الطبي الدقيق)
💊 **التوصيات:** • نقطة • نقطة • نقطة
⚠️ **متى تراجع الطبيب:** (الحالات)
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
        temperature: 0.6,
        max_tokens: 800,
        top_p: 0.9,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Groq API error:", err);
      return "عذراً، حدث خطأ في الاتصال بخدمة الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.";
    }

    const data = await res.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("AI error:", error);
    return "عذراً، حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى لاحقاً.";
  }
}

// ==================== STATS API ====================

app.get("/make-server-2063e5bc/stats", async (c) => {
  try {
    const patients = await getAllPatients();
    const totalPatients = patients.length;
    const diabetesPatients = patients.filter((p: any) => p?.condition === "diabetes").length;
    const hypertensionPatients = patients.filter((p: any) => p?.condition === "hypertension").length;
    const needsAttention = patients.filter((p: any) => {
      if (!p?.lastReading) return true;
      if (p.condition === "diabetes") {
        const v = Number(p.lastReading);
        return !isNaN(v) && (v > 180 || v < 70);
      }
      return p.lastReading?.systolic > 140 || p.lastReading?.diastolic > 90;
    }).length;
    return c.json({ success: true, data: { totalPatients, diabetesPatients, hypertensionPatients, needsAttention } });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return c.json({ success: false, error: `Error fetching stats: ${error.message}` }, 500);
  }
});

// ==================== HEALTH CHECK ====================

app.get("/make-server-2063e5bc/health", async (c) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const health: any = {
    status: "ok",
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!supabaseUrl,
      supabaseUrlPrefix: supabaseUrl.substring(0, 30),
      hasServiceRoleKey: !!serviceKey,
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
