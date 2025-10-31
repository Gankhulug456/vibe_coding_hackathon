
import { UserSpecificLayout } from '@/components/layout/UserSpecificLayout';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <UserSpecificLayout>{children}</UserSpecificLayout>;
}
