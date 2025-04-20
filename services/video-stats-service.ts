import { createClient } from '@/utils/supabase/client';

export interface WeeklyStats {
  client_id: string;
  week_start: string;
  week_end: string;
  videos_completed: number;
}

export interface WeeklyStatsResponse {
  weekly_stats: WeeklyStats[];
}

/**
 * Ruft die wöchentlichen Videostatistiken des eingeloggten Benutzers ab
 */
export async function getWeeklyVideoStats(): Promise<WeeklyStats[]> {
  try {
    const supabase = createClient();
    
    const { data, error } =
      await supabase.functions.invoke<WeeklyStatsResponse>(
        'weekly_video_stats',
        {
          method: 'GET',
        }
      );

    if (error) {
      console.error('Fehler beim Abrufen der wöchentlichen Statistik:', error);
      throw new Error(`Fehler beim Abrufen der Statistik: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return data.weekly_stats;
  } catch (error) {
    console.error('Unerwarteter Fehler beim Abrufen der Statistik:', error);
    throw error;
  }
}
