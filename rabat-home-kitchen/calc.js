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
  function calculate() {
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
    const cost = batch / val('portions') + val('pack') + overhead + perOrder;
    const rate = val('rate') / 100;
    const commission = val('price') * rate;
    const margin = val('price') - commission - cost;
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
      amountLabel.textContent = fmt.format(amount) + t(' درهم',' DH');
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
  calculate();
});

// Preserve old bookmarks and keep the selected topic when changing language.
const topics = {home:'contacts',apps:'contacts',images:'contacts',advice:'plan',terms:'legal',sources:'legal'};
function updateNavigation() {
  const match = location.hash.slice(1).match(/^(ar|fr)-(.*)$/);
  const lang = match?.[1] || 'ar';
  const topic = match?.[2] || 'page';
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
