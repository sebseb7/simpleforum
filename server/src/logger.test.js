import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createLogger } from './logger.js';

describe('logger', () => {
  it('exposes severity methods and child scopes', () => {
    const log = createLogger('test');
    assert.equal(typeof log.info, 'function');
    assert.equal(typeof log.warn, 'function');
    assert.equal(typeof log.error, 'function');
    assert.equal(typeof log.debug, 'function');
    const child = log.child('ssg');
    assert.equal(typeof child.info, 'function');
  });

  it('writes without throwing', () => {
    const prev = process.env.LOG_LEVEL;
    process.env.LOG_LEVEL = 'debug';
    const log = createLogger('unit');
    assert.doesNotThrow(() => {
      log.debug('debug msg');
      log.info('info msg');
      log.warn('warn msg');
      log.error(new Error('boom'));
    });
    if (prev === undefined) delete process.env.LOG_LEVEL;
    else process.env.LOG_LEVEL = prev;
  });
});
