// Struktur Data Utama (diambil dari LocalStorage jika ada)
let dataKeuangan = JSON.parse(localStorage.getItem('DATA_KEUANGAN')) || {
    pemasukan: [],
    pengeluaran: [],
    hutang: []
};

// Fungsi Simpan Data ke LocalStorage
function simpanData() {
    localStorage.setItem('DATA_KEUANGAN', JSON.stringify(dataKeuangan));
    renderDashboard();
}

// Navigasi Tab
function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Tampilkan tab yang dipilih
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if(selectedTab) {
        selectedTab.classList.add('active');
    }
}

// Menghitung & Menampilkan Ringkasan di Dashboard
function renderDashboard() {
    const unitFilter = document.getElementById('filter-usaha').value;

    let totalPemasukan = 0;
    let totalPengeluaran = 0;

    // Hitung Pemasukan
    dataKeuangan.pemasukan.forEach(item => {
        if (unitFilter === 'semua' || item.unit === unitFilter) {
            totalPemasukan += Number(item.jumlah);
        }
    });

    // Hitung Pengeluaran
    dataKeuangan.pengeluaran.forEach(item => {
        if (unitFilter === 'semua' || item.unit === unitFilter) {
            totalPengeluaran += Number(item.jumlah);
        }
    });

    const saldo = totalPemasukan - totalPengeluaran;

    // Format Rupiah
    const formatRp = (num) => 'Rp ' + num.toLocaleString('id-ID');

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
                    <h4>Saldo Kas</h4>
                    <p>${formatRp(saldo)}</p>
                </div>
            </div>
        `;
    }
}

// Inisialisasi saat aplikasi pertama dimuat
document.addEventListener('DOMContentLoaded', () => {
    renderDashboard();
});
