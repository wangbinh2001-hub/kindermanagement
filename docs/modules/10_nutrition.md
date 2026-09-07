# Module 10: Nutrition (Dinh dưỡng, Thực đơn & Đi chợ)

> **Mục đích:** Đặc tả quản lý thực đơn, kho nguyên liệu, phiếu đi chợ, và cân bằng dinh dưỡng cho trường mầm non.
> **Đối tượng sử dụng tài liệu:** Zcode / AI Code Agent khi thực hiện Phase 9 trong `PLAN.md`.
> **Quy tắc kèm theo bắt buộc:** `RULES_CODING.md`, `RULES_TENANCY.md`, `RULES_SECURITY.md`.

---

## 1. Ranh giới ứng dụng & Phân quyền

- **Đường dẫn (Route):** `apps/web/src/app/(school)/[schoolSlug]/nutrition/...`
- **Quản lý thực đơn:** Hiệu trưởng hoặc nhân viên được School Admin phân quyền (`nutrition:manage`).
- **Quản lý phiếu đi chợ:** Kitchen staff hoặc nhân viên được School Admin phân quyền (`nutrition:grocery`).
- **Phụ huynh:** Chỉ xem thực đơn của **tuần hiện tại** qua Parent Portal (read-only). Phụ huynh không nhìn thấy thực đơn của các tuần khác trong tháng.

---

## 2. Kho nguyên liệu (Ingredient Store)

- Nơi khai báo **tất cả nguyên liệu** mà trường sử dụng.
- Mỗi nguyên liệu có:
  - `name`: Tên nguyên liệu (VD: Thịt heo, Cá basa, Cà rốt, Dầu ăn...).
  - `unitPrice`: Đơn giá trên đơn vị tính (VD: 120.000 VNĐ/kg).
  - `unit`: Đơn vị tính (kg, quả, bó, hộp...).
  - `kcalPerUnit`: Số kilocalories trên đơn vị.
  - `isActive`: Còn dùng hay không.
- **School Admin hoặc staff được quyền** khai báo/sửa giá và kcal.

---

## 3. Kho món ăn (Food Store / Recipe Library)

- Nơi lưu trữ **toàn bộ các món ăn** mà trường có thể nấu.
- Mỗi món có:
  - `name`: Tên món (VD: Cá kho tộ, Canh cải, Cháo gà...).
  - `mealSlot`: Buổi ăn (`MORNING`, `LUNCH_MAIN`, `LUNCH_SOUP`, `AFTERNOON`).
  - `ingredients`: Mảng `{ ingredientId, quantity, kcalContribution }` — danh sách nguyên liệu cần thiết.
  - `totalKcal`: Tổng kcal của món (tự tính từ ingredients).
- **Quy tắc hiển thị:** Buổi sáng 20 món, buổi trưa chính 20 món, buổi trưa canh 20 món, buổi xế 20 món (số lượng tối thiểu; School Admin có thể thêm/bớt).

---

## 4. Thực đơn (Menu Planning)

### 4.1 Chế độ hiển thị
- School Admin có thể xem/sắp xếp thực đơn theo **tuần** hoặc **tháng**.
- Khi sắp xếp theo tháng, hiển thị dạng lưới: ngày × bữa ăn.

### 4.2 Buổi ăn trong ngày
| Buổi | Món ăn | Ghi chú |
|---|---|---|
| Sáng | 1 món | Buổi sáng |
| Trưa | 2 món (1 mặn + 1 canh) | Buổi trưa chính |
| Xế | 1 món | Buổi xế chiều |

