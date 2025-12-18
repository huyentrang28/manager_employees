# 📋 TỔNG HỢP CHI TIẾT TẤT CẢ CÁC CHỨC NĂNG CỦA HRMS SYSTEM

## 🎯 TỔNG QUAN HỆ THỐNG

**HRMS System** (Human Resource Management System) là hệ thống quản lý nhân sự toàn diện được xây dựng với:
- **Framework**: Next.js 14 (React)
- **Database**: MongoDB (Prisma ORM)
- **Authentication**: NextAuth.js
- **UI**: Tailwind CSS + Radix UI + Lucide Icons
- **Port**: 3001

---

## 👥 HỆ THỐNG PHÂN QUYỀN

Hệ thống có **5 loại vai trò** với quyền truy cập khác nhau:

### 1. **BOARD** (Ban Giám Đốc)
- Quyền cao nhất, truy cập tất cả module
- Xem tổng quan toàn bộ hệ thống
- Quản lý tất cả nhân viên, lương, báo cáo

### 2. **HR** (Nhân sự)
- Quản lý nhân viên, tuyển dụng, hợp đồng
- Tính lương và quản lý payroll
- Quản lý đào tạo, đánh giá hiệu suất
- Xem báo cáo

### 3. **MANAGER** (Quản lý)
- Quản lý nhân viên trong phòng ban
- Duyệt nghỉ phép
- Đánh giá hiệu suất nhân viên
- Xem báo cáo phòng ban

### 4. **EMPLOYEE** (Nhân viên)
- Xem thông tin cá nhân
- Chấm công, xin nghỉ phép
- Xem lương, đào tạo
- Không thể chỉnh sửa thông tin người khác

### 5. **GUEST** (Khách)
- Chỉ xem trang chủ và tin tuyển dụng công khai
- Có thể đăng ký tài khoản để ứng tuyển
- Không truy cập được hệ thống nội bộ

---

## 🔐 1. XÁC THỰC VÀ BẢO MẬT

### 1.1. Đăng ký tài khoản
- **Route**: `/register`
- **API**: `/api/auth/register/public`
- **Chức năng**:
  - Đăng ký tài khoản mới (mặc định role: GUEST)
  - Yêu cầu: Họ, Tên, Email, Mật khẩu (tối thiểu 6 ký tự)
  - Xác nhận mật khẩu
  - Validation form
  - Mã hóa mật khẩu bằng bcryptjs
  - Tự động chuyển đến trang đăng nhập sau khi đăng ký thành công

### 1.2. Đăng nhập
- **Route**: `/login`
- **API**: NextAuth credentials provider
- **Chức năng**:
  - Đăng nhập bằng Email và Mật khẩu
  - Xác thực qua NextAuth
  - Tự động redirect theo role:
    - GUEST → Trang chủ
    - Các role khác → Dashboard
  - Lưu session
  - Hiển thị thông báo lỗi nếu sai thông tin

### 1.3. Đăng xuất
- **Chức năng**: Đăng xuất và xóa session
- **Redirect**: Về trang đăng nhập

### 1.4. Reset mật khẩu
- **API**: `/api/auth/reset-password`
- **Chức năng**: (Đang phát triển) Gửi email reset mật khẩu

### 1.5. Middleware bảo vệ routes
- **File**: `middleware.ts`
- **Chức năng**:
  - Kiểm tra authentication cho các route protected
  - Phân quyền truy cập theo role
  - Redirect tự động nếu không có quyền
  - Public routes: `/`, `/login`, `/register`, `/about`, `/jobs/*`

---

## 🏠 2. TRANG CHỦ (HOME PAGE)

### 2.1. Trang chủ công khai
- **Route**: `/`
- **Chức năng**:
  - Hiển thị thông tin công ty
  - Danh sách tin tuyển dụng công khai
  - Tìm kiếm việc làm theo tiêu đề, phòng ban
  - Lọc theo phòng ban (IT, HR, Operations, Sales, Marketing)
  - Xem chi tiết từng tin tuyển dụng
  - Nút đăng nhập/đăng ký (nếu chưa đăng nhập)
  - Nút vào hệ thống/đăng xuất (nếu đã đăng nhập)

### 2.2. Trang About
- **Route**: `/about`
- **Chức năng**: Giới thiệu về công ty và hệ thống

