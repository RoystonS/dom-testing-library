'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _extends = _interopDefault(require('@babel/runtime/helpers/extends'));
var prettyFormat = _interopDefault(require('pretty-format'));
var waitForExpect = _interopDefault(require('wait-for-expect'));
var MutationObserver = _interopDefault(require('@sheerun/mutationobserver-shim'));
var _objectWithoutPropertiesLoose = _interopDefault(require('@babel/runtime/helpers/objectWithoutPropertiesLoose'));

function fuzzyMatches(textToMatch, node, matcher, normalizer) {
  if (typeof textToMatch !== 'string') {
    return false;
  }

  var normalizedText = normalizer(textToMatch);

  if (typeof matcher === 'string') {
    return normalizedText.toLowerCase().includes(matcher.toLowerCase());
  } else if (typeof matcher === 'function') {
    return matcher(normalizedText, node);
  } else {
    return matcher.test(normalizedText);
  }
}

function matches(textToMatch, node, matcher, normalizer) {
  if (typeof textToMatch !== 'string') {
    return false;
  }

  var normalizedText = normalizer(textToMatch);

  if (typeof matcher === 'string') {
    return normalizedText === matcher;
  } else if (typeof matcher === 'function') {
    return matcher(normalizedText, node);
  } else {
    return matcher.test(normalizedText);
  }
}

function getDefaultNormalizer(_temp) {
  var _ref = _temp === void 0 ? {} : _temp,
      _ref$trim = _ref.trim,
      trim = _ref$trim === void 0 ? true : _ref$trim,
      _ref$collapseWhitespa = _ref.collapseWhitespace,
      collapseWhitespace = _ref$collapseWhitespa === void 0 ? true : _ref$collapseWhitespa;

  return function (text) {
    var normalizedText = text;
    normalizedText = trim ? normalizedText.trim() : normalizedText;
    normalizedText = collapseWhitespace ? normalizedText.replace(/\s+/g, ' ') : normalizedText;
    return normalizedText;
  };
}
/**
 * Constructs a normalizer to pass to functions in matches.js
 * @param {boolean|undefined} trim The user-specified value for `trim`, without
 * any defaulting having been applied
 * @param {boolean|undefined} collapseWhitespace The user-specified value for
 * `collapseWhitespace`, without any defaulting having been applied
 * @param {Function|undefined} normalizer The user-specified normalizer
 * @returns {Function} A normalizer
 */


function makeNormalizer(_ref2) {
  var trim = _ref2.trim,
      collapseWhitespace = _ref2.collapseWhitespace,
      normalizer = _ref2.normalizer;

  if (normalizer) {
    // User has specified a custom normalizer
    if (typeof trim !== 'undefined' || typeof collapseWhitespace !== 'undefined') {
      // They've also specified a value for trim or collapseWhitespace
      throw new Error('trim and collapseWhitespace are not supported with a normalizer. ' + 'If you want to use the default trim and collapseWhitespace logic in your normalizer, ' + 'use "getDefaultNormalizer({trim, collapseWhitespace})" and compose that into your normalizer');
    }

    return normalizer;
  } else {
    // No custom normalizer specified. Just use default.
    return getDefaultNormalizer({
      trim: trim,
      collapseWhitespace: collapseWhitespace
    });
  }
}

function getNodeText(node) {
  var window = node.ownerDocument.defaultView;
  return Array.from(node.childNodes).filter(function (child) {
    return child.nodeType === window.Node.TEXT_NODE && Boolean(child.textContent);
  }).map(function (c) {
    return c.textContent;
  }).join('');
}

var _prettyFormat$plugins = prettyFormat.plugins,
    DOMElement = _prettyFormat$plugins.DOMElement,
    DOMCollection = _prettyFormat$plugins.DOMCollection;

function prettyDOM(htmlElement, maxLength, options) {
  if (htmlElement.documentElement) {
    htmlElement = htmlElement.documentElement;
  }

  var debugContent = prettyFormat(htmlElement, _extends({
    plugins: [DOMElement, DOMCollection],
    printFunctionName: false,
    highlight: true
  }, options));
  return maxLength !== undefined && htmlElement.outerHTML.length > maxLength ? debugContent.slice(0, maxLength) + "..." : debugContent;
}

/* eslint-disable complexity */

function debugDOM(htmlElement) {
  var limit = process.env.DEBUG_PRINT_LIMIT || 7000;
  var inNode = typeof process !== 'undefined' && process.versions !== undefined && process.versions.node !== undefined;
  var window = htmlElement.ownerDocument && htmlElement.ownerDocument.defaultView || undefined;
  var inCypress = typeof global !== 'undefined' && global.Cypress || typeof window !== 'undefined' && window.Cypress;
  /* istanbul ignore else */

  if (inCypress) {
    return '';
  } else if (inNode) {
    return prettyDOM(htmlElement, limit);
  } else {
    return prettyDOM(htmlElement, limit, {
      highlight: false
    });
  }
}
/* eslint-enable complexity */


function getElementError(message, container) {
  return new Error([message, debugDOM(container)].filter(Boolean).join('\n\n'));
}

function firstResultOrNull(queryFunction) {
  for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  var result = queryFunction.apply(void 0, args);
  if (result.length === 0) return null;
  return result[0];
}

