
import React, { useState } from 'react';
import { ProcessedData } from '@/types/data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatIndianCurrency } from '@/components/MetricsPanel';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ChevronDown,
  ChevronRight,
  IndianRupee,
  BarChart
} from 'lucide-react';
import { motion } from 'framer-motion';

interface GridViewProps {
  data: ProcessedData[];
  trainerAvatars: Record<string, string>;
}

const GridView: React.FC<GridViewProps> = ({ data, trainerAvatars }) => {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleCardExpand = (cardId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <div className="p-4">
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {data.map((item, index) => (
          <motion.div key={index} variants={cardVariants}>
            <Card className={`overflow-hidden hover:shadow-lg transition-shadow ${expandedCards[item.uniqueID] ? 'ring-2 ring-primary/20' : ''}`}>
              <CardContent className="p-0">
                <div className="p-4 border-b bg-slate-50 dark:bg-slate-900/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-primary/20">
                      {trainerAvatars[item.teacherName] ? (
                        <AvatarImage src={trainerAvatars[item.teacherName]} alt={item.teacherName} />
                      ) : (
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {item.teacherName
                            .split(' ')
                            .map(part => part.charAt(0))
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <h3 className="font-semibold line-clamp-1">{item.cleanedClass}</h3>
                      <p className="text-xs text-muted-foreground">with {item.teacherName}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => toggleCardExpand(item.uniqueID)}
                    className="h-8 w-8"
                  >
                    {expandedCards[item.uniqueID] ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <div className="p-4">
                  <div className="flex flex-wrap gap-3 mb-3">
                    <Badge variant="outline" className="flex items-center gap-1.5 bg-primary/5">
                      <Calendar className="h-3 w-3" />
                      {item.dayOfWeek}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1.5 bg-primary/5">
                      <Clock className="h-3 w-3" />
                      {item.classTime}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1.5 bg-primary/5">
                      <MapPin className="h-3 w-3" />
                      {item.location}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" /> Check-ins
                      </p>
                      <p className="font-medium">{item.totalCheckins}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Classes
                      </p>
                      <p className="font-medium">{item.totalOccurrences}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <IndianRupee className="h-3 w-3" /> Revenue
                      </p>
                      <p className="font-medium">{formatIndianCurrency(Number(item.totalRevenue))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <BarChart className="h-3 w-3" /> Avg. Attendance
                      </p>
                      <p className="font-medium">
                        {typeof item.classAverageIncludingEmpty === 'number'
                          ? item.classAverageIncludingEmpty.toFixed(1)
                          : item.classAverageIncludingEmpty}
                      </p>
                    </div>
                  </div>
                  
                  {expandedCards[item.uniqueID] && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Empty Classes</p>
                          <p className="font-medium">{item.totalEmpty}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Non-Empty Classes</p>
                          <p className="font-medium">{item.totalNonEmpty}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Cancellations</p>
                          <p className="font-medium">{item.totalCancelled}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Non-Paid</p>
                          <p className="font-medium">{item.totalNonPaid}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground">Avg. (Non-Empty)</p>
                          <p className="font-medium">
                            {typeof item.classAverageExcludingEmpty === 'number'
                              ? item.classAverageExcludingEmpty.toFixed(1)
                              : item.classAverageExcludingEmpty}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default GridView;
