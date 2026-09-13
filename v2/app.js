(() => {
  "use strict";

  const STORAGE_KEY = "hatta-services-v2-language";
  const SUPPORTED_LANGUAGES = new Set(["ar", "en"]);
  const whatsappNumber = "966506350457";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const META = {
    ar: {
      title: "حتى لحلول الأعمال | حوكمة وقرار ونمو",
      description: "حلول استشارية وأدوات رقمية ومنصات مؤسسية تساعد الملاك ومجالس الإدارة والقيادات على ترتيب القرار في الحوكمة والنمو والشراكات والتحول.",
      socialTitle: "حتى لحلول الأعمال | حوكمة وقرار ونمو",
      socialDescription: "حلول استشارية وأدوات ومنصات تساعد القيادات على ترتيب القرار من التشخيص حتى التطبيق.",
      locale: "ar_SA"
    },
    en: {
      title: "Hatta Business Solutions | Governance, Decisions and Growth",
      description: "Advisory services, decision tools and institutional platforms that help owners, boards and executives structure decisions across governance, growth, partnerships and transformation.",
      socialTitle: "Hatta Business Solutions | Governance, Decisions and Growth",
      socialDescription: "Advisory services, tools and platforms that take business decisions from diagnosis through implementation.",
      locale: "en_US"
    }
  };

  const REQUEST_LABELS = {
    help: { ar: "أحتاج مساعدة في اختيار الحل", en: "I need help choosing the right solution" },
    govcheck: { ar: "فحص صحة الحوكمة", en: "Governance Health Check" },
    "board-evaluator": { ar: "مقيّم مجالس", en: "Board Evaluator" },
    "risk-register": { ar: "مرصد المخاطر المؤسسية", en: "Enterprise Risk Register" },
    "authority-matrix": { ar: "مصفوفة الصلاحيات", en: "Authority Matrix" },
    "growth-path": { ar: "مستكشف مسارات النمو", en: "Growth Path Explorer" },
    tawassu: { ar: "توسع - تقييم الفرع الجديد", en: "Tawassu — New Branch Assessment" },
    "deal-check": { ar: "محرك الفحص المسبق للصفقات", en: "Deal Readiness Check" },
    "partnership-calculator": { ar: "حاسبة الشراكات", en: "Partnership Calculator" },
    "valuation-readiness": { ar: "دليل التقييم والجاهزية", en: "Valuation and Readiness Guide" },
    "ad-compliance": { ar: "فاحص الامتثال الإعلاني", en: "Advertising Compliance Check" },
    objections: { ar: "مخالفات - إعداد الاعتراض", en: "Mukhaalafat — Objection Preparation" },
    "liquidator-guide": { ar: "دليل نطاق عمل المصفي", en: "Liquidator Scope Guide" },
    "institutional-diagnosis": { ar: "التشخيص المؤسسي وخارطة المعالجة", en: "Institutional Diagnosis and Action Map" },
    "governance-authority": { ar: "تأسيس الحوكمة والصلاحيات", en: "Governance and Authority Framework" },
    "boards-committees": { ar: "مجالس الإدارة واللجان", en: "Boards and Committees" },
    "family-business": { ar: "الشركاء والشركات العائلية", en: "Partners and Family Businesses" },
    "risk-compliance": { ar: "المخاطر والامتثال", en: "Risk and Compliance Advisory" },
    "growth-deals": { ar: "النمو والاستثمار والصفقات", en: "Growth, Investment and Deals" },
    restructuring: { ar: "إعادة الهيكلة والتحول", en: "Restructuring and Transformation" },
    liquidation: { ar: "التصفية الاختيارية", en: "Voluntary Liquidation" },
    "monthly-advisory": { ar: "المتابعة الشهرية للحوكمة وتطوير الأعمال", en: "Monthly Governance and Business Development Advisory" },
    consultation: { ar: "جلسة استشارية", en: "Advisory Session" },
    "professional-assessment": { ar: "تقييم مهني", en: "Professional Assessment" },
    "advisory-project": { ar: "مشروع استشاري متكامل", en: "Integrated Advisory Project" },
    "fractional-advisor": { ar: "مستشار غير متفرغ", en: "Fractional Advisor" },
    "executive-mentoring": { ar: "الإرشاد التنفيذي", en: "Executive Mentoring" },
    "board-membership": { ar: "عضوية مجلس أو لجنة", en: "Board or Committee Membership" },
    majalis: { ar: "منصة مجالس", en: "Majalis Platform" },
    emtidad: { ar: "منصة امتداد", en: "Emtidad Platform" }
  };

  const ADVISORY_REQUEST_KEYS = [
    "institutional-diagnosis", "governance-authority", "boards-committees", "family-business",
    "risk-compliance", "growth-deals", "restructuring", "liquidation"
  ];

  const TEXT_EN = {
    "انتقل إلى المحتوى": "Skip to main content",
    "فتح القائمة": "Open menu",
    "الحلول": "Solutions",
    "الأدوات": "Tools",
    "الخدمات": "Advisory",
    "المنصات": "Platforms",
    "عن حتى": "About Hatta",
    "ناقش احتياجك": "Discuss your needs",
    "حتى لحلول الأعمال": "Hatta Business Solutions",
    "نرتب قرار شركتك": "We structure your company’s decisions",
    "قبل أن تكبر التعقيدات": "before complexity grows",
    "نعمل مع الملاك ومجالس الإدارة والقيادات لترتيب الموقف، مقارنة البدائل، وتحويل القرار إلى مسار قابل للتنفيذ في الحوكمة والنمو والشراكات والتحول المؤسسي.": "We work with owners, boards and executives to frame the situation, compare alternatives and turn decisions into an actionable path across governance, growth, partnerships and institutional transformation.",
    "استعرض الحلول": "Explore solutions",
    "مسار القرار": "Decision path",
    "حتى": "Hatta",
    "من موقف معقد": "From a complex situation",
    "إلى قرار قابل للتنفيذ": "To an actionable decision",
    "افهم": "Understand",
    "شخّص الوضع": "Diagnose the situation",
    "قارن": "Compare",
    "وازن البدائل": "Weigh the options",
    "نفذ": "Execute",
    "فعّل القرار": "Put the decision into action",
    "الحل يتشكل بحسب القرار، من التشخيص حتى التطبيق.": "The solution is shaped around the decision, from diagnosis through implementation.",
    "منذ 2007": "Since 2007",
    "خبرة تنفيذية": "Executive experience",
    "من داخل المجلس": "From inside the boardroom",
    "فهم لبيئة القرار": "First-hand decision insight",
    "من التشخيص إلى التطبيق": "From diagnosis to implementation",
    "مسار متكامل": "An integrated path",
    "استشارات وأدوات ومنصات": "Advisory, tools and platforms",
    "حل يناسب الموقف": "A solution matched to the situation",
    "ابدأ من قرارك": "Start with your decision",
    "ما القرار الذي يحتاج إلى ترتيب؟": "Which decision needs structure?",
    "اختر القرار الذي يشغلك الآن، ونربطك بالمسار الأنسب له.": "Choose the decision in front of you, and we will connect it to the right path.",
    "رفع فاعلية المجلس": "Improve board effectiveness",
    "تقييم الأداء، تنظيم الاجتماعات، وتحسين جودة القرارات واللجان.": "Assess performance, structure meetings and improve the quality of board and committee decisions.",
    "شاهد الحلول": "View solutions",
    "ترتيب الحوكمة والصلاحيات": "Structure governance and authority",
    "توضيح الأدوار، الاعتمادات، وعلاقة الملاك بالإدارة التنفيذية.": "Clarify roles, approvals and the relationship between owners and executive management.",
    "رصد المخاطر والامتثال": "Monitor risk and compliance",
    "كشف النقاط الحمراء وترتيب المسؤوليات وخطط المعالجة والمتابعة.": "Identify red flags and structure accountability, mitigation plans and follow-up.",
    "تجهيز النمو والتوسع": "Prepare for growth and expansion",
    "اختبار الفرع الجديد ومسارات النمو وجاهزية المنشأة للاستثمار.": "Assess new branches, growth paths and the company’s investment readiness.",
    "تنظيم الشراكات": "Structure partnerships",
    "توزيع الأدوار والحصص والقرارات قبل بدء الشراكة أو دخول مستثمر.": "Align roles, ownership and decision rights before a partnership or investor entry.",
    "إعادة الهيكلة والتحول": "Restructuring and transformation",
    "مقارنة خيارات الدمج والفصل والتحويل والتصفية الاختيارية.": "Compare merger, separation, conversion and voluntary liquidation options.",
    "أدوات القرار": "Decision tools",
    "أدوات لقرارات أدق": "Tools for sharper decisions",
    "كل أداة مصممة لموقف محدد، وتمنحك قراءة منظمة تساعدك على المقارنة وتحديد الخطوة التالية.": "Each tool is built for a specific situation and provides a structured view to help you compare options and define the next step.",
    "الكل": "All",
    "الحوكمة والمجالس": "Governance and boards",
    "المخاطر والامتثال": "Risk and compliance",
    "النمو والصفقات": "Growth and deals",
    "الشراكات والتحول": "Partnerships and transformation",
    "فحص صحة الحوكمة": "Governance Health Check",
    "قياس وضوح الأدوار والقرارات والضبط الداخلي، ثم ترتيب فجوات الحوكمة حسب الأولوية.": "Assess the clarity of roles, decisions and internal controls, then prioritize governance gaps.",
    "المخرج": "Deliverable",
    "درجة تفصيلية، فجوات وأولويات معالجة": "Detailed score, gaps and treatment priorities",
    "مناسب لـ": "Best for",
    "الملاك والشركاء والمنشآت النامية": "Owners, partners and growing companies",
    "اطلب الوصول": "Request access",
    "مقيّم مجالس": "Board Evaluator",
    "تقييم منظم لأداء المجلس وممارساته، يحول النتائج إلى نقاط قوة وأولويات تطوير قابلة للنقاش.": "A structured assessment of board performance and practices, turning findings into strengths and practical development priorities.",
    "تقرير تقييم ومحاور تحسين المجلس": "Assessment report and board improvement priorities",
    "مجالس الإدارة واللجان وأمناء المجالس": "Boards, committees and board secretaries",
    "اطلب التقييم": "Request an assessment",
    "مرصد المخاطر المؤسسية": "Enterprise Risk Register",
    "بناء سجل حي للمخاطر، يربط الاحتمال والأثر بالمسؤول وخطة المعالجة وحالة المتابعة.": "Build a live risk register linking likelihood and impact to ownership, mitigation and follow-up status.",
    "سجل مخاطر، خريطة حرارية وخطط معالجة": "Risk register, heat map and mitigation plans",
    "الإدارة التنفيذية ولجان المخاطر": "Executive teams and risk committees",
    "اطلب الحل": "Request the solution",
    "مصفوفة": "Authority",
    "الصلاحيات": "Matrix",
    "مصفوفة الصلاحيات": "Authority Matrix",
    "تنظيم من يوصي ويراجع ويعتمد وينفذ في القرارات الإدارية والمالية والتشغيلية.": "Define who recommends, reviews, approves and executes administrative, financial and operational decisions.",
    "مصفوفة قابلة للاعتماد والتحديث": "An approval-ready, maintainable authority matrix",
    "اطلب الإعداد": "Request setup",
    "مستكشف مسارات النمو": "Growth Path Explorer",
    "مقارنة مسارات النمو وتحديد الاتجاه الأنسب وحجم التغيير وفق جاهزية المنشأة.": "Compare growth paths and identify the best direction and scale of change for the company’s readiness.",
    "مقارنة مسارات وتوصية أولية": "Path comparison and an initial recommendation",
    "اطلب التقرير": "Request the report",
    "توسع | قرار الفرع الجديد": "Tawassu | New Branch Decision",
    "تقييم مخاطر واشتراطات الفرع الجديد قبل توقيع العقد والالتزام بالموقع.": "Assess the risks and requirements of a new branch before signing a lease or committing to a location.",
    "مؤشر مخاطر ونقاط حسم قبل التوقيع": "Risk indicator and decision points before signing",
    "محرك الفحص المسبق للصفقات": "Deal Readiness Check",
    "فحص أولي لجاهزية الاستحواذ أو الاندماج، وإبراز الفجوات والإشارات الحمراء قبل التفاوض.": "An initial acquisition or merger readiness review that surfaces gaps and red flags before negotiations.",
    "ملخص جاهزية ونقاط حمراء": "Readiness summary and red flags",
    "اطلب الفحص": "Request a review",
    "حاسبة الشراكات": "Partnership Calculator",
    "تقدير المساهمات وتوزيع الحصص، وكشف البنود التي تحتاج اتفاقا واضحا قبل بدء الشراكة.": "Estimate contributions and ownership allocation, and identify terms that require agreement before the partnership begins.",
    "تقدير المساهمات وتوزيع الحصص، وكشف البنود التي تحتاج إلى اتفاق قبل بدء الشراكة.": "Estimate contributions and ownership allocation, and identify terms that require agreement before the partnership begins.",
    "تقدير حصص وقائمة نقاط اتفاق": "Ownership estimate and agreement checklist",
    "دليل التقييم والجاهزية": "Valuation and Readiness Guide",
    "تقدير استرشادي لقيمة المنشأة وقياس جاهزيتها قبل دخول مستثمر أو مفاوضات البيع والشراكة.": "Develop an indicative business valuation and assess readiness before investor entry, sale or partnership negotiations.",
    "تقدير أولي ومؤشرات جاهزية": "Initial estimate and readiness indicators",
    "فحص الإعلان": "Ad Review",
    "قبل النشر": "Before Publishing",
    "فاحص الامتثال الإعلاني": "Advertising Compliance Check",
    "مراجعة الإعلان وفق نوع الحملة والمحتوى والقنوات، وتحديد النقاط التي تحتاج تعديلا.": "Review an advertisement against its campaign type, content and channels, and identify required changes.",
    "نتيجة فحص وقائمة تعديلات": "Review result and required changes",
    "مخالفات | إعداد الاعتراض": "Mukhaalafat | Objection Preparation",
    "ترتيب بيانات المخالفة وحساب المهلة وتجهيز نص الاعتراض ومعرفة مسار التقديم.": "Structure violation details, calculate the deadline, prepare the objection and identify the submission route.",
    "مسودة اعتراض وبيانات تقديم مرتبة": "Objection draft and organized submission details",
    "دليل نطاق عمل المصفي": "Liquidator Scope Guide",
    "تحديد مهام المصفي ومراحل التصفية والوثائق والمخرجات المطلوبة حتى إقفال الشركة.": "Define the liquidator’s duties, liquidation stages, documents and required deliverables through company closure.",
    "نطاق عمل ومراحل ووثائق مطلوبة": "Scope, stages and required documents",
    "اطلب الدليل": "Request the guide",
    "الاستشارات": "Advisory services",
    "استشارات ترتب القرار من أساسه": "Advisory that structures the decision at its core",
    "نشخص الوضع، نصمم الحل، ونساند المنشأة في التطبيق وفق نطاق ومخرجات متفق عليها.": "We diagnose the situation, design the solution and support implementation against an agreed scope and deliverables.",
    "التشخيص المؤسسي وخارطة المعالجة": "Institutional Diagnosis and Action Map",
    "نفحص علاقة الشركاء بالإدارة، ومسارات القرار، والصلاحيات والوثائق، ثم نرتب مواطن التعطل حسب الأولوية.": "We review the owner–management relationship, decision paths, authorities and documents, then prioritize points of friction.",
    "اطلب الخدمة": "Request the service",
    "تأسيس الحوكمة والصلاحيات": "Governance and Authority Framework",
    "نبني هيكلا عمليا للقرار يجمع الأدوار والصلاحيات والسياسات ومسارات الاعتماد والمتابعة.": "We build a practical decision framework covering roles, authorities, policies, approvals and follow-up.",
    "ناقش المشروع": "Discuss the project",
    "مجالس الإدارة واللجان": "Boards and Committees",
    "ننظم أعمال المجلس واللجان، ونرفع جودة النقاش والقرار والمتابعة والتقييم.": "We structure board and committee work and improve the quality of discussion, decisions, follow-up and evaluation.",
    "ناقش احتياج المجلس": "Discuss your board’s needs",
    "الشركاء والشركات العائلية": "Partners and Family Businesses",
    "نفصل دور المالك عن المدير، وننظم العلاقة بين العائلة والملكية والإدارة وتعاقب الأجيال.": "We distinguish ownership from management and structure the relationship among family, ownership, management and generational succession.",
    "نكشف المخاطر الإدارية والحوكمية، ونحدد المسؤوليات وخطط المعالجة والمتابعة.": "We identify management and governance risks and define accountability, mitigation and follow-up.",
    "اطلب التحليل": "Request the analysis",
    "النمو والاستثمار والصفقات": "Growth, Investment and Deals",
    "نقيم التوسع ونرفع جاهزية المنشأة لدخول مستثمر أو شريك أو تنفيذ استحواذ.": "We assess expansion and prepare the business for an investor, partner or acquisition.",
    "ناقش القرار": "Discuss the decision",
    "نراجع الكيانات والأنشطة والعقود والتراخيص، ثم نقارن مسارات الدمج أو الفصل أو التحويل.": "We review entities, activities, contracts and licenses, then compare merger, separation and conversion paths.",
    "التصفية الاختيارية": "Voluntary Liquidation",
    "نرتب الملف والقرارات ونطاق العمل والمسار النظامي حتى الإغلاق المنظم للشركة.": "We organize the file, decisions, scope and statutory process through an orderly company closure.",
    "المتابعة الشهرية للحوكمة والنمو": "Monthly Governance and Growth Advisory",
    "نساند القيادة دوريا في متابعة القرارات والأولويات والمخاطر وفرص تطوير الأعمال.": "We provide recurring support to track decisions, priorities, risks and business development opportunities.",
    "ناقش نطاق المتابعة": "Discuss the engagement",
    "نطاق المشاركة": "Engagement models",
    "المشاركة التي تناسب قرارك": "An engagement matched to your decision",
    "من جلسة مركزة إلى دور استشاري مستمر داخل بيئة القرار.": "From a focused session to an ongoing advisory role inside the decision environment.",
    "جلسة استشارية": "Advisory Session",
    "قرار محدد": "A specific decision",
    "تقييم مهني": "Professional Assessment",
    "تقرير وتوصيات": "Report and recommendations",
    "مشروع متكامل": "Integrated Project",
    "تشخيص وتصميم وتنفيذ": "Diagnosis, design and implementation",
    "مستشار غير متفرغ": "Fractional Advisor",
    "دعم مستمر": "Ongoing support",
    "إرشاد تنفيذي": "Executive Mentoring",
    "شريك تفكير": "A strategic thought partner",
    "عضوية مجلس أو لجنة": "Board or Committee Membership",
    "قيمة داخل القرار": "Value inside the decision",
    "منصات تدعم العمل المؤسسي": "Platforms that support institutional work",
    "حلول تستخدمها المنشأة وفرقها لتنظيم الاجتماعات والوثائق والمعرفة والمتابعة ضمن تشغيل مستمر.": "Solutions used by organizations and their teams to structure meetings, documents, knowledge and follow-up as part of ongoing operations.",
    "منصة حوكمة الاجتماعات": "Meeting Governance Platform",
    "مجالس": "Majalis",
    "إدارة اجتماعات مجالس الإدارة والجمعيات واللجان من الدعوة وجدول الأعمال حتى المحضر والقرارات والأرشيف.": "Manage board, assembly and committee meetings from invitations and agendas through minutes, decisions and archives.",
    "دعوات وجدول أعمال": "Invitations and agendas",
    "محاضر وقرارات": "Minutes and decisions",
    "وثائق وأرشيف": "Documents and archives",
    "احجز عرضا تجريبيا": "Book a demo",
    "منصة الشركات العائلية": "Family Business Platform",
    "امتداد": "Emtidad",
    "معرفة وأدوات وتجارب تساعد الشركات العائلية على تنظيم العلاقة بين العائلة والملكية والإدارة والاستعداد للانتقال بين الأجيال.": "Knowledge, tools and practical experiences that help family businesses structure family, ownership and management relationships and prepare for generational transition.",
    "الميثاق العائلي": "Family charter",
    "مركز معرفة": "Knowledge center",
    "نماذج وقوائم": "Templates and checklists",
    "اطلب عرض المنصة": "Request a platform demo",
    "محتوى مهني": "Professional insight",
    "نماذج من منهج العمل": "Examples of how we work",
    "محتوى مختار يعرض طريقة تناولنا لملفات الحوكمة والقرار المؤسسي.": "Selected content showing how we approach governance and institutional decision matters.",
    "دليل عام": "General guide",
    "مجلس الإدارة أم المجلس الاستشاري أم المرشد؟": "Board of Directors, Advisory Board or Mentor?",
    "اطلع على المقارنة": "View the comparison",
    "دراسة حالة": "Case study",
    "سياسة مكافآت": "Remuneration Policy",
    "مجلس الإدارة": "Board of Directors",
    "من إشكالية مزمنة إلى سياسة معتمدة": "From a persistent issue to an approved policy",
    "كيف تحول ملف غير مرتب إلى قرار معتمد؟": "How do you turn an unstructured matter into an approved decision?",
    "اقرأ الحالة": "Read the case",
    "دليل تطبيقي": "Practical guide",
    "نوع السهم وفئة السهم": "Share Type and Share Class",
    "كيف تختلف الحقوق وقوة التصويت داخل النوع نفسه؟": "How can rights and voting power differ within the same share type?",
    "النوع والفئة": "Type and class",
    "السهم حصة في الشركة، والفئة تحدد الحقوق التي تحملها هذه الحصة": "A share is an ownership interest; its class defines the rights attached to that interest",
    "السهم يمثل جزءا من رأس مال الشركة، والفئة تحدد الحقوق المرتبطة به": "A share represents part of the company’s capital, while its class defines the rights attached to it",
    "تنطبق التفاصيل الآتية على شركة المساهمة غير المدرجة في السوق المالية؛ وتخضع الشركات المدرجة للوائح هيئة السوق المالية.": "The following details apply to joint-stock companies not listed on the capital market. Listed companies are subject to Capital Market Authority regulations.",
    "نوع السهم": "Share type",
    "يحدد الإطار العام.": "sets the general framework.",
    "فئة السهم": "Share class",
    "تضبط التفاصيل داخل النوع نفسه، مثل عدد الأصوات لكل سهم أو أولوية الأرباح أو شروط الاسترداد.": "sets the details within the same type, such as votes per share, dividend priority or redemption terms.",
    "مثال على اختلاف قوة التصويت": "Voting power example",
    "مثال افتراضي على اختلاف قوة التصويت": "Illustrative voting power example",
    "نفس عدد الأسهم، وقوة تصويت مختلفة": "The same number of shares, with different voting power",
    "مساهم أ": "Shareholder A",
    "100 سهم عادي · الفئة الأولى · 10 أصوات للسهم": "100 ordinary shares · Class A · 10 votes per share",
    "= 1,000 صوت": "= 1,000 votes",
    "مساهم ب": "Shareholder B",
    "100 سهم عادي · الفئة الثانية · صوت واحد للسهم": "100 ordinary shares · Class B · 1 vote per share",
    "= 100 صوت": "= 100 votes",
    "كلاهما يملك 100 سهم عادي، بينما الفئة الأولى تمنح قوة تصويت أعلى لأن عدد الأصوات المرتبط بكل سهم مختلف.": "Both hold 100 ordinary shares, but Class A carries greater voting power because each share has a different number of votes.",
    "نظام الشركات، المادة 108": "Companies Law, Article 108",
    "الأسهم العادية": "Ordinary Shares",
    "ملكية عادية في رأس المال": "Ordinary ownership in the share capital",
    "صاحب السهم العادي يملك حصة في الشركة. ويمكن للنظام الأساس أن يمنح فئات الأسهم العادية أوزانا مختلفة في التصويت.": "An ordinary shareholder owns an interest in the company. The articles of association may assign different voting weights to classes of ordinary shares.",
    "مثال استخدام": "Use case",
    "فئة للمؤسسين بقوة تصويت أعلى، وفئة للمستثمرين بقوة تصويت اعتيادية.": "A founder class with greater voting power and an investor class with standard voting power.",
    "المادة 108، والمادة 53 من اللائحة التنفيذية": "Article 108 and Article 53 of the Implementing Regulations",
    "الأسهم الممتازة": "Preferred Shares",
    "سهم يمنح أولوية مالية": "A share carrying financial priority",
    "يمكن أن تمنح شروط الإصدار أولوية على الأسهم العادية، مثل نسبة ثابتة سنوية من أرباح الشركة عند وجود أرباح سنوية كافية، أو نسبة أعلى من أصحاب الأسهم العادية.": "The terms of issue may grant priority over ordinary shares, such as a fixed annual percentage of profits when sufficient annual profits exist, or a higher distribution than ordinary shareholders receive.",
    "فئة مستثمرين يراد منحها أولوية في الأرباح ضمن شروط الإصدار.": "An investor class intended to receive priority in profit distributions under the terms of issue.",
    "نظام الشركات، المادة 108 · اللائحة التنفيذية، المادتان 51 و53": "Companies Law, Article 108 · Implementing Regulations, Articles 51 and 53",
    "الأسهم القابلة للاسترداد": "Redeemable Shares",
    "معنى الاسترداد هنا: الشركة تسترد هذه الأسهم من المساهم مقابل دفع قيمة الاسترداد له": "Redemption means that the company buys these shares back from the shareholder in exchange for the stated redemption value",
    "عند إصدار هذه الفئة تكتب الشروط التي تحدد وقت ممارسة الشركة لخيار الاسترداد وطريقة حساب قيمته. عندما تمارس الشركة الخيار، تدفع للمساهم قيمة الاسترداد عن الأسهم المحددة، ثم تلغى الأسهم المستردة وفق الإجراءات النظامية.": "When this class is issued, its terms specify when the company may exercise the redemption option and how the value is calculated. When exercised, the company pays the shareholder the redemption value for the specified shares, which are then cancelled under the applicable procedures.",
    "من يسترد؟": "Who redeems?",
    "الشركة نفسها تمارس خيار الاسترداد.": "The company itself exercises the redemption option.",
    "ماذا تسترد؟": "What is redeemed?",
    "الأسهم القابلة للاسترداد التي سبق أن أصدرتها.": "The redeemable shares previously issued by the company.",
    "ممن تسترد؟": "From whom?",
    "من المساهم الذي يملك تلك الأسهم.": "From the shareholder who owns those shares.",
    "ما المقابل؟": "What is paid?",
    "تدفع للمساهم قيمة الاسترداد وفق السعر أو المعادلة المكتوبة في شروط الإصدار.": "The shareholder receives the redemption value based on the price or formula stated in the terms of issue.",
    "مثال تطبيقي افتراضي: إصدار 10,000 سهم قابل للاسترداد": "Illustrative example: issuing 10,000 redeemable shares",
    "الإصدار": "Issue",
    "تصدر شركة المشروع 10,000 سهم قابل للاسترداد بقيمة": "The project company issues 10,000 redeemable shares at",
    "للسهم، بإجمالي": "per share, for a total of",
    "شرط الاسترداد": "Redemption term",
    "يكتب في النظام الأساس وقرار الإصدار أن للشركة خيار استرداد هذه الأسهم بعد 3 سنوات بسعر": "The articles of association and issue resolution state that the company may redeem the shares after 3 years at",
    "للسهم.": "per share.",
    "ممارسة الخيار": "Exercising the option",
    "بعد مضي 3 سنوات تمارس الشركة الخيار، وتدفع قيمة الاسترداد للمساهم، ثم تلغى الأسهم المستردة وفق الإجراءات النظامية.": "After 3 years, the company exercises the option, pays the shareholder the redemption value and cancels the redeemed shares under the applicable procedures.",
    "بعد مضي 3 سنوات تقرر الشركة ممارسة خيار الاسترداد وفقا للشرط المكتوب.": "After 3 years, the company decides to exercise the redemption option under the written term.",
    "النتيجة": "Outcome",
    "تدفع الشركة للمساهم": "The company pays the shareholder",
    "، وتلغى الأسهم المستردة، وتستكمل إجراءات تخفيض رأس المال المرتبطة بالاسترداد.": ", cancels the redeemed shares and completes the capital reduction procedures associated with the redemption.",
    "مقارنة أنواع الأسهم": "Share type comparison",
    "ماذا يمنح كل نوع من الأسهم؟": "What does each share type provide?",
    "التصويت والأولوية المالية والاسترداد تختلف بحسب نوع السهم وشروط الإصدار.": "Voting, financial priority and redemption vary by share type and the terms of issue.",
    "المحور": "Feature",
    "حق التصويت": "Voting rights",
    "نعم": "Yes",
    "لا": "No",
    "أولوية في الأرباح": "Dividend priority",
    "اعتيادية": "Standard",
    "بحسب شروط الإصدار": "Subject to the terms of issue",
    "استرداد السهم من الشركة": "Redemption by the company",
    "الاسترداد كخاصية للنوع": "Redemption as a feature of the share type",
    "ليس من خصائص النوع": "Not a feature of this share type",
    "نعم، وفق شروط الإصدار": "Yes, subject to the terms of issue",
    "تعدد الفئات": "Multiple classes",
    "سقف %50 المشترك": "Combined 50% cap",
    "خارج السقف": "Outside the cap",
    "ينطبق": "Applies",
    "الاستخدام الأقرب": "Typical use",
    "الملكية والتصويت": "Ownership and voting",
    "الأولوية المالية": "Financial priority",
    "الاسترداد وفق شروط الإصدار": "Redemption under the terms of issue",
    "المادة 53 من اللائحة التنفيذية تورد حالة استثنائية للتصويت عند بقاء النسبة المقررة من الأرباح مستحقة لمدة 3 سنوات متتالية، ويكون التصويت بصوت واحد لكل سهم حتى دفع الأرباح السابقة.": "Article 53 of the Implementing Regulations provides an exceptional voting case when the prescribed profit entitlement remains unpaid for 3 consecutive years. Each share then carries one vote until the outstanding profits are paid.",
    "لا تمنح الأسهم الممتازة أو القابلة للاسترداد حق التصويت في الجمعيات العامة. وإذا نصت شروط الإصدار على نسبة الأرباح المشار إليها، وكانت لدى الشركة أرباح سنوية كافية ولم توزع النسبة 3 سنوات متتالية، جاز للجمعية الخاصة لأصحاب الفئة أن تقرر مشاركتهم في التصويت بصوت واحد لكل سهم، إلى أن تدفع الشركة أرباح السنوات السابقة.": "Preferred and redeemable shares do not carry voting rights in general assemblies. If the terms of issue provide for the stated profit percentage, the company has sufficient annual profits and that percentage remains undistributed for 3 consecutive years, the special assembly of that class may resolve to let its holders vote at one vote per share until the company pays the outstanding profits.",
    "المادة 51 تجعل الأسهم الممتازة والقابلة للاسترداد وفئاتها مجتمعة ضمن سقف %50 من رأس المال.": "Article 51 places preferred and redeemable shares, including all of their classes, under a combined cap of 50% of the share capital.",
    "نظام الشركات": "Companies Law",
    "، المادتان 107 و108، والمادة 110 عند تعديل حقوق الفئات؛ و": ", Articles 107 and 108, and Article 110 when class rights are amended; and the ",
    "اللائحة التنفيذية للشركات غير المدرجة": "Implementing Regulations for Unlisted Companies",
    "، المادتان 51 و53. الحد الأقصى المشترك للأسهم الممتازة والقابلة للاسترداد هو %50 من رأس مال الشركة غير المدرجة.": ", Articles 51 and 53. The combined maximum for preferred and redeemable shares is 50% of the unlisted company’s share capital.",
    "المرجع:": "Reference:",
    "نظام الشركات، المادتان 108 و110، واللائحة التنفيذية، المادتان 51 و53. الحد الأقصى للأسهم الممتازة والقابلة للاسترداد هو %50 من رأس مال الشركة.": "Companies Law, Articles 108 and 110, and Implementing Regulations, Articles 51 and 53. Preferred and redeemable shares may not exceed 50% of the company’s share capital.",
    "الأثر": "Impact",
    "أثر يمكن قياسه": "Measurable impact",
    "نماذج مختارة من أعمال سابقة في الجاهزية المؤسسية والتطوير والاستثمار والحوكمة.": "Selected outcomes from previous work in institutional readiness, development, investment and governance.",
    "مليون": "million",
    "أثر تقديري لبرنامج جاهزية مؤسسية": "Estimated impact of an institutional readiness program",
    "إعادة هيكلة وبناء بنية مؤسسية ودراسات توسع وشراكات في قطاع التعليم.": "Restructuring, institutional design, expansion studies and partnerships in the education sector.",
    "نمو الإيرادات خلال 3 سنوات": "Revenue growth over 3 years",
    "تطوير برنامج وقفي وبناء مصادر تمويل وتحسين المتابعة والتقارير الشهرية.": "Developing an endowment program, building funding sources and improving monthly follow-up and reporting.",
    "توسع قاعدة المشتركين": "Subscriber base growth",
    "تحويل برنامج مساهمات إلى مورد مستدام عبر الاستقطاب والبيانات والحوكمة التشغيلية.": "Turning a contribution program into a sustainable resource through acquisition, data and operating governance.",
    "محفظة ضمن إطار حوكمي": "Portfolio under a governance framework",
    "ربط القرارات بين مجلس النظارة ولجنة الاستثمار ورفع توصيات مدعومة بالتحليل.": "Connecting decisions between the board of trustees and investment committee, supported by evidence-based recommendations.",
    "ثقة ممتدة": "Trusted relationships",
    "نماذج من الجهات التي عملنا معها": "Selected organizations we have worked with",
    "نرتب الطريق حتى تصل الأعمال": "We structure the path so business can move forward",
    "فهم واقعي لبيئة القرار": "A practical understanding of the decision environment",
    "تعمل حتى مع المنشآت التي تملك فرصة حقيقية للنمو، وتحتاج قراراتها وصلاحياتها وهياكلها إلى مزيد من التنظيم. نجمع بين الاستشارة والأداة والتطبيق لبناء قرارات منظمة وقابلة للتنفيذ.": "Hatta works with businesses that have genuine growth potential and need greater structure across decisions, authority and organization. We combine advisory, tools and implementation to build structured, actionable decisions.",
    "يقود حتى نايف المحمدي": "Hatta is led by Naif Al-Mohammdi",
    "مؤسس الشركة ومستشار الحوكمة وتطوير الأعمال، بخبرة تنفيذية ممتدة منذ 2007 في الإدارة ومجالس الإدارة والشراكات وتطوير الأعمال.": "Founder and Governance and Business Development Advisor, with executive experience since 2007 across management, boards, partnerships and business development.",
    "ابدأ بالقرار الذي أمامك الآن": "Start with the decision in front of you",
    "اختر المجال، واكتب وصفا مختصرا للوضع والنتيجة المطلوبة. نراجع الاحتياج ونقترح المسار الأنسب له.": "Choose the area and briefly describe the situation and desired outcome. We will review the need and recommend the most suitable path.",
    "فهم الاحتياج": "Understand the need",
    "تحديد النطاق": "Define the scope",
    "اقتراح المسار": "Recommend the path",
    "الخدمة أو الحل": "Service or solution",
    "وصف مختصر للاحتياج": "Brief description of your need",
    "إرسال الاحتياج عبر واتساب": "Send your request via WhatsApp",
    "سيفتح واتساب برسالة مرتبة يمكنك مراجعتها قبل الإرسال.": "WhatsApp will open with a prepared message that you can review before sending.",
    "الحوكمة وتطوير الأعمال": "Governance and Business Development",
    "تم اختيار الحل. أكمل وصف احتياجك.": "Solution selected. Add a brief description of your need.",
    "←": "→"
  };

  const ATTRIBUTE_EN = {
    "حتى لحلول الأعمال - الصفحة الرئيسية": "Hatta Business Solutions — Home",
    "حتى لحلول الأعمال": "Hatta Business Solutions",
    "التنقل الرئيسي": "Main navigation",
    "من موقف معقد إلى قرار قابل للتنفيذ": "From a complex situation to an actionable decision",
    "عناصر الثقة": "Trust indicators",
    "تصفية الأدوات": "Filter tools",
    "معاينة فحص صحة الحوكمة": "Governance Health Check preview",
    "معاينة مقيّم مجالس": "Board Evaluator preview",
    "مرصد المخاطر المؤسسية": "Enterprise Risk Register",
    "معاينة مصفوفة الصلاحيات": "Authority Matrix preview",
    "معاينة مستكشف مسارات النمو": "Growth Path Explorer preview",
    "معاينة أداة توسع": "Tawassu tool preview",
    "محرك الفحص المسبق للصفقات": "Deal Readiness Check",
    "معاينة حاسبة الشراكات": "Partnership Calculator preview",
    "معاينة دليل التقييم والجاهزية": "Valuation and Readiness Guide preview",
    "معاينة فاحص الامتثال الإعلاني": "Advertising Compliance Check preview",
    "معاينة أداة مخالفات": "Mukhaalafat tool preview",
    "معاينة دليل نطاق عمل المصفي": "Liquidator Scope Guide preview",
    "مجالس": "Majalis",
    "امتداد": "Emtidad",
    "مقارنة مجلس الإدارة والمجلس الاستشاري والمرشد": "Comparison of a board of directors, advisory board and mentor",
    "تفاصيل الاسترداد": "Redemption details",
    "مدارس الأقصى الأهلية والعالمية": "Al-Aqsa Private and International Schools",
    "ويند كافيه": "Wind Cafe",
    "ريادة للفنادق والمنتجعات": "Riyadah Hotels and Resorts",
    "منيف النهدي": "Munif Al-Nahdi",
    "منيف عامر النهدي وشركاه": "Munif Amer Al-Nahdi & Partners",
    "مواشي": "Mawashi",
    "المدينة للبلاستيك": "Al Madinah Plastics",
    "جمعية ملاك المطاعم والمقاهي": "Restaurant and Cafe Owners Association",
    "عميل سابق": "Former client",
    "شركة المقطورة الدولية": "International Trailer Company",
    "بحري": "Bahri",
    "حسابات التواصل": "Social profiles",
    "إكس": "X",
    "لينكدإن": "LinkedIn",
    "سناب شات": "Snapchat",
    "لينك تري": "Linktree",
    "مثال: شركة عائلية في مرحلة توسع ونحتاج ترتيب الصلاحيات قبل دخول مستثمر.": "Example: A family business is expanding and needs to structure authority before bringing in an investor."
  };

  const UI = {
    ar: {
      openMenu: "فتح القائمة", closeMenu: "إغلاق القائمة", switchLabel: "Switch to English", switchText: "EN", switchLanguage: "en", switchDirection: "ltr",
      languageStatus: "تم التحويل إلى العربية", toolsGroup: "الأدوات الرقمية", advisoryGroup: "الخدمات الاستشارية", servicesGroup: "الخدمات والمنصات",
      whatsappIntro: "السلام عليكم، اطلعت على صفحة حتى لحلول الأعمال.", whatsappSelection: "الخدمة أو الحل", whatsappDetails: "وصف الاحتياج",
      whatsappFallback: "أرغب في مناقشة الاحتياج ومعرفة المسار المناسب."
    },
    en: {
      openMenu: "Open menu", closeMenu: "Close menu", switchLabel: "التحويل إلى العربية", switchText: "العربية", switchLanguage: "ar", switchDirection: "rtl",
      languageStatus: "Switched to English", toolsGroup: "Decision Tools", advisoryGroup: "Advisory Services", servicesGroup: "Engagement Models and Platforms",
      whatsappIntro: "Hello, I reviewed the Hatta Business Solutions page.", whatsappSelection: "Service or solution", whatsappDetails: "Need summary",
      whatsappFallback: "I would like to discuss my needs and identify the most suitable path."
    }
  };

  const header = document.querySelector("[data-header]");
  const menuButton = document.querySelector("[data-menu-button]");
  const menuLabel = menuButton?.querySelector(".sr-only");
  const nav = document.querySelector("[data-nav]");
  const languageToggle = document.querySelector("[data-language-toggle]");
  const languageToggleText = languageToggle?.querySelector("span");
  const languageStatus = document.querySelector("[data-language-status]");
  const filterButtons = [...document.querySelectorAll("[data-filter]")];
  const toolCards = [...document.querySelectorAll("[data-category]")];
  const requestButtons = [...document.querySelectorAll("[data-request]")];
  const requestSelect = document.querySelector("[data-request-select]");
  const contactForm = document.querySelector("[data-contact-form]");
  const detailsField = document.querySelector("#request-details");
  const toast = document.querySelector("[data-toast]");
  const main = document.querySelector("main");
  const structuredDataElement = document.querySelector('script[type="application/ld+json"]');
  const filterAnimations = new WeakMap();
  let languageAnimation;
  let toastTimer;
  let currentLanguage = document.documentElement.lang === "en" ? "en" : "ar";

  const getStoredLanguage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return SUPPORTED_LANGUAGES.has(stored) ? stored : null;
    } catch (error) {
      return null;
    }
  };

  const getInitialLanguage = () => {
    const queryLanguage = new URLSearchParams(window.location.search).get("lang");
    if (SUPPORTED_LANGUAGES.has(queryLanguage)) return queryLanguage;
    return getStoredLanguage() || currentLanguage;
  };

  const normalizeRequestKey = (key) => (Object.hasOwn(REQUEST_LABELS, key) ? key : "help");

  const ensureAdvisoryOptions = () => {
    if (!requestSelect) return;
    const existingKeys = new Set([...requestSelect.options].map((option) => option.value));
    const firstServicesGroup = requestSelect.querySelectorAll("optgroup")[1] || null;
    let advisoryGroup = requestSelect.querySelector("[data-advisory-options]");
    if (!advisoryGroup) {
      advisoryGroup = document.createElement("optgroup");
      advisoryGroup.dataset.advisoryOptions = "";
      requestSelect.insertBefore(advisoryGroup, firstServicesGroup);
    }
    ADVISORY_REQUEST_KEYS.forEach((key) => {
      if (existingKeys.has(key)) return;
      const option = document.createElement("option");
      option.value = key;
      option.textContent = REQUEST_LABELS[key].ar;
      advisoryGroup.append(option);
      existingKeys.add(key);
    });
  };

  ensureAdvisoryOptions();

  const shouldSkipTextNode = (node) => {
    const parent = node.parentElement;
    return !parent || parent.matches("script, style, noscript, option");
  };

  const textRecords = [];
  const textWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let textNode = textWalker.nextNode();
  while (textNode) {
    if (!shouldSkipTextNode(textNode)) {
      const source = textNode.nodeValue.trim();
      if (Object.hasOwn(TEXT_EN, source)) {
        textRecords.push({ node: textNode, ar: source, leading: textNode.nodeValue.match(/^\s*/)?.[0] || "", trailing: textNode.nodeValue.match(/\s*$/)?.[0] || "" });
      }
    }
    textNode = textWalker.nextNode();
  }

  const attributeRecords = [];
  document.querySelectorAll("[alt], [aria-label], [placeholder]").forEach((element) => {
    ["alt", "aria-label", "placeholder"].forEach((attribute) => {
      if (!element.hasAttribute(attribute) || element === languageToggle) return;
      const source = element.getAttribute(attribute);
      const english = ATTRIBUTE_EN[source] || TEXT_EN[source];
      if (english) attributeRecords.push({ element, attribute, ar: source, en: english });
    });
  });

  const updateMeta = (language) => {
    const meta = META[language];
    document.title = meta.title;
    [
      ['meta[name="description"]', meta.description], ['meta[property="og:locale"]', meta.locale],
      ['meta[property="og:title"]', meta.socialTitle], ['meta[property="og:description"]', meta.socialDescription],
      ['meta[name="twitter:title"]', meta.socialTitle], ['meta[name="twitter:description"]', meta.socialDescription]
    ].forEach(([selector, value]) => document.querySelector(selector)?.setAttribute("content", value));

    if (!structuredDataElement) return;
    try {
      const data = JSON.parse(structuredDataElement.textContent);
      data.name = language === "en" ? "Hatta Business Solutions" : "حتى لحلول الأعمال";
      data.alternateName = language === "en" ? "حتى لحلول الأعمال" : "Hatta Business Solutions";
      data.description = language === "en"
        ? "Advisory services, decision tools and institutional platforms in governance and business development."
        : "خدمات استشارية وأدوات رقمية ومنصات مؤسسية في الحوكمة وتطوير الأعمال.";
      if (data.founder) {
        data.founder.name = language === "en" ? "Naif Al-Mohammdi" : "نايف المحمدي";
        data.founder.jobTitle = language === "en" ? "Governance and Business Development Advisor" : "مستشار الحوكمة وتطوير الأعمال";
      }
      structuredDataElement.textContent = JSON.stringify(data);
    } catch (error) {
      // Keep the valid static structured data if it cannot be parsed.
    }
  };

  const updateRequestOptions = (language) => {
    if (!requestSelect) return;
    const selected = requestSelect.value;
    [...requestSelect.options].forEach((option) => {
      const labels = REQUEST_LABELS[option.value];
      if (labels) option.textContent = labels[language];
    });
    const groups = [...requestSelect.querySelectorAll("optgroup")];
    const standardGroups = groups.filter((group) => !group.hasAttribute("data-advisory-options"));
    const advisoryGroup = requestSelect.querySelector("[data-advisory-options]");
    if (standardGroups[0]) standardGroups[0].label = UI[language].toolsGroup;
    if (advisoryGroup) advisoryGroup.label = UI[language].advisoryGroup;
    if (standardGroups[1]) standardGroups[1].label = UI[language].servicesGroup;
    requestSelect.value = Object.hasOwn(REQUEST_LABELS, selected) ? selected : "help";
  };

  const syncMenuLabel = () => {
    if (!menuLabel || !menuButton) return;
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuLabel.textContent = isOpen ? UI[currentLanguage].closeMenu : UI[currentLanguage].openMenu;
  };

  const animateLanguageChange = () => {
    if (reducedMotion || !main?.animate) return;
    languageAnimation?.cancel();
    languageAnimation = main.animate(
      [{ opacity: 0.84, transform: "translateY(4px)" }, { opacity: 1, transform: "translateY(0)" }],
      { duration: 220, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
    );
  };

  const updateLanguageUrl = (language) => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("lang", language);
      window.history.replaceState(window.history.state, "", url);
    } catch (error) {
      // Language still works when History API access is unavailable.
    }
  };

  const applyLanguage = (language, { announce = false, persist = false, updateUrl = false, animate = false } = {}) => {
    currentLanguage = SUPPORTED_LANGUAGES.has(language) ? language : "ar";
    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = currentLanguage === "en" ? "ltr" : "rtl";
    document.documentElement.dataset.language = currentLanguage;
    textRecords.forEach((record) => {
      const value = currentLanguage === "en" ? TEXT_EN[record.ar] : record.ar;
      record.node.nodeValue = `${record.leading}${value}${record.trailing}`;
    });
    attributeRecords.forEach((record) => record.element.setAttribute(record.attribute, currentLanguage === "en" ? record.en : record.ar));
    updateRequestOptions(currentLanguage);
    updateMeta(currentLanguage);
    syncMenuLabel();
    if (languageToggle && languageToggleText) {
      const ui = UI[currentLanguage];
      languageToggle.setAttribute("aria-label", ui.switchLabel);
      languageToggleText.textContent = ui.switchText;
      languageToggleText.lang = ui.switchLanguage;
      languageToggleText.dir = ui.switchDirection;
    }
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, currentLanguage); } catch (error) {}
    }
    if (updateUrl) updateLanguageUrl(currentLanguage);
    if (animate) animateLanguageChange();
    if (announce && languageStatus) languageStatus.textContent = UI[currentLanguage].languageStatus;
  };

  const closeMenu = () => {
    if (!menuButton || !nav) return;
    menuButton.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    syncMenuLabel();
  };

  const openMenu = () => {
    if (!menuButton || !nav) return;
    menuButton.setAttribute("aria-expanded", "true");
    nav.classList.add("is-open");
    document.body.classList.add("menu-open");
    syncMenuLabel();
  };

  languageToggle?.addEventListener("click", () => {
    closeMenu();
    applyLanguage(currentLanguage === "ar" ? "en" : "ar", { announce: true, persist: true, updateUrl: true, animate: true });
  });
  menuButton?.addEventListener("click", () => menuButton.getAttribute("aria-expanded") === "true" ? closeMenu() : openMenu());
  nav?.addEventListener("click", (event) => { if (event.target.closest("a")) closeMenu(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeMenu(); });
  document.addEventListener("click", (event) => {
    if (!nav?.classList.contains("is-open")) return;
    if (!event.target.closest("[data-nav]") && !event.target.closest("[data-menu-button]")) closeMenu();
  });

  const updateHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 16);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const animateFilteredCard = (card) => {
    if (reducedMotion || !card.animate) return;
    filterAnimations.get(card)?.cancel();
    const animation = card.animate(
      [{ opacity: 0, transform: "translateY(8px) scale(0.985)" }, { opacity: 1, transform: "translateY(0) scale(1)" }],
      { duration: 230, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
    );
    filterAnimations.set(card, animation);
  };

  const setFilter = (filter, animate = true) => {
    filterButtons.forEach((button) => {
      const active = button.dataset.filter === filter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    toolCards.forEach((card) => {
      const categories = (card.dataset.category || "").split(/\s+/);
      const visible = filter === "all" || categories.includes(filter);
      if (!visible) filterAnimations.get(card)?.cancel();
      card.hidden = !visible;
      if (visible) {
        card.classList.add("is-visible");
        if (animate) animateFilteredCard(card);
      }
    });
  };

  filterButtons.forEach((button) => button.addEventListener("click", () => setFilter(button.dataset.filter || "all")));
  document.querySelectorAll("[data-focus-filter]").forEach((link) => link.addEventListener("click", () => setFilter(link.dataset.focusFilter || "all")));

  const showToast = () => {
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
  };

  const selectRequest = (requestedKey) => {
    if (!requestSelect) return;
    const key = normalizeRequestKey(requestedKey);
    requestSelect.value = key;
    if (requestSelect.value !== key) requestSelect.value = "help";
    document.querySelector("#contact")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    showToast();
    window.setTimeout(() => { if (!reducedMotion) detailsField?.focus({ preventScroll: true }); }, reducedMotion ? 0 : 650);
  };

  requestButtons.forEach((button) => button.addEventListener("click", () => selectRequest(button.dataset.request || "help")));

  contactForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const selectedKey = normalizeRequestKey(requestSelect?.value || "help");
    const selectedLabel = REQUEST_LABELS[selectedKey][currentLanguage];
    const details = detailsField?.value.trim();
    const ui = UI[currentLanguage];
    const message = [
      ui.whatsappIntro,
      `${ui.whatsappSelection}: ${selectedLabel}.`,
      details ? `${ui.whatsappDetails}: ${details}` : ui.whatsappFallback
    ].join("\n\n");
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  });

  document.querySelectorAll("[data-year]").forEach((element) => { element.textContent = String(new Date().getFullYear()); });
  applyLanguage(getInitialLanguage());

  const revealItems = [...document.querySelectorAll(".reveal")];
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -35px" });
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  const sectionLinks = [...document.querySelectorAll(".main-nav a[href^='#']")];
  const sections = sectionLinks.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      sectionLinks.forEach((link) => link.classList.toggle("is-active", link.getAttribute("href") === `#${visible.target.id}`));
    }, { threshold: [0.2, 0.45], rootMargin: "-25% 0px -55%" });
    sections.forEach((section) => sectionObserver.observe(section));
  }
})();