function queryAllByAttribute(attribute, container, text, _temp) {
  var _ref = _temp === void 0 ? {} : _temp,
      _ref$exact = _ref.exact,
      exact = _ref$exact === void 0 ? true : _ref$exact,
      collapseWhitespace = _ref.collapseWhitespace,
      trim = _ref.trim,
      normalizer = _ref.normalizer;

  var matcher = exact ? matches : fuzzyMatches;
  var matchNormalizer = makeNormalizer({
    collapseWhitespace: collapseWhitespace,
    trim: trim,
    normalizer: normalizer
  });
  return Array.from(container.querySelectorAll("[" + attribute + "]")).filter(function (node) {
    return matcher(node.getAttribute(attribute), node, text, matchNormalizer);
  });
}

function queryByAttribute() {
  for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    args[_key2] = arguments[_key2];
  }

  return firstResultOrNull.apply(void 0, [queryAllByAttribute].concat(args));
}

var queryHelpers = /*#__PURE__*/Object.freeze({
  debugDOM: debugDOM,
  getElementError: getElementError,
  firstResultOrNull: firstResultOrNull,
  queryAllByAttribute: queryAllByAttribute,
  queryByAttribute: queryByAttribute
});

// It would be cleaner for this to live inside './queries', but
// other parts of the code assume that all exports from
// './queries' are query functions.
var config = {
  testIdAttribute: 'data-testid'
};
function configure(newConfig) {
  if (typeof newConfig === 'function') {
    // Pass the existing config out to the provided function
    // and accept a delta in return
    newConfig = newConfig(config);
  } // Merge the incoming config delta


  config = _extends({}, config, newConfig);
}
function getConfig() {
  return config;
}

// The queries here should only be things that are accessible to both users who are using a screen reader
// and those who are not using a screen reader (with the exception of the data-testid attribute query).

function queryAllLabelsByText(container, text, _temp) {
  var _ref = _temp === void 0 ? {} : _temp,
      _ref$exact = _ref.exact,
      exact = _ref$exact === void 0 ? true : _ref$exact,
      trim = _ref.trim,
      collapseWhitespace = _ref.collapseWhitespace,
      normalizer = _ref.normalizer;

  var matcher = exact ? matches : fuzzyMatches;
  var matchNormalizer = makeNormalizer({
    collapseWhitespace: collapseWhitespace,
    trim: trim,
    normalizer: normalizer
  });
  return Array.from(container.querySelectorAll('label')).filter(function (label) {
    return matcher(label.textContent, label, text, matchNormalizer);
  });
}

function queryAllByLabelText(container, text, _temp2) {
  var _ref2 = _temp2 === void 0 ? {} : _temp2,
      _ref2$selector = _ref2.selector,
      selector = _ref2$selector === void 0 ? '*' : _ref2$selector,
      _ref2$exact = _ref2.exact,
      exact = _ref2$exact === void 0 ? true : _ref2$exact,
      collapseWhitespace = _ref2.collapseWhitespace,
      trim = _ref2.trim,
      normalizer = _ref2.normalizer;

  var matchNormalizer = makeNormalizer({
    collapseWhitespace: collapseWhitespace,
    trim: trim,
    normalizer: normalizer
  });
  var labels = queryAllLabelsByText(container, text, {
    exact: exact,
    normalizer: matchNormalizer
  });
  var labelledElements = labels.map(function (label) {
    if (label.control) {
      return label.control;
    }
    /* istanbul ignore if */


    if (label.getAttribute('for')) {
      // we're using this notation because with the # selector we would have to escape special characters e.g. user.name
      // see https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector#Escaping_special_characters
      // <label for="someId">text</label><input id="someId" />
      // .control support has landed in jsdom (https://github.com/jsdom/jsdom/issues/2175)
      return container.querySelector("[id=\"" + label.getAttribute('for') + "\"]");
    }

    if (label.getAttribute('id')) {
      // <label id="someId">text</label><input aria-labelledby="someId" />
      return container.querySelector("[aria-labelledby~=\"" + label.getAttribute('id') + "\"]");
    }

    if (label.childNodes.length) {
      // <label>text: <input /></label>
      return label.querySelector(selector);
    }

    return null;
  }).filter(function (label) {
    return label !== null;
  }).concat(queryAllByAttribute('aria-label', container, text, {
    exact: exact
  }));
  var possibleAriaLabelElements = queryAllByText(container, text, {
    exact: exact,
    normalizer: matchNormalizer
  }).filter(function (el) {
    return el.tagName !== 'LABEL';
  }); // don't reprocess labels

  var ariaLabelledElements = possibleAriaLabelElements.reduce(function (allLabelledElements, nextLabelElement) {
    var labelId = nextLabelElement.getAttribute('id');
    if (!labelId) return allLabelledElements; // ARIA labels can label multiple elements

    var labelledNodes = Array.from(container.querySelectorAll("[aria-labelledby~=\"" + labelId + "\"]"));
    return allLabelledElements.concat(labelledNodes);
  }, []);
  return Array.from(new Set(labelledElements.concat(ariaLabelledElements)));
}

function queryByLabelText() {
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  return firstResultOrNull.apply(void 0, [queryAllByLabelText].concat(args));
}

