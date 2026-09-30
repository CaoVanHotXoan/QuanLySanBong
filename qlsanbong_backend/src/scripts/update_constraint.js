const { poolPromise } = require('../config/db');

async function updateConstraint() {
    try {
        const pool = await poolPromise;
        console.log('Dropping old constraint CK__Don_Dat_S__trang__07AC1A97...');
        await pool.request().query(`
            IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK__Don_Dat_S__trang__07AC1A97')
            BEGIN
                ALTER TABLE Don_Dat_San DROP CONSTRAINT CK__Don_Dat_S__trang__07AC1A97;
            END
        `);

        console.log('Adding updated constraint...');
        await pool.request().query(`
            ALTER TABLE Don_Dat_San ADD CONSTRAINT CK_Don_Dat_San_trang_thai 
            CHECK (trang_thai IN ('CHO_THANH_TOAN', 'CHO_XAC_NHAN', 'DA_COC', 'DA_THANH_TOAN', 'Da Thanh Toan', 'HOAN_THANH', 'DA_HUY', 'DA_CHOT'));
        `);

        console.log('✅ Constraint updated successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error updating constraint:', err);
        process.exit(1);
    }
}

updateConstraint();
