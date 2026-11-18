# NFA — Trang Sức Bạc

Storefront trang sức bạc phục vụ đồ án môn học Thương mại điện tử.

## Cài đặt và chạy

```bash
# Cài đặt thư viện
npm install

# Kiểm tra kiểu dữ liệu
npm run typecheck

# Kiểm tra định dạng mã nguồn
npm run lint

# Tạo bản dựng sản xuất
npm run build

# Khởi động máy chủ cục bộ
npm run start
```

## Cấu hình biểu mẫu đặt hàng (Google Forms)

Hệ thống đã có sẵn cấu hình mặc định công khai:
- **Biểu mẫu**: `https://docs.google.com/forms/d/e/1FAIpQLSeJm7sBbJdrSvG3IoTjtNmK-1yfWD7en8Y0OHCAhymxsxAwiA/viewform`
- **Mã trường đơn hàng (Entry ID)**: `1911190723`

### Ghi đè biểu mẫu tùy chọn
Khi cần sử dụng biểu mẫu khác, cấu hình cặp biến môi trường trong file `.env.local` hoặc trên giao diện Vercel:
```env
NEXT_PUBLIC_GOOGLE_FORM_URL=https://docs.google.com/forms/d/e/.../viewform
NEXT_PUBLIC_GOOGLE_FORM_ORDER_ENTRY_ID=<mã trường nội dung đơn hàng của biểu mẫu mới>
```

Nội dung đơn hàng được điền trước trên một dòng duy nhất theo định dạng:
`[SKU] Tên sản phẩm xSố lượng, ... | Tạm tính: ...`

Sau khi khách hàng gửi biểu mẫu, cửa hàng sẽ liên hệ điện thoại để xác nhận thông tin đơn hàng và số lượng tồn kho được quản lý thủ công.

Để dùng biểu mẫu khác, xuất bản biểu mẫu với quyền trả lời cho bất kỳ ai có liên kết, thêm trường nội dung đơn hàng và dùng chức năng điền sẵn để lấy mã `entry.<id>`. Nếu quản lý đơn bằng Google Sheets, vào mục **Câu trả lời** của Form và chọn liên kết với bảng tính.

## Cập nhật nội dung cửa hàng

- [Danh mục sản phẩm](src/data/products.ts) chứa 8 mẫu minh họa. Cập nhật giá VNĐ và tồn kho tại đây rồi build lại website.
- Nút **Gửi đánh giá** mở Google Form phản hồi. Website đọc tab phản hồi liên kết, hiển thị họ tên, nội dung và ngày gửi theo thứ tự mới nhất trước. Dữ liệu được làm mới khi có lượt truy cập sau khoảng 60 giây.
- [Tab phản hồi mặc định](https://docs.google.com/spreadsheets/d/1dDaTKjMiOZKnPY8-7N9Hav_4tcq-iOwG0aqHZzKmamo/edit#gid=1854474379) có quyền đọc qua liên kết. Nếu chuyển sang bảng khác có cùng tiêu đề cột, đặt `FEEDBACK_SPREADSHEET_ID` và `FEEDBACK_SHEET_ID` theo ID bảng và giá trị `gid` của tab phản hồi. Website dùng [danh sách dự phòng](src/data/feedback.ts) khi không đọc được tab.

## Triển khai lên Vercel

1. Đẩy mã nguồn lên Git và liên kết với dự án trên Vercel.
2. Bản dựng tự động hoạt động với cấu hình mặc định có sẵn mà không bắt buộc phải nhập biến môi trường.
3. Nếu dùng biểu mẫu riêng, thêm 2 biến môi trường nêu trên vào mục Environment Variables của Vercel.
4. Khi dùng lại cấu hình mặc định, gỡ các biến môi trường ghi đè cũ trước khi triển khai lại.