function queryAllByText(container, text, _temp3) {
  var _ref3 = _temp3 === void 0 ? {} : _temp3,
      _ref3$selector = _ref3.selector,
      selector = _ref3$selector === void 0 ? '*' : _ref3$selector,
      _ref3$exact = _ref3.exact,
      exact = _ref3$exact === void 0 ? true : _ref3$exact,
      collapseWhitespace = _ref3.collapseWhitespace,
      trim = _ref3.trim,
      _ref3$ignore = _ref3.ignore,
      ignore = _ref3$ignore === void 0 ? 'script, style' : _ref3$ignore,
      normalizer = _ref3.normalizer;

  var matcher = exact ? matches : fuzzyMatches;
  var matchNormalizer = makeNormalizer({
    collapseWhitespace: collapseWhitespace,
    trim: trim,
    normalizer: normalizer
  });
  return Array.from(container.querySelectorAll(selector)).filter(function (node) {
    return !ignore || !node.matches(ignore);
  }).filter(function (node) {
    return matcher(getNodeText(node), node, text, matchNormalizer);
  });
}

function queryByText() {
  for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    args[_key2] = arguments[_key2];
  }

  return firstResultOrNull.apply(void 0, [queryAllByText].concat(args));
}

function queryAllByTitle(container, text, _temp4) {
  var _ref4 = _temp4 === void 0 ? {} : _temp4,
      _ref4$exact = _ref4.exact,
      exact = _ref4$exact === void 0 ? true : _ref4$exact,
      collapseWhitespace = _ref4.collapseWhitespace,
      trim = _ref4.trim,
      normalizer = _ref4.normalizer;

  var matcher = exact ? matches : fuzzyMatches;
  var matchNormalizer = makeNormalizer({
    collapseWhitespace: collapseWhitespace,
    trim: trim,
    normalizer: normalizer
  });
  return Array.from(container.querySelectorAll('[title], svg > title')).filter(function (node) {
    return matcher(node.getAttribute('title'), node, text, matchNormalizer) || matcher(getNodeText(node), node, text, matchNormalizer);
  });
}

function queryByTitle() {
  for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
    args[_key3] = arguments[_key3];
  }

  return firstResultOrNull.apply(void 0, [queryAllByTitle].concat(args));
}

function queryAllBySelectText(container, text, _temp5) {
  var _ref5 = _temp5 === void 0 ? {} : _temp5,
      _ref5$exact = _ref5.exact,
      exact = _ref5$exact === void 0 ? true : _ref5$exact,
      collapseWhitespace = _ref5.collapseWhitespace,
      trim = _ref5.trim,
      normalizer = _ref5.normalizer;

  var matcher = exact ? matches : fuzzyMatches;
  var matchNormalizer = makeNormalizer({
    collapseWhitespace: collapseWhitespace,
    trim: trim,
    normalizer: normalizer
  });
  return Array.from(container.querySelectorAll('select')).filter(function (selectNode) {
    var selectedOptions = Array.from(selectNode.options).filter(function (option) {
      return option.selected;
    });
    return selectedOptions.some(function (optionNode) {
      return matcher(getNodeText(optionNode), optionNode, text, matchNormalizer);
    });
  });
}

function queryBySelectText() {
  for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
    args[_key4] = arguments[_key4];
  }

  return firstResultOrNull.apply(void 0, [queryAllBySelectText].concat(args));
}

function getTestIdAttribute() {
  return getConfig().testIdAttribute;
}

var queryByPlaceholderText = queryByAttribute.bind(null, 'placeholder');
var queryAllByPlaceholderText = queryAllByAttribute.bind(null, 'placeholder');

var queryByTestId = function () {
  for (var _len5 = arguments.length, args = new Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
    args[_key5] = arguments[_key5];
  }

  return queryByAttribute.apply(void 0, [getTestIdAttribute()].concat(args));
};

var queryAllByTestId = function () {
  for (var _len6 = arguments.length, args = new Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
    args[_key6] = arguments[_key6];
  }

  return queryAllByAttribute.apply(void 0, [getTestIdAttribute()].concat(args));
};

var queryByValue = queryByAttribute.bind(null, 'value');
var queryAllByValue = queryAllByAttribute.bind(null, 'value');
var queryByRole = queryByAttribute.bind(null, 'role');
var queryAllByRole = queryAllByAttribute.bind(null, 'role');

function queryAllByAltText(container, alt, _temp6) {
  var _ref6 = _temp6 === void 0 ? {} : _temp6,
      _ref6$exact = _ref6.exact,
      exact = _ref6$exact === void 0 ? true : _ref6$exact,
      collapseWhitespace = _ref6.collapseWhitespace,
      trim = _ref6.trim,
      normalizer = _ref6.normalizer;

  var matcher = exact ? matches : fuzzyMatches;
  var matchNormalizer = makeNormalizer({
    collapseWhitespace: collapseWhitespace,
    trim: trim,
    normalizer: normalizer
  });
  return Array.from(container.querySelectorAll('img,input,area')).filter(function (node) {
    return matcher(node.getAttribute('alt'), node, alt, matchNormalizer);
  });
}

function queryByAltText() {
  for (var _len7 = arguments.length, args = new Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
    args[_key7] = arguments[_key7];
  }

  return firstResultOrNull.apply(void 0, [queryAllByAltText].concat(args));
} // getters
// the reason we're not dynamically generating these functions that look so similar:
// 1. The error messages are specific to each one and depend on arguments
// 2. The stack trace will look better because it'll have a helpful method name.


