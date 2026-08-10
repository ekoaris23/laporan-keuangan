// Struktur Data Utama
let dataKeuangan = JSON.parse(localStorage.getItem('DATA_KEUANGAN')) || {
    pemasukan: [],
    pengeluaran: [],
    pengeluaranRutin: [],
    hutang: []
};

if (!dataKeuangan.pengeluaranRutin) dataKeuangan.pengeluaranRutin = [];

let editHutangId = null;
let editRutinId = null;

function simpanData() {
    localStorage.setItem('DATA_KEUANGAN', JSON.stringify(dataKeuangan));
    renderDashboard();
    renderTabelPemasukan();
    renderTabelPengeluaran();
    renderTabelRutin();
    renderTabelHutang();
}

function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if(selectedTab) {
        selectedTab.classList.add('active');
    }
}

const formatRp = (num) => 'Rp ' + Math.round(Number(num)).toLocaleString('id-ID');

// --- PROSES INPUT / EDIT DATA ---

function tambahPemasukan(e) {
    e.preventDefault();
    const item = {
        id: Date.now(),
        tgl: document.getElementById('in-tgl-masuk').value,
        unit: document.getElementById('in-unit-masuk').value,
        ket: document.getElementById('in-ket-masuk').value,
        jumlah: Number(document.getElementById('in-jumlah-masuk').value)
    };
    dataKeuangan.pemasukan.push(item);
    document.getElementById('form-pemasukan').reset();
    simpanData();
    alert('Pemasukan berhasil disimpan!');
}

function tambahPengeluaran(e) {
    e.preventDefault();
    const item = {
        id: Date.now(),
        tgl: document.getElementById('out-tgl').value,
        unit: document.getElementById('out-unit').value,
        ket: document.getElementById('out-ket').value,
        jumlah: Number(document.getElementById('out-jumlah').value)
    };
    dataKeuangan.pengeluaran.push(item);
    document.getElementById('form-pengeluaran').reset();
    simpanData();
    alert('Pengeluaran berhasil disimpan!');
}

function tambahRutin(e) {
    e.preventDefault();
    const tgl = document.getElementById('rutin-tgl').value;
    const unit = document.getElementById('rutin-unit').value;
    const periode = document.getElementById('rutin-periode').value;
    const ket = document.getElementById('rutin-ket').value;
    const jumlah = Number(document.getElementById('rutin-jumlah').value);

    if (editRutinId !== null) {
        const idx = dataKeuangan.pengeluaranRutin.findIndex(r => r.id === editRutinId);
        if (idx !== -1) {
            dataKeuangan.pengeluaranRutin[idx] = { ...dataKeuangan.pengeluaranRutin[idx], tgl, unit, periode, ket, jumlah };
        }
        editRutinId = null;
        document.querySelector('#form-rutin button[type="submit"]').textContent = 'Simpan Pengeluaran Rutin';
        alert('Pengeluaran Rutin berhasil diperbarui!');
    } else {
        dataKeuangan.pengeluaranRutin.push({ id: Date.now(), tgl, unit, periode, ket, jumlah });
        alert('Pengeluaran Rutin berhasil disimpan!');
    }

    document.getElementById('form-rutin').reset();
    simpanData();
}

function editRutin(id) {
    const item = dataKeuangan.pengeluaranRutin.find(r => r.id === id);
    if (!item) return;

    document.getElementById('rutin-tgl').value = item.tgl;
    document.getElementById('rutin-unit').value = item.unit;
    document.getElementById('rutin-periode').value = item.periode;
    document.getElementById('rutin-ket').value = item.ket;
    document.getElementById('rutin-jumlah').value = item.jumlah;

    editRutinId = id;
    document.querySelector('#form-rutin button[type="submit"]').textContent = 'Update Pengeluaran Rutin';
    document.getElementById('form-rutin').scrollIntoView({ behavior: 'smooth' });
}

// --- LOGIKA HUTANG & SKEMA ANGSRAN ---

function buatJadwalAngsuran(tglMulai, tenor, jenis, cicilan) {
    let jadwal = [];
    let tgl = new Date(tglMulai);

    for (let i = 1; i <= tenor; i++) {
        let tglFormat = tgl.toISOString().split('T')[0];
        jadwal.push({
            no: i,
            tglTempo: tglFormat,
            jumlah: cicilan,
            status: 'Belum'
        });

        if (jenis === 'harian') {
            tgl.setDate(tgl.getDate() + 1);
        } else {
            tgl.setMonth(tgl.getMonth() + 1);
        }
    }
    return jadwal;
}

