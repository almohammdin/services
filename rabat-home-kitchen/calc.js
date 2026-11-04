document.querySelectorAll('.edition').forEach(edition => {
  const get = key => document.getElementById(edition.lang + '-' + key);
  const form = edition.querySelector('form');
  const list = get('ingredients');
  const result = get('result');
  const t = (ar, fr) => edition.lang === 'ar' ? ar : fr;
  const fmt = new Intl.NumberFormat(t('ar-MA', 'fr-MA'), { numberingSystem: 'latn', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const val = id => get(id).valueAsNumber;
  const ceil = x => Math.ceil((x - 1e-10) * 100) / 100;
  function ingredient(name = '', price = 0, bought = 1, used = 1) {
    const row = document.createElement('div');
    row.className = 'ingredient';
    for (const [label, type, initial, min] of [
      [t('المكوّن','Ingrédient'),'text',name,0],
      [t('ثمن الشراء (درهم)','Prix d’achat (DH)'),'number',price,0],
      [t('الكمية المشتراة','Quantité achetée'),'number',bought,0.001],
      [t('الكمية المستعملة','Quantité utilisée'),'number',used,0]
    ]) {
      const wrap = document.createElement('label');
      const input = document.createElement('input');
      input.type = type;
      input.value = initial;
      if (type === 'number') {input.min = min; input.step = 'any'; input.required = true;}
      wrap.append(label, input);
      row.append(wrap);
    }
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = t('حذف','Retirer');
    remove.onclick = () => {row.remove(); calculate();};
    row.append(remove);
    list.append(row);
    return row;
  }
  const basket = get('basket');
  const budget = get('budget');
  const compare = get('compare');
  const money = n => fmt.format(n) + t(' درهم',' DH');
  const quantity = new Intl.NumberFormat(t('ar-MA','fr-MA'), {numberingSystem:'latn', maximumFractionDigits:4});
  const stockRows = new Map();
  function updateBasket() {
    const orders = val('confirmed'), portions = val('portions');
    let valid = get('confirmed').checkValidity() && get('portions').checkValidity() && list.children.length > 0;
    let total = 0;
    for (const [row, card] of stockRows) {
      if (!list.contains(row)) { card.remove(); stockRows.delete(row); }
    }
    for (const row of list.children) {
      let card = stockRows.get(row);
      if (!card) {
        card = document.createElement('article');
        card.innerHTML = '<h3></h3><label></label><p></p>';
        const stock = document.createElement('input');
        Object.assign(stock, {type:'number', min:'0', step:'any', value:'0', required:true});
        card.querySelector('label').append(t('المتوفر عندك','Stock disponible'),stock);
        stock.oninput = updateBasket;
        basket.append(card);
        stockRows.set(row,card);
      }
      const [name,price,pack,used] = row.querySelectorAll('input');
      card.querySelector('h3').textContent = name.value || t('مكوّن','Ingrédient');
      const stock = card.querySelector('input');
      const ok = [price,pack,used,stock,get('confirmed'),get('portions')].every(i=>i.checkValidity());
      const output = card.querySelector('p');
      if (!ok) { valid=false; output.textContent=t('راجعي الكميات.','Vérifiez les quantités.'); continue; }
      const need = used.valueAsNumber * orders / portions;
      const missing = Math.max(0,need-stock.valueAsNumber);
      const packages = Math.ceil(missing / pack.valueAsNumber - 1e-12) || 0;
      const spend = packages * price.valueAsNumber;
      total += spend;
      output.textContent = t('للتحضير: ','À préparer : ') + quantity.format(need) + t(' · الناقص: ',' · Manque : ') + quantity.format(missing) + t(' · عدد العبوات للشراء: ',' · Paquets à acheter : ') + packages + ' · ' + money(spend);
    }
    budget.textContent = valid ? t('ثمن المشتريات اليوم: ','Budget des courses du jour : ') + money(total) : t('أكملي الوصفة والكميات لحساب اللائحة.','Complétez la recette et les quantités.');
  }
  get('confirmed').oninput = updateBasket;
  function calculate() {
    updateBasket();
    compare.replaceChildren();
    if (!form.checkValidity() || !list.children.length) {
      result.textContent = t('أضيفي مكوّنًا وأكملي القيم. عدد الحصص والمدة والكمية المشتراة أكبر من صفر، والعمولة أقل من 100%.','Ajoutez un ingrédient et vérifiez les valeurs. Portions, durée et quantité achetée positives, commission inférieure à 100 %.');
      return;
    }
    let ingredients = 0;
    for (const row of list.children) {
      const [price, bought, used] = [...row.querySelectorAll('input[type=number]')].map(i => i.valueAsNumber);
      ingredients += price * used / bought;
    }
    const materials = ingredients * (1 + val('waste') / 100);
    const labor = val('minutes') * val('hour') / 60;
    const batch = materials + labor + val('energy');
    const overhead = (val('month') + val('start') / val('months')) / val('volume');
    const perOrder = (val('delivery') + val('fixed')) / val('units');
    const base = batch / val('portions') + val('pack') + overhead;
    const directCost = base + val('direct') / val('units');
    const activation = val('activation') / val('months') / val('volume');
    const cost = base + perOrder + activation;
    const rate = val('rate') / 100;
    const commission = val('price') * rate;
    const margin = val('price') - commission - cost;
    const unknown = t('في انتظار عرض المنصة','En attente de l’offre');
    for (const [label, gain, minimum] of [
      [t('بيع مباشر','Vente directe'), val('price') - directCost, ceil(directCost)],
      [t('بيع عبر التطبيق','Via l’application'), margin, ceil(cost / (1-rate))]
    ]) {
      const card = document.createElement('article');
      const title = document.createElement('h3');
      title.textContent = label;
      const detail = document.createElement('p');
      detail.textContent = Number.isFinite(gain) ? t('يبقى لك في الطبق: ','Marge par plat : ') + money(gain) + t(' · أقل ثمن يغطي المصاريف: ',' · Prix minimum : ') + money(minimum) : unknown;
      card.append(title,detail);
      compare.append(card);
    }
    const rows = [
      [t('المكونات للوصفة قبل الهدر','Ingrédients hors pertes'), ingredients],
      [t('تكلفة الوصفة مع العمل والطاقة والهدر','Préparation complète, travail et pertes inclus'), batch],
      [t('نصيب الطبق من المصاريف الشهرية والتأسيس','Charges mensuelles et démarrage par plat'), overhead],
      [t('تكلفة الطبق قبل العمولة','Coût de revient avant commission'), cost],
      [t('عمولة التطبيق لكل طبق','Commission par plat'), commission],
      [t('الهامش بعد احتساب وقتك','Marge après rémunération du travail'), margin],
      [t('أقل ثمن لتغطية المصاريف','Prix minimum pour couvrir les charges'), ceil(cost / (1 - rate))],
      [t('ثمن البيع لتحقيق الربح المطلوب','Prix de vente pour la marge souhaitée'), ceil((cost + val('target')) / (1 - rate))]
    ];
    result.replaceChildren(...rows.map(([label, amount]) => {
      const box = document.createElement('div');
      const amountLabel = document.createElement('strong');
      amountLabel.textContent = Number.isFinite(amount) ? money(amount) : unknown;
      if (amount < 0) amountLabel.classList.add('loss');
      box.append(label, amountLabel);
      return box;
    }));
  }
  form.onsubmit = e => e.preventDefault();
  ingredient(t('أرز (غرام)','Riz (g)'),18,1000,250);
  ingredient(t('دجاج (غرام)','Poulet (g)'),65,1000,1000);
  ingredient(t('خضر وتوابل (حصة الوصفة)','Légumes et épices (lot)'),15,1,1);
  get('add').onclick = () => {const row = ingredient(); row.querySelector('input').focus();calculate();};
  form.addEventListener('input', calculate);
  edition.kitchen = {list, ingredient, stockRows, calculate};
  calculate();
});

// Preserve old bookmarks and keep the selected topic when changing language.
const topics = {home:'contacts',apps:'contacts',images:'contacts',advice:'plan',terms:'legal',sources:'legal'};
function updateNavigation() {
  const match = location.hash.slice(1).match(/^(ar|fr)-(.*)$/);
  const lang = match?.[1] || 'ar';
  const topic = match?.[2] || 'page';
  if (location.hash === '#ar-page') history.replaceState(null, '', location.pathname + location.search);
  if (topics[topic]) {
    location.replace('#' + lang + '-' + topics[topic]);
    return;
  }
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('header nav a').forEach(link => {
    link.href = '#' + link.lang + '-' + topic;
    if (link.lang === lang) link.setAttribute('aria-current','true');
    else link.removeAttribute('aria-current');
  });
  document.querySelector('.brand').href = '#' + lang + '-page';
}
window.addEventListener('hashchange', updateNavigation);
updateNavigation();
// Carry the working recipe across editions when the reader changes language.
let previousEdition = document.documentElement.lang;
function shareRecipe() {
  const next = document.documentElement.lang;
  if (previousEdition === next) return;
  const source = document.getElementById(previousEdition+'-page');
  const target = document.getElementById(next+'-page');
  previousEdition = next;
  for (const input of source.querySelectorAll('input[id]')) {
    const other = document.getElementById(next + input.id.slice(source.lang.length));
    if (other) other.value = input.value;
  }
  const from = source.kitchen, to = target.kitchen;
  const sampleNames = [
    ['أرز (غرام)','Riz (g)'], ['دجاج (غرام)','Poulet (g)'],
    ['خضر وتوابل (حصة الوصفة)','Légumes et épices (lot)']
  ];
  to.list.replaceChildren();
  for (const row of from.list.children) {
    const [name,price,pack,used] = Array.from(row.querySelectorAll('input'),i=>i.value);
    const sample = sampleNames.find(pair=>pair.includes(name));
    const added = to.ingredient(sample ? sample[next==='ar' ? 0 : 1] : name,price,pack,used);
    added.dataset.stock = from.stockRows.get(row).querySelector('input').value;
  }
  to.calculate();
  for (const [row, card] of to.stockRows) card.querySelector('input').value = row.dataset.stock;
  to.calculate();
}
window.addEventListener('hashchange', shareRecipe);
const workbooks = document.querySelectorAll('.workbook');
let planValues = {};
try { planValues = JSON.parse(localStorage.getItem('rabat-kitchen-plan-v1') || '{}') || {}; } catch {}
function showPlan() {
  for (const input of document.querySelectorAll('[data-plan]')) {
    const saved = planValues[input.dataset.plan];
    if (input.type === 'checkbox') input.checked = saved === true;
    else input.value = typeof saved === 'string' ? saved : '';
  }
}
showPlan();
for (const book of workbooks) {
  const arabic = book.closest('.edition').lang === 'ar';
  book.addEventListener('input', event => {
    const input = event.target;
    if (!input.dataset.plan) return;
    planValues[input.dataset.plan] = input.type === 'checkbox' ? input.checked : input.value;
    let saved = true;
    try {localStorage.setItem('rabat-kitchen-plan-v1',JSON.stringify(planValues));} catch {saved=false;}
    showPlan();
    book.querySelector('.save-state').textContent = saved ? (arabic?'محفوظ على هذا الجهاز':'Enregistré sur cet appareil') : (arabic?'تعذر الحفظ على هذا الجهاز. يمكنك طباعة الخطة.':'Sauvegarde indisponible. Vous pouvez imprimer la fiche.');
  });
  book.querySelector('.print-plan').onclick = () => {
    document.body.classList.add('printing-plan');
    window.print();
  };
}
window.addEventListener('afterprint',()=>document.body.classList.remove('printing-plan'));