---

## 📊 3. DASHBOARD (Bảng điều khiển)

### 3.1. Dashboard chính
- **Route**: `/dashboard`
- **Chức năng**:
  - Hiển thị thống kê tổng quan theo role:
    - **BOARD**: Tổng nhân viên, Tuyển dụng, Nghỉ phép chờ duyệt, **Tổng lương đã trả** (tất cả nhân viên)
    - **HR/MANAGER/EMPLOYEE**: Tổng nhân viên, Tuyển dụng, **Nghỉ phép của tôi chờ duyệt**, **Tổng lương của tôi**
  - Cards thống kê có thể click để điều hướng
  - Tính toán lương thông minh:
    - Ưu tiên lấy từ PayrollRecord đã trả (PAID)
    - Nếu chưa có, tính từ hợp đồng (chỉ các tháng đã hoàn thành)
    - Cộng thêm thưởng (Reward) theo payPeriod
  - Hiển thị hoạt động gần đây (đang phát triển)
  - Thống kê nhanh (đang phát triển)

---

## 👤 4. QUẢN LÝ NHÂN VIÊN (EMPLOYEES)

### 4.1. Danh sách nhân viên
- **Route**: `/employees`
- **API**: `/api/employees`
- **Quyền truy cập**: BOARD, HR, MANAGER
- **Chức năng**:
  - Xem danh sách tất cả nhân viên
  - Tìm kiếm theo tên, mã nhân viên, email
  - Lọc theo phòng ban, vị trí, trạng thái
  - Xem thông tin cơ bản: Mã NV, Họ tên, Phòng ban, Vị trí, Trạng thái
  - Click vào nhân viên để xem chi tiết

### 4.2. Chi tiết nhân viên
- **Route**: `/employees/[id]`
- **API**: `/api/employees/[id]`
- **Quyền truy cập**: 
  - BOARD, HR: Xem tất cả
  - MANAGER: Xem nhân viên trong phòng ban
  - EMPLOYEE: Chỉ xem thông tin của chính mình
- **Chức năng**:
  - Xem thông tin cá nhân đầy đủ
  - Quản lý theo tabs:
    - **Thông tin cơ bản**: Họ tên, Ngày sinh, Giới tính, SĐT, Địa chỉ, Liên hệ khẩn cấp
    - **Công việc**: Phòng ban, Vị trí, Ngày vào làm, Mức lương, Trạng thái, Quản lý trực tiếp
    - **Học vấn**: Danh sách bằng cấp, trường học, GPA
    - **Kinh nghiệm**: Lịch sử làm việc trước đây
    - **Thưởng**: Danh sách thưởng (BONUS, CERTIFICATE, PROMOTION)
    - **Kỷ luật**: Cảnh báo, đình chỉ, sa thải
    - **Lương**: Lịch sử lương theo tháng
    - **Hợp đồng**: Danh sách hợp đồng lao động
    - **Bảo hiểm**: Thông tin bảo hiểm
    - **Tài liệu**: CV, chứng chỉ, hợp đồng, CMND

### 4.3. Thêm nhân viên mới
- **Route**: `/employees/new`
- **API**: `POST /api/employees`
- **Quyền**: BOARD, HR
- **Chức năng**:
  - Tạo nhân viên mới
  - Tạo tài khoản User tự động
  - Nhập đầy đủ thông tin: Cá nhân, Công việc, Lương
  - Tự động tạo mã nhân viên (employeeId)

### 4.4. Chỉnh sửa nhân viên
- **Route**: `/employees/[id]/edit`
- **API**: `PUT /api/employees/[id]`
- **Quyền**: BOARD, HR
- **Chức năng**:
  - Cập nhật thông tin nhân viên
  - Thay đổi phòng ban, vị trí, lương
  - Cập nhật trạng thái (ACTIVE, INACTIVE, ON_LEAVE, TERMINATED)

### 4.5. Quản lý học vấn
- **API**: `/api/employees/[id]/education`
- **Chức năng**:
  - Thêm/sửa/xóa bằng cấp
  - Thông tin: Bằng cấp, Ngành học, Trường, Thời gian, GPA, Chứng chỉ