function tambahHutang(e) {
    e.preventDefault();
    const pokok = Number(document.getElementById('hut-pokok').value);
    const jenis = document.getElementById('hut-jenis').value; 
    const tenor = Number(document.getElementById('hut-tenor').value);
    const persenBunga = Number(document.getElementById('hut-bunga').value) || 0;
    const periodeBunga = document.getElementById('hut-periode-bunga').value; 
    const tglMulai = document.getElementById('hut-tempo').value;

    let totalBunga = 0;
    if (periodeBunga === 'hari') {
        const totalHari = jenis === 'harian' ? tenor : tenor * 30;
        totalBunga = pokok * (persenBunga / 100) * totalHari;
    } else if (periodeBunga === 'bulan') {
        const totalBulan = jenis === 'bulanan' ? tenor : tenor / 30;
        totalBunga = pokok * (persenBunga / 100) * totalBulan;
    } else if (periodeBunga === 'tahun') {
        const totalTahun = jenis === 'bulanan' ? (tenor / 12) : (tenor / 365);
        totalBunga = pokok * (persenBunga / 100) * totalTahun;
    }

    const totalBayar = pokok + totalBunga;
    const cicilanPerPeriode = totalBayar / tenor;
    const rincianAngsuran = buatJadwalAngsuran(tglMulai, tenor, jenis, cicilanPerPeriode);

    if (editHutangId !== null) {
        const idx = dataKeuangan.hutang.findIndex(h => h.id === editHutangId);
        if (idx !== -1) {
            dataKeuangan.hutang[idx] = {
                ...dataKeuangan.hutang[idx],
                nama: document.getElementById('hut-nama').value,
                pokok, jenis, tenor, persenBunga, periodeBunga,
                cicilan: cicilanPerPeriode,
                totalBayar,
                jatuhTempo: tglMulai,
                rincian: rincianAngsuran
            };
        }
        editHutangId = null;
        document.querySelector('#form-hutang button[type="submit"]').textContent = 'Simpan Hutang';
        alert('Data Hutang Berhasil Diperbarui!');
    } else {
        const item = {
            id: Date.now(),
            nama: document.getElementById('hut-nama').value,
            pokok, jenis, tenor, persenBunga, periodeBunga,
            cicilan: cicilanPerPeriode,
            totalBayar,
            jatuhTempo: tglMulai,
            status: 'Belum Lunas',
            rincian: rincianAngsuran
        };
        dataKeuangan.hutang.push(item);
        alert('Pencatatan Hutang Berhasil!');
    }

    document.getElementById('form-hutang').reset();
    simpanData();
}

function bayarAngsuran(idHutang, noAngsuran) {
    const hutang = dataKeuangan.hutang.find(h => h.id === idHutang);
    if (!hutang || !hutang.rincian) return;

    const itemAngsuran = hutang.rincian.find(r => r.no === noAngsuran);
    if (itemAngsuran) {
        itemAngsuran.status = itemAngsuran.status === 'Lunas' ? 'Belum' : 'Lunas';

        // Cek apakah semua angsuran lunas
        const semuaLunas = hutang.rincian.every(r => r.status === 'Lunas');
        hutang.status = semuaLunas ? 'LUNAS' : 'Belum Lunas';

        // Update tanggal jatuh tempo terdekat yang belum lunas
        const angsuranBelum = hutang.rincian.find(r => r.status === 'Belum');
        if (angsuranBelum) {
            hutang.jatuhTempo = angsuranBelum.tglTempo;
        }

        simpanData();
    }
}

function editHutang(id) {
    const item = dataKeuangan.hutang.find(h => h.id === id);
    if (!item) return;

    document.getElementById('hut-nama').value = item.nama;
    document.getElementById('hut-pokok').value = item.pokok;
    document.getElementById('hut-jenis').value = item.jenis;
    document.getElementById('hut-tenor').value = item.tenor;
    document.getElementById('hut-bunga').value = item.persenBunga;
    document.getElementById('hut-periode-bunga').value = item.periodeBunga;
    document.getElementById('hut-tempo').value = item.jatuhTempo;

    editHutangId = id;
    document.querySelector('#form-hutang button[type="submit"]').textContent = 'Update Data Hutang';
    document.getElementById('form-hutang').scrollIntoView({ behavior: 'smooth' });
}

