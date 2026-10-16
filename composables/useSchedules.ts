// Master jadwal & kuota dari backend (/api/v1/schedules). Semua endpoint khusus superadmin.
// Template mingguan per dokter, sesi harian (dihitung server dari template + cuti) dan cuti/dokter pengganti.

export interface ApiDoctorRef { id: string; name: string; specialization: string; poli_id: string; poli_code: string; poli_name: string }
export interface ApiSchedule {
  id: string; doctor: ApiDoctorRef; weekday: number; start_time: string; end_time: string
  jkn_quota: number; non_jkn_quota: number; total_quota: number; effective_date: string
  /** Terisi terbesar pada hari ini dalam 30 hari ke depan; total kuota tidak boleh di bawahnya. */
  min_quota: number
}
export type SessionStatus = 'active' | 'completed' | 'leave' | 'substitute'
export interface ApiSession {
  date: string; doctor: ApiDoctorRef; start_time: string; end_time: string; status: SessionStatus
  total_quota: number; jkn_quota: number; non_jkn_quota: number; filled: number; remaining: number
  reason: string | null; exception_id: string | null; replaced_doctor: ApiDoctorRef | null
}
export interface ScheduleForm { start_time: string; end_time: string; jkn_quota: number; non_jkn_quota: number; effective_date: string }
export interface ExceptionForm { doctor_id: string; date: string; substitute_doctor_id: string; reason: string }

export function useSchedules() {
  /** Semua template yang cocok dengan filter (semua halaman). */
  const list = async (q: { doctor_id?: string; poli_id?: string; weekday?: number } = {}) => {
    const out: ApiSchedule[] = []
    for (let page = 1; ; page++) {
      const r = await apiPage<ApiSchedule>('/api/v1/schedules', { query: { ...q, page, limit: 100 } })
      out.push(...r.data)
      if (!r.pagination?.has_next_page) return out
    }
  }
  const create = (doctorId: string, weekday: number, f: ScheduleForm) =>
    api<ApiSchedule>('/api/v1/schedules', { method: 'POST', body: { doctor_id: doctorId, weekday, ...f } })
  const update = (id: string, f: ScheduleForm) => api<ApiSchedule>(`/api/v1/schedules/${id}`, { method: 'PUT', body: f })
  const remove = (id: string) => api(`/api/v1/schedules/${id}`, { method: 'DELETE' })

  const sessions = (q: { doctor_id: string; from?: string; to?: string }) =>
    api<ApiSession[]>('/api/v1/schedules/sessions', { query: q })

  const createException = (f: ExceptionForm) =>
    api('/api/v1/schedules/exceptions', {
      method: 'POST',
      body: { doctor_id: f.doctor_id, date: f.date, reason: f.reason.trim(), ...(f.substitute_doctor_id ? { substitute_doctor_id: f.substitute_doctor_id } : {}) },
    })
  const removeException = (id: string) => api(`/api/v1/schedules/exceptions/${id}`, { method: 'DELETE' })

  return { list, create, update, remove, sessions, createException, removeException }
}
