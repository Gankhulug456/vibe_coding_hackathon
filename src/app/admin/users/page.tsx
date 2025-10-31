
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User } from "@/types"; 
import { useState, useMemo, useEffect } from "react";
import { Edit, Trash2, Search, UserPlus, ShieldAlert } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';

export default function ManageUsersPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const usersCollection = collection(db, 'users');
        const userSnapshot = await getDocs(usersCollection);
        const userList = userSnapshot.docs.map(docSnap => ({
          uid: docSnap.id,
          ...docSnap.data(),
          createdAt: (docSnap.data().createdAt as Timestamp).toDate(),
        } as User));
        setUsers(userList);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({ title: t('messages.errorOccurred'), description: "Failed to fetch users.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [t, toast]);


  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleEditUser = (uid: string) => {
    toast({ title: t('headings.editApplication'), description: t('toasts.editUserComingSoon', {id: uid}) });
  };

  const handleDeleteUser = async (uid: string, name: string) => {
    if(uid === 'admin@nomadlyintern.app') { // Use the actual admin UID or a defining characteristic
        toast({ title: t('messages.errorOccurred'), description: t('messages.deleteUserDeniedAdmin'), variant: "destructive" });
        return;
    }
    if (window.confirm(t('messages.confirmDeleteUser', {name: name}))) {
      try {
        await deleteDoc(doc(db, "users", uid));
        setUsers(prev => prev.filter(user => user.uid !== uid));
        toast({ title: t('messages.userDeleted'), description: t('messages.userDeletedSuccess', {name: name}), variant: "destructive" });
      } catch (error) {
        console.error("Error deleting user:", error);
        toast({ title: "Error", description: "Failed to delete user.", variant: "destructive"});
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-foreground">{t('navigation.manageUsers')}</h1>
          <p className="text-muted-foreground">{t('adminPages.manageUsersDescription')}</p>
        </div>
        <Button disabled> 
          <UserPlus className="mr-2 h-4 w-4" /> {t('buttons.addNewUserComingSoon')}
        </Button>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('headings.allUsers')}</CardTitle>
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                type="search"
                placeholder={t('placeholders.searchUsers')}
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">{t('general.loading')}</div>
          ) : filteredUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('labels.name')}</TableHead>
                  <TableHead>{t('labels.email')}</TableHead>
                  <TableHead>{t('labels.role')}</TableHead>
                  <TableHead>{t('labels.registeredAt')}</TableHead>
                  <TableHead className="text-right">{t('labels.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'organization' ? 'secondary' : 'default'}>
                        {t(`labels.${user.role}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEditUser(user.uid)} title={t('headings.editApplication')} disabled>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.uid, user.name)} className="text-destructive hover:text-destructive/80" title={t('messages.userDeleted')} disabled={user.role === 'admin'}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{t('messages.noUsersFound')}</p>
            </div>
          )}
        </CardContent>
      </Card>
       <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md">
        <div className="flex">
          <div className="py-1"><ShieldAlert className="h-5 w-5 text-red-500 mr-3" /></div>
          <div>
            <p className="font-bold">{t('headings.caution')}</p>
            <p className="text-sm">{t('messages.adminUsersCaution')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
