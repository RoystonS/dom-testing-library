"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getByPlaceholderText = getByPlaceholderText;
exports.getAllByPlaceholderText = getAllByPlaceholderText;
exports.queryByText = queryByText;
exports.queryAllByText = queryAllByText;
exports.getByText = getByText;
exports.getAllByText = getAllByText;
exports.queryByLabelText = queryByLabelText;
exports.queryAllByLabelText = queryAllByLabelText;
exports.getByLabelText = getByLabelText;
exports.getAllByLabelText = getAllByLabelText;
exports.queryByAltText = queryByAltText;
exports.queryAllByAltText = queryAllByAltText;
exports.getByAltText = getByAltText;
exports.getAllByAltText = getAllByAltText;
exports.queryBySelectText = queryBySelectText;
exports.queryAllBySelectText = queryAllBySelectText;
exports.getBySelectText = getBySelectText;
exports.getAllBySelectText = getAllBySelectText;
exports.getByTestId = getByTestId;
exports.getAllByTestId = getAllByTestId;
exports.queryByTitle = queryByTitle;
exports.queryAllByTitle = queryAllByTitle;
exports.getByTitle = getByTitle;
exports.getAllByTitle = getAllByTitle;
exports.getByValue = getByValue;
exports.getAllByValue = getAllByValue;
exports.getAllByRole = getAllByRole;
exports.getByRole = getByRole;
exports.queryAllByRole = exports.queryByRole = exports.queryAllByValue = exports.queryByValue = exports.queryAllByTestId = exports.queryByTestId = exports.queryAllByPlaceholderText = exports.queryByPlaceholderText = void 0;

var _matches = require("./matches");

var _getNodeText = require("./get-node-text");

var _queryHelpers = require("./query-helpers");

var _config = require("./config");

// Here are the queries for the library.
// The queries here should only be things that are accessible to both users who are using a screen reader
// and those who are not using a screen reader (with the exception of the data-testid attribute query).
function queryAllLabelsByText(container, text, {
  exact = true,
  trim,
  collapseWhitespace,
  normalizer
} = {}) {
  const matcher = exact ? _matches.matches : _matches.fuzzyMatches;
  const matchNormalizer = (0, _matches.makeNormalizer)({
    collapseWhitespace,
    trim,
    normalizer
  });
  return Array.from(container.querySelectorAll('label')).filter(label => matcher(label.textContent, label, text, matchNormalizer));
}

function queryAllByLabelText(container, text, {
  selector = '*',
  exact = true,
  collapseWhitespace,
  trim,
  normalizer
} = {}) {
  const matchNormalizer = (0, _matches.makeNormalizer)({
    collapseWhitespace,
    trim,
    normalizer
  });
  const labels = queryAllLabelsByText(container, text, {
    exact,
    normalizer: matchNormalizer
  });
  const labelledElements = labels.map(label => {
    if (label.control) {
      return label.control;
    }
    /* istanbul ignore if */


    if (label.getAttribute('for')) {
      // we're using this notation because with the # selector we would have to escape special characters e.g. user.name
      // see https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector#Escaping_special_characters
      // <label for="someId">text</label><input id="someId" />
      // .control support has landed in jsdom (https://github.com/jsdom/jsdom/issues/2175)
      return container.querySelector(`[id="${label.getAttribute('for')}"]`);
    }

    if (label.getAttribute('id')) {
      // <label id="someId">text</label><input aria-labelledby="someId" />
      return container.querySelector(`[aria-labelledby~="${label.getAttribute('id')}"]`);
    }

    if (label.childNodes.length) {
      // <label>text: <input /></label>
      return label.querySelector(selector);
    }

    return null;
  }).filter(label => label !== null).concat((0, _queryHelpers.queryAllByAttribute)('aria-label', container, text, {
    exact
  }));
  const possibleAriaLabelElements = queryAllByText(container, text, {
    exact,
    normalizer: matchNormalizer
  }).filter(el => el.tagName !== 'LABEL'); // don't reprocess labels

  const ariaLabelledElements = possibleAriaLabelElements.reduce((allLabelledElements, nextLabelElement) => {
    const labelId = nextLabelElement.getAttribute('id');
    if (!labelId) return allLabelledElements; // ARIA labels can label multiple elements

    const labelledNodes = Array.from(container.querySelectorAll(`[aria-labelledby~="${labelId}"]`));
    return allLabelledElements.concat(labelledNodes);
  }, []);
  return Array.from(new Set([...labelledElements, ...ariaLabelledElements]));
}

