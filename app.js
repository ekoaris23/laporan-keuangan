// Data Utama tersimpan di LocalStorage
let dataKeuangan = JSON.parse(localStorage.getItem('DATA_KEUANGAN')) || {
    pemasukan: [],
    pengeluaran: [],
    hutang: []
};

function simpanData() {
    localStorage.setItem('DATA_KEUANGAN', JSON.stringify(dataKeuangan));
    renderDashboard();
    renderTabelPemasukan();
    renderTabelPengeluaran();
    renderTabelHutang();
}

// Navigasi Tab
function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if(selectedTab) {
        selectedTab.classList.add('active');
    }
}

// Format Angka ke Rupiah
const formatRp = (num) => 'Rp ' + Number(num).toLocaleString('id-ID');

// --- TERTAMBAH: PROSES INPUT DATA ---

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

function tambahHutang(e) {
    e.preventDefault();
    const pokok = Number(document.getElementById('hut-pokok').value);
    const persenBunga = Number(document.getElementById('hut-bunga').value) || 0;
    const totalBunga = pokok * (persenBunga / 100);
    const totalBayar = pokok + totalBunga;

    const item = {
        id: Date.now(),
        nama: document.getElementById('hut-nama').value,
        pokok: pokok,
        persenBunga: persenBunga,
        totalBayar: totalBayar,
        jatuhTempo: document.getElementById('hut-tempo').value,
        status: 'Belum Lunas'
    };
    dataKeuangan.hutang.push(item);
    document.getElementById('form-hutang').reset();
    simpanData();
    alert('Catatan Hutang berhasil disimpan!');
}

// --- FUNGSI HAPUS DATA ---
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
        simpanData();
    }
}

// --- DASHBOARD & RENDER TABEL ---

function renderDashboard() {
    const unitFilter = document.getElementById('filter-usaha').value;

    let totalPemasukan = 0;
    let totalPengeluaran = 0;
    let totalHutangBelumLunas = 0;

    dataKeuangan.pemasukan.forEach(item => {
        if (unitFilter === 'semua' || item.unit === unitFilter) {
            totalPemasukan += item.jumlah;
        }
    });

    dataKeuangan.pengeluaran.forEach(item => {
        if (unitFilter === 'semua' || item.unit === unitFilter) {
            totalPengeluaran += item.jumlah;
        }
    });

    dataKeuangan.hutang.forEach(item => {
        if (item.status === 'Belum Lunas') {
            totalHutangBelumLunas += item.totalBayar;
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
                    <h4>Total Pengeluaran</h4>
                    <p>${formatRp(totalPengeluaran)}</p>
                </div>
                <div class="card saldo">
                    <h4>Saldo Kas bersih</h4>
                    <p>${formatRp(saldo)}</p>
                </div>
                <div class="card hutang">
                    <h4>Total Hutang Aktif</h4>
                    <p>${formatRp(totalHutangBelumLunas)}</p>
                </div>
            </div>
        `;
    }

    renderWarningJatuhTempo();
}

function renderWarningJatuhTempo() {
    const container = document.getElementById('peringatan-jatuh-tempo');
    if (!container) return;

    const hariIni = new Date().toISOString().split('T')[0];
    const hutangMendekati = dataKeuangan.hutang.filter(h => h.status === 'Belum Lunas');

    if (hutangMendekati.length === 0) {
        container.innerHTML = '<p class="text-aman">Tidak ada hutang aktif saat ini.</p>';
        return;
    }

    let html = '<ul>';
    hutangMendekati.forEach(h => {
        const isLewat = h.jatuhTempo < hariIni;
        const statusClass = isLewat ? 'text-bahaya' : 'text-peringatan';
        html += `<li class="${statusClass}">
            <strong>${h.nama}</strong> - Total Rp ${h.totalBayar.toLocaleString('id-ID')} 
            (Jatuh Tempo: ${h.jatuhTempo}) ${isLewat ? '[JATUH TEMPO LEWAT]' : ''}
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

function renderTabelHutang() {
    const tbody = document.getElementById('tb-hutang');
    if (!tbody) return;
    tbody.innerHTML = dataKeuangan.hutang.map(h => `
        <tr>
            <td>${h.nama}</td>
            <td>${formatRp(h.pokok)}</td>
            <td>${h.persenBunga}% (${formatRp(h.totalBayar - h.pokok)})</td>
            <td><strong>${formatRp(h.totalBayar)}</strong></td>
            <td>${h.jatuhTempo}</td>
            <td><button onclick="ubahStatusHutang(${h.id})">${h.status}</button></td>
            <td><button class="btn-hapus" onclick="hapusItem('hutang', ${h.id})">Hapus</button></td>
        </tr>
    `).join('');
}

// Load saat halaman pertama dibuka
document.addEventListener('DOMContentLoaded', () => {
    simpanData();
});
