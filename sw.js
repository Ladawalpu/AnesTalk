// AnesTalk service worker — เปลี่ยนเลข VERSION ทุกครั้งที่แก้ไฟล์ เพื่อให้เครื่องผู้ใช้โหลดของใหม่
const VERSION = "anestalk-v1";
const CORE = ["./", "./index.html", "./manifest.json",
  "./icons/icon-32.png", "./icons/icon-96.png", "./icons/icon-180.png",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // หน้าเว็บ: ลองโหลดใหม่จากเน็ตก่อน ถ้าออฟไลน์ใช้ของใน cache
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(r => {
      const copy = r.clone(); caches.open(VERSION).then(c => c.put("./index.html", copy)); return r;
    }).catch(() => caches.match("./index.html")));
    return;
  }

  // ไฟล์ของแอปและฟอนต์ Google: ใช้ cache ก่อน แล้วอัปเดตเบื้องหลัง
  const cacheable = url.origin === location.origin ||
    url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!cacheable) return;
  e.respondWith(caches.open(VERSION).then(async c => {
    const hit = await c.match(req);
    const net = fetch(req).then(r => { if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
