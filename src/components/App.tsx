import React, { useState, useEffect } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Select from '@radix-ui/react-select';
import * as Form from '@radix-ui/react-form';
import { ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons';
import { BLEND_MODE_OPTIONS } from '../constants';
import { BlendModeOption, BlendModeType, ScaleModeType, UIState } from '../types';
import Button from './Button';
import Switch from './Switch';

// Debug mode flag - set to false to disable verbose logging
const DEBUG_MODE = false;

// Scale mode options for dropdown
const SCALE_MODE_OPTIONS = [
  { value: 'FILL', label: 'Fill' },
  { value: 'FIT', label: 'Fit' },
  { value: 'CROP', label: 'Crop' },
  { value: 'TILE', label: 'Tile' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('main');
  const [state, setState] = useState<UIState>({
    widthCount: '',
    heightCount: '',
    checkboxOn: false,
    selectedBlendMode: 'NORMAL',
    removeFillLayer: false,
    selectedScaleMode: 'FILL',
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const [isBlendModeOpen, setIsBlendModeOpen] = useState(false);
  const [isScaleModeOpen, setIsScaleModeOpen] = useState(false);

  // Load settings from Figma client storage on initial load
  useEffect(() => {
    const loadSettings = async () => {
      // Request settings from the plugin
      parent.postMessage({ pluginMessage: { type: 'load-settings' } }, '*');
      // Check if there's a current selection
      checkForSelection();
    };

    loadSettings();

    // Listen for messages from the plugin
    const handleMessage = (event: MessageEvent<any>) => {
      const { type, settings, hasSelection: selectionExists } = event.data.pluginMessage || {};

      if (type === 'settings-loaded' && settings) {
        setState((prevState) => ({
          ...prevState,
          ...settings,
          // Convert numbers back to strings for input fields
          widthCount: settings.widthCount ? String(settings.widthCount) : '',
          heightCount: settings.heightCount ? String(settings.heightCount) : '',
        }));
        setIsLoaded(true);

        // Check for selection after loading settings
        checkForSelection();
      }

      if (type === 'selection-checked') {
        if (DEBUG_MODE) {
          console.log('Selection checked event received, hasSelection:', selectionExists);
        }
        setHasSelection(!!selectionExists);
      }
    };

    // Add global keydown listener for Escape key
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape key handler - no longer needed for preview reset
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('keydown', handleKeyDown);

    // Set up a listener for Figma selection changes
    parent.postMessage({ pluginMessage: { type: 'watch-selection' } }, '*');

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Save settings to Figma client storage when they change
  useEffect(() => {
    if (isLoaded) {
      sendMessageToPlugin('save-settings');
    }
  }, [state, isLoaded]);

  const checkForSelection = () => {
    parent.postMessage({ pluginMessage: { type: 'check-selection' } }, '*');
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (DEBUG_MODE) {
      console.log('Width changed to:', value);
    }
    setState({ ...state, widthCount: value });
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (DEBUG_MODE) {
      console.log('Height changed to:', value);
    }
    setState({ ...state, heightCount: value });
  };

  const handleCheckboxChange = (checked: boolean) => {
    setState({ ...state, checkboxOn: checked });
  };

  const handleRemoveFillLayerChange = (checked: boolean) => {
    setState({ ...state, removeFillLayer: checked });
  };

  // Handle when blend mode dropdown is opened/closed
  const handleBlendModeOpenChange = (open: boolean) => {
    if (DEBUG_MODE) {
      console.log(`Blend mode dropdown ${open ? 'opened' : 'closed'}`);
    }
    setIsBlendModeOpen(open);
  };

  // Handle when scale mode dropdown is opened/closed
  const handleScaleModeOpenChange = (open: boolean) => {
    if (DEBUG_MODE) {
      console.log(`Scale mode dropdown ${open ? 'opened' : 'closed'}`);
    }
    setIsScaleModeOpen(open);
  };

  // Handle when a blend mode is selected
  const handleBlendModeChange = (value: string) => {
    if (DEBUG_MODE) {
      console.log('Blend mode selected:', value);
    }

    try {
      // First update state with new blend mode
      setState((prevState) => ({
        ...prevState,
        selectedBlendMode: value as BlendModeType,
      }));
    } catch (error) {
      console.error('Error updating blend mode:', error);
      // Fallback to a simpler update if the previous one fails
      setState({
        ...state,
        selectedBlendMode: value as BlendModeType,
      });
    }
  };

  // Handle when a scale mode is selected
  const handleScaleModeChange = (value: string) => {
    if (DEBUG_MODE) {
      console.log('Scale mode selected:', value);
    }

    try {
      // First update state with new scale mode
      setState((prevState) => ({
        ...prevState,
        selectedScaleMode: value as ScaleModeType,
      }));
    } catch (error) {
      console.error('Error updating scale mode:', error);
      // Fallback to a simpler update if the previous one fails
      setState({
        ...state,
        selectedScaleMode: value as ScaleModeType,
      });
    }
  };

  // Send a message to the plugin
  const sendMessageToPlugin = (type: string, additionalData = {}) => {
    // Convert width and height to numbers, ensuring they're valid numbers
    const numericWidthCount = state.widthCount ? parseFloat(state.widthCount) : 0;
    const numericHeightCount = state.heightCount ? parseFloat(state.heightCount) : 0;

    parent.postMessage(
      {
        pluginMessage: {
          type,
          widthCount: numericWidthCount,
          heightCount: numericHeightCount,
          checkboxOn: state.checkboxOn,
          removeFillLayer: state.removeFillLayer,
          selectedBlendMode: state.selectedBlendMode,
          selectedScaleMode: state.selectedScaleMode,
          ...additionalData,
        },
      },
      '*'
    );

    // Log the message for debugging
    if (DEBUG_MODE) {
      console.log('Sending message to plugin:', {
        type,
        widthCount: numericWidthCount,
        heightCount: numericHeightCount,
        // other properties...
      });
    }
  };

  const handleApplyClick = () => {
    if (hasSelection) {
      applySettings();
    } else {
      // Notify user that they need to select something first
      parent.postMessage({ pluginMessage: { type: 'notify-no-selection' } }, '*');
    }
  };

  const resetDimensions = () => {
    setState({ ...state, widthCount: '', heightCount: '' });
  };

  // Apply settings to selected nodes
  const applySettings = () => {
    if (!hasSelection) {
      parent.postMessage(
        {
          pluginMessage: {
            type: 'notify-no-selection',
          },
        },
        '*'
      );
      return;
    }

    // Check for empty width/height and parse values safely
    const widthCount = state.widthCount ? parseInt(state.widthCount) : 0;
    const heightCount = state.heightCount ? parseInt(state.heightCount) : 0;

    parent.postMessage(
      {
        pluginMessage: {
          type: 'apply-settings',
          selectedScaleMode: state.selectedScaleMode,
          widthCount: widthCount,
          heightCount: heightCount,
          selectedBlendMode: state.selectedBlendMode,
          removeFillLayer: state.removeFillLayer,
        },
      },
      '*'
    );

    // Request an explicit selection check after applying changes
    setTimeout(() => {
      checkForSelection();
    }, 100);
  };

  // Apply dimensions to selected nodes
  const applyDimensions = () => {
    if (!hasSelection) {
      parent.postMessage(
        {
          pluginMessage: {
            type: 'notify-no-selection',
          },
        },
        '*'
      );
      return;
    }

    // Check for empty width/height and parse values safely
    const widthCount = state.widthCount ? parseInt(state.widthCount) : 0;
    const heightCount = state.heightCount ? parseInt(state.heightCount) : 0;

    parent.postMessage(
      {
        pluginMessage: {
          type: 'update-dimensions',
          widthCount: widthCount,
          heightCount: heightCount,
          checkboxOn: state.checkboxOn,
        },
      },
      '*'
    );

    // Request an explicit selection check after applying changes
    setTimeout(() => {
      checkForSelection();
    }, 100);
  };

  const handleDimensionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (hasSelection) {
        applyDimensions();
      } else {
        // Prevent form submission if there's no selection
        e.preventDefault();
        // Notify user that they need to select something first
        parent.postMessage({ pluginMessage: { type: 'notify-no-selection' } }, '*');
      }
    }
  };

  return (
    <div className='p-figma-3'>
      <Tabs.Root
        className='flex flex-col'
        defaultValue='main'
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <Tabs.List className='flex w-full border-b border-figma-border mb-figma-3'>
          <Tabs.Trigger
            className={`flex-1 px-figma-3 py-figma-2 font-figma-medium text-figma-xs data-[state=active]:text-figma-text data-[state=active]:border-b-2 data-[state=active]:border-figma-border-selected data-[state=inactive]:text-figma-text-secondary text-center`}
            value='main'
          >
            Main
          </Tabs.Trigger>
          <Tabs.Trigger
            className={`flex-1 px-figma-3 py-figma-2 font-figma-medium text-figma-xs data-[state=active]:text-figma-text data-[state=active]:border-b-2 data-[state=active]:border-figma-border-selected data-[state=inactive]:text-figma-text-secondary text-center`}
            value='settings'
          >
            Settings
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content
          value='main'
          className='flex flex-col gap-figma-4'
        >
          <div>
            <div className='flex justify-between items-center mb-figma-2'>
              <h2 className='text-figma-sm font-figma-medium text-figma-text'>Dimensions</h2>
              <button
                onClick={resetDimensions}
                className='text-figma-xs text-figma-text-brand'
              >
                Reset
              </button>
            </div>
            <div className='flex gap-figma-2 mb-figma-1'>
              <Form.Root className='flex-1'>
                <Form.Field name='width'>
                  <Form.Control asChild>
                    <input
                      type='number'
                      value={state.widthCount}
                      onChange={handleWidthChange}
                      onKeyDown={handleDimensionKeyDown}
                      placeholder='Width'
                      className='w-full h-10 rounded-figma px-figma-3 bg-figma-bg-secondary text-figma-xs text-figma-text border border-transparent focus:border-figma-border-selected focus:outline-none'
                    />
                  </Form.Control>
                </Form.Field>
              </Form.Root>
              <Form.Root className='flex-1'>
                <Form.Field name='height'>
                  <Form.Control asChild>
                    <input
                      type='number'
                      value={state.heightCount}
                      onChange={handleHeightChange}
                      onKeyDown={handleDimensionKeyDown}
                      placeholder='Height'
                      className='w-full h-10 rounded-figma px-figma-3 bg-figma-bg-secondary text-figma-xs text-figma-text border border-transparent focus:border-figma-border-selected focus:outline-none'
                    />
                  </Form.Control>
                </Form.Field>
              </Form.Root>
            </div>
          </div>

          <div>
            <h2 className='text-figma-sm font-figma-medium text-figma-text mb-figma-2'>
              Scale Mode
            </h2>
            <Select.Root
              value={state.selectedScaleMode}
              onValueChange={handleScaleModeChange}
              onOpenChange={handleScaleModeOpenChange}
            >
              <Select.Trigger
                className='inline-flex items-center justify-between w-full h-10 rounded-figma px-figma-3 bg-figma-bg-secondary text-figma-xs text-figma-text border border-transparent hover:border-figma-border focus:border-figma-border-selected focus:outline-none'
                aria-label='Scale Mode'
              >
                <Select.Value />
                <Select.Icon>
                  <ChevronDownIcon />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content
                  className='overflow-hidden bg-figma-bg rounded-figma shadow-md border border-figma-border z-50'
                  position='popper'
                  sideOffset={4}
                  align='start'
                  avoidCollisions={true}
                >
                  <Select.ScrollUpButton className='flex items-center justify-center h-6 bg-figma-bg text-figma-text cursor-default'>
                    <ChevronUpIcon />
                  </Select.ScrollUpButton>
                  <Select.Viewport className='p-1 max-h-[180px]'>
                    <Select.Group>
                      {SCALE_MODE_OPTIONS.map((option) => (
                        <Select.Item
                          key={option.value}
                          value={option.value}
                          className='text-figma-xs text-figma-text rounded-figma flex items-center h-8 px-figma-3 relative select-none data-[highlighted]:bg-figma-bg-selected data-[highlighted]:text-figma-text outline-none cursor-pointer'
                        >
                          <Select.ItemText>{option.label}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Group>
                  </Select.Viewport>
                  <Select.ScrollDownButton className='flex items-center justify-center h-6 bg-figma-bg text-figma-text cursor-default'>
                    <ChevronDownIcon />
                  </Select.ScrollDownButton>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>

          <div>
            <h2 className='text-figma-sm font-figma-medium text-figma-text mb-figma-2'>
              Blend Mode
            </h2>
            <Select.Root
              value={state.selectedBlendMode}
              onValueChange={handleBlendModeChange}
              onOpenChange={handleBlendModeOpenChange}
            >
              <Select.Trigger
                className='inline-flex items-center justify-between w-full h-10 rounded-figma px-figma-3 bg-figma-bg-secondary text-figma-xs text-figma-text border border-transparent hover:border-figma-border focus:border-figma-border-selected focus:outline-none'
                aria-label='Blend Mode'
              >
                <Select.Value />
                <Select.Icon>
                  <ChevronDownIcon />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content
                  className='overflow-hidden bg-figma-bg rounded-figma shadow-md border border-figma-border z-50'
                  position='popper'
                  sideOffset={4}
                  align='start'
                >
                  <Select.ScrollUpButton className='flex items-center justify-center h-6 bg-figma-bg text-figma-text cursor-default'>
                    <ChevronUpIcon />
                  </Select.ScrollUpButton>
                  <Select.Viewport className='p-1 max-h-[180px]'>
                    <Select.Group>
                      {BLEND_MODE_OPTIONS.map((option, index) =>
                        'type' in option ? (
                          <div
                            key={`separator-${index}`}
                            className='h-[1px] my-1 mx-2 bg-figma-border'
                          />
                        ) : (
                          <Select.Item
                            key={(option as BlendModeOption).value}
                            value={(option as BlendModeOption).value}
                            className='text-figma-xs text-figma-text rounded-figma flex items-center h-8 px-figma-3 relative select-none data-[highlighted]:bg-figma-bg-selected data-[highlighted]:text-figma-text outline-none cursor-pointer'
                          >
                            <Select.ItemText>{(option as BlendModeOption).label}</Select.ItemText>
                          </Select.Item>
                        )
                      )}
                    </Select.Group>
                  </Select.Viewport>
                  <Select.ScrollDownButton className='flex items-center justify-center h-6 bg-figma-bg text-figma-text cursor-default'>
                    <ChevronDownIcon />
                  </Select.ScrollDownButton>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>

          <div className='flex gap-figma-2'>
            <Button
              onClick={handleApplyClick}
              className='flex-1'
              variant='primary'
              disabled={!hasSelection}
            >
              Apply to Selection
            </Button>
          </div>
        </Tabs.Content>

        <Tabs.Content
          value='settings'
          className='flex flex-col gap-figma-4'
        >
          <div>
            <h2 className='text-figma-sm font-figma-medium text-figma-text mb-figma-2'>Options</h2>
            <div className='space-y-figma-2'>
              <Switch
                checked={state.removeFillLayer}
                onChange={handleRemoveFillLayerChange}
                label='Remove default grey fill layer'
                className='mb-figma-2'
              />
              <Switch
                checked={state.checkboxOn}
                onChange={handleCheckboxChange}
                label='Maintain aspect ratio'
              />
              <p className='text-figma-xs text-figma-text-tertiary mt-figma-3'>
                Your settings will be automatically saved and persisted between sessions.
              </p>
            </div>
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};

export default App;
