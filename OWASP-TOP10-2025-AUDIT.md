# OWASP Top 10 2025 — التقرير الشامل لأمن النظام

**تاريخ الفحص:** 8 مايو 2026  
**النظام:** Turfah — منصة إدارة التطوع  
**البيئة:** Next.js 16 + Supabase + Clerk

---

## ملخص النتائج

| المستوى | العدد |
|---------|-------|
| **CRITICAL** | **10** |
| **HIGH** | **14** |
| **MEDIUM** | **14** |
| **LOW** | **6** |
| **المجموع** | **44** |

---

# A01:2025 — Broken Access Control (تحكم الوصول المكسور)

### CRITICAL — C1: Public Certificate Page تستخدم Service Role Key

**الملف:** `src/app/certificate/[id]/page.tsx:11-23`  
**الوصف:** صفحة عامة (بدون Auth) تستخدم `createAdminSupabase()` الذي يتجاوز كل RLS. أي شخص لديه رابط تحقق يمكنه الاستعلام بقاعدة البيانات بصلاحيات كاملة.  
**البيانات المكشوفة:** `full_name, national_id` من جدول `profiles`.  
**الحل:** استخدام anon-key client مع RLS policy تسمح بقراءة عامة للشهادات الموثقة فقط.

### CRITICAL — C2: `profiles` SELECT policy واسعة جداً

**الملف:** `supabase/migrations/003_security_hardening.sql:68`  
**الكود:** `CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);`  
**الوصف:** أي مستخدم مصادق يمكنه قراءة كل الملفات الشخصية (بما فيها `email, phone, national_id_encrypted, role`).  
**الحل:** تقييد SELECT لـ `auth.jwt()->>'sub' = id` للطلاب، وسماح أوسع للمنسقين/المشرفين فقط.

### CRITICAL — C3: `profiles` INSERT policy بدون قيود

**الملف:** `supabase/migrations/003_security_hardening.sql:76`  
**الكود:** `CREATE POLICY "profiles_insert_service_role" ON profiles FOR INSERT WITH CHECK (true);`  
**الوصف:** أي مستخدم يمكنه إدراج ملف شخصي مع أي `role` (بما فيها `super_admin`).  
**الحل:** إضافة `WITH CHECK (auth.jwt()->>'sub' = id)`.

### CRITICAL — C4: `notifications` INSERT policy مفتوحة

**الملف:** `supabase/migrations/003_security_hardening.sql:133`  
**الكود:** `CREATE POLICY "notifications_insert_service" ON notifications FOR INSERT WITH CHECK (true);`  
**الوصف:** أي مستخدم يمكنه إدراج إشعار لأي `user_id` (تزوير إشعارات).  
**الحل:** تقييد إلى `auth.jwt()->>'sub' = user_id`.

### CRITICAL — C5: `createNotification()` بدون أي Auth Check

**الملف:** `src/actions/notifications.ts:16-35`  
**الوصف:** Server Action بدون `currentUser()` Check — أي شخص (حتى غير مصادق) يمكنه استدعاؤها.  
**الحل:** إضافة `currentUser()` في بداية الدالة.

### HIGH — H1: `getSignedDownloadUrl()` بدون Ownership Check

**الملف:** `src/actions/certificates.ts:170-184`  
**الوصف:** تستخدم admin client وتعطي رابط تحميل لأي ملف في storage بدون التحقق من ملكية الطالب.  
**الحل:** التحقق من أن `path` يبدأ بـ `user.id` أو أن المستخدم منسق/مشرف.

### HIGH — H2: `getSignedUploadUrl()` تستخدم Admin Client لكل المستخدمين

**الملف:** `src/actions/certificates.ts:147-168`  
**الوصف:** التعليق يقول صراحة "Use admin client to bypass Storage RLS". أي مستخدم مصادق يحمل صلاحيات Service Role للرفع.  
**الحل:** استخدام user-scoped supabase client.

