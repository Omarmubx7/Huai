Design a full Arabic RTL medical chatbot web app prototype for a hackathon. The app is specialized for diabetes (سكري) and hypertension (ضغط الدم) patients. All UI text must be in Arabic, RTL layout. Dark theme throughout.

═══════════════════════════════
🎨 DESIGN SYSTEM
═══════════════════════════════

Color Palette:
- Background: #0f172a (deep navy)
- Surface: #1e293b
- Card: rgba(255,255,255,0.06)
- Border: rgba(255,255,255,0.08)
- Primary Blue: #0ea5e9
- Primary Glow: #38bdf8
- Diabetes Accent: #f59e0b (amber)
- Hypertension Accent: #ef4444 (red)
- Success: #22c55e
- Warning: #f59e0b
- Danger: #ef4444
- Text Primary: #f1f5f9
- Text Secondary: #94a3b8
- Text Muted: #475569

Typography:
- Font: Segoe UI / Tajawal (Arabic support)
- Headings: Bold 700-800
- Body: Regular 400, 14-15px
- Labels: 11-12px, #94a3b8

Border radius: 14-24px rounded cards
Shadows: 0 32px 80px rgba(0,0,0,0.6) for main container
Glass effect: backdrop-filter blur(10px) on cards

═══════════════════════════════
📱 SCREEN 1 — ONBOARDING / WELCOME
═══════════════════════════════