function getAllByTestId(container, id) {
  for (var _len8 = arguments.length, rest = new Array(_len8 > 2 ? _len8 - 2 : 0), _key8 = 2; _key8 < _len8; _key8++) {
    rest[_key8 - 2] = arguments[_key8];
  }

  var els = queryAllByTestId.apply(void 0, [container, id].concat(rest));

  if (!els.length) {
    throw getElementError("Unable to find an element by: [" + getTestIdAttribute() + "=\"" + id + "\"]", container);
  }

  return els;
}

function getByTestId() {
  for (var _len9 = arguments.length, args = new Array(_len9), _key9 = 0; _key9 < _len9; _key9++) {
    args[_key9] = arguments[_key9];
  }

  return firstResultOrNull.apply(void 0, [getAllByTestId].concat(args));
}

function getAllByTitle(container, title) {
  for (var _len10 = arguments.length, rest = new Array(_len10 > 2 ? _len10 - 2 : 0), _key10 = 2; _key10 < _len10; _key10++) {
    rest[_key10 - 2] = arguments[_key10];
  }

  var els = queryAllByTitle.apply(void 0, [container, title].concat(rest));

  if (!els.length) {
    throw getElementError("Unable to find an element with the title: " + title + ".", container);
  }

  return els;
}

function getByTitle() {
  for (var _len11 = arguments.length, args = new Array(_len11), _key11 = 0; _key11 < _len11; _key11++) {
    args[_key11] = arguments[_key11];
  }

  return firstResultOrNull.apply(void 0, [getAllByTitle].concat(args));
}

function getAllByValue(container, value) {
  for (var _len12 = arguments.length, rest = new Array(_len12 > 2 ? _len12 - 2 : 0), _key12 = 2; _key12 < _len12; _key12++) {
    rest[_key12 - 2] = arguments[_key12];
  }

  var els = queryAllByValue.apply(void 0, [container, value].concat(rest));

  if (!els.length) {
    throw getElementError("Unable to find an element with the value: " + value + ".", container);
  }

  return els;
}

function getByValue() {
  for (var _len13 = arguments.length, args = new Array(_len13), _key13 = 0; _key13 < _len13; _key13++) {
    args[_key13] = arguments[_key13];
  }

  return firstResultOrNull.apply(void 0, [getAllByValue].concat(args));
}

function getAllByPlaceholderText(container, text) {
  for (var _len14 = arguments.length, rest = new Array(_len14 > 2 ? _len14 - 2 : 0), _key14 = 2; _key14 < _len14; _key14++) {
    rest[_key14 - 2] = arguments[_key14];
  }

  var els = queryAllByPlaceholderText.apply(void 0, [container, text].concat(rest));

  if (!els.length) {
    throw getElementError("Unable to find an element with the placeholder text of: " + text, container);
  }

  return els;
}

function getByPlaceholderText() {
  for (var _len15 = arguments.length, args = new Array(_len15), _key15 = 0; _key15 < _len15; _key15++) {
    args[_key15] = arguments[_key15];
  }

  return firstResultOrNull.apply(void 0, [getAllByPlaceholderText].concat(args));
}

function getAllByLabelText(container, text) {
  for (var _len16 = arguments.length, rest = new Array(_len16 > 2 ? _len16 - 2 : 0), _key16 = 2; _key16 < _len16; _key16++) {
    rest[_key16 - 2] = arguments[_key16];
  }

  var els = queryAllByLabelText.apply(void 0, [container, text].concat(rest));

  if (!els.length) {
    var labels = queryAllLabelsByText.apply(void 0, [container, text].concat(rest));

    if (labels.length) {
      throw getElementError("Found a label with the text of: " + text + ", however no form control was found associated to that label. Make sure you're using the \"for\" attribute or \"aria-labelledby\" attribute correctly.", container);
    } else {
      throw getElementError("Unable to find a label with the text of: " + text, container);
    }
  }

  return els;
}

function getByLabelText() {
  for (var _len17 = arguments.length, args = new Array(_len17), _key17 = 0; _key17 < _len17; _key17++) {
    args[_key17] = arguments[_key17];
  }

  return firstResultOrNull.apply(void 0, [getAllByLabelText].concat(args));
}

function getAllByText(container, text) {
  for (var _len18 = arguments.length, rest = new Array(_len18 > 2 ? _len18 - 2 : 0), _key18 = 2; _key18 < _len18; _key18++) {
    rest[_key18 - 2] = arguments[_key18];
  }

  var els = queryAllByText.apply(void 0, [container, text].concat(rest));

  if (!els.length) {
    throw getElementError("Unable to find an element with the text: " + text + ". This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.", container);
  }

  return els;
}

function getByText() {
  for (var _len19 = arguments.length, args = new Array(_len19), _key19 = 0; _key19 < _len19; _key19++) {
    args[_key19] = arguments[_key19];
  }

  return firstResultOrNull.apply(void 0, [getAllByText].concat(args));
}

