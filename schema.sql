-- schema.sql

-- 先刪除有外鍵參照的表
DROP TABLE IF EXISTS requested_slots;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS rooms;

-- 建立基礎表 rooms
CREATE TABLE rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id TEXT NOT NULL UNIQUE,   -- 如 "A205"
  room_name TEXT NOT NULL,        -- 如 "電腦教室"
  location TEXT,                  -- 位置文字敘述（如「理工大樓二樓」）
  capacity INTEGER,               -- 可容納人數
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 預設教室資料
INSERT INTO rooms (room_id, room_name, location, capacity) VALUES
  ('A205', '電腦教室', '理工大樓2樓', 40),
  ('A302', '大講堂教室', '綜合館3樓', 100);

-- 建立預約申請表
CREATE TABLE applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  organization TEXT,
  phone TEXT,
  purpose TEXT,
  status TEXT CHECK(status IN ('pending', 'reviewing', 'confirmed', 'rejected')) NOT NULL DEFAULT 'pending',
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME,
  review_note TEXT,
  FOREIGN KEY (room_id) REFERENCES rooms(room_id)
);

-- 建立索引
CREATE INDEX idx_applications_room ON applications(room_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_email ON applications(email);

-- 建立請求時段表
CREATE TABLE requested_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  room_id TEXT NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT CHECK(status IN ('pending', 'reviewing', 'confirmed', 'rejected')) NOT NULL DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id),
  FOREIGN KEY (room_id) REFERENCES rooms(room_id)
);

-- 建立時段表索引
CREATE INDEX idx_slots_application ON requested_slots(application_id);
CREATE INDEX idx_slots_room_date ON requested_slots(room_id, date);
CREATE INDEX idx_slots_status ON requested_slots(status);