### 4.6. Quản lý kinh nghiệm
- **API**: `/api/employees/[id]/experience`
- **Chức năng**:
  - Thêm/sửa/xóa kinh nghiệm làm việc
  - Thông tin: Công ty, Vị trí, Thời gian, Mô tả, Thành tựu

### 4.7. Quản lý thưởng
- **API**: `/api/employees/[id]/rewards`
- **Chức năng**:
  - Thêm thưởng cho nhân viên
  - Loại thưởng: BONUS, CERTIFICATE, PROMOTION
  - Gắn với payPeriod (tháng được thưởng)
  - Ghi chú người trao thưởng

### 4.8. Quản lý kỷ luật
- **API**: `/api/employees/[id]/discipline`
- **Chức năng**:
  - Ghi nhận kỷ luật nhân viên
  - Loại: WARNING, SUSPENSION, TERMINATION
  - Mức độ: MINOR, MODERATE, SEVERE
  - Ghi chú hành động đã thực hiện

### 4.9. Lịch sử lương
- **API**: `/api/employees/[id]/salary-history`
- **Chức năng**:
  - Xem lịch sử thay đổi lương
  - Hiển thị theo thời gian

### 4.10. Thay đổi trạng thái nhân viên
- **API**: `/api/employees/[id]/status`
- **Chức năng**:
  - Cập nhật trạng thái: ACTIVE, INACTIVE, ON_LEAVE, TERMINATED

---

## 💼 5. TUYỂN DỤNG (RECRUITMENT)

### 5.1. Danh sách tin tuyển dụng
- **Route**: `/recruitment`
- **API**: `/api/recruitment/jobs`
- **Quyền**: BOARD, HR, MANAGER
- **Chức năng**:
  - Xem tất cả tin tuyển dụng
  - Lọc theo trạng thái: OPEN, CLOSED, FILLED
  - Tìm kiếm theo tiêu đề, phòng ban
  - Xem số lượng ứng viên đã ứng tuyển

### 5.2. Chi tiết tin tuyển dụng
- **Route**: `/recruitment/[id]`
- **API**: `/api/recruitment/jobs/[id]`
- **Chức năng**:
  - Xem đầy đủ thông tin: Tiêu đề, Mô tả, Yêu cầu, Địa điểm, Loại việc làm, Mức lương
  - Xem danh sách ứng viên đã ứng tuyển
  - Quản lý trạng thái ứng viên: PENDING, REVIEWING, INTERVIEWED, OFFERED, ACCEPTED, REJECTED
  - Đặt lịch phỏng vấn
  - Ghi chú cho ứng viên

### 5.3. Tạo tin tuyển dụng mới
- **Route**: `/recruitment/new`
- **API**: `POST /api/recruitment/jobs`
- **Quyền**: BOARD, HR, MANAGER
- **Chức năng**:
  - Tạo tin tuyển dụng mới
  - Nhập: Tiêu đề, Phòng ban, Mô tả, Yêu cầu, Địa điểm, Loại việc làm, Mức lương
  - Đặt ngày đóng đơn
  - Trạng thái mặc định: OPEN

### 5.4. Chỉnh sửa tin tuyển dụng
- **Route**: `/recruitment/[id]/edit`
- **API**: `PUT /api/recruitment/jobs/[id]`
- **Chức năng**: Cập nhật thông tin tin tuyển dụng

### 5.5. Quản lý ứng viên
- **API**: `/api/recruitment/applications`
- **Chức năng**:
  - Xem danh sách tất cả ứng viên
  - Lọc theo tin tuyển dụng, trạng thái
  - Cập nhật trạng thái ứng viên
  - Xem CV, thư xin việc

### 5.6. Chi tiết ứng viên
- **API**: `/api/recruitment/applications/[id]`
- **Chức năng**:
  - Xem thông tin ứng viên: Họ tên, Email, SĐT
  - Xem CV, thư xin việc
  - Cập nhật trạng thái
  - Đặt lịch phỏng vấn
  - Ghi chú

### 5.7. Tin tuyển dụng công khai
- **API**: `/api/recruitment/jobs/public`
- **Chức năng**:
  - Hiển thị tin tuyển dụng công khai trên trang chủ
  - Cho phép GUEST xem và ứng tuyển
  - Tìm kiếm và lọc