function getAllByAltText(container, alt) {
  for (var _len20 = arguments.length, rest = new Array(_len20 > 2 ? _len20 - 2 : 0), _key20 = 2; _key20 < _len20; _key20++) {
    rest[_key20 - 2] = arguments[_key20];
  }

  var els = queryAllByAltText.apply(void 0, [container, alt].concat(rest));

  if (!els.length) {
    throw getElementError("Unable to find an element with the alt text: " + alt, container);
  }

  return els;
}

function getByAltText() {
  for (var _len21 = arguments.length, args = new Array(_len21), _key21 = 0; _key21 < _len21; _key21++) {
    args[_key21] = arguments[_key21];
  }

  return firstResultOrNull.apply(void 0, [getAllByAltText].concat(args));
}

function getAllByRole(container, id) {
  for (var _len22 = arguments.length, rest = new Array(_len22 > 2 ? _len22 - 2 : 0), _key22 = 2; _key22 < _len22; _key22++) {
    rest[_key22 - 2] = arguments[_key22];
  }

  var els = queryAllByRole.apply(void 0, [container, id].concat(rest));

  if (!els.length) {
    throw getElementError("Unable to find an element by role=" + id, container);
  }

  return els;
}

function getByRole() {
  for (var _len23 = arguments.length, args = new Array(_len23), _key23 = 0; _key23 < _len23; _key23++) {
    args[_key23] = arguments[_key23];
  }

  return firstResultOrNull.apply(void 0, [getAllByRole].concat(args));
}

function getAllBySelectText(container, text) {
  for (var _len24 = arguments.length, rest = new Array(_len24 > 2 ? _len24 - 2 : 0), _key24 = 2; _key24 < _len24; _key24++) {
    rest[_key24 - 2] = arguments[_key24];
  }

  var els = queryAllBySelectText.apply(void 0, [container, text].concat(rest));

  if (!els.length) {
    throw getElementError("Unable to find a <select> element with the selected option's text: " + text, container);
  }

  return els;
}

function getBySelectText() {
  for (var _len25 = arguments.length, args = new Array(_len25), _key25 = 0; _key25 < _len25; _key25++) {
    args[_key25] = arguments[_key25];
  }

  return firstResultOrNull.apply(void 0, [getAllBySelectText].concat(args));
}
/* eslint complexity:["error", 14] */

var defaultQueries = /*#__PURE__*/Object.freeze({
  queryByPlaceholderText: queryByPlaceholderText,
  queryAllByPlaceholderText: queryAllByPlaceholderText,
  getByPlaceholderText: getByPlaceholderText,
  getAllByPlaceholderText: getAllByPlaceholderText,
  queryByText: queryByText,
  queryAllByText: queryAllByText,
  getByText: getByText,
  getAllByText: getAllByText,
  queryByLabelText: queryByLabelText,
  queryAllByLabelText: queryAllByLabelText,
  getByLabelText: getByLabelText,
  getAllByLabelText: getAllByLabelText,
  queryByAltText: queryByAltText,
  queryAllByAltText: queryAllByAltText,
  getByAltText: getByAltText,
  getAllByAltText: getAllByAltText,
  queryBySelectText: queryBySelectText,
  queryAllBySelectText: queryAllBySelectText,
  getBySelectText: getBySelectText,
  getAllBySelectText: getAllBySelectText,
  queryByTestId: queryByTestId,
  queryAllByTestId: queryAllByTestId,
  getByTestId: getByTestId,
  getAllByTestId: getAllByTestId,
  queryByTitle: queryByTitle,
  queryAllByTitle: queryAllByTitle,
  getByTitle: getByTitle,
  getAllByTitle: getAllByTitle,
  queryByValue: queryByValue,
  queryAllByValue: queryAllByValue,
  getByValue: getByValue,
  getAllByValue: getAllByValue,
  queryByRole: queryByRole,
  queryAllByRole: queryAllByRole,
  getAllByRole: getAllByRole,
  getByRole: getByRole
});

/**
 * @typedef {{[key: string]: Function}} FuncMap
 */

/**
 * @param {HTMLElement} element container
 * @param {FuncMap} queries object of functions
 * @returns {FuncMap} returns object of functions bound to container
 */

function getQueriesForElement(element, queries) {
  if (queries === void 0) {
    queries = defaultQueries;
  }

  return Object.keys(queries).reduce(function (helpers, key) {
    var fn = queries[key];
    helpers[key] = fn.bind(null, element);
    return helpers;
  }, {});
}

function wait(callback, _temp) {
  if (callback === void 0) {
    callback = function () {};
  }

  var _ref = _temp === void 0 ? {} : _temp,
      _ref$timeout = _ref.timeout,
      timeout = _ref$timeout === void 0 ? 4500 : _ref$timeout,
      _ref$interval = _ref.interval,
      interval = _ref$interval === void 0 ? 50 : _ref$interval;

  return waitForExpect(callback, timeout, interval);
}

function newMutationObserver(onMutation) {
  var MutationObserverConstructor = typeof window !== 'undefined' && typeof window.MutationObserver !== 'undefined' ? window.MutationObserver : MutationObserver;
  return new MutationObserverConstructor(onMutation);
}

function getDocument() {
  if (typeof window === 'undefined') {
    throw new Error('Could not find default container');
  }

  return window.document;
}

