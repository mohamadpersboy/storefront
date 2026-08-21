import {
  ShoppingCart,
  Users,
  Package,
  PackageX,
  Sparkles,
  Wallet,
  CalendarClock,
  Percent,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { SalesTrendChart } from "@/components/dashboard/sales-trend-chart";
import { OrderStatusBreakdown } from "@/components/dashboard/order-status-breakdown";
import { RecentOrdersTable } from "@/components/dashboard/recent-orders-table";
import { TopProductsList } from "@/components/dashboard/top-products-list";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  mockKpis,
  mockSalesTrend,
  mockOrderStatusDistribution,
} from "@/lib/mock/dashboard";
import { formatToman, toPersianDigits } from "@/lib/utils/format";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/models/User";
import { ROLES } from "@/lib/constants/rbac";

async function getCustomersCount() {
  await connectToDatabase();
  return User.countDocuments({ role: ROLES.CUSTOMER });
}

export default async function DashboardOverviewPage() {
  const customersCount = await getCustomersCount();

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      {/* بخشی از این صفحه (تعداد مشتریان) اکنون از دیتابیس واقعی است.
          بقیه KPIها/نمودارها همچنان Mock هستند تا Feature‌های Products
          و Orders ساخته شوند — طبق CLAUDE.md "No Fake Data Rule". */}
      <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
        «تعداد مشتریان» از دیتابیس واقعی است. بقیه ارقام این صفحه هنوز
        نمایشی (Mock) هستند و پس از تکمیل Featureهای محصولات و سفارش‌ها
        جایگزین می‌شوند.
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="فروش امروز"
          value={formatToman(mockKpis.todaySales)}
          icon={Wallet}
        />
        <KpiCard
          label="فروش این ماه"
          value={formatToman(mockKpis.monthSales)}
          icon={Wallet}
        />
        <KpiCard
          label="تعداد سفارش‌ها"
          value={toPersianDigits(mockKpis.ordersCount)}
          icon={ShoppingCart}
        />
        <KpiCard
          label="در انتظار بررسی"
          value={toPersianDigits(mockKpis.pendingOrders)}
          icon={CalendarClock}
          tone="warning"
        />
        <KpiCard
          label="تعداد مشتریان"
          value={toPersianDigits(customersCount)}
          icon={Users}
        />
        <KpiCard
          label="تعداد محصولات"
          value={toPersianDigits(mockKpis.productsCount)}
          icon={Package}
        />
        <KpiCard
          label="محصولات ناموجود"
          value={toPersianDigits(mockKpis.outOfStockProducts)}
          icon={PackageX}
          tone="danger"
        />
        <KpiCard
          label="تخفیف شگفت‌انگیز فعال"
          value={toPersianDigits(mockKpis.activeAmazingOffers)}
          icon={Sparkles}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader
            title="روند فروش هفته اخیر"
            description="مجموع فروش به تفکیک روز"
          />
          <CardContent>
            <SalesTrendChart data={mockSalesTrend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="توزیع وضعیت سفارش‌ها" />
          <CardContent>
            <OrderStatusBreakdown data={mockOrderStatusDistribution} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader
            title="سفارش‌های اخیر"
            description="آخرین سفارش‌های ثبت‌شده در فروشگاه"
          />
          <RecentOrdersTable />
        </Card>

        <Card>
          <CardHeader
            title="پرفروش‌ترین محصولات"
            action={
              <span className="flex items-center gap-1 text-xs text-primary">
                <Percent className="size-3.5" />
                این ماه
              </span>
            }
          />
          <TopProductsList />
        </Card>
      </div>
    </div>
  );
}