function queryByLabelText(...args) {
  return (0, _queryHelpers.firstResultOrNull)(queryAllByLabelText, ...args);
}

function queryAllByText(container, text, {
  selector = '*',
  exact = true,
  collapseWhitespace,
  trim,
  ignore = 'script, style',
  normalizer
} = {}) {
  const matcher = exact ? _matches.matches : _matches.fuzzyMatches;
  const matchNormalizer = (0, _matches.makeNormalizer)({
    collapseWhitespace,
    trim,
    normalizer
  });
  return Array.from(container.querySelectorAll(selector)).filter(node => !ignore || !node.matches(ignore)).filter(node => matcher((0, _getNodeText.getNodeText)(node), node, text, matchNormalizer));
}

function queryByText(...args) {
  return (0, _queryHelpers.firstResultOrNull)(queryAllByText, ...args);
}

function queryAllByTitle(container, text, {
  exact = true,
  collapseWhitespace,
  trim,
  normalizer
} = {}) {
  const matcher = exact ? _matches.matches : _matches.fuzzyMatches;
  const matchNormalizer = (0, _matches.makeNormalizer)({
    collapseWhitespace,
    trim,
    normalizer
  });
  return Array.from(container.querySelectorAll('[title], svg > title')).filter(node => matcher(node.getAttribute('title'), node, text, matchNormalizer) || matcher((0, _getNodeText.getNodeText)(node), node, text, matchNormalizer));
}

function queryByTitle(...args) {
  return (0, _queryHelpers.firstResultOrNull)(queryAllByTitle, ...args);
}

function queryAllBySelectText(container, text, {
  exact = true,
  collapseWhitespace,
  trim,
  normalizer
} = {}) {
  const matcher = exact ? _matches.matches : _matches.fuzzyMatches;
  const matchNormalizer = (0, _matches.makeNormalizer)({
    collapseWhitespace,
    trim,
    normalizer
  });
  return Array.from(container.querySelectorAll('select')).filter(selectNode => {
    const selectedOptions = Array.from(selectNode.options).filter(option => option.selected);
    return selectedOptions.some(optionNode => matcher((0, _getNodeText.getNodeText)(optionNode), optionNode, text, matchNormalizer));
  });
}

function queryBySelectText(...args) {
  return (0, _queryHelpers.firstResultOrNull)(queryAllBySelectText, ...args);
}

function getTestIdAttribute() {
  return (0, _config.getConfig)().testIdAttribute;
}

const queryByPlaceholderText = _queryHelpers.queryByAttribute.bind(null, 'placeholder');

exports.queryByPlaceholderText = queryByPlaceholderText;

const queryAllByPlaceholderText = _queryHelpers.queryAllByAttribute.bind(null, 'placeholder');

exports.queryAllByPlaceholderText = queryAllByPlaceholderText;

const queryByTestId = (...args) => (0, _queryHelpers.queryByAttribute)(getTestIdAttribute(), ...args);

exports.queryByTestId = queryByTestId;

const queryAllByTestId = (...args) => (0, _queryHelpers.queryAllByAttribute)(getTestIdAttribute(), ...args);

exports.queryAllByTestId = queryAllByTestId;

const queryByValue = _queryHelpers.queryByAttribute.bind(null, 'value');

exports.queryByValue = queryByValue;

const queryAllByValue = _queryHelpers.queryAllByAttribute.bind(null, 'value');

exports.queryAllByValue = queryAllByValue;

const queryByRole = _queryHelpers.queryByAttribute.bind(null, 'role');

exports.queryByRole = queryByRole;

const queryAllByRole = _queryHelpers.queryAllByAttribute.bind(null, 'role');

exports.queryAllByRole = queryAllByRole;

function queryAllByAltText(container, alt, {
  exact = true,
  collapseWhitespace,
  trim,
  normalizer
} = {}) {
  const matcher = exact ? _matches.matches : _matches.fuzzyMatches;
  const matchNormalizer = (0, _matches.makeNormalizer)({
    collapseWhitespace,
    trim,
    normalizer
  });
  return Array.from(container.querySelectorAll('img,input,area')).filter(node => matcher(node.getAttribute('alt'), node, alt, matchNormalizer));
}