function waitForElement(callback, _temp) {
  var _ref = _temp === void 0 ? {} : _temp,
      _ref$container = _ref.container,
      container = _ref$container === void 0 ? getDocument() : _ref$container,
      _ref$timeout = _ref.timeout,
      timeout = _ref$timeout === void 0 ? 4500 : _ref$timeout,
      _ref$mutationObserver = _ref.mutationObserverOptions,
      mutationObserverOptions = _ref$mutationObserver === void 0 ? {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true
  } : _ref$mutationObserver;

  return new Promise(function (resolve, reject) {
    if (typeof callback !== 'function') {
      reject('waitForElement requires a callback as the first parameter');
    }

    var lastError;
    var timer = setTimeout(onTimeout, timeout);
    var observer = newMutationObserver(onMutation);
    observer.observe(container, mutationObserverOptions);

    function onDone(error, result) {
      clearTimeout(timer);
      setImmediate(function () {
        return observer.disconnect();
      });

      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    }

    function onMutation() {
      try {
        var result = callback();

        if (result) {
          onDone(null, result);
        } // If `callback` returns falsy value, wait for the next mutation or timeout.

      } catch (error) {
        // Save the callback error to reject the promise with it.
        lastError = error; // If `callback` throws an error, wait for the next mutation or timeout.
      }
    }

    function onTimeout() {
      onDone(lastError || new Error('Timed out in waitForElement.'), null);
    }

    onMutation();
  });
}

function waitForDomChange(_temp) {
  var _ref = _temp === void 0 ? {} : _temp,
      _ref$container = _ref.container,
      container = _ref$container === void 0 ? getDocument() : _ref$container,
      _ref$timeout = _ref.timeout,
      timeout = _ref$timeout === void 0 ? 4500 : _ref$timeout,
      _ref$mutationObserver = _ref.mutationObserverOptions,
      mutationObserverOptions = _ref$mutationObserver === void 0 ? {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true
  } : _ref$mutationObserver;

  return new Promise(function (resolve, reject) {
    var timer = setTimeout(function () {
      onDone(new Error('Timed out in waitForDomChange.'), null);
    }, timeout);
    var observer = newMutationObserver(function (mutationsList) {
      onDone(null, mutationsList);
    });
    observer.observe(container, mutationObserverOptions);

    function onDone(error, result) {
      clearTimeout(timer);
      setImmediate(function () {
        return observer.disconnect();
      });

      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    }
  });
}

