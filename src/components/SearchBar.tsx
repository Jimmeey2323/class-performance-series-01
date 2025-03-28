
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProcessedData } from '@/types/data';
import { Search, Mic, MicOff, X, History } from 'lucide-react';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import Fuse from 'fuse.js';

interface SearchBarProps {
  onSearch: (query: string) => void;
  data: ProcessedData[];
}

// Type definitions for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: Event) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

// Declare global window objects for speech recognition
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, data }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const recognition = useRef<SpeechRecognition | null>(null);

  // Setup fuzzy search
  const fuseOptions = {
    keys: ['cleanedClass', 'teacherName', 'location', 'dayOfWeek'],
    threshold: 0.4,
    includeMatches: true
  };
  const fuse = new Fuse(data, fuseOptions);

  useEffect(() => {
    // Load search history from localStorage
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }

    // Initialize speech recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        recognition.current = new SpeechRecognitionAPI();
        recognition.current.continuous = false;
        recognition.current.interimResults = false;
        recognition.current.lang = 'en-US';

        recognition.current.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          setQuery(transcript);
          handleSearch(transcript);
          setIsListening(false);
        };

        recognition.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  useEffect(() => {
    if (query.trim()) {
      const results = fuse.search(query).map(result => {
        const item = result.item as ProcessedData;
        return item.cleanedClass;
      });
      
      const uniqueSuggestions = Array.from(new Set(results)).slice(0, 5);
      setSuggestions(uniqueSuggestions);
      setShowSuggestions(uniqueSuggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [query]);

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      onSearch(searchQuery);
      
      // Add to search history
      const newHistory = [searchQuery, ...searchHistory.filter(item => item !== searchQuery)].slice(0, 5);
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    }
  };

  const toggleListening = () => {
    if (!recognition.current) return;
    
    if (isListening) {
      recognition.current.stop();
      setIsListening(false);
    } else {
      recognition.current.start();
      setIsListening(true);
    }
  };

  const clearSearch = () => {
    setQuery('');
    onSearch('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-4 w-full">
      <h3 className="text-lg font-semibold">Search Classes</h3>
      
      <div className="w-full">
        <div className="flex gap-2 w-full">
          <div className="relative flex-1 w-full">
            <Input
              type="text"
              placeholder="Search by class, teacher, location..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
              className="pr-20 pl-10 w-full"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            {query && (
              <button 
                onClick={clearSearch}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={toggleListening}
            className={isListening ? "bg-red-100 text-red-600" : ""}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <History className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0">
              <div className="p-2">
                <h4 className="text-sm font-medium">Recent Searches</h4>
                {searchHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No search history</p>
                ) : (
                  <div className="mt-2 space-y-1">
                    {searchHistory.map((item, i) => (
                      <button
                        key={i}
                        className="flex w-full items-center rounded-md py-1 px-2 text-sm hover:bg-accent text-left"
                        onClick={() => {
                          setQuery(item);
                          handleSearch(item);
                        }}
                      >
                        <History className="mr-2 h-3 w-3 text-muted-foreground" />
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          
          <Button onClick={() => handleSearch(query)}>Search</Button>
        </div>
        
        {showSuggestions && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
            {suggestions.map((suggestion, index) => (
              <div 
                key={index}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setQuery(suggestion);
                  handleSearch(suggestion);
                  setShowSuggestions(false);
                }}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {isListening && (
        <div className="text-center text-sm text-muted-foreground animate-pulse">
          Listening... Speak now
        </div>
      )}
      
      <div className="text-xs text-muted-foreground">
        Search by class type, teacher name, location, or day of week
      </div>
    </div>
  );
};

export default SearchBar;