function hapusItem(kategori, id) {
    if (confirm('Yakin ingin menghapus data ini?')) {
        dataKeuangan[kategori] = dataKeuangan[kategori].filter(item => item.id !== id);
        simpanData();
    }
}

function ubahStatusHutang(id) {
    const hutang = dataKeuangan.hutang.find(h => h.id === id);
    if (hutang) {
        hutang.status = hutang.status === 'Belum Lunas' ? 'LUNAS' : 'Belum Lunas';
        if (hutang.rincian) {
            hutang.rincian.forEach(r => r.status = hutang.status === 'LUNAS' ? 'Lunas' : 'Belum');
        }
        simpanData();
    }
}

function toggleRincian(id) {
    const el = document.getElementById(`rincian-${id}`);
    if (el) {
        el.style.display = el.style.display === 'none' ? 'table-row' : 'none';
    }
}

// --- RENDER DASHBOARD & TABEL ---

function renderDashboard() {
    const unitFilter = document.getElementById('filter-usaha').value;

    let totalPemasukan = 0;
    let totalPengeluaran = 0;
    let totalHutangBelumLunas = 0;

    dataKeuangan.pemasukan.forEach(item => {
        if (unitFilter === 'semua' || item.unit === unitFilter) totalPemasukan += item.jumlah;
    });

    dataKeuangan.pengeluaran.forEach(item => {
        if (unitFilter === 'semua' || item.unit === unitFilter) totalPengeluaran += item.jumlah;
    });

    dataKeuangan.pengeluaranRutin.forEach(item => {
        if (unitFilter === 'semua' || item.unit === unitFilter) totalPengeluaran += item.jumlah;
    });

    dataKeuangan.hutang.forEach(item => {
        if (item.status === 'Belum Lunas') {
            if (item.rincian) {
                const sisa = item.rincian.filter(r => r.status === 'Belum').reduce((a, b) => a + b.jumlah, 0);
                totalHutangBelumLunas += sisa;
            } else {
                totalHutangBelumLunas += item.totalBayar;
            }
        }
    });

    const saldo = totalPemasukan - totalPengeluaran;

    const ringkasanKas = document.getElementById('ringkasan-kas');
    if (ringkasanKas) {
        ringkasanKas.innerHTML = `
            <div class="cards-grid">
                <div class="card pemasukan">
                    <h4>Total Pemasukan</h4>
                    <p>${formatRp(totalPemasukan)}</p>
                </div>
                <div class="card pengeluaran">
                    <h4>Total Pengeluaran (Umum + Rutin)</h4>
                    <p>${formatRp(totalPengeluaran)}</p>
                </div>
                <div class="card saldo">
                    <h4>Saldo Kas Bersih</h4>
                    <p>${formatRp(saldo)}</p>
                </div>
                <div class="card hutang">
                    <h4>Total Hutang Aktif</h4>
                    <p>${formatRp(totalHutangBelumLunas)}</p>
                </div>
            </div>
        `;
    }

    renderWarningRutin();
    renderWarningJatuhTempo();
}

function renderWarningRutin() {
    const container = document.getElementById('peringatan-rutin');
    if (!container) return;

    let rutinList = [...dataKeuangan.pengeluaranRutin];

    if (rutinList.length === 0) {
        container.innerHTML = '<p class="text-aman">TIDAK ADA JADWAL PENGELUARAN RUTIN.</p>';
        return;
    }

    rutinList.sort((a, b) => new Date(a.tgl) - new Date(b.tgl));

    const hariIni = new Date();
    hariIni.setHours(0, 0, 0, 0);

    let html = '<ul class="list-peringatan">';

    rutinList.forEach(r => {
        const tglJadwal = new Date(r.tgl);
        tglJadwal.setHours(0, 0, 0, 0);

        const selisihWaktu = tglJadwal - hariIni;
        const selisihHari = Math.ceil(selisihWaktu / (1000 * 60 * 60 * 24));

        let statusClass = '';
        let badgePeringatan = '';

        if (selisihHari < 0) {
            statusClass = 'status-merah';
            badgePeringatan = `🚨 [JADWAL LEWAT ${Math.abs(selisihHari)} HARI]`;
        } else if (selisihHari === 0) {
            statusClass = 'status-merah';
            badgePeringatan = '⚠️ [JADWAL PEMBAYARAN HARI INI]';
        } else if (selisihHari <= 3) {
            statusClass = 'status-merah';
            badgePeringatan = `⚠️ [PEMBAYARAN ${selisihHari} HARI LAGI]`;
        } else if (selisihHari <= 7) {
            statusClass = 'status-kuning';
            badgePeringatan = '⌛ [PEMBAYARAN SEMINGGU LAGI]';
        } else {
            statusClass = 'status-hijau';
            badgePeringatan = `✅ [PEMBAYARAN ${selisihHari} HARI LAGI]`;
        }

        html += `<li class="${statusClass}">
            <div>
                <strong>${r.ket}</strong> (${r.periode}) - ${formatRp(r.jumlah)} 
                (Jadwal: Tgl ${r.tgl})
            </div>
            <span class="badge">${badgePeringatan}</span>
        </li>`;
    });

    html += '</ul>';
    container.innerHTML = html;
}