### 5.8. Ứng tuyển (cho GUEST)
- **Route**: `/jobs/[id]`
- **Chức năng**:
  - GUEST có thể xem chi tiết tin tuyển dụng
  - Nộp đơn ứng tuyển (cần đăng nhập)
  - Upload CV, viết thư xin việc

---

## ⏰ 6. CHẤM CÔNG (TIMEKEEPING)

### 6.1. Trang chấm công
- **Route**: `/timekeeping`
- **API**: `/api/attendance`
- **Quyền**: BOARD, HR, MANAGER, EMPLOYEE
- **Chức năng**:
  - Xem lịch sử chấm công
  - Lọc theo tháng, năm
  - Xem thống kê: Số ngày làm việc, Số giờ làm việc, Số lần đi muộn, Số ngày nghỉ
  - Hiển thị chi tiết từng ngày: Giờ vào, Giờ ra, Tổng giờ, Trạng thái

### 6.2. Check-in/Check-out
- **Route**: `/timekeeping/checkin`
- **API**: `POST /api/attendance`
- **Chức năng**:
  - Nhân viên check-in khi đến làm
  - Check-out khi tan ca
  - Tự động tính tổng giờ làm việc
  - Tính thời gian nghỉ (break duration)
  - Trạng thái: PRESENT, ABSENT, LATE, HALF_DAY, ON_LEAVE
  - Ghi chú nếu cần

### 6.3. Quản lý chấm công (HR)
- **Chức năng**:
  - Xem chấm công của tất cả nhân viên
  - Chỉnh sửa chấm công nếu có sai sót
  - Xuất báo cáo chấm công

---

## 💰 7. LƯƠNG THƯỞNG (PAYROLL)

### 7.1. Danh sách payroll
- **Route**: `/payroll`
- **API**: `/api/payroll`
- **Quyền**: BOARD, HR
- **Chức năng**:
  - Xem danh sách payroll của tất cả nhân viên
  - Lọc theo tháng, năm (payPeriod)
  - Lọc theo trạng thái: PENDING, PROCESSED, PAID
  - Xem tổng lương đã trả

### 7.2. Chi tiết payroll nhân viên
- **Route**: `/payroll/employees/[id]`
- **API**: `/api/payroll/employees/[id]`
- **Chức năng**:
  - Xem lịch sử lương của nhân viên
  - Chi tiết từng tháng: Lương cơ bản, Phụ cấp, Khấu trừ, Tăng ca, Thưởng, Thuế, Tổng lương, Lương thực nhận

### 7.3. Tính lương tự động
- **API**: `POST /api/payroll/calculate`
- **Quyền**: BOARD, HR
- **Chức năng**:
  - Tính lương cho một hoặc tất cả nhân viên
  - Tính cho một kỳ lương cụ thể (payPeriod: YYYY-MM)
  - Tính toán:
    - Lương cơ bản từ hợp đồng
    - Phụ cấp (allowances)
    - Tăng ca (overtime) dựa trên attendance
    - Thưởng (bonuses) từ Reward
    - Khấu trừ (deductions)
    - Thuế (tax)
    - Tổng lương (grossPay) và Lương thực nhận (netPay)
  - Tự động tạo PayrollRecord
  - Tránh tính trùng (kiểm tra existing record)

### 7.4. Cập nhật trạng thái payroll
- **API**: `PUT /api/payroll/[id]/status`
- **Chức năng**:
  - Cập nhật trạng thái: PENDING → PROCESSED → PAID
  - Ghi chú khi thanh toán

### 7.5. Thêm thưởng
- **API**: `POST /api/payroll/bonus`
- **Chức năng**:
  - Thêm thưởng cho nhân viên
  - Gắn với payPeriod cụ thể
  - Tự động cập nhật vào payroll khi tính lương

### 7.6. Payslip (Phiếu lương)
- **API**: `/api/payroll/payslip/[id]`
- **Chức năng**:
  - Xem phiếu lương chi tiết
  - In phiếu lương
  - Gửi email phiếu lương (đang phát triển)

### 7.7. Thống kê payroll
- **API**: `/api/payroll/stats`
- **Chức năng**:
  - Thống kê tổng lương theo tháng
  - Thống kê theo phòng ban
  - Biểu đồ xu hướng

