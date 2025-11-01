#!/bin/bash
# Bash script to start MEDCALCEHR with Docker
# Linux/Mac 使用此腳本

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}=====================================${NC}"
echo -e "${CYAN}  MEDCALCEHR Docker 啟動腳本${NC}"
echo -e "${CYAN}=====================================${NC}"
echo ""

# 檢查 Docker 是否已安裝
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ 錯誤：未找到 Docker，請先安裝 Docker${NC}"
    echo -e "${YELLOW}下載地址：https://www.docker.com/get-started${NC}"
    exit 1
fi

# 檢查 Docker 是否正在運行
if ! docker ps &> /dev/null; then
    echo -e "${RED}❌ 錯誤：Docker 服務未運行，請啟動 Docker${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker 已就緒${NC}"
echo ""

# 檢查 docker-compose 是否可用
if command -v docker-compose &> /dev/null; then
    echo -e "${CYAN}🚀 使用 Docker Compose 啟動...${NC}"
    echo ""
    
    # 啟動服務
    docker-compose up -d
    
    echo ""
    echo -e "${GREEN}=====================================${NC}"
    echo -e "${GREEN}  ✅ 啟動成功！${NC}"
    echo -e "${GREEN}=====================================${NC}"
    echo ""
    echo -e "${YELLOW}📱 訪問應用：http://localhost:8080${NC}"
    echo -e "${YELLOW}🏥 SMART Launcher：https://launch.smarthealthit.org/${NC}"
    echo -e "${CYAN}   App Launch URL：http://localhost:8080/launch.html${NC}"
    echo ""
    echo -e "${GRAY}📊 查看日誌：docker-compose logs -f${NC}"
    echo -e "${GRAY}⏹️  停止服務：docker-compose down${NC}"
    echo ""
    
    # 詢問是否打開瀏覽器
    read -p "是否在瀏覽器中打開應用？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command -v xdg-open &> /dev/null; then
            xdg-open "http://localhost:8080"
        elif command -v open &> /dev/null; then
            open "http://localhost:8080"
        else
            echo -e "${YELLOW}⚠️  無法自動打開瀏覽器，請手動訪問 http://localhost:8080${NC}"
        fi
    fi
else
    echo -e "${CYAN}🚀 使用 Docker 命令啟動...${NC}"
    echo ""
    
    # 構建鏡像
    echo -e "${CYAN}📦 構建鏡像...${NC}"
    docker build -t medcalcehr:latest .
    
    # 檢查是否已有運行的容器
    if docker ps -a --filter "name=medcalcehr-app" --format "{{.Names}}" | grep -q "medcalcehr-app"; then
        echo -e "${YELLOW}⚠️  發現已存在的容器，正在移除...${NC}"
        docker rm -f medcalcehr-app
    fi
    
    # 運行容器
    echo -e "${CYAN}🚀 啟動容器...${NC}"
    docker run -d \
        --name medcalcehr-app \
        -p 8080:80 \
        --restart unless-stopped \
        medcalcehr:latest
    
    echo ""
    echo -e "${GREEN}=====================================${NC}"
    echo -e "${GREEN}  ✅ 啟動成功！${NC}"
    echo -e "${GREEN}=====================================${NC}"
    echo ""
    echo -e "${YELLOW}📱 訪問應用：http://localhost:8080${NC}"
    echo -e "${YELLOW}🏥 SMART Launcher：https://launch.smarthealthit.org/${NC}"
    echo -e "${CYAN}   App Launch URL：http://localhost:8080/launch.html${NC}"
    echo ""
    echo -e "${GRAY}📊 查看日誌：docker logs -f medcalcehr-app${NC}"
    echo -e "${GRAY}⏹️  停止服務：docker stop medcalcehr-app${NC}"
    echo ""
    
    # 詢問是否打開瀏覽器
    read -p "是否在瀏覽器中打開應用？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command -v xdg-open &> /dev/null; then
            xdg-open "http://localhost:8080"
        elif command -v open &> /dev/null; then
            open "http://localhost:8080"
        else
            echo -e "${YELLOW}⚠️  無法自動打開瀏覽器，請手動訪問 http://localhost:8080${NC}"
        fi
    fi
fi

echo ""
echo -e "${GRAY}完成！${NC}"