var eventMap = {
  // Clipboard Events
  copy: {
    EventType: 'ClipboardEvent',
    defaultInit: {
      bubbles: true,
      cancelable: true
    }
  },
  cut: {
    EventType: 'ClipboardEvent',
    defaultInit: {
      bubbles: true,
      cancelable: true
    }
  },
  paste: {
    EventType: 'ClipboardEvent',
    defaultInit: {
      bubbles: true,
      cancelable: true
    }
  },
  // Composition Events
  compositionEnd: {
    EventType: 'CompositionEvent',
    defaultInit: {
      bubbles: true,
      cancelable: true
    }
  },
  compositionStart: {
    EventType: 'CompositionEvent',
    defaultInit: {
      bubbles: true,
      cancelable: true
    }
  },
  compositionUpdate: {
    EventType: 'CompositionEvent',
    defaultInit: {
      bubbles: true,
      cancelable: false
    }
  },
  // Keyboard Events
  keyDown: {
    EventType: 'KeyboardEvent',
    defaultInit: {
      bubbles: true,
      cancelable: true
    }
  },
  keyPress: {
    EventType: 'KeyboardEvent',
    defaultInit: {
      bubbles: true,
      cancelable: true
    }
  },
  keyUp: {
    EventType: 'KeyboardEvent',
    defaultInit: {
      bubbles: true,
      cancelable: true
    }
  },
  // Focus Events
  focus: {
    EventType: 'FocusEvent',
    defaultInit: {
      bubbles: false,
      cancelable: false
    }
  },
  blur: {
    EventType: 'FocusEvent',
    defaultInit: {
      bubbles: false,
      cancelable: false
    }
  },
  // Form Events
  change: {
    EventType: 'InputEvent',
    defaultInit: {
      bubbles: true,
      cancelable: true
    }
  },
  input: {
    EventType: 'InputEvent',
    defaultInit: {
      bubbles: true,
      cancelable: true
    }
  },
  invalid: {
    EventType: 'Event',
    defaultInit: {
      bubbles: false,
      cancelable: true
    }
  },
  submit: {
    EventType: 'Event',
    defaultInit: {
      bubbles: true,
      cancelable: true
    }
  },
  // Mouse Events
  click: {
    EventType: 'MouseEvent',
    defaultInit: {
      bubbles: true,
      cancelable: true,
      button: 0
    }
  },
  contextMenu: {
    EventType: 'MouseEvent',
    defaultInit: {
      bubbles: true,
      cancelable: true
    }
  },
  dblClick: {
    EventType: 'MouseEvent',
    defaultInit: {
      bubbles: true,
      cancelable: true
    }
  },
  drag: {
    EventType: 'DragEvent',
    defaultInit: {
      bubbles: true,
      cancelable: true
    }
  },
  dragEnd: {
    EventType: 'DragEvent',
    defaultInit: {
      bubbles: true,
      cancelable: false
    }
  },
  dragEnter: {
    EventType: 'DragEvent',
    defaultInit: {
      bubbles: true,
      cancelable: true
    }
  },
  dragExit: {
    EventType: 'DragEvent',
    defaultInit: {
      bubbles: true,
      cancelable: false
    }
  },
  dragLeave: {
    EventType: 'DragEvent',
    defaultInit: {
      bubbles: true,
      cancelable: false
    }
  },
  dragOver: {
    EventType: 'DragEvent',
    defaultInit: {
      bubbles: true,
      cancelable: true
    }
  },
  dragStart: {
    EventType: 'DragEvent',
    defaultInit: {
      bubbles: true,
      cancelable: true
    }
  },
  drop: {
    EventType: 'DragEvent',
    defaultInit: {
      bubbles: true,
      cancelable: true
    }
  },
  mouseDown: {
    EventType: 'MouseEvent',
    defaultInit: {
      bubbles: true,
      cancelable: true
    }
  },
  mouseEnter: {
    EventType: 'MouseEvent',
    defaultInit: {
      bubbles: true,
      cancelable: true
    }
  },
  mouseLeave: {
    EventType: 'MouseEvent',
    defaultInit: {
      bubbles: true,
      cancelable: true
    }
  },
  mouseMove: {
    EventType: 'MouseEvent',
    defaultInit: {
      bubbles: true,
      cancelable: true
    }
  },
  mouseOut: {
    EventType: 'MouseEvent',
    defaultInit: {
      bubbles: true,
      cancelable: true
    }
  },
  mouseOver: {
    EventType: 'MouseEvent',
    defaultInit: {
      bubbles: true,
      cancelable: true
    }
  },
  mouseUp: {
    EventType: 'MouseEvent',
    defaultInit: {
      bubbles: true,
      cancelable: true
    }
  },
  // Selection Events
  select: {
    EventType: 'Event',
    defaultInit: {
      bubbles: true,
      cancelable: false
    }
  },
  // Touch Events
  touchCancel: {
    EventType: 'TouchEvent',
    defaultInit: {
      bubbles: true,
      cancelable: false
    }
  },
  touchEnd: {
    EventType: 'TouchEvent',
    defaultInit: {
      bubbles: true,
      cancelable: true
    }
  },
  touchMove: {
    EventType: 'TouchEvent',
    defaultInit: {
      bubbles: true,
      cancelable: true
    }
  },
  touchStart: {
    EventType: 'TouchEvent',
    defaultInit: {
      bubbles: true,
      cancelable: true
    }
  },
  // UI Events
  scroll: {
    EventType: 'UIEvent',
    defaultInit: {
      bubbles: false,
      cancelable: false
    }
  },
  // Wheel Events
  wheel: {
    EventType: 'WheelEvent',
    defaultInit: {
      bubbles: true,
      cancelable: true
    }
  },
  // Media Events
  abort: {
    EventType: 'Event',
    defaultInit: {
      bubbles: false,
      cancelable: false
    }
  },
  canPlay: {
    EventType: 'Event',
    defaultInit: {
      bubbles: false,
      cancelable: false
    }
  },
  canPlayThrough: {
    EventType: 'Event',
    defaultInit: {
      bubbles: false,
      cancelable: false
    }
  },
  durationChange: {
    EventType: 'Event',
    defaultInit: {
      bubbles: false,
      cancelable: false
    }
  },
  emptied: {
    EventType: 'Event',
    defaultInit: {
      bubbles: false,
      cancelable: false
    }
  },
  encrypted: {
    EventType: 'Event',
    defaultInit: {
      bubbles: false,
      cancelable: false
    }
  },
  ended: {
    EventType: 'Event',
    defaultInit: {
      bubbles: false,
      cancelable: false
    }
  },
  // error: {
  //   EventType: Event,
  //   defaultInit: {bubbles: false, cancelable: false},
  // },
  loadedData: {
    EventType: 'Event',
    defaultInit: {
      bubbles: false,
      cancelable: false
    }
  },
  loadedMetadata: {
    EventType: 'Event',
    defaultInit: {
      bubbles: false,
      cancelable: false
    }
  },
  loadStart: {
    EventType: 'ProgressEvent',
    defaultInit: {
      bubbles: false,
      cancelable: false
    }
  },
  pause: {
    EventType: 'Event',
    defaultInit: {
      bubbles: false,
      cancelable: false
    }
  },
  play: {
    EventType: 'Event',
    defaultInit: {
      bubbles: false,
      cancelable: false
    }
  },
  playing: {
    EventType: 'Event',
    defaultInit: {
      bubbles: false,
      cancelable: false
    }
  },
  progress: {
    EventType: 'ProgressEvent',
    defaultInit: {
      bubbles: false,
      cancelable: false
    }
  },
  rateChange: {
    EventType: 'Event',
    defaultInit: {
      bubbles: false,
      cancelable: false
    }
  },
  seeked: {
    EventType: 'Event',
    defaultInit: {
      bubbles: false,
      cancelable: false
    }
  },
  seeking: {
    EventType: 'Event',
    defaultInit: {
      bubbles: false,
      cancelable: false
    }
  },
  stalled: {
    EventType: 'Event',
    defaultInit: {
      bubbles: false,
      cancelable: false
    }
  },
  suspend: {
    EventType: 'Event',
    defaultInit: {
      bubbles: false,
      cancelable: false
    }
  },
  timeUpdate: {
    EventType: 'Event',
    defaultInit: {
      bubbles: false,
      cancelable: false
    }
  },
  volumeChange: {
    EventType: 'Event',
    defaultInit: {
      bubbles: false,
      cancelable: false
    }
  },
  waiting: {
    EventType: 'Event',
    defaultInit: {
      bubbles: false,
      cancelable: false
    }
  },
  // Image Events
  load: {
    EventType: 'UIEvent',
    defaultInit: {
      bubbles: false,
      cancelable: false
    }
  },
  error: {
    EventType: 'Event',
    defaultInit: {
      bubbles: false,
      cancelable: false
    }
  },
  // Animation Events
  animationStart: {
    EventType: 'AnimationEvent',
    defaultInit: {
      bubbles: true,
      cancelable: false
    }
  },
  animationEnd: {
    EventType: 'AnimationEvent',
    defaultInit: {
      bubbles: true,
      cancelable: false
    }
  },
  animationIteration: {
    EventType: 'AnimationEvent',
    defaultInit: {
      bubbles: true,
      cancelable: false
    }
  },
  // Transition Events
  transitionEnd: {
    EventType: 'TransitionEvent',
    defaultInit: {
      bubbles: true,
      cancelable: true
    }
  }
};
var eventAliasMap = {
  doubleClick: 'dblClick'
};