### HIGH — H3: `createExternalCertificateApplication()` بدون Role Check

**الملف:** `src/actions/certificates.ts:186-222`  
**الوصف:** أي مستخدم مصادق (حتى طالب) يمكنه إنشاء فرص تطوعية في قاعدة البيانات.  
**الحل:** التحقق من أن المستخدم student قبل السماح.

### HIGH — H4: `getContentUploadUrl()` بدون Role Check

**الملف:** `src/actions/content.ts:141-154`  
**الوصف:** أي مستخدم مصادق يمكنه رفع ملفات إلى `site-content` bucket.  
**الحل:** إضافة role check (coordinator/super_admin فقط).

### HIGH — H5: `reviewApplication()` بدون Ownership Check للفرصة

**الملف:** `src/actions/applications.ts:112-168`  
**الوصف:** منسق يمكنه مراجعة طلبات فرص أنشأها منسق آخر.  
**الحل:** التحقق من `created_by` في جدول `opportunities`.

### HIGH — H6: `getAllApplications()` بدون تصفية حسب ملكية المنسق

**الملف:** `src/actions/applications.ts:24-69`  
**الوصف:** منسق يرى كل الطلبات في النظام وليس فقط طلبات فرصه.  
**الحل:** إضافة `.eq('created_by', user.id)` للمنسقين.

### HIGH — H7: `opportunities_insert` بدون التحقق من `created_by`

**الملف:** `supabase/migrations/003_security_hardening.sql:91`  
**الكود:** `WITH CHECK (public.has_role(ARRAY['coordinator', 'super_admin']))`  
**الوصف:** لا يتحقق أن `created_by` يطابق المستخدم الحالي.  
**الحل:** إضافة `AND auth.jwt()->>'sub' = created_by`.

### MEDIUM — M1: Missing Coordinator/Student Layout Role Gate

**الملف:** `src/app/dashboard/coordinator/` — لا يوجد layout مخصص  
**الوصف:** صفحة المنسق والطالب ليس لها server-side role gate. المستخدم يمكنه التنقل إلى `/dashboard/coordinator` مباشرة (يظهر الغلاف ثم خطأ). `admin/layout.tsx` يعيد 404 للمستخدمين غير المصرحين.  
**الحل:** إنشاء `coordinator/layout.tsx` و `student/layout.tsx` مع فحص الصلاحية.

### MEDIUM — M2: Stats Queries غير مفلترة

**الملف:** `src/actions/opportunities.ts:29-39`  
**الوصف:** إحصائيات الفرص تجلب كل البيانات لكل المستخدمين (تسريب معلومات).  
**الحل:** تصفية حسب `created_by` للمنسقين.

### LOW — L1: Middleware بدون Role Check

**الملف:** `src/middleware.ts:11-14`  
**الوصف:** `auth.protect()` يتحقق فقط من المصادقة وليس الصلاحية.  
**الحل:** إضافة فحص roles في middleware.

### LOW — L2: `getOpportunity(id)` بدون Ownership Check

**الملف:** `src/actions/opportunities.ts:60-73`  
**الوصف:** أي مستخدم يمكنه قراءة تفاصيل أي فرصة (بما فيها غير النشطة).  
**الحل:** إضافة فلترة للفرص غير النشطة.

### LOW — L3: `getContentImageUrl()` بدون Auth

**الملف:** `src/actions/content.ts:156-160`  
**الوصف:** لا يوجد Auth — لكن هذا مقبول لأن الصور عامة بالتصميم.

---

# A02:2025 — Cryptographic Failures (فشل التشفير)

### CRITICAL — C6: Encryption Key غير عشوائي

**الملف:** `.env.local:16`  
**الكود:** `ENCRYPTION_KEY=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2`  
**الوصف:** المفتاح يتبع نمط تصاعدي واضح (`a1b2c3d4...`). إذا تم كشفه، كل بطاقات الهوية الوطنية مكشوفة.  
**الحل:** توليد مفتاح عشوائي حقيقي: `crypto.randomBytes(32).toString('hex')` في بيئة الإنتاج.

