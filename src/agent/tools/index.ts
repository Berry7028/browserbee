import type { TabBridge } from "../../bridge";

// Import all tools from their respective modules
import { 
  browserClick, 
  browserType, 
  browserHandleDialog 
} from "./interactionTools";
import { 
  browserPressKey, 
  browserKeyboardType 
} from "./keyboardTools";
import { 
  saveMemory, 
  lookupMemories, 
  getAllMemories, 
  deleteMemory, 
  clearAllMemories 
} from "./memoryTools";

import { 
  browserMoveMouse, 
  browserClickXY, 
  browserDrag 
} from "./mouseTools";
import { 
  browserNavigate, 
  browserWaitForNavigation, 
  browserNavigateBack, 
  browserNavigateForward 
} from "./navigationTools";

import { 
  browserGetTitle, 
  browserSnapshotDom, 
  browserQuery, 
  browserAccessibleTree, 
  browserReadText, 
  browserScreenshot 
} from "./observationTools";
import { browserGetActiveTab, browserNavigateTab, browserScreenshotTab } from "./tabContextTools";
import { 
  browserTabList, 
  browserTabNew, 
  browserTabSelect, 
  browserTabClose 
} from "./tabTools";
import { ToolFactory } from "./types";

// Export all tools
export {
  // Navigation tools
  browserNavigate,
  browserWaitForNavigation,
  browserNavigateBack,
  browserNavigateForward,
  
  // Tab context tools
  browserGetActiveTab,
  browserNavigateTab,
  browserScreenshotTab,
  
  // Interaction tools
  browserClick,
  browserType,
  browserHandleDialog,
  
  // Observation tools
  browserGetTitle,
  browserSnapshotDom,
  browserQuery,
  browserAccessibleTree,
  browserReadText,
  browserScreenshot,
  
  // Mouse tools
  browserMoveMouse,
  browserClickXY,
  browserDrag,
  
  // Keyboard tools
  browserPressKey,
  browserKeyboardType,
  
  // Tab tools
  browserTabList,
  browserTabNew,
  browserTabSelect,
  browserTabClose,
  
  // Memory tools
  saveMemory,
  lookupMemories,
  getAllMemories,
  deleteMemory,
  clearAllMemories
};

// Function to get all tools as an array
export function getAllTools(bridge: TabBridge) {
  const tools = [
    // Navigation tools
    browserNavigate(bridge),
    browserWaitForNavigation(bridge),
    browserNavigateBack(bridge),
    browserNavigateForward(bridge),
    
    // Tab context tools
    browserGetActiveTab(bridge),
    browserNavigateTab(bridge),
    browserScreenshotTab(bridge),
    
    // Interaction tools
    browserClick(bridge),
    browserType(bridge),
    browserHandleDialog(bridge),
    
    // Observation tools
    browserGetTitle(bridge),
    browserSnapshotDom(bridge),
    browserQuery(bridge),
    browserAccessibleTree(bridge),
    browserReadText(bridge),
    browserScreenshot(bridge),
    
    // Mouse tools
    browserMoveMouse(bridge),
    browserClickXY(bridge),
    browserDrag(bridge),
    
    // Keyboard tools
    browserPressKey(bridge),
    browserKeyboardType(bridge),
    
    // Tab tools
    browserTabList(bridge),
    browserTabNew(bridge),
    browserTabSelect(bridge),
    browserTabClose(bridge),
    
    // Memory tools
    saveMemory(bridge),
    lookupMemories(bridge),
    getAllMemories(bridge),
    deleteMemory(bridge),
    clearAllMemories(bridge)
  ];
  
  return tools;
}