function renderWarningJatuhTempo() {
    const container = document.getElementById('peringatan-jatuh-tempo');
    if (!container) return;

    let hutangAktif = dataKeuangan.hutang.filter(h => h.status === 'Belum Lunas');

    if (hutangAktif.length === 0) {
        container.innerHTML = '<p class="text-aman">TIDAK ADA HUTANG AKTIF SAAT INI.</p>';
        return;
    }

    hutangAktif.sort((a, b) => new Date(a.jatuhTempo) - new Date(b.jatuhTempo));

    const hariIni = new Date();
    hariIni.setHours(0, 0, 0, 0);

    let html = '<ul class="list-peringatan">';

    hutangAktif.forEach(h => {
        const tglTempo = new Date(h.jatuhTempo);
        tglTempo.setHours(0, 0, 0, 0);

        const selisihWaktu = tglTempo - hariIni;
        const selisihHari = Math.ceil(selisihWaktu / (1000 * 60 * 60 * 24));

        let statusClass = '';
        let badgePeringatan = '';

        if (selisihHari < 0) {
            statusClass = 'status-merah';
            badgePeringatan = `🚨 [JATUH TEMPO LEWAT ${Math.abs(selisihHari)} HARI]`;
        } else if (selisihHari === 0) {
            statusClass = 'status-merah';
            badgePeringatan = '⚠️ [JATUH TEMPO HARI INI]';
        } else if (selisihHari <= 3) {
            statusClass = 'status-merah';
            badgePeringatan = `⚠️ [JATUH TEMPO ${selisihHari} HARI LAGI]`;
        } else if (selisihHari <= 7) {
            statusClass = 'status-merah';
            badgePeringatan = '⚠️ [JATUH TEMPO SEMINGGU LAGI]';
        } else if (selisihHari <= 15) {
            statusClass = 'status-kuning';
            badgePeringatan = `⌛ [JATUH TEMPO ${selisihHari} HARI LAGI]`;
        } else {
            statusClass = 'status-hijau';
            badgePeringatan = `✅ [JATUH TEMPO ${selisihHari} HARI LAGI]`;
        }

        // Cari angsuran aktif saat ini
        let noAngsuranAktif = 1;
        if (h.rincian) {
            const angsuranBelum = h.rincian.find(r => r.status === 'Belum');
            if (angsuranBelum) noAngsuranAktif = angsuranBelum.no;
        }

        html += `<li class="${statusClass}">
            <div>
                <strong>${h.nama}</strong> - Angsuran ${formatRp(h.cicilan)} / ${h.jenis} 
                (Jatuh Tempo: Tgl ${h.jatuhTempo})
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <span class="badge">${badgePeringatan}</span>
                ${h.rincian ? `<button class="btn-bayar-sekarang" onclick="bayarAngsuran(${h.id}, ${noAngsuranAktif})">BAYAR SEKARANG</button>` : ''}
            </div>
        </li>`;
    });

    html += '</ul>';
    container.innerHTML = html;
}

function renderTabelPemasukan() {
    const tbody = document.getElementById('tb-pemasukan');
    if (!tbody) return;
    tbody.innerHTML = dataKeuangan.pemasukan.map(i => `
        <tr>
            <td>${i.tgl}</td>
            <td>${i.unit.toUpperCase()}</td>
            <td>${i.ket}</td>
            <td>${formatRp(i.jumlah)}</td>
            <td><button class="btn-hapus" onclick="hapusItem('pemasukan', ${i.id})">Hapus</button></td>
        </tr>
    `).join('');
}

