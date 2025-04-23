
export interface CountUpProps {
  start?: number;
  end: number; 
  decimals?: number;
  duration?: number;
  useEasing?: boolean;
  useGrouping?: boolean;
  separator?: string;
  decimal?: string;
  prefix?: string;
  suffix?: string;
  enableScrollSpy?: boolean;
  scrollSpyDelay?: number;
  scrollSpyOnce?: boolean;
  onEnd?: () => void;
  onStart?: () => void;
  onPauseResume?: () => void;
  onReset?: () => void;
  onUpdate?: () => void;
}
