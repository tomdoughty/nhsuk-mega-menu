import { hasClass, addClass, removeClass } from 'nhsuk-frontend/packages/common';
import 'nhsuk-frontend/packages/polyfills';

/**
 * Extra IE polyfill for String.includes()
*/
if (!String.prototype.includes) {
  String.prototype.includes = function (search, start) {
    if (search instanceof RegExp) {
      throw TypeError('first argument must not be a RegExp');
    }
    if (start === undefined) { start = 0; }
    return this.indexOf(search, start) !== -1;
  };
}

// NodeList of the main link elements
const links = document.querySelectorAll('.guides-nav__label');
// Class used for state detection and styling
const visibleClass = 'guides-nav__item--selected';

// Get all elements needed for functionality from the link element
const getTabObject = (link) => ({
  link,
  listItem: link.parentElement,
  content: link.nextElementSibling,
});

// Setup aria attributes with initial values needed for assistive tech
const setupAria = ({ link, content }, index) => {
  // Associate link with the content it controls
  link.setAttribute('aria-controls', `guides-nav__contents-${index}`);
  content.setAttribute('id', `guides-nav__contents-${index}`);
};

// Hide content for a tab
const hideContent = ({ link, content, listItem }) => {
  // Remove visibility class and update attributes
  removeClass(listItem, visibleClass);
  link.setAttribute('aria-selected', 'false');
  content.setAttribute('aria-hidden', 'true');
};

// Hide content for all tabs
const hideAllContent = () => links.forEach((link) => {
  const tabObj = getTabObject(link);
  hideContent(tabObj);
});

// Hide content for a tab
const showContent = ({ link, content, listItem }) => {
  // Hide any open tabs
  hideAllContent();
  // Add visibility class and update aria attributes
  addClass(listItem, visibleClass);
  link.setAttribute('aria-selected', 'true');
  content.setAttribute('aria-hidden', 'false');
};

// Show tab if URL has param matching link href
const showContentIfUrlMatch = (elements) => {
  const linkHref = elements.link.getAttribute('href').substring(1);
  if (window.location.href.includes(linkHref)) showContent(elements);
};

const updateQueryStringParameter = (query) => {
  // Split URL to see if it contains any query strings
  const [url, existingQueries = ''] = window.location.href.split('?');
  // If URL already has queries we need to check them out
  if (existingQueries.length) {
    // New string of existing queries with any tabname queries removed
    const queriesExcludingTabname = existingQueries
      .split('&')
      .filter((existingQuery) => !existingQuery.includes('tabname'))
      .join('&');
    // URL with tabname queries removed
    const cleanUrl = queriesExcludingTabname.length ? `${url}?${queriesExcludingTabname}` : url;
    // If no new query to add return clean URL with tabname queries removed
    if (!query) return cleanUrl;
    // Return new URL with query appended
    const join = queriesExcludingTabname.length ? '&' : '?';
    return `${cleanUrl}${join}${query}`;
  }
  // Return URL with new query if no queries already exist
  return `${url}?${query}`;
};

// Update the URL in address bar
const updateUrl = (link = null) => {
  // Test browser has replaceState functionality
  if (window.history.replaceState) {
    // Get href from link if it is passed
    const query = link ? link.getAttribute('href').substring(1) : '';
    // Build new URL from current url plus query
    const newUrl = updateQueryStringParameter(query);
    // Use replaceState to update URL without adding to history
    window.history.replaceState(null, '', newUrl);
  }
};

// Add click event to a tab
const addEvents = (tabObj) => {
  const { link, listItem } = tabObj;
  if (link.addEventListener) {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      if (hasClass(listItem, visibleClass)) {
        hideContent(tabObj);
        updateUrl();
      } else {
        showContent(tabObj);
        updateUrl(link);
      }
    });
  }
};

// Iterate over links to initialise functionality
links.forEach((link, index) => {
  const tabObj = getTabObject(link);
  setupAria(tabObj, index);
  addEvents(tabObj);
  // Hide tab by default
  hideContent(tabObj);
  // Display tab if it matches querystring
  showContentIfUrlMatch(tabObj);
});
