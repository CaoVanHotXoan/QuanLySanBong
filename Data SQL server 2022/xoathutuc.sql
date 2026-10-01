

DECLARE @ProcedureName NVARCHAR(MAX);
DECLARE @SqlStatement NVARCHAR(MAX);

-- Khai báo con trỏ lấy danh sách tất cả Stored Procedure do người dùng tạo
DECLARE ProcedureCursor CURSOR FOR
SELECT QUOTENAME(ROUTINE_SCHEMA) + '.' + QUOTENAME(ROUTINE_NAME)
FROM INFORMATION_SCHEMA.ROUTINES
WHERE ROUTINE_TYPE = 'PROCEDURE' 
  AND ROUTINE_SCHEMA NOT IN ('sys', 'INFORMATION_SCHEMA');

OPEN ProcedureCursor;
FETCH NEXT FROM ProcedureCursor INTO @ProcedureName;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @SqlStatement = 'DROP PROCEDURE ' + @ProcedureName;
    
    BEGIN TRY
        EXEC sp_executesql @SqlStatement;
        PRINT N'Đã xóa Stored Procedure: ' + @ProcedureName;
    END TRY
    BEGIN CATCH
        PRINT N'Không thể xóa: ' + @ProcedureName + N' - Lỗi: ' + ERROR_MESSAGE();
    END CATCH

    FETCH NEXT FROM ProcedureCursor INTO @ProcedureName;
END;

CLOSE ProcedureCursor;
DEALLOCATE ProcedureCursor;
GO