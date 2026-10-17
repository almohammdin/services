"""Build the Arabic proposal from the source-preserving content inventory."""
from pathlib import Path
import json
from html import escape

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / 'content.json').read_text())
URL = 'https://almohammdin.github.io/services/executive-support/'
ICONS = {
 'checklist': '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="m8 8 1 1 2-2m2 1h3M8 13h1m4 0h3M8 17h1m4 0h3"/>',
 'chat': '<path d="M21 11a8 8 0 0 1-8 8H6l-4 3V11a8 8 0 0 1 8-8h3a8 8 0 0 1 8 8Z"/><path d="M7 9h9M7 13h6"/>',
 'files': '<path d="M14 2H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h5M9 11h6M9 15h6"/>',
 'pen': '<path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15Z"/><path d="M12 20h8"/>',
 'target': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
 'receipt': '<path d="m5 3 2 1 2-1 3 1 3-1 2 1 2-1v18l-2-1-2 1-3-1-3 1-2-1-2 1Z"/><path d="M8 8h8M8 12h8M8 16h4"/>',
 'spark': '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/>',
 'chart': '<path d="M4 3v17h17M8 15l4-5 4 2 5-7"/><path d="M17 5h4v4"/>',
 'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 'search': '<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>',
 'send': '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
 'users': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
 'handshake': '<path d="m2 9 4-4 6 1 6-1 4 4-4 8-3 3-4-1-6-5Z"/><path d="m8 9 3-3m0 0 4 5-2 2-4-3m0 0-3 3m7 0 3 3m-6 0 3 3"/>',
 'shield': '<path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6Z"/><path d="m8 12 3 3 5-6"/>',
 'scale': '<path d="M12 3v18M7 21h10M4 7h16M6 7l-4 7h8ZM18 7l-4 7h8Z"/>',
 'eye': '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
 'equal': '<circle cx="12" cy="12" r="9"/><path d="M7 9h10M7 15h10"/>',
 'flag': '<path d="M5 22V3m0 0c6-4 8 4 14 0v10c-6 4-8-4-14 0"/>',
 'heart': '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
 'download': '<path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/>',
 'print': '<path d="M6 9V3h12v6M6 18H3V9h18v9h-3"/><path d="M6 14h12v7H6Z"/><path d="M17 12h1"/>',
 'share': '<path d="M12 16V3m-4 4 4-4 4 4M5 12H3v9h18v-9h-2"/>',
 'menu': '<path d="M4 6h16M4 12h16M4 18h16"/>',
 'arrow': '<path d="M20 12H4m6-6-6 6 6 6"/>',
 'coffee': '<path d="M3 8h14v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4ZM17 8h2a3 3 0 0 1 0 6h-2M7 2v3M12 2v3"/>',
 'layers': '<path d="m12 2 10 5-10 5L2 7Zm-10 10 10 5 10-5M2 17l10 5 10-5"/>',
 'document-check': '<path d="M14 2H7a2 2 0 0 0-2 2v16h14V7ZM14 2v5h5"/><path d="m8 13 3 3 5-6"/>',
}

def icon(name, cls='', color='#b47a2d'):
    return f'<svg class="icon {cls}" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONS[name]}</svg>'

def text(s):
    s = escape(s)
    for word in ('LinkedIn', 'Notion', 'Asana'):
        s = s.replace(word, f'<bdi class="en" lang="en">{word}</bdi>')
    return s

def brand(cls=''):
    return f'<span class="brand-crop {cls}"><img src="../assets/hatta/logo.webp" alt="حتى لحلول الأعمال" width="1000" height="526"></span>'

def page_head(number, title, intro):
    return f'<div class="print-brand">{brand()}<span>مقترح خدمات المساعدة الإدارية والتنفيذية</span></div><header class="section-heading"><span class="section-number"><bdi>{number:02}</bdi><span> / {title}</span></span><h2>{title}</h2><p>{text(intro)}</p></header>'

def page_foot(number):
    return f'<div class="page-foot"><span>مقترح خدمات · إعداد بانا العقاد</span><span class="page-count"><bdi>{number:02}</bdi><i></i><bdi>06</bdi></span></div>'

GICONS = ['checklist', 'chat', 'files', 'pen', 'target', 'receipt']