### 4.3 Quy tắc phân bổ thực đơn
1. **Quy tắc trùng thực đơn (Quy tắc ngày):** Trong 1 tháng, một thực đơn nguyên ngày (combo Sáng, Trưa, Xế) không được phép lặp lại quá **4 ngày**. Nếu cả 3 buổi của ngày A giống hoàn toàn ngày B thì tính là 1 lần trùng; vượt 4 lần/tháng sẽ bị chặn.
2. **Quy tắc cân bằng dinh dưỡng:** Hệ thống phải cảnh báo hoặc chặn nếu bữa ăn không đạt tiêu chuẩn cân bằng:
   - Nếu ngày hôm trước (hoặc bữa trước) toàn món thịt, ngày/bữa tiếp theo phải có ít nhất 1 món cá hoặc món chay.
   - Hệ thống phân loại món theo nhóm nguyên liệu chính: `MEAT`, `FISH`, `VEGETABLE`, `EGG`, `DAIRY`... để kiểm tra sự đa dạng.
3. **Gợi ý tự động (Optional):** Hệ thống có thể gợi ý thực đơn phù hợp dựa trên:
   - Món còn trong hạn sử dụng kho (không trùng >4 ngày).
   - Đảm bảo đa dạng nhóm thực phẩm theo ngày.
   - Tổng kcal phù hợp cho lứa tuổi mầm non.

### 4.4 Tổng kcal theo ngày
- Hệ thống tự động tính tổng kcal cả ngày (sáng + trưa + xế) và hiển thị để nhân viên dinh dưỡng kiểm tra.
- Nếu tổng kcal không đạt ngưỡng tối thiểu theo lứa tuổi, hệ thống hiển thị cảnh báo.

---

## 5. Phiếu đi chợ (Grocery / Purchase Sheet)

### 5.1 Công thức tính ngân sách đi chợ

$$\text{Ngân sách đi chợ} = (\text{Tiền ăn sáng} + \text{Tiền ăn trưa} + \text{Tiền ăn xế}) \times \text{Sỉ số trẻ} - (\text{Tiền gas} + \text{Tiền điện})$$

- `Tiền ăn sáng`, `Tiền ăn trưa`, `Tiền ăn xế`: Học phí từng bữa do trường cấu hình.
- `Sỉ số trẻ`: Số lượng học sinh đăng ký ăn (trong tháng đó).
- `Tiền gas`, `Tiền điện`: Do trường nhập thủ công (tùy trường có/không).

### 5.2 Quy tắc đi chợ
- **Quy tắc giá trị phiếu đi chợ (Ràng buộc biên ±5.000 VNĐ):**
  - Tổng tiền phiếu đi chợ thực tế phải nằm trong khoảng:
    $$\text{Ngân sách} - 5.000 \leq \text{Tổng tiền thực tế} \leq \text{Ngân sách} + 5.000$$
  - Nếu Tổng tiền vượt quá +5.000 VNĐ hoặc âm quá -5.000 VNĐ so với Ngân sách, hệ thống **chặn tạo phiếu** và yêu cầu nhân viên điều chỉnh số lượng nguyên liệu hoặc kiểm tra lại đơn giá.
  - Việc nhập sai đơn giá hoặc số lượng nguyên liệu trong kho sẽ bị phát hiện qua ràng buộc này.
- Thực đơn trong tháng phải **đảm bảo tổng kcal** cho tất cả học sinh.
- Phiếu đi chợ hiển thị danh sách nguyên liệu cần mua, số lượng, đơn giá, thành tiền, và tổng cộng.
- Phiếu đi chợ **không có quản lý tồn kho** (trường hợp cần tồn kho sẽ do trường tự quản lý bên ngoài).

### 5.3 Duyệt phiếu đi chợ
- Staff kitchen/pendular tạo phiếu -> School Admin hoặc Hiệu trưởng duyệt.
- Phiếu đã duyệt ghi `AuditLog`.

---

## 6. Database Entities liên quan