function queryByAltText(...args) {
  return (0, _queryHelpers.firstResultOrNull)(queryAllByAltText, ...args);
} // getters
// the reason we're not dynamically generating these functions that look so similar:
// 1. The error messages are specific to each one and depend on arguments
// 2. The stack trace will look better because it'll have a helpful method name.


function getAllByTestId(container, id, ...rest) {
  const els = queryAllByTestId(container, id, ...rest);

  if (!els.length) {
    throw (0, _queryHelpers.getElementError)(`Unable to find an element by: [${getTestIdAttribute()}="${id}"]`, container);
  }

  return els;
}

function getByTestId(...args) {
  return (0, _queryHelpers.firstResultOrNull)(getAllByTestId, ...args);
}

function getAllByTitle(container, title, ...rest) {
  const els = queryAllByTitle(container, title, ...rest);

  if (!els.length) {
    throw (0, _queryHelpers.getElementError)(`Unable to find an element with the title: ${title}.`, container);
  }

  return els;
}

function getByTitle(...args) {
  return (0, _queryHelpers.firstResultOrNull)(getAllByTitle, ...args);
}

function getAllByValue(container, value, ...rest) {
  const els = queryAllByValue(container, value, ...rest);

  if (!els.length) {
    throw (0, _queryHelpers.getElementError)(`Unable to find an element with the value: ${value}.`, container);
  }

  return els;
}

function getByValue(...args) {
  return (0, _queryHelpers.firstResultOrNull)(getAllByValue, ...args);
}

function getAllByPlaceholderText(container, text, ...rest) {
  const els = queryAllByPlaceholderText(container, text, ...rest);

  if (!els.length) {
    throw (0, _queryHelpers.getElementError)(`Unable to find an element with the placeholder text of: ${text}`, container);
  }

  return els;
}

function getByPlaceholderText(...args) {
  return (0, _queryHelpers.firstResultOrNull)(getAllByPlaceholderText, ...args);
}

function getAllByLabelText(container, text, ...rest) {
  const els = queryAllByLabelText(container, text, ...rest);

  if (!els.length) {
    const labels = queryAllLabelsByText(container, text, ...rest);

    if (labels.length) {
      throw (0, _queryHelpers.getElementError)(`Found a label with the text of: ${text}, however no form control was found associated to that label. Make sure you're using the "for" attribute or "aria-labelledby" attribute correctly.`, container);
    } else {
      throw (0, _queryHelpers.getElementError)(`Unable to find a label with the text of: ${text}`, container);
    }
  }

  return els;
}

function getByLabelText(...args) {
  return (0, _queryHelpers.firstResultOrNull)(getAllByLabelText, ...args);
}

function getAllByText(container, text, ...rest) {
  const els = queryAllByText(container, text, ...rest);

  if (!els.length) {
    throw (0, _queryHelpers.getElementError)(`Unable to find an element with the text: ${text}. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.`, container);
  }

  return els;
}

function getByText(...args) {
  return (0, _queryHelpers.firstResultOrNull)(getAllByText, ...args);
}

function getAllByAltText(container, alt, ...rest) {
  const els = queryAllByAltText(container, alt, ...rest);

  if (!els.length) {
    throw (0, _queryHelpers.getElementError)(`Unable to find an element with the alt text: ${alt}`, container);
  }

  return els;
}

function getByAltText(...args) {
  return (0, _queryHelpers.firstResultOrNull)(getAllByAltText, ...args);
}

function getAllByRole(container, id, ...rest) {
  const els = queryAllByRole(container, id, ...rest);

  if (!els.length) {
    throw (0, _queryHelpers.getElementError)(`Unable to find an element by role=${id}`, container);
  }

  return els;
}

function getByRole(...args) {
  return (0, _queryHelpers.firstResultOrNull)(getAllByRole, ...args);
}

function getAllBySelectText(container, text, ...rest) {
  const els = queryAllBySelectText(container, text, ...rest);

  if (!els.length) {
    throw (0, _queryHelpers.getElementError)(`Unable to find a <select> element with the selected option's text: ${text}`, container);
  }

  return els;
}

function getBySelectText(...args) {
  return (0, _queryHelpers.firstResultOrNull)(getAllBySelectText, ...args);
}
/* eslint complexity:["error", 14] */