### CRITICAL — C7: B-tree Index على `national_id` النصي

**الملف:** `supabase/migrations/005_encrypt_pre_registered_national_id.sql:15`  
**الكود:** `CREATE INDEX ON pre_registered_students(national_id)`  
**الوصف:** إضافة Index على العمود النصي العادي مع وجود عمود مشفر يلغي فائدة التشفير — الفهرس يخزن القيم الأصلية في صفحات DB و WAL.  
**الحل:** إسقاط العمود النصي `national_id` بعد الترحيل أو إنشاء الفهرس على `national_id_encrypted`.

### HIGH — H8: Plaintext `national_id` لم يُحذف بعد التشفير

**الملف:** `supabase/migrations/005_encrypt_pre_registered_national_id.sql:6-12`  
**الوصف:** أضيف `national_id_encrypted` لكن العمود النصي القديم لم يُحذف أو يُفرّغ.  
**الحل:** بعد backfill، تنفيذ `UPDATE pre_registered_students SET national_id = NULL` ثم حذف العمود.

### HIGH — H9: Full National ID معروض في المتصفح

**الملف:** `src/app/dashboard/coordinator/students/page.tsx:340`  
**الوصف:** بطاقة الهوية الوطنية الكاملة (10 أرقام) تُفك تشفيرها وتُرسل للواجهة وتُعرض في الجدول.  
**الحل:** إرسال `national_id_last3` فقط وعرض `***$` في الواجهة.

### HIGH — H10: No AEAD (Associated Data) في AES-GCM

**الملف:** `src/lib/encryption.ts:26-33`  
**الوصف:** بدون AAD، يمكن تبديل النصوص المشفرة بين السجلات (swap attack).  
**الحل:** إضافة `cipher.setAAD(userId + recordType)`.

### HIGH — H11: National ID يُفك تشفيره لكل السجلات للتأكد من uniqueness

**الملف:** `src/actions/students.ts:35-49, 104-123, 214-230`  
**الوصف:** في كل إضافة، يُجلب كل السجلات ويُفك تشفيرها واحدة تلو الأخرى — O(n²) وتعريض المفتاح.  
**الحل:** إضافة `national_id_hash SHA-256`، والبحث بـ `.eq('national_id_hash', hash)`.

### MEDIUM — M3: No Key Rotation Support

**الملف:** `src/lib/encryption.ts:11-17`  
**الوصف:** لا دعم لتدوير المفاتيح. تغيير المفتاح يمحو كل البيانات.  
**الحل:** تنفيذ key versioning مع دعم مفاتيح متعددة.

### MEDIUM — M4: MD5-based Verification Codes

**الملف:** `supabase/migrations/004_certificate_verification_code.sql:10`  
**الكود:** `SUBSTRING(MD5(id::TEXT || verified_at::TEXT) FOR 12)`  
**الوصف:** MD5 مهزوز ويمكن التنبؤ بالكود إذا عُرفت `id` و `verified_at`.  
**الحل:** استخدام `encode(gen_random_bytes(8), 'hex')`.

### MEDIUM — M5: Decrypt يرمي خطأ غير معالج

**الملف:** `src/lib/encryption.ts:40-59`  
**الوصف:** `decipher.final()` يرمي خطأ إذا كانت البيانات معطوبة — بعض الكولرات لا تتعامل معه.  
**الحل:** إضافة try/catch داخل `decrypt()` نفسها.

### LOW — L4: Non-standard IV Length (16 بدلاً من 12)

**الملف:** `src/lib/encryption.ts:8`  
**الوصف:** `IV_LENGTH = 16` بينما GCM أمثل مع 12.  
**الحل:** تغيير إلى 12.