def group(index):
    g = DATA['groups'][index]
    tasks = ''.join(f'<li class="task" id="task-{t["id"]}" data-task="{t["id"]}"><span class="task-number"><bdi>{t["id"]}</bdi></span><div><h4>{text(t["title"])}</h4><p>{text(t["text"])}</p></div></li>' for t in g['tasks'])
    return f'<article class="service-group" id="{g["id"]}"><header class="group-head"><span class="icon-box">{icon(GICONS[index])}</span><div><span class="group-kicker">مجال <bdi>{index+1:02}</bdi><i></i>عدد المهام: <bdi>{g["count"]}</bdi></span><h3>{text(g["title"])}</h3></div></header><p class="group-intro">{text(g["intro"])}</p><ol class="task-list">{tasks}</ol></article>'

def flow(items, title, cls=''):
    steps = ''.join(f'<li><span class="flow-icon">{icon(i)}</span><strong>{label}</strong><span class="flow-index"><bdi>{n+1:02}</bdi></span></li>' for n,(i,label) in enumerate(items))
    return f'<figure class="workflow {cls}"><figcaption>{title}</figcaption><ol class="flow">{steps}</ol></figure>'

nav = [('overview','المقترح'),('execution','التنفيذ والمتابعة'),('documentation-section','التوثيق والمحتوى'),('growth','تطوير الأعمال والمالية'),('discovery','جلسة الاكتشاف'),('governance','الحوكمة')]
nav_html = ''.join(f'<a href="#{i}" data-section="{i}">{s}</a>' for i,s in nav)
scope = ''.join(f'<a href="#{g["id"]}" class="scope-item">{icon(GICONS[i])}<span>{text(s)}</span><bdi>{i+1:02}</bdi></a>' for i,(g,s) in enumerate(zip(DATA['groups'],['إدارة المشاريع','علاقات العملاء','التوثيق والعروض','LinkedIn والمحتوى','تطوير الأعمال','المتابعة المالية'])))

cover = f'''
<section class="sheet cover" id="overview" aria-labelledby="proposal-title">
 <div class="cover-top">{brand()}<span class="document-type"><span></span> مقترح خدمات</span></div>
 <div class="hero">
  <div class="hero-copy">
   <span class="eyebrow">تطوير الأعمال والاستشارات</span>
   <h1 id="proposal-title">المساعدة<br>الإدارية والتنفيذية</h1>
   <p class="hero-statement">تحويل التوصيات<br>إلى عمل ومتابعة</p>
   <p class="hero-intro">{text(DATA['cover']['intro'])}</p>
   <div class="attribution"><div><span>إعداد</span><strong>بانا العقاد</strong></div><div><span>مقدم إلى</span><strong>السيد نايف المحمدي</strong></div></div>
  </div>
  <div class="value-map" aria-label="المساعدة الإدارية تربط التحليل والتوصيات بالتنفيذ والمتابعة">
   <span class="map-caption">من الفكرة إلى الإنجاز</span>
   <div class="value-node">{icon('spark')}<div><bdi>01</bdi><strong>تحليل وتوصيات</strong><span>مخرجات استشارية وذكاء اصطناعي</span></div></div>
   <div class="map-connector"><span></span>{icon('arrow')}</div>
   <div class="value-node focal">{icon('checklist', color='#061f56')}<div><bdi>02</bdi><strong>تنظيم وتنفيذ</strong><span>خطط عمل ومواعيد ومهام</span></div></div>
   <div class="map-connector"><span></span>{icon('arrow')}</div>
   <div class="value-node">{icon('chart')}<div><bdi>03</bdi><strong>متابعة وإنجاز</strong><span>تواصل وتقارير وتطوير أعمال</span></div></div>
  </div>
 </div>
 <div class="document-stats"><div><strong><bdi>20</bdi></strong><span>مهمة تنفيذية</span></div><div><strong><bdi>6</bdi></strong><span>مجالات خدمة</span></div><div><strong><bdi>6</bdi></strong><span>أسئلة اكتشاف</span></div></div>
 <div class="scope-nav" aria-label="مجالات الخدمة">{scope}</div>
 {page_foot(1)}
</section>'''

