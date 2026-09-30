async function testPayOSLink() {
    try {
        const res = await fetch('http://localhost:5000/api/thanh-toan/payos/tao-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bookingData: {
                    ma_san: 1,
                    ngay_da: '2026-09-30',
                    gio_bat_dau: '06:00',
                    gio_ket_thuc: '07:00',
                    tien_san: 6000,
                    tong_tien: 6000,
                    ghi_chu: null,
                    dich_vu_chon: {},
                    ho_ten: 'Nguyễn Văn A',
                    so_dien_thoai: '0912345678'
                },
                so_tien: 1800,
                loai_thanh_toan: 'DAT_COC',
                ho_ten: 'Nguyễn Văn A',
                so_dien_thoai: '0912345678'
            })
        });
        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Response:', data);

        if (data.success && data.data) {
            console.log('Now testing cleanup...');
            const cleanupRes = await fetch('http://localhost:5000/api/thanh-toan/payos/huy-don-tam', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ma_don_dat: data.data.ma_don_dat,
                    orderCode: data.data.orderCode
                })
            });
            const cleanupData = await cleanupRes.json();
            console.log('Cleanup result:', cleanupData);
        }
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

testPayOSLink();
