"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';

interface FancySearchProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const FancySearch = React.forwardRef<HTMLInputElement, FancySearchProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className={cn("relative w-full h-12", className)}>
        <div className="relative flex items-center justify-center group w-full h-full">
          
          {/* Glow Layers from user-provided code, adapted for consistency */}
          <div className="absolute z-[-1] overflow-hidden h-full w-full rounded-full blur-[3px] 
                          before:absolute before:content-[''] before:z-[-2] before:w-[600px] before:h-[600px] before:bg-no-repeat before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-60
                          before:bg-[conic-gradient(hsl(var(--primary)),#402fb5_5%,hsl(var(--primary))_38%,hsl(var(--primary))_50%,#cf30aa_60%,hsl(var(--primary))_87%)] before:transition-all before:duration-[2000ms]
                          group-hover:before:rotate-[-120deg] group-focus-within:before:rotate-[420deg] group-focus-within:before:duration-[4000ms]">
          </div>
          <div className="absolute z-[-1] overflow-hidden h-full w-full rounded-full blur-[3px] 
                          before:absolute before:content-[''] before:z-[-2] before:w-[600px] before:h-[600px] before:bg-no-repeat before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-[82deg]
                          before:bg-[conic-gradient(rgba(0,0,0,0),#18116a,rgba(0,0,0,0)_10%,rgba(0,0,0,0)_50%,#6e1b60,rgba(0,0,0,0)_60%)] before:transition-all before:duration-[2000ms]
                          group-hover:before:rotate-[-98deg] group-focus-within:before:rotate-[442deg] group-focus-within:before:duration-[4000ms]">
          </div>
          <div className="absolute z-[-1] overflow-hidden h-full w-full rounded-full blur-[2px] 
                          before:absolute before:content-[''] before:z-[-2] before:w-[600px] before:h-[600px] before:bg-no-repeat before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-[83deg]
                          before:bg-[conic-gradient(rgba(0,0,0,0)_0%,#a099d8,rgba(0,0,0,0)_8%,rgba(0,0,0,0)_50%,#dfa2da,rgba(0,0,0,0)_58%)] before:brightness-140
                          before:transition-all before:duration-[2000ms] group-hover:before:rotate-[-97deg] group-focus-within:before:rotate-[443deg] group-focus-within:before:duration-[4000ms]">
          </div>
          <div className="absolute z-[-1] overflow-hidden h-full w-full rounded-full blur-[0.5px] 
                          before:absolute before:content-[''] before:z-[-2] before:w-[600px] before:h-[600px] before:bg-no-repeat before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-70
                          before:bg-[conic-gradient(hsl(var(--card)),#402fb5_5%,hsl(var(--card))_14%,hsl(var(--card))_50%,#cf30aa_60%,hsl(var(--card))_64%)] before:brightness-130
                          before:transition-all before:duration-[2000ms] group-hover:before:rotate-[-110deg] group-focus-within:before:rotate-[430deg] group-focus-within:before:duration-[4000ms]">
          </div>
          
          {/* Input field and icon */}
          <div className="relative w-full h-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              ref={ref}
              type="search"
              className="w-full h-full pl-12 pr-4 rounded-full bg-card border-none text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              {...props}
            />
          </div>
        </div>
      </div>
    );
  }
);
FancySearch.displayName = "FancySearch";
