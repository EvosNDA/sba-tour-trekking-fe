# API contract — luồng khách chọn tour

Nguồn đối chiếu: controller, DTO và service trong package backend `features/tour`, cùng migration `007_add_tour_equipment_catalog.sql`. Các kiểu JSON có thể dùng trực tiếp trong `src/features/tours/types/tour-contract.types.ts`.

## Phạm vi đã chốt

Tìm tour → xem tour và kế hoạch theo ngày → chọn lịch → điền người liên hệ/người đi → tự mang đồ, thuê gói hoặc thuê lẻ → xem lại lựa chọn. Bước xem lại chưa tạo booking, giữ chỗ, giữ dụng cụ hoặc thanh toán. Dữ liệu bàn giao cho Booking chỉ là lựa chọn của khách.

Nội dung PRD cũ chỉ cho thuê gói đã được thay bằng quyết định trong cuộc trao đổi: hỗ trợ cả gói và món lẻ theo cấu trúc migration 007. Không thêm kho hay bảng đơn thuê vào module tour.

## Quy ước chung

- Base path: `/api/v1`. Khi cấu hình frontend dùng `/api`, client chỉ nối `/v1` một lần.
- Response thành công là DTO trực tiếp; không bọc `{data,status}`.
- Enum JSON phân biệt hoa/thường: `EASY`, `MODERATE`, `HARD`, `EXPERT`; `DRAFT`, `PENDING`, `PUBLISHED`, `REJECTED`, `ARCHIVED`; `SCHEDULED`, `ONGOING`, `COMPLETED`, `CANCELLED`.
- Tiền là số nguyên VND. Ngày giờ dùng ISO 8601 có múi giờ, ví dụ `2027-01-10T07:00:00+07:00`. Hoạt động dùng giờ `07:30:00` hoặc `null`.
- `page` bắt đầu từ 0; `size` từ 1 đến 100. Đọc `content`, `number`, `size`, `totalElements`, `totalPages` của Spring Page. Không dùng `items` hay `totalItems`. Bỏ qua metadata Spring khác.
- Khách vãng lai được đọc danh sách và nội dung tour đã `PUBLISHED`, cùng lịch sắp tới, hoạt động và thông tin dụng cụ của tour đó. Các API ghi vẫn cần Bearer token. Frontend không gửi token cho các request đọc công khai.
- CSRF hiện chỉ áp dụng cho các thao tác ghi ở `/api/v1/auth/**`; API tour không yêu cầu CSRF token.

## API đọc cho luồng khách

Tái sử dụng các endpoint tour hiện có. GET danh sách bổ sung các tham số lọc tùy chọn; request không đăng nhập luôn chỉ nhận tour `PUBLISHED`, kể cả khi gửi status khác. Request đã đăng nhập vẫn giữ hành vi liệt kê cho quản lý. GET theo ID và các GET nội dung con trả 404 nếu tour chưa publish. Khách chỉ đọc được lịch `SCHEDULED` có ngày đi trong tương lai. Chỉ hai endpoint đọc dụng cụ là mới.

| Method | Path | Response |
| --- | --- | --- |
| GET | `/tours?status=PUBLISHED&query=&difficulty=&durationDays=&page=0&size=12` | `Page<TourSummaryResponse>` |
| GET | `/tours/{tourId}` | `TourDetailResponse` |
| GET | `/tours/{tourId}/schedules?upcomingOnly=true&page=0&size=4` | `Page<ScheduleSummaryResponse>` |
| GET | `/tours/{tourId}/schedules/{scheduleId}` | `ScheduleDetailResponse` |
| GET | `/tours/{tourId}/activities` | `ActivityResponse[]` |
| GET | `/tours/{tourId}/required-items` (mới) | `RequiredItemResponse[]` |
| GET | `/tours/{tourId}/equipment` (mới) | `TourEquipmentResponse` |

Tìm kiếm thực hiện tại database trước phân trang, theo chuỗi con của tên tour, không phân biệt chữ hoa/thường; không cam kết bỏ dấu tiếng Việt. `%` và `_` trong từ tìm kiếm là ký tự bình thường. `difficulty` và `durationDays` là điều kiện bằng; `durationDays` phải dương. Danh sách tour sắp theo ID tăng dần. Không có bộ lọc địa điểm, đánh giá hay giá chưa được backend hỗ trợ.

