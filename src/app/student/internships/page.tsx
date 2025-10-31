
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { InternshipCard } from '@/components/InternshipCard';
import type { Internship, EmploymentType } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, XSquare } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { db } from '@/lib/firebase/config';
import { collection, getDocs, Timestamp, query, where } from 'firebase/firestore';
import { parseISO } from 'date-fns';

const ITEMS_PER_PAGE = 9;

export default function InternshipBoardPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [allInternships, setAllInternships] = useState<Internship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState<'All' | 'Local' | 'Remote' | 'International'>('All');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState<'All' | EmploymentType>('All');
  const [majorFilter, setMajorFilter] = useState<'All' | string>('All');
  const [savedInternships, setSavedInternships] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchInternships = async () => {
      setIsLoading(true);
      try {
        const internshipsRef = collection(db, "internships");
        const q = query(internshipsRef, where("status", "==", "approved"));
        const querySnapshot = await getDocs(q);
        const fetchedInternships: Internship[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<Internship, 'id' | 'createdAt' | 'deadline'> & { createdAt: Timestamp, deadline: string };
          fetchedInternships.push({ 
            ...data, 
            id: doc.id, 
            createdAt: data.createdAt.toDate(),
            deadline: data.deadline,
          });
        });
        
        const sortedInternships = fetchedInternships.sort((a, b) => {
            const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
            const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
            return dateB - dateA;
        });

        setAllInternships(sortedInternships);

      } catch (error) {
        console.error("Error fetching internships:", error);
        toast({ title: t('messages.errorOccurred'), description: "Failed to fetch internships.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInternships();
    
    const localSaved = localStorage.getItem('savedInternships');
    if (localSaved) {
      setSavedInternships(new Set(JSON.parse(localSaved)));
    }
  }, [t, toast]);

  const uniqueMajors = useMemo(() => {
    const majors = new Set<string>();
    allInternships.forEach(internship => {
        if (internship.requiredMajors) {
            internship.requiredMajors.forEach(major => majors.add(major));
        }
    });
    return ['All', ...Array.from(majors).sort()];
  }, [allInternships]);

  const handleSaveInternship = (internshipId: string) => {
    const newSavedInternships = new Set(savedInternships);
    if (newSavedInternships.has(internshipId)) {
      newSavedInternships.delete(internshipId);
      toast({ title: t('messages.internshipUnsaved'), description: t('messages.internshipUnsavedSuccess') });
    } else {
      newSavedInternships.add(internshipId);
      toast({ title: t('messages.internshipSaved'), description: t('messages.internshipSavedSuccess') });
    }
    setSavedInternships(newSavedInternships);
    localStorage.setItem('savedInternships', JSON.stringify(Array.from(newSavedInternships)));
  };

  const filteredInternships = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return allInternships
      .filter(internship => {
        const matchesSearch = 
          internship.title.toLowerCase().includes(lowerSearchTerm) ||
          internship.company.toLowerCase().includes(lowerSearchTerm) ||
          (internship.tags && internship.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm)));
        
        const matchesLocation = locationFilter === 'All' || internship.type === locationFilter;
        
        const matchesEmploymentType = employmentTypeFilter === 'All' || internship.employmentType === employmentTypeFilter;

        const matchesMajor = majorFilter === 'All' || (internship.requiredMajors && internship.requiredMajors.includes(majorFilter));
        
        return matchesSearch && matchesLocation && matchesEmploymentType && matchesMajor;
      })
      .sort((a, b) => parseISO(a.deadline).getTime() - parseISO(b.deadline).getTime());
  }, [allInternships, searchTerm, locationFilter, employmentTypeFilter, majorFilter]);

  const paginatedInternships = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInternships.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredInternships, currentPage]);

  const totalPages = Math.ceil(filteredInternships.length / ITEMS_PER_PAGE);

  const handleClearFilters = () => {
    setSearchTerm('');
    setLocationFilter('All');
    setEmploymentTypeFilter('All');
    setMajorFilter('All');
    setCurrentPage(1);
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-full">{t('general.loading')}</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline text-foreground mb-2">{t('headings.jobBoard')}</h1>
        <p className="text-muted-foreground">{t('messages.internshipBoardDescription')}</p>
      </div>

      <div className="p-6 bg-card rounded-lg shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-grow min-w-[200px] sm:min-w-[240px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('placeholders.searchInternships')}
              className="pl-12 w-full rounded-full"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          
          <Select value={employmentTypeFilter} onValueChange={(value: any) => { setEmploymentTypeFilter(value); setCurrentPage(1); }}>
            <SelectTrigger className="w-full sm:w-auto min-w-[180px]">
              <SelectValue placeholder={t('labels.employmentType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">{t('filter.allEmploymentTypes')}</SelectItem>
              <SelectItem value="Internship">{t('labels.employmentTypes.internship')}</SelectItem>
              <SelectItem value="Full-time">{t('labels.employmentTypes.fullTime')}</SelectItem>
              <SelectItem value="Part-time">{t('labels.employmentTypes.partTime')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={locationFilter} onValueChange={(value: any) => { setLocationFilter(value); setCurrentPage(1); }}>
            <SelectTrigger className="w-full sm:w-auto min-w-[180px]">
              <SelectValue placeholder={t('labels.location')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">{t('filter.allLocations')}</SelectItem>
              <SelectItem value="Local">{t('filter.local')}</SelectItem>
              <SelectItem value="Remote">{t('filter.remote')}</SelectItem>
              <SelectItem value="International">{t('filter.international')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={majorFilter} onValueChange={(value: any) => { setMajorFilter(value); setCurrentPage(1); }}>
            <SelectTrigger className="w-full sm:w-auto min-w-[180px]">
              <SelectValue placeholder={t('labels.major')} />
            </SelectTrigger>
            <SelectContent>
                {uniqueMajors.map(major => (
                  <SelectItem key={major} value={major}>
                      {major === 'All' ? t('filter.allMajors') : major}
                  </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleClearFilters} className="w-full sm:w-auto">
              <XSquare className="mr-2 h-4 w-4" /> {t('buttons.clearFilters')}
          </Button>

        </div>
      </div>

      {paginatedInternships.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedInternships.map(internship => (
            <InternshipCard 
              key={internship.id} 
              internship={internship}
              onSave={handleSaveInternship}
              isSaved={savedInternships.has(internship.id!)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Filter className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground">{t('messages.noInternshipsFound')}</p>
        </div>
      )}

      {totalPages > 1 && (
         <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); if (currentPage > 1) setCurrentPage(currentPage - 1); }}
                  aria-disabled={currentPage === 1}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); setCurrentPage(i + 1); }}
                    isActive={currentPage === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setCurrentPage(currentPage + 1); }}
                  aria-disabled={currentPage === totalPages}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
      )}
    </div>
  );
}
