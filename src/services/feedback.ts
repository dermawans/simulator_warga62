import { getSupabaseClient, ensureConfigLoaded } from '../utils/supabase';

export interface FeedbackReport {
  id: string;
  type: 'BUG' | 'FEATURE';
  title: string;
  category: string;
  description: string;
  senderName: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  deviceInfo?: string;
  gameStateInfo?: {
    round?: number;
    activePlayer?: string;
    isOnline?: boolean;
    roomCode?: string | null;
  };
  createdAt: string;
  status?: 'TERCATAT' | 'DIPERIKSA' | 'SELESAI';
}

const LOCAL_STORAGE_FEEDBACK_KEY = 'simulator_wni_feedback_reports_v1';

export const feedbackService = {
  // Get stored reports from localStorage
  getLocalReports(): FeedbackReport[] {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_FEEDBACK_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to parse local feedback reports', e);
    }
    return [];
  },

  // Save report locally
  saveLocalReport(report: FeedbackReport): void {
    try {
      const current = this.getLocalReports();
      const updated = [report, ...current].slice(0, 50); // keep up to 50 local reports
      localStorage.setItem(LOCAL_STORAGE_FEEDBACK_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save feedback report locally', e);
    }
  },

  // Submit feedback
  async submitFeedback(data: Omit<FeedbackReport, 'id' | 'createdAt' | 'status'>): Promise<{ success: boolean; report: FeedbackReport }> {
    const report: FeedbackReport = {
      id: `lapor_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...data,
      status: 'TERCATAT',
      createdAt: new Date().toISOString(),
    };

    // 1. Always save locally first for instant reassurance
    this.saveLocalReport(report);

    // 2. Post to server endpoint /api/feedback
    try {
      fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      }).catch(() => {
        // Non-blocking network failure tolerance
      });
    } catch {}

    // 3. Try to save to Supabase if configured (graceful fallback)
    try {
      await ensureConfigLoaded();
      const client = getSupabaseClient();
      if (client) {
        await client.from('feedback_reports').insert([
          {
            report_id: report.id,
            type: report.type,
            title: report.title,
            category: report.category,
            description: report.description,
            sender_name: report.senderName,
            priority: report.priority,
            device_info: report.deviceInfo,
            created_at: report.createdAt,
          },
        ]);
      }
    } catch {
      // Ignore if supabase table is not created yet
    }

    return { success: true, report };
  },

  // Helper to construct a formatted shareable text
  generateShareableText(report: FeedbackReport): string {
    const typeLabel = report.type === 'BUG' ? '🚨 LAPORAN BUG / EROR' : '💡 USULAN / REQUEST FITUR';
    return `[${typeLabel}] - SIMULATOR WARGA62\n` +
      `📌 Judul: ${report.title}\n` +
      `🏷️ Kategori: ${report.category} | Prioritas: ${report.priority}\n` +
      `👤 Pelapor: ${report.senderName}\n` +
      `📝 Deskripsi:\n${report.description}\n` +
      (report.deviceInfo ? `💻 Info Perangkat: ${report.deviceInfo}\n` : '') +
      `📅 Waktu: ${new Date(report.createdAt).toLocaleString('id-ID')}\n` +
      `#SimulatorWarga62 #LaporanWarga`;
  },
};