execution = f'''<section class="sheet" id="execution">{page_head(2,'التنفيذ والمتابعة','تنظيم العمل اليومي، وتحويل التوصيات إلى مهام، ومتابعة تطبيقها مع أصحاب المشاريع.')}<div class="service-columns">{group(0)}{group(1)}</div>{flow([('spark','تحليل وتوصيات'),('checklist','قوائم وأدلة عمل'),('users','متابعة التطبيق'),('chart','تقارير الإنجاز')],'مسار المتابعة التنفيذية')}{page_foot(2)}</section>'''

documentation = f'''<section class="sheet" id="documentation-section">{page_head(3,'التوثيق والمحتوى','صياغة المخرجات الاستشارية، وتوثيق خبرة المشاريع، وتطوير الحضور المهني للمدير.')}<div class="service-columns">{group(2)}{group(3)}</div><aside class="deliverables-strip"><span class="strip-title">مخرجات العمل</span><span>{icon('files')}عروض واتفاقيات</span><span>{icon('document-check')}دراسات حالة</span><span>{icon('pen')}مقالات ونشرات</span></aside>{page_foot(3)}</section>'''

growth = f'''<section class="sheet growth-sheet" id="growth">{page_head(4,'تطوير الأعمال والمالية','البحث عن الفرص، ومتابعة مسار المبيعات، ورصد السوق، وتنظيم فواتير المشاريع وميزانياتها.')}<div class="service-columns growth-columns">{group(4)}<div class="finance-column">{group(5)}<aside class="finance-visual" aria-label="المتابعة المالية تشمل المصروفات والإيرادات والتحصيل"><span>متابعة أرقام المشروع</span><div class="money-flow"><span>{icon('receipt')}فواتير وتحصيل</span><span>{icon('chart')}إيرادات ومصروفات</span></div></aside></div></div>{flow([('search','بحث عن عميل'),('send','تواصل أولي'),('chat','جلسة استشارية'),('files','عرض واتفاق'),('handshake','توقيع العقد')],'مسار العميل','client-flow')}{page_foot(4)}</section>'''

questions = ''
question_icons = ['chat','clock','checklist','chart','receipt','coffee']
for n,axis in enumerate(DATA['discovery']['axes']):
    qrows = ''.join(f'<li class="question" data-question="{q["id"]}"><span class="question-number"><bdi>{q["id"]}</bdi></span><div><span class="question-icon">{icon(question_icons[int(q["id"])-1])}</span><p>{text(q["text"])}</p></div></li>' for q in axis['questions'])
    questions += f'<article class="discovery-axis axis-{n}"><div class="axis-heading"><span class="icon-box">{icon("checklist" if n==0 else "chart")}</span><div><span>محور <bdi>{n+1:02}</bdi></span><h3>{text(axis["title"])}</h3></div></div><ol>{qrows}</ol></article>'
discovery = f'''<section class="sheet discovery-sheet" id="discovery">{page_head(5,'جلسة الاكتشاف',DATA['discovery']['intro'])}<div class="discovery-matrix">{questions}</div><div class="discovery-result"><span>{icon('search')}</span><div><h3>فهم التحديات الفعلية للمشروع</h3><p>تجمع الإجابات صورة عن تجربة العميل، وجودة التشغيل، وربحية المنتجات، والتكاليف، والإشغال.</p></div></div>{page_foot(5)}</section>'''