### LOW — L5: Ciphertext Length يكشف Plaintext Length

**الملف:** `src/lib/encryption.ts:23-34`  
**الوصف:** تنسيق `iv:ciphertext:tag` يكشف طول النص الأصلي — غير مؤثر حالياً (ثابت 10 أرقام).

---

# A03:2025 — Injection (حقن)

### HIGH — H12: CSP يسمح `'unsafe-inline'` + `'unsafe-eval'`

**الملف:** `next.config.ts:46`  
**الوصف:** هاتان القاعدتان تحيدان تماماً حماية CSP. أي XSS يمكنه تنفيذ كود.  
**الحل:** استخدام `'strict-dynamic'` مع nonce.

### HIGH — H13: `addPreRegisteredStudent()` بدون Zod Validation

**الملف:** `src/actions/students.ts:19-78`  
**الوصف:** `PreRegisteredStudentSchema` موجود في `validations.ts` لكنه غير مستخدم. الدالة تستخدم TypeScript interface (compile-time only).  
**الحل:** إضافة `PreRegisteredStudentSchema.safeParse(student)`.

### HIGH — H14: `updatePreRegisteredStudent()` بدون Zod Validation

**الملف:** `src/actions/students.ts:196-258`  
**الوصف:** نفس المشكلة — `Partial<PreRegisteredStudent>` ليس validation.  
**الحل:** استخدام `PreRegisteredStudentSchema.partial()`.

### HIGH — H15: `javascript:` URLs في قوالب البريد

**الملف:** `src/lib/email.ts:116-132`  
**الكود:** `<a href="${escapeHtml(certificateUrl)}"`  
**الوصف:** `escapeHtml()` لا يتحقق من بروتوكول URL — `javascript:alert(1)` يمر.  
**الحل:** إضافة validation أن URL يبدأ بـ `https://`.

### MEDIUM — M6: Unsanitized `image_url` في `<img src>`

**الملفات:** `coordinator/content/page.tsx:237,284`, `admin/page.tsx:178`  
**الكود:** `<img src={form.image_url} />`  
**الوصف:** React لا يفلتر `src` attribute. URL يبدأ بـ `javascript:` سينفذ.  
**الحل:** إضافة `.url().refine(val => /^https?:\/\//i.test(val))` في Zod schema.

### MEDIUM — M7: Missing CR/LF Stripping في Subject

**الملف:** `src/lib/email.ts:42,67,92,118`  
**الوصف:** `\r\n` في subject يمكن أن يحقن headers في البريد.  
**الحل:** إزالة `\r\n` من جميع المدخلات.

### MEDIUM — M8: No Format Validation على Verification Code

**الملف:** `src/app/certificate/[id]/page.tsx:21`  
**الوصف:** `params.id` يدخل query بدون التحقق من الصيغة — احتمالية DoS.  
**الحل:** `if (!/^[A-Z0-9]{12}$/.test(params.id)) notFound()`.

---

# A04:2025 — Insecure Design (تصميم غير آمن)

### HIGH — H16: NotificationType Enum Mismatch

**الملف:** `src/lib/validations.ts:42` vs `src/types/index.ts:21`  
**الوصف:** `validation.ts` يسمح بقيم لا يقبلها `types/index.ts` والعكس.  
**الحل:** مصدر واحد للحقيقة للـ enum.

### HIGH — H17: Missing Max-Length Constraints في Zod Schemas

**الملف:** `src/lib/validations.ts:4-52`  
**الحقول بدون max:** `description` (لا max)، `location` (لا max)، `full_name` (لا max)، `phone` (لا max)، `requirements` (لا limits).  
**الوصف:** DoS عبر تخزين بيانات ضخمة، واحتمالية Injection.  
**الحل:** إضافة `.max()` لجميع الحقول النصية.

### HIGH — H18: Missing Migrations (`pre_registered_students` و `audit_logs`)

