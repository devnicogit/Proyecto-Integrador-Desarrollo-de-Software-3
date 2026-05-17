import React, { useEffect, useMemo, useState } from 'react';
import { Activity, CheckCircle2, ClipboardCheck, Download, FileText, Loader2 } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { downloadKpiFicha, getKpi, type KpiCode, type KpiResponse } from '../services/reportService';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const INDICATORS: { code: KpiCode; title: string; subtitle: string; color: string; icon: React.ReactNode }[] = [
  { code: 'iid', title: 'IID', subtitle: 'Integridad de Datos Registrados', color: '#2563eb', icon: <ClipboardCheck size={22} /> },
  { code: 'chr', title: 'CHR', subtitle: 'Cumplimiento de Hoja de Ruta', color: '#16a34a', icon: <CheckCircle2 size={22} /> },
  { code: 'tde', title: 'TDE', subtitle: 'Tasa de Disponibilidad de Evidencias', color: '#f59e0b', icon: <Activity size={22} /> },
];

const PRE_TEST = { start: '2026-03-02', end: '2026-04-18' };
const POST_TEST = { start: '2026-04-20', end: '2026-05-16' };

type Phase = 'PRE' | 'POST';

const ThesisKpis: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('POST');
  const [range, setRange] = useState(POST_TEST);
  const [pre, setPre] = useState<Record<KpiCode, KpiResponse | null>>({ iid: null, chr: null, tde: null });
  const [post, setPost] = useState<Record<KpiCode, KpiResponse | null>>({ iid: null, chr: null, tde: null });
  const [loading, setLoading] = useState(true);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  useEffect(() => {
    setRange(phase === 'PRE' ? PRE_TEST : POST_TEST);
  }, [phase]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const codes: KpiCode[] = ['iid', 'chr', 'tde'];
      const [preRes, postRes] = await Promise.all([
        Promise.all(codes.map(c => getKpi(c, PRE_TEST.start, PRE_TEST.end))),
        Promise.all(codes.map(c => getKpi(c, POST_TEST.start, POST_TEST.end))),
      ]);
      setPre({ iid: preRes[0], chr: preRes[1], tde: preRes[2] });
      setPost({ iid: postRes[0], chr: postRes[1], tde: postRes[2] });
    } catch (e) {
      console.error('Error fetching KPI data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const current = phase === 'PRE' ? pre : post;

  const handleDownload = async (code: KpiCode, format: 'csv' | 'pdf') => {
    const key = `${code}-${format}`;
    setDownloadingKey(key);
    try {
      await downloadKpiFicha(code, range.start, range.end, format, phase === 'PRE' ? 'Pre-Test' : 'Post-Test');
    } catch (e) {
      console.error(e);
      alert('Error al descargar la ficha.');
    } finally {
      setDownloadingKey(null);
    }
  };

  const comparison = useMemo(() => {
    return INDICATORS.map(ind => {
      const p = pre[ind.code]?.totals.percentage ?? 0;
      const q = post[ind.code]?.totals.percentage ?? 0;
      return { code: ind.code.toUpperCase(), pre: p, post: q, delta: +(q - p).toFixed(1) };
    });
  }, [pre, post]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <Loader2 className="animate-spin" size={36} color="#2563eb" />
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '2rem' }}>
      {/* Phase toggle */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc' }}>
        <div className="thesis-phase-toggle">
          <span style={{ fontWeight: 600, color: '#1e293b' }}>Fase de medición:</span>
          <div style={{ display: 'flex', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <button
              onClick={() => setPhase('PRE')}
              style={{
                padding: '0.5rem 1rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                backgroundColor: phase === 'PRE' ? '#2563eb' : '#fff',
                color: phase === 'PRE' ? '#fff' : '#1e293b',
                border: 'none',
              }}
            >
              Pre-Test (manual)
            </button>
            <button
              onClick={() => setPhase('POST')}
              style={{
                padding: '0.5rem 1rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                backgroundColor: phase === 'POST' ? '#16a34a' : '#fff',
                color: phase === 'POST' ? '#fff' : '#1e293b',
                border: 'none',
              }}
            >
              Post-Test (con sistema)
            </button>
          </div>
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Periodo: <strong>{range.start}</strong> a <strong>{range.end}</strong>
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="thesis-kpi-grid">
        {INDICATORS.map(ind => {
          const data = current[ind.code];
          const pct = data?.totals.percentage ?? 0;
          const total = data?.totals.total ?? 0;
          const valid = data?.totals.valid ?? 0;
          return (
            <div key={ind.code} className="card" style={{ borderTop: `4px solid ${ind.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: ind.color }}>
                    {ind.icon}
                    <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>{ind.title}</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>{ind.subtitle}</p>
                </div>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: ind.color }}>{pct.toFixed(1)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem' }}>
                <span>Válidos: <strong style={{ color: '#1e293b' }}>{valid}</strong></span>
                <span>Total: <strong style={{ color: '#1e293b' }}>{total}</strong></span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleDownload(ind.code, 'csv')}
                  disabled={downloadingKey === `${ind.code}-csv`}
                  style={{
                    flex: 1, padding: '0.4rem', borderRadius: '0.375rem',
                    backgroundColor: '#f1f5f9', color: '#1e293b', fontSize: '0.75rem', fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem',
                    cursor: 'pointer', border: 'none'
                  }}
                >
                  <Download size={14} /> CSV
                </button>
                <button
                  onClick={() => handleDownload(ind.code, 'pdf')}
                  disabled={downloadingKey === `${ind.code}-pdf`}
                  style={{
                    flex: 1, padding: '0.4rem', borderRadius: '0.375rem',
                    backgroundColor: ind.color, color: '#fff', fontSize: '0.75rem', fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem',
                    cursor: 'pointer', border: 'none'
                  }}
                >
                  <FileText size={14} /> PDF Ficha
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparativo Pre vs Post */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={20} color="#2563eb" /> Comparativo Pre-Test vs Post-Test
        </h3>
        <div className="thesis-chart-container">
          <Bar
            data={{
              labels: comparison.map(c => c.code),
              datasets: [
                { label: 'Pre-Test (manual)', data: comparison.map(c => c.pre), backgroundColor: 'rgba(239, 68, 68, 0.6)', borderColor: 'rgba(239, 68, 68, 1)', borderWidth: 1 },
                { label: 'Post-Test (con sistema)', data: comparison.map(c => c.post), backgroundColor: 'rgba(22, 163, 74, 0.6)', borderColor: 'rgba(22, 163, 74, 1)', borderWidth: 1 },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top' as const },
                tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.raw}%` } }
              },
              scales: {
                y: { beginAtZero: true, max: 100, title: { display: true, text: 'Porcentaje (%)' } }
              }
            }}
          />
        </div>
        <div className="thesis-table-wrapper">
        <table style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse', fontSize: '0.875rem', minWidth: '320px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Indicador</th>
              <th style={{ padding: '0.5rem' }}>Pre-Test</th>
              <th style={{ padding: '0.5rem' }}>Post-Test</th>
              <th style={{ padding: '0.5rem' }}>Mejora (Δ)</th>
            </tr>
          </thead>
          <tbody>
            {comparison.map(c => (
              <tr key={c.code} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.5rem', fontWeight: 600 }}>{c.code}</td>
                <td style={{ padding: '0.5rem', textAlign: 'center', color: '#ef4444' }}>{c.pre.toFixed(1)}%</td>
                <td style={{ padding: '0.5rem', textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>{c.post.toFixed(1)}%</td>
                <td style={{ padding: '0.5rem', textAlign: 'center', color: '#2563eb', fontWeight: 700 }}>+{c.delta.toFixed(1)} pp</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Detalle de fila por fila (ficha del Anexo 2) */}
      <div className="card">
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Ficha de Registro — {phase === 'PRE' ? 'Pre-Test' : 'Post-Test'}
        </h3>
        <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>
          Investigador: Campos Vargas Kevin Stip · Empresa: Grupo Micotrans S.A.C. · Variable: Gestión Administrativa
        </p>
        <div className="thesis-ficha-grid">
          {INDICATORS.map(ind => {
            const data = current[ind.code];
            if (!data) return null;
            return (
              <div key={ind.code} style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', overflow: 'hidden' }}>
                <div style={{ padding: '0.6rem 0.75rem', backgroundColor: ind.color, color: '#fff', fontWeight: 700, fontSize: '0.875rem' }}>
                  {ind.title} - {ind.subtitle}
                </div>
                <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc' }}>
                      <tr>
                        <th style={{ padding: '0.4rem', textAlign: 'left' }}>Nº</th>
                        <th style={{ padding: '0.4rem' }}>Fecha</th>
                        <th style={{ padding: '0.4rem' }}>Total</th>
                        <th style={{ padding: '0.4rem' }}>Válidos</th>
                        <th style={{ padding: '0.4rem' }}>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.map(r => (
                        <tr key={r.index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.4rem', color: '#94a3b8' }}>{r.index}</td>
                          <td style={{ padding: '0.4rem' }}>{r.date}</td>
                          <td style={{ padding: '0.4rem', textAlign: 'center' }}>{r.total}</td>
                          <td style={{ padding: '0.4rem', textAlign: 'center' }}>{r.valid}</td>
                          <td style={{ padding: '0.4rem', textAlign: 'center', fontWeight: 600 }}>{r.percentage.toFixed(1)}%</td>
                        </tr>
                      ))}
                      <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 700 }}>
                        <td colSpan={2} style={{ padding: '0.4rem', textAlign: 'right' }}>TOTAL</td>
                        <td style={{ padding: '0.4rem', textAlign: 'center' }}>{data.totals.total}</td>
                        <td style={{ padding: '0.4rem', textAlign: 'center' }}>{data.totals.valid}</td>
                        <td style={{ padding: '0.4rem', textAlign: 'center' }}>{data.totals.percentage.toFixed(1)}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ThesisKpis;
