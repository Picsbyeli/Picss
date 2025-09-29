import { useState } from 'react';

interface USState {
  id: string;
  name: string;
  path: string;
}

interface USStatesMapProps {
  selectedState?: string;
  onStateClick: (stateId: string, stateName: string) => void;
  correctStates?: Set<string>;
  incorrectStates?: Set<string>;
  currentTargetState?: string;
}

// Simplified US States map with recognizable shapes and positions
const US_STATES: USState[] = [
  // West Coast
  { id: "CA", name: "California", path: "M 60 180 L 60 320 L 80 340 L 90 350 L 85 380 L 75 385 L 50 370 L 45 350 L 30 340 L 25 320 L 30 300 L 40 280 L 50 250 L 55 220 L 58 200 Z" },
  { id: "OR", name: "Oregon", path: "M 30 120 L 90 120 L 85 160 L 60 180 L 55 150 L 45 140 L 35 130 Z" },
  { id: "WA", name: "Washington", path: "M 25 60 L 90 60 L 95 80 L 90 100 L 30 120 L 25 100 L 20 80 Z" },
  
  // Southwest
  { id: "AZ", name: "Arizona", path: "M 95 280 L 160 280 L 155 340 L 150 380 L 90 350 L 80 340 L 85 320 L 90 300 Z" },
  { id: "NV", name: "Nevada", path: "M 90 160 L 120 160 L 125 200 L 130 240 L 125 280 L 95 280 L 90 240 L 85 200 L 85 160 Z" },
  { id: "UT", name: "Utah", path: "M 125 160 L 160 160 L 160 280 L 125 280 L 125 240 L 130 200 Z" },
  { id: "NM", name: "New Mexico", path: "M 160 280 L 220 280 L 220 380 L 150 380 L 155 340 L 160 320 Z" },
  
  // Mountain States  
  { id: "CO", name: "Colorado", path: "M 160 220 L 220 220 L 220 280 L 160 280 L 160 240 Z" },
  { id: "WY", name: "Wyoming", path: "M 160 160 L 220 160 L 220 220 L 160 220 Z" },
  { id: "MT", name: "Montana", path: "M 160 80 L 280 80 L 280 160 L 220 160 L 160 160 Z" },
  { id: "ID", name: "Idaho", path: "M 125 80 L 160 80 L 160 160 L 125 160 L 120 120 L 115 100 Z" },
  
  // Plains States
  { id: "ND", name: "North Dakota", path: "M 280 80 L 360 80 L 360 140 L 280 140 Z" },
  { id: "SD", name: "South Dakota", path: "M 280 140 L 360 140 L 360 200 L 280 200 Z" },
  { id: "NE", name: "Nebraska", path: "M 220 220 L 360 220 L 360 260 L 280 260 L 220 240 Z" },
  { id: "KS", name: "Kansas", path: "M 220 260 L 360 260 L 360 320 L 280 320 L 220 300 Z" },
  
  // Southwest Plains
  { id: "OK", name: "Oklahoma", path: "M 280 320 L 400 320 L 410 340 L 400 380 L 280 380 L 220 360 L 220 340 Z" },
  { id: "TX", name: "Texas", path: "M 220 380 L 400 380 L 420 420 L 400 480 L 360 500 L 300 480 L 260 460 L 240 440 L 220 420 Z" },
  
  // Midwest
  { id: "MN", name: "Minnesota", path: "M 360 80 L 440 80 L 445 140 L 440 180 L 420 200 L 360 200 L 360 140 Z" },
  { id: "IA", name: "Iowa", path: "M 360 200 L 440 200 L 440 260 L 360 260 L 360 220 Z" },
  { id: "MO", name: "Missouri", path: "M 360 260 L 440 260 L 450 300 L 440 340 L 420 360 L 400 380 L 360 360 L 360 320 Z" },
  { id: "AR", name: "Arkansas", path: "M 400 360 L 480 360 L 480 420 L 440 440 L 400 420 L 400 380 Z" },
  
  // Great Lakes
  { id: "WI", name: "Wisconsin", path: "M 440 140 L 520 140 L 525 180 L 520 220 L 480 240 L 440 220 L 440 180 Z" },
  { id: "IL", name: "Illinois", path: "M 480 200 L 520 200 L 520 280 L 480 300 L 460 280 L 440 260 L 440 240 Z" },
  { id: "MI", name: "Michigan", path: "M 520 120 L 580 120 L 590 140 L 585 180 L 580 220 L 560 240 L 520 220 L 520 180 L 525 160 Z" },
  { id: "IN", name: "Indiana", path: "M 520 220 L 580 220 L 580 300 L 560 320 L 520 300 L 520 280 Z" },
  { id: "OH", name: "Ohio", path: "M 580 200 L 640 200 L 650 240 L 640 280 L 620 320 L 580 300 L 580 260 L 585 240 L 580 220 Z" },
  
  // South
  { id: "LA", name: "Louisiana", path: "M 400 420 L 480 420 L 500 460 L 480 480 L 440 480 L 400 460 Z" },
  { id: "MS", name: "Mississippi", path: "M 480 360 L 540 360 L 540 440 L 520 460 L 480 460 L 480 420 Z" },
  { id: "AL", name: "Alabama", path: "M 540 360 L 600 360 L 600 440 L 580 460 L 540 460 L 540 420 Z" },
  { id: "TN", name: "Tennessee", path: "M 440 320 L 600 320 L 600 360 L 540 360 L 480 360 L 440 340 Z" },
  { id: "KY", name: "Kentucky", path: "M 520 280 L 640 280 L 640 320 L 600 320 L 560 320 L 520 300 Z" },
  { id: "GA", name: "Georgia", path: "M 600 360 L 680 360 L 680 440 L 660 460 L 600 460 L 600 420 Z" },
  { id: "FL", name: "Florida", path: "M 600 440 L 700 440 L 720 480 L 700 520 L 680 540 L 640 520 L 620 500 L 600 480 Z" },
  { id: "SC", name: "South Carolina", path: "M 680 360 L 740 360 L 740 420 L 700 440 L 680 420 Z" },
  { id: "NC", name: "North Carolina", path: "M 640 320 L 740 320 L 760 340 L 740 360 L 680 360 L 640 340 Z" },
  
  // Mid-Atlantic
  { id: "WV", name: "West Virginia", path: "M 640 240 L 700 240 L 720 260 L 700 300 L 680 320 L 640 300 L 640 280 Z" },
  { id: "VA", name: "Virginia", path: "M 680 280 L 760 280 L 780 300 L 760 320 L 740 340 L 680 320 L 680 300 Z" },
  { id: "MD", name: "Maryland", path: "M 700 240 L 780 240 L 780 280 L 760 280 L 720 260 Z" },
  { id: "DE", name: "Delaware", path: "M 780 240 L 800 240 L 800 280 L 780 280 Z" },
  { id: "PA", name: "Pennsylvania", path: "M 640 200 L 780 200 L 780 240 L 700 240 L 650 220 Z" },
  { id: "NJ", name: "New Jersey", path: "M 780 200 L 820 200 L 820 280 L 800 280 L 780 260 L 780 240 Z" },
  { id: "NY", name: "New York", path: "M 640 140 L 780 140 L 800 160 L 780 200 L 720 180 L 680 160 L 640 160 Z" },
  
  // Northeast
  { id: "VT", name: "Vermont", path: "M 780 100 L 820 100 L 820 140 L 780 140 Z" },
  { id: "NH", name: "New Hampshire", path: "M 820 100 L 860 100 L 860 140 L 820 140 Z" },
  { id: "ME", name: "Maine", path: "M 860 60 L 900 60 L 900 140 L 860 140 L 860 100 Z" },
  { id: "MA", name: "Massachusetts", path: "M 780 140 L 860 140 L 860 180 L 780 180 L 780 160 Z" },
  { id: "RI", name: "Rhode Island", path: "M 860 140 L 880 140 L 880 180 L 860 180 Z" },
  { id: "CT", name: "Connecticut", path: "M 780 180 L 860 180 L 860 200 L 780 200 Z" },
  
  // Alaska and Hawaii (positioned separately)
  { id: "AK", name: "Alaska", path: "M 60 450 L 160 450 L 180 480 L 160 520 L 120 540 L 80 520 L 40 500 Z" },
  { id: "HI", name: "Hawaii", path: "M 220 480 L 240 480 L 250 500 L 240 520 L 220 520 L 210 500 Z" }
];

