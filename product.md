  🔴 必須解決（上線前阻擋項）

  #: 1
  項目: 法規合規（Phase 5）
  現況: 追溯矩陣僅完成 1/92 計算器、SOUP 清單不完整、無臨床評估報告（CER）、無 FMEA
  影響: 醫療軟體無法合法上市（TFDA/FDA/CE）
  ────────────────────────────────────────
  #: 2
  項目: HTTPS/TLS
  現況: Nginx 僅監聽 port 80（HTTP），HSTS header 已設但實際無效
  影響: 傳輸 ePHI 違反個資法/HIPAA
  ────────────────────────────────────────
  #: 3
  項目: npm 依賴漏洞
  現況: npm audit 報告 67 個漏洞（3 critical、54 high），主要來自 @lhci/cli、@cyclonedx
  影響: CI/CD 供應鏈風險
  ────────────────────────────────────────
  #: 4
  項目: 無速率限制
  現況: Nginx 未設定 limit_req，無 API gateway
  影響: DDoS/濫用 FHIR server 風險
  ────────────────────────────────────────
  #: 5
  項目: 輸入驗證完整性
  現況: 未系統性驗證全部 92 個計算器的 FHIR 自動填入 vs 手動輸入路徑
  影響: 可能產生錯誤計算結果

  ---
  🟡 重要項目（Go-Live 前應完成）

  #: 6
  項目: Staging 環境
  現況: docker-compose.staging.yml 存在但未實際部署
  建議: 部署獨立 staging 主機，完整 smoke test
  ────────────────────────────────────────
  #: 7
  項目: Container Registry
  現況: Docker image 僅存本地，CI 有 GHCR push 但未啟用
  建議: 啟用 GHCR，semantic versioning tag
  ────────────────────────────────────────
  #: 8
  項目: 日誌集中化
  現況: Logger + Sentry 已實作，但 log 僅輸出 stdout
  建議: 接入 CloudWatch/ELK/Splunk，90 天留存
  ────────────────────────────────────────
  #: 9
  項目: 安全掃描
  現況: 僅 npm audit（continue-on-error）
  建議: 加入 Dependabot + Snyk + Trivy（容器掃描）
  ────────────────────────────────────────
  #: 10
  項目: i18n 國際化
  現況: 框架已建（src/i18n/），但醫學術語翻譯不完整
  建議: 完成繁體中文/英文全覆蓋，需臨床審查
  ────────────────────────────────────────
  #: 11
  項目: 監控告警
  現況: Sentry 已配置但無 on-call、無 uptime monitoring
  建議: 設定 UptimeRobot + Sentry alert rules + 值班輪轉
  ────────────────────────────────────────
  #: 12
  項目: 部署策略
  現況: 文件有 Blue-Green 描述但未實作、image 僅 latest tag
  建議: 實作 Blue-Green/Canary + 自動 rollback

  ---
  🟢 建議改善（上線後迭代）

  ┌─────┬──────────────────┬──────────────────────────────────────────────────────────────┐
  │  #  │       項目       │                             說明                             │
  ├─────┼──────────────────┼──────────────────────────────────────────────────────────────┤
  │ 13  │ 測試覆蓋率       │ 現為 ~53%（門檻 50%），業界標準建議 70%+                     │
  ├─────┼──────────────────┼──────────────────────────────────────────────────────────────┤
  │ 14  │ Type Safety      │ 15+ 處 any 型別、2 處 @ts-ignore、4 個已知 ESLint error      │
  ├─────┼──────────────────┼──────────────────────────────────────────────────────────────┤
  │ 15  │ Mutation Testing │ 未整合 Stryker，無法偵測測試品質盲點                         │
  ├─────┼──────────────────┼──────────────────────────────────────────────────────────────┤
  │ 16  │ 圖片最佳化       │ 無 WebP 轉換、字型 subsetting                                │
  ├─────┼──────────────────┼──────────────────────────────────────────────────────────────┤
  │ 17  │ EHR 回寫         │ Provenance Service 已建但 FHIR Observation write-back 未完成 │
  ├─────┼──────────────────┼──────────────────────────────────────────────────────────────┤
  │ 18  │ Privacy Policy   │ 無隱私政策頁面、無資料刪除機制                               │
  ├─────┼──────────────────┼──────────────────────────────────────────────────────────────┤
  │ 19  │ CHANGELOG.md     │ 使用 production_roadmap.md 替代，無正式版本變更紀錄          │
  ├─────┼──────────────────┼──────────────────────────────────────────────────────────────┤
  │ 20  │ Feature Flags    │ 無功能開關機制，無法漸進式發布                               │
  └─────┴──────────────────┴──────────────────────────────────────────────────────────────┘

  ---
  現有優勢（已完成的好基礎）

  - 測試基礎紮實：3,467 單元測試 + 416 Golden Dataset 臨床驗證 + 7 套 E2E + a11y 測試
  - CI/CD 完整：GitHub Actions 多 job pipeline（build → test → e2e → lighthouse → security → SBOM →      
  docker）
  - 安全 Headers：CSP、HSTS、X-Frame-Options、Permissions-Policy 全部到位
  - 結構化日誌：PHI 自動脫敏的 Logger + Sentry 整合
  - Docker 多階段建置：Node builder → Nginx Alpine production
  - TW Core IG v1.0.0：台灣健保署 FHIR Profile 已整合
  - 文件完善：Architecture、Deployment SOP、Disaster Recovery、Monitoring 全有

  ---
  建議推進時程

  Week 1-2  ▸ 安全加固：TLS 驗證、npm audit fix、Nginx rate limiting、Dependabot
  Week 3-4  ▸ 法規文件：Traceability Matrix（92 calculators）、SOUP 更新、CER 初稿
  Week 5-6  ▸ 部署基礎：Staging 環境、GHCR registry、UptimeRobot、Sentry alerts
  Week 7-8  ▸ 品質提升：i18n 完成、coverage 提升至 70%、type safety 修復
  Week 9-10 ▸ 驗證上線：Staging full E2E、DR drill、Smoke test、臨床驗證

  總評：技術架構成熟度 ~65/100，主要阻擋在法規合規（Phase 5）和 HTTPS 部署驗證。
  建議雙軌並進——技術團隊處理安全/部署，同時啟動法規文件準備。