### 7.8. Payroll nhân viên (EMPLOYEE)
- **Route**: `/payroll/employees`
- **Chức năng**:
  - EMPLOYEE xem lương của chính mình
  - Xem lịch sử lương
  - Xem phiếu lương chi tiết

---

## 📈 8. ĐÁNH GIÁ HIỆU SUẤT (PERFORMANCE)

### 8.1. Danh sách đánh giá
- **Route**: `/performance`
- **API**: `/api/performance`
- **Quyền**: BOARD, HR, MANAGER
- **Chức năng**:
  - Xem danh sách đánh giá hiệu suất
  - Lọc theo nhân viên, kỳ đánh giá
  - Xem điểm đánh giá tổng thể

### 8.2. Chi tiết đánh giá
- **Route**: `/performance/[id]`
- **API**: `/api/performance/[id]`
- **Chức năng**:
  - Xem chi tiết đánh giá:
    - Kỳ đánh giá (Q1 2024, 2024 Annual, ...)
    - Mục tiêu (goals)
    - Thành tựu (achievements)
    - Điểm mạnh (strengths)
    - Điểm cần cải thiện (areasForImprovement)
    - Đánh giá tổng thể: EXCELLENT, GOOD, SATISFACTORY, NEEDS_IMPROVEMENT, UNSATISFACTORY
    - Nhận xét của người đánh giá
    - Phản hồi của nhân viên

### 8.3. Tạo đánh giá mới
- **API**: `POST /api/performance`
- **Chức năng**:
  - Tạo đánh giá hiệu suất cho nhân viên
  - Chọn kỳ đánh giá
  - Đánh giá các khía cạnh
  - Gửi cho nhân viên xem và phản hồi

### 8.4. Quản lý mục tiêu (Performance Goals)
- **API**: `/api/performance/goals`
- **Chức năng**:
  - Tạo mục tiêu cho nhân viên
  - Theo dõi tiến độ (progress: 0-100%)
  - Trạng thái: NOT_STARTED, IN_PROGRESS, COMPLETED, CANCELLED
  - Có giá trị mục tiêu và giá trị hiện tại
  - Đơn vị đo lường (percentage, number, ...)

### 8.5. Chi tiết mục tiêu
- **API**: `/api/performance/goals/[id]`
- **Chức năng**:
  - Xem và cập nhật mục tiêu
  - Cập nhật tiến độ
  - Ghi chú

---

## 🎓 9. ĐÀO TẠO (TRAINING)

### 9.1. Danh sách chương trình đào tạo
- **Route**: `/training`
- **API**: `/api/training`
- **Quyền**: BOARD, HR, MANAGER, EMPLOYEE
- **Chức năng**:
  - Xem tất cả chương trình đào tạo
  - Lọc theo trạng thái: PLANNED, ONGOING, COMPLETED, CANCELLED
  - Lọc theo danh mục: Technical, Soft Skills, Compliance, ...
  - Xem thông tin: Tiêu đề, Mô tả, Thời lượng, Nhà cung cấp, Chi phí, Thời gian

### 9.2. Chi tiết chương trình đào tạo
- **Route**: `/training/[id]`
- **API**: `/api/training/[id]`
- **Chức năng**:
  - Xem thông tin chi tiết
  - Xem danh sách nhân viên đã đăng ký
  - Xem phản hồi (feedback) từ nhân viên
  - Đăng ký tham gia (nếu còn chỗ)

### 9.3. Tạo chương trình đào tạo mới
- **Route**: `/training/new`
- **API**: `POST /api/training`
- **Quyền**: BOARD, HR, MANAGER
- **Chức năng**:
  - Tạo chương trình đào tạo mới
  - Nhập: Tiêu đề, Mô tả, Danh mục, Thời lượng, Nhà cung cấp, Chi phí
  - Đặt thời gian bắt đầu và kết thúc
  - Trạng thái mặc định: PLANNED

### 9.4. Đăng ký đào tạo
- **API**: `POST /api/training/enroll`
- **Chức năng**:
  - Nhân viên đăng ký tham gia chương trình đào tạo
  - Trạng thái: ENROLLED → IN_PROGRESS → COMPLETED
  - Ghi nhận ngày hoàn thành
  - Lưu điểm số (score)
  - Lưu chứng chỉ (certificate)

