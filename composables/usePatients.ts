// Data pasien dari backend (/api/v1/patients, khusus role front_office).
// Hasil dari server disalin ke db.patients (cache lokal) supaya modul yang masih lokal
// (kunjungan, poliklinik, kasir, PatientBanner) tetap bisa membaca pasien lewat patient(id).

const JK: Record<string, string> = { Male: 'L', Female: 'P' }
const GENDER: Record<string, string> = { L: 'Male', P: 'Female' }
const PENJAMIN: Record<string, string> = { General: 'Umum', BPJS: 'BPJS', Insurance: 'Asuransi' }
const PAYER: Record<string, string> = { Umum: 'General', BPJS: 'BPJS', Asuransi: 'Insurance' }
const KAWIN: Record<string, string> = { Single: 'Belum kawin', Married: 'Kawin', Divorced: 'Cerai hidup', Widowed: 'Cerai mati' }
const MARITAL: Record<string, string> = { 'Belum kawin': 'Single', Kawin: 'Married', 'Cerai hidup': 'Divorced', 'Cerai mati': 'Widowed' }

/** Field yang belum ada di backend; hanya disimpan di cache lokal browser ini. */
export const LOCAL_ONLY = ['noKartu', 'asuransi', 'noPolis'] as const

/** NIK: 16 digit, kode provinsi 11–94, tanggal lahir DDMMYY (perempuan: DD + 40). Server tetap penentu akhir. */
export const validNik = (nik: string) => {
  if (!/^\d{16}$/.test(nik)) return false
  const prov = +nik.slice(0, 2), dd = +nik.slice(6, 8), mm = +nik.slice(8, 10)
  const day = dd > 40 ? dd - 40 : dd
  return prov >= 11 && prov <= 94 && day >= 1 && day <= 31 && mm >= 1 && mm <= 12 && nik.slice(12) !== '0000'
}
/** Penyaring input: buang karakter selain angka (NIK, No. BPJS). */
export const onlyDigits = (v: string, max: number) => String(v || '').replace(/\D/g, '').slice(0, max)
/** Penyaring input No. HP: angka saja, boleh diawali "+". */
export const phoneChars = (v: string) => {
  const s = String(v || '')
  return ((s.trim().startsWith('+') ? '+' : '') + s.replace(/\D/g, '')).slice(0, 15)
}

/** No. HP seluler Indonesia: 08… / 628… / +628…, 10–13 digit. */
export const validHp = (hp: string) => /^(\+62|62|0)8[1-9]\d{6,10}$/.test(hp.replace(/[\s-]/g, ''))

const SERVER_FIELD: [RegExp, string, string][] = [
  [/^nik\b/, 'nik', 'NIK tidak valid (cek kode wilayah & tanggal lahir di NIK)'],
  [/^emergency_contact_phone\b/, 'pjHp', 'No. HP penanggung jawab harus nomor seluler Indonesia (mis. 081234567890)'],
  [/^phone\b/, 'hp', 'No. HP harus nomor seluler Indonesia (mis. 081234567890)'],
  [/^birth_date\b/, 'tglLahir', 'Tanggal lahir tidak valid'],
  [/^email\b/, 'email', 'Email tidak valid'],
]
/** Pecah pesan validasi server ("nik is …; phone must …") menjadi error per kolom form. */
export const serverFieldErrors = (msg: string) => {
  const out: Record<string, string> = {}
  msg.split(';').map((m) => m.trim()).forEach((m) => {
    const hit = SERVER_FIELD.find(([re]) => re.test(m))
    if (hit) out[hit[1]] = hit[2]
  })
  return out
}

export const isServerId =(id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

const fromApi = (p: any, old: any = {}) => ({
  id: p.id,
  rm: p.medical_record_number || '-',
  nik: p.nik,
  nama: p.full_name,
  tglLahir: (p.birth_date || '').slice(0, 10),
  jk: JK[p.gender] || '',
  tempatLahir: p.birth_place || '',
  agama: p.religion || '',
  pendidikan: p.education || '',
  pekerjaan: p.occupation || '',
  statusKawin: KAWIN[p.marital_status] || p.marital_status || '',
  golDarah: p.blood_type || '',
  hp: p.phone || '',
  email: p.email || '',
  alamatKtp: p.id_card_address || '',
  alamatDomisili: p.domicile_address || '',
  pjNama: p.emergency_contact_name || '',
  pjHubungan: p.emergency_contact_relationship || '',
  pjHp: p.emergency_contact_phone || '',
  penjamin: PENJAMIN[p.payer] || 'Umum',
  alergi: p.allergies || '',
  noKartu: old.noKartu || '',
  asuransi: old.asuransi || '',
  noPolis: old.noPolis || '',
  createdAt: p.created_at,
  updatedAt: p.updated_at,
})

const toApi = (f: any) => {
  const body: Record<string, any> = {
    nik: f.nik,
    full_name: f.nama.trim(),
    birth_date: f.tglLahir,
    birth_place: f.tempatLahir.trim(),
    gender: GENDER[f.jk],
    phone: f.hp.replace(/[\s-]/g, ''),
    id_card_address: f.alamatKtp.trim(),
    emergency_contact_name: f.pjNama.trim(),
    emergency_contact_relationship: f.pjHubungan.trim(),
    emergency_contact_phone: f.pjHp.replace(/[\s-]/g, ''),
    payer: PAYER[f.penjamin] || 'General',
    religion: f.agama || '',
    education: f.pendidikan || '',
    occupation: (f.pekerjaan || '').trim(),
    email: (f.email || '').trim(),
    allergies: (f.alergi || '').trim(),
  }
  // Kolom ber-enum / ber-min-length dikirim hanya bila diisi, supaya validasi server tidak menolak string kosong.
  if (f.statusKawin) body.marital_status = MARITAL[f.statusKawin]
  if (f.golDarah) body.blood_type = f.golDarah
  if ((f.alamatDomisili || '').trim()) body.domicile_address = f.alamatDomisili.trim()
  return body
}

export function usePatients() {
  const { db } = useDb()

  const cache = (p: any) => {
    const i = db.patients.findIndex((x: any) => x.id === p.id)
    const local = fromApi(p, i >= 0 ? db.patients[i] : {})
    if (i >= 0) db.patients[i] = local
    else db.patients.push(local)
    return local
  }
  const keepLocal = (id: string, f: any) => {
    const p = db.patients.find((x: any) => x.id === id)
    if (p) LOCAL_ONLY.forEach((k) => (p[k] = f[k] || ''))
    return p
  }

  const list = async (q: { search?: string; penjamin?: string; page?: number; limit?: number }) => {
    const res = await apiPage('/api/v1/patients', {
      query: { search: q.search?.trim(), payer: q.penjamin ? PAYER[q.penjamin] : '', page: q.page || 1, limit: q.limit || 10 },
    })
    return { rows: res.data.map((p) => cache(p)), pagination: res.pagination }
  }
  const get = async (id: string) => cache(await api(`/api/v1/patients/${id}`))
  const create = async (f: any) => {
    const p = cache(await api('/api/v1/patients', { method: 'POST', body: toApi(f) }))
    return keepLocal(p.id, f)
  }
  const update = async (id: string, f: any) => {
    cache(await api(`/api/v1/patients/${id}`, { method: 'PUT', body: toApi(f) }))
    return keepLocal(id, f)
  }
  const remove = async (id: string) => {
    await api(`/api/v1/patients/${id}`, { method: 'DELETE' })
    const i = db.patients.findIndex((x: any) => x.id === id)
    if (i >= 0) db.patients.splice(i, 1)
  }

  return { list, get, create, update, remove }
}