Khi gửi `upcomingOnly=true`, danh sách lịch chỉ gồm `SCHEDULED` và có thời điểm bắt đầu trong tương lai, sắp theo ngày bắt đầu rồi ID. Bỏ tham số giữ danh sách quản lý hiện có. Lịch hết chỗ vẫn có thể hiện để khách hiểu trạng thái, nhưng không được chọn. Lịch ID phải thuộc đúng tour; nếu không trả 404. UI kiểm tra trạng thái và ngày đi khi đọc chi tiết. Số chỗ khả dụng chỉ là số tham khảo tại lúc đọc: `max(0, capacity - heldSeats - confirmedSeats)`.

### Tour

`TourSummaryResponse`: `id`, `title`, `difficulty` (nullable), `durationDays` (nullable), `status`, `coverImageUrl` (nullable). Danh sách không có giá, điểm đánh giá hay công ty; thẻ tour dẫn khách tới lịch và giá, không tự bịa các trường này.

`TourDetailResponse`: `id`, `title`, `description`, `difficulty`, `durationDays`, `requiredExperience`, `includedServices`, `excludedServices`, `routeFileUrl`, `status`, `media`. Các trường nội dung tùy chọn có thể là `null`; `media` luôn là mảng, rỗng khi chưa có ảnh. Lịch, hoạt động và dụng cụ được tải qua endpoint riêng.

`TourMediaResponse`: `id`, `mediaType` (`IMAGE` hoặc `VIDEO`), `url`, `caption` (nullable), `displayOrder`, `isCover`. Chỉ hiển thị ảnh `IMAGE` trong thư viện ảnh. `cloudinary_public_id` không trả về frontend. URL lộ trình là liên kết tham khảo, không phải nội dung kế hoạch theo ngày.

### Lịch đi

`ScheduleSummaryResponse`: `id`, `startsAt`, `endsAt`, `capacity`, `heldSeats`, `confirmedSeats`, `basePriceVnd`, `equipmentFeeVnd`, `status`.

`ScheduleDetailResponse` thêm `tourId`, `depositPercent`, `balanceDueAt`, `meetingPoint` (nullable), `contactPhone` (nullable), `lockVersion`. Khi khách chọn lịch, đọc chi tiết để hiện đúng điểm hẹn, liên hệ và hạn thanh toán. `depositPercent` là phần trăm dạng number, không phải chuỗi hay tỷ lệ 0–1.

### Kế hoạch theo ngày

`ActivityResponse`: `id`, `dayNumber`, `displayOrder`, `startTime` (nullable), `title`, `description` (nullable), `locationId` (nullable). API đã sắp theo ngày và thứ tự. UI nhóm theo `dayNumber`, dùng nhãn “Kế hoạch theo ngày” / “Day plan”; nội dung lấy từ tour, không sao chép ví dụ trên website tham khảo. Không tạo giả tiêu đề hay hoạt động cho ngày chưa có dữ liệu.

### Đồ cần mang và đồ thuê

`RequiredItemResponse`: `id`, `equipmentId` (nullable), `name`, `isRequired`, `note` (nullable), `displayOrder`. Đây là checklist của khách, không phải các dòng cho thuê. Không tự đánh dấu món đã thuê là đáp ứng checklist khi không có liên kết `equipmentId`.

```json
{
  "equipmentPackage": {
    "id": 2,
    "packageTemplateId": 1,
    "title": "Gói dụng cụ của tour",
    "includedItems": "Mô tả nội dung gói",
    "sharedItems": null,
    "personalItemsToBring": null,
    "rentalPriceVnd": 200000
  },
  "items": [
    {
      "id": 8,
      "equipmentId": 3,
      "name": "Gậy trekking",
      "description": null,
      "quantityInPackage": 2,
      "individualRentalPriceVnd": 50000
    }
  ]
}
```

Ví dụ trên chỉ mô tả định dạng contract, không phải dữ liệu mẫu được cài vào UI.

