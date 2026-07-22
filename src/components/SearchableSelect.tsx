import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface SearchOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
}

interface SearchableSelectProps {
  options: SearchOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  dropdownClassName?: string;
  clearableText?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "-- Select --",
  disabled = false,
  className = "",
  dropdownClassName = "",
  clearableText
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filteredOptions = options.filter(option => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchLabel = option.label.toLowerCase().includes(term);
    const matchSublabel = option.sublabel ? option.sublabel.toLowerCase().includes(term) : false;
    const matchValue = option.value.toLowerCase().includes(term);
    return matchLabel || matchSublabel || matchValue;
  });

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div ref={containerRef} className={`relative font-mono text-xs w-full ${className}`}>
      {/* Trigger Box */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left py-2 px-3 bg-white border-[1.5px] border-[#141414] flex items-center justify-between gap-2 transition-all cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'hover:bg-slate-50'
        }`}
      >
        <span className="truncate min-w-0 uppercase font-bold text-slate-900 flex-1 text-left">
          {selectedOption ? (
            <span className="flex items-center gap-1.5 min-w-0 w-full">
              <span className="truncate min-w-0">{selectedOption.label}</span>
              {selectedOption.sublabel && (
                <span className="text-[10px] text-slate-500 font-normal truncate min-w-0 hidden sm:inline">
                  ({selectedOption.sublabel})
                </span>
              )}
              {selectedOption.badge && (
                <span className="text-[9px] bg-slate-200 text-slate-800 px-1 py-0.2 font-bold ml-auto shrink-0">
                  {selectedOption.badge}
                </span>
              )}
            </span>
          ) : (
            <span className="text-slate-400 font-normal truncate block">{placeholder}</span>
          )}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Popup */}
      {isOpen && (
        <div className={`absolute left-0 right-0 top-full mt-1 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50 overflow-hidden flex flex-col ${dropdownClassName}`}>
          {/* Search Input Box */}
          <div className="p-2 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, company, ID..."
              className="w-full bg-transparent border-none text-xs font-mono font-bold text-slate-900 focus:outline-none uppercase placeholder:text-slate-400 placeholder:normal-case"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
            {clearableText && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className={`w-full text-left p-2.5 hover:bg-amber-100 transition-colors uppercase font-bold text-[10px] flex items-center justify-between ${
                  !value ? 'bg-amber-50 text-amber-900' : 'text-slate-600'
                }`}
              >
                <span>{clearableText}</span>
                {!value && <Check className="w-3.5 h-3.5 text-amber-800" />}
              </button>
            )}

            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-[11px] italic">
                No matching participants found ({options.length} total)
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left p-2.5 transition-colors uppercase font-bold flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-black text-white'
                        : 'hover:bg-slate-100 text-slate-900'
                    }`}
                  >
                    <div className="truncate flex-1">
                      <div className="text-xs truncate">{opt.label}</div>
                      {opt.sublabel && (
                        <div className={`text-[10px] truncate ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {opt.sublabel}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {opt.badge && (
                        <span className={`text-[9px] px-1.5 py-0.5 font-bold ${
                          isSelected ? 'bg-[#00FF00] text-black' : 'bg-slate-200 text-slate-800'
                        }`}>
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#00FF00]" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="p-1.5 bg-slate-100 border-t border-slate-200 text-[9px] text-slate-500 font-mono text-right font-bold px-2">
            Showing {filteredOptions.length} of {options.length} candidates
          </div>
        </div>
      )}
    </div>
  );
}
