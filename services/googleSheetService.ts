// ============================================================
// Google Sheet Report Service
// Gửi dữ liệu học sinh lên Google Sheet khi nộp bài
// ============================================================

// ⚠️ URL Google Apps Script Web App đã deploy:
const DEFAULT_SHEET_URL = 'https://script.google.com/macros/s/AKfycbz-f8rbw5Pu8G70qGS8bbh-QyxuYMf25SzyrWXsoBX5-w2Ky20y0X4ChGWxm9k9vVK3/exec';
const GOOGLE_SHEET_WEB_APP_URL = localStorage.getItem('google_sheet_url') || DEFAULT_SHEET_URL;

export interface SheetReportData {
  studentName: string;
  className: string;
  topic: string;
  score: number;
  totalCorrect: number;
  totalQuestions: number;
}

/**
 * Lưu URL Google Apps Script Web App vào localStorage
 */
export function setGoogleSheetUrl(url: string): void {
  localStorage.setItem('google_sheet_url', url.trim());
}

/**
 * Lấy URL Google Apps Script Web App đã lưu
 */
export function getGoogleSheetUrl(): string {
  return localStorage.getItem('google_sheet_url') || DEFAULT_SHEET_URL;
}

/**
 * Kiểm tra đã cấu hình URL chưa
 */
export function hasGoogleSheetUrl(): boolean {
  const url = getGoogleSheetUrl();
  return url.length > 0 && url.startsWith('https://script.google.com/');
}

/**
 * Gửi báo cáo lên Google Sheet
 * Sử dụng mode: 'no-cors' vì Google Apps Script redirect
 */
export async function sendReportToSheet(data: SheetReportData): Promise<{ success: boolean; message: string }> {
  const url = getGoogleSheetUrl();
  
  if (!url) {
    return { success: false, message: 'Chưa cấu hình URL Google Sheet. Vào ⚙️ Settings để thiết lập.' };
  }

  try {
    // Google Apps Script Web App redirect (302) nên dùng fetch với redirect: 'follow'
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(data),
      redirect: 'follow',
    });

    // Nếu response OK, parse JSON
    if (response.ok) {
      try {
        const result = await response.json();
        return { success: result.success, message: result.message || 'Đã gửi báo cáo!' };
      } catch {
        // Nếu không parse được JSON nhưng response OK → coi như thành công
        return { success: true, message: 'Đã gửi báo cáo lên Google Sheet!' };
      }
    }

    return { success: false, message: `Lỗi HTTP ${response.status}` };
  } catch (error: any) {
    // Với mode no-cors hoặc CORS issues, fetch có thể throw
    // Nhưng data vẫn có thể đã được gửi thành công
    console.warn('[GoogleSheet] Fetch error (có thể vẫn gửi thành công):', error.message);
    
    // Thử gửi lại bằng phương pháp beacon/image fallback
    try {
      await sendViaBeacon(url, data);
      return { success: true, message: 'Đã gửi báo cáo lên Google Sheet!' };
    } catch {
      return { success: false, message: 'Không thể kết nối Google Sheet: ' + (error.message || 'Lỗi mạng') };
    }
  }
}

/**
 * Fallback: Gửi data bằng Navigator.sendBeacon (fire-and-forget)
 */
function sendViaBeacon(url: string, data: SheetReportData): Promise<void> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([JSON.stringify(data)], { type: 'text/plain;charset=utf-8' });
    const sent = navigator.sendBeacon(url, blob);
    if (sent) {
      resolve();
    } else {
      reject(new Error('sendBeacon failed'));
    }
  });
}
