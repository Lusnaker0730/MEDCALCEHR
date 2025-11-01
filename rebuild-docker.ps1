# CGMH EHRCALC - Docker 重建與啟動腳本
# 此腳本會停止現有容器、重新建置映像檔（包含所有更新）、然後啟動容器

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CGMH EHRCALC - Docker 重建與啟動" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 檢查 Docker 是否運行
Write-Host "檢查 Docker 狀態..." -ForegroundColor Yellow
docker info > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "錯誤: Docker 未運行或未安裝" -ForegroundColor Red
    Write-Host "請啟動 Docker Desktop 然後重試" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "Docker 正在運行 ✓" -ForegroundColor Green
Write-Host ""

# 停止並移除現有容器
Write-Host "停止現有容器..." -ForegroundColor Yellow
docker-compose down
Write-Host ""

# 清理舊映像（可選）
Write-Host "是否要清理舊的 Docker 映像？(y/N): " -ForegroundColor Yellow -NoNewline
$cleanup = Read-Host
if ($cleanup -eq 'y' -or $cleanup -eq 'Y') {
    Write-Host "清理舊映像..." -ForegroundColor Yellow
    docker image prune -f
    docker rmi medcalcehr:latest -f 2>$null
}
Write-Host ""

# 重新建置映像
Write-Host "重新建置 Docker 映像（包含 launch.html）..." -ForegroundColor Yellow
docker-compose build --no-cache
if ($LASTEXITCODE -ne 0) {
    Write-Host "錯誤: Docker 建置失敗" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "建置完成 ✓" -ForegroundColor Green
Write-Host ""

# 啟動容器
Write-Host "啟動容器..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "錯誤: 容器啟動失敗" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "容器已啟動 ✓" -ForegroundColor Green
Write-Host ""

# 等待容器完全啟動
Write-Host "等待容器初始化..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 顯示容器狀態
Write-Host ""
Write-Host "容器狀態:" -ForegroundColor Cyan
docker-compose ps
Write-Host ""

# 驗證 launch.html 存在
Write-Host "驗證 launch.html 是否存在於容器中..." -ForegroundColor Yellow
$launchCheck = docker exec medcalcehr-app ls -la /usr/share/nginx/html/launch.html 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "launch.html 已包含在容器中 ✓" -ForegroundColor Green
} else {
    Write-Host "警告: launch.html 未找到" -ForegroundColor Red
}
Write-Host ""

# 獲取本機 IP
Write-Host "獲取本機 IP 位址..." -ForegroundColor Yellow
$ipAddresses = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike "127.*"} | Select-Object -ExpandProperty IPAddress
Write-Host ""

# 顯示訪問資訊
Write-Host "========================================" -ForegroundColor Green
Write-Host "應用程式已成功啟動！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "本機訪問:" -ForegroundColor Cyan
Write-Host "  首頁:     http://localhost:8080/" -ForegroundColor White
Write-Host "  啟動頁:   http://localhost:8080/launch.html" -ForegroundColor White
Write-Host ""

if ($ipAddresses) {
    Write-Host "網路訪問 (用於 SMART Launcher):" -ForegroundColor Cyan
    foreach ($ip in $ipAddresses) {
        Write-Host "  首頁:     http://${ip}:8080/" -ForegroundColor White
        Write-Host "  啟動頁:   http://${ip}:8080/launch.html" -ForegroundColor White
    }
    Write-Host ""
}

Write-Host "SMART Health IT Launcher:" -ForegroundColor Cyan
Write-Host "  https://launch.smarthealthit.org/" -ForegroundColor White
Write-Host ""
Write-Host "設定 SMART Launcher 時使用:" -ForegroundColor Yellow
Write-Host "  App Launch URL: http://localhost:8080/launch.html" -ForegroundColor White
if ($ipAddresses -and $ipAddresses.Count -gt 0) {
    Write-Host "  或: http://$($ipAddresses[0]):8080/launch.html" -ForegroundColor White
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# 詢問是否查看日誌
Write-Host "是否要查看容器日誌？(y/N): " -ForegroundColor Yellow -NoNewline
$viewLogs = Read-Host
if ($viewLogs -eq 'y' -or $viewLogs -eq 'Y') {
    Write-Host ""
    Write-Host "顯示容器日誌 (按 Ctrl+C 退出)..." -ForegroundColor Cyan
    Write-Host ""
    docker-compose logs -f
}

Write-Host ""
Write-Host "完成！" -ForegroundColor Green
Write-Host ""
Write-Host "實用命令:" -ForegroundColor Cyan
Write-Host "  查看日誌:   docker-compose logs -f" -ForegroundColor White
Write-Host "  停止容器:   docker-compose down" -ForegroundColor White
Write-Host "  重啟容器:   docker-compose restart" -ForegroundColor White
Write-Host "  查看狀態:   docker-compose ps" -ForegroundColor White
Write-Host ""

