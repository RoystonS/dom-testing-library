"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDocument = getDocument;
exports.newMutationObserver = newMutationObserver;

var _mutationobserverShim = _interopRequireDefault(require("@sheerun/mutationobserver-shim"));

function newMutationObserver(onMutation) {
  const MutationObserverConstructor = typeof window !== 'undefined' && typeof window.MutationObserver !== 'undefined' ? window.MutationObserver : _mutationobserverShim.default;
  return new MutationObserverConstructor(onMutation);
}

function getDocument() {
  if (typeof window === 'undefined') {
    throw new Error('Could not find default container');
  }

  return window.document;
}