principle_icons = ['scale','eye','equal','flag','shield','heart']
principles = ''.join(f'<div class="principle">{icon(principle_icons[i])}<span>{v}</span></div>' for i,v in enumerate(DATA['governance']['principles']))
bar_labels = ['إدارة المشاريع','علاقات العملاء','التوثيق والعروض','المحتوى التسويقي','تطوير الأعمال','المتابعة المالية']
bars = ''.join(f'<div class="chart-row"><span class="chart-label">{bar_labels[i]}</span><div class="bar-track"><span class="bar bar-{i}" style="width:{g["count"]*20}%"></span></div><strong><bdi>{g["count"]}</bdi></strong></div>' for i,g in enumerate(DATA['groups']))
governance = f'''<section class="sheet governance-sheet" id="governance">{page_head(6,'الحوكمة','تنظيم العلاقة بين أصحاب المصلحة، وتوجيه القرار، وتعزيز كفاءة الأداء واستدامة الأعمال.')}<div class="governance-intro"><span class="governance-symbol">{icon('shield', color='#d2a05a')}</span><p>{text(DATA['governance']['definition'])}</p></div><div class="principles">{principles}</div><div class="governance-bottom"><div class="governance-text"><article><span class="mini-number"><bdi>01</bdi></span><h3>ممارسة مؤسسية</h3><p>{text(DATA['governance']['practice'])}</p></article><article><span class="mini-number"><bdi>02</bdi></span><h3>كفاءة واستدامة</h3><p>{text(DATA['governance']['purpose'])}</p></article></div><figure class="task-chart" role="img" aria-label="توزيع 20 مهمة: إدارة المشاريع 3، علاقات العملاء 3، التوثيق والعروض 3، المحتوى التسويقي 4، تطوير الأعمال 5، المتابعة المالية 2"><figcaption><span>توزيع المهام</span><span><bdi>20</bdi> مهمة</span></figcaption><div class="chart-scale"><span>عدد المهام بحسب مجال الخدمة</span><span><bdi>0</bdi> إلى <bdi>5</bdi></span></div>{bars}</figure></div>{page_foot(6)}</section>'''

html=f'''<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>مقترح المساعدة الإدارية والتنفيذية | حتى</title>
<meta name="description" content="مقترح خدمات المساعدة الإدارية والتنفيذية لتطوير الأعمال والاستشارات. إعداد بانا العقاد، مقدم إلى السيد نايف المحمدي.">
<meta name="author" content="بانا العقاد"><meta name="theme-color" content="#061f56">
<link rel="canonical" href="{URL}"><link rel="icon" href="../assets/hatta/logo.webp" type="image/webp">
<meta property="og:type" content="website"><meta property="og:locale" content="ar_SA"><meta property="og:title" content="المساعدة الإدارية والتنفيذية | حتى"><meta property="og:description" content="مقترح خدمات لتطوير الأعمال والاستشارات. إعداد بانا العقاد."><meta property="og:url" content="{URL}"><meta property="og:image" content="{URL}assets/share-v1.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="مقترح المساعدة الإدارية والتنفيذية بهوية حتى"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{URL}assets/share-v1.png">
<link rel="preload" href="../assets/hatta/fonts/sans-regular.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="../assets/hatta/fonts/sans-medium.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="style.css?v=1"><script src="app.js?v=1" defer></script>
</head>
<body>
<a class="skip-link" href="#overview">انتقل إلى المقترح</a>
<header class="toolbar"><div class="toolbar-inner"><a class="toolbar-brand" href="../" aria-label="منصة حتى">{brand()}</a><nav id="page-nav" aria-label="أقسام المقترح">{nav_html}</nav><div class="toolbar-actions"><button class="icon-button" id="print-button" aria-label="طباعة المقترح" title="طباعة المقترح">{icon('print')}</button><button class="icon-button" id="share-button" aria-label="نسخ رابط المقترح" title="نسخ الرابط">{icon('share')}</button><a class="download-button" href="hatta-executive-support.pdf" download>{icon('download')}<span>تحميل PDF</span></a><button class="icon-button menu-button" id="menu-button" aria-controls="page-nav" aria-expanded="false" aria-label="عرض فهرس المقترح">{icon('menu')}</button></div></div><div class="reading-progress" aria-hidden="true"><span id="reading-progress"></span></div></header>
<main id="proposal">{cover}{execution}{documentation}{growth}{discovery}{governance}</main>
<footer class="site-footer"><div class="footer-inner"><a href="../" aria-label="حتى لحلول الأعمال" class="footer-hatta">{brand()}</a><span class="footer-caption">مقترح خدمات المساعدة الإدارية والتنفيذية<br><span>إعداد بانا العقاد · مقدم إلى السيد نايف المحمدي</span></span><img src="../v2/assets/naif-signature-white.png" width="561" height="262" class="naif-signature" alt="شعار نايف المحمدي"></div></footer><div class="toast" id="toast" role="status" aria-live="polite"></div>
</body></html>'''
(ROOT/'index.html').write_text(html)
print(f'Built {ROOT / "index.html"}; {sum(g["count"] for g in DATA["groups"])} tasks, 6 questions.')
