
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { LearnResource } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit, Trash2, BookOpen, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp, orderBy, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

const learnResourceSchema = z.object({
  title_en: z.string().min(5, "English title must be at least 5 characters."),
  title_mn: z.string().min(5, "Mongolian title must be at least 5 characters."),
  description_en: z.string().min(10, "English description must be at least 10 characters."),
  description_mn: z.string().min(10, "Mongolian description must be at least 10 characters."),
  content_en: z.string().min(50, "English content must be at least 50 characters."),
  content_mn: z.string().min(50, "Mongolian content must be at least 50 characters."),
  imageUrl: z.string().url("Please enter a valid URL for the image."),
  tags: z.string().refine(val => val.split(',').map(tag => tag.trim()).filter(Boolean).every(tag => tag.length > 0) || val.length === 0, {
    message: "Tags must be comma-separated words.",
  }),
  type: z.enum(['article', 'video', 'guide']),
});

type ResourceFormValues = z.infer<typeof learnResourceSchema>;

export default function ManageLearnCenterPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [resources, setResources] = useState<LearnResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<LearnResource | null>(null);

  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(learnResourceSchema),
    defaultValues: {
      title_en: '', title_mn: '',
      description_en: '', description_mn: '',
      content_en: '', content_mn: '',
      imageUrl: '',
      tags: '',
      type: 'article',
    },
  });

  useEffect(() => {
    const fetchResources = async () => {
      setIsLoading(true);
      try {
        const resourcesRef = collection(db, "learn_resources");
        const q = query(resourcesRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedResources = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: (doc.data().createdAt as Timestamp)?.toDate()
        } as LearnResource));
        setResources(fetchedResources);
      } catch (error) {
        console.error("Error fetching learning resources:", error);
        toast({ title: "Error", description: "Failed to fetch learning resources.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchResources();
  }, [toast]);

  const openModalForEdit = (resource: LearnResource) => {
    setEditingResource(resource);
    form.reset({
      ...resource,
      tags: resource.tags.join(', '),
    });
    setIsModalOpen(true);
  };

  const openModalForNew = () => {
    setEditingResource(null);
    form.reset({
      title_en: '', title_mn: '',
      description_en: '', description_mn: '',
      content_en: '', content_mn: '',
      imageUrl: '/placeholder-learn.png',
      tags: '',
      type: 'article',
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: ResourceFormValues) => {
    setIsSubmitting(true);
    const payload = {
      ...data,
      tags: data.tags.split(',').map(tag => tag.trim()).filter(Boolean),
    };

    try {
      if (editingResource) {
        const docRef = doc(db, "learn_resources", editingResource.id!);
        await updateDoc(docRef, payload);
        setResources(prev => prev.map(r => r.id === editingResource.id ? { ...r, ...payload } : r));
        toast({ title: "Article Updated", description: `"${data.title_en}" has been updated.` });
      } else {
        const docRef = await addDoc(collection(db, "learn_resources"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        const newResource = { ...payload, id: docRef.id, createdAt: new Date() };
        setResources(prev => [newResource as LearnResource, ...prev]);
        toast({ title: "Article Created", description: `"${data.title_en}" has been created.` });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving resource:", error);
      toast({ title: "Error", description: "Failed to save the article.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (resourceId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete the article "${title}"?`)) {
      try {
        await deleteDoc(doc(db, "learn_resources", resourceId));
        setResources(prev => prev.filter(r => r.id !== resourceId));
        toast({ title: "Article Deleted", description: `"${title}" has been deleted.`, variant: "destructive" });
      } catch (error) {
        console.error("Error deleting resource:", error);
        toast({ title: "Error", description: "Failed to delete the article.", variant: "destructive" });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline text-foreground flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" /> Manage Learn Center
          </h1>
          <p className="text-muted-foreground">Create, edit, and delete learning resources.</p>
        </div>
        <Button onClick={openModalForNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Article
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Learning Resources</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-center h-48">{t('general.loading')}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title (English)</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map((res) => (
                  <TableRow key={res.id}>
                    <TableCell className="font-medium">{res.title_en}</TableCell>
                    <TableCell>{res.type}</TableCell>
                    <TableCell>{res.tags.join(', ')}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openModalForEdit(res)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => handleDelete(res.id!, res.title_en)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingResource ? "Edit Article" : "Create New Article"}</DialogTitle>
            <DialogDescription>Fill in the details for the learning resource below.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto flex-grow pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="title_en">Title (English)</Label>
                    <Input id="title_en" {...form.register('title_en')} />
                    {form.formState.errors.title_en && <p className="text-sm text-destructive">{form.formState.errors.title_en.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="title_mn">Title (Mongolian)</Label>
                    <Input id="title_mn" {...form.register('title_mn')} />
                    {form.formState.errors.title_mn && <p className="text-sm text-destructive">{form.formState.errors.title_mn.message}</p>}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="description_en">Short Description (English)</Label>
                    <Textarea id="description_en" {...form.register('description_en')} />
                    {form.formState.errors.description_en && <p className="text-sm text-destructive">{form.formState.errors.description_en.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="description_mn">Short Description (Mongolian)</Label>
                    <Textarea id="description_mn" {...form.register('description_mn')} />
                    {form.formState.errors.description_mn && <p className="text-sm text-destructive">{form.formState.errors.description_mn.message}</p>}
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="content_en">Content (English)</Label>
                    <Textarea id="content_en" {...form.register('content_en')} className="min-h-[200px]" />
                    {form.formState.errors.content_en && <p className="text-sm text-destructive">{form.formState.errors.content_en.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="content_mn">Content (Mongolian)</Label>
                    <Textarea id="content_mn" {...form.register('content_mn')} className="min-h-[200px]" />
                    {form.formState.errors.content_mn && <p className="text-sm text-destructive">{form.formState.errors.content_mn.message}</p>}
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input id="imageUrl" {...form.register('imageUrl')} />
                {form.formState.errors.imageUrl && <p className="text-sm text-destructive">{form.formState.errors.imageUrl.message}</p>}
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input id="tags" {...form.register('tags')} />
                    {form.formState.errors.tags && <p className="text-sm text-destructive">{form.formState.errors.tags.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Controller
                        name="type"
                        control={form.control}
                        render={({ field }) => (
                             <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="article">Article</SelectItem>
                                    <SelectItem value="video">Video</SelectItem>
                                    <SelectItem value="guide">Guide</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {form.formState.errors.type && <p className="text-sm text-destructive">{form.formState.errors.type.message}</p>}
                </div>
            </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
