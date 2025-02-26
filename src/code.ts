import { PluginMessage, ScaleModeType, SupportedNodeType, UIState } from './types';
import { SUPPORTED_NODE_TYPES } from './constants';

// Show UI with theme colors
figma.showUI(__html__, { themeColors: true, width: 300, height: 380 });

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

// Store original fills for preview functionality
let originalFills: Map<string, Paint[]> = new Map();

/**
 * Load settings from client storage
 */
async function loadSettings(): Promise<UIState> {
  try {
    const savedSettings = await figma.clientStorage.getAsync(SETTINGS_KEY);
    return { ...DEFAULT_SETTINGS, ...savedSettings };
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
  return JSON.parse(JSON.stringify(val));
}

/**
 * Checks if a node has image fills
 */
function hasImageFills(node: SceneNode): boolean {
  if ('fills' in node) {
    const fills = node.fills as readonly Paint[] | Paint[];
    if (Array.isArray(fills)) {
      // Log the fills for debugging
      console.log(
        `Node ${node.name} (${node.type}) has ${fills.length} fills:`,
        fills.map((f) => f.type).join(', ')
      );

      // Check each fill to see if it's an image or video
      for (const fill of fills) {
        if (fill.type === 'IMAGE' || fill.type === 'VIDEO') {
          console.log(`Found image/video fill in node ${node.name}`);
          return true;
        }

        // For vector nodes, check if there's a visible fill that might be an image
        if (fill.visible !== false && fill.opacity !== 0) {
          console.log(`Found visible fill in node ${node.name}, treating as valid`);
          return true;
        }
      }
    }
  }
  return false;
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
  console.log(`Processing node: ${node.name} (${node.type})`);

  // Check if node is a supported type
  if (!SUPPORTED_NODE_TYPES.includes(node.type as SupportedNodeType)) {
    console.log(`Node ${node.name} is not a supported type: ${node.type}`);
    return;
  }

  // Handle fills if the node has them
  if ('fills' in node) {
    // Cast node to a type with fills
    const nodeWithFills = node as GeometryMixin;

    // Create a copy of the fills to modify
    const fills = clone(nodeWithFills.fills) as Paint[];
    const modifiedFills: Paint[] = [];

    console.log(`Node ${node.name} has ${fills.length} fills to process`);

    // Apply modifications to each fill
    for (const fill of fills) {
      let modifiedFill = { ...fill };

      // Apply scale mode if provided and fill is an image or video
      if (scaleMode && (fill.type === 'IMAGE' || fill.type === 'VIDEO')) {
        console.log(`Applying scale mode ${scaleMode} to ${fill.type} fill`);
        // Create a new ImagePaint object with the updated scaleMode
        modifiedFill = {
          ...fill,
          scaleMode: scaleMode,
        };
      }

      // Apply blend mode if provided
      if (blendMode) {
        console.log(`Applying blend mode ${blendMode} to fill`);
        modifiedFill = {
          ...modifiedFill,
          blendMode: blendMode,
        };
      }

      modifiedFills.push(modifiedFill);
    }

    // Apply the modified fills back to the node
    console.log(`Applying ${modifiedFills.length} modified fills to node ${node.name}`);
    nodeWithFills.fills = modifiedFills;

    // Remove first fill layer if requested
    if (shouldRemoveFillLayer && modifiedFills.length > 0) {
      console.log(`Removing first fill layer from node ${node.name}`);
      modifiedFills.splice(0, 1);
      nodeWithFills.fills = modifiedFills;
    }
  } else {
    console.log(`Node ${node.name} does not have fills property`);
  }

  // Resize if dimensions are provided
  if (widthCount > 0 || heightCount > 0) {
    try {
      // Different handling based on node type
      if (node.type === 'VECTOR') {
        console.log(`Special handling for VECTOR node: ${node.name}`);
        // For vector nodes, we need to handle resizing differently
        const vectorNode = node as VectorNode;

        // Store original dimensions
        const originalWidth = vectorNode.width;
        const originalHeight = vectorNode.height;

        console.log(`Original vector dimensions: ${originalWidth}x${originalHeight}`);

        // Calculate scale factors
        let scaleX = widthCount > 0 ? widthCount / originalWidth : 1;
        let scaleY = heightCount > 0 ? heightCount / originalHeight : 1;

        // If only one dimension is specified, maintain aspect ratio
        if (widthCount > 0 && heightCount === 0) {
          scaleY = scaleX;
        } else if (heightCount > 0 && widthCount === 0) {
          scaleX = scaleY;
        }

        // Apply scaling
        console.log(`Scaling vector by factors: ${scaleX}x${scaleY}`);
        if (scaleX === scaleY) {
          // If scaling uniformly, we can use the single parameter version
          vectorNode.rescale(scaleX);
        } else {
          // For non-uniform scaling, we need to use a different approach
          // First scale to the width
          vectorNode.rescale(scaleX);
          // Then adjust the height if needed
          if (heightCount > 0) {
            vectorNode.resize(vectorNode.width, heightCount);
          }
        }

        // Log new dimensions
        console.log(`New vector dimensions: ${vectorNode.width}x${vectorNode.height}`);
      }
      // Handle other node types that support resize
      else if ('resize' in node) {
        const resizeableNode = node as SceneNode & {
          resize: (width: number, height: number) => void;
          width: number;
          height: number;
        };

        // Log original dimensions
        console.log(`Original dimensions: ${resizeableNode.width}x${resizeableNode.height}`);

        if (heightCount === 0) {
          // Only width specified
          console.log(`Resizing to width: ${widthCount}`);
          resizeableNode.resize(widthCount, resizeableNode.height);
        } else if (widthCount === 0) {
          // Only height specified
          console.log(`Resizing to height: ${heightCount}`);
          resizeableNode.resize(resizeableNode.width, heightCount);
        } else {
          // Both width and height specified
          console.log(`Resizing to exact dimensions: ${widthCount}x${heightCount}`);
          resizeableNode.resize(widthCount, heightCount);
        }

        // Log new dimensions
        console.log(`New dimensions: ${resizeableNode.width}x${resizeableNode.height}`);
      } else {
        console.log(`Node ${node.name} does not support resizing`);
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
    if ('fills' in node) {
      const fills = clone(node.fills) as Paint[];
      if (fills.length > 0) {
        // Remove the first fill (default grey fill)
        fills.splice(0, 1);
        (node as GeometryMixin).fills = fills;
      }
    }
  });
}

/**
 * Process all selected nodes with the given parameters
 */
async function processSelectedNodes(
  scaleMode: ScaleModeType | null = null,
  widthCount: number = 0,
  heightCount: number = 0,
  blendMode: BlendMode | null = null,
  shouldRemoveFillLayer: boolean = false
): Promise<number> {
  let processedCount = 0;

  for (const node of figma.currentPage.selection) {
    await processNode(node, scaleMode, widthCount, heightCount, blendMode, shouldRemoveFillLayer);
    processedCount++;
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

  // Check if at least one selected node has image fills
  const hasValidSelection = selection.some(
    (node) => SUPPORTED_NODE_TYPES.includes(node.type as SupportedNodeType) && hasImageFills(node)
  );

  // If no valid selection but there are selected nodes with fills property,
  // we'll consider it valid for the purpose of UI interaction
  const hasFillsProperty = selection.some(
    (node) => 'fills' in node && Array.isArray(node.fills) && node.fills.length > 0
  );

  // Log for debugging
  console.log(
    `Selection check: ${selection.length} nodes selected, valid: ${hasValidSelection}, has fills property: ${hasFillsProperty}`
  );

  // Return true if there's a valid selection or if there are nodes with fills property
  return hasValidSelection || hasFillsProperty;
}

// Set up selection change listener
figma.on('selectionchange', () => {
  // Check if there's a valid selection and notify the UI
  const hasSelection = checkSelection();
  figma.ui.postMessage({ type: 'selection-checked', hasSelection });
});

// Initialize by loading settings
loadSettings().then(() => {
  // Ready to receive messages
  figma.ui.postMessage({ type: 'plugin-ready' });
});

// Handle messages from the UI
figma.ui.onmessage = async (msg: PluginMessage) => {
  const {
    type,
    widthCount = 0,
    heightCount = 0,
    checkboxOn = false,
    removeFillLayer: shouldRemoveFillLayer = false,
    selectedBlendMode = 'NORMAL',
    selectedScaleMode = 'FILL',
  } = msg;
  let processedCount = 0;

  // Log the received message for debugging
  console.log(`Received message: ${type}`, {
    widthCount,
    heightCount,
    selectedBlendMode,
    selectedScaleMode,
  });

  switch (type) {
    case 'load-settings':
      // Load settings and send them to the UI
      const settings = await loadSettings();
      figma.ui.postMessage({ type: 'settings-loaded', settings });
      break;

    case 'check-selection':
      // Check if there's a current selection and send result to UI
      const hasSelection = checkSelection();
      figma.ui.postMessage({ type: 'selection-checked', hasSelection });
      break;

    case 'watch-selection':
      // This is handled by the selectionchange event listener
      break;

    case 'notify-no-selection':
      // Notify user that they need to select something first
      figma.notify(
        'Please select at least one object with an image fill (Rectangle, Frame, etc. with an image imported as a fill)'
      );
      break;

    case 'save-settings':
      // Save current settings
      await saveSettings({
        widthCount: widthCount ? String(widthCount) : '',
        heightCount: heightCount ? String(heightCount) : '',
        checkboxOn,
        removeFillLayer: shouldRemoveFillLayer,
        selectedBlendMode,
        selectedScaleMode,
      });
      break;

    case 'apply-settings':
      // Apply all current settings to the selection
      console.log(
        `Applying settings: width=${widthCount}, height=${heightCount}, blendMode=${selectedBlendMode}, scaleMode=${selectedScaleMode}`
      );
      processedCount = await processSelectedNodes(
        selectedScaleMode as ScaleModeType,
        widthCount,
        heightCount,
        selectedBlendMode as BlendMode,
        shouldRemoveFillLayer
      );
      figma.notify(`Applied settings to ${processedCount} objects`);
      break;

    case 'set-to-fill':
      processedCount = await processSelectedNodes(
        'FILL',
        widthCount,
        heightCount,
        null,
        shouldRemoveFillLayer
      );
      figma.notify(`Set ${processedCount} objects to FILL`);
      break;

    case 'set-to-fit':
      processedCount = await processSelectedNodes(
        'FIT',
        widthCount,
        heightCount,
        null,
        shouldRemoveFillLayer
      );
      figma.notify(`Set ${processedCount} objects to FIT`);
      break;

    case 'set-to-crop':
      processedCount = await processSelectedNodes(
        'CROP',
        widthCount,
        heightCount,
        null,
        shouldRemoveFillLayer
      );
      figma.notify(`Set ${processedCount} objects to CROP`);
      break;

    case 'set-to-tile':
      processedCount = await processSelectedNodes(
        'TILE',
        widthCount,
        heightCount,
        null,
        shouldRemoveFillLayer
      );
      figma.notify(`Set ${processedCount} objects to TILE`);
      break;

    case 'remove-fill-layer':
      await removeFillLayer();
      figma.notify('Removed fill layers');
      break;

    case 'keep-fill-layer':
      // Do nothing, just acknowledge the setting change
      break;

    case 'update-dimensions':
      // Apply dimensions without changing scale mode
      await processSelectedNodes(null, widthCount, heightCount, null, shouldRemoveFillLayer);
      break;

    case 'reset-dimensions':
      // Just notify that dimensions were reset
      figma.notify('Dimensions reset');
      break;

    case 'update':
      // General update - apply current settings
      await processSelectedNodes(null, widthCount, heightCount, null, shouldRemoveFillLayer);
      break;

    case 'set-blend-mode':
      if (msg.blendMode) {
        processedCount = await processSelectedNodes(null, 0, 0, msg.blendMode as BlendMode, false);
        figma.notify(`Set ${processedCount} objects to ${msg.blendMode} blend mode`);
      }
      break;

    case 'preview-changes':
      figma.notify('Changes applied');
      break;

    case 'cancel':
      figma.closePlugin();
      break;

    case 'preview-blend-mode':
      if (msg.blendMode) {
        // Store original fills before preview if not already stored
        if (originalFills.size === 0) {
          figma.currentPage.selection.forEach((node) => {
            if ('fills' in node) {
              // Create a deep copy of the fills to avoid readonly issues
              const fillsCopy = JSON.parse(JSON.stringify(node.fills)) as Paint[];
              originalFills.set(node.id, fillsCopy);
            }
          });
        }

        // Apply blend mode for preview to all nodes with fills
        figma.currentPage.selection.forEach((node) => {
          if ('fills' in node) {
            const nodeWithFills = node as GeometryMixin;
            const fills = clone(nodeWithFills.fills) as Paint[];

            // Apply blend mode to all fills
            const modifiedFills = fills.map((fill) => ({
              ...fill,
              blendMode: msg.blendMode as BlendMode,
            }));

            nodeWithFills.fills = modifiedFills;
            processedCount++;
          }
        });

        console.log(`Preview blend mode: ${msg.blendMode}, applied to ${processedCount} nodes`);
      }
      break;

    case 'reset-preview':
      // Restore original fills
      if (originalFills.size > 0) {
        figma.currentPage.selection.forEach((node) => {
          if ('fills' in node && originalFills.has(node.id)) {
            (node as GeometryMixin).fills = originalFills.get(node.id)!;
          }
        });
        // Clear the stored fills
        originalFills.clear();
        console.log('Reset preview: original fills restored');
      }
      break;

    case 'preview-scale-mode':
      if (msg.scaleMode) {
        // Store original fills before preview if not already stored
        if (originalFills.size === 0) {
          figma.currentPage.selection.forEach((node) => {
            if ('fills' in node) {
              // Create a deep copy of the fills to avoid readonly issues
              const fillsCopy = JSON.parse(JSON.stringify(node.fills)) as Paint[];
              originalFills.set(node.id, fillsCopy);
            }
          });
        }

        // Apply scale mode for preview to all nodes with fills
        figma.currentPage.selection.forEach((node) => {
          if ('fills' in node) {
            const nodeWithFills = node as GeometryMixin;
            const fills = clone(nodeWithFills.fills) as Paint[];

            // Apply scale mode to all fills
            const modifiedFills = fills.map((fill) => {
              if (fill.type === 'IMAGE' || fill.type === 'VIDEO') {
                return {
                  ...fill,
                  scaleMode: msg.scaleMode as ScaleModeType,
                };
              }
              return fill;
            });

            nodeWithFills.fills = modifiedFills;
            processedCount++;
          }
        });

        console.log(`Preview scale mode: ${msg.scaleMode}, applied to ${processedCount} nodes`);
      }
      break;
  }

  // Close plugin if checkbox is checked
  if (checkboxOn) {
    figma.closePlugin();
  }
};
