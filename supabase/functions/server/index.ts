import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import { get as dbGet, set as dbSet, del as dbDel, mget as dbMget, getByPrefix } from "./kv_store.ts";

const app = new Hono().basePath("/server");

app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  maxAge: 600,
}));

// ==================== AUTH MIDDLEWARE ====================

// Verify JWT and extract user ID
async function verifyAuth(c: any): Promise<{ userId: string; isAdmin: boolean; token: string } | null> {
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
    return { userId: user.id, isAdmin: !!isAdmin, token };
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
app.use("*", async (c, next) => {
  if (c.req.method === "OPTIONS") return next();
  if (c.req.path.endsWith("/health")) return next();
  const auth = await verifyAuth(c);
  if (!auth) return c.json({ success: false, error: "Unauthorized" }, 401);
  c.set("userId", auth.userId);
  c.set("isAdmin", auth.isAdmin);
  c.set("token", auth.token);
  return next();
});

// Helper to get user-scoped Supabase client
function getSupabase(c: any) {
  return createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_ANON_KEY") || "",
    { global: { headers: { Authorization: `Bearer ${c.get("token")}` } } }
  );
}

// ==================== CHAT API ====================
app.post("/chat/:patientId", async (c) => {
  try {
    const userId = c.get("userId");
    if (!checkRateLimit(userId)) {
      return c.json({ success: false, error: "محاولات كثيرة، يرجى الانتظار قليلاً" }, 429);
    }
    const patientId = c.req.param("patientId");
    const body = await c.req.json();
    const userMessage = body.message;
    if (!userMessage || typeof userMessage !== "string" || userMessage.trim().length === 0) {
      return c.json({ success: false, error: "الرسالة مطلوبة" }, 400);
    }
    
    const supabase = getSupabase(c);

    // Fetch context from Postgres
    const [patientRes, readingsRes, chatRes] = await Promise.all([
      supabase.from("patients").select("*").eq("id", patientId).single(),
      supabase.from("readings").select("*").eq("patientid", patientId).order("timestamp", { ascending: true }),
      supabase.from("chat_messages").select("*").eq("patientid", patientId).order("timestamp", { ascending: true })
    ]);

    if (patientRes.error || !patientRes.data) {
      return c.json({ success: false, error: "Patient not found" }, 404);
    }

    const patient = patientRes.data;
    const readings = readingsRes.data || [];
    const chatHistory = chatRes.data || [];

    // Save user message to Postgres
    const { data: userMsg, error: userErr } = await supabase.from("chat_messages").insert({
      patientid: patientId,
      user_id: userId,
      text: userMessage.trim(),
      sender: "user"
    }).select().single();

    if (userErr) throw new Error("Failed to save user message: " + userErr.message);

    // Get AI response
    const aiResponse = await getAIResponse(userMessage.trim(), patient, readings, chatHistory);

    // Save AI message to Postgres
    const { data: aiMsg, error: aiErr } = await supabase.from("chat_messages").insert({
      patientid: patientId,
      user_id: userId,
      text: aiResponse,
      sender: "assistant"
    }).select().single();

    if (aiErr) throw new Error("Failed to save AI message: " + aiErr.message);

    return c.json({ success: true, data: { userMessage: userMsg, aiMessage: aiMsg } });
  } catch (error: any) {
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

    const systemPrompt = `أنت الخبير الطبي الذكي (Expert AI Health Advisor) الخاص بـ ${conditionArabic}. مهمتك هي تقديم دعم تحليلي، طبي، ونفسي عالي المستوى للمريض.

═══════════════════════════════════════
🎯 هويتك وأسلوبك
═══════════════════════════════════════
• **الذكاء التحليلي**: لا تكتفِ بوصف القراءة، بل قارنها بالقراءات السابقة (${recentReadings}) وابحث عن الأنماط (هل السكر يرتفع دائماً في هذا الوقت؟).
• **التعاطف المهني**: تحدث كطبيب صديق، شجع المريض عند التحسن، وكن حازماً وهادئاً عند الخطر.
• **الدقة العلمية**: استند دائماً إلى أحدث البروتوكولات (ADA 2024 / AHA 2025).

═══════════════════════════════════════
📋 بيانات المريض الحالية
═══════════════════════════════════════
• الاسم: ${patient?.name || "المريض"}
• الحالة: ${conditionArabic}
• آخر قراءة: ${patient?.lastReading || "لا توجد"}
• السجل الأخير: ${recentReadings || "لا يوجد سجل"}
• الأدوية: ${(patient?.medications || []).join("، ") || "لا يوجد أدوية مسجلة"}

═══════════════════════════════════════
🔍 إرشادات الرد الذكي
═══════════════════════════════════════
1. **الربط المنطقي**: إذا كانت القراءة مرتفعة، اسأل عن (الأكل، التوتر، أو نسيان الدواء).
2. **التنظيم**: استخدم العناوين العريضة والقوائم.
3. **الوقاية**: قدم نصيحة وقائية واحدة بناءً على الحالة (مثلاً: "تذكر شرب الماء" أو "المشي لمدة 10 دقائق").
4. **الأمان**: 
   ❌ لا تصف أدوية جديدة.
   ❌ لا تطلب إيقاف الدواء.
   🚨 وجه للطوارئ فوراً إذا كانت القراءات في "نطاق الخطر الأحمر" الموضح أدناه.

═══════════════════════════════════════
📊 المراجع الطبية (لتحليلك الخاص)
═══════════════════════════════════════
${patient?.condition === "diabetes" ? `
• تحت 70: منخفض جداً (خطر 🚨) - تناول 15جم سكر سريع.
• 70-130: ممتاز (هدف الصيام) ✅.
• 130-180: مقبول (بعد الأكل) ⚠️.
• فوق 250: مرتفع جداً (🔴) - استشر طبيبك.
` : `
• تحت 120/80: مثالي ✅.
• 120-139 / 80-89: بداية ارتفاع ⚠️.
• فوق 140/90: مرتفع (مرحلة 2) 🔴.
• فوق 180/120: أزمة ضغط (طوارئ 🚨).
`}

⚠️ هذا المساعد للوعي الصحي فقط.`;

    const recentMessages = chatHistory.slice(-10).map((msg: any) => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text,
    }));

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey.trim()}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: systemPrompt }, ...recentMessages, { role: "user", content: message }],
        temperature: 0.7, max_tokens: 1000, top_p: 0.9,
      }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("Groq API Error:", res.status, errorData);
      return `عذراً، حدث خطأ في الاتصال بخدمة الذكاء الاصطناعي (Error ${res.status})`;
    }
    const data = await res.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("AI error:", error);
    return "عذراً، حدث خطأ في معالجة طلبك.";
  }
}

