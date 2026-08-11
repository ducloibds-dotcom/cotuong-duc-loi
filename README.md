# Cờ Tướng · ĐỨC LỢI

Game Cờ Tướng 100 cấp độ, bộ đếm thời gian, giải thưởng lũy thừa (1,1 triệu → 13,78 tỷ).

## Chạy thử ở máy (tùy chọn)
```bash
npm install
npm run dev
```

## Đưa lên GitHub + tên miền cotuong.678.vn

1. Tạo repo mới trên GitHub (vd: `cotuong-duc-loi`), để **Public**.
2. Đẩy code lên:
   ```bash
   git init
   git add .
   git commit -m "Cờ Tướng v2 - ĐỨC LỢI"
   git branch -M main
   git remote add origin https://github.com/<TEN_GITHUB_CUA_BAN>/cotuong-duc-loi.git
   git push -u origin main
   ```
3. Vào repo trên GitHub → **Settings → Pages** → mục "Build and deployment" chọn **Source: GitHub Actions** (workflow `.github/workflows/deploy.yml` đã có sẵn, sẽ tự build & deploy mỗi lần push nhánh `main`).
4. Chờ tab **Actions** chạy xong (vài chục giây) → GitHub sẽ cấp một địa chỉ dạng `https://<ten-github>.github.io/cotuong-duc-loi/`.
5. Trỏ tên miền riêng **cotuong.678.vn**:
   - File `public/CNAME` đã ghi sẵn `cotuong.678.vn` — khi build sẽ tự copy vào `dist/CNAME`.
   - Vào nơi quản lý DNS của domain `678.vn` (chỗ bạn mua tên miền), thêm bản ghi cho subdomain `cotuong`:
     - Kiểu **CNAME**, host `cotuong`, trỏ tới `<ten-github>.github.io`
   - Quay lại **Settings → Pages** trên GitHub, gõ `cotuong.678.vn` vào ô "Custom domain" → Save. Đợi DNS lan truyền (thường 10 phút–vài giờ) rồi bấm "Enforce HTTPS".
6. Xong — truy cập **https://cotuong.678.vn** sẽ thấy game.

## Cấu trúc dự án
- `src/App.jsx` — toàn bộ game (bàn cờ, luật đi quân, AI, 100 cấp độ, thưởng, timer).
- `public/CNAME` — khai báo tên miền riêng cho GitHub Pages.
- `.github/workflows/deploy.yml` — tự động build & deploy khi push lên `main`.
