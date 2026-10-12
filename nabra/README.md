# نبرة / Nabra

Independent Arabic poetry editor at `/services/nabra/`. Brand, SVG wordmark and pattern are distinct from the hosting site's identity. Thmanyah fonts are loaded from the owner's existing `v2/assets/fonts` directory.

## Features
- Local editing, autosave, named drafts, restoration and deletion.
- Fusha meter comparison against 264 registered variants spanning 16 meters, with explicit uncertainty for missing vowels. Local vowel/consonant scanner, shadda, tanwin, articles, elision and line endings. Coverage is intentionally described as experimental; it is not a complete scholarly prosody implementation.
- AI diacritization preserves every hemistich's letter skeleton; AI rewrites preserve requested locks and are rescanned locally. Suggestions do not certify unsupported or dialectal meters. AI output never enters HTML directly.
- Existing owner's Firebase AI Logic app configuration and production reCAPTCHA Enterprise App Check. Requests are made only after an explicit AI button click; no private API secrets or bypass/debug tokens. Integration requires this origin to remain enabled for the existing App Check registration. Existing model: `gemini-3.8-flash`.
- Per-word and automatic kashida, conservative joining rules, equalized hemistich widths, line/column spacing, three layouts, five palettes, four export sizes, transparent PNG, text copy/download, mobile Web Share with download fallback.
- Canvas is both preview and export source. Original fonts must load before image export. Text alignment is not portable across receiving applications.

## Validation
`node nabra/tests/prosody.test.mjs`

Known classical verses, deliberately broken variants, missing vowels, long-input guard, split/merge formatting, tanwin and joining constraints were checked. Canvas output was rendered with the original Thmanyah font and inspected in square/story layouts, alongside the outlined logo and 320px social preview. JS syntax checks passed.

A supported browser-control capability was unavailable in this session; full browser/iOS interaction and the live App Check + Gemini request were not exercised. Failure leaves local editing/export available and produces an explicit error, not a fabricated result.

## Sources
Meter tables derived from [Aruudy](https://github.com/kariminf/aruudy), copyright 2019 Abdelkrime Aries, Apache 2.0. Exported finite table modified for this project in 2026. License included at `assets/ARUUDY-LICENSE.txt`. The scanner and editor are project code. Thmanyah is the font owner's typeface.


## Revision 2
- Default content-sized export with adaptive height, automatic column/stacked layout and a real 24–144 font-size control. No font-size cancellation by an implicit fit operation. Long text wraps; overflowing fixed presets are labeled and blocked from export.
- One-time current-draft layout migration preserves poem content and saved drafts.
- Automatic genre/reading discovery and whole-poem meter ranking. Suggestions use the inferred shared meter, retain line count/locked words, display changed vocabulary and undergo one bounded repair pass using local scansion feedback.
- Original-font canvas rendering and `node nabra/tests/layout.test.mjs` validate short-poem dimensions, font-size growth, wrapping, fixed-preset overflow and shared-meter inference. Live Gemini/App Check remains unverified from a browser in this environment.

## الإصدار 2 — الكتابة والإلقاء

- اختيار شطر محدد للتعديل مع رفض أي رد يغير كلمات الأشطر الأخرى، وتطبيق الشطر المختار وحده. زر تراجع ظاهر يعيد النص السابق.
- مقارنة نهايات الصدور أو الأعجاز وقائمة كلمات محلية، مع فصل التشابه الكتابي عن الحكم العروضي على القافية. لا يوجد حكم آلي على الإيطاء أو الروي.
- تسجيل حتى 60 ثانية أو رفع صوت حتى 10 MiB. صيغة التسجيل تختار عبر `MediaRecorder.isTypeSupported`، ويتوقف الميكروفون عند الانتهاء أو مغادرة الصفحة.
- تفريغ صوتي عبر Firebase AI Logic بعد اختيار الموافقة والضغط على زر الإرسال. يعرض النص للمراجعة قبل اعتماده؛ لا استنتاج للمقام ولا تصديق تلقائي لوزن النبطي.
- الصوت في ذاكرة الصفحة فقط، لا يدخل المسودات أو مخزن الردود. سياسة معالجة الصوت عند الإرسال تخضع لمزود الخدمة.
- إعادة استخدام ردود النص لمدة 5 دقائق في ذاكرة الجلسة، بحد 20 طلبا، مع دمج الطلب المتكرر الجاري. الحصة السحابية تظل محدودة.
- تحسين الوقف على التنوين والتاء المربوطة، وتجنب فرض البحر الأقرب على قراءة شديدة البعد عن الصور المسجلة.
- وحدات مستقلة للقافية وحماية نطاق التعديل والتسجيل. تبقى جداول العروض محدودة؛ هذه النسخة لا تدعي تغطية كل الزحافات والعلل.

### التحقق

`node --test nabra/tests/*.test.mjs` من جذر المستودع.
تشمل الاختبارات حفظ نطاق التعديل، نهايات القافية، الوقف والتنوين، حدود الصوت وصيغته، انتقال النموذج عند نفاد الحصة، وأمثلة الوزن والإخراج السابقة. هي اختبارات تراجع برمجي وليست معيار دقة شامل للبحور أو اللهجات. تسجيل الميكروفون وAAC على iPhone يحتاج تجربة جهاز حقيقية.