// ==================== ADMIN MIGRATE ====================
app.post("/admin/migrate", async (c) => {
  try {
    const userId = c.get("userId");
    const isAdmin = c.get("isAdmin");
    if (!isAdmin) return c.json({ success: false, error: "Unauthorized" }, 403);
    
    const legacyIds = await dbGet("patients_index");
    if (!legacyIds || !Array.isArray(legacyIds)) {
      return c.json({ success: true, message: "لا توجد بيانات قديمة للترحيل" });
    }
    
    const supabase = getSupabase(c);
    let migratedCount = 0;
    
    for (const id of legacyIds) {
      const patient = await dbGet(`patient:${id}`);
      if (patient) {
        // Insert into Postgres
        await supabase.from("patients").insert({
          id: patient.id,
          user_id: userId,
          name: patient.name,
          age: patient.age,
          condition: patient.condition,
          medications: patient.medications,
          lastreading: patient.lastReading,
          lastreadingtime: patient.lastReadingTime,
          createdat: patient.createdAt
        });
        
        const readings = await dbGet(`readings:${id}`);
        if (readings && Array.isArray(readings)) {
          for (const r of readings) {
            await supabase.from("readings").insert({
              id: r.id,
              user_id: userId,
              patientid: patient.id,
              value: r.value,
              timestamp: r.timestamp,
              timeofreading: r.timeOfReading
            });
          }
        }
        
        const chat = await dbGet(`chat:${id}`);
        if (chat && Array.isArray(chat)) {
          for (const m of chat) {
            await supabase.from("chat_messages").insert({
              id: m.id,
              user_id: userId,
              patientid: patient.id,
              text: m.text,
              sender: m.sender,
              timestamp: m.timestamp
            });
          }
        }
        
        migratedCount++;
      }
    }
    await dbDel("patients_index");
    return c.json({ success: true, message: `تم ترحيل ${migratedCount} مريض بنجاح إلى قاعدة البيانات.` });
  } catch (error: any) {
    return c.json({ success: false, error: `Error: ${error.message}` }, 500);
  }
});

// ==================== HEALTH CHECK (sanitized) ====================
app.get("/health", async (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

Deno.serve(app.fetch);
