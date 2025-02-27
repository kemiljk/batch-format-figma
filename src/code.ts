import { PluginMessage, ScaleModeType, SupportedNodeType, UIState } from './types';
import { SUPPORTED_NODE_TYPES } from './constants';

// Debug mode flag - set to false to disable verbose logging
const DEBUG_MODE = false;

// Show UI with theme colors
figma.showUI(__html__, { themeColors: true, width: 300, height: 374 });

// Default settings
const DEFAULT_SETTINGS: UIState = {
  widthCount: '',
  heightCount: '',
  checkboxOn: false,
  selectedBlendMode: 'NORMAL',
  removeFillLayer: false,
  selectedScaleMode: 'FILL',
};

// Settings key for client storage
const SETTINGS_KEY = 'batch-format-settings';

// Preview functionality has been removed to improve stability

/**
 * Load settings from client storage
 */
async function loadSettings(): Promise<UIState> {
  try {
    const savedSettings = await figma.clientStorage.getAsync(SETTINGS_KEY);
    return {
      ...DEFAULT_SETTINGS,
      ...savedSettings,
    };
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save settings to client storage
 */
async function saveSettings(settings: Partial<UIState>): Promise<void> {
  try {
    const currentSettings = await loadSettings();
    const updatedSettings = {
      ...currentSettings,
      ...settings,
      // Ensure widthCount and heightCount are strings in storage
      widthCount:
        settings.widthCount !== undefined
          ? String(settings.widthCount)
          : currentSettings.widthCount,
      heightCount:
        settings.heightCount !== undefined
          ? String(settings.heightCount)
          : currentSettings.heightCount,
    };

    await figma.clientStorage.setAsync(SETTINGS_KEY, updatedSettings);
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

/**
 * Helper function to clone an object
 */
function clone<T>(val: T): T {
  try {
    // For Figma objects, use a safer approach
    if (val === null || val === undefined) {
      return val;
    }

    // Special handling for Figma Paint objects
    if (Array.isArray(val)) {
      return val.map((item) => (item ? { ...item } : item)) as unknown as T;
    }

    // For regular objects
    if (typeof val === 'object') {
      return { ...val } as T;
    }

    // Fallback to JSON method for other cases
    return JSON.parse(JSON.stringify(val));
  } catch (error) {
    console.error('Error cloning object:', error);
    // Return the original value if cloning fails
    return val;
  }
}

/**
 * Checks if a node has image fills
 */
function hasImageFills(node: SceneNode): boolean {
  try {
    if ('fills' in node) {
      const fills = node.fills as readonly Paint[] | Paint[];
      if (Array.isArray(fills)) {
        // Only log fills when debugging is enabled
        if (DEBUG_MODE) {
          console.log(
            `Node ${node.name} (${node.type}) has ${fills.length} fills:`,
            fills.map((f) => f.type).join(', ')
          );
        }

        // Check each fill to see if it's an image or video
        for (const fill of fills) {
          // Skip null or undefined fills
          if (!fill) continue;

          // Check for image or video fills
          if (fill.type === 'IMAGE' || fill.type === 'VIDEO') {
            if (DEBUG_MODE) {
              console.log(`Found image/video fill in node ${node.name}`);
            }
            return true;
          }
        }

        // For nodes that might have image fills but not directly identified as IMAGE type
        // This helps with GIF frames and other special cases
        if (node.type === 'RECTANGLE' || node.type === 'FRAME' || node.type === 'INSTANCE') {
          // If the node has any fills at all, consider it valid for our purposes
          // This is more permissive but ensures we don't miss GIF frames
          if (fills.length > 0) {
            if (DEBUG_MODE) {
              console.log(
                `Node ${node.name} is a ${node.type} with fills, treating as valid for image operations`
              );
            }
            return true;
          }
        }
      }
    }
    return false;
  } catch (error) {
    console.error(`Error checking image fills for node ${node.name}:`, error);
    return false;
  }
}

/**
 * Processes a node to apply the requested changes
 */
async function processNode(
  node: SceneNode,
  scaleMode: ScaleModeType | null = null,
  widthCount: number = 0,
  heightCount: number = 0,
  blendMode: BlendMode | null = null,
  shouldRemoveFillLayer: boolean = false
): Promise<void> {
  try {
    // Validate that the node is still valid and accessible
    if (!node || !node.id) {
      if (DEBUG_MODE) {
        console.log(`Node is no longer valid or accessible`);
      }
      return;
    }

    // Check if node is still valid using async method
    try {
      const validNode = await figma.getNodeByIdAsync(node.id);
      if (!validNode) {
        if (DEBUG_MODE) {
          console.log(`Node is no longer valid or accessible`);
        }
        return;
      }
    } catch (error) {
      console.error(`Error checking node validity:`, error);
      return;
    }

    if (DEBUG_MODE) {
      console.log(`Processing node: ${node.name} (${node.type})`);
    }

    // Check if node is a supported type
    if (!SUPPORTED_NODE_TYPES.includes(node.type as SupportedNodeType)) {
      if (DEBUG_MODE) {
        console.log(`Node ${node.name} is not a supported type: ${node.type}`);
      }
      return;
    }

    // Handle fills if the node has them
    if ('fills' in node) {
      try {
        // Cast node to a type with fills
        const nodeWithFills = node as GeometryMixin;

        // Check if fills is valid before proceeding
        if (!nodeWithFills.fills) {
          if (DEBUG_MODE) {
            console.log(`Node ${node.name} has no fills property or it's null`);
          }
          return;
        }

        // Create a copy of the fills to modify
        const fills = clone(nodeWithFills.fills) as Paint[];
        let modifiedFills: Paint[] = [];

        if (DEBUG_MODE) {
          console.log(`Node ${node.name} has ${fills.length} fills to process`);
        }

        // Handle "remove default grey fill layer" option directly here
        if (shouldRemoveFillLayer && fills.length > 1) {
          // Only remove the first fill if it's not an image or video
          const firstFill = fills[0];

          if (firstFill && (firstFill.type === 'IMAGE' || firstFill.type === 'VIDEO')) {
            // Don't remove image or video fills - keep all fills
            modifiedFills = [...fills];

            if (DEBUG_MODE) {
              console.log(
                `Not removing first fill from ${node.name} because it's an image or video`
              );
            }
          } else {
            // Remove the first fill (default grey fill)
            modifiedFills = fills.slice(1);

            if (DEBUG_MODE) {
              console.log(`Removed first fill from ${node.name}`);
            }
          }
        } else {
          // Keep all fills if we're not removing any
          modifiedFills = [...fills];
        }

        // Apply modifications to each fill
        const finalFills: Paint[] = [];
        for (const fill of modifiedFills) {
          // Skip null or undefined fills
          if (!fill) {
            finalFills.push(fill);
            continue;
          }

          let modifiedFill = { ...fill };

          // Apply scale mode if provided and fill is an image or video
          if (scaleMode && (fill.type === 'IMAGE' || fill.type === 'VIDEO')) {
            if (DEBUG_MODE) {
              console.log(`Applying scale mode ${scaleMode} to ${fill.type} fill`);
            }
            try {
              // Create a new ImagePaint object with the updated scaleMode
              modifiedFill = {
                ...fill,
                scaleMode: scaleMode,
              };
            } catch (error) {
              console.error(`Error applying scale mode to ${node.name}:`, error);
              // Keep the original fill if there's an error
              modifiedFill = fill;
            }
          }
          // For GIF frames and other special cases, we need to be more careful
          // Only apply scaleMode to IMAGE or VIDEO fills
          else if (
            scaleMode &&
            (node.type === 'RECTANGLE' || node.type === 'FRAME' || node.type === 'INSTANCE') &&
            (fill.type === 'IMAGE' || fill.type === 'VIDEO')
          ) {
            if (DEBUG_MODE) {
              console.log(
                `Attempting to apply scale mode ${scaleMode} to ${node.type} with ${fill.type} fill`
              );
            }
            try {
              // Only apply scale mode to IMAGE or VIDEO fills
              modifiedFill = {
                ...fill,
                scaleMode: scaleMode,
              };
            } catch (error) {
              console.error(
                `Error applying scale mode to ${node.name} with fill type ${fill.type}:`,
                error
              );
              // Keep the original fill if there's an error
              modifiedFill = fill;
            }
          }

          // Apply blend mode if provided
          if (blendMode) {
            if (DEBUG_MODE) {
              console.log(`Applying blend mode ${blendMode} to fill`);
            }
            try {
              modifiedFill = {
                ...modifiedFill,
                blendMode: blendMode,
              };
            } catch (error) {
              console.error(`Error applying blend mode to ${node.name}:`, error);
              // If blend mode application fails, keep the previous state
            }
          }

          // Add the modified fill to the list
          finalFills.push(modifiedFill);
        }

        // Apply the modified fills to the node - check if node is still valid first
        try {
          const validNode = await figma.getNodeByIdAsync(node.id);
          if (validNode) {
            nodeWithFills.fills = finalFills;
          } else {
            console.error(`Node ${node.name} is no longer valid when applying fills`);
            return;
          }
        } catch (error) {
          console.error(`Error checking node validity when applying fills:`, error);
          return;
        }
      } catch (error) {
        console.error(`Error processing fills for node ${node.name}:`, error);
        // Continue with other nodes even if this one fails
      }
    }

    // Apply dimensions if provided
    if ((widthCount > 0 || heightCount > 0) && 'resize' in node) {
      try {
        // Check if node is still valid
        try {
          const validNode = await figma.getNodeByIdAsync(node.id);
          if (!validNode) {
            console.error(`Node ${node.name} is no longer valid when applying dimensions`);
            return;
          }
        } catch (error) {
          console.error(`Error checking node validity when applying dimensions:`, error);
          return;
        }

        // Get current dimensions
        const currentWidth = node.width;
        const currentHeight = node.height;

        // Calculate new dimensions
        const newWidth = widthCount > 0 ? widthCount : currentWidth;
        const newHeight = heightCount > 0 ? heightCount : currentHeight;

        // Apply new dimensions
        if (newWidth !== currentWidth || newHeight !== currentHeight) {
          // Cast node to a type that has resize method
          const resizeableNode = node as SceneNode & {
            resize: (width: number, height: number) => void;
          };
          resizeableNode.resize(newWidth, newHeight);
        }
      } catch (error) {
        console.error(`Error resizing node ${node.name}:`, error);
      }
    }
  } catch (error) {
    console.error(`Unexpected error processing node:`, error);
  }
}

/**
 * Processes all selected nodes
 */
async function processSelectedNodes(
  scaleMode: ScaleModeType | null = null,
  widthCount: number = 0,
  heightCount: number = 0,
  blendMode: BlendMode | null = null,
  shouldRemoveFillLayer: boolean = false
): Promise<number> {
  let processedCount = 0;

  try {
    // Get a snapshot of the current selection to avoid issues if selection changes during processing
    const selectedNodes = [...figma.currentPage.selection];
    // Store node IDs for reliable reselection
    const selectedNodeIds = selectedNodes.map((node) => node.id);

    if (selectedNodes.length === 0) {
      return 0;
    }

    // Process each selected node without modifying the selection
    for (const node of selectedNodes) {
      try {
        // Verify node is still valid before processing
        if (!node || !node.id) {
          console.warn(`Skipping node that is no longer valid`);
          continue;
        }

        try {
          const validNode = await figma.getNodeByIdAsync(node.id);
          if (!validNode) {
            console.warn(`Skipping node that is no longer valid`);
            continue;
          }
        } catch (error) {
          console.error(`Error checking node validity:`, error);
          continue;
        }

        if (hasImageFills(node)) {
          await processNode(
            node,
            scaleMode,
            widthCount,
            heightCount,
            blendMode,
            shouldRemoveFillLayer
          );
          processedCount++;
        }
      } catch (error) {
        console.error(`Error processing node ${node.name}:`, error);
        // Continue with other nodes even if this one fails
      }
    }

    // Return the processed count and node IDs for reselection
    return processedCount;
  } catch (error) {
    console.error('Error processing selected nodes:', error);
  }

  return processedCount;
}

/**
 * Check if there's a current selection with at least one node that has image fills
 */
function checkSelection(): boolean {
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    return false;
  }

  // Only log selection details when debugging is enabled
  if (DEBUG_MODE) {
    // Log each selected node for debugging
    selection.forEach((node, index) => {
      console.log(`Selected node ${index + 1}: ${node.name} (${node.type})`);
      if ('fills' in node) {
        const fills = node.fills as readonly Paint[] | Paint[];
        console.log(`  Has fills property with ${Array.isArray(fills) ? fills.length : 0} fills`);
      } else {
        console.log(`  No fills property`);
      }
    });
  }

  // Check if at least one selected node has image fills
  const hasValidSelection = selection.some(
    (node) => SUPPORTED_NODE_TYPES.includes(node.type as SupportedNodeType) && hasImageFills(node)
  );

  // If no valid selection but there are selected nodes with fills property,
  // we'll consider it valid for the purpose of UI interaction
  const hasFillsProperty = selection.some(
    (node) => 'fills' in node && Array.isArray(node.fills) && node.fills.length > 0
  );

  // Only log when debugging is enabled
  if (DEBUG_MODE) {
    console.log(
      `Selection check: ${selection.length} nodes selected, valid: ${hasValidSelection}, has fills property: ${hasFillsProperty}`
    );
  }

  // Return true if there's a valid selection or if there are nodes with fills property
  return hasValidSelection || hasFillsProperty;
}

// Set up selection change listener - only set up once at the plugin initialization
// Remove this listener as it's duplicated by the 'watch-selection' message handler
// figma.on('selectionchange', () => {
//   // Check if there's a valid selection and notify the UI
//   const hasSelection = checkSelection();
//   figma.ui.postMessage({ type: 'selection-checked', hasSelection });
// });

// Handler for selection changes
function selectionChangeHandler() {
  const hasSelection = checkSelection();
  figma.ui.postMessage({ type: 'selection-checked', hasSelection });
}

// Add basic error handling for the plugin
try {
  // We can't use window event listeners or figma.on('error') in this context
  // Instead, we'll rely on try-catch blocks around critical operations
  console.log('Plugin initialized with error handling');
} catch (error) {
  console.error('Error in plugin initialization:', error);
}

// Initialize the plugin with error handling
try {
  // Initialize by loading settings
  loadSettings()
    .then(() => {
      // Ready to receive messages
      figma.ui.postMessage({ type: 'plugin-ready' });
    })
    .catch((error) => {
      console.error('Error during plugin initialization:', error);
      figma.notify('Failed to initialize plugin settings. Please try reloading.', { error: true });
    });
} catch (error) {
  console.error('Critical error during plugin startup:', error);
  figma.notify('Failed to start plugin. Please try reloading Figma.', { error: true });
}

// Handle messages from the UI
figma.ui.onmessage = async (msg: PluginMessage) => {
  // Only log messages when debugging is enabled
  if (DEBUG_MODE) {
    console.log('Received message from UI:', msg);
  }

  // Load settings
  if (msg.type === 'load-settings') {
    const settings = await loadSettings();
    figma.ui.postMessage({ type: 'settings-loaded', settings });
  }

  // Save settings
  else if (msg.type === 'save-settings') {
    await saveSettings({
      widthCount: msg.widthCount !== undefined ? String(msg.widthCount) : undefined,
      heightCount: msg.heightCount !== undefined ? String(msg.heightCount) : undefined,
      checkboxOn: msg.checkboxOn,
      selectedBlendMode: msg.selectedBlendMode,
      removeFillLayer: msg.removeFillLayer,
      selectedScaleMode: msg.selectedScaleMode,
    });
  }

  // Apply settings to selection
  else if (msg.type === 'apply-settings') {
    console.log('Applying settings to selection:', {
      scaleMode: msg.selectedScaleMode,
      widthCount: msg.widthCount,
      heightCount: msg.heightCount,
      blendMode: msg.selectedBlendMode,
      removeFillLayer: msg.removeFillLayer,
    });

    try {
      // Store the current selection as node IDs (more reliable than node references)
      const selectedNodeIds = figma.currentPage.selection.map((node) => node.id);

      // Apply the settings to selected nodes - process in place without clearing selection
      const count = await processSelectedNodes(
        msg.selectedScaleMode,
        msg.widthCount,
        msg.heightCount,
        msg.selectedBlendMode,
        msg.removeFillLayer
      );

      if (count > 0) {
        // More reliable approach to ensure UI is updated without clearing selection
        // Just trigger a selection change notification to update UI
        const selectionCheckResult = checkSelection();
        figma.ui.postMessage({ type: 'selection-checked', hasSelection: selectionCheckResult });

        figma.notify(`Applied changes to ${count} node${count !== 1 ? 's' : ''}`);
      } else {
        figma.notify('No valid nodes found in selection');
      }
    } catch (error) {
      console.error('Error applying settings:', error);
      figma.notify('An error occurred while applying settings', { error: true });
    }
  }

  // Update dimensions
  else if (msg.type === 'update-dimensions') {
    try {
      // Apply dimensions without clearing the selection
      const count = await applyDimensions(msg.widthCount, msg.heightCount, msg.checkboxOn);

      if (count > 0) {
        // Just notify UI of selection state after processing
        const selectionCheckResult = checkSelection();
        figma.ui.postMessage({ type: 'selection-checked', hasSelection: selectionCheckResult });

        figma.notify(`Applied dimensions to ${count} node${count !== 1 ? 's' : ''}`);
      } else {
        figma.notify('No valid nodes found in selection');
      }
    } catch (error) {
      console.error('Error updating dimensions:', error);
      figma.notify('An error occurred while updating dimensions', { error: true });
    }
  }

  // Notify no selection
  else if (msg.type === 'notify-no-selection') {
    figma.notify(
      'Please select at least one object with an image fill (Rectangle, Frame, etc. with an image imported as a fill)'
    );
  }

  // Check if there's a selection
  else if (msg.type === 'check-selection') {
    const hasSelection = checkSelection();
    figma.ui.postMessage({ type: 'selection-checked', hasSelection });
  }

  // Watch for selection changes
  else if (msg.type === 'watch-selection') {
    // Remove any existing listeners to prevent duplicates
    figma.off('selectionchange', selectionChangeHandler);

    // Set up the selection change listener
    figma.on('selectionchange', selectionChangeHandler);
  }
};

/**
 * Apply dimensions to selected nodes
 */
async function applyDimensions(
  widthCount: number = 0,
  heightCount: number = 0,
  maintainAspectRatio: boolean = false
): Promise<number> {
  let processedCount = 0;

  try {
    // Get a snapshot of the current selection to avoid issues if selection changes during processing
    const selectedNodes = [...figma.currentPage.selection];

    if (selectedNodes.length === 0) {
      return 0;
    }

    // Process each selected node without clearing selection
    for (const node of selectedNodes) {
      try {
        // Verify node is still valid before processing
        if (!node || !node.id) {
          console.warn(`Skipping node that is no longer valid`);
          continue;
        }

        try {
          const validNode = await figma.getNodeByIdAsync(node.id);
          if (!validNode) {
            console.warn(`Skipping node that is no longer valid`);
            continue;
          }
        } catch (error) {
          console.error(`Error checking node validity:`, error);
          continue;
        }

        if (!SUPPORTED_NODE_TYPES.includes(node.type as SupportedNodeType)) {
          continue;
        }

        // Skip nodes without width or height
        if (!('width' in node) || !('height' in node)) {
          continue;
        }

        // Get current dimensions
        const currentWidth = node.width;
        const currentHeight = node.height;

        // Calculate new dimensions
        let newWidth = widthCount > 0 ? widthCount : currentWidth;
        let newHeight = heightCount > 0 ? heightCount : currentHeight;

        // Maintain aspect ratio if requested
        if (maintainAspectRatio) {
          const aspectRatio = currentWidth / currentHeight;

          if (widthCount > 0 && heightCount === 0) {
            // Width provided, calculate height
            newHeight = newWidth / aspectRatio;
          } else if (heightCount > 0 && widthCount === 0) {
            // Height provided, calculate width
            newWidth = newHeight * aspectRatio;
          } else if (widthCount > 0 && heightCount > 0) {
            // Both provided, use width as reference
            newHeight = newWidth / aspectRatio;
          }
        }

        // Apply new dimensions
        if (newWidth !== currentWidth || newHeight !== currentHeight) {
          // Check if node is still valid before resizing
          try {
            const validNode = await figma.getNodeByIdAsync(node.id);
            if (!validNode) {
              console.warn(`Node is no longer valid when applying dimensions`);
              continue;
            }

            // Cast node to a type that has resize method
            const resizeableNode = node as SceneNode & {
              resize: (width: number, height: number) => void;
            };
            resizeableNode.resize(newWidth, newHeight);
            processedCount++;
          } catch (error) {
            console.error(`Error checking node validity when resizing:`, error);
            continue;
          }
        }
      } catch (error) {
        console.error(`Error applying dimensions to node:`, error);
        // Continue with other nodes even if this one fails
      }
    }

    // Notify UI of selection state after processing
    const selectionCheckResult = checkSelection();
    figma.ui.postMessage({ type: 'selection-checked', hasSelection: selectionCheckResult });
  } catch (error) {
    console.error('Error applying dimensions to nodes:', error);
  }

  return processedCount;
}
