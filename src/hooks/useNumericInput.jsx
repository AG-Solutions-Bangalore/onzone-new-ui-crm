import { useCallback } from 'react';

const useNumericInput = () => {
  const handleKeyDown = useCallback((event) => {
    const allowedKeys = [
      'Backspace',
      'Delete',
      'Tab',
      'Escape',
      'Enter',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
    ];

    const isCtrlCommand = event.ctrlKey || event.metaKey; 


    if (
      isCtrlCommand &&
      ['a', 'c', 'v', 'x', 'z', 'A', 'C', 'V', 'X', 'Z'].includes(event.key)
    ) {
      return;
    }

  
    if (/^[0-9]$/.test(event.key) || 
        (event.key >= '0' && event.key <= '9') || 
        (event.key >= 'Numpad0' && event.key <= 'Numpad9')) {
      return;
    }

  
    if (event.key === '.' || event.key === 'Decimal') {
      return;
    }

    
    if (allowedKeys.includes(event.key)) {
      return;
    }


    event.preventDefault();
  }, []);

  return handleKeyDown;
};

export default useNumericInput;