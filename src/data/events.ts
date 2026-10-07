import { EventCard, SabotageSkill, EconomicCondition } from '../types/game';

export const ECONOMIC_CONDITIONS: EconomicCondition[] = [
  {
    phase: 'NORMAL',
    title: 'Ekonomi Stabil (Rupiah Anteng)',
    description: 'Inflasi terkendali, daya beli warga normal, razia polisi standar.',
    rentMultiplier: 1.0,
    taxMultiplier: 1.0,
    corruptionRiskMultiplier: 1.0,
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  {
    phase: 'INFLASI_TINGGI',
    title: 'Inflasi Sembako & Cabai Meroket 🌶️',
    description: 'Harga cabai tembus Rp 120rb/kg! Tarif sewa properti naik +35%, biaya renovasi melonjak.',
    rentMultiplier: 1.35,
    taxMultiplier: 1.15,
    corruptionRiskMultiplier: 1.1,
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300'
  },
  {
    phase: 'BANSOS_CAIR',
    title: 'Musim Bansos Turun Beras 10kg 🌾',
    description: 'Bansos beras & BLT cair serentak! Warga dapat rezeki nomplok saat lewat START.',
    rentMultiplier: 1.1,
    taxMultiplier: 0.8,
    corruptionRiskMultiplier: 1.3,
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  {
    phase: 'TAHUN_POLITIK',
    title: 'Tahun Politik & Musim Kampanye 🗳️',
    description: 'Baliho menutupi tiang listrik, amplop kampanye bertebaran! Keuntungan korupsi +50%, namun KPK ekstra waspada.',
    rentMultiplier: 1.2,
    taxMultiplier: 1.25,
    corruptionRiskMultiplier: 1.6,
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300'
  },
  {
    phase: 'KRISIS_MONETER',
    title: 'Rupiah Melemah & Suku Bunga Naik 📉',
    description: 'Dolar tembus rekor baru! Pajak kekayaan naik +30%, sewa properti lesu -20%.',
    rentMultiplier: 0.8,
    taxMultiplier: 1.3,
    corruptionRiskMultiplier: 1.4,
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300'
  }
];

export const NASIB_CARDS: EventCard[] = [
  {
    id: 'nasib_pinjol',
    title: 'Diteror Debt Collector Pinjol Ilegal! 📱',
    category: 'NASIB',
    description: 'Nomor WhatsApp Anda dijadikan kontak darurat oleh teman SMA yang kabur ke luar kota!',
    effectDescription: 'Bayar uang tutup mulut debt collector Rp 2.500.000.',
    moneyChange: -2500000,
    karmaChange: 5
  },
  {
    id: 'nasib_etle',
    title: 'Kena Tilang Kamera ETLE Salah Sasaran 📷',
    category: 'NASIB',
    description: 'Surat tilang sampai ke rumah karena pelat motor Anda dipalsukan oleh oknum penjual tahu gejrot.',
    effectDescription: 'Bayar denda sidang pengadilan negeri Rp 1.200.000.',
    moneyChange: -1200000,
    karmaChange: 0
  },
  {
    id: 'nasib_viral_parkir',
    title: 'Viral di Medsos X Parkir Mobil di Depan Pagar Orang! 🚗',
    category: 'NASIB',
    description: 'Postingan warga komplek mendapat 25.000 retweets dengan judul "Pemilik Mobil Arogan". Anda harus klarifikasi & sewa buzzer.',
    effectDescription: 'Bayar jasa agensi klarifikasi Rp 3.500.000.',
    moneyChange: -3500000,
    karmaChange: 15
  },
  {
    id: 'nasib_takjil',
    title: 'War Takjil Ramadhan Borong Gorengan 🥟',
    category: 'NASIB',
    description: 'Antre dari jam 3 sore, memborong risoles mayo, bakwan jagung, dan es pisang ijo seger!',
    effectDescription: 'Kenyang dan bahagia! Bayar jajanan Rp 800.000 tapi Karma berkurang -10%.',
    moneyChange: -800000,
    karmaChange: -10
  },
  {
    id: 'nasib_hajatan',
    title: 'Amplop Kondangan 5 Undangan Sekaligus 💌',
    category: 'NASIB',
    description: 'Bulan Syawal tiba, tetangga, sepupu, teman kantor serempak nikah barengan.',
    effectDescription: 'Keluaran amplop tebal Rp 2.000.000.',
    moneyChange: -2000000,
    karmaChange: -5
  },
  {
    id: 'nasib_warisan',
    title: 'Sengketa Tanah Warisan Kakek Dimenangkan! 📜',
    category: 'NASIB',
    description: 'Setelah perdebatan sengit di grup WhatsApp keluarga besar, sertifikat tanah resmi milik Anda.',
    effectDescription: 'Rezeki nomplok! Tambahan dana Rp 6.000.000.',
    moneyChange: 6000000,
    karmaChange: 0
  }
];

export const KESEMPATAN_CARDS: EventCard[] = [
  {
    id: 'kesempatan_laptop',
    title: 'Tender Pengadaan Laptop Desa Tembus! 💻',
    category: 'KESEMPATAN',
    description: 'Spesifikasi laptop jadul seharga Rp 3 Juta berhasil dimasukkan ke anggaran Rp 15 Juta.',
    effectDescription: 'Untung bersih masuk rekening Rp 8.000.000. Risiko Karma +20%!',
    moneyChange: 8000000,
    karmaChange: 20
  },
  {
    id: 'kesempatan_bansos',
    title: 'Dapat Jatah Paket Bansos Sultan 📦',
    category: 'KESEMPATAN',
    description: 'Koneksi orang dalam di kelurahan memasukkan nama Anda ke daftar penerima bantuan khusus.',
    effectDescription: 'Dapat bantuan tunai langsung Rp 4.500.000.',
    moneyChange: 4500000,
    karmaChange: 10
  },
  {
    id: 'kesempatan_investor',
    title: 'Dapat Suntikan Modal Venture Capital Siluman 🚀',
    category: 'KESEMPATAN',
    description: 'Pitching bisnis "Ojek Gerobak Sayur Berbasis Blockchain" sukses memikat angel investor.',
    effectDescription: 'Dana segar cair Rp 10.000.000.',
    moneyChange: 10000000,
    karmaChange: 5
  },
  {
    id: 'kesempatan_kpk_lepas',
    title: 'Pemberitahuan SP3 (Kasus Dihentikan) 🤫',
    category: 'KESEMPATAN',
    description: 'Berkas perkara korupsi Anda tidak cukup bukti karena saksi kunci tiba-tiba lupa ingatan.',
    effectDescription: 'Karma / DPO Meter Anda bersih berkurang -30%!',
    moneyChange: 0,
    karmaChange: -30
  }
];

export const RAZIA_CARDS: EventCard[] = [
  {
    id: 'razia_zebra_damai',
    title: 'Operasi Zebra di Jalur Tikus Belakang Mall 👮‍♂️',
    category: 'RAZIA',
    description: 'Pajak STNK mati 3 tahun dan spion cuma sebelah. Polisi menawarkan dua opsi.',
    effectDescription: 'Pilihan: Bayar uang damai damai cepat Rp 200.000 atau sidang tilang resmi.',
    moneyChange: -300000,
    karmaChange: 5
  },
  {
    id: 'razia_knalpot',
    title: 'Kena Razia Knalpot Brong di Monas 🛵',
    category: 'RAZIA',
    description: 'Suara motor memekakkan telinga disuruh mendengarkan knalpot sendiri selama 2 menit.',
    effectDescription: 'Denda dan ganti knalpot standar Rp 1.500.000.',
    moneyChange: -1500000,
    karmaChange: 0
  },
  {
    id: 'razia_kpk_ott',
    title: 'OPERASI TANGKAP TANGAN (OTT) KPK! 🚨',
    category: 'RAZIA',
    description: 'Kardus durian berisi gepokan uang dolar disita petugas di basement hotel bintang lima!',
    effectDescription: 'Langsung dijebloskan ke Penjara Sukamiskin & denda sita Rp 10.000.000!',
    moneyChange: -10000000,
    karmaChange: 30,
    goToJail: true
  }
];

export const CORRUPTION_SCHEMES = [
  {
    id: 'amplop_lurah',
    name: 'Amplop Cokelat Proyek Paving Kelurahan',
    reward: 10000000,
    karmaCost: 15,
    riskPercent: 15,
    description: 'Bagi-bagi jatah pengerjaan semen dan paving block RT.',
    icon: '✉️'
  },
  {
    id: 'markup_laptop',
    name: 'Mark-Up Pengadaan Laptop & Seragam Desa',
    reward: 25000000,
    karmaCost: 30,
    riskPercent: 35,
    description: 'Beli laptop bekas dimasukkan nota seharga laptop gaming sultan.',
    icon: '💻'
  },
  {
    id: 'sunat_bansos',
    name: 'Sunat Dana Bansos & Hibah Bencana',
    reward: 50000000,
    karmaCost: 50,
    riskPercent: 60,
    description: 'Paket sembako disunat dari Rp 300rb jadi Rp 120rb per kepala keluarga.',
    icon: '🍚'
  },
  {
    id: 'izin_tambang',
    name: 'Jual Izin Konsesi Tambang & Hutan Lindung',
    reward: 100000000,
    karmaCost: 75,
    riskPercent: 85,
    description: 'Tanda tangan izin tambang tanpa AMDAL di pulau terpencil.',
    icon: '⛏️'
  }
];

export const SABOTAGE_SKILLS: SabotageSkill[] = [
  {
    id: 'santet_bisnis',
    name: 'Kirim Santet Usaha 🕯️',
    cost: 3000000,
    description: 'Kirim dupa dan tanah kuburan virtual! Properti lawan tidak bisa memungut sewa selama 2 ronde.',
    effectType: 'FREEZE_PROPERTY',
    icon: '🕯️'
  },
  {
    id: 'satpol_pp',
    name: 'Lapor Satpol PP Dadakan 🚔',
    cost: 2500000,
    description: 'Lapor lapak lawan melanggar perda trotoar. Lawan dipaksa membayar denda Rp 3.500.000!',
    effectType: 'RAID_OWNER',
    icon: '🚔'
  },
  {
    id: 'audit_pajak',
    name: 'Audit Pajak Ditjen Khusus 📑',
    cost: 4000000,
    description: 'Kirim laporan intelijen pajak atas kekayaan lawan. Lawan dipaksa bayar 20% uang tunai mereka!',
    effectType: 'TAX_AUDIT',
    icon: '📑'
  }
];

export const DEFAULT_LEADERBOARD = [
  {
    id: 'lead_1',
    name: 'Haji Linglung Kw Super',
    role: 'Penguasa Lapak Pasar',
    characterEmoji: '🧔🏻‍♂️',
    netWorth: 285000000,
    totalBribes: 120000000,
    category: 'SULTAN' as const,
    statusNote: 'Punya 14 ruko di Tanah Abang dan kapal pesiar di Kepulauan Seribu.',
    date: '2026-10-04'
  },
  {
    id: 'lead_2',
    name: 'Buronan Harun M.',
    role: 'Politisi Siluman DPO',
    characterEmoji: '🕶️',
    netWorth: 195000000,
    totalBribes: 185000000,
    category: 'KORUPTOR' as const,
    statusNote: 'Berhasil mengelabui 9 radar interpol sambil ngopi di Kemang.',
    date: '2026-10-03'
  },
  {
    id: 'lead_3',
    name: 'Ibu Arisan Julid Ny. Titik',
    role: 'Ratu Kos SCBD',
    characterEmoji: '🧕🏼',
    netWorth: 172000000,
    totalBribes: 15000000,
    category: 'SULTAN' as const,
    statusNote: 'Menang arisan 5 kali berturut-turut, perhiasan emas total 2 kilogram.',
    date: '2026-10-02'
  },
  {
    id: 'lead_4',
    name: 'Ustadz Slamet Al-Barokah',
    role: 'Warga Jujur & Dermawan',
    characterEmoji: '👳🏻‍♂️',
    netWorth: 110000000,
    totalBribes: 0,
    category: 'BERKAH' as const,
    statusNote: 'Nol rupiah uang suap, bayar zakat & SPT selalu tepat tanggal 1.',
    date: '2026-10-01'
  }
];