- Không có gói: trả `{ "equipmentPackage": null, "items": [] }`, HTTP 200.
- Một tour có tối đa một gói. `quantityInPackage` là số món có trong một gói.
- `rentalPriceVnd: null` nghĩa là gói chưa có giá thuê; không cho chọn thuê cả gói. Giá `0` là giá hợp lệ.
- `rentalPriceVnd` là giá của một gói dụng cụ cho cả chuyến; khách chọn số gói cần thuê.
- `individualRentalPriceVnd: null` nghĩa là món đó không cho thuê lẻ; giá `0` vẫn được chọn.

### Quản lý dụng cụ (chỉ ADMIN)

Các API này tạo danh mục dùng chung trong package tour. Mỗi tour có thể gán một gói mẫu và thêm các món thuê lẻ:

| Method | Path | Response |
| --- | --- | --- |
| GET | `/tours/equipment-catalog` | `EquipmentCatalogResponse[]` |
| POST | `/tours/equipment-catalog` | Tạo một dụng cụ |
| PUT | `/tours/equipment-catalog/{equipmentId}` | Cập nhật dụng cụ |
| POST | `/tours/equipment-catalog/{equipmentId}/image` | Tải ảnh dụng cụ lên (`multipart/form-data`, `file`) |
| DELETE | `/tours/equipment-catalog/{equipmentId}/image` | Xóa ảnh dụng cụ |
| DELETE | `/tours/equipment-catalog/{equipmentId}` | Xóa dụng cụ chưa được dùng |
| GET | `/tours/rental-packages` | `RentalPackageTemplateResponse[]` kèm dụng cụ trong gói |
| POST | `/tours/rental-packages` | Tạo gói mẫu |
| PUT | `/tours/rental-packages/{packageId}` | Thay thông tin và nội dung gói mẫu |
| POST | `/tours/rental-packages/{packageId}/image` | Tải ảnh gói lên (`multipart/form-data`, `file`) |
| DELETE | `/tours/rental-packages/{packageId}/image` | Xóa ảnh gói |
| DELETE | `/tours/rental-packages/{packageId}` | Xóa gói chưa được gán cho tour |
| PUT | `/tours/{tourId}/equipment` | Gán gói mẫu và danh sách món thuê lẻ cho tour |

Body gán dụng cụ cho tour:

```json
{
  "packageTemplateId": 1,
  "individualEquipmentIds": [4, 5]
}
```

`packageTemplateId` có thể là `null`; `individualEquipmentIds` có thể là mảng rỗng. Nếu cả hai không có lựa chọn, API xóa cấu hình thuê của tour. Backend lưu bản sao theo tour trong các bảng hiện tại để API đọc và ID món thuê hiện có không đổi. Sửa gói mẫu không tự cập nhật tour; cần lưu lại cấu hình tour để chụp nội dung mới.
- Ba lựa chọn loại trừ nhau cho cả nhóm: `NONE`, `PACKAGE`, `ITEMS`. Phiên bản này không kết hợp gói với món lẻ để tránh tính trùng.
- Giá gói là giá một gói cho cả chuyến. `quantity` là số gói cả nhóm thuê; tiền gói = `rentalPriceVnd × quantity`, không nhân theo số người. `tour_schedules.equipmentFeeVnd` là trường phí cũ; không cộng thêm lần nữa khi dùng giá gói có cấu trúc. Không dùng phí lịch thay cho giá gói `null`.
- Thuê lẻ: `quantity` là tổng số món cả nhóm chọn; tiền món lẻ = tổng `individualRentalPriceVnd × quantity`.
- Tổng dự kiến: `basePriceVnd × travelers.length + rentalCost`. Không tính cọc hay tạo yêu cầu thanh toán ở luồng này.
- Không có API tồn kho hoặc giữ dụng cụ; UI không được cam kết còn hàng. Trước màn xem lại, đọc lại lịch và giá dụng cụ. Booking phải kiểm tra lại ở thời điểm nhận bàn giao.
- Migration 007 phải được áp dụng trên database trước khi chạy các API dụng cụ mới. Không tạo migration mới cho những cột đã có trong 007.
- Migration 011 thêm `image_url` và `storage_key` cho `equipment` và `rental_package_templates`. Ảnh được tải qua `features.storage.ImageStorage`; giới hạn 5 MB, chỉ nhận JPEG, PNG hoặc WebP.
- Migration 012 ghi rõ đơn vị giá thuê: một gói tính theo số gói thuê; một món lẻ tính theo số món thuê.

