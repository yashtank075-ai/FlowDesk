import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Users,
  Building2,
  HelpCircle,
  CalendarCheck,
  X,
  Loader2,
  ArrowRight,
  Command,
  CornerDownLeft,
} from 'lucide-react';
import { useGlobalSearch } from '../../hooks/useGlobalSearch';
import { formatCurrency } from '../../utils/formatters';

interface GlobalSearchProps {
  className?: string;
}

type SearchItem =
  | { category: 'leads'; id: string; title: string; subtitle: string; badge: string; path: string }
  | { category: 'customers'; id: string; title: string; subtitle: string; badge: string; path: string }
  | { category: 'enquiries'; id: string; title: string; subtitle: string; badge: string; path: string }
  | { category: 'follow-ups'; id: string; title: string; subtitle: string; badge: string; path: string };

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const { currentWorkspace } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce user input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Global Keyboard listener for Ctrl+K / Cmd+K and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        if (!isOpen) {
          setTimeout(() => inputRef.current?.focus(), 50);
        }
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Fetch search data via React Query
  const { data, isLoading, isError, refetch } = useGlobalSearch({
    q: debouncedQuery,
    limit: 5,
  });

  // Flatten items for Arrow Up/Down navigation
  const flatItems: SearchItem[] = useMemo(() => {
    if (!data?.results) return [];
    const items: SearchItem[] = [];

    // Leads
    data.results.leads?.forEach((l) => {
      items.push({
        category: 'leads',
        id: l.id,
        title: l.name,
        subtitle: `${l.company} • ${l.email}`,
        badge: l.status,
        path: '/leads',
      });
    });

    // Customers
    data.results.customers?.forEach((c) => {
      items.push({
        category: 'customers',
        id: c.id,
        title: c.name,
        subtitle: `${c.company} • ${formatCurrency(c.mrr, currentWorkspace?.currency)} MRR`,
        badge: c.status,
        path: '/customers',
      });
    });

    // Enquiries
    data.results.enquiries?.forEach((e) => {
      items.push({
        category: 'enquiries',
        id: e.id,
        title: `[${e.ticketNumber}] ${e.subject}`,
        subtitle: `${e.customerName} • ${e.priority}`,
        badge: e.status,
        path: '/enquiries',
      });
    });

    // Follow-ups
    data.results.followUps?.forEach((f) => {
      items.push({
        category: 'follow-ups',
        id: f.id,
        title: f.title,
        subtitle: `${f.contactName} (${f.contactCompany}) • Due ${f.dueDate}`,
        badge: f.status,
        path: '/follow-ups',
      });
    });

    return items;
  }, [data]);

  // Handle keyboard list navigation
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (flatItems.length === 0 ? 0 : (prev + 1) % flatItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (flatItems.length === 0 ? 0 : (prev - 1 + flatItems.length) % flatItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatItems[activeIndex]) {
        selectItem(flatItems[activeIndex]);
      }
    }
  };

  const selectItem = (item: SearchItem) => {
    setIsOpen(false);
    setQuery('');
    navigate(item.path);
  };

  const getCategoryIcon = (category: SearchItem['category']) => {
    switch (category) {
      case 'leads':
        return <Users className="w-4 h-4 text-blue-600" />;
      case 'customers':
        return <Building2 className="w-4 h-4 text-emerald-600" />;
      case 'enquiries':
        return <HelpCircle className="w-4 h-4 text-amber-600" />;
      case 'follow-ups':
        return <CalendarCheck className="w-4 h-4 text-purple-600" />;
    }
  };

  // Helper to highlight matching text query in results
  const renderHighlighted = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="bg-indigo-50 text-indigo-700 font-bold px-0.5 rounded-sm">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Desktop Search Trigger / Input */}
      <div className="relative w-56 lg:w-72">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
            setActiveIndex(0);
          }}
          onKeyDown={handleInputKeyDown}
          placeholder="Search leads, customers... (Ctrl+K)"
          className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-slate-700 placeholder-slate-400"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setDebouncedQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="hidden lg:inline-flex absolute right-2.5 top-2 items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-slate-100 border border-slate-200 rounded-md">
            ⌘K
          </span>
        )}
      </div>

      {/* Search Overlay / Dropdown Results */}
      {isOpen && (
        <div className="absolute left-0 right-0 sm:right-auto sm:w-[480px] top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden animate-in fade-in-50 duration-150">
          {/* Header query summary & instructions */}
          <div className="p-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              {query.trim().length >= 2 ? (
                <span>
                  Searching for <span className="font-semibold text-slate-800">"{query}"</span>
                </span>
              ) : (
                <span>Type at least 2 characters to search across all workspace records</span>
              )}
            </span>
            <div className="flex items-center gap-2">
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />}
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-slate-400">
                <kbd className="px-1 bg-white border border-slate-200 rounded-xs">ESC</kbd> close
              </span>
            </div>
          </div>

          {/* Results List or Status Message */}
          <div className="max-h-[360px] overflow-y-auto p-2 divide-y divide-slate-50">
            {isError ? (
              <div className="p-6 text-center text-xs">
                <p className="text-rose-600 font-semibold mb-1">Search request failed</p>
                <p className="text-slate-500 text-[11px] mb-3">Unable to reach database search endpoint.</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
                >
                  Retry Search
                </button>
              </div>
            ) : query.trim().length < 2 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                <Search className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="font-medium text-slate-600 mb-0.5">Quick Workspace Search</p>
                <p className="text-[11px] text-slate-400">
                  Search leads, customer directory, support tickets, and follow-up tasks.
                </p>
              </div>
            ) : isLoading && !data ? (
              <div className="p-6 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                <span>Searching PostgreSQL records...</span>
              </div>
            ) : flatItems.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                <p className="font-medium text-slate-600 mb-0.5">No results found for "{debouncedQuery}"</p>
                <p className="text-[11px] text-slate-400">
                  Try searching by contact name, company, email, ticket #, or task title.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {flatItems.map((item, idx) => {
                  const isSelected = idx === activeIndex;
                  return (
                    <div
                      key={`${item.category}-${item.id}`}
                      onClick={() => selectItem(item)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                        isSelected ? 'bg-indigo-50/70 border border-indigo-100' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                          {getCategoryIcon(item.category)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {renderHighlighted(item.title, debouncedQuery)}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {renderHighlighted(item.subtitle, debouncedQuery)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                          {item.badge}
                        </span>
                        {isSelected && <ArrowRight className="w-3.5 h-3.5 text-indigo-600 hidden sm:block" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Shortcuts info */}
          {flatItems.length > 0 && (
            <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span className="font-medium text-slate-600">
                Found {flatItems.length} matching {flatItems.length === 1 ? 'record' : 'records'}
              </span>
              <div className="flex items-center gap-2">
                <span>
                  <kbd className="px-1 bg-white border border-slate-200 rounded-xs">↑</kbd>{' '}
                  <kbd className="px-1 bg-white border border-slate-200 rounded-xs">↓</kbd> navigate
                </span>
                <span>
                  <kbd className="px-1 bg-white border border-slate-200 rounded-xs">↵</kbd> open
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
