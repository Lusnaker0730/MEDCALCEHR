# PowerShell script to start MEDCALCEHR with Docker
# Windows 使用此腳本

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  MEDCALCEHR Docker 啟動腳本" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 檢查 Docker 是否已安裝
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 錯誤：未找到 Docker，請先安裝 Docker Desktop" -ForegroundColor Red
    Write-Host "下載地址：https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    pause
    exit 1
}

# 檢查 Docker 是否正在運行
try {
    docker ps | Out-Null
} catch {
    Write-Host "❌ 錯誤：Docker 服務未運行，請啟動 Docker Desktop" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "✅ Docker 已就緒" -ForegroundColor Green
Write-Host ""

# 檢查 docker-compose 是否可用
if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
    Write-Host "🚀 使用 Docker Compose 啟動..." -ForegroundColor Cyan
    Write-Host ""
    
    # 啟動服務
    docker-compose up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "=====================================" -ForegroundColor Green
        Write-Host "  ✅ 啟動成功！" -ForegroundColor Green
        Write-Host "=====================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "📱 訪問應用：http://localhost:8080" -ForegroundColor Yellow
        Write-Host "🏥 SMART Launcher：https://launch.smarthealthit.org/" -ForegroundColor Yellow
        Write-Host "   App Launch URL：http://localhost:8080/launch.html" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "📊 查看日誌：docker-compose logs -f" -ForegroundColor Gray
        Write-Host "⏹️  停止服務：docker-compose down" -ForegroundColor Gray
        Write-Host ""
        
        # 詢問是否打開瀏覽器
        $openBrowser = Read-Host "是否在瀏覽器中打開應用？(Y/N)"
        if ($openBrowser -eq "Y" -or $openBrowser -eq "y") {
            Start-Process "http://localhost:8080"
        }
    } else {
        Write-Host ""
        Write-Host "❌ 啟動失敗，請檢查錯誤信息" -ForegroundColor Red
        Write-Host "查看日誌：docker-compose logs" -ForegroundColor Yellow
        pause
        exit 1
    }
} else {
    Write-Host "🚀 使用 Docker 命令啟動..." -ForegroundColor Cyan
    Write-Host ""
    
    # 構建鏡像
    Write-Host "📦 構建鏡像..." -ForegroundColor Cyan
    docker build -t medcalcehr:latest .
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 鏡像構建失敗" -ForegroundColor Red
        pause
        exit 1
    }
    
    # 檢查是否已有運行的容器
    $existingContainer = docker ps -a --filter "name=medcalcehr-app" --format "{{.Names}}"
    if ($existingContainer) {
        Write-Host "⚠️  發現已存在的容器，正在移除..." -ForegroundColor Yellow
        docker rm -f medcalcehr-app
    }
    
    # 運行容器
    Write-Host "🚀 啟動容器..." -ForegroundColor Cyan
    docker run -d `
        --name medcalcehr-app `
        -p 8080:80 `
        --restart unless-stopped `
        medcalcehr:latest
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "=====================================" -ForegroundColor Green
        Write-Host "  ✅ 啟動成功！" -ForegroundColor Green
        Write-Host "=====================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "📱 訪問應用：http://localhost:8080" -ForegroundColor Yellow
        Write-Host "🏥 SMART Launcher：https://launch.smarthealthit.org/" -ForegroundColor Yellow
        Write-Host "   App Launch URL：http://localhost:8080/launch.html" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "📊 查看日誌：docker logs -f medcalcehr-app" -ForegroundColor Gray
        Write-Host "⏹️  停止服務：docker stop medcalcehr-app" -ForegroundColor Gray
        Write-Host ""
        
        # 詢問是否打開瀏覽器
        $openBrowser = Read-Host "是否在瀏覽器中打開應用？(Y/N)"
        if ($openBrowser -eq "Y" -or $openBrowser -eq "y") {
            Start-Process "http://localhost:8080"
        }
    } else {
        Write-Host ""
        Write-Host "❌ 啟動失敗，請檢查錯誤信息" -ForegroundColor Red
        Write-Host "查看日誌：docker logs medcalcehr-app" -ForegroundColor Yellow
        pause
        exit 1
    }
}

Write-Host ""
Write-Host "按任意鍵退出..." -ForegroundColor Gray
pause



