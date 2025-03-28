
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Mic, 
  X, 
  History, 
  PanelLeft
} from 'lucide-react';
import { ProcessedData } from '@/types/data';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Fuse from 'fuse.js';
import { toast } from '@/hooks/use-toast';

interface SearchBarProps {
  onSearch: (query: string) => void;
  data: ProcessedData[];
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, data }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const speechRecognition = useRef<SpeechRecognition | null>(null);

  // Initialize fuse.js for fuzzy search
  const fuseRef = useRef<Fuse<ProcessedData> | null>(null);
  
  useEffect(() => {
    if (data.length > 0 && !fuseRef.current) {
      fuseRef.current = new Fuse(data, {
        keys: [
          'cleanedClass',
          'teacherName',
          'location',
          'dayOfWeek'
        ],
        threshold: 0.3
      });
    }
    
    // Load search history from localStorage
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, [data]);

  useEffect(() => {
    if (query.length >= 2 && fuseRef.current) {
      const results = fuseRef.current.search(query);
      const uniqueSuggestions = Array.from(
        new Set(
          results.slice(0, 5).flatMap(result => [
            result.item.cleanedClass,
            result.item.teacherName,
            result.item.location
          ])
        )
      );
      setSuggestions(uniqueSuggestions);
      setOpen(true);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    // Add to history if it's not already there
    setHistory(prev => {
      const newHistory = [searchQuery, ...prev.filter(h => h !== searchQuery)].slice(0, 10);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      return newHistory;
    });
    
    onSearch(searchQuery);
    setQuery(searchQuery);
    setOpen(false);
  };

  const clearSearch = () => {
    setQuery('');
    onSearch('');
  };

  const startVoiceSearch = () => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      toast({
        title: "Voice Search Unavailable",
        description: "Your browser doesn't support voice recognition.",
        variant: "destructive"
      });
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!speechRecognition.current) {
      speechRecognition.current = new SpeechRecognition();
      speechRecognition.current.continuous = false;
      speechRecognition.current.interimResults = false;
      speechRecognition.current.lang = 'en-US';
    }
    
    speechRecognition.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      handleSearch(transcript);
      setListening(false);
    };
    
    speechRecognition.current.onerror = () => {
      toast({
        title: "Voice Recognition Error",
        description: "There was an error with voice recognition.",
        variant: "destructive"
      });
      setListening(false);
    };
    
    speechRecognition.current.onend = () => {
      setListening(false);
    };
    
    setListening(true);
    speechRecognition.current.start();
  };

  const stopVoiceSearch = () => {
    if (speechRecognition.current) {
      speechRecognition.current.stop();
      setListening(false);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Search className="h-4 w-4" />
        Advanced Search
      </h3>
      
      <div className="relative flex items-center">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search classes, instructors, locations..."
                className="pl-10 pr-10"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(query);
                  }
                }}
              />
              {query && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearSearch}
                  className="absolute right-10 top-1/2 -translate-y-1/2 h-7 w-7"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant={listening ? "destructive" : "ghost"}
                size="icon"
                onClick={listening ? stopVoiceSearch : startVoiceSearch}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              >
                <Mic className="h-4 w-4" />
              </Button>
            </div>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[min(calc(100vw-2rem),25rem)]" align="start">
            <Command>
              <CommandInput placeholder="Search..." value={query} onValueChange={setQuery} />
              <CommandEmpty>No results found.</CommandEmpty>
              {suggestions.length > 0 && (
                <CommandGroup heading="Suggestions">
                  {suggestions.map((suggestion, i) => (
                    <CommandItem
                      key={`suggestion-${i}`}
                      onSelect={() => handleSearch(suggestion)}
                      className="flex items-center gap-2"
                    >
                      <Search className="h-4 w-4" />
                      {suggestion}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {history.length > 0 && (
                <CommandGroup heading="Search History">
                  {history.map((item, i) => (
                    <CommandItem
                      key={`history-${i}`}
                      onSelect={() => handleSearch(item)}
                      className="flex items-center gap-2"
                    >
                      <History className="h-4 w-4" />
                      {item}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      
      {listening && (
        <div className="text-center py-2 animate-pulse">
          <p className="text-sm">Listening... speak now</p>
        </div>
      )}
      
      <div className="mt-4 space-y-1">
        <h4 className="text-sm font-medium text-muted-foreground">Search Features:</h4>
        <ul className="text-xs space-y-1 text-muted-foreground">
          <li className="flex items-center gap-1">
            <Search className="h-3 w-3" />
            <span>Fuzzy matching</span>
          </li>
          <li className="flex items-center gap-1">
            <Mic className="h-3 w-3" />
            <span>Voice search</span>
          </li>
          <li className="flex items-center gap-1">
            <History className="h-3 w-3" />
            <span>Search history</span>
          </li>
          <li className="flex items-center gap-1">
            <PanelLeft className="h-3 w-3" />
            <span>Suggestions</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SearchBar;