Full screen dark background gradient (135deg, #0f172a → #1e293b → #0f2027)
Centered card, max-width 440px, border-radius 24px, glass morphism style

Top section:
- Animated pulse circle with medical cross icon ✚ in gradient blue
- Large heading: "مرحباً بك في مساعدك الصحي" (bold, white, 24px)
- Subtitle: "نظام ذكاء اصطناعي متخصص في السكري وضغط الدم" (gray, 14px)

Step 1 — Choose condition (two large cards side by side):
Left card (Diabetes):
- Icon: 🩸 large (32px)
- Title: "السكري" bold white 18px
- Subtitle: "متابعة سكر الدم" gray 12px
- Amber border on hover/selected: #f59e0b
- Background: rgba(245,158,11,0.08)

Right card (Hypertension):
- Icon: ❤️ large (32px)
- Title: "ضغط الدم" bold white 18px
- Subtitle: "متابعة ضغط الدم" gray 12px
- Red border on hover/selected: #ef4444
- Background: rgba(239,68,68,0.08)

Step 2 — Name input (appears after selecting condition):
- Label: "ما اسمك؟" right-aligned gray
- Input field: dark bg, rounded-14, RTL placeholder "أدخل اسمك الكريم..."
- Blue focus border #0ea5e9

Step 3 — Reading input (after name):
FOR DIABETES:
- Label: "آخر قراءة لسكر الدم (mg/dL)"
- Number input with large font display
- Slider visual from 40 to 400
- Color-coded indicator below: أقل من 70 = blue, 70-130 = green, 131-180 = amber, 180+ = red
- Second input: "متى أجريت القراءة؟" dropdown (الآن / منذ ساعة / منذ ساعتين / منذ 3 ساعات / اليوم الصبح / أمس)

FOR HYPERTENSION:
- Label: "آخر قراءة لضغط الدم"
- Two inputs side by side: Systolic (الانقباضي) / Diastolic (الانبساطي)
- Format display: "120 / 80 mmHg" large centered
- Color-coded status below
- Same time dropdown

Progress dots at bottom: 3 dots showing current step

CTA Button: "ابدأ المحادثة ←" full width, gradient blue, rounded-14, 50px height

═══════════════════════════════
📱 SCREEN 2A — PATIENT DASHBOARD (DIABETES)
═══════════════════════════════

Main container: 480px wide, 92vh height, rounded-24, dark

── HEADER (Diabetes theme - amber accents) ──
Background: linear-gradient(135deg, #2d1f00, #1a1200)
Top border: 3px solid #f59e0b

Row 1:
- Avatar circle (54px): gradient amber #f59e0b → #d97706, icon 🩸
- Name: bold white 17px RTL
- Age + "سكري النوع 2": gray 13px
- Top right badge: "🟢 متصل" with glass background

Row 2 — Stats cards (3 cards):
Card 1 — Blood Sugar:
- Label: "آخر قراءة" gray 11px
- Value: "187" large 24px colored based on status
- Unit: "mg/dL" small gray
- Status badge: "🔴 مرتفع" colored pill

Card 2 — Target Range:
- Label: "المدى المستهدف"
- Value: "80-130" white bold
- Small progress bar showing where 187 falls

Card 3 — Medications:
- Label: "💊 الأدوية"
- Two pill badges: "ميتفورمين 1000mg" and "جليبيزيد 5mg"
- Amber tinted glass cards for each

── CHAT AREA ──
Background: #0f172a
Scrollable, flex column, gap 12px

Assistant message bubble (left aligned):
- Robot avatar 🤖 circle (32px) gradient blue, bottom-left
- Bubble: glass background rgba(255,255,255,0.07), border rgba(255,255,255,0.1)
- Border radius: 18px 18px 18px 4px
- Text: white 14px RTL, line-height 1.7
- Timestamp: small gray below left

User message bubble (right aligned):
- Bubble: gradient blue #0ea5e9 → #0284c7
- Border radius: 18px 18px 4px 18px
- Text: white 14px RTL
- Timestamp: small gray below right

Typing indicator (assistant thinking):
- Same robot avatar
- Bubble with 3 animated dots bouncing in sequence (blue dots, #38bdf8)

── QUICK SUGGESTIONS STRIP ──
Horizontal scroll, background #0f172a, padding 8px 16px
Pill buttons (glass blue):
"فقدت الإحساس بقدمي" | "أشعر بدوخة" | "قراءتي مرتفعة" | "ماذا آكل؟" | "نسيت دوائي" | "جرح ما يلتئم" | "عيوني تعبت"
Style: border rgba(14,165,233,0.3), background rgba(14,165,233,0.1), color #38bdf8, rounded-20

── INPUT AREA ──
Background: #0f172a, padding 12px 16px 20px
- Input: dark glass, border rgba(255,255,255,0.12), rounded-14, RTL placeholder "اكتب كيف تشعر الآن..."
- Blue focus glow on focus
- Send button: 46x46px rounded-14, gradient blue when active, disabled state when empty
- Send icon: ➤ arrow

═══════════════════════════════
📱 SCREEN 2B — PATIENT DASHBOARD (HYPERTENSION)
═══════════════════════════════

Same layout as diabetes but:
- Theme color: #ef4444 red instead of amber
- Header gradient: #2d0000 → #1a0000, top border red
- Avatar: gradient red, icon ❤️
- Blood pressure display: "138 / 88 mmHg" large
- Status: "⚠️ مرتفع قليلاً" in amber
- Two reading values: Systolic + Diastolic side by side in stats
- Quick suggestions: "صداع شديد" | "دوخة مفاجئة" | "ضغطي مرتفع" | "أشعر بضيق صدر" | "نسيت دوائي" | "هل الملح خطر؟" | "تعب عام"

═══════════════════════════════
📱 SCREEN 3 — ADMIN DASHBOARD
═══════════════════════════════

Full page layout, sidebar + main content, dark theme

── LEFT SIDEBAR (240px) ──
Background: #1e293b
Top: App logo + "لوحة الإدارة" title + "مدير النظام" subtitle
Navigation items (RTL, icon + label):
- 📊 نظرة عامة (active)
- 👥 المرضى
- 🩸 مرضى السكري
- ❤️ مرضى الضغط
- 🔔 التنبيهات
- ⚙️ الإعدادات
Bottom: Avatar + admin name + logout button

── MAIN CONTENT ──

Top bar: greeting "مساء الخير، د. محمد 👋" + date + notification bell with badge

── STATS OVERVIEW CARDS (4 cards in a row) ──
Card 1: "👥 إجمالي المرضى" — value "24" large blue
Card 2: "🩸 مرضى السكري" — value "14" amber
Card 3: "❤️ مرضى الضغط" — value "10" red
Card 4: "⚠️ يحتاجون متابعة" — value "5" orange — pulsing red dot

Each card: glass morphism, colored left border, icon top right

── ALERTS SECTION ──
Header: "🔴 تنبيهات تحتاج انتباه فوري"
3 alert cards stacked:
- Red card: "أحمد الزهراني — سكر: 312 mg/dL 🔴 مرتفع جداً — منذ 10 دقائق" + "إرسال تنبيه" button
- Orange card: "سارة المطيري — ضغط: 165/100 mmHg ⚠️ — منذ 30 دقيقة" + button
- Yellow card: "محمد الغامدي — لم يسجل قراءة منذ يومين ⚠️" + button

── PATIENTS TABLE ──
Header: "جميع المرضى" + search bar (RTL) + "إضافة مريض +" button (blue)
Table columns (RTL): الاسم | النوع | آخر قراءة | الحالة | آخر تسجيل | إجراءات

Rows alternating subtle bg:
Row 1: أحمد الزهراني | 🩸 سكري | 312 mg/dL | 🔴 مرتفع | منذ 10 دقائق | [👁 عرض] [🔔 تنبيه] [🗑 حذف]
Row 2: سارة المطيري | ❤️ ضغط | 165/100 | ⚠️ مرتفع | منذ 30 دقيقة | [buttons]
Row 3: خالد العتيبي | 🩸 سكري | 98 mg/dL | ✅ طبيعي | منذ ساعة | [buttons]
Row 4: فاطمة الحربي | ❤️ ضغط | 118/76 | ✅ طبيعي | منذ ساعتين | [buttons]
Row 5: محمد الغامدي | 🩸 سكري | — | ⚠️ لا يوجد | منذ يومين | [buttons]

Status pills: rounded-full, color-coded glass pills

Action buttons: small, icon-only, glass style, colored on hover

── ADD PATIENT MODAL ──
Overlay dark blur background
Modal card: 400px, rounded-24, dark surface
Title: "إضافة مريض جديد +"
Fields:
- الاسم الكريم (text input)
- نوع الحالة: two toggle pills "🩸 سكري" / "❤️ ضغط"
- العمر (number)
- الأدوية (text, optional)
- آخر قراءة (number)
Two buttons: "إلغاء" (ghost) + "إضافة المريض" (blue gradient)

── SEND ALERT MODAL ──
Modal: 380px
Patient name shown at top in a pill
Message textarea: "اكتب رسالة التنبيه للمريض..." RTL
Quick templates row: "قراءتك مرتفعة، راجع الطبيب" | "تذكير بالدواء" | "موعد متابعة"
Send button: full width blue gradient "إرسال التنبيه 🔔"

═══════════════════════════════
📱 SCREEN 4 — PATIENT SELECTOR (Login/Switch)
═══════════════════════════════

Centered, dark background
Title: "اختر ملفك الشخصي" or "من أنت؟"
Grid of patient cards (2 columns):
Each card:
- Avatar circle with initials or emoji
- Name bold
- Condition pill: 🩸 سكري or ❤️ ضغط
- Last reading small gray
- Hover: blue glow border, scale up slightly
Bottom: "➕ مريض جديد" outline button full width
Admin access: small text link bottom "دخول الإدارة 🔐"

═══════════════════════════════
🎬 INTERACTIONS & ANIMATIONS
═══════════════════════════════

- Onboarding: slide-in from right per step, smooth 300ms
- Condition cards: scale 1.03 on hover, border glow animation
- Chat bubbles: fade + slide up on appear
- Typing dots: bounce animation staggered 0.2s delay
- Quick suggestion pills: background lighten on hover
- Admin table rows: subtle highlight on hover
- Status badges: pulse animation on danger states
- Modal: fade in + scale from 0.95 to 1
- Send button: ripple effect on click
- All transitions: 0.2s ease

═══════════════════════════════
📐 LAYOUT SPECS
═══════════════════════════════

Patient dashboard: 480px max-width, centered, 92vh, mobile-first feel
Admin dashboard: full width desktop, min 1200px, sidebar layout
All text: RTL direction, text-align right
Scrollbars: custom thin (4px), rgba(255,255,255,0.1) thumb
Mobile responsive: stack sidebar on small screens