### 9.5. Phản hồi đào tạo
- **API**: `POST /api/training/feedback`
- **Chức năng**:
  - Nhân viên đánh giá chương trình đào tạo
  - Đánh giá: Tổng thể (1-5), Nội dung, Giảng viên, Tài liệu
  - Viết phản hồi và đề xuất
  - Có khuyến nghị cho người khác không

---

## 📅 10. NGHỈ PHÉP (LEAVE)

### 10.1. Danh sách đơn nghỉ phép
- **Route**: `/leave`
- **API**: `/api/leave`
- **Quyền**: BOARD, HR, MANAGER, EMPLOYEE
- **Chức năng**:
  - Xem danh sách đơn nghỉ phép
  - Lọc theo trạng thái: PENDING, APPROVED, REJECTED, CANCELLED
  - Lọc theo loại: ANNUAL, SICK, PERSONAL, MATERNITY, PATERNITY, UNPAID
  - Xem thông tin: Nhân viên, Loại, Thời gian, Số ngày, Lý do

### 10.2. Chi tiết đơn nghỉ phép
- **Route**: `/leave/[id]`
- **API**: `/api/leave/[id]`
- **Chức năng**:
  - Xem chi tiết đơn nghỉ phép
  - Duyệt/từ chối đơn (HR, MANAGER)
  - Ghi chú lý do từ chối
  - Xem lịch sử duyệt

### 10.3. Tạo đơn nghỉ phép mới
- **Route**: `/leave/new`
- **API**: `POST /api/leave`
- **Chức năng**:
  - Nhân viên tạo đơn nghỉ phép
  - Chọn loại nghỉ phép
  - Chọn ngày bắt đầu và kết thúc
  - Tự động tính số ngày
  - Nhập lý do
  - Trạng thái mặc định: PENDING

### 10.4. Duyệt đơn nghỉ phép
- **API**: `PUT /api/leave/[id]`
- **Quyền**: HR, MANAGER, BOARD
- **Chức năng**:
  - Duyệt đơn (APPROVED)
  - Từ chối đơn (REJECTED) kèm lý do
  - Hủy đơn (CANCELLED)
  - Ghi nhận người duyệt và thời gian

---

## 📄 11. HỢP ĐỒNG LAO ĐỘNG (CONTRACTS)

### 11.1. Danh sách hợp đồng
- **Route**: `/contracts`
- **API**: `/api/contracts`
- **Quyền**: BOARD, HR, MANAGER
- **Chức năng**:
  - Xem tất cả hợp đồng lao động
  - Lọc theo trạng thái: ACTIVE, EXPIRED, TERMINATED
  - Lọc theo loại: PERMANENT, TEMPORARY, PROBATION
  - Tìm kiếm theo mã hợp đồng, tên nhân viên

### 11.2. Chi tiết hợp đồng
- **Route**: `/contracts/[id]`
- **API**: `/api/contracts/[id]`
- **Chức năng**:
  - Xem thông tin chi tiết:
    - Mã hợp đồng (contractNumber) - unique
    - Loại hợp đồng
    - Thời gian: Ngày bắt đầu, Ngày kết thúc
    - Hợp đồng không xác định thời hạn (isIndefinite)
    - Mức lương, Vị trí, Phòng ban
    - Trạng thái
    - File hợp đồng (document)
    - Ghi chú

### 11.3. Tạo hợp đồng mới
- **Route**: `/contracts/new`
- **API**: `POST /api/contracts`
- **Quyền**: BOARD, HR
- **Chức năng**:
  - Tạo hợp đồng lao động mới cho nhân viên
  - Nhập đầy đủ thông tin
  - Upload file hợp đồng
  - Trạng thái mặc định: ACTIVE

### 11.4. Kiểm tra hợp đồng sắp hết hạn
- **API**: `POST /api/contracts/check-expiring`
- **Chức năng**:
  - Tự động kiểm tra hợp đồng sắp hết hạn (mặc định 30 ngày)
  - Tạo thông báo cho nhân viên và HR/BOARD
  - Kiểm tra hợp đồng đã hết hạn
  - Cập nhật trạng thái EXPIRED
  - Tránh tạo thông báo trùng (trong 7 ngày)

