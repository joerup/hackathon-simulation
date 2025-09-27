/**
 * Simple DOM utilities to reduce boilerplate and improve readability
 */

/**
 * Create an element with optional className, textContent, and attributes
 */
export function createElement(tag, options = {}) {
  const element = document.createElement(tag);
  
  if (options.className) {
    element.className = options.className;
  }
  
  if (options.textContent) {
    element.textContent = options.textContent;
  }
  
  if (options.attributes) {
    Object.entries(options.attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }
  
  if (options.children) {
    options.children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    });
  }
  
  return element;
}

/**
 * Create a labeled input field with wrapper
 */
export function createLabeledInput(labelText, inputOptions = {}) {
  const wrapper = createElement('div', { className: 'input-group' });
  
  const label = createElement('label', {
    textContent: labelText,
    attributes: inputOptions.id ? { for: inputOptions.id } : {}
  });
  
  const input = createElement('input', {
    attributes: inputOptions
  });
  
  wrapper.appendChild(label);
  wrapper.appendChild(input);
  
  return { wrapper, label, input };
}

/**
 * Create a button with loading state support
 */
export function createButton(text, options = {}) {
  const button = createElement('button', {
    textContent: text,
    className: options.className || '',
    attributes: {
      type: options.type || 'button',
      ...options.attributes
    }
  });
  
  button.setLoadingState = (isLoading) => {
    button.disabled = isLoading;
    button.classList.toggle('loading', isLoading);
    button.textContent = isLoading ? (options.loadingText || 'Loading...') : text;
  };
  
  return button;
}

/**
 * Create a status message element with warning state support
 */
export function createStatusMessage(className = 'status-message') {
  const element = createElement('p', { className });
  
  element.showStatus = (message, isWarning = false) => {
    element.textContent = message;
    element.classList.toggle('warning', Boolean(isWarning));
  };
  
  return element;
}
