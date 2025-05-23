-- schema.sql

-- 先刪除有外鍵參照的表
DROP TABLE IF EXISTS booked_slots;
DROP TABLE IF EXISTS requested_slots;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS admins;

-- 建立基礎表 rooms
CREATE TABLE IF NOT EXISTS rooms (
    room_id TEXT PRIMARY KEY,
    room_name TEXT NOT NULL,
    location TEXT,
    capacity INTEGER DEFAULT 0,
    "order" INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add trigger for updated_at
CREATE TRIGGER IF NOT EXISTS rooms_update_timestamp 
AFTER UPDATE ON rooms
BEGIN
    UPDATE rooms SET updated_at = CURRENT_TIMESTAMP WHERE room_id = NEW.room_id;
END;

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

-- 建立已確認預約表
CREATE TABLE booked_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL,
    room_id TEXT NOT NULL,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id),
    FOREIGN KEY (room_id) REFERENCES rooms(room_id)
);

-- 建立已確認預約表索引
CREATE INDEX idx_booked_slots_application ON booked_slots(application_id);
CREATE INDEX idx_booked_slots_room_date ON booked_slots(room_id, date);

-- 建立管理員表
CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    notify_review INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add trigger for updated_at
CREATE TRIGGER IF NOT EXISTS admins_update_timestamp 
AFTER UPDATE ON admins
BEGIN
    UPDATE admins SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Create index for email
CREATE INDEX idx_admins_email ON admins(email);

-- 預設管理員資料
INSERT INTO admins (email, name, is_active, notify_review) VALUES
  ('411111226@ndhu.edu.tw', '油成', 1, 1),
  ('ya@ndhu.edu.tw', '雅蓉姊姊', 1, 1);