### 11.5. Xem hợp đồng sắp hết hạn
- **API**: `GET /api/contracts/check-expiring?days=30`
- **Chức năng**: Xem danh sách hợp đồng sắp hết hạn (không tạo thông báo)

---

## 📁 12. TÀI LIỆU (DOCUMENTS)

### 12.1. Danh sách tài liệu
- **Route**: `/documents`
- **API**: `/api/documents`
- **Chức năng**:
  - Xem tất cả tài liệu nhân viên
  - Lọc theo loại: CV, CERTIFICATE, CONTRACT, ID_CARD, ...
  - Lọc theo nhân viên
  - Tìm kiếm theo tên tài liệu

### 12.2. Quản lý tài liệu
- **API**: `/api/documents/[id]`
- **Chức năng**:
  - Upload tài liệu mới
  - Xem, tải xuống tài liệu
  - Xóa tài liệu
  - Quản lý quyền truy cập: EMPLOYEE, MANAGER, HR, BOARD

---

## 🛡️ 13. BẢO HIỂM (INSURANCE)

### 13.1. Danh sách bảo hiểm
- **Route**: `/insurance`
- **API**: `/api/insurance`
- **Chức năng**:
  - Xem tất cả thông tin bảo hiểm nhân viên
  - Lọc theo loại: HEALTH, SOCIAL, UNEMPLOYMENT
  - Lọc theo trạng thái: ACTIVE, EXPIRED, CANCELLED
  - Xem thông tin: Số hợp đồng, Nhà cung cấp, Thời gian, Phí bảo hiểm, Phạm vi bảo hiểm

### 13.2. Chi tiết bảo hiểm
- **API**: `/api/insurance/[id]`
- **Chức năng**:
  - Xem chi tiết thông tin bảo hiểm
  - Cập nhật thông tin
  - Xem lịch sử

### 13.3. Quản lý bảo hiểm
- **API**: `POST /api/insurance`, `PUT /api/insurance/[id]`
- **Quyền**: BOARD, HR
- **Chức năng**:
  - Thêm bảo hiểm mới cho nhân viên
  - Cập nhật thông tin bảo hiểm
  - Gia hạn bảo hiểm

---

## 📊 14. BÁO CÁO (REPORTS)

### 14.1. Trang báo cáo
- **Route**: `/reports`
- **Quyền**: BOARD, HR, MANAGER
- **Chức năng**:
  - Xem các loại báo cáo
  - Báo cáo nhân sự
  - Báo cáo lương
  - Báo cáo đào tạo
  - Báo cáo hiệu suất

### 14.2. Báo cáo nâng cao
- **API**: `/api/reports/advanced`
- **Chức năng**:
  - Tạo báo cáo tùy chỉnh
  - Lọc theo nhiều tiêu chí
  - Xuất file Excel/PDF (đang phát triển)

---

## 🔔 15. THÔNG BÁO (NOTIFICATIONS)

### 15.1. Hệ thống thông báo
- **API**: `/api/notifications`
- **Chức năng**:
  - Hiển thị thông báo trong Header
  - Đếm số thông báo chưa đọc
  - Các loại thông báo:
    - CONTRACT_EXPIRY: Hợp đồng sắp hết hạn/đã hết hạn
    - PAYROLL: Thông báo về lương
    - LEAVE_APPROVAL: Duyệt nghỉ phép
    - PERFORMANCE: Đánh giá hiệu suất
    - TRAINING: Thông báo đào tạo
  - Click vào thông báo để điều hướng đến trang liên quan

### 15.2. Đánh dấu đã đọc
- **API**: `PUT /api/notifications/[id]`
- **Chức năng**:
  - Đánh dấu thông báo đã đọc
  - Tự động giảm số đếm chưa đọc

### 15.3. Tự động tạo thông báo
- **Chức năng**:
  - Tự động tạo thông báo khi hợp đồng sắp hết hạn
  - Thông báo khi đơn nghỉ phép được duyệt/từ chối
  - Thông báo khi có đánh giá hiệu suất mới

---

## 🔍 16. TÌM KIẾM (SEARCH)

### 16.1. Tìm kiếm toàn hệ thống
- **Vị trí**: Header (sidebar)
- **Chức năng**:
  - Tìm kiếm nhân viên theo tên, mã nhân viên
  - Tìm kiếm tin tuyển dụng theo tiêu đề, phòng ban
  - Hiển thị kết quả trong dropdown
  - Click để điều hướng đến trang chi tiết
  - Debounce 300ms để tối ưu hiệu suất

