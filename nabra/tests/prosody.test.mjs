import assert from 'node:assert/strict';
import {analyze,scan,splitPoem,extendWord,skeleton,METERS} from '../prosody.js';
const cases=[['قِفَا نَبْكِ مِنْ ذِكْرَى حَبِيبٍ وَمَنْزِلِ','الطويل'],['عَلَى قَدْرِ أَهْلِ الْعَزْمِ تَأْتِي الْعَزَائِمُ','الطويل'],['وَتَأْتِي عَلَى قَدْرِ الْكِرَامِ الْمَكَارِمُ','الطويل'],['أَلَا لَيْتَ الشَّبَابَ يَعُودُ يَوْمًا','الوافر']];
for(const [s,m] of cases){const r=analyze(s,m);assert.equal(r.exact,true,s);assert.equal(r.best.name,m);assert.equal(analyze(s+' قَلْبِي',m).exact,false,'extra word must break target');}
assert.equal(analyze('على قدر أهل العزم تأتي العزائم').exact,false,'unvocalized input cannot certify meter');
assert.equal(analyze('سلام').exact,false);
assert.equal(analyze('').best,undefined);
assert.equal(analyze('نَ'.repeat(220)).tooLong,true);
assert.equal(METERS.length,16);
assert.deepEqual(splitPoem('صدر * عجز\nصدر2 * عجز2'),[['صدر','عجز'],['صدر2','عجز2']]);
assert.deepEqual(splitPoem('صدر\nعجز\nصدر2'),[['صدر','عجز'],['صدر2','']]);
for(const w of ['قَلْبِي','نور','لا','أمل','سلام'])assert.equal(skeleton(extendWord(w,8)),skeleton(w));
assert.equal(extendWord('دار',8),'دار','nonjoining letters must stay intact');
assert.equal(extendWord('لا',8),'لا','lam-alif ligature remains intact');
assert.equal(scan('قَلْبٌ').pattern,'1010','tanwin becomes a silent noon');
console.log('PASS: known meters, broken variants, ambiguity, input limits, splitting, elongation and tanwin');