```prisma
model Ingredient {
  id            String   @id @default(uuid())
  schoolId      String
  school        School   @relation(fields: [schoolId], references: [id])
  name          String
  unitPrice     Decimal  @db.Decimal(10, 0)
  unit          String   // kg, quả, bó...
  kcalPerUnit   Decimal  @db.Decimal(6, 1)
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?
}

model FoodItem {
  id            String   @id @default(uuid())
  schoolId      String
  school        School   @relation(fields: [schoolId], references: [id])
  name          String
  mealSlot      MealSlot
  totalKcal     Decimal  @db.Decimal(6, 1)
  ingredients   FoodIngredient[]
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?
}

model FoodIngredient {
  id            String   @id @default(uuid())
  foodItemId    String
  foodItem      FoodItem @relation(fields: [foodItemId], references: [id])
  ingredientId  String
  ingredient    Ingredient @relation(fields: [ingredientId], references: [id])
  quantity      Decimal  @db.Decimal(6, 2)
  kcalContribution Decimal @db.Decimal(6, 1)
}

enum MealSlot {
  MORNING
  LUNCH_MAIN
  LUNCH_SOUP
  AFTERNOON
}

model Menu {
  id            String   @id @default(uuid())
  schoolId      String
  school        School   @relation(fields: [schoolId], references: [id])
  date          DateTime @db.Date
  mealSlot      MealSlot
  foodItemId    String
  foodItem      FoodItem @relation(fields: [foodItemId], references: [id])
  createdAt     DateTime @default(now())
  deletedAt     DateTime?

  @@unique([schoolId, date, mealSlot])
}

model GrocerySheet {
  id            String   @id @default(uuid())
  schoolId      String
  school        School   @relation(fields: [schoolId], references: [id])
  month         Int
  year          Int
  budget        Decimal  @db.Decimal(12, 0)
  gasCost       Decimal  @db.Decimal(10, 0) @default(0)
  electricityCost Decimal @db.Decimal(10, 0) @default(0)
  totalPurchase Decimal  @db.Decimal(12, 0)
  status        GroceryStatus @default(DRAFT)
  createdById   String
  approvedById  String?
  approvedAt    DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?
  items         GroceryItem[]
}

model GroceryItem {
  id            String        @id @default(uuid())
  grocerySheetId String
  grocerySheet  GrocerySheet  @relation(fields: [grocerySheetId], references: [id])
  ingredientId  String
  ingredient    Ingredient    @relation(fields: [ingredientId], references: [id])
  quantity      Decimal       @db.Decimal(6, 2)
  unitPrice     Decimal       @db.Decimal(10, 0)
  totalPrice    Decimal       @db.Decimal(10, 0)
}

enum GroceryStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  REJECTED
}
```

---

## 7. API & Procedure Design (tRPC)

```ts
// Kho nguyên liệu
nutrition.ingredients.list / create / update
// Kho món ăn
nutrition.foodItems.list / create / update
// Thực đơn
nutrition.menus.planMonth / planWeek / getMonthlyView
nutrition.menus.checkBalance // Kiểm tra trùng món >5 ngày + đa dạng nhóm thực phẩm
// Phiếu đi chợ
nutrition.grocery.create / approve / getBudget
// Tổng kcal ngày
nutrition.menus.getDailyKcal
```

---

## 8. Definition of Done (DoD)
- [ ] Kho nguyên liệu nhập/sửa giá, kcal đầy đủ.
- [ ] Kho món ăn liệt kê được 20 món/buổi ăn.
- [ ] Sắp xếp thực đơn theo tuần hoặc tháng.
- [ ] Quy tắc trùng món tối đa 5 ngày/tháng được validate khi sắp xếp.
- [ ] Kiểm tra đa dạng nhóm thực phẩm (meat/fish/veggie) theo ngày.
- [ ] Tổng kcal hiển thị theo ngày.
- [ ] Phiếu đi chợ tự tính ngân sách theo công thức, không vượt quá.
- [ ] Phiếu đi chợ chờ duyệt, School Admin/Hiệu trưởng duyệt.
- [ ] Phụ huynh xem thực đơn tháng hiện tại (read-only).
- [ ] RLS tenant isolation pass; Audit log ghi toàn bộ thao tác.