---

## 🎨 17. GIAO DIỆN VÀ TRẢI NGHIỆM

### 17.1. Layout
- **Sidebar**: Menu điều hướng bên trái, cố định
- **Header**: Thanh trên cùng, có tìm kiếm và thông báo
- **Responsive**: Hỗ trợ mobile (đang phát triển)

### 17.2. UI Components
- **Button**: Component tái sử dụng
- **Card**: Component card
- **Input**: Component input form
- **Icons**: Lucide React Icons

### 17.3. Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Primary Color**: Màu chủ đạo (primary-600, primary-700)
- **Animations**: Transition và hover effects

---

## 🔧 18. CẤU HÌNH VÀ TIỆN ÍCH

### 18.1. Database
- **MongoDB**: NoSQL database
- **Prisma ORM**: Type-safe database client
- **Schema**: Định nghĩa trong `prisma/schema.prisma`

### 18.2. Authentication
- **NextAuth.js**: Authentication framework
- **Session Management**: Server-side sessions
- **Password Hashing**: bcryptjs

### 18.3. Email (Đang phát triển)
- **Nodemailer**: Gửi email
- **Cấu hình**: Xem `EMAIL_SETUP.md`
- **Chức năng**: Gửi thông báo, reset mật khẩu

### 18.4. Utilities
- **Format Currency**: Định dạng tiền tệ
- **Format Date**: Định dạng ngày tháng
- **CN Function**: Merge Tailwind classes

---

## 📝 19. CÁC CHỨC NĂNG ĐANG PHÁT TRIỂN

1. **Hoạt động gần đây** trên Dashboard
2. **Thống kê nhanh** trên Dashboard
3. **Gửi email** thông báo và reset mật khẩu
4. **Xuất báo cáo** Excel/PDF
5. **Upload file** tài liệu, CV
6. **Biểu đồ** thống kê chi tiết
7. **Mobile responsive** đầy đủ
8. **Real-time notifications** (WebSocket)

---

## 🚀 20. CÁCH SỬ DỤNG

### 20.1. Khởi chạy dự án
```bash
npm install
npm run dev
```
Truy cập: `http://localhost:3001`

### 20.2. Database
```bash
npm run db:generate  # Generate Prisma Client
npm run db:push     # Push schema to database
npm run db:seed     # Seed sample data
```

### 20.3. Build production
```bash
npm run build
npm start
```

---

## 📌 21. TÓM TẮT CÁC MODULE

| Module | Route | Quyền truy cập | Chức năng chính |
|--------|-------|----------------|-----------------|
| **Dashboard** | `/dashboard` | Tất cả | Tổng quan hệ thống |
| **Nhân viên** | `/employees` | BOARD, HR, MANAGER | Quản lý nhân viên |
| **Tuyển dụng** | `/recruitment` | BOARD, HR, MANAGER | Quản lý tuyển dụng |
| **Chấm công** | `/timekeeping` | Tất cả | Chấm công, xem lịch sử |
| **Lương thưởng** | `/payroll` | BOARD, HR | Tính lương, quản lý payroll |
| **Đánh giá** | `/performance` | BOARD, HR, MANAGER | Đánh giá hiệu suất |
| **Đào tạo** | `/training` | Tất cả | Quản lý đào tạo |
| **Nghỉ phép** | `/leave` | Tất cả | Quản lý nghỉ phép |
| **Hợp đồng** | `/contracts` | BOARD, HR, MANAGER | Quản lý hợp đồng |

---

## 🎯 KẾT LUẬN

HRMS System là một hệ thống quản lý nhân sự toàn diện với đầy đủ các chức năng cần thiết cho việc quản lý nhân sự trong doanh nghiệp. Hệ thống được xây dựng với kiến trúc hiện đại, dễ mở rộng và bảo trì.

**Tổng số chức năng chính**: ~50+ chức năng
**Số lượng API endpoints**: ~80+ endpoints
**Số lượng trang**: ~30+ pages
**Số lượng models**: 20+ models trong database

---

*Tài liệu này được tạo tự động dựa trên phân tích codebase. Cập nhật lần cuối: 2025*