**الوصف:**  
- `pre_registered_students` — ليس له `CREATE TABLE` migration  
- `audit_logs` — ليس له `CREATE TABLE` migration، لا RLS، استخدام inconsistent للـ client  
**الحل:** إنشاء ملفات migration مع تعريف الجداول، تفعيل RLS، وإضافة سياسات.

### HIGH — H19: Full National ID معروض في المتصفح (مكرر من A02)

انظر H9.

### MEDIUM — M9: No Rate Limiting على أي Endpoint

**الملف:** كل Server Actions  
**الوصف:** لا يوجد أي throttle — يمكن flood لجميع الـ endpoints.  
**الحل:** إضافة `@upstash/ratelimit` أو middleware-based rate limiting.

### MEDIUM — M10: No Rate Limiting على Email

**الملف:** `src/lib/email.ts:20-37`  
**الوصف:** `sendEmail()` يمكن استدعاؤه بدون حدود.  
**الحل:** إضافة rate limiting لكل مستخدم.

### MEDIUM — M11: Date Fields كـ Strings

**الملف:** `src/lib/validations.ts:11-12`  
**الكود:** `start_date: z.string().optional().nullable()`  
**الحل:** استخدام `z.coerce.date()`.

### MEDIUM — M12: URL Fields بدون `.url()` Validation

**الملف:** `src/lib/validations.ts:29`  
**الكود:** `image_url: z.string().optional().nullable()`  
**الحل:** إضافة `.url()`.

### MEDIUM — M13: No Storage Bucket RLS Policies

**الملف:** `supabase/migrations/001_initial_schema.sql:114`  
**الوصف:** Certificate storage bucket ليس له RLS policies ولا `INSERT INTO storage.buckets`.  
**الحل:** إضافة migration مع policies: منسق INSERT، طالب SELECT فقط لشهاداته الموثقة.

### MEDIUM — M14: No `updated_at` Trigger

**الملف:** `supabase/migrations/001_initial_schema.sql:25,42`  
**الوصف:** `updated_at` يعتمد على كود التطبيق فقط — لا trigger.  
**الحل:** إضافة دالة trigger `set_updated_at()`.

### MEDIUM — M15: SECURITY DEFINER على Role Functions

**الملف:** `supabase/migrations/003_security_hardening.sql:18,26`  
**الوصف:** دالتي `get_user_role()` و `has_role()` تعملان بـ `SECURITY DEFINER` (كـ owner).  
**الحل:** تغيير إلى `SECURITY INVOKER`.

### LOW — L6: Students Become `created_by` للفرص

**الملف:** `src/actions/certificates.ts:186-222`  
**الوصف:** عبر شهادة خارجية، الطالب يصبح منشئ فرصة (قد يربك الـ ownership checks).  
**الحل:** تعيين `created_by = null` أو مستخدم نظام.

---

# A05:2025 — Security Misconfiguration (تكوين غير آمن)

### HIGH — H20: Missing HSTS Header