function fireEvent(element, event) {
  return element.dispatchEvent(event);
}

Object.keys(eventMap).forEach(function (key) {
  var _eventMap$key = eventMap[key],
      EventType = _eventMap$key.EventType,
      defaultInit = _eventMap$key.defaultInit;
  var eventName = key.toLowerCase();

  fireEvent[key] = function (node, init) {
    var eventInit = _extends({}, defaultInit, init);

    var _eventInit$target = eventInit.target;
    _eventInit$target = _eventInit$target === void 0 ? {} : _eventInit$target;

    var value = _eventInit$target.value,
        files = _eventInit$target.files,
        targetProperties = _objectWithoutPropertiesLoose(_eventInit$target, ["value", "files"]);

    Object.assign(node, targetProperties);

    if (value !== undefined) {
      setNativeValue(node, value);
    }

    if (files !== undefined) {
      // input.files is a read-only property so this is not allowed:
      // input.files = [file]
      // so we have to use this workaround to set the property
      Object.defineProperty(node, 'files', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: files
      });
    }

    var window = node.ownerDocument.defaultView;
    var EventConstructor = window[EventType] || window.Event;
    var event = new EventConstructor(eventName, eventInit);
    return fireEvent(node, event);
  };
}); // function written after some investigation here:
// https://github.com/facebook/react/issues/10135#issuecomment-401496776

function setNativeValue(element, value) {
  var _ref = Object.getOwnPropertyDescriptor(element, 'value') || {},
      valueSetter = _ref.set;

  var prototype = Object.getPrototypeOf(element);

  var _ref2 = Object.getOwnPropertyDescriptor(prototype, 'value') || {},
      prototypeValueSetter = _ref2.set;

  if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(element, value);
  }
  /* istanbul ignore next (I don't want to bother) */
  else if (valueSetter) {
      valueSetter.call(element, value);
    } else {
      throw new Error('The given element does not have a value setter');
    }
}

Object.keys(eventAliasMap).forEach(function (aliasKey) {
  var key = eventAliasMap[aliasKey];

  fireEvent[aliasKey] = function () {
    return fireEvent[key].apply(fireEvent, arguments);
  };
});
/* eslint complexity:["error", 9] */

exports.bindElementToQueries = getQueriesForElement;
exports.within = getQueriesForElement;
exports.queries = defaultQueries;
exports.queryHelpers = queryHelpers;
exports.getDefaultNormalizer = getDefaultNormalizer;
exports.configure = configure;
exports.queryByPlaceholderText = queryByPlaceholderText;
exports.queryAllByPlaceholderText = queryAllByPlaceholderText;
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
exports.queryByTestId = queryByTestId;
exports.queryAllByTestId = queryAllByTestId;
exports.getByTestId = getByTestId;
exports.getAllByTestId = getAllByTestId;
exports.queryByTitle = queryByTitle;
exports.queryAllByTitle = queryAllByTitle;
exports.getByTitle = getByTitle;
exports.getAllByTitle = getAllByTitle;
exports.queryByValue = queryByValue;
exports.queryAllByValue = queryAllByValue;
exports.getByValue = getByValue;
exports.getAllByValue = getAllByValue;
exports.queryByRole = queryByRole;
exports.queryAllByRole = queryAllByRole;
exports.getAllByRole = getAllByRole;
exports.getByRole = getByRole;
exports.wait = wait;
exports.waitForElement = waitForElement;
exports.waitForDomChange = waitForDomChange;
exports.getNodeText = getNodeText;
exports.fireEvent = fireEvent;
exports.getQueriesForElement = getQueriesForElement;
exports.debugDOM = debugDOM;
exports.getElementError = getElementError;
exports.firstResultOrNull = firstResultOrNull;
exports.queryAllByAttribute = queryAllByAttribute;
exports.queryByAttribute = queryByAttribute;
exports.prettyDOM = prettyDOM;
