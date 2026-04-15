/* eslint-disable import/prefer-default-export */
/* eslint-disable prefer-destructuring */

import {
  useState,
  useCallback
} from 'react';

import { cloneAndUpdate } from './misc';

export const useMergeState = (initialState = {}) => {
  /**
   * A wrapper over useState for working with object({}) states.
   *
   * @param {object} initialState - an object to initialize with.
   *
   * @returns {[object, func, func]} [currentState, mergeState, setState] - returns 3-tuple.
   *
   * The first value being the current state.
   *
   * The second `mergeState` is a function which when called with an object,
   * merges it with the previous and sets it as the new state.
   * `mergeState` can take a path and value as args as well where path can be
   * array of keys or dot.notation string
   * and value can be either callback of the value itself. In case of callback
   * it will be provided with previous value in the path and it should return new value.
   * `mergeState` can also take a callback as an single argument, in that case
   * it will be provided with previous state and it should return a new state.
   *
   * The third `setState` is same as `useState`'s.
   *
   *
   * @example
   * const [state, updateState] = useMergeState();
   * // ...
   * updateState({name: e.target.value}); // or
   * updateState('phone', e.target.value); // or
   * updateState('address.fullAddress', e.target.value) // or
   * updateState(['address', 'pinCode'], e.target.value) // or
   * const pinMapsState = {'560102': 'Bangalore', ...just for an example}
   * const pinCode = e.target.value;
   * updateState('address', (address) => ({...address, pinCode, state: pinMapsState[pinCode]}))
   */
  const [state, setState] = useState(initialState);
  const setMergeState = useCallback((arg1, arg2) => {
    // `arg1` can be object, path(array of keys or dot.notation string) or function.
    // If `arg1` is object or function `arg2` is ignored.
    // If `arg1` is path then `arg2` is the value or a function which when
    // called with previous value returns new value(handled by _.updateWith).
    // This documentation would be so much easier with TS. :(

    setState((prevState) => {
      if (typeof arg1 === 'function') return arg1(prevState);

      const newState = typeof arg1 === 'string' || Array.isArray(arg1)
        ? cloneAndUpdate(prevState || {}, arg1, arg2)
        : arg1;
      return ({ ...(prevState || {}), ...newState });
    });
  }, []);
  return [state, setMergeState, setState];
};