export function USStatesMap({ 
  selectedState, 
  onStateClick, 
  correctStates = new Set(), 
  incorrectStates = new Set(),
  currentTargetState 
}: USStatesMapProps) {
  const [hoveredState, setHoveredState] = useState<string>('');

  const getStateColor = (stateId: string) => {
    if (correctStates.has(stateId)) return '#10B981'; // Green for correct
    if (incorrectStates.has(stateId)) return '#EF4444'; // Red for incorrect  
    if (currentTargetState === stateId) return '#F59E0B'; // Orange for target
    if (hoveredState === stateId) return '#6366F1'; // Blue for hover
    if (selectedState === stateId) return '#8B5CF6'; // Purple for selected
    return '#94A3B8'; // Default gray
  };

  const getStateStrokeColor = (stateId: string) => {
    if (currentTargetState === stateId) return '#D97706'; // Darker orange for target outline
    return '#475569'; // Default dark gray stroke
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
      <svg
        viewBox="0 0 1000 600"
        className="w-full h-auto cursor-pointer"
        style={{ maxHeight: '500px' }}
      >
        {/* Background */}
        <rect width="1000" height="600" fill="#DBEAFE" className="dark:fill-blue-900" />
        
        {/* State paths */}
        {US_STATES.map(state => (
          <path
            key={state.id}
            d={state.path}
            fill={getStateColor(state.id)}
            stroke={getStateStrokeColor(state.id)}
            strokeWidth={currentTargetState === state.id ? "3" : "1.5"}
            className="transition-all duration-200 hover:brightness-110"
            onMouseEnter={() => setHoveredState(state.id)}
            onMouseLeave={() => setHoveredState('')}
            onClick={() => onStateClick(state.id, state.name)}
            data-testid={`state-${state.id}`}
          >
            <title>{state.name}</title>
          </path>
        ))}
        
        {/* State labels */}
        {US_STATES.map(state => {
          // Calculate center of state for label positioning (simplified)
          const bounds = document.querySelector(`[data-testid="state-${state.id}"]`)?.getBoundingClientRect();
          return null; // We'll add labels in a follow-up
        })}
      </svg>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span>Current Target</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Correct ({correctStates.size})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Incorrect ({incorrectStates.size})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-400 rounded"></div>
          <span>Remaining ({US_STATES.length - correctStates.size - incorrectStates.size})</span>
        </div>
      </div>
      
      {/* Current target state info */}
      {currentTargetState && (
        <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg text-center">
          <p className="font-medium text-yellow-800 dark:text-yellow-200">
            Click on: <span className="font-bold">{US_STATES.find(s => s.id === currentTargetState)?.name}</span>
          </p>
        </div>
      )}
    </div>
  );
}