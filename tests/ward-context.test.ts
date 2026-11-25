import { describe, expect, it } from 'vitest';
import { WardArticleContext } from '../utils/ward-context';

const name = 'xa vinh thuan';
const haiPhong = { newWard: { ward_code: '11842', province_name: 'Thành phố Hải Phòng' } };
const anGiang = { newWard: { ward_code: '31069', province_name: 'An Giang' } };
const wards = [anGiang, haiPhong];
const aliases = new Map([['tp.hpg', 'Thành phố Hải Phòng']]);

function pick(context: WardArticleContext, wardName = name) {
  return context.pick(wardName, wards, aliases);
}

describe('article evidence for duplicate ward names', () => {
  it('uses an explicit pair ahead of weaker mentions of other provinces', () => {
    const context = new WardArticleContext(['Tin từ An Giang', 'Xã Vĩnh Thuận, TP Hải Phòng']);
    context.record(name, '11842');
    expect(pick(context)).toBe(haiPhong);
    expect(pick(context, 'xa khac')).toBeUndefined();
  });

  it('keeps conflicting explicit pairs ambiguous', () => {
    const context = new WardArticleContext(['Hải Phòng bác tin đồn']);
    context.record(name, '11842');
    context.record(name, '31069');
    expect(pick(context)).toBeUndefined();
  });

  it('uses a whole province name or alias when only one candidate is supported', () => {
    expect(pick(new WardArticleContext(['Hải Phòng bác tin đồn']))).toBe(haiPhong);
    expect(pick(new WardArticleContext(['Thông báo từ TP.HPG.']))).toBe(haiPhong);
    expect(pick(new WardArticleContext(['Tin từ An Giang']))).toBe(anGiang);
  });

  it('does not guess from a tie, a partial word, or words in separate blocks', () => {
    expect(pick(new WardArticleContext(['Hải Phòng và An Giang']))).toBeUndefined();
    expect(pick(new WardArticleContext(['Phan Giang đưa tin']))).toBeUndefined();
    expect(pick(new WardArticleContext(['duyên hải', 'phòng chống bão']))).toBeUndefined();
    expect(pick(new WardArticleContext(['Không rõ địa chỉ']))).toBeUndefined();
  });
});