## Dữ liệu bàn giao cho Booking

Định nghĩa `TourSelectionDraft` trong TypeScript. Người liên hệ và từng người đi có họ tên, email và số điện thoại; họ tên người đi bắt buộc, email/số điện thoại của từng người đi có thể bỏ trống. Người liên hệ cần đủ cả ba. UI dùng dữ liệu trong bộ nhớ, không tự lưu thông tin cá nhân xuống localStorage.

```json
{
  "version": 2,
  "tourId": 3,
  "scheduleId": 10,
  "contact": {"fullName": "Tên người liên hệ", "email": "contact@example.com", "phone": "0900000000"},
  "travelers": [{"fullName": "Tên người đi", "email": "", "phone": ""}],
  "rental": {"mode": "PACKAGE", "packageId": 2, "quantity": 2}
}
```

`rental` có thể là `{mode:"NONE"}`, `{mode:"PACKAGE",packageId:2,quantity:2}` hoặc `{mode:"ITEMS",items:[...]}`. `quantity` của gói là số gói cho cả nhóm; `quantity` của món là tổng số món cho cả nhóm. `itemId` tham chiếu `tour_equipment_items.id`, không phải `equipment.id`. Chỉ số lượng nguyên dương được bàn giao, không có ID trùng. Không đưa giá/tổng do trình duyệt tính làm nguồn giá tin cậy.

Đây là contract bàn giao UI, **chưa phải request của một endpoint tạo booking**. `HomePage` và `TourDetailPage` nhận callback `onSelectionReady(draft)`, được gọi sau khi kiểm tra lại dữ liệu và chuyển thành công sang màn xem lại. Chủ module Booking có thể nối callback này, đồng thời xác nhận request cuối, cách lưu người liên hệ và lựa chọn thuê lẻ, kiểm tra lịch, số chỗ, giá, quan hệ món với tour và chống tính trùng. Module tour không ghi vào bảng booking/participant và không gọi các URL booking giả của giao diện cũ.

## CRUD quản lý hiện có

| Method | Path | Thành công |
| --- | --- | --- |
| POST | `/tours` | 201 `TourDetailResponse` |
| GET | `/tours?page=0&size=20` | 200 `Page<TourSummaryResponse>`; gồm mọi trạng thái |
| GET | `/tours/{tourId}` | 200 `TourDetailResponse` |
| PUT | `/tours/{tourId}` | 200 `TourDetailResponse` |
| DELETE | `/tours/{tourId}` | 204, không có JSON |
| POST | `/tours/{tourId}/schedules` | 201 `ScheduleDetailResponse` |
| GET | `/tours/{tourId}/schedules` | 200 `Page<ScheduleSummaryResponse>` |
| GET | `/tours/{tourId}/schedules/{scheduleId}` | 200 `ScheduleDetailResponse` |
| PUT | `/tours/{tourId}/schedules/{scheduleId}` | 200 `ScheduleDetailResponse` |
| DELETE | `/tours/{tourId}/schedules/{scheduleId}` | 204 |
| GET | `/tours/{tourId}/activities` | 200 `ActivityResponse[]` |
| POST | `/tours/{tourId}/activities` | 201 `ActivityResponse` |
| PUT | `/tours/{tourId}/activities/{activityId}` | 200 `ActivityResponse` |
| DELETE | `/tours/{tourId}/activities/{activityId}` | 204 |
| POST | `/tours/{tourId}/media` | 201 `TourMediaResponse` |
| PATCH | `/tours/{tourId}/media/{mediaId}` | 200 `TourMediaResponse` |
| PATCH | `/tours/{tourId}/media/{mediaId}/cover` | 200 `TourMediaResponse` |
| PUT | `/tours/{tourId}/media/order` | 200 `TourMediaResponse[]` |
| DELETE | `/tours/{tourId}/media/{mediaId}` | 204 |

