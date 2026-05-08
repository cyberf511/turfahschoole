import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(str: string): string {
  return String(str)
    .replace(/\r\n/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function validateHttpsUrl(url: string): string {
  if (!url || !/^https:\/\//i.test(url)) {
    return '#';
  }
  return url;
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

const LOGO_B64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAgMTIwIiB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMDU5NjY5Ii8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6IzEwYjk4MSIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgCiAgPCEtLSBPdXRlciBzaGllbGQgLS0+CiAgPHBhdGggZD0iTTYwIDYgTDExMCAzNCBMMTEwIDY2IFExMTAgMTAwIDYwIDExOCBRMTAgMTAwIDEwIDY2IEwxMCAzNCBaIiAKICAgICAgICBmaWxsPSJ1cmwoI2cpIiBzdHJva2U9IiMwNDc4NTciIHN0cm9rZS13aWR0aD0iMiIvPgogIAogIDwhLS0gSW5uZXIgc2hpZWxkIC0tPgogIDxwYXRoIGQ9Ik02MCAxNiBMOTggMzggTDk4IDY0IFE5OCA5MiA2MCAxMDggUTIyIDkyIDIyIDY0IEwyMiAzOCBaIiAKICAgICAgICBmaWxsPSIjZmZmZmZmIiBzdHJva2U9IiNlNWU3ZWIiIHN0cm9rZS13aWR0aD0iMSIvPgogIAogIDwhLS0gT3BlbiBib29rIC0tPgogIDxwYXRoIGQ9Ik0zOCA1MCBRMzggNDIgNDggNDIgTDYwIDQ4IEw3MiA0MiBRODIgNDIgODIgNTAgTDgyIDc4IFE4MiA4NCA2MCA5MCBRMzggODQgMzggNzggWiIgCiAgICAgICAgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDU5NjY5IiBzdHJva2Utd2lkdGg9IjIuNSIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgogIDxwYXRoIGQ9Ik02MCA0OCBMNjAgOTAiIHN0cm9rZT0iIzA1OTY2OSIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgCiAgPCEtLSBCb29rIHBhZ2VzIGxlZnQgLS0+CiAgPHBhdGggZD0iTTM4IDUwIFE0NCA1NiA2MCA1OCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDU5NjY5IiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgCiAgPCEtLSBTdGFyIGFib3ZlIGJvb2sgLS0+CiAgPHBvbHlnb24gcG9pbnRzPSI2MCwyOCA2MywzNiA3MiwzNiA2NSw0MiA2OCw1MCA2MCw0NSA1Miw1MCA1NSw0MiA0OCwzNiA1NywzNiIgCiAgICAgICAgICAgZmlsbD0iI2ZiYmYyNCIgc3Ryb2tlPSIjZjU5ZTBiIiBzdHJva2Utd2lkdGg9IjAuNSIvPgogIAogIDwhLS0gRGVjb3JhdGl2ZSBkb3RzIC0tPgogIDxjaXJjbGUgY3g9IjM4IiBjeT0iNzIiIHI9IjEuNSIgZmlsbD0iI2QxZDVkYiIvPgogIDxjaXJjbGUgY3g9IjgyIiBjeT0iNzIiIHI9IjEuNSIgZmlsbD0iI2QxZDVkYiIvPgogIDxjaXJjbGUgY3g9IjQyIiBjeT0iNjgiIHI9IjEuNSIgZmlsbD0iI2QxZDVkYiIvPgogIDxjaXJjbGUgY3g9Ijc4IiBjeT0iNjgiIHI9IjEuNSIgZmlsbD0iI2QxZDVkYiIvPgogIAogIDwhLS0gQm90dG9tIHRleHQgYXJjIGxpbmVzIC0tPgogIDxwYXRoIGQ9Ik0zMCA5MyBRNjAgMTAyIDkwIDkzIiBmaWxsPSJub25lIiBzdHJva2U9IiMwNTk2NjkiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KICA8cGF0aCBkPSJNMzQgOTcgUTYwIDEwNSA4NiA5NyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDU5NjY5IiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K';

const LOGO_HTML = `<div style="text-align:center;margin-bottom:16px;"><img src="${LOGO_B64}" alt="شعار المدرسة" width="60" height="60" style="display:inline-block;border:none;"></div>`;

// Template: Application received
export function emailApplicationReceived(studentName: string, oppTitle: string) {
  return {
    subject: `📩 تم استلام طلبك — ${escapeHtml(oppTitle)}`,
    html: `
      <div dir="rtl" style="font-family:'Cairo',sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
        ${LOGO_HTML}
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
        ${LOGO_HTML}
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
        ${LOGO_HTML}
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
        ${LOGO_HTML}
        <div style="text-align:center;margin-bottom:20px;">
          <span style="font-size:2rem;">🏆</span>
          <h2 style="color:#059669;margin:8px 0 4px;">تم اعتماد شهادتك!</h2>
        </div>
        <p style="color:#374151;">مرحباً <strong>${escapeHtml(studentName)}</strong>،</p>
        <p style="color:#374151;">تم اعتماد مشاركتك في فرصة <strong>"${escapeHtml(oppTitle)}"</strong> وإضافة الساعات لسجلك التطوعي.</p>
        
        <p style="color:#374151;margin-top:20px;">لقد تم إصدار شهادة إنجاز رقمية خاصة بك تقديراً لجهودك. يمكنك عرضها وطباعتها من خلال الرابط أدناه:</p>
        
        <div style="text-align:center;margin:24px 0;">
          <a href="${validateHttpsUrl(certificateUrl)}" style="background-color:#059669;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">📜 عرض الشهادة الرقمية</a>
        </div>
        
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
        <p style="color:#9ca3af;font-size:0.8rem;text-align:center;">منصة التطوع — ثانوية طرفة بنت عبدالعزيز</p>
      </div>
    `,
  };
}