function renderTabelPengeluaran() {
    const tbody = document.getElementById('tb-pengeluaran');
    if (!tbody) return;
    tbody.innerHTML = dataKeuangan.pengeluaran.map(i => `
        <tr>
            <td>${i.tgl}</td>
            <td>${i.unit.toUpperCase()}</td>
            <td>${i.ket}</td>
            <td>${formatRp(i.jumlah)}</td>
            <td><button class="btn-hapus" onclick="hapusItem('pengeluaran', ${i.id})">Hapus</button></td>
        </tr>
    `).join('');
}

function renderTabelRutin() {
    const tbody = document.getElementById('tb-rutin');
    if (!tbody) return;
    tbody.innerHTML = dataKeuangan.pengeluaranRutin.map(r => `
        <tr>
            <td>${r.tgl}</td>
            <td>${r.unit.toUpperCase()}</td>
            <td><strong>${r.periode}</strong></td>
            <td>${r.ket}</td>
            <td>${formatRp(r.jumlah)}</td>
            <td>
                <button class="btn-edit" onclick="editRutin(${r.id})">Edit</button>
                <button class="btn-hapus" onclick="hapusItem('pengeluaranRutin', ${r.id})">Hapus</button>
            </td>
        </tr>
    `).join('');
}

function renderTabelHutang() {
    const tbody = document.getElementById('tb-hutang');
    if (!tbody) return;
    
    let html = '';
    dataKeuangan.hutang.forEach(h => {
        // Jika belum ada rincian (data lama), generate otomatis
        if (!h.rincian) {
            h.rincian = buatJadwalAngsuran(h.jatuhTempo, h.tenor, h.jenis, h.cicilan);
        }

        html += `
        <tr>
            <td>
                <strong>${h.nama}</strong><br>
                <button class="btn-dropdown" onclick="toggleRincian(${h.id})">▼ Rincian Angsuran</button>
            </td>
            <td>${formatRp(h.pokok)}</td>
            <td>${h.tenor}x (${h.jenis})</td>
            <td>${h.persenBunga}% /${h.periodeBunga}</td>
            <td><strong>${formatRp(h.cicilan)}</strong> /${h.jenis === 'harian' ? 'hari' : 'bulan'}</td>
            <td>${formatRp(h.totalBayar)}</td>
            <td>Tgl ${h.jatuhTempo}</td>
            <td><button onclick="ubahStatusHutang(${h.id})">${h.status}</button></td>
            <td>
                <button class="btn-edit" onclick="editHutang(${h.id})">Edit</button>
                <button class="btn-hapus" onclick="hapusItem('hutang', ${h.id})">Hapus</button>
            </td>
        </tr>
        <!-- Row Dropdown Rincian -->
        <tr id="rincian-${h.id}" style="display: none; background-color: #f8fafc;">
            <td colspan="9">
                <div class="box-rincian">
                    <h4>Rincian Angsuran Berkala: ${h.nama}</h4>
                    <table class="tabel-rincian">
                        <thead>
                            <tr>
                                <th>Angsuran Ke</th>
                                <th>Jatuh Tempo</th>
                                <th>Jumlah Tagihan</th>
                                <th>Status Pembayaran</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${h.rincian.map(r => `
                                <tr>
                                    <td>Angsuran ${r.no} dari ${h.tenor}</td>
                                    <td>Tgl ${r.tglTempo}</td>
                                    <td>${formatRp(r.jumlah)}</td>
                                    <td>
                                        ${r.status === 'Lunas' 
                                            ? '<span class="status-lunas">✅ LUNAS</span>' 
                                            : '<span class="status-belum">❌ BELUM LUNAS</span>'}
                                    </td>
                                    <td>
                                        <button class="${r.status === 'Lunas' ? 'btn-batal-bayar' : 'btn-bayar-sekarang'}" 
                                                onclick="bayarAngsuran(${h.id}, ${r.no})">
                                            ${r.status === 'Lunas' ? 'Batal Bayar' : 'Bayar Angsuran'}
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </td>
        </tr>
        `;
    });

    tbody.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', () => {
    simpanData();
});