**الملف:** `next.config.ts:17-61`  
**الوصف:** بدون HSTS، المستخدم عرضة لـ SSL-stripping.  
**الحل:** إضافة `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.

### MEDIUM — M16: Error Messages مكشوفة للمستخدم

**الملف:** `src/app/dashboard/error.tsx:54`  
**الكود:** `<code>{error.message || 'Unknown Runtime Error'}</code>`  
**الوصف:** قد يحتوي على stack traces, internal paths.  
**الحل:** إخفاء الرسالة وإظهار رسالة عامة.

### MEDIUM — M17: MIME Type غير موثّق للـ Uploads

**الملف:** `src/actions/certificates.ts:155`  
**الكود:** التحقق فقط من الامتداد (`extension`)، ليس من الـ MIME Type الفعلي.  
**الحل:** استخدام `file-type` أو `fileTypeFromBuffer` للتحقق.

---

# A06:2025 — Vulnerable & Outdated Components

### HIGH — H21: `xlsx` v0.18.5 — CVE-2023-30533 (SSRF)

**الملف:** `package.json:23`  
**الوصف:** مكتبة `xlsx` النسخة المجتمعية بها ثغرة SSRF — ملف Excel خبيث يمكنه عمل HTTP requests داخلية.  
**الحل:** الترقية أو استبدال بـ `exceljs` أو معالجة الملفات في بيئة معزولة.

### MEDIUM — M18: No `npm audit` في CI/CD

**الملف:** `package.json:5-10`  
**الوصف:** لا فحص تلقائي للثغرات في الاعتماديات.  
**الحل:** إضافة `npm audit` في pipeline.

---

# A07:2025 — Identification & Authentication Failures

### HIGH — H22: Certificate Page بدون أي Auth

**الملف:** `src/app/certificate/[id]/page.tsx:10`  
**الوصف:** الصفحة العامة تستخدم admin key وتعرض بيانات حساسة لكل من لديه verification code.  
**الحل:** استخدام anon client مع RLS مخصص.

### MEDIUM — M19: Silent Catch على Decryption Errors

**الملف:** `src/actions/students.ts:46-48, 114-116, 226-228`  
**الكود:** `catch { /* Skip records */ }`  
**الوصف:** أخطاء فك التشفير (التي قد تشير إلى عبث) تُبتلع بصمت.  
**الحل:** تسجيل الخطأ قبل التجاهل.

---

# A08:2025 — Software & Data Integrity Failures

### MEDIUM — M20: No Global Try-Catch في Webhook

**الملف:** `src/app/api/webhooks/clerk/route.ts:19-130`  
**الوصف:** خطأ غير متوقع في POST handler يرمي unhandled exception.  
**الحل:** لف الكل في `try/catch`.

### MEDIUM — M21: No SRI على Scripts الخارجية

**الملف:** `next.config.ts:46`  
**الوصف:** سكريبتات من `clerk.com`, `challenges.cloudflare.com` بدون SRI.  
**الحل:** إضافة SRI hashes.

### MEDIUM — M22: No Integrity Check على Excel Uploads

**الملف:** `src/actions/students.ts`  
**الوصف:** ملفات Excel تُحلل بدون التحقق من سلامة الملف.  
**الحل:** استخدام sandbox + Zod validation لكل الصفوف.

### LOW — L7: Webhook Event Types غير معروفة

**الملف:** `src/app/api/webhooks/clerk/route.ts:51-127`  
**الوصف:** أنواع أحداث جديدة (مثل `user.deleted`) تُتجاهل بصمت.  
**الحل:** تسجيل unknown events + معالجة `user.deleted`.

### LOW — L8: No svix-id Deduplication

**الملف:** `src/app/api/webhooks/clerk/route.ts`  
**الوصف:** لا تخزين لـ svix-ids المعالجة لمنع replay attacks.  
**الحل:** تخزين svix-id في جدول `webhook_logs`.

---

# A09:2025 — Security Logging & Monitoring Failures

### MEDIUM — M23: Missing Audit Logs (متعدد)

**الملفات:**
- `src/actions/certificates.ts:91-145` — `verifyCertificate()` بدون audit
- `src/actions/applications.ts:72-110` — `applyToOpportunity()` بدون audit
- `src/actions/opportunities.ts:75-134` — `createOpportunity()` و `updateOpportunity()` بدون audit
- `src/actions/content.ts:59-139` — كل Content CRUD بدون audit
- `src/actions/certificates.ts:12-39` — `uploadCertificate()` بدون audit
- `src/actions/profile.ts:48-100` — تحديثات الملف الشخصي بدون audit

### MEDIUM — M24: Fire-and-Forget Email Sending

**الملف:** `src/actions/applications.ts:163`  
**الكود:** `sendEmail({...}).catch(() => {});`  
**الوصف:** فشل الإيميل يُبتلع بالكامل. المستخدم لا يعلم إذا فشل الإرسال.  
**الحل:** تسجيل الفشل + إعادة محاولة.

### MEDIUM — M25: No Database-Level Audit Triggers

**الوصف:** لا triggers على التعديلات المباشرة خارج التطبيق.  
**الحل:** إضافة triggers على `applications`, `opportunities`, `profiles`, `pre_registered_students`.

### MEDIUM — M26: No Failed-Access Logging

**الوصف:** لا تسجيل لمحاولات الوصول الفاشلة أو انتهاكات الصلاحيات.  
**الحل:** إضافة logging لجميع authorization failures.

### LOW — L9: Console.Error يفضح تفاصيل داخلية

**الملفات:** متعدد — `students.ts:67,146`, `certificates.ts:164,180`, `notifications.ts:31`  
**الوصف:** `console.error` قد يرسل تفاصيل داخلية لـ stdout.  
**الحل:** استخدام structured logger.

### LOW — L10: No Logging لفشل التحقق من الشهادة

**الملف:** `src/app/certificate/[id]/page.tsx:25`  
**الوصف:** محاولات فاشلة لـ verification code لا تُسجل — عمى عن هجمات brute-force.  
**الحل:** تسجيل IP و User-Agent لكل فشل.

---

# A10:2025 — SSRF (تزوير الطلبات من الخادم)

### HIGH — H23: xlsx Library SSRF (CVE-2023-30533)

**الملف:** `package.json:23`  
**الوصف:** ملف Excel خبيث يمكنه عمل HTTP requests داخلية من الخادوم عند تحليله.  
**الحل:** عزل معالجة Excel في بيئة بدون Network Access.

### MEDIUM — M27: Wildcard `*.supabase.co` في Image Remote Patterns

**الملف:** `next.config.ts:14`  
**الكود:** `hostname: '*.supabase.co'`  
**الوصف:** Next.js Image Optimization سيجلب صور من أي subdomain.  
**الحل:** استخدام subdomain محدد: `lytjrklqfdvejycowfxb.supabase.co`.

---

## الخطة العلاجية المقترحة

### المرحلة 1 — فوري (CRITICAL)
1. تغيير ENCRYPTION_KEY إلى مفتاح عشوائي حقيقي
2. إسقاط أو تفريغ عمود `national_id` النصي + إزالة الـ index
3. إصلاح `profiles_select_all`, `profiles_insert_service_role`, `notifications_insert_service` policies
4. تغيير Certificate Page لاستخدام anon client مع RLS مخصص
5. إضافة `currentUser()` إلى `createNotification()`

### المرحلة 2 — عاجل (HIGH)
6. إضافة Zod validation لـ `addPreRegisteredStudent()` و `updatePreRegisteredStudent()`
7. إضافة Ownership Check لـ `reviewApplication()` و `getAllApplications()`
8. إضافة Role Check لـ `getSignedUploadUrl()`, `getSignedDownloadUrl()`, `getContentUploadUrl()`
9. إخفاء Full National ID من الواجهة (استخدام `national_id_last3`)
10. إضافة SHA-256 hash للبحث السريع عن المكررات
11. تشغيل HSTS + إصلاح CSP
12. إصلاح `javascript:` URLs في البريد

### المرحلة 3 — تحسينات (MEDIUM)
13. إنشاء ملفات migration مفقودة (`pre_registered_students`, `audit_logs`)
14. إضافة audit logs لكل العمليات الناقصة
15. إضافة Rate Limiting
16. إضافة Max-Length Constraints
17. إضافة Storage RLS + `updated_at` triggers
18. إضافة Coordinator/Student Layouts مع Role Gate
19. إضافة Verification Code Format Validation
20. إضافة MIME Type Validation للرفع

---

*تم الفحص بواسطة OpenCode — 8 مايو 2026*
