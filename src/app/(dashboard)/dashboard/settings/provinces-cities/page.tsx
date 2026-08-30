import { ProvincesCitiesManager } from "@/components/settings/provinces-cities-manager";

export default function ProvincesCitiesPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">استان‌ها و شهرها</h1>
        <p className="mt-1 text-sm text-muted">
          Import اطلاعات استان/شهر از Excel — منبع Dropdown استان/شهر در فرم‌های آدرس
        </p>
      </div>
      <ProvincesCitiesManager />
    </div>
  );
}
