import { describe, it, expect } from 'vitest';
import { uiStateLabel, cn } from '../src/index.js';

describe('ui primitives', () => {
  it('labels the 4 mandatory states in vi-VN', () => {
    expect(uiStateLabel('loading')).toBe('Đang tải');
    expect(uiStateLabel('empty')).toBe('Chưa có dữ liệu');
    expect(uiStateLabel('error')).toBe('Đã xảy ra lỗi');
    expect(uiStateLabel('success')).toBe('Thành công');
  });

  it('cn composes class names', () => {
    expect(cn('a', false && 'b', 'c')).toBe('a c');
  });
});
