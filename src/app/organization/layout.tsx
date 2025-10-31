
import { UserSpecificLayout } from '@/components/layout/UserSpecificLayout';

export default function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <UserSpecificLayout>{children}</UserSpecificLayout>;
}
