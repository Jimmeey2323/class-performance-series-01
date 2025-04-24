
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogFooter, 
  DialogTitle, 
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AppearanceSettings {
  fontFamily: string;
  fontSize: number;
  colorScheme: 'default' | 'blue' | 'green' | 'purple' | 'orange' | 'custom';
  customPrimaryColor: string;
  customSecondaryColor: string;
  chartColors: string[];
  borderRadius: number;
  tableStyle: 'default' | 'compact' | 'relaxed' | 'modern';
  cardStyle: 'default' | 'flat' | 'gradient' | 'subtle' | 'outlined';
  animationsLevel: 'minimal' | 'standard' | 'advanced';
}

const DEFAULT_SETTINGS: AppearanceSettings = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 14,
  colorScheme: 'default',
  customPrimaryColor: '#8b5cf6',
  customSecondaryColor: '#10b981',
  chartColors: ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'],
  borderRadius: 8,
  tableStyle: 'default',
  cardStyle: 'default',
  animationsLevel: 'standard'
};

const CustomizeAppearanceDialog: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useLocalStorage<AppearanceSettings>('appearance-settings', DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState('general');
  const [tempSettings, setTempSettings] = useState<AppearanceSettings>(settings);

  const applySettings = () => {
    setSettings(tempSettings);
    applyStyleChanges(tempSettings);
    setIsOpen(false);
  };

  const resetSettings = () => {
    setTempSettings(DEFAULT_SETTINGS);
  };

  const applyStyleChanges = (settings: AppearanceSettings) => {
    const root = document.documentElement;
    
    // Apply font family
    root.style.setProperty('--font-family', settings.fontFamily);
    
    // Apply font size
    root.style.setProperty('--font-size-base', `${settings.fontSize}px`);
    
    // Apply border radius
    root.style.setProperty('--radius', `${settings.borderRadius}px`);
    
    // Apply color scheme
    let primaryColor = '#8b5cf6'; // Default purple
    let secondaryColor = '#10b981'; // Default green
    
    switch (settings.colorScheme) {
      case 'blue':
        primaryColor = '#3b82f6';
        secondaryColor = '#0ea5e9';
        break;
      case 'green':
        primaryColor = '#10b981';
        secondaryColor = '#84cc16';
        break;
      case 'purple':
        primaryColor = '#8b5cf6';
        secondaryColor = '#d946ef';
        break;
      case 'orange':
        primaryColor = '#f97316';
        secondaryColor = '#f59e0b';
        break;
      case 'custom':
        primaryColor = settings.customPrimaryColor;
        secondaryColor = settings.customSecondaryColor;
        break;
    }
    
    // Apply colors
    root.style.setProperty('--primary', primaryColor);
    root.style.setProperty('--primary-foreground', '#ffffff');
    
    // Apply table style
    let tableClass = '';
    switch (settings.tableStyle) {
      case 'compact':
        tableClass = 'table-compact';
        break;
      case 'relaxed':
        tableClass = 'table-relaxed';
        break;
      case 'modern':
        tableClass = 'table-modern';
        break;
      default:
        tableClass = '';
    }
    
    // Apply card style
    let cardClass = '';
    switch (settings.cardStyle) {
      case 'flat':
        cardClass = 'card-flat';
        break;
      case 'gradient':
        cardClass = 'card-gradient';
        break;
      case 'subtle':
        cardClass = 'card-subtle';
        break;
      case 'outlined':
        cardClass = 'card-outlined';
        break;
      default:
        cardClass = '';
    }
    
    // Add classes to body
    document.body.className = [tableClass, cardClass].filter(Boolean).join(' ');
    
    // Add animations level
    document.body.setAttribute('data-animations', settings.animationsLevel);
    
    // Generate and inject custom CSS
    const customCSS = `
      :root {
        --chart-color-1: ${settings.chartColors[0]};
        --chart-color-2: ${settings.chartColors[1]};
        --chart-color-3: ${settings.chartColors[2]};
        --chart-color-4: ${settings.chartColors[3]};
        --chart-color-5: ${settings.chartColors[4]};
      }
      
      .table-compact th, .table-compact td {
        padding: 0.5rem !important;
        font-size: 0.875rem;
      }
      
      .table-relaxed th, .table-relaxed td {
        padding: 1rem !important;
      }
      
      .table-modern th {
        background-color: ${primaryColor}10;
        border-bottom: 2px solid ${primaryColor}30;
        font-weight: 600;
      }
      
      .table-modern tr:hover {
        background-color: ${primaryColor}05;
      }
      
      .card-flat {
        box-shadow: none !important;
      }
      
      .card-gradient .gradient-card {
        background-image: linear-gradient(to right bottom, ${primaryColor}10, ${secondaryColor}10);
      }
      
      .card-subtle {
        background-color: #f9fafb !important;
        border: none !important;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05) !important;
      }
      
      .card-outlined {
        background-color: transparent !important;
        border: 1px solid ${primaryColor}30 !important;
        box-shadow: none !important;
      }
      
      [data-animations="minimal"] * {
        transition-duration: 0s !important;
        animation-duration: 0s !important;
      }
      
      [data-animations="advanced"] .animate-card {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      
      [data-animations="advanced"] .animate-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      }
    `;
    
    // Remove existing style if present
    const existingStyle = document.getElementById('custom-appearance-css');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Add new style
    const styleElement = document.createElement('style');
    styleElement.id = 'custom-appearance-css';
    styleElement.innerHTML = customCSS;
    document.head.appendChild(styleElement);
  };

  // Apply settings on load
  React.useEffect(() => {
    applyStyleChanges(settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" onClick={() => setTempSettings({...settings})}>
            <Settings className="mr-2 h-4 w-4" />
            Customize Appearance
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Customize Application Appearance</DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="components">Components</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="fontFamily">Font Family</Label>
                <Select 
                  value={tempSettings.fontFamily}
                  onValueChange={(value) => setTempSettings({...tempSettings, fontFamily: value})}
                >
                  <SelectTrigger id="fontFamily">
                    <SelectValue placeholder="Select font family" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter, sans-serif">Inter (Default)</SelectItem>
                    <SelectItem value="'Roboto', sans-serif">Roboto</SelectItem>
                    <SelectItem value="'Open Sans', sans-serif">Open Sans</SelectItem>
                    <SelectItem value="'Poppins', sans-serif">Poppins</SelectItem>
                    <SelectItem value="'Montserrat', sans-serif">Montserrat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="fontSize">Font Size: {tempSettings.fontSize}px</Label>
                </div>
                <Slider
                  id="fontSize"
                  min={12}
                  max={18}
                  step={1}
                  value={[tempSettings.fontSize]}
                  onValueChange={(value) => setTempSettings({...tempSettings, fontSize: value[0]})}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="borderRadius">Border Radius: {tempSettings.borderRadius}px</Label>
                </div>
                <Slider
                  id="borderRadius"
                  min={0}
                  max={16}
                  step={1}
                  value={[tempSettings.borderRadius]}
                  onValueChange={(value) => setTempSettings({...tempSettings, borderRadius: value[0]})}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Animation Level</Label>
                <RadioGroup 
                  value={tempSettings.animationsLevel}
                  onValueChange={(value) => setTempSettings({
                    ...tempSettings, 
                    animationsLevel: value as 'minimal' | 'standard' | 'advanced'
                  })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="minimal" id="animations-minimal" />
                    <Label htmlFor="animations-minimal">Minimal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="standard" id="animations-standard" />
                    <Label htmlFor="animations-standard">Standard</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="advanced" id="animations-advanced" />
                    <Label htmlFor="animations-advanced">Advanced</Label>
                  </div>
                </RadioGroup>
              </div>
            </TabsContent>
            
            <TabsContent value="colors" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Color Scheme</Label>
                <RadioGroup 
                  value={tempSettings.colorScheme}
                  onValueChange={(value) => setTempSettings({
                    ...tempSettings, 
                    colorScheme: value as 'default' | 'blue' | 'green' | 'purple' | 'orange' | 'custom'
                  })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="default" id="color-default" />
                    <Label htmlFor="color-default" className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-purple-500 mr-2"></div>
                      Default (Purple)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="blue" id="color-blue" />
                    <Label htmlFor="color-blue" className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
                      Blue
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="green" id="color-green" />
                    <Label htmlFor="color-green" className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                      Green
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="purple" id="color-purple" />
                    <Label htmlFor="color-purple" className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-purple-600 mr-2"></div>
                      Vibrant Purple
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="orange" id="color-orange" />
                    <Label htmlFor="color-orange" className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-orange-500 mr-2"></div>
                      Orange
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="color-custom" />
                    <Label htmlFor="color-custom">Custom Colors</Label>
                  </div>
                </RadioGroup>
              </div>
              
              {tempSettings.colorScheme === 'custom' && (
                <div className="space-y-4 border rounded-md p-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex gap-2">
                      <div 
                        className="w-10 h-10 rounded border" 
                        style={{ backgroundColor: tempSettings.customPrimaryColor }}
                      ></div>
                      <Input
                        id="primaryColor"
                        type="text"
                        value={tempSettings.customPrimaryColor}
                        onChange={(e) => setTempSettings({...tempSettings, customPrimaryColor: e.target.value})}
                        placeholder="#8b5cf6"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex gap-2">
                      <div 
                        className="w-10 h-10 rounded border" 
                        style={{ backgroundColor: tempSettings.customSecondaryColor }}
                      ></div>
                      <Input
                        id="secondaryColor"
                        type="text"
                        value={tempSettings.customSecondaryColor}
                        onChange={(e) => setTempSettings({...tempSettings, customSecondaryColor: e.target.value})}
                        placeholder="#10b981"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Chart Colors</Label>
                <div className="grid grid-cols-5 gap-2">
                  {tempSettings.chartColors.map((color, index) => (
                    <div key={index} className="space-y-1">
                      <div 
                        className="w-full h-10 rounded border" 
                        style={{ backgroundColor: color }}
                      ></div>
                      <Input
                        type="text"
                        value={color}
                        onChange={(e) => {
                          const newColors = [...tempSettings.chartColors];
                          newColors[index] = e.target.value;
                          setTempSettings({...tempSettings, chartColors: newColors});
                        }}
                        placeholder={`Color ${index + 1}`}
                        className="text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="components" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Table Style</Label>
                <RadioGroup 
                  value={tempSettings.tableStyle}
                  onValueChange={(value) => setTempSettings({
                    ...tempSettings, 
                    tableStyle: value as 'default' | 'compact' | 'relaxed' | 'modern'
                  })}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="default" id="table-default" />
                      <Label htmlFor="table-default">Default</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="compact" id="table-compact" />
                      <Label htmlFor="table-compact">Compact</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="relaxed" id="table-relaxed" />
                      <Label htmlFor="table-relaxed">Relaxed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="modern" id="table-modern" />
                      <Label htmlFor="table-modern">Modern</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label>Card Style</Label>
                <RadioGroup 
                  value={tempSettings.cardStyle}
                  onValueChange={(value) => setTempSettings({
                    ...tempSettings, 
                    cardStyle: value as 'default' | 'flat' | 'gradient' | 'subtle' | 'outlined'
                  })}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="default" id="card-default" />
                      <Label htmlFor="card-default">Default</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="flat" id="card-flat" />
                      <Label htmlFor="card-flat">Flat (No Shadow)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="gradient" id="card-gradient" />
                      <Label htmlFor="card-gradient">Gradient Background</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="subtle" id="card-subtle" />
                      <Label htmlFor="card-subtle">Subtle</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="outlined" id="card-outlined" />
                      <Label htmlFor="card-outlined">Outlined</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="flex justify-between items-center gap-2">
            <Button variant="outline" onClick={resetSettings}>
              Reset to Defaults
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={applySettings}>
                Apply Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CustomizeAppearanceDialog;
