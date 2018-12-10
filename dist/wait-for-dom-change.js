"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.waitForDomChange = waitForDomChange;

var _helpers = require("./helpers");

function waitForDomChange({
  container = (0, _helpers.getDocument)(),
  timeout = 4500,
  mutationObserverOptions = {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true
  }
} = {}) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(function () {
      onDone(new Error('Timed out in waitForDomChange.'), null);
    }, timeout);
    const observer = (0, _helpers.newMutationObserver)(function (mutationsList) {
      onDone(null, mutationsList);
    });
    observer.observe(container, mutationObserverOptions);

    function onDone(error, result) {
      clearTimeout(timer);
      setImmediate(() => observer.disconnect());

      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    }
  });
}