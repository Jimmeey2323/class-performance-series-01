import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ProcessedData, FilterOption, SortOption } from '@/types/data';

interface FilterContextType {
  filters: FilterOption[];
  sortOptions: SortOption[];
  setFilters: (filters: FilterOption[]) => void;
  setSortOptions: (sortOptions: SortOption[]) => void;
  filteredData: ProcessedData[];
  applyFilterToData: (data: ProcessedData[]) => ProcessedData[];
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

interface FilterProviderProps {
  children: ReactNode;
  initialData: ProcessedData[];
}

export const FilterProvider: React.FC<FilterProviderProps> = ({ children, initialData }) => {
  const [filters, setFilters] = useState<FilterOption[]>([]);
  const [sortOptions, setSortOptions] = useState<SortOption[]>([]);
  const [filteredData, setFilteredData] = useState<ProcessedData[]>(initialData);

  // Apply filters to data whenever filters or initial data change
  useEffect(() => {
    setFilteredData(applyFilterToData(initialData));
  }, [filters, sortOptions, initialData]);

  const applyFilterToData = (data: ProcessedData[]): ProcessedData[] => {
    // First apply all filters
    let result = data.filter(item => {
      return filters.every(filter => {
        const value = item[filter.field];
        const filterValue = filter.value;
        
        // Handle special case for date filter
        if (filter.field === 'date' && filter.operator === 'between') {
          try {
            const dateRange = JSON.parse(filterValue);
            const itemDate = item.date ? new Date(item.date) : null;
            
            if (!itemDate) return false;
            
            const fromDate = dateRange.from ? new Date(dateRange.from) : null;
            const toDate = dateRange.to ? new Date(dateRange.to) : null;
            
            if (fromDate && toDate) {
              return itemDate >= fromDate && itemDate <= toDate;
            } else if (fromDate) {
              return itemDate >= fromDate;
            } else if (toDate) {
              return itemDate <= toDate;
            }
            return true;
          } catch (e) {
            console.error('Error parsing date filter:', e);
            return true;
          }
        }
        
        // Handle 'in' operator for multi-select filters
        if (filter.operator === 'in') {
          const values = filterValue.split(',');
          return values.some(val => String(value).includes(val));
        }
        
        // Other operators
        switch (filter.operator) {
          case 'contains':
            return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
          case 'equals':
            return String(value) === String(filterValue);
          case 'starts':
            return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());
          case 'ends':
            return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase());
          case 'greater':
            return Number(value) > Number(filterValue);
          case 'less':
            return Number(value) < Number(filterValue);
          default:
            return true;
        }
      });
    });

    // Then apply sorting if any
    if (sortOptions.length > 0) {
      result = [...result].sort((a, b) => {
        // Apply each sort option in order
        for (const sort of sortOptions) {
          const valueA = a[sort.field];
          const valueB = b[sort.field];
          
          // Determine if the values are numeric
          const isNumeric = !isNaN(Number(valueA)) && !isNaN(Number(valueB));
          
          let comparison = 0;
          if (isNumeric) {
            comparison = Number(valueA) - Number(valueB);
          } else {
            comparison = String(valueA).localeCompare(String(valueB));
          }
          
          if (comparison !== 0) {
            return sort.direction === 'asc' ? comparison : -comparison;
          }
        }
        return 0;
      });
    }
    
    return result;
  };

  return (
    <FilterContext.Provider 
      value={{ 
        filters, 
        sortOptions, 
        setFilters, 
        setSortOptions, 
        filteredData,
        applyFilterToData
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = (): FilterContextType => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
};
