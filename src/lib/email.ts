import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailParams) {
  try {
    const { error } = await resend.emails.send({
      from: 'منصة التطوع <onboarding@resend.dev>',
      to,
      subject,
      html,
    });
    if (error) {
      console.error('Email error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Email send failed:', err);
    return false;
  }
}

// Template: Application received
export function emailApplicationReceived(studentName: string, oppTitle: string) {
  return {
    subject: `📩 تم استلام طلبك — ${escapeHtml(oppTitle)}`,
    html: `
      <div dir="rtl" style="font-family:'Cairo',sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
        <div style="text-align:center;margin-bottom:20px;">
          <span style="font-size:2rem;">📩</span>
          <h2 style="color:#2563eb;margin:8px 0 4px;">تم استلام طلبك</h2>
        </div>
        <p style="color:#374151;">مرحباً <strong>${escapeHtml(studentName)}</strong>،</p>
        <p style="color:#374151;">لقد استلمنا بنجاح طلب تقديمك للفرصة التطوعية <strong>"${escapeHtml(oppTitle)}"</strong>.</p>
        <p style="color:#6b7280;font-size:0.9rem;">سيتم مراجعة طلبك من قبل المنسقة وإبلاغك بالنتيجة قريباً. يمكنك متابعة حالة الطلب عبر حسابك في المنصة.</p>
        
        <div style="text-align:center;margin:24px 0;">
          <a href="https://turfah.vercel.app/dashboard/student/applications" style="background-color:#2563eb;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">🔍 متابعة حالة الطلب</a>
        </div>
        
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
        <p style="color:#9ca3af;font-size:0.8rem;text-align:center;">منصة التطوع — ثانوية طرفة بنت عبدالعزيز</p>
      </div>
    `,
  };
}

// Template: Application approved
export function emailApproved(studentName: string, oppTitle: string) {
  return {
    subject: `✅ تم قبول طلبك — ${escapeHtml(oppTitle)}`,
    html: `
      <div dir="rtl" style="font-family:'Cairo',sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
        <div style="text-align:center;margin-bottom:20px;">
          <span style="font-size:2rem;">🎉</span>
          <h2 style="color:#059669;margin:8px 0 4px;">تم قبول طلبك!</h2>
        </div>
        <p style="color:#374151;">مرحباً <strong>${escapeHtml(studentName)}</strong>،</p>
        <p style="color:#374151;">يسعدنا إبلاغك بأن طلبك للمشاركة في فرصة <strong>"${escapeHtml(oppTitle)}"</strong> قد تم قبوله.</p>
        <p style="color:#6b7280;font-size:0.9rem;">يرجى متابعة التعليمات عبر المنصة والتواصل مع المنسقة للتفاصيل.</p>
        
        <div style="text-align:center;margin:24px 0;">
          <a href="https://turfah.vercel.app/dashboard/student/applications" style="background-color:#059669;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">🔍 عرض الطلب والفرصة</a>
        </div>
        
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
        <p style="color:#9ca3af;font-size:0.8rem;text-align:center;">منصة التطوع — ثانوية طرفة بنت عبدالعزيز</p>
      </div>
    `,
  };
}

// Template: Application rejected
export function emailRejected(studentName: string, oppTitle: string, reason?: string) {
  return {
    subject: `❌ تحديث على طلبك — ${escapeHtml(oppTitle)}`,
    html: `
      <div dir="rtl" style="font-family:'Cairo',sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
        <div style="text-align:center;margin-bottom:20px;">
          <span style="font-size:2rem;">📋</span>
          <h2 style="color:#dc2626;margin:8px 0 4px;">تحديث على طلبك</h2>
        </div>
        <p style="color:#374151;">مرحباً <strong>${escapeHtml(studentName)}</strong>،</p>
        <p style="color:#374151;">نأسف لإبلاغك بأن طلبك للمشاركة في فرصة <strong>"${escapeHtml(oppTitle)}"</strong> لم يُقبل.</p>
        ${reason ? `<p style="color:#6b7280;font-size:0.9rem;">السبب: ${escapeHtml(reason)}</p>` : ''}
        <p style="color:#6b7280;font-size:0.9rem;">يمكنك التقديم على فرص أخرى عبر المنصة.</p>
        
        <div style="text-align:center;margin:24px 0;">
          <a href="https://turfah.vercel.app/dashboard/student/opportunities" style="background-color:#dc2626;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">🔍 تصفح فرص بديلة</a>
        </div>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
        <p style="color:#9ca3af;font-size:0.8rem;text-align:center;">منصة التطوع — ثانوية طرفة بنت عبدالعزيز</p>
      </div>
    `,
  };
}

// Template: Certificate verified
export function emailCertificateVerified(studentName: string, oppTitle: string, certificateUrl: string) {
  return {
    subject: `📜 تم اعتماد شهادتك — ${escapeHtml(oppTitle)}`,
    html: `
      <div dir="rtl" style="font-family:'Cairo',sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
        <div style="text-align:center;margin-bottom:20px;">
          <span style="font-size:2rem;">🏆</span>
          <h2 style="color:#059669;margin:8px 0 4px;">تم اعتماد شهادتك!</h2>
        </div>
        <p style="color:#374151;">مرحباً <strong>${escapeHtml(studentName)}</strong>،</p>
        <p style="color:#374151;">تم اعتماد مشاركتك في فرصة <strong>"${escapeHtml(oppTitle)}"</strong> وإضافة الساعات لسجلك التطوعي.</p>
        
        <p style="color:#374151;margin-top:20px;">لقد تم إصدار شهادة إنجاز رقمية خاصة بك تقديراً لجهودك. يمكنك عرضها وطباعتها من خلال الرابط أدناه:</p>
        
        <div style="text-align:center;margin:24px 0;">
          <a href="${escapeHtml(certificateUrl)}" style="background-color:#059669;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">📜 عرض الشهادة الرقمية</a>
        </div>
        
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
        <p style="color:#9ca3af;font-size:0.8rem;text-align:center;">منصة التطوع — ثانوية طرفة بنت عبدالعزيز</p>
      </div>
    `,
  };
}
