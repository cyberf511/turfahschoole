import { notFound } from 'next/navigation';
import { createAdminSupabase } from '@/lib/supabase/admin';
import { formatDate } from '@/lib/utils';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'شهادة إنجاز تطوعي | منصة التطوع',
};

export default async function CertificatePage({ params }: { params: { id: string } }) {
  const supabase = createAdminSupabase();

  const { data: app } = await supabase
    .from('applications')
    .select(`
      id,
      verified_at,
      student:profiles!student_id(full_name, national_id),
      opportunity:opportunities!opportunity_id(title, hours, location)
    `)
    .eq('id', params.id)
    .eq('completion_status', 'verified')
    .single();

  if (!app) {
    notFound();
  }

  const student = app.student as any;
  const opp = app.opportunity as any;
  const issueDate = formatDate(app.verified_at || new Date().toISOString());

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: "'Cairo', sans-serif" }}>
      <div style={{ maxWidth: '800px', width: '100%' }}>
        {/* Actions */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <button 
            onClick={() => window.print()} 
            style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            طباعة / حفظ كـ PDF
          </button>
        </div>

        {/* Certificate Container */}
        <div style={{ 
          background: '#fff', 
          borderRadius: '16px', 
          padding: '40px', 
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid #e5e7eb',
          aspectRatio: '1.414 / 1', // A4 Landscape roughly
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          {/* Decorative Borders */}
          <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', bottom: '16px', border: '2px solid #10b981', borderRadius: '12px', opacity: 0.2, pointerEvents: 'none' }}></div>
          <div style={{ position: 'absolute', top: '24px', left: '24px', right: '24px', bottom: '24px', border: '1px solid #10b981', borderRadius: '8px', opacity: 0.1, pointerEvents: 'none' }}></div>
          
          {/* Corner Graphics */}
          <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'linear-gradient(135deg, #10b981 0%, transparent 100%)', opacity: 0.1, borderBottomLeftRadius: '100%' }}></div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '150px', height: '150px', background: 'linear-gradient(315deg, #10b981 0%, transparent 100%)', opacity: 0.1, borderTopRightRadius: '100%' }}></div>

          {/* Header */}
          <div style={{ marginBottom: '40px', position: 'relative', zIndex: 1 }}>
            <div style={{ width: '80px', height: '80px', background: '#ecfdf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#10b981' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
            </div>
            <h1 style={{ color: '#10b981', fontSize: '2.5rem', margin: '0 0 8px 0', fontWeight: 800 }}>شهادة شكر وتقدير</h1>
            <p style={{ color: '#6b7280', fontSize: '1.2rem', margin: 0 }}>Certificate of Appreciation</p>
          </div>

          {/* Body */}
          <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '600px' }}>
            <p style={{ fontSize: '1.4rem', color: '#374151', margin: '0 0 16px 0' }}>تشهد منصة التطوع بثانوية طرفة بنت عبدالعزيز بأن الطالبة:</p>
            <h2 style={{ fontSize: '2.8rem', color: '#111827', margin: '0 0 24px 0', borderBottom: '2px solid #10b981', display: 'inline-block', paddingBottom: '8px' }}>
              {student?.full_name}
            </h2>
            
            <p style={{ fontSize: '1.3rem', color: '#4b5563', margin: '0 0 8px 0', lineHeight: 1.6 }}>
              قد أتمت بنجاح مشاركتها في الفرصة التطوعية:
              <br/>
              <strong style={{ color: '#10b981', fontSize: '1.6rem' }}>"{opp?.title}"</strong>
            </p>
            
            <p style={{ fontSize: '1.2rem', color: '#4b5563', margin: '0 0 40px 0' }}>
              بواقع <strong style={{ color: '#111827' }}>{opp?.hours}</strong> ساعة تطوعية. نسأل الله لها دوام التوفيق والنجاح.
            </p>
          </div>

          {/* Footer details */}
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '600px', marginTop: 'auto', position: 'relative', zIndex: 1 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '8px' }}>تاريخ الإصدار</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#111827', borderTop: '1px solid #d1d5db', paddingTop: '8px', width: '120px' }}>
                {issueDate}
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '8px' }}>رقم الاعتماد</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#111827', borderTop: '1px solid #d1d5db', paddingTop: '8px', width: '150px', fontFamily: 'monospace' }}>
                {app.id.split('-')[0].toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Print Styles */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body { background: white !important; }
            .no-print { display: none !important; }
            @page { size: landscape; margin: 0; }
          }
        `}} />
      </div>
    </div>
  );
}
