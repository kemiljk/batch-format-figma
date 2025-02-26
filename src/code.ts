import { PluginMessage, Preset, ScaleModeType, SupportedNodeType, UIState } from './types';
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
  presets: [],
  activePreset: null,
};

// Settings key for client storage
const SETTINGS_KEY = 'batch-format-settings';
const PRESETS_KEY = 'batch-format-presets';

// Preview functionality has been removed to improve stability

/**
 * Load settings from client storage
 */
async function loadSettings(): Promise<UIState> {
  try {
    const savedSettings = await figma.clientStorage.getAsync(SETTINGS_KEY);
    const savedPresets = (await figma.clientStorage.getAsync(PRESETS_KEY)) || [];
    return {
      ...DEFAULT_SETTINGS,
      ...savedSettings,
      presets: savedPresets,
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

    // Save presets separately
    if (settings.presets) {
      await figma.clientStorage.setAsync(PRESETS_KEY, settings.presets);
    }

    // Remove presets from main settings to avoid duplication
    const { presets, ...settingsWithoutPresets } = updatedSettings;
    await figma.clientStorage.setAsync(SETTINGS_KEY, settingsWithoutPresets);
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

/**
 * Save a preset
 */
async function savePreset(preset: Preset): Promise<void> {
  try {
    const currentSettings = await loadSettings();
    const currentPresets = currentSettings.presets || [];

    // Add the new preset
    const updatedPresets = [...currentPresets, preset];

    // Update settings with new presets
    await saveSettings({
      ...currentSettings,
      presets: updatedPresets,
      activePreset: preset.id,
    });

    // Notify UI that preset was saved
    figma.ui.postMessage({
      type: 'preset-saved',
      settings: {
        ...currentSettings,
        presets: updatedPresets,
        activePreset: preset.id,
      },
    });
  } catch (error) {
    console.error('Error saving preset:', error);
  }
}

/**
 * Delete a preset
 */
async function deletePreset(presetId: string): Promise<void> {
  try {
    const currentSettings = await loadSettings();
    const currentPresets = currentSettings.presets || [];

    // Filter out the preset to delete
    const updatedPresets = currentPresets.filter((p) => p.id !== presetId);

    // Update active preset if needed
    const updatedActivePreset =
      currentSettings.activePreset === presetId ? null : currentSettings.activePreset;

    // Update settings with new presets
    await saveSettings({
      ...currentSettings,
      presets: updatedPresets,
      activePreset: updatedActivePreset,
    });

    // Notify UI that preset was deleted
    figma.ui.postMessage({
      type: 'preset-deleted',
      settings: {
        ...currentSettings,
        presets: updatedPresets,
        activePreset: updatedActivePreset,
      },
    });
  } catch (error) {
    console.error('Error deleting preset:', error);
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
      const modifiedFills: Paint[] = [];

      if (DEBUG_MODE) {
        console.log(`Node ${node.name} has ${fills.length} fills to process`);
      }

      // Apply modifications to each fill
      for (const fill of fills) {
        // Skip null or undefined fills
        if (!fill) {
          modifiedFills.push(fill);
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
        modifiedFills.push(modifiedFill);
      }

      // Apply the modified fills to the node
      nodeWithFills.fills = modifiedFills;

      // If we should remove the fill layer, do it
      if (shouldRemoveFillLayer) {
        await removeFillLayer();
      }
    } catch (error) {
      console.error(`Error processing fills for node ${node.name}:`, error);
      // Continue with other nodes even if this one fails
    }
  }

  // Apply dimensions if provided
  if ((widthCount > 0 || heightCount > 0) && 'resize' in node) {
    try {
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
}

/**
 * Removes the first fill layer from selected nodes
 */
async function removeFillLayer(): Promise<void> {
  figma.currentPage.selection.forEach((node) => {
    try {
      if ('fills' in node) {
        const nodeWithFills = node as GeometryMixin;

        // Check if fills is valid before proceeding
        if (
          !nodeWithFills.fills ||
          !Array.isArray(nodeWithFills.fills) ||
          nodeWithFills.fills.length <= 1 // Don't remove if there's only one fill
        ) {
          return;
        }

        const fills = clone(nodeWithFills.fills) as Paint[];

        // Only remove the first fill if it's not an image or video
        // This prevents removing important image fills
        const firstFill = fills[0];
        if (firstFill && (firstFill.type === 'IMAGE' || firstFill.type === 'VIDEO')) {
          // Don't remove image or video fills
          if (DEBUG_MODE) {
            console.log(`Not removing first fill from ${node.name} because it's an image or video`);
          }
          return;
        }

        // Remove the first fill (default grey fill)
        fills.splice(0, 1);
        nodeWithFills.fills = fills;

        if (DEBUG_MODE) {
          console.log(`Removed first fill from ${node.name}`);
        }
      }
    } catch (error) {
      console.error(`Error removing fill layer from node ${node.name}:`, error);
    }
  });
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
    // Process each selected node
    for (const node of figma.currentPage.selection) {
      try {
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
      activePreset: msg.activePreset,
    });
  }

  // Save preset
  else if (msg.type === 'save-preset') {
    if (msg.preset) {
      await savePreset(msg.preset);
    }
  }

  // Delete preset
  else if (msg.type === 'delete-preset') {
    if (msg.presetId) {
      await deletePreset(msg.presetId);
    }
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

    // Apply the settings to selected nodes
    const count = await processSelectedNodes(
      msg.selectedScaleMode,
      msg.widthCount,
      msg.heightCount,
      msg.selectedBlendMode,
      msg.removeFillLayer
    );

    if (count > 0) {
      figma.notify(`Applied changes to ${count} node${count !== 1 ? 's' : ''}`);
    } else {
      figma.notify('No valid nodes found in selection');
    }
  }

  // Update dimensions
  else if (msg.type === 'update-dimensions') {
    const count = await applyDimensions(msg.widthCount, msg.heightCount, msg.checkboxOn);

    if (count > 0) {
      figma.notify(`Applied dimensions to ${count} node${count !== 1 ? 's' : ''}`);
    } else {
      figma.notify('No valid nodes found in selection');
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

  // Process each selected node
  for (const node of figma.currentPage.selection) {
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
      // Cast node to a type that has resize method
      const resizeableNode = node as SceneNode & {
        resize: (width: number, height: number) => void;
      };
      resizeableNode.resize(newWidth, newHeight);
      processedCount++;
    }
  }

  return processedCount;
}