Create tour nhận `CreateTourRequest`, chỉ `title` bắt buộc (không trống, tối đa 250 ký tự); `durationDays` nếu có phải dương. Không có field trạng thái khi create, tour mặc định `DRAFT`. Update nhận `UpdateTourRequest` cùng các field nội dung và thêm `status` tùy chọn. PUT cần gửi đủ nội dung muốn giữ; các field nội dung nullable bị bỏ qua sẽ thành `null`. Riêng `status` bỏ qua hoặc `null` giữ nguyên trạng thái. Publish còn cần metadata duyệt và chính sách từ backend; giao diện không tự tạo các field này.

Create/Update schedule có kiểu request riêng cùng các field: `startsAt`, `endsAt`, `capacity`, `basePriceVnd`, `equipmentFeeVnd`, `depositPercent`, `balanceDueAt`, `meetingPoint?`, `contactPhone?`. Ngoài hai field cuối, các field đều bắt buộc. Capacity nguyên dương; giá nguyên từ 0 đến 1.000.000.000.000; cọc >0 đến 100, tối đa hai chữ số thập phân; ngày về sau ngày đi, hạn trả không sau ngày đi; số điện thoại tối đa 30 ký tự. Không nhận seat counters, `lockVersion`, `tourId` hay trạng thái từ request.

Create/Update activity có kiểu riêng: `dayNumber` nguyên dương, `displayOrder` nguyên không âm, `startTime?`, `title` bắt buộc tối đa 250, `description?`, `locationId?`. Thứ tự trong cùng ngày không được trùng.

Upload ảnh dùng `FormData`: `file` là một JPEG/PNG/WebP không rỗng, tối đa 5 MiB; `caption` tùy chọn. Trình duyệt tự đặt multipart boundary; không đặt Content-Type JSON. Frontend gửi file tới backend, backend gọi Cloudinary. Sửa chú thích dùng `{caption:string|null}`; đặt bìa PATCH không cần body; sắp xếp dùng `{mediaIds:number[]}` chứa mọi ảnh của tour đúng một lần. Xóa ảnh bìa tự chọn ảnh đầu còn lại làm bìa. Không lộ khóa Cloudinary hoặc `public_id`.

## Lỗi và cách hiển thị

```json
{"code":"INVALID_ENUM_VALUE","message":"Invalid request field","fieldErrors":{"status":"Must be one of: DRAFT, PENDING, PUBLISHED, REJECTED, ARCHIVED (case-sensitive)"}}
```

| HTTP | Code tiêu biểu | UI |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR`, `INVALID_ENUM_VALUE`, `INVALID_FIELD_VALUE`, `INVALID_REQUEST`, `INVALID_PAGINATION`, `INVALID_SCHEDULE_DATES`, `INVALID_BALANCE_DUE_AT`, `INVALID_MEDIA_ORDER`, `INVALID_IMAGE` | Lỗi đúng field nếu có; giữ nội dung đã nhập |
| 401 | `UNAUTHORIZED` | Hướng dẫn đăng nhập |
| 403 | `FORBIDDEN` | Giải thích tài khoản không được truy cập |
| 404 | `RESOURCE_NOT_FOUND` | Tour/lịch không còn khả dụng, quay lại danh sách hoặc tải lại |
| 409 | `TOUR_CANNOT_BE_PUBLISHED`, `TOUR_NOT_DELETABLE`, `TOUR_HAS_MEDIA`, `TOUR_IN_USE`, `SCHEDULE_NOT_EDITABLE`, `SCHEDULE_IN_USE`, `ACTIVITY_ORDER_CONFLICT`, `INVALID_LOCATION`, `TOUR_COVER_CONFLICT`, `TOUR_IMAGE_CONFLICT`, `INVALID_CANCELLATION_POLICY`, `INVALID_TOUR_REVIEWER`, `TOUR_DATA_CONFLICT` | Hiện lỗi thao tác; field backend quản lý hiện ở mức form |
| 413 | `MAX_UPLOAD_SIZE` | Yêu cầu chọn ảnh nhỏ hơn |
| 503 | `TOUR_UNAVAILABLE`, `IMAGE_STORAGE_UNAVAILABLE`, `IMAGE_STORAGE_NOT_CONFIGURED`, `AUTH_UNAVAILABLE` | Cho thử lại, không báo thành công |

Nội dung hướng dẫn phía UI phải qua `useI18n()` và có cả tiếng Việt/Anh. Không hiện nguyên SQL, stack trace hoặc tự suy đoán thành công khi request thất bại.
