// این پکیج نسخه‌ای است که Leaflet را Fork/Extend کرده و هیچ فایل .d.ts
// عرضه نمی‌کند. چون در تعامل با آن فقط از یک نمونه Map/Marker استاندارد
// Leaflet استفاده می‌کنیم (بدون متدهای اختصاصی جدید)، اینجا صرفاً
// به‌عنوان ماژول با تایپ `any` معرفی می‌شود تا TypeScript خطا ندهد.
declare module "@neshan-maps-platform/leaflet";
