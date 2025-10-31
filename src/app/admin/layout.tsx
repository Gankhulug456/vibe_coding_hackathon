
import { UserSpecificLayout } from '@/components/layout/UserSpecificLayout';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout will ensure only 'admin' role can access these pages
  // The UserSpecificLayout and useAuthRedirect hook will handle role checking.
  return <UserSpecificLayout>{children}</UserSpecificLayout>;
}
