do $seed$
declare
  owner_id uuid;
  item jsonb;
  person jsonb;
  request jsonb;
  c_id uuid;
  p_id uuid;
  p_ids uuid[];
  r_id uuid;
  o_id uuid;
  need_id uuid;
  offer_id uuid;
  counter integer;
begin
  select owner_user_id into owner_id from public.rb_platform_bootstrap where id=1;
  if owner_id is null then raise exception 'Platform owner not initialized'; end if;
  for item in select value from jsonb_array_elements('[{"name":"ريادة الأعمال — مثال","city":"جدة","sector":"ريادة الأعمال","org":"مسرعة نمو الافتراضية","role":"مدير الشراكات","people":[["سارة الهاشمي","شركة بدايات الافتراضية","مؤسسة مشروع","التجارة الإلكترونية","تبحث عن شريك للتوسع"],["عمر السلمي","مسرعة نمو الافتراضية","مدير الشراكات","ريادة الأعمال","يستطيع ترتيب لقاء مع فريق المسرعة"],["لينا الحربي","استوديو فكرة الافتراضي","خبيرة تسويق","التسويق","تقدم جلسة لتطوير خطة الإطلاق"],["ماجد الزهراني","شبكة المستثمرين الافتراضية","مستشار استثمار","الاستثمار","يساعد في تجهيز العرض للمستثمرين"]],"requests":[["أحتاج الوصول إلى مدير الشراكات في مسرعة نمو","أرغب في تجربة شراكة تساعد مشروع متجر إلكتروني على التوسع.",1,"proposed"],["أبحث عن خبير لتطوير خطة إطلاق منتج","أحتاج مراجعة خطة التسويق وترتيب جلسة تعارف.",2,"meeting"]],"need":"مشروع يحتاج شريكًا للتوسع","offer":"وصول إلى فريق شراكات مسرعة نمو"},{"name":"التقنية والتحول — مثال","city":"الرياض","sector":"التقنية","org":"شركة حلول المستقبل الافتراضية","role":"مدير التحول الرقمي","people":[["نورة العتيبي","منصة مدار الافتراضية","مديرة منتج","التقنية","تبحث عن شريك لتجربة نظام إدارة العملاء"],["خالد الدوسري","شركة حلول المستقبل الافتراضية","مستشار تحول رقمي","التقنية","له تواصل مباشر مع مدير التحول الرقمي"],["ريم القحطاني","استوديو تجربة الافتراضي","مصممة تجربة مستخدم","تصميم المنتجات","تقدم مراجعة تجربة الاستخدام"],["فهد الشمري","مركز بيانات الافتراضي","مهندس بيانات","البيانات","يساعد في إعداد مؤشرات الأداء"]],"requests":[["أحتاج مدخلًا إلى فريق التحول الرقمي","أبحث عن جهة لتجربة نظام إدارة العملاء في مشروع تجريبي.",1,"approved"],["أبحث عن خبير بيانات لمراجعة مؤشرات الأداء","الهدف ترتيب لقاء قصير ومراجعة ما يمكن قياسه.",3,"proposed"]],"need":"منصة تحتاج جهة لتجربة نظام إدارة العملاء","offer":"إمكانية ترتيب لقاء مع فريق التحول الرقمي"},{"name":"العقار والمقاولات — مثال","city":"الدمام","sector":"العقار","org":"شركة عمران الافتراضية","role":"مدير المشاريع","people":[["عبدالله اليامي","مكتب أفق الافتراضي","مطور عقاري","العقار","يبحث عن مقاول مناسب لمشروع صغير"],["هند المطيري","شركة عمران الافتراضية","مديرة تطوير أعمال","المقاولات","تستطيع ترتيب لقاء مع مدير المشاريع"],["يوسف الغامدي","استشارات أساس الافتراضية","مستشار مشاريع","إدارة المشاريع","يساعد في مراجعة نطاق المشروع"],["مها العبدلي","استوديو مساحة الافتراضي","مهندسة معمارية","التصميم المعماري","تقدم مراجعة فكرة التصميم"]],"requests":[["أحتاج تعارفًا مع مدير مشاريع شركة عمران","أبحث عن شريك مناسب لتنفيذ مشروع عقاري صغير.",1,"meeting"],["أبحث عن مستشار لمراجعة نطاق المشروع","أحتاج تقدير الخطوات قبل طلب عرض من المقاول.",2,"review"]],"need":"مشروع عقاري يحتاج مقاولًا مناسبًا","offer":"مسار تعارف مع مدير مشاريع شركة عمران"}]'::jsonb) loop
    select id into c_id from public.rb_circles where name=item->>'name' and is_example and created_by=owner_id limit 1;
    if c_id is null then
      insert into public.rb_circles(name,created_by,is_example) values(item->>'name',owner_id,true) returning id into c_id;
    end if;
    insert into public.rb_circle_members(circle_id,user_id,role)
      select c_id,user_id,case when user_id=owner_id then 'owner' else 'member' end from public.rb_profiles
      on conflict(circle_id,user_id) do nothing;
    if exists(select 1 from public.rb_people where circle_id=c_id and is_example) then continue; end if;
    p_ids := '{}';
    counter := 0;
    for person in select value from jsonb_array_elements(item->'people') loop
      counter := counter+1;
      insert into public.rb_people(circle_id,created_by,name,company,role_title,city,field,relationship_owner,relationship_strength,scope,notes,is_example)
        values(c_id,owner_id,person->>0,person->>1,person->>2,item->>'city',person->>3,'عضو من الدائرة — مثال',case when counter=2 then 'strong' else 'medium' end,'circle','مثال افتراضي للتوضيح: '||(person->>4),true) returning id into p_id;
      p_ids := array_append(p_ids,p_id);
      insert into public.rb_relationship_evidence(circle_id,created_by,person_id,target_org,target_role,sector,city,direct_contact,can_request_meeting,prior_help,reciprocal,last_contact_at,scope,notes,is_example)
        values(c_id,owner_id,p_id,case when counter=2 then item->>'org' else person->>1 end,case when counter=2 then item->>'role' else person->>2 end,person->>3,item->>'city',true,counter in(2,3),counter=2,'medium',current_date-7,'circle','علاقة افتراضية تشرح الفرق بين معرفة الاسم والقدرة على ترتيب لقاء.',true);
      insert into public.rb_profile_answers(circle_id,created_by,person_id,question_key,category,answer,source,is_example)
        values
        (c_id,owner_id,p_id,'role_context','professional',to_jsonb(person->>2),'owner',true),
        (c_id,owner_id,p_id,'contribution','professional',to_jsonb(person->>4),'owner',true),
        (c_id,owner_id,p_id,'strength_sectors','professional',jsonb_build_array(person->>3),'owner',true);
    end loop;
    insert into public.rb_knowledge(circle_id,created_by,person_id,type,title,details,tags,city,scope,is_example)
      values(c_id,owner_id,p_ids[1],'need',item->>'need','احتياج افتراضي يوضح كيف تقابله قدرة عضو آخر.',array[item->>'sector'],item->>'city','circle',true) returning id into need_id;
    insert into public.rb_knowledge(circle_id,created_by,person_id,type,title,details,tags,city,scope,is_example)
      values(c_id,owner_id,p_ids[2],'offer',item->>'offer','قدرة افتراضية موثقة بمثال على التواصل المباشر وإمكانية ترتيب اللقاء.',array[item->>'sector'],item->>'city','circle',true) returning id into offer_id;
    insert into public.rb_knowledge(circle_id,created_by,person_id,type,title,details,tags,city,scope,is_example)
      values(c_id,owner_id,p_ids[3],'insight','ابدأ بهدف واضح للقاء','مثال: حدد ما تريد من التعارف قبل طلب تقديمك إلى الشخص المناسب.',array['تعارف',item->>'sector'],item->>'city','circle',true);
    for request in select value from jsonb_array_elements(item->'requests') loop
      insert into public.rb_requests(circle_id,created_by,title,details,target_org,target_sector,target_role,city,scope,is_example)
        values(c_id,owner_id,request->>0,'طلب افتراضي: '||(request->>1),case when (request->>2)::integer=1 then item->>'org' else '' end,item->>'sector',case when (request->>2)::integer=1 then item->>'role' else '' end,item->>'city','circle',true) returning id into r_id;
      insert into public.rb_opportunities(circle_id,created_by,request_id,matched_person_id,title,stage,source_note,is_example)
        values(c_id,owner_id,r_id,p_ids[(request->>2)::integer+1],request->>0,request->>3,'فرصة افتراضية: ترشيح بناءً على القطاع والوصول المباشر والقدرة على ترتيب لقاء.',true) returning id into o_id;
      if (request->>2)::integer=1 then
        insert into public.rb_introductions(circle_id,created_by,request_id,opportunity_id,need_knowledge_id,offer_knowledge_id,title,status,next_action,is_example)
          values(c_id,owner_id,r_id,o_id,need_id,offer_id,'تعارف تجريبي بين صاحب الاحتياج وصاحب القدرة','approval','توضيح الهدف ثم أخذ موافقة الطرفين قبل التعارف.',true);
      end if;
    end loop;
  end loop;
end;
$seed$;
