import { Badge } from "@/components/ui/badge";

export function UserStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge tone={isActive ? "success" : "danger"}>
      {isActive ? "فعال" : "غیرفعال"}
    </Badge>
  );
}
