
(function(){
'use strict';

/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const pad=n=>n<10?'0'+n:''+n;
const ds=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const pd=s=>{const a=s.split('-');return new Date(+a[0],+a[1]-1,+a[2])};
const addDays=(d,n)=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()+n);return x};
const today=()=>{const n=new Date();return new Date(n.getFullYear(),n.getMonth(),n.getDate())};
const sameDay=(a,b)=>ds(a)===ds(b);
const mkFmt=o=>({format:d=>new Intl.DateTimeFormat(ui.lang==='ar'?'ar-EG-u-nu-latn':'en-GB',o).format(d)});
const fmtLong=mkFmt({weekday:'long',day:'numeric',month:'long'});
const fmtShort=mkFmt({day:'numeric',month:'short'});
const fmtDay=mkFmt({weekday:'long'});
const fmtMon=mkFmt({month:'short'});
const fmtMonLong=mkFmt({month:'long',year:'numeric'});
const fmtMonShortY=mkFmt({month:'short',year:'2-digit'});
const DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const dowTxt=(i,len)=>ui.lang==='ar'?(len===1?['ح','ن','ث','ر','خ','ج','س'][i]:['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'][i]):DOW[i].slice(0,len);
const pct=v=>v==null?'–':Math.round(v*100)+'%';
const nf=n=>Math.round(n).toLocaleString('en-US');
const nf1=n=>(Math.round(n*10)/10).toLocaleString('en-US');

/* ---------- constants ---------- */
const AREAS=[
  {id:'faith',name:'Faith',ar:'الإيمان'},
  {id:'body',name:'Body & Health',ar:'الجسم والصحة'},
  {id:'mind',name:'Mind & Knowledge',ar:'العقل والمعرفة'},
  {id:'family',name:'Family & Couple',ar:'الأسرة والزوجين'},
  {id:'money',name:'Money & Income',ar:'المال والدخل'},
  {id:'heart',name:'Heart & Me-Time',ar:'القلب ووقت لي'}
];
const AREA_MAP={health:'body',spiritual:'faith',knowledge:'mind',relationships:'family',wealth:'money',other:'heart'};
const KINDS={
  exercise:{label:'Exercise',unit:'min'},
  quran:{label:"Qur'an recitation",unit:'pages'},
  tafsir:{label:'Tafsir reading',unit:'pages'},
  study:{label:'Study or learning',unit:'min'},
  reading:{label:'Reading',unit:'pages'},
  connection:{label:'Quality time',unit:'min'},
  savings:{label:'Saving money',unit:'cur'},
  jobhunt:{label:'Job and income hunt',unit:'min'},
  bizfocus:{label:'Business focus',unit:'min'},
  water:{label:'Water',unit:'glasses'},
  sweets:{label:'Sugar and snack intake',unit:'portions'},
  spend:{label:'Daily spending',unit:'cur'},
  underlimit:{label:'Within the daily limit (automatic)',unit:''},
  weight:{label:'Weight',unit:'kg'},
  steps:{label:'Steps',unit:'steps'},
  practice:{label:'Daily practice (check only)',unit:''},
  general:{label:'Simple check',unit:''}
};
const TYPES={tick:'Tick',count:'Counted (e.g. glasses)',num:'Number log',cap:'Cap (stay under)',tag:'Tick with type and note'};
const TAGS={idea:{en:'Idea',ar:'فكرة'},talk:{en:'Customer talk',ar:'حديث مع زبون'},sample:{en:'Sample',ar:'نموذج'},sale:{en:'First sale',ar:'بيع'},repeat:{en:'Repeat customer',ar:'زبون يعود'}};
const H=(key,name,ar,area,kind,o)=>Object.assign({key:key,name:name,ar:ar,area:area,kind:kind,type:'tick',target:7,per:'week',amount:0,goal:0,who:['p1','p2'],joint:false,tags:null,on:true},o||{});
const LIB=[
  H('quran','Recite Quran, 2 pages','اقرأ القرآن (صفحتان)','faith','quran',{amount:2}),
  H('tafsir','Read tafsir, 2 pages','اقرأ التفسير (صفحتان)','faith','tafsir',{amount:2}),
  H('qiyam','Night prayer','قيام الليل','faith','practice',{target:3}),
  H('witr','Shafa and Witr','الشفع والوتر','faith','practice'),
  H('mulk','Read Surat Al Mulk every night','اقرأ سورة الملك كل ليلة','faith','practice',{target:7}),
  H('azkar_am','Morning azkar','أذكار الصباح','faith','practice'),
  H('azkar_pm','Evening azkar','أذكار المساء','faith','practice'),
  H('fast','Fast Monday or Thursday','صيام الاثنين أو الخميس','faith','practice',{target:2,per:'month'}),
  H('workout','Workout, 30 min','تمرين 30 دقيقة','body','exercise',{target:5,amount:30}),
  H('water','Drink 6 glasses of water','اشرب 6 أكواب ماء','body','water',{type:'count',goal:6,amount:1}),
  H('sweets','Sugar and snack intake','السكر والسناكس','body','sweets',{type:'count',lim:1,goal:2,target:3,amount:1,on:false}),
  H('weigh','Weigh in','قياس الوزن','body','weight',{type:'num',target:1}),
  H('steps','Steps','المشي (الخطوات)','body','steps',{type:'num',target:5,goal:7000,on:false}),
  H('learn','Learning, 20 min','تعلّم 20 دقيقة','mind','study',{target:5,amount:20}),
  H('podcast','Listen to a podcast','استمع إلى بودكاست','mind','general',{target:1}),
  H('couple','Quality time as a couple','وقت جميل معًا','family','connection',{target:2,joint:true}),
  H('kids','Play or talk with the children','العب أو تحدّث مع الأولاد','family','connection'),
  H('story','Bedtime story or reading','قصة أو قراءة قبل النوم','family','general',{target:5}),
  H('appreciate','Say what you appreciate about each other','قل شيئًا تقدّره في شريكك','family','general'),
  H('spend',"Log today's spend",'سجّل مصروف اليوم','money','spend',{type:'num',goal:1500,joint:true}),
  H('under','Stay within the daily limit','التزم بحد المصروف اليومي','money','underlimit',{target:5,joint:true}),
  H('delivery','Delivery orders','طلبات التوصيل','money','general',{type:'cap',target:3,goal:3,joint:true}),
  H('jobhunt','Job and income hunt, 60 min','البحث عن عمل ودخل (60 دقيقة)','money','jobhunt',{target:5,amount:60,who:['p1']}),
  H('bizfocus','Business focus block, 45 min','وقت العمل على مشروعي (45 دقيقة)','money','bizfocus',{target:4,amount:45,who:['p2']}),
  H('bizoutput','Weekly output','إنجاز الأسبوع','money','general',{type:'tag',target:1,who:['p2'],tags:['idea','talk','sample','sale','repeat']}),
  H('bizcheck','Business check-in together, 15 min','جلسة متابعة المشروع معًا (15 دقيقة)','money','general',{target:1,joint:true}),
  H('metime','Time for myself','وقت لنفسي','heart','general',{target:4,per:'month',who:['p2']}),
  H('gratitude','Gratitude, 3 things','الشكر: 3 أشياء','heart','general',{target:5}),
  H('give','Give: make someone smile or help them','عطاء: أسعد أحدًا أو ساعده','heart','general',{target:4})
];
const swOld=x=>(x.kind==='sweets'||x.key==='sweets'||x.id==='sweets')&&x.name==='Sweets and sugar';
const mkHabit=x=>({id:x.key||x.id,name:swOld(x)?'Sugar and snack intake':x.name,ar:swOld(x)?'السكر والسناكس':(x.ar||''),area:AREA_MAP[x.area]||x.area,kind:x.kind,type:x.type||'tick',target:+x.target||1,per:x.per||'week',amount:Number(x.amount)||0,goal:swOld(x)&&(Number(x.goal)===4||!Number(x.goal))?2:(Number(x.goal)||0),who:(x.who&&x.who.length?x.who.slice():['p1','p2']),joint:!!x.joint,tags:x.tags||null,lim:x.lim?1:0});
function ensureUnder(c){
  if(!c||!c.setup||c.underDone||!Array.isArray(c.habits))return false;
  c.underDone=true;
  if(!c.habits.some(h=>h.kind==='underlimit')&&c.habits.some(h=>h.kind==='spend')){const l=LIB.find(x=>x.key==='under');if(l)c.habits.push(mkHabit(l))}
  return true;
}
function migrate(c){
  if(!c||c.v>=2)return c;
  const custom=(c.habits||[]).filter(h=>/^c_/.test(h.id)).map(h=>mkHabit(Object.assign({},h,{key:h.id})));
  c.habits=LIB.filter(x=>x.on).map(mkHabit).concat(custom);
  (c.people||[]).forEach(p=>{if(p.name==='Tuta')p.name='Tota';p.g=p.g||(p.id==='p2'?'f':'m');p.focus=(p.focus||[]).map(a=>AREA_MAP[a]||a)});
  if(c.currency==='AED')c.currency='EGP';
  c.v=2;return c;
}
/* ---------- content: quotes, advice, trophies (can be updated from content.json) ---------- */
const CONTENT_DEFAULT={"v": 2, "updated": "2026-10-12", "pools": {"today": [{"id": "t01", "c": "faith", "en": "The most beloved deeds to Allah are the most consistent, even if small.", "ar": "أحب الأعمال إلى الله أدومها وإن قلّ.", "by": "The Prophet ﷺ · Sahih al-Bukhari 6464, Sahih Muslim 783", "orig": "أَحَبُّ الأعمالِ إلى اللهِ أَدْوَمُها وإن قَلَّ"}, {"id": "t02", "c": "faith", "en": "Allah does not change the condition of a people until they change what is within themselves.", "ar": "إن الله لا يغيّر ما بقوم حتى يغيّروا ما بأنفسهم.", "by": "Qur’an 13:11", "orig": "إِنَّ اللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ حَتَّىٰ يُغَيِّرُوا مَا بِأَنفُسِهِمْ"}, {"id": "t03", "c": "faith", "en": "With hardship comes ease. Truly, with hardship comes ease.", "ar": "إن مع العسر يسرًا، إن مع العسر يسرًا.", "by": "Qur’an 94:5-6", "orig": "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا"}, {"id": "t04", "c": "faith", "en": "A person gets nothing except what they strive for.", "ar": "وأن ليس للإنسان إلا ما سعى.", "by": "Qur’an 53:39", "orig": "وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَىٰ"}, {"id": "t05", "c": "faith", "en": "Whoever puts their trust in Allah, He is enough for them.", "ar": "ومن يتوكل على الله فهو حسبه.", "by": "Qur’an 65:3", "orig": "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ"}, {"id": "t06", "c": "faith", "en": "The strong believer is better and more beloved to Allah than the weak believer, and in both there is good. Strive for what benefits you, ask Allah for help, and do not give up.", "ar": "المؤمن القوي خير وأحب إلى الله من المؤمن الضعيف، وفي كلٍّ خير. احرص على ما ينفعك، واستعن بالله ولا تعجز.", "by": "The Prophet ﷺ · Sahih Muslim 2664", "orig": "الْمُؤْمِنُ الْقَوِيُّ خَيْرٌ وَأَحَبُّ إِلَى اللَّهِ مِنَ الْمُؤْمِنِ الضَّعِيفِ وَفِي كُلٍّ خَيْرٌ، احْرِصْ عَلَى مَا يَنْفَعُكَ وَاسْتَعِنْ بِاللَّهِ وَلَا تَعْجَزْ"}, {"id": "t07", "c": "family", "en": "The best of you are those who are best to their families.", "ar": "خيركم خيركم لأهله.", "by": "The Prophet ﷺ · Sunan at-Tirmidhi 3895", "orig": "خَيْرُكُمْ خَيْرُكُمْ لِأَهْلِهِ"}, {"id": "t08", "c": "faith", "en": "Make the most of five before five: your youth before old age, your health before illness, your wealth before poverty, your free time before you are busy, and your life before death.", "ar": "اغتنم خمسًا قبل خمس: شبابك قبل هرمك، وصحتك قبل سقمك، وغناك قبل فقرك، وفراغك قبل شغلك، وحياتك قبل موتك.", "by": "The Prophet ﷺ · reported by al-Hakim", "orig": "اغْتَنِمْ خَمْسًا قَبْلَ خَمْسٍ"}, {"id": "t09", "c": "family", "en": "Your smile in the face of your brother is charity.", "ar": "تبسّمك في وجه أخيك لك صدقة.", "by": "The Prophet ﷺ · Sunan at-Tirmidhi 1956", "orig": "تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ"}, {"id": "t10", "c": "heart", "en": "Whoever does not thank people has not thanked Allah.", "ar": "لا يشكر الله من لا يشكر الناس.", "by": "The Prophet ﷺ · Sunan Abi Dawud 4811", "orig": "لَا يَشْكُرُ اللَّهَ مَنْ لَا يَشْكُرُ النَّاسَ"}, {"id": "t11", "c": "heart", "en": "If you are grateful, I will surely give you more.", "ar": "لئن شكرتم لأزيدنّكم.", "by": "Qur’an 14:7", "orig": "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ"}, {"id": "t12", "c": "body", "en": "Two blessings that many people lose out on: health and free time.", "ar": "نعمتان مغبون فيهما كثير من الناس: الصحة والفراغ.", "by": "The Prophet ﷺ · Sahih al-Bukhari 6412", "orig": "نِعْمَتَانِ مَغْبُونٌ فِيهِمَا كَثِيرٌ مِنَ النَّاسِ: الصِّحَّةُ وَالْفَرَاغُ"}, {"id": "t13", "c": "faith", "en": "Allah does not burden a soul beyond what it can bear.", "ar": "لا يكلّف الله نفسًا إلا وسعها.", "by": "Qur’an 2:286", "orig": "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا"}, {"id": "t14", "c": "business", "en": "Allah loves that when one of you does a job, he does it with excellence.", "ar": "إن الله يحب إذا عمل أحدكم عملًا أن يتقنه.", "by": "The Prophet ﷺ · Shu‘ab al-Iman, al-Bayhaqi", "orig": "إِنَّ اللَّهَ يُحِبُّ إِذَا عَمِلَ أَحَدُكُمْ عَمَلًا أَنْ يُتْقِنَهُ"}, {"id": "t15", "c": "faith", "en": "The best of you are those who learn the Qur’an and teach it.", "ar": "خيركم من تعلّم القرآن وعلّمه.", "by": "The Prophet ﷺ · Sahih al-Bukhari 5027", "orig": "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ"}, {"id": "t16", "c": "faith", "en": "Whoever takes a path seeking knowledge, Allah makes easy for them a path to Paradise.", "ar": "من سلك طريقًا يلتمس فيه علمًا سهّل الله له به طريقًا إلى الجنة.", "by": "The Prophet ﷺ · Sahih Muslim 2699", "orig": "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ"}, {"id": "t17", "c": "faith", "en": "Do not weaken and do not grieve, for you will prevail if you are believers.", "ar": "ولا تهنوا ولا تحزنوا وأنتم الأعلون إن كنتم مؤمنين.", "by": "Qur’an 3:139", "orig": "وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنتُمُ الْأَعْلَوْنَ إِن كُنتُم مُّؤْمِنِينَ"}, {"id": "t18", "c": "faith", "en": "Those who are patient will be given their reward without measure.", "ar": "إنما يوفّى الصابرون أجرهم بغير حساب.", "by": "Qur’an 39:10", "orig": "إِنَّمَا يُوَفَّى الصَّابِرُونَ أَجْرَهُم بِغَيْرِ حِسَابٍ"}, {"id": "t19", "c": "faith", "en": "Make things easy and do not make them hard. Give good news and do not push people away.", "ar": "يسّروا ولا تعسّروا، وبشّروا ولا تنفّروا.", "by": "The Prophet ﷺ · Sahih al-Bukhari 69", "orig": "يَسِّرُوا وَلَا تُعَسِّرُوا وَبَشِّرُوا وَلَا تُنَفِّرُوا"}, {"id": "t20", "c": "faith", "en": "So when you are free, strive on.", "ar": "فإذا فرغت فانصب.", "by": "Qur’an 94:7", "orig": "فَإِذَا فَرَغْتَ فَانصَبْ"}, {"id": "t21", "c": "life", "en": "We are what we repeatedly do. Excellence, then, is not an act but a habit.", "ar": "نحن ما نفعله باستمرار. فالتميّز ليس فعلًا واحدًا بل عادة.", "by": "Will Durant, summing up Aristotle · The Story of Philosophy"}, {"id": "t22", "c": "life", "en": "The impediment to action advances action. What stands in the way becomes the way.", "ar": "العائق أمام الفعل يدفع الفعل. وما يقف في الطريق يصبح هو الطريق.", "by": "Marcus Aurelius · Meditations 5.20"}, {"id": "t23", "c": "life", "en": "It is not that we have a short time to live, but that we waste much of it.", "ar": "ليست المشكلة أن عمرنا قصير، بل أننا نضيّع جزءًا كبيرًا منه.", "by": "Seneca · On the Shortness of Life"}, {"id": "t24", "c": "life", "en": "A journey of a thousand miles begins with a single step.", "ar": "رحلة الألف ميل تبدأ بخطوة واحدة.", "by": "Lao Tzu · Tao Te Ching, ch. 64"}, {"id": "t25", "c": "life", "en": "Genius is one percent inspiration and ninety-nine percent perspiration.", "ar": "العبقرية واحد في المئة إلهام وتسعة وتسعون في المئة عرق.", "by": "Thomas Edison"}, {"id": "t26", "c": "life", "en": "Do the best you can until you know better. Then when you know better, do better.", "ar": "افعل أفضل ما تقدر عليه حتى تعرف أفضل، وحين تعرف أفضل افعل أفضل.", "by": "Maya Angelou"}, {"id": "t27", "c": "life", "en": "Well done is better than well said.", "ar": "العمل الجيد أفضل من الكلام الجيد.", "by": "Benjamin Franklin · Poor Richard’s Almanack"}, {"id": "t28", "c": "life", "en": "Nothing great was ever achieved without enthusiasm.", "ar": "لا يتحقق شيء عظيم بدون حماس.", "by": "Ralph Waldo Emerson · Circles"}, {"id": "t29", "c": "life", "en": "Nothing will ever be attempted if all possible objections must first be overcome.", "ar": "لن يُجرَّب شيء أبدًا إذا انتظرنا زوال كل الاعتراضات أولًا.", "by": "Samuel Johnson · Rasselas"}, {"id": "t30", "c": "life", "en": "The credit belongs to the person who is actually in the arena, whose face is marred by dust and sweat and blood.", "ar": "الفضل لمن هو فعلًا في الساحة، ووجهه ملطّخ بالغبار والعرق والدم.", "by": "Theodore Roosevelt · Citizenship in a Republic, 1910"}, {"id": "t31", "c": "money", "en": "Do not save what is left after spending. Spend what is left after saving.", "ar": "لا تدّخر ما يتبقى بعد الإنفاق، بل أنفق ما يتبقى بعد الادخار.", "by": "Warren Buffett"}, {"id": "t32", "c": "money", "en": "Beware of little expenses. A small leak will sink a great ship.", "ar": "احذر من المصاريف الصغيرة، فثقب صغير يغرق سفينة كبيرة.", "by": "Benjamin Franklin · Poor Richard’s Almanack"}, {"id": "t33", "c": "business", "en": "Make something people want.", "ar": "اصنع شيئًا يريده الناس.", "by": "Y Combinator’s motto, Paul Graham"}, {"id": "t34", "c": "business", "en": "Get out of the building. The facts are outside, with real customers.", "ar": "اخرج من المكتب. الحقائق في الخارج عند الزبائن الحقيقيين.", "by": "Steve Blank · customer development"}, {"id": "t35", "c": "business", "en": "If you are not embarrassed by the first version of your product, you launched too late.", "ar": "إن لم تخجل من النسخة الأولى من منتجك، فقد أطلقته متأخرًا.", "by": "Reid Hoffman"}, {"id": "t36", "c": "life", "en": "Pain plus reflection equals progress.", "ar": "الألم زائد التأمّل يساوي تقدّمًا.", "by": "Ray Dalio · Principles"}, {"id": "t37", "c": "life", "en": "When we are no longer able to change a situation, we are challenged to change ourselves.", "ar": "حين لا نعود قادرين على تغيير الموقف، يصبح التحدّي أن نغيّر أنفسنا.", "by": "Viktor Frankl · Man’s Search for Meaning (idea)"}, {"id": "t38", "c": "life", "en": "Discipline is the bridge between goals and accomplishment.", "ar": "الانضباط هو الجسر بين الأهداف والإنجاز.", "by": "Jim Rohn"}, {"id": "t40", "c": "faith", "en": "Be in this world as if you were a stranger or a traveller.", "ar": "كن في الدنيا كأنك غريب أو عابر سبيل.", "by": "The Prophet ﷺ · Sahih al-Bukhari 6416", "orig": "كُنْ فِي الدُّنْيَا كَأَنَّكَ غَرِيبٌ أَوْ عَابِرُ سَبِيلٍ"}, {"id": "t41", "c": "faith", "en": "Take account of yourselves before you are taken to account.", "ar": "حاسبوا أنفسكم قبل أن تحاسبوا.", "by": "Attributed to Umar ibn al-Khattab, quoted by at-Tirmidhi"}, {"id": "t42", "c": "heart", "en": "In the remembrance of Allah do hearts find rest.", "ar": "ألا بذكر الله تطمئن القلوب.", "by": "Qur’an 13:28", "orig": "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ"}, {"id": "t43", "c": "faith", "en": "Your Lord has not abandoned you, nor is He displeased. And the end will be better for you than the beginning.", "ar": "ما ودّعك ربك وما قلى. وللآخرة خير لك من الأولى.", "by": "Qur’an 93:3-4", "orig": "مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ ۝ وَلَلْآخِرَةُ خَيْرٌ لَّكَ مِنَ الْأُولَىٰ"}, {"id": "t45", "c": "life", "en": "Start where you are. Use what you have. Do what you can.", "ar": "ابدأ من حيث أنت. استخدم ما معك. افعل ما تستطيع.", "by": "Attributed to Arthur Ashe"}], "week": [{"id": "w01", "c": "faith", "en": "Two Qur’an pages a day finish the whole Madinah mushaf (604 pages) in 302 days. In one year you can complete it and begin again.", "ar": "صفحتان من القرآن كل يوم تختمان المصحف المدني (604 صفحات) في 302 يومًا. في سنة واحدة تختم وتبدأ من جديد.", "by": "Simple arithmetic on the standard Madinah mushaf"}, {"id": "w02", "c": "science", "en": "In a study of habit formation, missing a single day did not meaningfully harm the process. What mattered was getting back to it.", "ar": "في دراسة عن تكوين العادات، فوات يوم واحد لم يضر بالعملية. المهم هو أنك ترجع في اليوم التالي.", "by": "Lally et al., European Journal of Social Psychology, 2010", "moreEn": "In that study of 96 volunteers, the time for a daily behaviour to feel automatic ranged from 18 to 254 days, with a median of 66 days. It is a range, not a deadline.", "moreAr": "في هذه الدراسة على 96 متطوعًا، تراوح الوقت لتصبح العادة تلقائية بين 18 و254 يومًا، والوسيط 66 يومًا. هذا مدى وليس موعدًا نهائيًا."}, {"id": "w03", "c": "science", "en": "People who decide in advance exactly when and where they will act (“If it is 8 pm, then I read”) follow through noticeably more often.", "ar": "الناس الذين يقررون مسبقًا متى وأين سيفعلون (إذا جاءت الساعة 8 مساءً، فسأقرأ) ينفّذون أكثر بشكل ملحوظ.", "by": "Gollwitzer and Sheeran, Advances in Experimental Social Psychology, 2006 (94 studies)", "moreEn": "The analysis of 94 studies found a medium-to-large effect of these “if-then” plans on reaching goals.", "moreAr": "وجد التحليل لـ94 دراسة تأثيرًا متوسطًا إلى كبيرًا لخطط (إذا… فإن…) على تحقيق الأهداف."}, {"id": "w04", "c": "science", "en": "Around 43% of the things people did every day happened in the same place and the same context. Habits live in surroundings, not only in willpower.", "ar": "حوالي 43% من الأشياء التي يفعلها الناس يوميًا حدثت في نفس المكان والسياق. العادات تعيش في البيئة وليس في قوة الإرادة فقط.", "by": "Wood, Quinn and Kashy, Journal of Personality and Social Psychology, 2002", "moreEn": "Change the place and the cue and the habit changes with it. That is why a fixed spot for your Qur’an or your shoes by the door works better than good intentions.", "moreAr": "غيّر المكان والإشارة تتغير العادة. ولهذا فإن مكانًا ثابتًا للمصحف أو للحذاء عند الباب أنفع من النوايا الطيبة."}, {"id": "w05", "c": "science", "en": "Writing your goals down, sharing them with a friend and sending a weekly update was linked with the highest achievement in a small study of 267 people.", "ar": "كتابة أهدافك ومشاركتها مع صديق وإرسال تقرير أسبوعي كانت مرتبطة بأعلى إنجاز في دراسة صغيرة على 267 شخصًا.", "by": "Dr Gail Matthews, Dominican University of California, 2015", "moreEn": "It was a small study, so treat it as encouragement, not proof. You two are already doing the sharing part.", "moreAr": "دراسة صغيرة، فاعتبرها تشجيعًا وليس دليلًا قاطعًا. وأنتما فعلًا تشاركان بعضكما التقدّم."}, {"id": "w06", "c": "health", "en": "Large studies link meeting the activity guideline (150 minutes a week) with a clearly lower risk of dying early compared with being inactive.", "ar": "الدراسات الكبيرة تربط الوصول لتوصية النشاط (150 دقيقة في الأسبوع) بخطر أقل بوضوح للوفاة المبكرة مقارنة بعدم النشاط.", "by": "WHO guidelines on physical activity, 2020 · Arem et al., JAMA Internal Medicine, 2015", "moreEn": "Five 30-minute workouts a week already reach the guideline.", "moreAr": "خمس حصص تمرين مدة كل منها 30 دقيقة تكفي للوصول إلى التوصية."}, {"id": "w07", "c": "health", "en": "Walking more is linked with living longer: about 6,000 to 8,000 steps a day for adults over 60, and 8,000 to 10,000 for younger adults.", "ar": "المشي أكثر مرتبط بعمر أطول: حوالي 6,000 إلى 8,000 خطوة يوميًا لمن فوق 60، و8,000 إلى 10,000 للأصغر سنًا.", "by": "Paluch et al., The Lancet Public Health, 2022 (meta-analysis)"}, {"id": "w08", "c": "family", "en": "Couples who stayed together in a long study “turned toward” each other’s small requests for attention far more often than couples who later separated: 86% against 33%.", "ar": "الأزواج الذين استمروا في دراسة طويلة كانوا يستجيبون لطلبات الانتباه الصغيرة من شريكهم أكثر بكثير ممن انفصلوا لاحقًا: 86% مقابل 33%.", "by": "John Gottman’s research on newlyweds, The Gottman Institute", "moreEn": "A bid can be as small as “look at this”. Answering it counts.", "moreAr": "قد يكون الطلب بسيطًا مثل «انظر إلى هذا». والاستجابة له لها قيمة."}, {"id": "w09", "c": "family", "en": "The Harvard Study of Adult Development, running since 1938, found that the quality of close relationships predicted health and happiness in old age better than wealth or fame.", "ar": "دراسة هارفارد للتطور البشري، المستمرة منذ 1938، وجدت أن جودة العلاقات القريبة تتنبأ بالصحة والسعادة في الكبر أفضل من الثروة أو الشهرة.", "by": "Waldinger and Schulz, The Good Life, 2023"}, {"id": "w10", "c": "family", "en": "A large analysis of studies found that reading with young children is linked to better language and early reading skills.", "ar": "تحليل كبير للدراسات وجد أن القراءة مع الأطفال الصغار مرتبطة بمهارات لغوية وقرائية مبكرة أفضل.", "by": "Bus, van IJzendoorn and Pellegrini, Review of Educational Research, 1995 (meta-analysis of joint book reading)", "moreEn": "Your bedtime story is not only sweet. It builds words.", "moreAr": "قصة ما قبل النوم ليست لطيفة فقط، بل تبني الكلمات."}, {"id": "w11", "c": "heart", "en": "People who wrote down a few things they were grateful for each week reported being more optimistic and feeling better about their lives.", "ar": "الناس الذين كتبوا بعض الأشياء التي يشكرون عليها كل أسبوع قالوا إنهم أكثر تفاؤلًا وأفضل شعورًا تجاه حياتهم.", "by": "Emmons and McCullough, Journal of Personality and Social Psychology, 2003"}, {"id": "w12", "c": "heart", "en": "Spending a small amount of money on others made people happier than spending it on themselves.", "ar": "إنفاق مبلغ صغير على الآخرين جعل الناس أسعد من إنفاقه على أنفسهم.", "by": "Dunn, Aknin and Norton, Science, 2008", "moreEn": "The same pattern appeared in a survey across 136 countries (Aknin et al., 2013).", "moreAr": "ونفس النمط ظهر في مسح شمل 136 دولة (أكنين وزملاؤه، 2013)."}, {"id": "w13", "c": "faith", "en": "The first word revealed of the Qur’an was “Read”. Learning is part of faith from the very first moment.", "ar": "أول كلمة نزلت من القرآن هي «اقرأ». فالتعلّم جزء من الإيمان من اللحظة الأولى.", "by": "Qur’an 96:1"}, {"id": "w14", "c": "faith", "en": "The Prophet ﷺ used to fast on Mondays and Thursdays and said that deeds are presented on those days, and that he likes his deeds to be presented while he is fasting.", "ar": "كان النبي ﷺ يصوم الاثنين والخميس، وقال إن الأعمال تُعرض فيهما، وأحب أن يُعرض عملي وأنا صائم.", "by": "Sunan at-Tirmidhi 747"}, {"id": "w15", "c": "faith", "en": "A hadith says the one who is skilled in the Qur’an is with the noble angels, and the one who recites with difficulty has a double reward.", "ar": "في الحديث أن الماهر بالقرآن مع الملائكة الكرام، والذي يقرؤه ويشق عليه له أجران.", "by": "Sahih al-Bukhari 4937, Sahih Muslim 798", "moreEn": "So if reading feels hard some days, that effort is counted.", "moreAr": "فلو القراءة صعبة بعض الأيام، فإن التعب نفسه محسوب."}, {"id": "w16", "c": "money", "en": "Setting aside 500 EGP a month adds up to 6,000 a year and 60,000 in ten years before any return. The habit matters more than the amount.", "ar": "ادّخار 500 جنيه شهريًا يعني 6,000 في السنة و60,000 في عشر سنوات قبل أي عائد. العادة أهم من المبلغ.", "by": "Simple arithmetic"}, {"id": "w17", "c": "science", "en": "People who keep track of their progress toward a goal are more likely to reach it, and writing it down helps even more.", "ar": "الناس الذين يتابعون تقدّمهم نحو هدف أكثر احتمالًا لبلوغه، والكتابة تساعد أكثر.", "by": "Harkin et al., Psychological Bulletin, 2016 (meta-analysis of 138 studies)", "moreEn": "That is exactly what logging your spending and your habits does.", "moreAr": "وهذا بالضبط ما يفعله تسجيل مصروفك وعاداتك."}, {"id": "w18", "c": "science", "en": "Studies of habit change find that a small win repeated is more reliable than a big push. Starting with two minutes beats waiting for the perfect hour.", "ar": "دراسات تغيير العادات تجد أن مكسبًا صغيرًا متكررًا أكثر ثباتًا من دفعة كبيرة. البدء بدقيقتين أفضل من انتظار الساعة المثالية.", "by": "BJ Fogg, Tiny Habits · James Clear, Atomic Habits"}, {"id": "w19", "c": "health", "en": "Drinking water through the day is easier than catching up in the evening. Six glasses is about 1.5 litres.", "ar": "شرب الماء على مدار اليوم أسهل من التعويض في المساء. ستة أكواب تقريبًا 1.5 لتر.", "by": "EFSA water intake opinion, 2010"}, {"id": "w20", "c": "science", "en": "Reading books is linked with living longer. In one 12-year study of 3,635 adults, book readers had about 20% lower risk of dying than non-readers.", "ar": "قراءة الكتب مرتبطة بعمر أطول. في دراسة لمدة 12 سنة على 3,635 بالغًا، كان خطر الوفاة عند قراء الكتب أقل بحوالي 20% من غير القراء.", "by": "Bavishi et al., Social Science & Medicine, 2016", "moreEn": "An association, not proof. But it is a good reason to keep the book by the bed.", "moreAr": "ارتباط وليس دليلًا. لكن سبب جيد لتبقي الكتاب جنب السرير."}, {"id": "w21", "c": "business", "en": "Many successful companies began by talking to a handful of real customers before building. A few honest conversations can save months.", "ar": "كثير من الشركات الناجحة بدأت بالحديث مع عدد قليل من الزبائن الحقيقيين قبل البناء. بضع محادثات صريحة قد توفّر أشهرًا.", "by": "Steve Blank, The Four Steps to the Epiphany · Eric Ries, The Lean Startup"}, {"id": "w22", "c": "science", "en": "Habits form by repeating a behaviour in the same context. The rewards you feel right away matter more than the benefits that come months later.", "ar": "العادات تتكوّن بتكرار السلوك في نفس السياق. المكافآت التي تشعر بها فورًا أهم من الفوائد التي تأتي بعد شهور.", "by": "Wendy Wood, Good Habits, Bad Habits, 2019"}, {"id": "w24", "c": "faith", "en": "The Prophet ﷺ said that a righteous deed done after a bad one wipes it out: “Follow a bad deed with a good deed and it will erase it.”", "ar": "قال النبي ﷺ: «أتبع السيئة الحسنة تمحها». كل مرة ترجع فيها هي فرصة جديدة.", "by": "Sunan at-Tirmidhi 1987"}, {"id": "w25", "c": "life", "en": "The habit-tracking idea is old: Benjamin Franklin kept a weekly chart of virtues and marked every slip with a dot, aiming for fewer dots over time.", "ar": "فكرة تتبّع العادات قديمة: بنجامين فرانكلين كان يحتفظ بجدول أسبوعي للفضائل ويضع نقطة عند كل زلّة، ليقلّ عدد النقاط مع الوقت.", "by": "Benjamin Franklin, Autobiography"}, {"id": "w26", "c": "faith", "en": "Muhasaba, taking account of yourself, is an old practice in Islamic spirituality. A short check-in each day is exactly that.", "ar": "المحاسبة ممارسة قديمة في التزكية الإسلامية. وتسجيل يومي قصير هو ذلك بالضبط.", "by": "Al-Ghazali, Ihya’ Ulum al-Din"}, {"id": "w27", "c": "health", "en": "Regular weigh-ins make slow changes visible, and visible progress keeps people going. Same day, same conditions, and watch the trend, not a single reading.", "ar": "قياس الوزن بانتظام يجعل التغيّرات البطيئة ظاهرة، والتقدّم الظاهر يشجّع على الاستمرار. نفس اليوم ونفس الظروف، وانظر إلى الاتجاه وليس قراءة واحدة.", "by": "Self-monitoring research, e.g. Burke et al., Journal of the American Dietetic Association, 2011"}, {"id": "w29", "c": "money", "en": "Cooking at home is usually far cheaper than ordering. Choosing three delivery nights a week in advance turns an impulse into a plan.", "ar": "الطبخ في البيت عادة أرخص بكثير من الطلب. اختيار ثلاث ليالي توصيل في الأسبوع مسبقًا يحوّل الاندفاع إلى خطة.", "by": "General household budgeting guidance"}, {"id": "w30", "c": "heart", "en": "Time alone to rest and recharge is linked with lower stress. Putting it in the calendar first protects it from what is left over.", "ar": "الوقت الخاص للراحة وإعادة الشحن مرتبط بتوتر أقل. وضعه في الجدول أولًا يحميه من أن يكون ما تبقّى.", "by": "Recovery from stress research (Sonnentag and colleagues)"}], "dash": [{"id": "d01", "c": "history", "en": "Fatima al-Fihri used her inheritance to found a mosque and school in Fez in 859. It grew into al-Qarawiyyin, recognised as the oldest continually operating university in the world.", "ar": "فاطمة الفهرية أنفقت ميراثها لتؤسس مسجدًا ومدرسة في فاس عام 859، ونمت لتصبح جامعة القرويين، المعترف بها كأقدم جامعة مستمرة في العمل في العالم.", "by": "History of al-Qarawiyyin · UNESCO and Guinness World Records", "moreEn": "She did not build it in a day. She watched the walls rise over years, and it is said she fasted until the work was complete. One steady act of giving became a place where people have learned for more than eleven centuries.", "moreAr": "لم تبنِها في يوم. تابعت ارتفاع الجدران عبر سنين، ويُروى أنها صامت حتى اكتمل البناء. عطاء واحد ثابت صار مكانًا يتعلم فيه الناس منذ أكثر من أحد عشر قرنًا."}, {"id": "d02", "c": "history", "en": "Al-Khwarizmi wrote a short book around 820 on solving equations. Its title, al-jabr, gave us the word algebra, and his name gave us algorithm.", "ar": "الخوارزمي كتب حوالي عام 820 كتابًا قصيرًا في حلّ المعادلات. عنوانه «الجبر» أعطانا كلمة algebra، واسمه أعطانا كلمة algorithm.", "by": "Al-Khwarizmi, The Compendious Book on Calculation by Completion and Balancing", "moreEn": "He worked at the House of Wisdom in Baghdad, where translators and scientists studied side by side. A daily habit of careful thinking left a mark on every phone and computer today.", "moreAr": "عمل في بيت الحكمة ببغداد حيث كان المترجمون والعلماء يدرسون جنبًا إلى جنب. عادة يومية من التفكير الدقيق تركت أثرها في كل هاتف وحاسوب اليوم."}, {"id": "d03", "c": "history", "en": "Ibn al-Haytham wrote his Book of Optics while confined at home in Cairo in the early 1000s. He insisted on testing ideas with experiments, which helped shape modern scientific method.", "ar": "ابن الهيثم ألّف «كتاب المناظر» وهو محتجز في بيته بالقاهرة في أوائل القرن الحادي عشر. أصرّ على اختبار الأفكار بالتجارب، فساهم في تشكيل المنهج العلمي الحديث.", "by": "Ibn al-Haytham, Kitab al-Manazir", "moreEn": "He was reportedly confined for about ten years. Limits did not stop him. They narrowed his focus.", "moreAr": "يُروى أنه ظل محتجزًا حوالي عشر سنوات. القيود لم توقفه، بل ضيّقت تركيزه."}, {"id": "d04", "c": "history", "en": "Imam al-Bukhari spent about sixteen years compiling his Sahih, choosing roughly 7,000 reports from hundreds of thousands. It is said he prayed two rak‘ahs before including each one.", "ar": "الإمام البخاري قضى حوالي ست عشرة سنة في جمع صحيحه، واختار نحو 7,000 رواية من مئات الآلاف. ويُروى أنه كان يصلي ركعتين قبل إدراج كل حديث.", "by": "Biographical tradition on al-Bukhari", "moreEn": "A long work is made of daily pages. Sixteen years is only about 5,800 days.", "moreAr": "العمل الطويل مصنوع من صفحات يومية. ست عشرة سنة ليست إلا حوالي 5,800 يوم."}, {"id": "d05", "c": "history", "en": "Khadija bint Khuwaylid ran a successful trading business in Mecca and became the first to believe in the Prophet ﷺ. She stood by him with her wealth, her word and her calm.", "ar": "خديجة بنت خويلد أدارت تجارة ناجحة في مكة وكانت أول من آمن بالنبي ﷺ. وقفت معه بمالها وكلمتها وسكينتها.", "by": "Ibn Hisham, Sirah", "moreEn": "A woman who built a business and a family at the same time. A reminder that work and home can strengthen each other.", "moreAr": "امرأة بنت تجارة وأسرة في الوقت نفسه. تذكير بأن العمل والبيت يقوّي أحدهما الآخر."}, {"id": "d06", "c": "history", "en": "Uthman ibn Affan bought the well of Rumah in Madinah and made it available to all Muslims at a time when water was scarce.", "ar": "عثمان بن عفان اشترى بئر رومة في المدينة وجعلها متاحة لكل المسلمين في وقت كان الماء فيه قليلًا.", "by": "Sunan at-Tirmidhi 3703", "moreEn": "One decision to give kept benefiting people for generations. Giving is a habit that outlives the giver.", "moreAr": "قرار واحد بالعطاء ظل ينفع الناس أجيالًا. العطاء عادة تعيش بعد صاحبها."}, {"id": "d07", "c": "history", "en": "Ibn Sina’s Canon of Medicine was used as a medical textbook in Europe and the Islamic world for around six centuries.", "ar": "«القانون في الطب» لابن سينا استُخدم كتابًا طبيًا في أوروبا والعالم الإسلامي لحوالي ستة قرون.", "by": "Ibn Sina, al-Qanun fi’l-Tibb", "moreEn": "He wrote while serving as a physician and adviser, fitting study into busy days. Consistent small time blocks make big books.", "moreAr": "كتب وهو طبيب ومستشار، فكان يجد وقتًا للدراسة وسط الانشغال. فترات الوقت الصغيرة المنتظمة تصنع كتبًا كبيرة."}, {"id": "d08", "c": "history", "en": "Ibn Battuta set out for Hajj at 21 and kept travelling for almost thirty years, covering roughly 120,000 km across Africa, Asia and Europe.", "ar": "ابن بطوطة خرج للحج وعمره 21 سنة وظل يسافر قرابة ثلاثين عامًا، قاطعًا نحو 120,000 كم في أفريقيا وآسيا وأوروبا.", "by": "Ibn Battuta, Rihla", "moreEn": "It began with one journey and a single step. Curiosity, repeated daily, becomes a life.", "moreAr": "بدأت برحلة واحدة وخطوة واحدة. الفضول مع التكرار اليومي يصير حياة."}, {"id": "d09", "c": "science", "en": "Marie Curie is the only person to win Nobel Prizes in two different sciences: Physics in 1903 and Chemistry in 1911.", "ar": "ماري كوري هي الشخص الوحيد الذي فاز بجائزة نوبل في علمين مختلفين: الفيزياء عام 1903 والكيمياء عام 1911.", "by": "Nobel Prize organisation", "moreEn": "Her work involved years of patient, repetitive lab work with tons of ore to isolate a tiny amount of radium. Progress was slow until it was suddenly real.", "moreAr": "شمل عملها سنوات من العمل المخبري الصبور والمتكرر على أطنان من الخام لعزل كمية صغيرة من الراديوم. كان التقدم بطيئًا حتى صار حقيقيًا فجأة."}, {"id": "d10", "c": "science", "en": "Ahmed Zewail, born in Egypt, won the 1999 Nobel Prize in Chemistry for using ultra-fast lasers to watch chemical reactions as they happen, in femtoseconds.", "ar": "أحمد زويل، المولود في مصر، فاز بجائزة نوبل في الكيمياء عام 1999 لاستخدامه ليزر فائق السرعة لمراقبة التفاعلات الكيميائية لحظة حدوثها، بالفيمتوثانية.", "by": "Nobel Prize organisation", "moreEn": "He was born in Damanhur, raised in Disuq and studied at Alexandria University. A boy from the Egyptian Delta changed how the world sees molecules.", "moreAr": "وُلد في دمنهور ونشأ في دسوق ودرس في جامعة الإسكندرية. فتى من دلتا مصر غيّر الطريقة التي يرى بها العالم الجزيئات."}, {"id": "d11", "c": "science", "en": "Magdi Yacoub, an Egyptian-born heart surgeon, pioneered heart and transplant surgery, then helped found the Aswan Heart Centre, which provides free care.", "ar": "مجدي يعقوب، جرّاح القلب المولود في مصر، كان رائدًا في جراحات القلب والزراعة، ثم ساهم في تأسيس مركز أسوان للقلب الذي يقدّم العلاج مجانًا.", "by": "Aswan Heart Centre · Magdi Yacoub Foundation", "moreEn": "Excellence in his craft and generosity with it. The two together are what make a legacy.", "moreAr": "التميز في مهنته والكرم بها. الاثنان معًا هما ما يصنع الأثر."}, {"id": "d12", "c": "science", "en": "Katherine Johnson’s calculations helped NASA launch the first American astronauts. In 1962 John Glenn asked for her to check the computer’s numbers before his orbital flight.", "ar": "حسابات كاثرين جونسون ساعدت ناسا في إطلاق أوائل الرواد الأمريكيين. في 1962 طلب جون غلين أن تراجع هي أرقام الحاسوب قبل رحلته المدارية.", "by": "NASA biography", "moreEn": "People trusted her because she checked the details, every time.", "moreAr": "وثق بها الناس لأنها تراجع التفاصيل في كل مرة."}, {"id": "d13", "c": "science", "en": "Beethoven premiered his Ninth Symphony in 1824 when he was almost completely deaf. He had to be turned around at the end to see the applause.", "ar": "بيتهوفن قدّم سيمفونيته التاسعة لأول مرة عام 1824 وهو أصمّ تقريبًا. وأُدير ليرى التصفيق في النهاية.", "by": "Contemporary accounts of the 1824 premiere", "moreEn": "The habit of composing every day did not stop when circumstances changed.", "moreAr": "عادة التأليف اليومية لم تتوقف حين تغيّرت الظروف."}, {"id": "d14", "c": "life", "en": "Nelson Mandela spent 27 years in prison and was elected President of South Africa in 1994, choosing reconciliation over revenge.", "ar": "نيلسون مانديلا قضى 27 عامًا في السجن وانتُخب رئيسًا لجنوب أفريقيا عام 1994، واختار المصالحة بدل الانتقام.", "by": "Nelson Mandela Foundation", "moreEn": "In prison he kept to a strict daily routine of exercise, reading and letters. Routine kept him whole.", "moreAr": "في السجن التزم بروتين يومي صارم من التمارين والقراءة والرسائل. الروتين حافظ على تماسكه."}, {"id": "d15", "c": "life", "en": "Helen Keller, deaf and blind from the age of 19 months, graduated from Radcliffe College with honours in 1904 and became an author and activist.", "ar": "هيلين كيلر، الصماء والعمياء منذ عمر 19 شهرًا، تخرّجت بتفوق من كلية رادكليف عام 1904 وصارت كاتبة وناشطة.", "by": "American Foundation for the Blind", "moreEn": "Her teacher Anne Sullivan began with one word at a time spelled into her hand. Small steps, repeated with love.", "moreAr": "بدأت معلمتها آن سوليفان بكلمة واحدة في كل مرة تُهجّى على يدها. خطوات صغيرة مكررة بمحبة."}, {"id": "d16", "c": "life", "en": "Malala Yousafzai became the youngest Nobel Peace Prize laureate at 17 in 2014, after speaking up for girls’ education.", "ar": "ملالا يوسفزاي أصبحت أصغر حائزة على جائزة نوبل للسلام وعمرها 17 عامًا عام 2014، بعد أن رفعت صوتها من أجل تعليم الفتيات.", "by": "Nobel Prize organisation", "moreEn": "She started by writing a diary and speaking up, one sentence at a time.", "moreAr": "بدأت بكتابة مذكرات والكلام، جملة بعد جملة."}, {"id": "d17", "c": "life", "en": "Roger Bannister ran the first mile under four minutes in 1954. Within about seven weeks another runner did it too, and many followed.", "ar": "روجر بانيستر ركض أول ميل في أقل من أربع دقائق عام 1954. وبعد حوالي سبعة أسابيع فعلها عدّاء آخر، وتبعه كثيرون.", "by": "Athletics records and press accounts", "moreEn": "Once a barrier is proven breakable, others find the courage. Your progress also makes it easier for someone near you.", "moreAr": "حين يثبت أن الحاجز قابل للكسر، يجد غيره الشجاعة. وتقدّمك يسهّل على من حولك."}, {"id": "d18", "c": "life", "en": "The Wright brothers built bicycles by trade. On 17 December 1903 their first powered flight lasted 12 seconds and covered 120 feet. The fourth flight that day lasted 59 seconds.", "ar": "الأخوان رايت كانا يصنعان الدراجات. في 17 ديسمبر 1903 دامت رحلتهما الأولى 12 ثانية وقطعت 120 قدمًا. والرحلة الرابعة في اليوم نفسه دامت 59 ثانية.", "by": "Smithsonian National Air and Space Museum", "moreEn": "Twelve seconds changed the century. Never judge a beginning by its length.", "moreAr": "اثنتا عشرة ثانية غيّرت القرن. لا تحكم على البداية بطولها."}, {"id": "d19", "c": "business", "en": "Airbnb’s founders paid early bills by selling cereal boxes themed on the 2008 US election. The idea of strangers sharing homes then grew into a global company.", "ar": "مؤسسو إيربنب سدّدوا فواتيرهم المبكرة ببيع علب حبوب بتصميم مرتبط بانتخابات أمريكا 2008. ثم نمت فكرة مشاركة البيوت بين الغرباء لتصبح شركة عالمية.", "by": "Reported widely, e.g. Y Combinator and Brian Chesky interviews", "moreEn": "They did something small and real to survive, and listened to the first customers closely.", "moreAr": "فعلوا شيئًا صغيرًا وحقيقيًا ليستمروا، وأنصتوا جيدًا لأوائل الزبائن."}, {"id": "d20", "c": "business", "en": "Amazon started in 1994 from a garage in Bellevue as an online bookstore.", "ar": "بدأت أمازون عام 1994 من جراج في بيلفيو كمتجر كتب إلكتروني.", "by": "Amazon company history", "moreEn": "Starting with one category and doing it well, then expanding step by step.", "moreAr": "البدء بفئة واحدة وإتقانها، ثم التوسع خطوة خطوة."}, {"id": "d21", "c": "business", "en": "Toyota built its production system on kaizen: small improvements made every day by everyone. The habit of tiny fixes compounded into world-class quality.", "ar": "بنت تويوتا نظامها الإنتاجي على الكايزن: تحسينات صغيرة كل يوم من الجميع. عادة التعديلات الصغيرة تراكمت لتصنع جودة عالمية.", "by": "Toyota Production System", "moreEn": "Improve one small thing, then the next. That is a month, a year, a company.", "moreAr": "حسّن شيئًا صغيرًا ثم الذي بعده. هذا شهر، ثم سنة، ثم شركة."}, {"id": "d22", "c": "life", "en": "J. K. Rowling’s first Harry Potter manuscript was turned down by around a dozen publishers before Bloomsbury accepted it in 1996.", "ar": "مخطوطة هاري بوتر الأولى لـج. ك. رولينغ رفضها حوالي اثني عشر ناشرًا قبل أن تقبلها بلومزبري عام 1996.", "by": "Bloomsbury and published interviews", "moreEn": "She kept sending. Rejection is part of the route, not the end of it.", "moreAr": "واصلت الإرسال. الرفض جزء من الطريق وليس نهايته."}, {"id": "d23", "c": "history", "en": "Mansa Musa of Mali made his pilgrimage to Mecca in 1324 with a huge caravan and gave so much gold along the way that prices in Cairo are said to have been affected for years.", "ar": "منسا موسى ملك مالي أدّى الحج عام 1324 بقافلة ضخمة ووزّع ذهبًا كثيرًا في الطريق حتى يُقال إن الأسعار في القاهرة تأثرت لسنوات.", "by": "Al-Umari and other medieval accounts", "moreEn": "Planning, generosity and a clear purpose.", "moreAr": "تخطيط وسخاء وغاية واضحة."}, {"id": "d24", "c": "history", "en": "Aisha bint Abu Bakr transmitted over two thousand hadiths and taught many Companions and their students. Scholars returned to her for answers.", "ar": "عائشة بنت أبي بكر روت أكثر من ألفي حديث وعلّمت كثيرًا من الصحابة وتلاميذهم، وكان العلماء يرجعون إليها.", "by": "Classical biographical works", "moreEn": "Knowledge held and shared in the home became a school for a community.", "moreAr": "علم حُفظ ونُشر من البيت صار مدرسة لأمة."}, {"id": "d25", "c": "life", "en": "Abdul Sattar Edhi started with one old ambulance in Karachi and built one of the largest volunteer ambulance networks in the world, often answering the calls himself.", "ar": "عبد الستار إيدهي بدأ بسيارة إسعاف قديمة واحدة في كراتشي وبنى واحدة من أكبر شبكات الإسعاف التطوعية في العالم، وكان كثيرًا ما يردّ على النداءات بنفسه.", "by": "Edhi Foundation", "moreEn": "One vehicle, one person, done every day.", "moreAr": "سيارة واحدة وشخص واحد وعمل يومي."}, {"id": "d26", "c": "history", "en": "Naguib Mahfouz, the Egyptian novelist, won the 1988 Nobel Prize in Literature. He kept a strict daily writing schedule for decades.", "ar": "نجيب محفوظ، الروائي المصري، فاز بجائزة نوبل في الأدب عام 1988. وحافظ على جدول كتابة يومي صارم لعقود.", "by": "Nobel Prize organisation", "moreEn": "Early mornings, day after day, years of Cairo stories. Genius needs a schedule.", "moreAr": "ساعات الصباح الأولى يومًا بعد يوم، سنوات من حكايات القاهرة. العبقرية تحتاج جدولًا."}, {"id": "d28", "c": "history", "en": "Sumayyah bint Khayyat was the first martyr in Islam. She held firm under severe pressure, and her family’s patience is remembered as an example for all time.", "ar": "سمية بنت خياط أول شهيدة في الإسلام. ثبتت تحت ضغط شديد، وصبر أسرتها يُذكر مثالًا على مر الزمان.", "by": "Ibn Sa‘d, al-Tabaqat", "moreEn": "Steadiness is a form of courage.", "moreAr": "الثبات شكل من أشكال الشجاعة."}], "impact": [{"id": "b01", "c": "book", "en": "Getting 1% better each day looks like nothing today, but over a year it compounds into a very different person.", "ar": "التحسّن 1% كل يوم لا يبدو شيئًا اليوم، لكن على مدار سنة يتراكم ليصنع شخصًا مختلفًا تمامًا.", "by": "Atomic Habits · James Clear", "moreEn": "The size of the daily step matters less than never stopping. Small gains arrive quietly and keep stacking.", "moreAr": "حجم الخطوة اليومية أقل أهمية من عدم التوقف. المكاسب الصغيرة تأتي بهدوء وتتراكم."}, {"id": "b02", "c": "book", "en": "Aim at who you want to become, not only what you want to get. Each tick is a vote for the kind of person you are.", "ar": "استهدف من تريد أن تصبح، لا ما تريد أن تحصل عليه فقط. كل علامة صح هي صوت لصالح نوع الشخص الذي أنت عليه.", "by": "Atomic Habits · James Clear", "moreEn": "“I am someone who reads every day” is a stronger anchor than “I want to finish a book”.", "moreAr": "«أنا شخص يقرأ كل يوم» مرساة أقوى من «أريد أن أنهي كتابًا»."}, {"id": "b03", "c": "book", "en": "Attach a new habit to one you already do. “After I pray Fajr, I read my two pages.” The old habit becomes the reminder for the new one.", "ar": "اربط عادة جديدة بعادة تفعلها أصلًا. «بعد صلاة الفجر أقرأ صفحتيّ». العادة القديمة تصبح تذكيرًا بالجديدة.", "by": "Atomic Habits · James Clear (habit stacking)"}, {"id": "b04", "c": "book", "en": "The two-minute rule: shrink a habit until it takes two minutes. Becoming someone who starts matters more than finishing big at first.", "ar": "قاعدة الدقيقتين: صغّر العادة حتى تستغرق دقيقتين. أن تصبح شخصًا يبدأ أهم في البداية من الإنجاز الكبير.", "by": "Atomic Habits · James Clear", "moreEn": "Put on your shoes. Open the book. Write one line. The rest tends to follow.", "moreAr": "البس الحذاء. افتح الكتاب. اكتب سطرًا. والباقي غالبًا يتبع."}, {"id": "b05", "c": "book", "en": "Never miss twice. One missed day is an accident. Two in a row is the start of a new habit you did not choose.", "ar": "لا تفوّت مرتين. يوم واحد فائت حادث. يومان متتاليان بداية عادة جديدة لم تخترها.", "by": "Atomic Habits · James Clear"}, {"id": "b06", "c": "book", "en": "Design your surroundings so the good habit is visible and easy, and the unwanted one takes effort. Put the Qur’an where you sit, the phone away from the bed.", "ar": "صمّم محيطك بحيث تكون العادة الجيدة ظاهرة وسهلة، والعادة غير المرغوبة تحتاج جهدًا. ضع المصحف حيث تجلس، والهاتف بعيدًا عن السرير.", "by": "Atomic Habits · James Clear"}, {"id": "b07", "c": "book", "en": "Make a habit satisfying right away. A small immediate reward, like a tick you can see, keeps you coming back.", "ar": "اجعل العادة مُرضية فورًا. مكافأة صغيرة فورية، مثل علامة صح تراها، تجعلك تعود.", "by": "Atomic Habits · James Clear · Tiny Habits, BJ Fogg"}, {"id": "b08", "c": "book", "en": "Every habit is a loop: a cue, a routine and a reward. To change a habit, keep the cue and the reward and swap the routine.", "ar": "كل عادة هي حلقة: إشارة وروتين ومكافأة. لتغيير عادة، أبقِ الإشارة والمكافأة وبدّل الروتين.", "by": "The Power of Habit · Charles Duhigg", "moreEn": "Craving is what drives the loop. Find what you are really seeking, such as rest or company, and meet it in a better way.", "moreAr": "الرغبة هي ما يحرّك الحلقة. اكتشف ما تبحث عنه فعلًا، مثل الراحة أو الصحبة، وأشبعه بطريقة أفضل."}, {"id": "b09", "c": "book", "en": "Some habits, called keystone habits, start a chain reaction. A single change, like regular exercise, can lift eating, sleep and mood without extra effort.", "ar": "بعض العادات، وتسمى العادات المحورية، تبدأ تفاعلًا متسلسلًا. تغيير واحد مثل التمرين المنتظم قد يرفع الأكل والنوم والمزاج دون جهد إضافي.", "by": "The Power of Habit · Charles Duhigg"}, {"id": "b10", "c": "book", "en": "Small wins build confidence. Finish one small thing today and let it make the next one easier.", "ar": "الانتصارات الصغيرة تبني الثقة. أنجز شيئًا صغيرًا اليوم ودعه يجعل التالي أسهل.", "by": "The Power of Habit · Charles Duhigg"}, {"id": "b11", "c": "book", "en": "Belief changes when you do it with others. Habits stick better in a community, and you two are each other’s community.", "ar": "الاعتقاد يتغير حين تفعل مع الآخرين. العادات تثبت أكثر في مجتمع، وأنتما مجتمع بعضكما.", "by": "The Power of Habit · Charles Duhigg"}, {"id": "b12", "c": "book", "en": "You cannot care about everything. Choose a few things worth caring about, and accept the cost of the rest.", "ar": "لا تستطيع أن تهتم بكل شيء. اختر أشياء قليلة تستحق الاهتمام، واقبل ثمن الباقي.", "by": "The Subtle Art of Not Giving a F*ck · Mark Manson"}, {"id": "b13", "c": "book", "en": "Problems never end, they only change. Happiness comes from choosing better problems to work on.", "ar": "المشاكل لا تنتهي، بل تتغير. السعادة تأتي من اختيار مشاكل أفضل تعمل عليها.", "by": "The Subtle Art of Not Giving a F*ck · Mark Manson"}, {"id": "b14", "c": "book", "en": "You do not always need motivation to start. Action creates motivation. Do something small, and the feeling follows.", "ar": "لا تحتاج دائمًا إلى دافع لتبدأ. الفعل هو من يصنع الدافع. افعل شيئًا صغيرًا ثم يأتي الشعور.", "by": "The Subtle Art of Not Giving a F*ck · Mark Manson"}, {"id": "b15", "c": "book", "en": "Take responsibility for how you respond, even when something was not your fault. That is where your power lives.", "ar": "تحمّل مسؤولية طريقة ردّك، حتى لو لم يكن الخطأ خطأك. هناك تكمن قوتك.", "by": "The Subtle Art of Not Giving a F*ck · Mark Manson"}, {"id": "b16", "c": "book", "en": "Do the most important work in long, protected, distraction-free blocks. Deep focus is rare, so it is valuable.", "ar": "أنجز أهم عمل في فترات طويلة محمية بلا مشتتات. التركيز العميق نادر، ولذلك هو ثمين.", "by": "Deep Work · Cal Newport"}, {"id": "b17", "c": "book", "en": "Do fewer things, but the right ones. Saying no to good options is how you make room for the great one.", "ar": "افعل أقل، لكن الأشياء الصحيحة. قول لا لخيارات جيدة هو ما يفسح مكانًا للخيار العظيم.", "by": "Essentialism · Greg McKeown"}, {"id": "b18", "c": "book", "en": "Talent counts, but effort counts twice: once to build skill, and again to turn skill into achievement.", "ar": "الموهبة مهمة، لكن الجهد يُحسب مرتين: مرة لبناء المهارة ومرة لتحويلها إلى إنجاز.", "by": "Grit · Angela Duckworth"}, {"id": "b19", "c": "book", "en": "Add the word “yet”. “I can’t do it” becomes “I can’t do it yet”, and effort begins to feel like growth.", "ar": "أضف كلمة «بعد». «لا أستطيع» تصبح «لا أستطيع بعد»، ويبدأ الجهد يبدو كنمو.", "by": "Mindset · Carol Dweck"}, {"id": "b20", "c": "book", "en": "Begin with the end in mind. Ask what you want your family to say about you in ten years, then work backwards.", "ar": "ابدأ والنهاية في ذهنك. اسأل ماذا تريد أن تقول أسرتك عنك بعد عشر سنوات، ثم اعمل بالعكس.", "by": "The 7 Habits of Highly Effective People · Stephen Covey"}, {"id": "b21", "c": "book", "en": "Put first things first. Spend more time on what is important but not urgent, like health, relationships and planning, before it becomes an emergency.", "ar": "ضع الأهم أولًا. اقضِ وقتًا أكبر فيما هو مهم وغير عاجل، مثل الصحة والعلاقات والتخطيط، قبل أن يتحول إلى طارئ.", "by": "The 7 Habits of Highly Effective People · Stephen Covey"}, {"id": "b22", "c": "book", "en": "Wealth is what you do not spend. Savings come from the gap between your ego and your income, so build that gap on purpose.", "ar": "الثروة هي ما لا تنفقه. الادخار يأتي من الفجوة بين الغرور والدخل، فابنِ هذه الفجوة عن قصد.", "by": "The Psychology of Money · Morgan Housel"}, {"id": "b23", "c": "book", "en": "Pay yourself first. Set aside a fixed part of every income before you spend any of it.", "ar": "ادفع لنفسك أولًا. اترك جزءًا ثابتًا من كل دخل قبل أن تنفق منه شيئًا.", "by": "The Richest Man in Babylon · George S. Clason"}, {"id": "b24", "c": "book", "en": "Build, measure, learn. Make the smallest version you can, show it to real people, and let their reaction guide the next step.", "ar": "ابنِ، قِس، تعلّم. اصنع أصغر نسخة ممكنة، واعرضها على أناس حقيقيين، ودع ردّ فعلهم يوجّه الخطوة التالية.", "by": "The Lean Startup · Eric Ries"}, {"id": "b25", "c": "book", "en": "When you talk to customers, ask about their lives and their past behaviour, not whether they like your idea. Opinions are cheap, habits are real.", "ar": "حين تتحدث مع الزبائن اسأل عن حياتهم وسلوكهم السابق، لا عن رأيهم في فكرتك. الآراء رخيصة والعادات حقيقية.", "by": "The Mom Test · Rob Fitzpatrick"}, {"id": "b26", "c": "book", "en": "You have about four thousand weeks in a lifetime. You cannot do everything, so choose what to give your time to on purpose.", "ar": "لديك حوالي أربعة آلاف أسبوع في العمر. لا تستطيع أن تفعل كل شيء، فاختر عن قصد ما تمنحه وقتك.", "by": "Four Thousand Weeks · Oliver Burkeman"}, {"id": "b27", "c": "book", "en": "Couples who stay close notice small invitations for attention and respond to them. “Look at that bird” is a bid for connection.", "ar": "الأزواج الذين يبقون قريبين ينتبهون لدعوات الاهتمام الصغيرة ويردّون عليها. «انظر إلى هذا الطائر» طلب للتقارب.", "by": "The Seven Principles for Making Marriage Work · John Gottman"}, {"id": "b28", "c": "book", "en": "People feel loved in different ways: words, time, gifts, help, touch. Learn which one your partner hears most clearly.", "ar": "الناس يشعرون بالحب بطرق مختلفة: كلمات، وقت، هدايا، مساعدة، لمس. اعرف أي لغة يسمعها شريكك بوضوح أكثر.", "by": "The Five Love Languages · Gary Chapman"}, {"id": "b29", "c": "book", "en": "Putting a good deed off until you are free is a trick of the self. Start now, even with a little.", "ar": "تأجيل الخير إلى حين الفراغ من خدع النفس. ابدأ الآن ولو بالقليل.", "by": "Al-Hikam al-‘Ata’iyya · Ibn ‘Ata’illah al-Iskandari", "moreEn": "Ibn ‘Ata’illah taught that postponing deeds until you are free is a folly of the self. Start now, even small.", "moreAr": "ابن عطاء الله علّم أن إحالة الأعمال على وجود الفراغ من حماقة النفس. ابدأ الآن حتى لو صغيرًا."}, {"id": "b30", "c": "book", "en": "People who review themselves each day find it easier to improve. A few minutes at night to look back and plan beat a long burst now and then.", "ar": "من يراجع نفسه كل يوم يسهل عليه أن يتحسّن. دقائق قليلة في الليل للنظر إلى الخلف والتخطيط أنفع من اندفاعة طويلة بين حين وآخر.", "by": "Ihya’ Ulum al-Din · al-Ghazali (muhasaba)"}, {"id": "b31", "c": "book", "en": "Start your day with one small win. Make your bed. It proves that the day has begun and that you keep your word to yourself.", "ar": "ابدأ يومك بانتصار صغير. رتّب سريرك. هذا يثبت أن اليوم بدأ وأنك تفي بوعدك لنفسك.", "by": "Make Your Bed · Admiral William H. McRaven"}, {"id": "b32", "c": "book", "en": "Celebrate right after you do the tiny habit, even with a quiet “well done”. The feeling of success is what wires the habit in.", "ar": "احتفل مباشرة بعد أداء العادة الصغيرة، ولو بكلمة «أحسنت» هادئة. الشعور بالنجاح هو ما يرسّخ العادة.", "by": "Tiny Habits · BJ Fogg"}, {"id": "b33", "c": "book", "en": "Resistance shows up in front of anything worth doing. The professional works anyway, at the same time, every day.", "ar": "المقاومة تظهر أمام كل ما يستحق العمل. المحترف يعمل رغم ذلك، في نفس الوقت، كل يوم.", "by": "The War of Art · Steven Pressfield"}, {"id": "b34", "c": "book", "en": "Small, smart choices repeated for long enough add up to big results. The same is true of small, careless choices.", "ar": "الاختيارات الصغيرة الذكية، حين تتكرر طويلًا، تصنع نتائج كبيرة. والأمر نفسه ينطبق على الاختيارات الصغيرة المهملة.", "by": "The Compound Effect · Darren Hardy"}], "money": [{"id": "m12", "c": "money", "en": "Write every expense on the day you spend it. The purchase you forget is the one that surprises you at the end of the month.", "ar": "سجّل كل مصروف في يومه. الشراء الذي تنساه هو الذي يفاجئك آخر الشهر.", "by": "Habits, Together", "byAr": "عادات معًا"}, {"id": "m01", "c": "faith", "en": "Those who, when they spend, are neither wasteful nor stingy, but keep a balance between the two.", "ar": "الذين إذا أنفقوا لم يسرفوا ولم يبخلوا، وكان إنفاقهم وسطًا بين ذلك.", "by": "Qur’an · Al-Furqan 25:67", "byAr": "القرآن · الفرقان 25:67", "orig": "وَالَّذِينَ إِذَا أَنفَقُوا لَمْ يُسْرِفُوا وَلَمْ يَقْتُرُوا وَكَانَ بَيْنَ ذَٰلِكَ قَوَامًا"}, {"id": "m13", "c": "money", "en": "A small daily spend adds up fast: 50 a day is 1,500 a month and 18,000 a year.", "ar": "المصروف الصغير اليومي يتراكم بسرعة: 50 كل يوم تصير 1,500 في الشهر و18,000 في السنة.", "by": "Habits, Together", "byAr": "عادات معًا"}, {"id": "m14", "c": "money", "en": "Before buying anything that is not on your list, wait one night. Most wants fade by morning.", "ar": "قبل أن تشتري أي شيء ليس في قائمتك، انتظر ليلة واحدة. معظم الرغبات تخفّ مع الصباح.", "by": "Habits, Together", "byAr": "عادات معًا"}, {"id": "m02", "c": "faith", "en": "Do not keep your hand tied to your neck, and do not stretch it out fully, or you will sit blamed and regretful.", "ar": "لا تجعل يدك مقيّدة إلى عنقك، ولا تفتحها كل الفتح فتجلس ملومًا نادمًا.", "by": "Qur’an · Al-Isra 17:29", "byAr": "القرآن · الإسراء 17:29", "orig": "وَلَا تَجْعَلْ يَدَكَ مَغْلُولَةً إِلَىٰ عُنُقِكَ وَلَا تَبْسُطْهَا كُلَّ الْبَسْطِ فَتَقْعُدَ مَلُومًا مَّحْسُورًا"}, {"id": "m15", "c": "money", "en": "Delivery is usually the most expensive way to eat. One more home-cooked meal a week changes the monthly number more than it seems.", "ar": "التوصيل غالبًا أغلى طريقة للأكل. وجبة إضافية في البيت كل أسبوع تغيّر رقم الشهر أكثر مما تتوقع.", "by": "Habits, Together", "byAr": "عادات معًا"}, {"id": "m16", "c": "money", "en": "Fixed payments are not daily decisions. Mark them paid once and keep the daily limit for living costs.", "ar": "المدفوعات الثابتة ليست قرارًا يوميًا. علّمها كمدفوعة مرة واحدة واترك الحد اليومي لمصاريف المعيشة.", "by": "Habits, Together", "byAr": "عادات معًا"}, {"id": "m03", "c": "faith", "en": "Eat and drink, but do not be wasteful. He does not love the wasteful.", "ar": "كلوا واشربوا ولا تسرفوا، إنه لا يحب المسرفين.", "by": "Qur’an · Al-A‘raf 7:31", "byAr": "القرآن · الأعراف 7:31", "orig": "وَكُلُوا وَاشْرَبُوا وَلَا تُسْرِفُوا ۚ إِنَّهُ لَا يُحِبُّ الْمُسْرِفِينَ"}, {"id": "m17", "c": "money", "en": "A daily limit is a promise to your future self, not a punishment. Staying under it on most days matters more than one perfect day.", "ar": "الحد اليومي وعد لنفسك في المستقبل وليس عقابًا. الالتزام به في أغلب الأيام أهم من يوم مثالي واحد.", "by": "Habits, Together", "byAr": "عادات معًا"}, {"id": "m18", "c": "money", "en": "If you return something, log the refund. The real cost is only what stays with you.", "ar": "إذا أرجعت شيئًا فسجّل المرتجع. التكلفة الحقيقية هي ما يبقى معك فقط.", "by": "Habits, Together", "byAr": "عادات معًا"}, {"id": "m04", "c": "faith", "en": "A servant’s feet will not move on the Day of Judgement until he is asked about his wealth: where he earned it and how he spent it.", "ar": "لا تتحرك قدما العبد يوم القيامة حتى يُسأل عن ماله: من أين كسبه وفيمَ أنفقه.", "by": "The Prophet ﷺ · Sunan at-Tirmidhi 2417", "byAr": "النبي ﷺ · سنن الترمذي 2417", "orig": "لا تَزُولُ قَدَمَا عَبْدٍ يَوْمَ الْقِيَامَةِ حَتَّى يُسْأَلَ عَنْ عُمُرِهِ فِيمَ أَفْنَاهُ... وَعَنْ مَالِهِ مِنْ أَيْنَ اكْتَسَبَهُ وَفِيمَ أَنْفَقَهُ"}, {"id": "m19", "c": "money", "en": "Ask: do I need it, or do I want it today? Needs go in the log without a second thought. Wants get the one-night rule.", "ar": "اسأل نفسك: أحتاجه أم أريده اليوم؟ الحاجة تُسجَّل بلا تردد، والرغبة تنتظر ليلة.", "by": "Habits, Together", "byAr": "عادات معًا"}, {"id": "m20", "c": "money", "en": "Spend five minutes every Sunday on last week: the biggest category, the biggest single purchase, and one thing to change.", "ar": "خصّص خمس دقائق كل أحد لمراجعة الأسبوع الماضي: أكبر فئة، وأكبر عملية شراء، وشيئًا واحدًا تغيّره.", "by": "Habits, Together", "byAr": "عادات معًا"}, {"id": "m05", "c": "faith", "en": "Wealth is not having many possessions. True wealth is the richness of the soul.", "ar": "الغنى ليس بكثرة المتاع، ولكن الغنى غنى النفس.", "by": "The Prophet ﷺ · Sahih al-Bukhari 6446, Sahih Muslim 1051", "byAr": "النبي ﷺ · صحيح البخاري 6446، صحيح مسلم 1051", "orig": "لَيْسَ الْغِنَى عَنْ كَثْرَةِ الْعَرَضِ، وَلَكِنَّ الْغِنَى غِنَى النَّفْسِ"}, {"id": "m21", "c": "money", "en": "A short note beside each expense, the shop or the reason, makes the monthly review ten times easier.", "ar": "ملاحظة قصيرة بجانب كل مصروف، اسم المحل أو السبب، تجعل مراجعة الشهر أسهل بكثير.", "by": "Habits, Together", "byAr": "عادات معًا"}, {"id": "m22", "c": "money", "en": "One big purchase can undo a good month. Decide big purchases on paper and keep them outside the daily limit.", "ar": "عملية شراء كبيرة واحدة قد تفسد شهرًا جيدًا. قرّر المشتريات الكبيرة على الورق وأبقها خارج الحد اليومي.", "by": "Habits, Together", "byAr": "عادات معًا"}, {"id": "m06", "c": "faith", "en": "The upper hand is better than the lower hand.", "ar": "اليد العليا خير من اليد السفلى.", "by": "The Prophet ﷺ · Sahih al-Bukhari 1429, Sahih Muslim 1033", "byAr": "النبي ﷺ · صحيح البخاري 1429، صحيح مسلم 1033", "orig": "الْيَدُ الْعُلْيَا خَيْرٌ مِنَ الْيَدِ السُّفْلَى"}, {"id": "m23", "c": "money", "en": "Income is easier to grow than spending is to cut forever. Give a few minutes every day to the next application or client message.", "ar": "زيادة الدخل أسهل من تقليل الصرف إلى الأبد. أعطِ بضع دقائق كل يوم لطلب العمل أو الرسالة التالية للعميل.", "by": "Habits, Together", "byAr": "عادات معًا"}, {"id": "m24", "c": "money", "en": "Children learn money from what they watch. Let them see you pause before a purchase and say why.", "ar": "الأطفال يتعلمون التعامل مع المال مما يشاهدونه. دعهم يرونك تتوقف قبل الشراء وتشرح السبب.", "by": "Habits, Together", "byAr": "عادات معًا"}, {"id": "m07", "c": "faith", "en": "What a good thing is honest wealth in the hands of a good man.", "ar": "نِعم المال الصالح للرجل الصالح.", "by": "The Prophet ﷺ · Musnad Ahmad 17763", "byAr": "النبي ﷺ · مسند أحمد 17763", "orig": "نِعْمَ الْمَالُ الصَّالِحُ لِلرَّجُلِ الصَّالِحِ"}, {"id": "m25", "c": "money", "en": "Prices in another currency feel smaller than they are. Check the converted amount before you pay.", "ar": "الأسعار بعملة أخرى تبدو أصغر مما هي. راجع المبلغ بعد التحويل قبل أن تدفع.", "by": "Habits, Together", "byAr": "عادات معًا"}, {"id": "m26", "c": "money", "en": "Subscriptions renew quietly. Once a month, look at the list and cancel what you did not use.", "ar": "الاشتراكات تتجدد بصمت. مرة في الشهر راجع القائمة وألغِ ما لم تستخدمه.", "by": "Habits, Together", "byAr": "عادات معًا"}, {"id": "m08", "c": "faith", "en": "It is enough sin for a man to neglect those he is responsible for feeding.", "ar": "يكفي الرجل إثمًا أن يضيّع من يعولهم.", "by": "The Prophet ﷺ · Sunan Abi Dawud 1692", "byAr": "النبي ﷺ · سنن أبي داود 1692", "orig": "كَفَى بِالْمَرْءِ إِثْمًا أَنْ يُضَيِّعَ مَنْ يَقُوتُ"}, {"id": "m27", "c": "money", "en": "A budget is not a cage. It is a plan that lets you spend the rest without guilt.", "ar": "الميزانية ليست قفصًا. هي خطة تتيح لك صرف الباقي دون شعور بالذنب.", "by": "Habits, Together", "byAr": "عادات معًا"}, {"id": "m28", "c": "money", "en": "Compare this month with last month at the same day, not with the whole month. The fair comparison keeps you honest.", "ar": "قارن هذا الشهر بالشهر الماضي عند اليوم نفسه، لا بالشهر كاملًا. المقارنة العادلة تبقيك صادقًا مع نفسك.", "by": "Habits, Together", "byAr": "عادات معًا"}, {"id": "m09", "c": "faith", "en": "Begin with yourself and give to yourself first. If something is left, give it to your family.", "ar": "ابدأ بنفسك فتصدّق عليها، فإن بقي شيء فلأهلك.", "by": "The Prophet ﷺ · Sahih Muslim 997", "byAr": "النبي ﷺ · صحيح مسلم 997", "orig": "ابْدَأْ بِنَفْسِكَ فَتَصَدَّقْ عَلَيْهَا، فَإِنْ فَضَلَ شَيْءٌ فَلِأَهْلِكَ"}, {"id": "m10", "c": "faith", "en": "Whoever fears Allah, He makes a way out for him and provides for him from where he does not expect.", "ar": "ومن يتق الله يجعل له مخرجًا ويرزقه من حيث لا يحتسب.", "by": "Qur’an · At-Talaq 65:2-3", "byAr": "القرآن · الطلاق 65:2-3", "orig": "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا ۝ وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ"}, {"id": "m11", "c": "faith", "en": "Satan threatens you with poverty and orders you to indecency, while Allah promises you forgiveness and bounty.", "ar": "الشيطان يخوّفكم الفقر ويأمركم بالفحشاء، والله يعدكم مغفرة منه وفضلًا.", "by": "Qur’an · Al-Baqarah 2:268", "byAr": "القرآن · البقرة 2:268", "orig": "الشَّيْطَانُ يَعِدُكُمُ الْفَقْرَ وَيَأْمُرُكُم بِالْفَحْشَاءِ ۖ وَاللَّهُ يَعِدُكُم مَّغْفِرَةً مِّنْهُ وَفَضْلًا"}]}, "impact": {"faith": {"en": {"improve": "Pick the one practice you miss most often, and tie it to a fixed moment, for example Qur'an pages right after Fajr or tafsir right after Maghrib. A time you keep is stronger than a long list you break.", "guidance": "Two pages a day is small enough to keep when life is busy. Read with the meaning in mind, and use tafsir to understand one idea you can act on that day. If you miss a day, return the next day without guilt.", "consistency": "Consistent small acts build closeness to Allah and a steady heart. The Prophet ﷺ taught that the most beloved deeds are the most consistent, even if small. At two pages a day you complete the mushaf in under a year."}, "ar": {"improve": "اختر العبادة التي تفوتك أكثر من غيرها، واربطها بوقت ثابت. مثلًا صفحات القرآن بعد الفجر والتفسير بعد المغرب. وقت تلتزم به أقوى من قائمة طويلة تتركها.", "guidance": "صفحتان في اليوم قدر صغير تقدر تحافظ عليه حتى في الأيام المزدحمة. اقرأ وأنت تفكر في المعنى، واستعن بالتفسير لتفهم فكرة واحدة تعمل بها في يومك. وإذا فاتك يوم ارجع في اليوم التالي بدون لوم.", "consistency": "الأعمال الصغيرة المستمرة تقرّبك من الله وتهدّئ قلبك. قال النبي ﷺ إن أحب الأعمال إلى الله أدومها وإن قل. بصفحتين كل يوم تختم المصحف في أقل من سنة."}, "sources": ["Sahih al-Bukhari 6464 and Sahih Muslim 783 on consistent deeds", "Madinah mushaf: 604 pages", "VanderWeele et al., JAMA Internal Medicine, 2016 (religious service attendance and mortality; not the same as Qur'an reading)"]}, "body": {"en": {"improve": "Look at which days the workout slips, and put it at the same time on those days. Weigh in once a week, same day, same conditions, and look at the trend line, not a single reading.", "guidance": "The World Health Organization recommends at least 150 minutes of moderate activity a week for adults. Five sessions of 30 minutes meet that. Water through the day is easier than catching up in the evening: six glasses is about 1.5 litres. This is general information, not medical advice.", "consistency": "Large studies link meeting the activity guideline with a clearly lower risk of dying early, compared with being inactive. Regular weigh-ins make slow changes visible, and visible progress keeps you going."}, "ar": {"improve": "انظر في أي أيام يفوتك التمرين وضعه في نفس الوقت في هذه الأيام. قِس وزنك مرة في الأسبوع، في نفس اليوم وبنفس الظروف، وانظر إلى الخط العام وليس إلى قراءة واحدة.", "guidance": "توصي منظمة الصحة العالمية البالغين بما لا يقل عن 150 دقيقة نشاط متوسط في الأسبوع. خمس مرات كل مرة 30 دقيقة تكفي. شرب الماء موزعًا على اليوم أسهل من تعويضه في المساء: ستة أكواب تقارب لترًا ونصفًا. هذه معلومات عامة وليست نصيحة طبية.", "consistency": "دراسات كبيرة تربط الوصول إلى الحد الموصى به من النشاط بانخفاض واضح في خطر الوفاة المبكرة مقارنة بقلة الحركة. والقياس الأسبوعي للوزن يُظهر التغيّر البطيء، ورؤية التقدم تساعدك على الاستمرار."}, "sources": ["WHO guidelines on physical activity and sedentary behaviour, 2020", "Arem et al., JAMA Internal Medicine, 2015", "EFSA water intake opinion, 2010"]}, "mind": {"en": {"improve": "Protect the 20 minutes by giving them a name, a time and a place, and by choosing the material in advance so you never spend the time deciding. Pick one podcast a week that is tied to something you are working on.", "guidance": "Learn in a way you can use: after each session, write one line about what you will apply. Rotate between your career skills and broader reading so both stay alive.", "consistency": "Twenty minutes a day on five days is about 100 minutes a week, over 80 hours in a year. Habits like this typically become automatic after about two months of repetition, with a wide individual range."}, "ar": {"improve": "احمِ العشرين دقيقة بأن تعطيها اسمًا ووقتًا ومكانًا، واختر المادة مسبقًا حتى لا تضيع الوقت في الاختيار. واختر بودكاست واحدًا في الأسبوع له علاقة بشيء تعمل عليه.", "guidance": "تعلّم بطريقة تقدر تطبّقها: بعد كل جلسة اكتب سطرًا عن شيء ستعمل به. بدّل بين مهارات عملك والقراءة العامة ليبقى الاثنان حيّين.", "consistency": "عشرون دقيقة في اليوم خمسة أيام تساوي نحو 100 دقيقة في الأسبوع، أي أكثر من 80 ساعة في السنة. وعادة مثل هذه تصير تلقائية في المتوسط بعد نحو شهرين من التكرار، مع اختلاف كبير بين شخص وآخر."}, "sources": ["Lally et al., European Journal of Social Psychology, 2010", "Arithmetic on your own targets"]}, "family": {"en": {"improve": "Put couple time in the calendar like an appointment, and decide the two slots at the start of the week. For the children, a fixed moment such as the bedtime story is easier to keep than a vague plan to play more.", "guidance": "Give full attention in small amounts: phones away, eye contact, one question that is not about logistics. Say one thing you appreciate about each other every day, and be specific.", "consistency": "Long studies find that the quality of close relationships is among the strongest predictors of health and happiness. A review of 148 studies found that people with stronger relationships had about a 50% higher likelihood of survival."}, "ar": {"improve": "ضع وقت الزوجين في التقويم كأنه موعد، وحدّد الوقتين في بداية الأسبوع. ومع الأولاد، لحظة ثابتة مثل قصة ما قبل النوم أسهل في الاستمرار من نية عامة أن تلعب معهم أكثر.", "guidance": "أعطِ انتباهك كاملًا ولو لوقت قصير: الجوال جانبًا، ونظر في العين، وسؤال واحد ليس عن الترتيبات. وقل كل يوم شيئًا واحدًا تقدّره في شريكك، وكن محددًا.", "consistency": "الدراسات الطويلة تجد أن جودة العلاقات القريبة من أقوى ما يتنبأ بالصحة والسعادة. ووجدت مراجعة لـ 148 دراسة أن أصحاب العلاقات الأقوى احتمال بقائهم أحياءً أعلى بنحو 50%."}, "sources": ["Waldinger and Schulz, The Good Life, 2023 (Harvard Study of Adult Development)", "Holt-Lunstad, Smith and Layton, PLoS Medicine, 2010", "Sunan at-Tirmidhi 3895"]}, "money": {"en": {"improve": "Spending: log the day's total every day, even on bad days. A number you see changes behaviour. Delivery: decide on three delivery nights for the week in advance, and plan the other dinners on Sunday. Income: protect the daily 60-minute block at a fixed hour and end it by sending something out.", "guidance": "For {p2}'s business: research feels like progress but only customers and outputs prove it. Aim for one finished thing each week and a few real conversations with possible customers before building more. {p1}: measure the block by what left your hands (applications, messages, pitches), not by hours. This is general guidance, not financial advice.", "consistency": "Staying under the daily limit adds up month after month, and the weekly delivery cap shifts money toward things you value. A steady income effort creates chances over time, and one weekly output turns an idea into a business step by step."}, "ar": {"improve": "المصروف: سجّل إجمالي اليوم كل يوم حتى في الأيام السيئة، فالرقم الذي تراه يغيّر السلوك. التوصيل: حدّد ثلاث ليالي توصيل للأسبوع مسبقًا، وخطّط للعشاء في بقية الأيام يوم الأحد. الدخل: احمِ ساعة العمل اليومية في وقت ثابت وأنهِها بإرسال شيء فعلي.", "guidance": "لمشروع {p2}: البحث يعطي إحساسًا بالتقدم لكن الدليل الحقيقي هو الزبائن والإنجازات. اجعل هدفك إنجازًا واحدًا مكتملًا كل أسبوع وكلامًا حقيقيًا مع زبائن محتملين قبل أن تبني أكثر. ولـ{p1}: قِس الساعة بما خرج من يدك (طلبات وتواصل وعروض) وليس بعدد الساعات. هذا إرشاد عام وليس نصيحة مالية.", "consistency": "الالتزام بالحد اليومي يتراكم شهرًا بعد شهر، وسقف التوصيل الأسبوعي يحوّل المال إلى أشياء تهمّكم أكثر. والجهد المستمر في الدخل يخلق فرصًا مع الوقت، وإنجاز أسبوعي واحد يحوّل الفكرة إلى مشروع خطوة بخطوة."}, "sources": ["Calculated from your own entries", "Customer-development approach: talk to real customers early (Steve Blank; Eric Ries, The Lean Startup)"]}, "heart": {"en": {"improve": "Gratitude works best when it is specific: three real things from today, not a repeated list. Giving can be tiny: a message, a smile, a favour. Put {p2}'s time for herself in the calendar first, so it does not depend on what is left over.", "guidance": "Protect the time for yourself without explaining or apologising. Do something that fills you up and is not a task. Count one act of giving each time you make someone's day easier.", "consistency": "In experiments, people who wrote down what they were grateful for were more optimistic and more satisfied with life. Another study found that spending a small amount on others made people happier than spending it on themselves."}, "ar": {"improve": "الشكر يعمل أفضل عندما يكون محددًا: ثلاثة أشياء حقيقية من اليوم وليس قائمة تتكرر. والعطاء قد يكون صغيرًا: رسالة أو ابتسامة أو خدمة. ضع وقت {p2} لنفسها في الجدول أولًا حتى لا يعتمد على ما يتبقى.", "guidance": "احمِ الوقت الذي تخصصه لنفسك بدون تبرير أو اعتذار. افعل شيئًا يملؤك ولا يكون مهمة. واحسب عطاءً في كل مرة تسهّل فيها يوم أحد.", "consistency": "في التجارب، من كتبوا ما يشكرون عليه كانوا أكثر تفاؤلًا ورضًا عن حياتهم. ودراسة أخرى وجدت أن إنفاق مبلغ صغير على الآخرين أسعد الناس أكثر من إنفاقه على أنفسهم."}, "sources": ["Emmons and McCullough, Journal of Personality and Social Psychology, 2003", "Dunn, Aknin and Norton, Science, 2008", "Sunan at-Tirmidhi 1956 on a smile as charity"]}}, "tips": {"quran": [{"en": "Pin your two pages to a moment you never skip, such as right after Fajr. The old habit carries the new one.", "ar": "اربط صفحتيك بلحظة لا تفوّتها أبدًا، مثل بعد الفجر مباشرة. العادة القديمة تحمل الجديدة.", "book": "Atomic Habits"}, {"en": "Leave the mushaf open where you will sit tonight. Make the good habit the easy one.", "ar": "اترك المصحف مفتوحًا في المكان الذي ستجلس فيه الليلة. اجعل العادة الجيدة هي الأسهل.", "book": "Atomic Habits"}, {"en": "If a day goes wrong, read just one page. Not zero is the rule, and the streak of showing up matters most.", "ar": "لو اليوم ضاع، اقرأ صفحة واحدة. القاعدة: ليس صفرًا، والمهم سلسلة الحضور.", "book": "Tiny Habits"}], "tafsir": [{"en": "Read the tafsir of the same ayat you recited and write one line you can act on today.", "ar": "اقرأ تفسير نفس الآيات التي تلوتها واكتب سطرًا واحدًا يمكنك العمل به اليوم.", "book": ""}, {"en": "Do tafsir right after Maghrib with tea. A pleasant ritual makes the habit attractive.", "ar": "اجعل التفسير بعد المغرب مع الشاي. الطقس اللطيف يجعل العادة جذابة.", "book": "Atomic Habits"}], "practice": [{"en": "Choose a trigger you never miss, like leaving the mosque or brushing your teeth, and say your azkar right then.", "ar": "اختر محفزًا لا يفوتك، مثل الخروج من المسجد أو غسل الأسنان، وقل أذكارك في تلك اللحظة.", "book": "Atomic Habits"}, {"en": "Keep a small azkar card or app where your eyes land in the morning. What you see, you do.", "ar": "ضع بطاقة أذكار صغيرة أو تطبيقًا حيث تقع عينك صباحًا. ما تراه تفعله.", "book": "Atomic Habits"}], "qiyam": [{"en": "Decide the three nights now, for example Sunday, Tuesday and Thursday, and prepare your clothes and prayer mat before sleep.", "ar": "حدّد الليالي الثلاث الآن، مثلًا الأحد والثلاثاء والخميس، وجهّز ملابسك وسجادتك قبل النوم.", "book": "The Power of Habit"}, {"en": "Two rak‘ahs count. A short night prayer you keep is better than a long one you skip.", "ar": "ركعتان تُحسبان. قيام قصير تحافظ عليه أفضل من طويل تتركه.", "book": "Atomic Habits"}], "fast": [{"en": "Put the Monday and Thursday fasts in the calendar at the start of the month and pick the two you will keep.", "ar": "ضع صيام الاثنين والخميس في التقويم أول الشهر واختر اليومين اللذين ستلتزم بهما.", "book": "The 7 Habits of Highly Effective People"}, {"en": "Plan the suhoor the night before so the decision is already made.", "ar": "جهّز السحور من الليلة السابقة ليكون القرار متخذًا مسبقًا.", "book": "Atomic Habits"}], "exercise": [{"en": "Look at which days the workout slips and put it at the same hour on those days. Same time, same place, no debate.", "ar": "انظر في أي الأيام يفوتك التمرين وضعه في نفس الساعة في تلك الأيام. نفس الوقت ونفس المكان دون نقاش.", "book": "Atomic Habits"}, {"en": "On a tired day do ten minutes. Showing up keeps the identity of someone who trains.", "ar": "في اليوم المتعب اعمل عشر دقائق. الحضور يحافظ على هوية من يتمرن.", "book": "Tiny Habits"}, {"en": "Lay out your workout clothes the night before. The easiest start wins.", "ar": "جهّز ملابس التمرين من الليلة السابقة. أسهل بداية هي الفائزة.", "book": "Atomic Habits"}], "water": [{"en": "Keep a bottle where you work and fill it twice. Spread six glasses across the day instead of catching up at night.", "ar": "ضع زجاجة حيث تعمل واملأها مرتين. وزّع الأكواب الستة على اليوم بدل التعويض في الليل.", "book": "Atomic Habits"}, {"en": "Drink one glass right after each prayer. The prayer is the cue.", "ar": "اشرب كوبًا بعد كل صلاة. الصلاة هي الإشارة.", "book": "Atomic Habits (habit stacking)"}], "weigh": [{"en": "Weigh in on the same morning each week, same conditions, and look at the trend line, not a single reading.", "ar": "قِس وزنك في نفس الصباح كل أسبوع وبنفس الظروف، وانظر إلى الاتجاه وليس قراءة واحدة.", "book": "Self-monitoring research"}], "steps": [{"en": "Walk ten minutes after the biggest meal. It is easy to remember and the steps add up.", "ar": "امشِ عشر دقائق بعد أكبر وجبة. من السهل تذكرها والخطوات تتراكم.", "book": "Atomic Habits"}], "learn": [{"en": "Protect twenty minutes at a fixed hour and choose the material in advance so you never spend the time deciding.", "ar": "احمِ عشرين دقيقة في ساعة ثابتة واختر المادة مسبقًا حتى لا تضيع الوقت في القرار.", "book": "Deep Work"}, {"en": "After each session write one line about what you will apply. Learning that is used sticks.", "ar": "بعد كل جلسة اكتب سطرًا عما ستطبّقه. التعلّم الذي يُستخدم يثبت.", "book": "Make It Stick"}], "podcast": [{"en": "Listen on a commute or while washing up, and pick one episode tied to something you are working on.", "ar": "استمع في المواصلات أو أثناء غسل الأطباق، واختر حلقة مرتبطة بشيء تعمل عليه.", "book": "Atomic Habits (temptation bundling)"}], "couple": [{"en": "Put the two couple slots in the calendar on Sunday, like appointments, and protect them. Phones away, one question that is not about logistics.", "ar": "ضعا موعدي الوقت الجميل في التقويم يوم الأحد مثل المواعيد المهمة واحمياهما. هواتف بعيدة وسؤال واحد ليس عن الترتيبات.", "book": "The Seven Principles for Making Marriage Work"}, {"en": "Notice the small invitations: “look at this”, a sigh, a joke. Turning toward them is where closeness is built.", "ar": "انتبها للدعوات الصغيرة: «انظر إلى هذا» أو تنهيدة أو نكتة. الاستجابة لها هي مكان بناء القرب.", "book": "The Seven Principles for Making Marriage Work"}], "kids": [{"en": "Pick one fixed ten-minute moment, like after dinner, where the children get your full attention, phone away.", "ar": "اختر لحظة ثابتة مدتها عشر دقائق، مثل بعد العشاء، يحصل فيها الأولاد على كامل انتباهك والهاتف بعيدًا.", "book": "Atomic Habits"}], "story": [{"en": "Make the bedtime story the last thing before lights out. The routine itself calms the evening.", "ar": "اجعل قصة ما قبل النوم آخر شيء قبل إطفاء الأنوار. الروتين نفسه يهدّئ المساء.", "book": "The Power of Habit"}], "appreciate": [{"en": "Say one specific thing at the same moment each day, like when you sit for dinner. “Thank you for handling the school call” beats “thanks for everything”.", "ar": "قل شيئًا محددًا في نفس اللحظة كل يوم، مثل وقت العشاء. «شكرًا لأنك تعاملت مع مكالمة المدرسة» أفضل من «شكرًا على كل شيء».", "book": "The Five Love Languages"}], "spend": [{"en": "Log the day’s total every day, even on bad days. A number you can see changes what you do tomorrow.", "ar": "سجّل إجمالي اليوم كل يوم حتى في الأيام السيئة. الرقم الذي تراه يغيّر ما تفعله غدًا.", "book": "Self-monitoring research"}, {"en": "Decide the day’s limit in the morning and check the total at lunch. A mid-day look is easier than a night regret.", "ar": "حدّد حد اليوم صباحًا وراجع الإجمالي وقت الغداء. نظرة منتصف النهار أسهل من ندم الليل.", "book": "Self-monitoring research"}], "delivery": [{"en": "On Sunday choose the three delivery nights and plan the other dinners. A plan beats willpower at 9 pm.", "ar": "يوم الأحد اختر ليالي التوصيل الثلاث وخطط للعشاءات الأخرى. الخطة أقوى من الإرادة الساعة 9 مساءً.", "book": "Atomic Habits"}, {"en": "Keep two fast meals in the freezer. The easy home option defeats the easy phone option.", "ar": "احتفظ بوجبتين سريعتين في الفريزر. الخيار المنزلي السهل يهزم خيار الهاتف السهل.", "book": "Atomic Habits"}], "jobhunt": [{"en": "Put the 60 minutes at a fixed hour and end it by sending something out: an application, a message, a pitch. Measure what left your hands, not the hours.", "ar": "ضع الستين دقيقة في ساعة ثابتة وأنهِها بإرسال شيء: طلب أو رسالة أو عرض. قِس ما خرج من يدك لا الساعات.", "book": "Deep Work"}, {"en": "Keep a simple list of three kinds of actions: apply, reach out, learn. Rotate them so the hour never feels stuck.", "ar": "احتفظ بقائمة بسيطة من ثلاثة أنواع من الأفعال: تقديم وتواصل وتعلّم. بدّل بينها كي لا تشعر أن الساعة عالقة.", "book": "Essentialism"}], "bizfocus": [{"en": "Decide the single outcome of the 45 minutes before you start: one page, one call, one sample. Research alone feels like progress but is not.", "ar": "حدّد النتيجة الوحيدة للخمس والأربعين دقيقة قبل أن تبدأ: صفحة أو مكالمة أو نموذج. البحث وحده يشبه التقدّم لكنه ليس تقدّمًا.", "book": "The Lean Startup"}, {"en": "Close the tabs, put the phone in another room, and work in one block. Depth beats hours.", "ar": "أغلقي التبويبات وضعي الهاتف في غرفة أخرى واعملي في فترة واحدة. العمق أهم من الساعات.", "book": "Deep Work"}], "bizoutput": [{"en": "End the week with one finished thing you can show to a real person, even if small. Then log it here.", "ar": "اختمي الأسبوع بشيء مكتمل يمكنك أن تُريه لشخص حقيقي حتى لو كان صغيرًا. ثم سجّليه هنا.", "book": "The Lean Startup"}, {"en": "Talk to one possible customer this week and ask about their life, not your idea.", "ar": "تحدّثي مع زبون محتمل واحد هذا الأسبوع واسأليه عن حياته لا عن فكرتك.", "book": "The Mom Test"}], "bizcheck": [{"en": "Keep the 15 minutes short and fixed: what we did, what is next, one thing blocking us.", "ar": "اجعلا الخمس عشرة دقيقة قصيرة وثابتة: ماذا فعلنا وما التالي وما العائق الوحيد.", "book": "Essentialism"}], "metime": [{"en": "Put your time for yourself in the calendar before everything else so it does not depend on what is left.", "ar": "ضعي وقتك لنفسك في التقويم قبل أي شيء حتى لا يعتمد على ما يتبقى.", "book": "Essentialism"}, {"en": "Do something that fills you up and is not a task. You do not need to explain it.", "ar": "افعلي شيئًا يملأك وليس مهمة. لا تحتاجين لتبريره.", "book": "Four Thousand Weeks"}], "gratitude": [{"en": "Name three specific things from today, not the same list as yesterday. Specific is what changes the feeling.", "ar": "اذكر ثلاثة أشياء محددة من اليوم لا نفس قائمة الأمس. المحدد هو ما يغيّر الشعور.", "book": "Emmons and McCullough, 2003"}, {"en": "Do it at the same time each night, for example before you put the phone down to sleep.", "ar": "افعلها في نفس الوقت كل ليلة، مثلًا قبل أن تضع الهاتف للنوم.", "book": "Atomic Habits"}], "give": [{"en": "Giving can be tiny: a message, a smile, a favour. Keep one in your pocket for the day.", "ar": "العطاء يمكن أن يكون صغيرًا: رسالة أو ابتسامة أو خدمة. احتفظ بواحد في جيبك لليوم.", "book": "Prophetic teaching on a smile as charity"}, {"en": "Schedule one act of giving for the start of the day. Done early, it colours the rest.", "ar": "حدّد فعل عطاء واحد في بداية اليوم. إذا تم مبكرًا، لوّن بقية اليوم.", "book": "Atomic Habits"}], "general": [{"en": "Attach it to something you already do each day. Habits grow best when they ride on another habit.", "ar": "اربطها بشيء تفعله أصلًا كل يوم. العادات تنمو أفضل حين تركب على عادة أخرى.", "book": "Atomic Habits"}, {"en": "Shrink it until it takes two minutes on a tired day. Not zero is the rule.", "ar": "صغّرها حتى تأخذ دقيقتين في اليوم المتعب. القاعدة: ليس صفرًا.", "book": "Atomic Habits"}, {"en": "Make it visible: a note, an object, a place. What is in front of you gets done.", "ar": "اجعلها مرئية: ملاحظة أو غرض أو مكان. ما أمامك يُنجز.", "book": "Atomic Habits"}]}, "trophies": [{"id": "k_checkins", "icon": "check", "en": "Check-in champion", "ar": "بطل التسجيل", "dEn": "Habits you ticked since you started. Next level: {n}.", "dAr": "العادات التي سجّلتها منذ البداية. المستوى التالي: {n}.", "rule": {"t": "checkins"}, "tiers": [25, 100, 250, 500, 1000, 2000]}, {"id": "k_fulldays", "icon": "sun", "en": "Full days", "ar": "أيام كاملة", "dEn": "Days with every daily habit done. Next level: {n} days.", "dAr": "أيام أنجزت فيها كل العادات اليومية. المستوى التالي: {n} يومًا.", "rule": {"t": "fulldays"}, "tiers": [3, 10, 25, 50, 100, 200]}, {"id": "k_streak", "icon": "flame", "en": "Streak", "ar": "السلسلة", "dEn": "Best run of days in a row at 60% or more. Next level: {n} days.", "dAr": "أفضل سلسلة أيام متتالية بنسبة 60% أو أكثر. المستوى التالي: {n} يومًا.", "rule": {"t": "streak"}, "tiers": [3, 7, 14, 30, 66, 100]}, {"id": "k_quran", "icon": "book", "en": "Qur’an pages", "ar": "صفحات القرآن", "dEn": "Pages recited since you started (604 = one khatma). Next level: {n} pages.", "dAr": "الصفحات التي تلوتها منذ البداية (604 = ختمة). المستوى التالي: {n} صفحة.", "rule": {"t": "pages", "k": "quran"}, "tiers": [20, 150, 302, 604, 1208, 1812]}, {"id": "k_tafsir", "icon": "book", "en": "Tafsir pages", "ar": "صفحات التفسير", "dEn": "Tafsir pages read. Next level: {n} pages.", "dAr": "صفحات التفسير المقروءة. المستوى التالي: {n} صفحة.", "rule": {"t": "pages", "k": "tafsir"}, "tiers": [20, 150, 302, 604]}, {"id": "k_azkar", "icon": "sun", "en": "Morning azkar", "ar": "أذكار الصباح", "dEn": "Mornings you said your azkar. Next level: {n} days.", "dAr": "صباحات قلت فيها أذكارك. المستوى التالي: {n} يومًا.", "rule": {"t": "days", "h": "azkar_am"}, "tiers": [7, 30, 100, 200, 365]}, {"id": "k_qiyam", "icon": "star", "en": "Night prayer", "ar": "قيام الليل", "dEn": "Nights you stood in prayer. Next level: {n} nights.", "dAr": "ليالٍ قمت فيها. المستوى التالي: {n} ليلة.", "rule": {"t": "days", "h": "qiyam"}, "tiers": [3, 10, 30, 100]}, {"id": "k_fast", "icon": "star", "en": "Monday and Thursday fasts", "ar": "صيام الاثنين والخميس", "dEn": "Voluntary fasts completed. Next level: {n}.", "dAr": "أيام صيام تطوّع أكملتها. المستوى التالي: {n}.", "rule": {"t": "days", "h": "fast"}, "tiers": [2, 6, 12, 24]}, {"id": "k_exercise", "icon": "run", "en": "Movement", "ar": "الحركة", "dEn": "Minutes of exercise since you started. Next level: {n} minutes.", "dAr": "دقائق التمرين منذ البداية. المستوى التالي: {n} دقيقة.", "rule": {"t": "minutes", "k": "exercise"}, "tiers": [60, 300, 1000, 3000, 6000, 12000]}, {"id": "k_water", "icon": "drop", "en": "Water days", "ar": "أيام الماء", "dEn": "Days you reached your water goal. Next level: {n} days.", "dAr": "أيام وصلت فيها لهدف الماء. المستوى التالي: {n} يومًا.", "rule": {"t": "days", "h": "water"}, "tiers": [3, 7, 30, 100, 200]}, {"id": "k_weigh", "icon": "scale", "en": "Weigh-ins", "ar": "قياس الوزن", "dEn": "Weigh-ins logged. Next level: {n}.", "dAr": "قياسات وزن مسجّلة. المستوى التالي: {n}.", "rule": {"t": "days", "h": "weigh"}, "tiers": [2, 4, 12, 26, 52]}, {"id": "k_learn", "icon": "book", "en": "Learning", "ar": "التعلّم", "dEn": "Minutes of learning. Next level: {n} minutes.", "dAr": "دقائق التعلّم. المستوى التالي: {n} دقيقة.", "rule": {"t": "minutes", "k": "study"}, "tiers": [120, 600, 1800, 6000, 12000]}, {"id": "k_couple", "icon": "couple", "en": "Couple time", "ar": "وقتنا معًا", "dEn": "Times you gave each other real time. Next level: {n}.", "dAr": "مرات أعطيتما فيها بعضكما وقتًا حقيقيًا. المستوى التالي: {n}.", "rule": {"t": "days", "h": "couple"}, "tiers": [3, 10, 30, 60, 100, 200]}, {"id": "k_kids", "icon": "heart", "en": "Time with the children", "ar": "وقت مع الأولاد", "dEn": "Days you played or talked with the children. Next level: {n} days.", "dAr": "أيام لعبت أو تحدثت فيها مع الأولاد. المستوى التالي: {n} يومًا.", "rule": {"t": "days", "h": "kids"}, "tiers": [7, 30, 100, 365]}, {"id": "k_appreciate", "icon": "heart", "en": "Appreciation", "ar": "التقدير", "dEn": "Days you said what you appreciate. Next level: {n} days.", "dAr": "أيام قلت فيها ما تقدّره. المستوى التالي: {n} يومًا.", "rule": {"t": "days", "h": "appreciate"}, "tiers": [7, 30, 100, 365]}, {"id": "k_gratitude", "icon": "heart", "en": "Gratitude", "ar": "الشكر", "dEn": "Days of gratitude. Next level: {n} days.", "dAr": "أيام الشكر. المستوى التالي: {n} يومًا.", "rule": {"t": "days", "h": "gratitude"}, "tiers": [3, 10, 30, 100, 365]}, {"id": "k_give", "icon": "heart", "en": "Giving", "ar": "العطاء", "dEn": "Times you made someone smile or helped. Next level: {n}.", "dAr": "مرات أسعدت فيها أحدًا أو ساعدته. المستوى التالي: {n}.", "rule": {"t": "days", "h": "give"}, "tiers": [3, 10, 30, 100, 365]}, {"id": "k_underspend", "icon": "wallet", "en": "Under the limit", "ar": "تحت الحد", "dEn": "Best run of days in a row within the daily spend limit. Next level: {n} days.", "dAr": "أفضل سلسلة أيام متتالية ضمن حد المصروف اليومي. المستوى التالي: {n} يومًا.", "rule": {"t": "underspend"}, "tiers": [3, 7, 14, 30, 60, 100]}, {"id": "k_capweeks", "icon": "pot", "en": "Cooking weeks", "ar": "أسابيع الطبخ", "dEn": "Full weeks with delivery at or under the cap. Next level: {n} weeks.", "dAr": "أسابيع كاملة كان فيها التوصيل ضمن السقف أو أقل. المستوى التالي: {n} أسبوعًا.", "rule": {"t": "cap_weeks"}, "tiers": [2, 4, 8, 12, 26, 52]}, {"id": "k_jobhunt", "icon": "brief", "en": "Job and income hunt", "ar": "البحث عن عمل ودخل", "dEn": "Daily job and income blocks done. Next level: {n}.", "dAr": "فترات البحث عن عمل ودخل المنجزة. المستوى التالي: {n}.", "rule": {"t": "days", "h": "jobhunt"}, "tiers": [5, 15, 30, 60, 100, 200]}, {"id": "k_bizfocus", "icon": "brief", "en": "Business focus", "ar": "العمل على المشروع", "dEn": "Focus blocks on the business. Next level: {n}.", "dAr": "فترات التركيز على المشروع. المستوى التالي: {n}.", "rule": {"t": "days", "h": "bizfocus"}, "tiers": [3, 10, 30, 60, 100]}, {"id": "k_outputs", "icon": "idea", "en": "Weekly outputs", "ar": "إنجازات الأسبوع", "dEn": "Weekly business outputs logged. Next level: {n}.", "dAr": "إنجازات أسبوعية للمشروع. المستوى التالي: {n}.", "rule": {"t": "tagall"}, "tiers": [2, 6, 12, 26, 52]}, {"id": "k_talks", "icon": "talk", "en": "Customer conversations", "ar": "حديث مع زبائن", "dEn": "Conversations with possible customers. Next level: {n}.", "dAr": "محادثات مع زبائن محتملين. المستوى التالي: {n}.", "rule": {"t": "tag", "v": "talk"}, "tiers": [2, 5, 20, 50]}, {"id": "k_sales", "icon": "star", "en": "Sales", "ar": "المبيعات", "dEn": "Sales logged. Next level: {n}.", "dAr": "مبيعات مسجّلة. المستوى التالي: {n}.", "rule": {"t": "tag", "v": "sale"}, "tiers": [1, 3, 10, 25]}, {"id": "k_budgetdays", "icon": "wallet", "en": "Within budget", "ar": "ضمن الميزانية", "dEn": "Days you stayed within the daily limit. Next level: {n} days.", "dAr": "أيام التزمت فيها بالحد اليومي. المستوى التالي: {n} يومًا.", "rule": {"t": "days", "h": "under"}, "tiers": [5, 10, 20, 30, 60, 100]}, {"id": "k_logger", "icon": "check", "en": "Every day logged", "ar": "كل يوم مسجّل", "dEn": "Full weeks with spending logged every day. Next level: {n} weeks.", "dAr": "أسابيع كاملة سجّلت فيها مصروفك كل يوم. المستوى التالي: {n} أسبوعًا.", "rule": {"t": "logweeks"}, "tiers": [2, 4, 8, 12, 26, 52]}]};
const BUILD='2026-10-23f';
let CONTENT=CONTENT_DEFAULT;
try{const c=JSON.parse(localStorage.getItem('istiqama.content')||'null');if(c&&c.pools&&c.trophies&&c.v>=CONTENT_DEFAULT.v)CONTENT=c}catch(e){}
const IC={
  health:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  spiritual:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  knowledge:'<path d="M4 5.5c3-1.2 5.5-.9 8 .8 2.5-1.7 5-2 8-.8V19c-3-1.2-5.5-.9-8 .8-2.5-1.7-5-2-8-.8z"/><path d="M12 6.3v13.5"/>',
  relationships:'<circle cx="9" cy="8.5" r="3"/><circle cx="17" cy="9.5" r="2.4"/><path d="M3.5 19c.4-3.2 2.6-5 5.5-5s5.1 1.8 5.5 5"/><path d="M15.5 14.2c2.6-.3 4.6 1.1 5 4"/>',
  wealth:'<circle cx="12" cy="12" r="8"/><path d="M12 7.5v9M14.7 9.6c-.5-.9-1.5-1.3-2.7-1.3-1.6 0-2.7.8-2.7 1.9 0 2.7 5.4 1.2 5.4 3.9 0 1.1-1.1 2-2.7 2-1.3 0-2.3-.5-2.9-1.4"/>',
  other:'<path d="M12 3.5l2 5.6 5.6 2-5.6 2-2 5.6-2-5.6-5.6-2 5.6-2z"/>',
  flame:'<path d="M12 3c.6 3 4 4.6 4 8.8A4 4 0 0 1 12 16a4 4 0 0 1-4-4.2c0-1.7.8-2.8 1.7-3.6.2 1.3.9 2 1.8 2.2C11.2 8.2 10.6 5.6 12 3z"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  up:'<path d="M12 19V5M6 11l6-6 6 6"/>',down:'<path d="M12 5v14M6 13l6 6 6-6"/>',flat:'<path d="M5 12h14"/>',
  chl:'<path d="M15 5l-7 7 7 7"/>',chr:'<path d="M9 5l7 7-7 7"/>',
  t_today:'<circle cx="12" cy="12" r="8.5"/><path d="M8.2 12.3l2.6 2.6 5-5.4"/>',
  t_week:'<rect x="4" y="4.5" width="16" height="15" rx="3"/><path d="M4 9.5h16M9.3 9.5v10M14.7 9.5v10"/>',
  t_dash:'<path d="M4 17a8 8 0 1 1 16 0"/><path d="M12 17l4-5"/><circle cx="12" cy="17" r="1.3"/>',
  t_impact:'<path d="M4 18c0-7 5-12 16-12 0 8-5 13-12 13"/><path d="M4 20c2-5 5-8 9-10"/>',
  t_setup:'<path d="M5 7h9M18 7h1M5 17h1M10 17h9"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>'
};
IC.faith=IC.spiritual;IC.mind=IC.knowledge;IC.family=IC.relationships;IC.money=IC.wealth;IC.heart=IC.health;
IC.body='<circle cx="12" cy="5" r="2.2"/><path d="M12 8.5v5.5M7.5 10.5l4.5-2 4.5 2M9 20.5l3-6.5 3 6.5"/>';
IC.t_money=IC.wealth;IC.candy='<circle cx="12" cy="12" r="4.6"/><path d="M7.4 12 2.6 8.8v6.4zM16.6 12l4.8-3.2v6.4z"/>';
IC.plus='<path d="M12 5v14M5 12h14"/>';IC.minus='<path d="M5 12h14"/>';IC.bang='<path d="M12 6v8.2M12 18v.4"/>';IC.warn='<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.4"/>';
Object.assign(IC,{
  target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  eye:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  alert:'<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  swap:'<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  listcheck:'<path d="M3 6l2 2 4-4"/><path d="M3 14l2 2 4-4"/><path d="M13 6h8M13 14h8"/>',
  heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
  star:'<path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>'
});
const svgi=(n,cls,sw)=>'<svg class="ic '+(cls||'')+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+(sw||2)+'" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+IC[n]+'</svg>';
const areaName=id=>{const a=AREAS.find(x=>x.id===id)||AREAS[5];return (typeof ui!=='undefined'&&ui.lang==='ar')?a.ar:a.name};

/* ---------- state ---------- */
function defaults(){
  return {v:2,setup:false,currency:'EGP',rate:5,weekStart:0,start:ds(today()),
    people:[
      {id:'p1',name:'Muhammed',year:'',height:'',weight:'',why:'',focus:[]},
      {id:'p2',name:'Tota',year:'',height:'',weight:'',why:'',focus:[]}
    ],
    habits:LIB.filter(x=>x.on).map(mkHabit)};
}
let S=defaults(), L={p1:{},p2:{}}, mode='sample', DB=null, sync='sample';
let draft=null, draftDirty=false;
const ui={tab:'today',who:(function(){try{return localStorage.getItem('istiqama.me')==='p2'?'p2':'p1'}catch(e){return 'p1'}})(),dayOff:0,weekOff:0,trend:'week',period:'month',confirmReset:false,sheet:null,lang:(function(){try{return localStorage.getItem('istiqama.lang')==='ar'?'ar':'en'}catch(e){return 'en'}})()};

const person=id=>S.people.find(p=>p.id===id);
const pname=id=>{const n=(person(id)&&person(id).name)||'Person';return (ui.lang==='ar'&&NAME_AR[n])?NAME_AR[n]:n};
const pcol=id=>id==='p1'?'var(--p1)':'var(--p2)';
const ptxt=id=>id==='p1'?'var(--p1t)':'var(--p2t)';
const habitsFor=pid=>S.habits.filter(h=>h.who.indexOf(pid)>=0&&h.type!=='cap');
const activePids=()=>ui.who==='both'?['p1','p2']:[ui.who];
const unitOf=k=>{const u=KINDS[k]?KINDS[k].unit:'';return u==='cur'?S.currency:u};
const wkStart=d=>{const k=(d.getDay()-S.weekStart+7)%7;return addDays(d,-k)};
function perRange(){
  const k=['lweek','week','month','lmonth','life'].indexOf(ui.period)>=0?ui.period:'month';
  if(k==='lweek')return {k:k,r:P.wk(-1),p:P.wk(-2),lbl:T2('Last week','الأسبوع الماضي'),pl:T2('the week before','الأسبوع الذي قبله')};
  if(k==='lmonth')return {k:k,r:P.mo(-1),p:P.mo(-2),lbl:T2('Last month','الشهر الماضي'),pl:T2('the month before','الشهر الذي قبله')};
  if(k==='week')return {k:k,r:P.wk(0),p:P.wk(-1),lbl:T2('This week','هذا الأسبوع'),pl:T2('last week','الأسبوع الماضي')};
  if(k==='life')return {k:k,r:[pd(S.start),today()],p:null,lbl:T2('All time','كل الفترة'),pl:''};
  return {k:k,r:P.mo(0),p:P.mo(-1),lbl:T2('This month','هذا الشهر'),pl:T2('last month','الشهر الماضي')};
}
/* 'this month' for the usual view; the chosen period's own words otherwise */
function perWord(){const k=perRange().k;return k==='month'?'this month':k==='life'?'since you started':perRange().lbl.toLowerCase()}
function perSeg(){
  const k=perRange().k;
  return '<div class="pill-seg" role="group" aria-label="Period">'+[['lweek','Last week'],['week','This week'],['month','This month'],['lmonth','Last month'],['life','All time']].map(x=>'<button data-act="period" data-v="'+x[0]+'" aria-pressed="'+(k===x[0])+'">'+T2(x[1],{lweek:'الأسبوع الماضي',week:'هذا الأسبوع',month:'هذا الشهر',lmonth:'الشهر الماضي',life:'كل الفترة'}[x[0]])+'</button>').join('')+'</div>';
}
const P={
  wk:off=>{const a=addDays(wkStart(today()),7*off);return [a,addDays(a,6)]},
  mo:off=>{const t=today();return [new Date(t.getFullYear(),t.getMonth()+off,1),new Date(t.getFullYear(),t.getMonth()+off+1,0)]}
};

/* ---------- Arabic interface: dictionary + DOM translator + RTL ----------
   Every English phrase the app draws is listed here once. '#' stands for a number.
   Order does not matter: longer phrases are tried first. Arabic is plain spoken style. */
const AR_PAIRS=[
['spent','صُرف'],['average','المتوسط'],['a day','في اليوم'],['month end','نهاية الشهر'],['at this pace','بهذا المعدل'],['logged','مسجّلة'],['this week','هذا الأسبوع'],['last month','الشهر الماضي'],
['Edit categories','عدّل الفئات'],['Money','المال'],['Within the daily limit (automatic)','ضمن الحد اليومي (تلقائي)'],['Tap a category to show or hide it. Add your own below. Past expenses keep their category.','اضغط على الفئة لإظهارها أو إخفائها. أضف فئاتك أدناه. المصروفات القديمة تحتفظ بفئتها.'],['Categories','الفئات'],['New category','فئة جديدة'],['e.g. Pets','مثلًا: حيوانات أليفة'],['Arabic name (optional)','الاسم بالعربي (اختياري)'],['Add category','أضف الفئة'],['Back','رجوع'],['Give the category a name first.','اكتب اسم الفئة أولًا.'],['That category already exists.','هذه الفئة موجودة بالفعل.'],['Category added.','تمت إضافة الفئة.'],['Where the money goes','أين يذهب المال'],['Last month','الشهر الماضي'],['Week','الأسبوع'],['Month','الشهر'],['spent<br>this week','صُرف<br>هذا الأسبوع'],['No expenses logged in this period yet. Add them from Today and this fills in by itself.','لا توجد مصروفات مسجّلة في هذه الفترة بعد. سجّلها من «اليوم» وهتتعبّى لوحدها.'],['Biggest expense:','أكبر مصروف:'],['Not categorised','بدون فئة'],
['shared by both of you','مشترك بينكماا'],
['Tap to add what you spend. Limit # EGP a day','اضغط لتسجّل مصروفك. الحد # جنيه في اليوم'],['# expense','مصروف #'],['# expenses','# مصروفات'],['Total for the day','إجمالي اليوم'],['Add expense','أضف المصروف'],['Done','تم'],['Amount (EGP)','المبلغ (جنيه)'],['What for (optional)','لأي شيء (اختياري)'],['e.g. bread, taxi','مثلًا: عيش، تاكسي'],['Added today','المضاف اليوم'],['Added on this day','المضاف في هذا اليوم'],['Nothing added yet.','لم تُضف شيئًا بعد.'],['Enter an amount.','اكتب المبلغ.'],['Add each expense when it happens. The total adds up by itself and a new day starts at midnight.','سجّل كل مصروف وقت ما يحصل. الإجمالي بيتجمع لوحده، واليوم الجديد يبدأ عند منتصف الليل.'],['Delete this expense','احذف هذا المصروف'],['Category','الفئة'],['Expense','مصروف'],['Earlier total','إجمالي سابق'],['limit # EGP · over by #','الحد # جنيه · زاد بـ #'],['limit # EGP · left #','الحد # جنيه · المتبقي #'],
/* tabs and chrome */
['Weekly completion over twelve weeks','نسبة الإنجاز الأسبوعي خلال اثني عشر أسبوعًا'],['Last 12 weeks','آخر 12 أسبوعًا'],
['Today','اليوم'],['This week','هذا الأسبوع'],['Last week','الأسبوع الماضي'],['Week','الأسبوع'],['Weeks','أسابيع'],['Months','شهور'],['Month','الشهر'],
['Dashboard','اللوحة'],['Impact','الأثر'],['Setup','الإعدادات'],['Habits','العادات'],['Habit','العادة'],['Settings','الإعدادات'],
['Habits, Together','عادات، معًا'],['Every day, side by side','كل يوم، جنبًا إلى جنب'],
['Sample data','بيانات تجريبية'],['Saved on this device','محفوظ على هذا الجهاز'],['Shared and synced','مشترك ومتزامن'],['Not synced','غير متزامن'],
['Show habits for','عرض عادات'],['Both','الاثنان'],['Sections','الأقسام'],['Together','معًا'],['Who','لمن'],
['Previous day','اليوم السابق'],['Next day','اليوم التالي'],['Previous week','الأسبوع السابق'],['Next week','الأسبوع القادم'],['One less','أقل بواحد'],['One more','أكثر بواحد'],
['Period','الفترة'],['Range','المدى'],['All time','كل الوقت'],['Since you started','منذ بدأتم'],
/* sample banner / empty */
['You are looking at sample data.','أنتم تشاهدون بيانات تجريبية.'],
['Nothing here is yours yet: the check-ins, water, spending and orders are all made up so you can see how the app works. Set up your profiles and habits to start your own.','ليس هنا شيء يخصكم بعد: التسجيلات والماء والمصروف والطلبات كلها من تأليفنا لتتعرفوا على شكل التطبيق. جهّزوا ملفاتكم وعاداتكم وابدأوا بياناتكم الخاصة.'],
['Set up our profiles','جهّزوا ملفاتكم'],['Set up your profiles and habits','جهّزوا ملفاتكم وعاداتكم'],
['No habits set up yet.','لا توجد عادات بعد.'],['Open Setup to choose your habits.','افتح الإعدادات لتختار عاداتك.'],
['No habits assigned yet. Open Setup to add some.','لا توجد عادات لهذا الشخص بعد. افتح الإعدادات لإضافتها.'],
/* today */
['Every habit done. Well done.','كل العادات تمت. أحسنت!'],['Every habit done','كل العادات تمت'],['Everything shared is done','كل المشترك تم'],
['# left today','باقي # اليوم'],['# left that day','باقي # في ذلك اليوم'],
['today: #','اليوم: #'],['# of # today','# من # اليوم'],['# of # this month','# من # هذا الشهر'],['# of max # this week: over','# من أقصى # هذا الأسبوع: تجاوزت'],['# of max # this week','# من أقصى # هذا الأسبوع'],['# of max #','# من أقصى #'],
['# a month','# في الشهر'],['1 days a week · together','مرة في الأسبوع · معًا'],['1 days a week','مرة في الأسبوع'],['# days a week · together','# أيام في الأسبوع · معًا'],['# days a week','# أيام في الأسبوع'],['max # a week · together','أقصى # في الأسبوع · معًا'],['max # a week','أقصى # في الأسبوع'],
['this week','هذا الأسبوع'],['this month','هذا الشهر'],['Within the limit','ضمن الحد'],['Over the limit','تجاوزت الحد'],['within the limit','ضمن الحد'],['over the limit','تجاوزت الحد'],['the limit','الحد'],
['limit #','الحد #'],['Tap to enter. Limit # EGP a day','اضغط للإدخال. الحد # جنيه في اليوم'],['Tap to enter','اضغط للإدخال'],['. Goal #','. الهدف #'],
['Tap to enter your weight','اضغط لتسجّل وزنك'],['Tap to log what you produced','اضغط لتسجّل ما أنجزته'],['First weigh-in','أول قياس للوزن'],['kg since last time','كجم منذ آخر مرة'],
['Goal reached','وصلت للهدف'],['Below goal #','أقل من الهدف #'],['# orders this month, within # a week','# طلبات هذا الشهر، ضمن # في الأسبوع'],['# orders this month, over # a week','# طلبات هذا الشهر، فوق # في الأسبوع'],
['Everything shared','المشترك'],['left today','متبقٍ اليوم'],
/* sheet */
['Cancel','إلغاء'],['Save','حفظ'],['Clear','مسح'],['Remove','حذف'],['Close','إغلاق'],['Enter a number.','اكتب رقمًا.'],['Pick what you produced.','اختر ما أنجزته.'],
['What did you produce?','ماذا أنجزت؟'],['One line about it (optional)','سطر عنه (اختياري)'],['e.g. one-page plan, supplier quote','مثال: خطة من صفحة، عرض سعر من مورّد'],['e.g. Walk after dinner','مثال: مشي بعد العشاء'],['Optional. One or two lines.','اختياري. سطر أو اثنان.'],['Your weight in kg.','وزنك بالكيلو.'],['e.g. #','مثال: #'],
['Idea','فكرة'],['Customer talk','حديث مع زبون'],['Sample','نموذج'],['First sale','أول بيع'],['Repeat customer','زبون يعود'],
/* week */
['Mon','اثنين'],['Tue','ثلاثاء'],['Wed','أربعاء'],['Thu','خميس'],['Fri','جمعة'],['Sat','سبت'],['Sun','أحد'],
['Monday','الاثنين'],['Tuesday','الثلاثاء'],['Wednesday','الأربعاء'],['Thursday','الخميس'],['Friday','الجمعة'],['Saturday','السبت'],['Sunday','الأحد'],
['# of # this month','# من # هذا الشهر'],['# of #','# من #'],
['No data yet','لا توجد بيانات بعد'],['Building momentum','نبني الزخم'],['Steady','ثابت'],['Thriving','مزدهر'],
/* dashboard */
['Together #%','معًا #%'],['day streak','يوم متتالٍ'],['best #','الأفضل #'],['full days','أيام كاملة'],['check-ins','تسجيلات'],
['How each of you is improving','كيف يتحسّن كلٌّ منكما'],['percentage points','نقطة مئوية'],
['This week vs last week','هذا الأسبوع مقابل الماضي'],['This month vs last month','هذا الشهر مقابل الماضي'],['Latest 4 weeks vs first 4 weeks','آخر 4 أسابيع مقابل أول 4 أسابيع'],
['Needs 8 weeks of check-ins','يحتاج 8 أسابيع من التسجيل'],['Not enough data yet','البيانات لا تكفي بعد'],['# pts','# نقطة'],
['Score = days done divided by target days so far, capped at #% per habit.','النتيجة = الأيام المنجزة ÷ أيام الهدف حتى الآن، بحد أقصى #% لكل عادة.'],
['Progress over time','التقدّم عبر الزمن'],['Completion trend','اتجاه الإنجاز'],['Last # weeks','آخر # أسابيع'],['Monthly completion','الإنجاز الشهري'],
['Balance across life areas','التوازن بين مجالات الحياة'],['This month · dashed = last month','هذا الشهر · الخط المتقطع = الشهر الماضي'],['dashed = last month','الخط المتقطع = الشهر الماضي'],
['Each habit this month','كل عادة هذا الشهر'],['grouped by category','مقسّمة حسب المجال'],
['Daily spending','المصروف اليومي'],['Daily spending, last # days','المصروف اليومي، آخر # يوم'],['last # days · EGP','آخر # يوم · جنيه'],['average a day','المتوسط في اليوم'],['days within','أيام ضمن'],['best run of days','أطول سلسلة أيام'],
['this month','هذا الشهر'],['Month under the limit','شهر تحت الحد'],['Weight trend','اتجاه الوزن'],['weekly weigh-ins','قياس الوزن أسبوعيًا'],
['Latest # kg','آخر وزن # كجم'],['since #','منذ #'],['First weigh-in: # kg. A second one will draw the trend.','أول وزن: # كجم. القياس الثاني يرسم الاتجاه.'],['No weigh-ins yet. Log your weight once a week.','لا يوجد قياس بعد. سجّل وزنك مرة في الأسبوع.'],
['Trophies','الجوائز'],['Earned','تم'],['earned from your own numbers','من أرقامك أنت'],['# of # earned','# من # تم'],['earned','تم'],
['Trophy! ','جائزة! '],
['vs last month','مقابل الشهر الماضي'],['pts','نقطة'],['% of habits done','% من العادات تمت'],['No habits','لا عادات'],['done this month','تمت هذا الشهر'],['days completed','يوم تم'],
['✓ within the limit','✓ ضمن الحد'],['! over the limit','! تجاوزت الحد'],
/* impact */
['Impact on our lives','أثر العادات على حياتنا'],['Two kinds of information appear here.','هنا نوعان من المعلومات.'],['Your numbers','أرقامك'],['are counted from your own check-ins.','تُحسب من تسجيلاتك أنت.'],['What research found','ماذا وجدت الأبحاث'],
['comes from published studies of large groups. Those studies show associations, not guarantees for any one person, and this is not medical or financial advice.','تأتي من دراسات منشورة على مجموعات كبيرة. هذه الدراسات تُظهر ارتباطات وليست ضمانًا لشخص بعينه، وليست نصيحة طبية أو مالية.'],
['Where to improve','أين تتحسّن'],['Guidance','إرشاد'],['What consistency changes','ماذا يغيّر الالتزام'],['Sources:','المصادر:'],
['Building the habit itself','بناء العادة نفسها'],['# of # days','# من # يوم'],['# of 66 days','# من 66 يومًا'],['days completed','يوم تم'],
['Observational research','بحث رصدي'],['Meta-analysis','تحليل تجميعي'],['Small study','دراسة صغيرة'],['Calculated, not a study','حساب وليس دراسة'],
['Exercise (since you started)','التمرين (منذ بدأتم)'],['Exercise (this month)','التمرين (هذا الشهر)'],['Average per week','المتوسط في الأسبوع'],['of 150 min','من 150 دقيقة'],['WHO minimum for adults','الحد الأدنى للبالغين حسب منظمة الصحة'],
['Energy used (estimate)','الطاقة المحروقة (تقدير)'],['add weight in Setup','أضف وزنك في الإعدادات'],['5 METs × body weight × hours','5 وحدات MET × الوزن × الساعات'],
['Research band at this pace','ماذا تقول الأبحاث عند هذا المعدل'],['no activity yet','لا نشاط بعد'],['lower risk, below minimum','خطر أقل، تحت الحد الأدنى'],['lower risk, 1–2× minimum','خطر أقل، 1–2 ضعف الحد الأدنى'],['lower risk, 2–3× minimum','خطر أقل، 2–3 أضعاف الحد الأدنى'],['lower risk, 3×+ minimum','خطر أقل، 3 أضعاف فأكثر'],
['Group-level association from the study below, assuming moderate effort','ارتباط على مستوى المجموعات من الدراسة أدناه، بافتراض جهد متوسط'],
['Water (since you started)','الماء (منذ بدأتم)'],['Water (this month)','الماء (هذا الشهر)'],['Days at the daily goal','أيام وصلت فيها للهدف اليومي'],['Roughly in litres','تقريبًا باللتر'],['A glass is taken as # ml','الكوب = # مل'],
['Latest weight','آخر وزن'],['Change in the period','التغيّر في الفترة'],['needs two weigh-ins','يحتاج قياسين'],['Weigh-ins logged','قياسات الوزن'],
['Qur’an pages (since you started)','صفحات القرآن (منذ بدأتم)'],['Qur’an pages (this month)','صفحات القرآن (هذا الشهر)'],['Full recitations completed','ختمات كاملة'],['of # pages each','من # صفحة للختمة'],['Standard Madinah mushaf, all time','المصحف المدني، كل الوقت'],
['Progress to next completion','التقدّم نحو الختمة التالية'],['Days to finish at #-day pace','أيام للختم بمعدل آخر #يومًا'],
['Tafsir pages (since you started)','صفحات التفسير (منذ بدأتم)'],['Tafsir pages (this month)','صفحات التفسير (هذا الشهر)'],
['Study time (since you started)','وقت التعلّم (منذ بدأتم)'],['Study time (this month)','وقت التعلّم (هذا الشهر)'],
['Days of daily practice (since you started)','أيام الممارسة اليومية (منذ بدأتم)'],['Days of daily practice (this month)','أيام الممارسة اليومية (هذا الشهر)'],
['Days together (since you started)','أيام قضيتموها معًا (منذ بدأتم)'],['Days together (this month)','أيام قضيتموها معًا (هذا الشهر)'],
['Time together (since you started)','الوقت معًا (منذ بدأتم)'],['Time together (this month)','الوقت معًا (هذا الشهر)'],
['Job and income hunt (since you started)','البحث عن عمل ودخل (منذ بدأتم)'],['Job and income hunt (this month)','البحث عن عمل ودخل (هذا الشهر)'],
['Business focus (since you started)','العمل على المشروع (منذ بدأتم)'],['Business focus (this month)','العمل على المشروع (هذا الشهر)'],['Days done','أيام تمت'],
['Weekly outputs (since you started)','إنجازات الأسبوع (منذ بدأتم)'],['Weekly outputs (this month)','إنجازات الأسبوع (هذا الشهر)'],
['Spent (since you started)','المصروف (منذ بدأتم)'],['Spent (this month)','المصروف (هذا الشهر)'],['Average per logged day','المتوسط لكل يوم مسجّل'],['Average a day','المتوسط في اليوم'],['Days not recorded','أيام بلا تسجيل'],['left out of the average','لا تدخل في المتوسط'],['Daily limit: # EGP','الحد اليومي: # جنيه'],['Days within the limit','أيام ضمن الحد'],['of # logged days','من # يوم مسجّل'],
['Delivery orders (since you started)','طلبات التوصيل (منذ بدأتم)'],['Delivery orders (this month)','طلبات التوصيل (هذا الشهر)'],['cap #','الحد #'],
['Set aside (since you started)','المدّخر (منذ بدأتم)'],['Set aside (this month)','المدّخر (هذا الشهر)'],['Set aside since you started','المدّخر منذ بدأتم'],['Value in 12 months at this pace','القيمة بعد 12 شهرًا بهذا المعدل'],
['Simple checks (since you started)','تسجيلات بسيطة (منذ بدأتم)'],['Simple checks (this month)','تسجيلات بسيطة (هذا الشهر)'],
['Steps (since you started)','الخطوات (منذ بدأتم)'],['Steps (this month)','الخطوات (هذا الشهر)'],
['Books at 300 pages each','كتب بمعدل 300 صفحة'],['Books per year at this pace','كتب في السنة بهذا المعدل'],['Pages read (since you started)','صفحات مقروءة (منذ بدأتم)'],['Pages read (this month)','صفحات مقروءة (هذا الشهر)'],
['Physical activity and living longer','النشاط البدني وطول العمر'],['Regular religious practice and mortality','الممارسة الدينية المنتظمة والوفيات'],['Reading and survival','القراءة والبقاء'],['Close relationships and survival','العلاقات القريبة والبقاء'],['Compound growth of what you set aside','النمو المركّب لما تدّخره'],
/* units */
['minutes of exercise','دقيقة تمرين'],['pages of Qur\'an','صفحة من القرآن'],['check-ins','تسجيل'],['couple moments','لحظة كزوجين'],['days of gratitude','يوم شكر'],['job-hunt blocks','فترة بحث عن عمل'],['acts of giving','موقف عطاء'],
['#-day streak','سلسلة # يومًا'],['# min','# دقيقة'],['# pages','# صفحة'],['# ml','# مل'],
['min','دقيقة'],['hours','ساعة'],['pages','صفحة'],['glasses','كوب'],['litres','لتر'],['kcal','سعر'],['kg','كجم'],['days','يوم'],['times','مرة'],['orders','طلب'],['outputs','إنجاز'],['logged','تسجيل'],['done','تم'],['steps','خطوة'],['minutes','دقيقة'],['books','كتاب'],
/* setup */
['Set up our profiles','جهّزوا ملفاتكم'],['Profile one','الملف الأول'],['Profile two','الملف الثاني'],['Name','الاسم'],['Birth year','سنة الميلاد'],['Height (cm)','الطول (سم)'],['Weight (kg)','الوزن (كجم)'],
['Why these habits matter to you','لماذا تهمّك هذه العادات'],['Areas you most want to grow','المجالات التي تريد أن تنمو فيها أكثر'],
['Names are filled in for you. Choose the habits you want and who each one is for, then save.','الأسماء مكتوبة لك. اختر العادات التي تريدها ولمن كل واحدة، ثم احفظ.'],
['Tick the ones you will track','اختر ما ستتابعه'],['Life area','مجال الحياة'],['How often','كم مرة'],['Times','المرات'],['Type','النوع'],['Counts as','تُحسب كـ'],['Amount each time','الكمية كل مرة'],
['Amount each time (EGP)','الكمية كل مرة (جنيه)'],['Amount each time (glasses)','الكمية كل مرة (أكواب)'],['Amount each time (kg)','الكمية كل مرة (كجم)'],['Amount each time (min)','الكمية كل مرة (دقيقة)'],['Amount each time (pages)','الكمية كل مرة (صفحات)'],['Amount each time (steps)','الكمية كل مرة (خطوات)'],
['Maximum a week','الحد الأقصى في الأسبوع'],['Goal per day','الهدف في اليوم'],['Daily limit or goal','الحد أو الهدف اليومي'],['Per week','في الأسبوع'],['Per month','في الشهر'],
['Tick','علامة'],['Counted (e.g. glasses)','معدود (مثل الأكواب)'],['Number log','تسجيل رقم'],['Cap (stay under)','سقف (ابقَ تحته)'],['Tick with type and note','علامة مع نوع وملاحظة'],
['Both of us, separate ticks','كلانا، علامة لكل واحد'],['Together, one tick for both','معًا، علامة واحدة للاثنين'],['Add habit','أضف عادة'],['Add your own habit','أضف عادتك'],['All habits','كل العادات'],['Fewer','أقل'],['not needed','غير مطلوب'],
['Save and start tracking','احفظ وابدأ المتابعة'],['Saved. Tracking starts today.','تم الحفظ. المتابعة تبدأ اليوم.'],['Changes saved.','تم حفظ التغييرات.'],['Please enter both names.','اكتب الاسمين.'],['Choose at least one habit.','اختر عادة واحدة على الأقل.'],['Give the habit a name first.','اكتب اسمًا للعادة أولًا.'],
['Currency','العملة'],['Savings return assumed (% a year)','العائد المفترض للادخار (% في السنة)'],['Week starts on','الأسبوع يبدأ يوم'],
['Share with your partner','شارك مع شريكك'],['One link for both phones','رابط واحد للهاتفين'],['Copy link','انسخ الرابط'],['Link copied. Send it to your partner.','تم نسخ الرابط. أرسله لشريكك.'],['Press and hold the link to copy it.','اضغط مطولًا على الرابط لنسخه.'],
['Send this link to your partner. When she opens it, she sees the same profiles and check-ins, and her ticks show on your phone too. Anyone who has the link can see and edit, so share it only with her.','أرسل هذا الرابط لشريكك. عند فتحه سترى نفس الملفات والتسجيلات، وستظهر علاماتها على هاتفك. أي شخص معه الرابط يستطيع أن يرى ويعدّل، فشاركه معها فقط.'],
['Quotes, advice and trophies version #','نسخة الاقتباسات والنصائح والجوائز #'],
['Track ','تابع '],['Faith','الإيمان'],['Body & Health','الجسم والصحة'],['Mind & Knowledge','العقل والمعرفة'],['Family & Couple','الأسرة والزوجين'],['Money & Income','المال والدخل'],['Heart & Me-Time','القلب ووقت لي'],
['Names','الأسماء'],['Total spent on today','إجمالي مصروف اليوم'],['Total spent on ','إجمالي مصروف '],['Daily limit #','الحد اليومي #'],['Number of ','العدد: '],[' so far',' حتى الآن'],['Goal #','الهدف #'],['Weekly maximum #','الحد الأسبوعي #'],['Number on this day','العدد في هذا اليوم'],['today','اليوم'],['Arabic wording','صياغة الخطاب بالعربية'],['Masculine','مذكر'],['Feminine','مؤنث'],['New trophy! ','جائزة جديدة! '],['Top level','وصلت للقمة'],['Not yet','لم تبدأ بعد'],['levels','مستوى'],['Read more','اقرأ أكثر'],
['Reset','إعادة ضبط'],
/* currencies and misc */
['M','م'],['T','ث'],['W','ر'],['F','ج'],['S','س'],
['EGP','جنيه'],['AED','درهم'],['SAR','ريال'],['USD','دولار'],['EUR','يورو'],['GBP','جنيه إسترليني'],
['Water','الماء'],['Weight','الوزن'],['Exercise','التمرين'],['Quality time','وقت جميل'],['Reading','القراءة'],['Steps','الخطوات'],["Qur'an recitation",'تلاوة القرآن'],['Tafsir reading','قراءة التفسير'],['Study or learning','التعلّم'],['Saving money','ادّخار المال'],['Job and income hunt','البحث عن عمل ودخل'],['Business focus','العمل على المشروع'],['Daily practice (check only)','ممارسة يومية (علامة فقط)'],['Simple check','علامة بسيطة'],
['Cooking week','أسبوع طبخ'],
/* Coach labels etc. are produced bilingual in code */
['Copy my week for Claude','انسخ ملخّص أسبوعي'],['Copied. Paste it to Claude.','تم النسخ. الصقه عند Claude.']
];
const NAME_AR={Muhammed:'محمد',Muhammad:'محمد',Mohamed:'محمد',Tota:'توتا',Tuta:'توتا'};
const AR_EXACT={};
const AR_RULES=(function(){
  const rules=AR_PAIRS.filter(function(p){return p[0].length>1}).map(function(p){
    const e=p[0].replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/#/g,'(\\d[\\d,\\.]*)');
    const lead=/^[A-Za-z]/.test(p[0])?'\\b':'',tail=/[A-Za-z]$/.test(p[0])?'\\b':'';
    let k=0;const ar=p[1].split('#').map(function(x,i){return i?'$'+(++k)+x:x}).join('');
    return {len:p[0].length,re:new RegExp(lead+e+tail,'g'),ar:ar};
  });
  rules.sort(function(a,b){return b.len-a.len});
  return rules;
})();
function trs(s){
  if(!s||!/[A-Za-z]/.test(s))return s;
  const tt=s.trim();if(AR_EXACT[tt])return s.replace(tt,AR_EXACT[tt]);
  let o=s;
  for(let i=0;i<AR_RULES.length;i++){const r=AR_RULES[i];if(r.re.test(o)){r.re.lastIndex=0;o=o.replace(r.re,r.ar)}r.re.lastIndex=0}
  return o;
}
const hasLatin=s=>/[A-Za-z]/.test(s);
function trHtml(h){return String(h).split(/(<[^>]+>)/).map(function(p){return p.charAt(0)==='<'?p:trs(p)}).join('')}
const EN_TXT=new WeakMap();
function trDom(){
  const ar=ui.lang==='ar';
  document.documentElement.lang=ar?'ar':'en';
  document.documentElement.dir=ar?'rtl':'ltr';
  const skip=/^(SCRIPT|STYLE|TEXTAREA|INPUT)$/;
  const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode:function(n){
    const p=n.parentNode;if(!p||skip.test(p.nodeName))return NodeFilter.FILTER_REJECT;
    if(p.closest&&p.closest('[data-notr]'))return NodeFilter.FILTER_REJECT;
    return NodeFilter.FILTER_ACCEPT}});
  const nodes=[];let n;while((n=w.nextNode()))nodes.push(n);
  nodes.forEach(function(t){
    let rec=EN_TXT.get(t);
    if(!rec){rec={en:t.nodeValue,last:t.nodeValue};EN_TXT.set(t,rec)}
    else if(t.nodeValue!==rec.last)rec.en=t.nodeValue;
    const v=ar?trs(rec.en):rec.en;
    if(v!==t.nodeValue)t.nodeValue=v;
    rec.last=t.nodeValue;
  });
  document.querySelectorAll('[aria-label],[title],[placeholder],[data-tip]').forEach(function(e){
    ['aria-label','title','placeholder'].forEach(function(a){
      const v=e.getAttribute(a);if(v==null)return;
      const k='data-en-'+a;
      if(!e.hasAttribute(k))e.setAttribute(k,v);
      const en=e.getAttribute(k);
      const nv=ar?trs(en):en;if(nv!==v)e.setAttribute(a,nv);
    });
    const d=e.getAttribute('data-tip');
    if(d!=null){
      if(!e.hasAttribute('data-en-tip'))e.setAttribute('data-en-tip',d);
      const en=e.getAttribute('data-en-tip');const nv=ar?trHtml(en):en;if(nv!==d)e.setAttribute('data-tip',nv);
    }
  });
}

/* ---------- personal coach: speaks to each person from their own numbers ---------- */
const GEN=pid=>{const p=person(pid);return (p&&p.g)||(pid==='p2'?'f':'m')};
const gx=(pid,m,f)=>GEN(pid)==='f'?f:m;
const T2=(en,ar)=>ui.lang==='ar'?ar:en;
const otherOf=pid=>pid==='p1'?'p2':'p1';
function dayNum(){const t=today();return Math.floor(Date.UTC(t.getFullYear(),t.getMonth(),t.getDate())/86400000)}
function coachWin(len){const t=today(),s=pd(S.start);let f=addDays(t,-(len-1));if(f<s)f=s;return [f,t]}
function tipFor(h){
  const T=CONTENT.tips||{};
  const arr=T[h.id]||T[h.kind]||T.general||[];
  if(!arr.length)return null;
  return arr[(Math.floor(dayNum()/7)+h.id.length)%arr.length];
}
function areaNameL(id){return areaName(id)}
const dayEn=g=>g===1?'1 day':g+' days',dayAr=g=>g===1?'يوم واحد':g===2?'يومين':g+' أيام';
function avgPerWeek(done,nd,h){return h.per==='month'?done/(nd/30.4):done/(nd/7)}
function coachFor(pid){
  const w=coachWin(28),wk=coachWin(7);
  const nd=daysIn(w[0],w[1]).length;
  const st=stats(pid,w[0],w[1]);
  const o=impact(pid,w[0],w[1]);
  const sk=streaks(pid);
  const nm=pname(pid),pn=pname(otherOf(pid)),cur=S.currency;
  const fy=gx(pid,'','ِ');           /* Arabic: past-tense feminine ending (kasra) */
  const imp=gx(pid,'','ي');           /* Arabic: imperative feminine ending */
  const ci=checkIns(pid,w[0],w[1]);
  const rows=habitsFor(pid).map(h=>{const x=st.byHabit[h.id]||{done:0,exp:0};return {h:h,done:x.done,exp:x.exp,r:x.exp>=0.9?Math.min(1,x.done/x.exp):null}});
  const rowOf=id=>rows.find(x=>x.h.id===id);
  const rKind=ks=>{const a=rows.filter(x=>ks.indexOf(x.h.kind)>=0&&x.r!=null);return a.length?a.reduce((s,x)=>s+x.r,0)/a.length:.5};
  const doneId=id=>{const x=rowOf(id);return x?x.done:0};
  const early=nd<4||ci===0;
  const ow=impact(pid,wk[0],wk[1]);
  /* ---- wins ---- */
  const wins=[];
  const W=(w,en,ar)=>wins.push({w:w,en:en,ar:ar});
  if(sk.cur>=2)W(.9,sk.cur+' days in a row above 60%. Your best run so far is '+sk.best+'.',sk.cur+' أيام متتالية فوق 60%. وأفضل سلسلة لك حتى الآن '+sk.best+'.');
  if(o.pages>0){const k=Math.round(o.pages/604*100);W(rKind(['quran']),nf(o.pages)+' pages of the Qur’an recited'+(k>0?', '+k+'% of a full khatma':'')+'.','قرأت'+fy+' '+nf(o.pages)+' صفحة من القرآن'+(k>0?'، أي '+k+'% من ختمة':'')+'.')}
  if(o.tafsirPages>0)W(rKind(['tafsir']),nf(o.tafsirPages)+' pages of tafsir, so the verses are becoming clearer.','قرأت'+fy+' '+nf(o.tafsirPages)+' صفحة تفسير، فتزداد الآيات وضوحًا.');
  if(o.practice>0)W(rKind(['practice']),o.practice+' worship check-ins: night prayer, Witr, azkar and fasting.',o.practice+' تسجيل عبادة: قيام وشفع ووتر وأذكار وصيام.');
  if(o.exMin>0)W(rKind(['exercise']),nf(o.exMin)+' minutes of exercise, about '+nf(o.exWeek)+' minutes a week.',nf(o.exMin)+' دقيقة تمرين، حوالي '+nf(o.exWeek)+' دقيقة في الأسبوع.');
  if(o.waterDays>0)W(rKind(['water']),o.waterDays+' days at your water goal.',o.waterDays+' أيام وصل'+(GEN(pid)==='f'?'تِ':'تَ')+' فيها إلى هدف الماء.');
  if(o.wN>=2){const d=Math.round((o.wLast-o.wFirst)*10)/10;W(.55,'Your weight moved '+(d>0?'+':'')+d+' kg over '+o.wN+' weigh-ins. Watching it is half the work.','وزنك تغيّر '+(d>0?'+':'')+d+' كجم عبر '+o.wN+' قياسات. المتابعة نصف الطريق.')}
  if(o.studyMin>0)W(rKind(['study']),nf1(o.studyMin/60)+' hours of learning.',nf1(o.studyMin/60)+' ساعة تعلّم.');
  if(o.connDays>0)W(rKind(['connection']),o.connDays+' days of real time with your partner and the children.',o.connDays+' يوم من الوقت الحقيقي مع شريكك والأولاد.');
  if(doneId('gratitude')>0)W(rowOf('gratitude').r||.6,doneId('gratitude')+' days of gratitude.',doneId('gratitude')+' يوم شكر.');
  if(doneId('give')>0)W(rowOf('give').r||.6,doneId('give')+' times you made someone’s day easier.',doneId('give')+' مرة من العطاء: مساعدة أحدهم أو إدخال السرور عليه.');
  if(doneId('appreciate')>0)W(.6,doneId('appreciate')+' days you said what you appreciate.',doneId('appreciate')+' يومًا من التعبير عن التقدير لشريكك.');
  if(o.spendDays>0&&o.spendUnder>0)W(.8*o.spendUnder/o.spendDays+.2,o.spendUnder+' of '+o.spendDays+' logged days within your '+nf(o.spendLimit)+' '+cur+' limit.',o.spendUnder+' من '+o.spendDays+' يوم مسجّل ضمن حدّك '+nf(o.spendLimit)+' جنيه.');
  if(ow.underDays>=5)W(.9,'Within the daily spending limit on '+ow.underDays+' of '+ow.nd+' days this week.','ضمن حد المصروف اليومي في '+ow.underDays+' من '+ow.nd+' أيام هذا الأسبوع.');
  if(ow.nd>=7&&ow.spendDays>=ow.nd)W(.85,'You logged your spending every day this week.','سجّلت'+fy+' مصروفك كل يوم هذا الأسبوع.');
  if(o.capGoal>0&&o.orders<=o.capGoal*(nd/7)+.5&&ci>0&&!early)W(.8,'Delivery orders stayed within the cap ('+o.orders+' in '+nd+' days).','بقيت طلبات التوصيل ضمن السقف ('+o.orders+' في '+nd+' يومًا).');
  if(o.jobDays>0)W(rKind(['jobhunt']),o.jobDays+' job and income blocks, '+nf1(o.jobMin/60)+' hours of real effort.',o.jobDays+' فترة بحث عن عمل ودخل، '+nf1(o.jobMin/60)+' ساعة جهد حقيقي.');
  if(o.bizDays>0)W(rKind(['bizfocus']),o.bizDays+' focus blocks on the business ('+nf1(o.bizMin/60)+' hours)'+(o.outputs>0?' and '+o.outputs+' weekly outputs':'')+'.',o.bizDays+' فترة تركيز على المشروع ('+nf1(o.bizMin/60)+' ساعة)'+(o.outputs>0?' و'+o.outputs+' إنجاز أسبوعي':'')+'.');
  wins.sort((a,b)=>b.w-a.w);
  const top=wins.slice(0,early?2:4);
  const overall=early?(ci>0?{en:'You have started: '+ci+(ci===1?' habit':' habits')+' ticked so far. Starting is the hardest part.',ar:'لقد بدأت: تم تسجيل '+ci+' عادة حتى الآن. البداية هي الأصعب.'}:null):ci>0?{en:'You checked off '+ci+' habits in '+nd+' days. That is '+pct(st.pct)+' of what you planned.',ar:'تم تسجيل '+ci+' عادة في '+nd+' يومًا، أي '+pct(st.pct)+' من خطتك.'}:null;
  /* ---- thanks ---- */
  const aRows=AREAS.map(a=>{const x=st.byArea[a.id];return x&&x.exp>=1?{id:a.id,r:x.eq,exp:x.exp}:null}).filter(Boolean);
  const bestA=aRows.slice().sort((a,b)=>b.r-a.r)[0],worstA=aRows.slice().sort((a,b)=>a.r-b.r)[0];
  const WHY={
    faith:['for keeping your heart anchored and your worship steady','على ثباتك في العبادة وتربيتك لقلبك كل يوم'],
    body:['for looking after your body, which carries everything else','على اهتمامك بصحتك، فالجسم هو ما يحمل كل شيء آخر'],
    mind:['for feeding your mind with learning, week after week','على تغذيتك لعقلك بالتعلّم أسبوعًا بعد أسبوع'],
    family:['for the time, attention and love you pour into your family','على وقتك واهتمامك وحبك لأسرتك'],
    money:['for facing money and income head-on, which is never easy','على مواجهتك لموضوع المال والدخل بشجاعة، وهذا ليس سهلًا'],
    heart:['for making room for gratitude and kindness','على إفساحك مكانًا للشكر والعطاء']
  };
  const why=bestA?WHY[bestA.id]:null;
  const both=S.people.length>1;
  const thanks=early?null:{
    en:'Thank you, '+nm+(why?', '+why[0]:', for showing up')+'. '+(both?pn+' and the family feel it, even when nobody says it.':'The people around you feel it, even when nobody says it.'),
    ar:'شكرًا يا '+nm+(why?' '+why[1]:' على حضورك')+'. '+(both?pn+' والأسرة يشعرون بذلك، حتى لو لم يقل أحد.':'من حولك يشعرون بذلك، حتى لو لم يقل أحد.')
  };
  /* ---- improve ---- */
  const weak=early?[]:rows.filter(x=>x.r!=null&&x.r<.7).sort((a,b)=>a.r-b.r).slice(0,2);
  const improve=weak.map(x=>{
    const h=x.h,hn=hname(h),avg=avgPerWeek(x.done,nd,h);
    const per=h.per==='month';
    const tip=tipFor(h);
    return {h:h,
      en:'“'+hn+'”: '+x.done+' times in '+nd+' days, about '+nf1(avg)+(per?' a month':' a week')+' against your goal of '+h.target+'.',
      ar:'«'+hn+'»: '+x.done+' مرة في '+nd+' يومًا، حوالي '+nf1(avg)+(per?' في الشهر':' في الأسبوع')+' والهدف '+h.target+'.',
      tip:tip};
  });
  const extra=[];
  const sh=S.habits.find(h=>h.kind==='spend'&&h.who.indexOf(pid)>=0);
  const hasBiz=S.habits.some(h=>h.type==='tag'&&h.who.indexOf(pid)>=0);
  if(!early){
  if(o.spendDays>0&&o.spendUnder<o.spendDays){const over=o.spendDays-o.spendUnder;extra.push({en:'Spending went above '+nf(o.spendLimit)+' '+cur+' on '+over+' of '+o.spendDays+' logged days.',ar:'تجاوز المصروف '+nf(o.spendLimit)+' جنيه في '+over+' من '+o.spendDays+' يوم مسجّل.'})}
  if(sh&&ow.nd>=5&&ow.spendDays>0&&ow.underDays<5)extra.push({en:'Within the daily limit on only '+ow.underDays+' of '+ow.nd+' days this week. Look at which category pushed the day over.',ar:'ضمن الحد اليومي في '+ow.underDays+' من '+ow.nd+' أيام فقط هذا الأسبوع. انظر أي فئة تجاوزت بها الحد.'});
  if(sh){const wl=Math.round(o.spendDays/Math.max(1,nd)*100);if(nd>=7&&wl<60)extra.push({en:'Spending was logged on only '+wl+'% of days. A number you can see changes behaviour, so log every day, even the bad ones.',ar:'تم تسجيل المصروف في '+wl+'% فقط من الأيام. الرقم الذي تراه يغيّر السلوك، لذلك سجّل'+imp+' كل يوم حتى في الأيام السيئة.'})}
  if(o.capGoal>0&&o.orders>o.capGoal*(nd/7)+.5)extra.push({en:'Delivery orders ('+o.orders+') went above the cap of '+o.capGoal+' a week.',ar:'طلبات التوصيل ('+o.orders+') تجاوزت السقف '+o.capGoal+' في الأسبوع.'});
  if(hasBiz&&nd>=14&&o.outputs===0)extra.push({en:'No weekly output yet. Research feels like progress, but only a finished thing and a real customer conversation prove it.',ar:'لم يُسجَّل أي إنجاز أسبوعي بعد. البحث يعطي شعورًا بالتقدّم، لكن ما يثبته هو شيء مكتمل وحديث حقيقي مع زبون.'});
  }
  /* ---- next week ---- */
  const nextWeek=[];
  if(early){
    nextWeek.push({en:'Start small: aim for just the 3 easiest habits every day this week. Ticking is the habit before the habit.',ar:'ابدأ'+imp+' بخطوة صغيرة: استهدف'+imp+' أسهل 3 عادات كل يوم هذا الأسبوع. الالتزام بالتسجيل هو العادة التي تسبق العادة.'});
  }else{
    if(weak.length){
      const x=weak[0],h=x.h,avg=avgPerWeek(x.done,nd,h);
      const g=h.per==='month'?Math.min(h.target,Math.ceil(avg)+1):Math.min(h.target,Math.max(1,Math.ceil(avg)+1));
      nextWeek.push({en:'Do “'+hname(h)+'” '+(h.per==='month'?'at least '+g+(g===1?' time':' times')+' by month end':dayEn(g)+' this week')+'. Last month you averaged '+nf1(avg)+'. One more is enough.',ar:'افعل'+imp+' «'+hname(h)+'» '+(h.per==='month'?'على الأقل '+(g===1?'مرة واحدة':g+' مرات')+' قبل نهاية الشهر':dayAr(g)+' هذا الأسبوع')+'. متوسطك في الشهر الماضي '+nf1(avg)+'. زيادة واحدة تكفي.'});
    }
    const strong=rows.filter(x=>x.r!=null&&x.r>=.8).sort((a,b)=>b.done-a.done)[0];
    if(strong&&weak.length)nextWeek.push({en:'Use “'+hname(strong.h)+'” as your anchor. Right after you finish it, do “'+hname(weak[0].h)+'”. Linking a new habit to one you already keep makes it automatic faster.',ar:'اجعل'+imp+' «'+hname(strong.h)+'» نقطة الارتكاز. بعد أن تنهيها مباشرة افعل'+imp+' «'+hname(weak[0].h)+'». ربط العادة الجديدة بعادة ثابتة يجعلها تلقائية أسرع.'});
    else if(strong)nextWeek.push({en:'“'+hname(strong.h)+'” is solid. Keep it as your anchor and add one small extra habit right after it.',ar:'«'+hname(strong.h)+'» ثابتة. اجعلها نقطة ارتكاز وأضف'+imp+' عادة صغيرة بعدها مباشرة.'});
    if(sh&&o.spendDays>0&&o.spendUnder<o.spendDays)nextWeek.push({en:'Money: write the daily limit of '+nf(o.spendLimit)+' '+cur+' where you will see it, and decide the delivery nights for the week on Sunday.',ar:'المال: اكتب'+imp+' الحد اليومي '+nf(o.spendLimit)+' جنيه في مكان تراه، وحدّد'+imp+' ليالي التوصيل للأسبوع يوم الأحد.'});
    else if(hasBiz)nextWeek.push({en:'Business: finish one small thing this week and show it to one real person, then log it as your weekly output.',ar:'المشروع: أنجز'+imp+' شيئًا صغيرًا هذا الأسبوع واعرض'+imp+'ه على شخص حقيقي، ثم سجّل'+imp+'ه كإنجاز الأسبوع.'});
    else nextWeek.push({en:'On a tired day, do the two-minute version of your weakest habit. Not zero is the rule.',ar:'في اليوم المرهق افعل'+imp+' نسخة الدقيقتين من أضعف عادة. القاعدة: ألّا يكون الإنجاز صفرًا.'});
  }
  /* ---- next month ---- */
  const nextMonth=[];
  if(worstA&&!early){
    const from=Math.round(worstA.r*100),to=Math.min(100,from+10);
    nextMonth.push({en:'Focus area: '+areaName(worstA.id)+'. Move it from '+from+'% to '+to+'% this month.',ar:'مجال التركيز: '+areaName(worstA.id)+'. ارفع'+imp+'ه من '+from+'% إلى '+to+'% هذا الشهر.'});
  }
  const proj=[];
  if(o.pages>0)proj.push({en:'At this pace you will recite about '+nf(o.pages/nd*30)+' pages of the Qur’an next month.',ar:'بهذا المعدل ستقرأ حوالي '+nf(o.pages/nd*30)+' صفحة من القرآن الشهر القادم.'});
  if(o.exMin>0)proj.push({en:'At this pace: about '+nf1(o.exMin/nd*30/60)+' hours of exercise next month.',ar:'بهذا المعدل: حوالي '+nf1(o.exMin/nd*30/60)+' ساعة تمرين الشهر القادم.'});
  if(o.jobMin>0)proj.push({en:'At this pace: about '+nf1(o.jobMin/nd*30/60)+' hours of job and income effort next month.',ar:'بهذا المعدل: حوالي '+nf1(o.jobMin/nd*30/60)+' ساعة جهد في البحث عن عمل ودخل الشهر القادم.'});
  if(o.bizMin>0)proj.push({en:'At this pace: about '+nf1(o.bizMin/nd*30/60)+' hours on the business next month.',ar:'بهذا المعدل: حوالي '+nf1(o.bizMin/nd*30/60)+' ساعة على المشروع الشهر القادم.'});
  if(o.studyMin>0)proj.push({en:'At this pace: about '+nf1(o.studyMin/nd*30/60)+' hours of learning next month.',ar:'بهذا المعدل: حوالي '+nf1(o.studyMin/nd*30/60)+' ساعة تعلّم الشهر القادم.'});
  proj.slice(0,2).forEach(x=>nextMonth.push(x));
  nextMonth.push({en:'Plan a small celebration together at the end of the month. Rewards that cost little make the next month easier to start.',ar:'خطّطا لاحتفال صغير معًا في نهاية الشهر. المكافآت البسيطة تسهّل بداية الشهر التالي.'});
  return {pid:pid,nm:nm,early:early,nd:nd,overall:overall,wins:top,thanks:thanks,improve:improve,extra:extra,nextWeek:nextWeek,nextMonth:nextMonth,pctV:st.pct};
}
function coachJoint(){
  if(S.people.length<2)return null;
  const w=coachWin(28),nd=daysIn(w[0],w[1]).length;
  if(nd<4)return null;
  const p1=S.people[0].id,p2=S.people[1].id;
  const n1=pname(p1),n2=pname(p2);
  const items=[];
  const jh=S.habits.filter(h=>h.joint);
  jh.forEach(h=>{
    const rp=h.who[0];
    if(h.type==='cap'){const n=capSum(rp,h,w[0],w[1]);if(n<=h.goal*(nd/7)+.5)items.push({en:'Delivery stayed within the cap together ('+n+' orders).',ar:'بقي التوصيل ضمن السقف معًا ('+n+' طلبات).'})}
    else if(h.type==='num'&&h.kind==='spend'){let u=0,d=0;daysIn(w[0],w[1]).forEach(x=>{const v=getVal(rp,ds(x),h.id);if(v!=null){d++;if(Number(v)<=spLim(ds(x)))u++}});if(u>0)items.push({en:u+' of '+d+' logged days within the shared spending limit.',ar:u+' من '+d+' يوم مسجّل ضمن حد المصروف المشترك.'})}
    else{const x=stats(rp,w[0],w[1]).byHabit[h.id];if(x&&x.done>0)items.push({en:'“'+hname(h)+'”: '+x.done+' times together.',ar:'«'+hname(h)+'»: '+x.done+' مرة معًا.'})}
  });
  if(!items.length)return null;
  return {items:items.slice(0,4),
    en:'Thank you both. What you build together is bigger than any one list: '+n1+' and '+n2+' keep showing up for the same home.',
    ar:'شكرًا لكما. ما تبنيانه معًا أكبر من أي قائمة: '+n1+' و'+n2+' يحضران كل يوم من أجل بيت واحد.'};
}
function coachCard(pid){
  const c=coachFor(pid);
  const ar=ui.lang==='ar';
  const li=a=>'<li lang="'+LG()+'" dir="'+DIR()+'">'+esc(ar?a.ar:a.en)+'</li>';
  const tipLine=t=>t?'<div class="ctip" lang="'+LG()+'" dir="'+DIR()+'">'+esc(ar?t.ar:t.en)+(t.book?' <span class="cbook">'+esc(byTxt(t.book))+'</span>':'')+'</div>':'';
  const hello=ar?('أهلاً يا '+c.nm):('Hello, '+c.nm);
  const sub=c.early?T2('You have just started. These pages will fill with your own words as you tick.','أنت في البداية. ستمتلئ هذه الصفحة بكلماتك أنت كلما سجّلت.'):T2('Based on your last '+c.nd+' days.','بناءً على آخر '+c.nd+' يومًا.');
  let h='<section class="card coach" data-notr-cls><div class="coach-h"><span class="dot" style="background:'+pcol(pid)+'"></span><div><h2>'+esc(hello)+'</h2><small>'+esc(sub)+'</small></div></div>';
  if(c.overall||c.wins.length){
    h+='<div class="cs"><h3>'+T2('What you achieved','ما أنجزته')+'</h3><ul>'+(c.overall?li(c.overall):'')+c.wins.map(li).join('')+'</ul></div>';
  }
  if(c.thanks)h+='<div class="cthanks" lang="'+LG()+'" dir="'+DIR()+'">'+esc(ar?c.thanks.ar:c.thanks.en)+'</div>';
  if(c.improve.length||c.extra.length){
    h+='<div class="cs"><h3>'+T2('Where to grow','أين تنمو')+'</h3><ul>'+c.improve.map(x=>li(x)+(x.tip?'<li class="tipli">'+tipLine(x.tip)+'</li>':'')).join('')+c.extra.map(li).join('')+'</ul></div>';
  }else if(!c.early){
    h+='<div class="cs"><h3>'+T2('Where to grow','أين تنمو')+'</h3><p lang="'+LG()+'" dir="'+DIR()+'">'+esc(T2('Nothing is slipping. To stretch: add one more day to your lightest habit.','لا شيء يتراجع. للتحدّي: أضف يومًا واحدًا إلى أخفّ عادة عندك.'))+'</p></div>';
  }
  h+='<div class="cs"><h3>'+T2('Next week','الأسبوع القادم')+'</h3><ul>'+c.nextWeek.map(li).join('')+'</ul></div>';
  if(!c.early)h+='<div class="cs"><h3>'+T2('Next month','الشهر القادم')+'</h3><ul>'+c.nextMonth.map(li).join('')+'</ul></div>';
  return h+'</section>';
}
function coachJointCard(){
  const j=coachJoint();if(!j)return '';
  const ar=ui.lang==='ar';
  return '<section class="card coach"><div class="coach-h"><span class="dot" style="background:var(--brand)"></span><div><h2>'+T2('Together','معًا')+'</h2><small>'+T2('What you built as a couple','ما بنيتماه كزوجين')+'</small></div></div><div class="cs"><ul>'
    +j.items.map(a=>'<li lang="'+LG()+'" dir="'+DIR()+'">'+esc(ar?a.ar:a.en)+'</li>').join('')+'</ul></div><div class="cthanks" lang="'+LG()+'" dir="'+DIR()+'">'+esc(ar?j.ar:j.en)+'</div></section>';
}
/* ---------- language helpers (labels follow the chosen language; interface text is translated in the design step) ---------- */
const LG=()=>ui.lang==='ar'?'ar':'en';
const DIR=()=>ui.lang==='ar'?'rtl':'ltr';
const hname=h=>(ui.lang==='ar'&&h.ar)?h.ar:h.name;
const tagName=k=>(TAGS[k]||{en:k,ar:k})[LG()];
const fillNames=s=>String(s||'').replace(/\{p1\}/g,pname('p1')).replace(/\{p2\}/g,pname('p2'));
const ALLH=pid=>S.habits.filter(h=>h.who.indexOf(pid)>=0);
const hTargets=(h,pid)=>h.joint?h.who.slice():[pid];
const repOf=(h,pid)=>h.joint?h.who[0]:pid;
const isDaily=h=>h.per!=='month'&&h.target>=5;
/* ---------- values (numbers and notes) and ticks ---------- */
let V={p1:{},p2:{}};
const getVal=(pid,d,hid)=>{const t=expSum(pid,d,hid);return t!=null?t:((V[pid]||{})[d]||{})[hid]};
function valSet(pids,dstr,hid,val){
  if(val!==undefined&&val!==null)ensureStart(dstr);
  pids.forEach(pid=>{
    const v=V[pid]||(V[pid]={});const day=Object.assign({},v[dstr]||{});
    if(val===undefined||val===null)delete day[hid];else day[hid]=val;
    if(Object.keys(day).length)v[dstr]=day;else delete v[dstr];
    if(mode!=='sample')saveVal(pid);
  });
}
function ensureStart(dstr){
  if(mode==='sample'||!S||!S.start)return;
  if(pd(dstr)<pd(S.start)){S.start=dstr;saveConfig()}
}
const BACK_DAYS=60;
const floorDay=()=>addDays(pd(S.start),-BACK_DAYS);
function tickSet(pids,dstr,hid,on){
  if(on)ensureStart(dstr);
  pids.forEach(pid=>{
    const log=L[pid]||(L[pid]={});const a=log[dstr]?log[dstr].slice():[];
    const i=a.indexOf(hid);
    if(on&&i<0)a.push(hid);if(!on&&i>=0)a.splice(i,1);
    if(a.length)log[dstr]=a;else delete log[dstr];
    if(mode!=='sample')saveLog(pid);
  });
}
/* ---------- money: expenses, refunds, income, budgets, fixed payments ---------- */
let E={p1:{},p2:{}};                 /* entries: one document per person, E[pid][date][id]={a,n,c,t,ty?,sc?,ac?,cur?,oa?,lk?,ld?} (a = EGP) */
let PR={p1:{},p2:{}};                /* deep profile answers: one document per person, PR[pid][questionId]=text | 1-5 | choice | [choices] */
let F={p1:{},p2:{}};                 /* fixed payments paid: one document per person, F[pid]['YYYY-MM'][key]={d,a,ts} */
let B=null;                          /* shared budgets document (null until Muhammed changes something; defaults below) */
const r2=n=>Math.round(n*100)/100;
const BUD_DEF=(function(){
  const C=(k,en,ar,bl,sub,o)=>Object.assign({k:k,en:en,ar:ar,bl:bl,on:true,sub:(sub||[]).map(x=>({k:x[0],en:x[1],ar:x[2]||''}))},o||{});
  return {v:1,
    lines:[
      {k:'rent',en:'Rent',ar:'الإيجار',x:'My Rent',amt:45600,kd:'f'},
      {k:'living',en:'Living expenses',ar:'مصاريف المعيشة',x:'Living Expenses',amt:50920,kd:'d',dl:1},
      {k:'ph1',en:"{p1}'s phone bill",ar:'فاتورة موبايل {p1}',x:'My Phone Bill',amt:1340,kd:'f'},
      {k:'ph2',en:"{p2}'s phone bill",ar:'فاتورة موبايل {p2}',x:'Tota Phone Bill',amt:1340,kd:'f'},
      {k:'net',en:'Home internet',ar:'إنترنت البيت',x:'Home Internet',amt:3350,kd:'f'},
      {k:'util',en:'Electricity and water',ar:'كهرباء ومياه',x:'Home Utilities',amt:4020,kd:'f'},
      {k:'school',en:'Kenz school',ar:'مدرسة كنز',x:'Kenz School',amt:20100,kd:'f',from:'2027-08'},
      {k:'tfam',en:"{p2}'s family",ar:'أهل {p2}',x:'Tota Family',amt:10720,kd:'f'},
      {k:'maid',en:'Maid',ar:'عاملة المنزل',x:'Maid',amt:15000,kd:'f'}
    ],
    cats:[
      C('groc','Groceries','البقالة','living'),
      C('food','Food Delivery / Dining','طلبات ومطاعم','living',[['online','Online delivery','طلب أونلاين'],['rest','Restaurant','مطعم'],['sweet','Sweets & cake','حلويات وتورتة']]),
      C('trans','Transportation','المواصلات','living'),
      C('house','Household','البيت والتجهيز','living',[['furn','Furniture & setup','أثاث وتجهيز'],['gas','Gas cylinder','أنبوبة غاز'],['misc','Miscellaneous home items','أغراض بيت متنوعة'],['repair','Repairs & maintenance','صيانة وإصلاح']]),
      C('subs','Subscriptions','الاشتراكات','living',[['prime','Amazon Prime'],['apple','Apple'],['chatgpt','ChatGPT'],['claude','Claude'],['spotify','Spotify'],['talabat','Talabat']]),
      C('med','Medical','الطبي','living'),
      C('gift','Gifts / Family','هدايا وعائلة','living'),
      C('cloth','Clothing','الملابس','living',[['adult','Adult clothing','ملابس الكبار'],['kids','Kids & school uniform','ملابس الأطفال والزي المدرسي']]),
      C('care','Personal Care','العناية الشخصية','living',[['barber','Barber','حلاق'],['salon','Salon','صالون']]),
      C('fit','Personal / Fitness','رياضة','living'),
      C('fun','Entertainment','الترفيه','living'),
      C('gov','Government paperwork','أوراق حكومية','living'),
      C('legal','Legal','قانوني','living'),
      C('fees','Bank Fees','رسوم البنك','living'),
      C('kenz','Kenz','كنز','living',[],{x:'Kenz items'}),
      C('tall','{p2}','{p2}','living',[],{x:'Tota Allowance'}),
      C('c_rent','Rent','الإيجار','rent',[],{on:false}),
      C('c_ph1',"{p1}'s phone bill",'فاتورة موبايل {p1}','ph1',[],{on:false,x:'Phone bills (mine)'}),
      C('c_ph2',"{p2}'s phone bill",'فاتورة موبايل {p2}','ph2',[],{on:false,x:'Tota phone bill'}),
      C('c_net','Home internet','إنترنت البيت','net',[],{on:false,x:'Home Internet'})
    ],
    accts:[
      {k:'cash',n:'Cash',ar:'نقدًا'},{k:'insta',n:'Instapay',ar:'إنستاباي'},{k:'c3619',n:'3619 Card',ar:'بطاقة 3619'},
      {k:'hilal',n:'Hilal Bank',ar:'بنك هلال'},{k:'dib',n:'DIB',ar:'دبي الإسلامي'},{k:'adib',n:'ADIB Egypt',ar:'أبوظبي الإسلامي مصر'},
      {k:'rajhi',n:'Al Rajhi account',ar:'حساب الراجحي'},{k:'rak',n:'RAK',ar:'رأس الخيمة'}
    ],
    rates:{AED:13.4,SAR:13.4,USD:50},
    fixed:[
      {k:'f_rent',g:'eg',bl:'rent',day:28},{k:'f_maid',g:'eg',bl:'maid',day:0},{k:'f_school',g:'eg',bl:'school',day:0},
      {k:'f_ph1',g:'eg',bl:'ph1',day:0},{k:'f_ph2',g:'eg',bl:'ph2',day:0},{k:'f_net',g:'eg',bl:'net',day:0},
      {k:'f_util',g:'eg',bl:'util',day:0},{k:'f_tfam',g:'eg',bl:'tfam',day:0},
      {k:'u_rent',g:'uae',en:'UAE rent',ar:'إيجار الإمارات',cur:'AED',amt:4585,day:0},
      {k:'u_dad',g:'uae',en:'Dad money',ar:'مصروف الوالد',cur:'AED',amt:1500,day:0},
      {k:'u_mom',g:'uae',en:'Mom money',ar:'مصروف الوالدة',cur:'AED',amt:1000,day:0},
      {k:'u_tel',g:'uae',en:'UAE phone and internet bill',ar:'فاتورة هاتف وإنترنت الإمارات',cur:'AED',amt:450,day:0},
      {k:'u_dbill',g:'uae',en:'Dad bill',ar:'فاتورة الوالد',cur:'AED',amt:315,day:0},
      {k:'u_mbill',g:'uae',en:'Mom bill',ar:'فاتورة الوالدة',cur:'AED',amt:315,day:0},
      {k:'u_sewa',g:'uae',en:'Electricity bill (SEWA)',ar:'فاتورة الكهرباء (SEWA)',cur:'AED',amt:1000,day:0,note:'Estimate until the real figure is confirmed',noteAr:'تقدير إلى حين تأكيد الرقم الفعلي'},
      {k:'u_groc',g:'uae',en:'UAE groceries',ar:'بقالة الإمارات',cur:'AED',amt:2000,day:0},
      {k:'u_maid',g:'uae',en:'UAE maid',ar:'عاملة الإمارات',cur:'AED',amt:1500,day:0},
      {k:'l_rak',g:'loan',en:'RAK loan',ar:'قسط قرض RAK',cur:'AED',amt:2200,day:0,note:'Under review',noteAr:'قيد المراجعة'},
      {k:'l_sel',g:'loan',en:'Seltos loan (Al Rajhi)',ar:'قسط سلتوس (الراجحي)',cur:'SAR',amt:1532.8,day:0,note:'Car plan under review',noteAr:'خطة السيارة قيد المراجعة'}
    ],
    uae:{fund:12500},
    dlim:1500,
    ooin:0
  };
})();
const bud=()=>B||BUD_DEF;
function budEnsure(){if(!B)B=JSON.parse(JSON.stringify(BUD_DEF))}
function budNorm(b){
  if(!b||typeof b!=='object')return null;
  const arr=x=>Array.isArray(x)?x:(x&&typeof x==='object'?Object.keys(x).map(k=>x[k]):null);
  ['lines','cats','accts','fixed'].forEach(k=>{const a=arr(b[k]);b[k]=a&&a.length?a.filter(Boolean):JSON.parse(JSON.stringify(BUD_DEF[k]))});
  b.cats.forEach(c=>{c.sub=arr(c.sub)||[]});
  b.rates=Object.assign({},BUD_DEF.rates,b.rates||{});
  b.ratesM=(b.ratesM&&typeof b.ratesM==='object')?b.ratesM:{};
  b.uae=Object.assign({},BUD_DEF.uae,b.uae||{});
  b.ooin=b.ooin?1:0;b.v=b.v||1;
  b.dlim=(b.dlim==null||isNaN(Number(b.dlim)))?BUD_DEF.dlim:Math.max(0,Number(b.dlim));
  return b;
}
function budSave(){mirror();if(mode!=='sample')queue('budgets',{b:B,ts:Date.now()});resyncUnder()}
function saveProfile(pid){mirror();queue('profile-'+pid,{a:PR[pid]||{},ts:Date.now()})}
function saveFix(pid){mirror();queue('fixed-'+pid,{items:F[pid]||{}})}
function me(){let m=null;try{m=localStorage.getItem('istiqama.me')}catch(e){}return (m==='p1'||m==='p2')?m:(ui.who==='p2'?'p2':'p1')}
function meSet(p){try{localStorage.setItem('istiqama.me',p)}catch(e){}}
function meKnown(){try{const m=localStorage.getItem('istiqama.me');return m==='p1'||m==='p2'}catch(e){return true}}
const canEditBud=()=>me()!=='p2';
const ymOf=d=>String(d).slice(0,7);
const dimOf=ym=>{const a=ym.split('-');return new Date(+a[0],+a[1],0).getDate()};
const lineOf=k=>bud().lines.find(l=>l.k===k);
const catOf=k=>bud().cats.find(c=>c.k===k);
const blOf=ck=>{const c=catOf(ck);return c?c.bl:'living'};
const lname=l=>l?fillNames((ui.lang==='ar'&&l.ar)?l.ar:l.en):'';
const expCats=all=>{const l=bud().cats;return all?l:l.filter(c=>c.on!==false)};
const catName=k=>{const c=catOf(k);if(!c)return '';return fillNames((ui.lang==='ar'&&c.ar)?c.ar:(c.en||c.ar||''))};
const subName=(ck,sk)=>{const c=catOf(ck);const s=c&&(c.sub||[]).find(x=>x.k===sk);return s?((ui.lang==='ar'&&s.ar)?s.ar:s.en):''};
const acctName=k=>{const a=bud().accts.find(x=>x.k===k);return a?((ui.lang==='ar'&&a.ar)?a.ar:a.n):''};
/* exchange rates are set once a month and apply to that month only (B.ratesM['YYYY-MM']). A month with none uses the nearest earlier month, else the nearest later one, else the starting rates. */
const curYm=()=>ymOf(ds(today()));
function ratesFor(ym){
  const m=bud().ratesM||{},ks=Object.keys(m).sort();
  if(m[ym])return m[ym];
  let pick=null;ks.forEach(k=>{if(k<ym)pick=k});
  if(!pick)pick=ks.find(k=>k>ym)||null;
  return pick?m[pick]:(bud().rates||{});
}
const ratesSet=ym=>!!((bud().ratesM||{})[ym]);
const rateOf=(cur,ym)=>{if(cur==='EGP')return 1;const r=ratesFor(ym||curYm())||{};return Number(r[cur])||Number((bud().rates||{})[cur])||0};
const toEgp=(amt,cur,ym)=>r2(amt*rateOf(cur,ym));
/* a budget line is kept in SAR once it has been saved in SAR; its EGP value then follows that month's SAR rate */
const lineAmt=(l,ym)=>{if(!l)return 0;const sr=Number(l.sar);return (l.sar!=null&&l.sar!==''&&!isNaN(sr))?r2(sr*rateOf('SAR',ym)):(Number(l.amt)||0)};
const secTxt=egp=>{const a=rateOf('AED'),s=rateOf('SAR');return '≈ '+(a?nf(egp/a)+' AED':'')+(a&&s?' · ':'')+(s?nf(egp/s)+' SAR':'')};
const fxName=f=>f.bl?lname(lineOf(f.bl)):fillNames((ui.lang==='ar'&&f.ar)?f.ar:f.en);
const fxAmt=(f,ym)=>f.bl?lineAmt(lineOf(f.bl),ym):Number(f.amt)||0;
const fxCur=f=>f.bl?'EGP':(f.cur||'AED');
const shYm=sh=>{const d=String((sh&&sfv(sh,'ed',sh.d))||(sh&&sh.d)||'');return /^\d{4}-\d{2}/.test(d)?d.slice(0,7):curYm()};
const fxActive=(f,ym)=>{const l=f.bl?lineOf(f.bl):null;return !(l&&l.from&&ym<l.from)};
const fxNote=f=>ui.lang==='ar'?(f.noteAr||f.note||''):(f.note||'');
const GRP={eg:['Egypt','مصر','EGP'],uae:['UAE family house','بيت العائلة في الإمارات','AED'],loan:['Loans','القروض','']};
const nf2=n=>Number(n).toLocaleString('en-US',{maximumFractionDigits:2});
const nfc=(n,c)=>nf2(n)+' '+c;
const noCard=s=>/\d[\d \-]{10,}\d/.test(String(s||''));
const expNote=n=>n==='Earlier total'?T2('Earlier total','إجمالي سابق'):n;
const timeFmt=new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit'});
function saveExp(pid){mirror();queue('exp-'+pid,{items:E[pid]||{}})}
/* entry maths: a refund takes away from its category, income never counts as spending */
/* ty: x expense, r refund, i income, w cash withdrawal or transfer (money moved between accounts, never spending), l loan given, p loan paid back to me (both are money moving, never spending or income; ln = whose loan) */
const eMove=x=>x.ty==='w'||x.ty==='l'||x.ty==='p';
const eSkip=x=>x.ty==='i'||eMove(x);
const eNet=x=>eSkip(x)?0:(x.ty==='r'?-1:1)*(Number(x.a)||0);
function eDaily(x){
  if(eSkip(x))return false;
  const l=lineOf(blOf(x.c));if(!l||!l.dl)return false;
  const c=catOf(x.c);if(c&&c.oo&&!bud().ooin)return false;
  return true;
}
/* the daily limit is the living budget divided by the days of that month */
function spLim(dstr){
  const man=Number(bud().dlim);if(man>0)return Math.round(man);
  let sum=0,any=false;
  bud().lines.forEach(l=>{const la=lineAmt(l,ymOf(dstr));if(l.dl&&la>0){sum+=la;any=true}});
  if(any)return Math.round(sum/dimOf(ymOf(dstr)));
  const h=S.habits.find(x=>x.kind==='spend'&&x.type==='num');return (h&&Number(h.goal))||1500;
}
/* all entries for a day, for the people who share this spending habit */
function expList(dstr,h,only){
  const out=[];
  (only?[only]:(h.who||[])).forEach(pid=>{
    const day=((E[pid]||{})[dstr])||{};
    Object.keys(day).forEach(id=>{const x=day[id]||{};out.push({id:id,pid:pid,a:Number(x.a)||0,n:x.n||'',c:x.c||'',t:Number(x.t)||0,ty:x.ty||'x',sc:x.sc||'',ac:x.ac||'',cur:x.cur||'',oa:Number(x.oa)||0,lk:x.lk||'',ld:x.ld||'',ln:x.ln||''})});
  });
  out.sort((a,b)=>a.t-b.t||(a.id<b.id?-1:1));
  return out;
}
/* null when the day has no expense entries (then the old single number, if any, is used) */
function expSum(pid,dstr,hid){
  const a=E.p1&&E.p1[dstr],b=E.p2&&E.p2[dstr];
  if(!a&&!b)return null;
  const h=S.habits.find(x=>x.id===hid&&x.kind==='spend'&&x.type==='num');if(!h)return null;
  const l=expList(dstr,h,h.joint?null:pid);
  if(!l.some(x=>!eSkip(x)))return null;
  return r2(l.filter(eDaily).reduce((t,x)=>t+eNet(x),0));
}
function dayParts(list){
  let day=0,other=0,inc=0;
  list.forEach(x=>{if(eMove(x))return;if(x.ty==='i'){inc+=x.a;return}const v=eNet(x);if(eDaily(x))day+=v;else other+=v});
  return {day:r2(day),other:r2(other),inc:r2(inc)};
}
const spendHabit=()=>S.habits.find(x=>x.kind==='spend'&&x.type==='num');
const wPid=(h,pid)=>h.joint?me():pid;
function expAdd(pid,h,dstr,o){
  const wp=wPid(h,pid),tg=hTargets(h,wp);
  const m=E[wp]||(E[wp]={});const day=Object.assign({},m[dstr]||{});
  const had=expSum(wp,dstr,h.id);
  if(had==null){
    const raw=((V[repOf(h,wp)]||{})[dstr]||{})[h.id];
    if(raw!=null&&typeof raw!=='object'&&Number(raw)>0){
      day['e0'+Math.random().toString(36).slice(2,6)]={a:Number(raw),n:'Earlier total',c:'other',t:1};
      valSet(tg,dstr,h.id);
    }
  }
  const id=Date.now().toString(36)+Math.random().toString(36).slice(2,5);
  const e={a:r2(o.a),n:o.n||'',c:o.c||'',t:Date.now()};
  if(o.ty&&o.ty!=='x')e.ty=o.ty;
  if(o.sc)e.sc=o.sc;if(o.ac)e.ac=o.ac;
  if(o.cur&&o.cur!=='EGP'){e.cur=o.cur;e.oa=r2(o.oa)}
  if(o.lk){e.lk=o.lk;e.ld=o.ld||''}
  if(o.ln)e.ln=o.ln;
  day[id]=e;m[dstr]=day;
  if(mode!=='sample')saveExp(wp);
  if(!eSkip(e))tickSet(tg,dstr,h.id,true);
  syncUnder(dstr);
}
function hasLog(h,dstr){return expList(dstr,h,null).some(x=>!eSkip(x))}
function expDel(pid,h,dstr,id){
  const m=E[pid]||{};const day=Object.assign({},m[dstr]||{});
  delete day[id];
  if(Object.keys(day).length)m[dstr]=day;else delete m[dstr];
  if(mode!=='sample')saveExp(pid);
  if(!hasLog(h,dstr)){const tg=hTargets(h,pid);valSet(tg,dstr,h.id);tickSet(tg,dstr,h.id,false)}
  syncUnder(dstr);
}
/* change an existing entry: amount, category, sub-category, account, note, date */
function expUpdate(opid,h,oldD,id,o,newD){
  const m=E[opid]||(E[opid]={});const od=m[oldD]||{};const old=od[id];if(!old)return;
  const e={a:r2(o.a),n:o.n||'',c:o.c||'',t:old.t||Date.now()};
  if(o.ty&&o.ty!=='x')e.ty=o.ty;
  if(o.sc)e.sc=o.sc;if(o.ac)e.ac=o.ac;
  if(o.cur&&o.cur!=='EGP'){e.cur=o.cur;e.oa=r2(o.oa)}
  if(o.lk){e.lk=o.lk;e.ld=o.ld||''}
  if(o.ln)e.ln=o.ln;
  const nd=newD||oldD;
  const rest=Object.assign({},od);delete rest[id];
  if(Object.keys(rest).length)m[oldD]=rest;else delete m[oldD];
  const tgt=Object.assign({},m[nd]||{});tgt[id]=e;m[nd]=tgt;
  if(mode!=='sample')saveExp(opid);
  const tg=hTargets(h,opid);
  if(!eSkip(e))tickSet(tg,nd,h.id,true);
  if(nd!==oldD&&!hasLog(h,oldD)){valSet(tg,oldD,h.id);tickSet(tg,oldD,h.id,false)}
  syncUnder(oldD);if(nd!==oldD)syncUnder(nd);
}
function findEntry(dstr,h,id){return expList(dstr,h,null).find(x=>x.id===id)||null}
/* "Stay within the daily limit" is ticked by itself from the expenses */
function syncUnder(dstr){
  const u=S.habits.find(x=>x.kind==='underlimit');if(!u)return;
  const sp=spendHabit();if(!sp)return;
  const rp=repOf(sp,sp.who[0]);
  const v=getVal(rp,dstr,sp.id);
  const logged=isTicked(sp,sp.who[0],dstr)&&v!=null&&typeof v!=='object';
  const ok=!!(logged&&Number(v)<=spLim(dstr));
  const ur=repOf(u,u.who[0]);
  if(isTicked(u,u.who[0],dstr)!==ok)tickSet(hTargets(u,ur),dstr,u.id,ok);
}
function resyncUnder(n){
  const u=S.habits.find(x=>x.kind==='underlimit');if(!u)return;
  const t=today(),s=pd(S.start);
  for(let i=0;i<(n||45);i++){const d=addDays(t,-i);if(d<s)break;syncUnder(ds(d))}
}
/* ---------- bills: a bill can be paid in one go, in several top-ups, or closed with less or more than planned ---------- */
/* F[pid]['YYYY-MM'][key] = {p:[{i,d,a,n}], x:1}  (older data: {d,a,ts} = one payment) */
function fxPays(ym,k){
  const out=[];let leg=null;
  ['p1','p2'].forEach(pid=>{const e=((F[pid]||{})[ym]||{})[k];if(!e)return;
    if(Array.isArray(e.p))e.p.forEach(q=>out.push({pid:pid,i:q.i,d:q.d,a:Number(q.a)||0,n:q.n||''}));
    else if(e.a!=null&&(!leg||(e.ts||0)>(leg.ts||0)))leg={pid:pid,i:'L',d:e.d,a:Number(e.a)||0,n:'',ts:e.ts||0,legacy:1}});
  if(leg)out.push(leg);
  out.sort((x,y)=>x.d<y.d?-1:x.d>y.d?1:0);
  return out;
}
const fxClosed=(ym,k)=>['p1','p2'].some(pid=>{const e=((F[pid]||{})[ym]||{})[k];return !!(e&&e.x)});
const fxSum=(ym,k)=>r2(fxPays(ym,k).reduce((t,q)=>t+q.a,0));
/* compatibility: one summed record, or null when nothing was paid */
function fxPaid(ym,k){const l=fxPays(ym,k);if(!l.length)return null;return {d:l[l.length-1].d,a:fxSum(ym,k),ts:0}}
function fxEntry(wp,ym,k){
  F[wp]=F[wp]||{};F[wp][ym]=Object.assign({},F[wp][ym]||{});
  let e=F[wp][ym][k];
  if(!e)e={p:[]};
  else if(!Array.isArray(e.p))e={p:(e.a!=null?[{i:'L',d:e.d,a:e.a,n:''}]:[]),x:e.x};
  else e={p:e.p.slice(),x:e.x};
  F[wp][ym][k]=e;return e;
}
function fxSave(wp){if(mode!=='sample')saveFix(wp);else mirror()}
function fxAdd(k,ym,d,amt,note){
  const wp=me(),e=fxEntry(wp,ym,k);
  const q={i:Date.now().toString(36)+Math.random().toString(36).slice(2,4),d:d,a:r2(amt)};if(note)q.n=String(note).slice(0,200);
  e.p.push(q);e.ts=Date.now();fxSave(wp);
}
function fxDelPay(k,ym,i){
  const gone=[];
  ['p1','p2'].forEach(pid=>{const e0=((F[pid]||{})[ym]||{})[k];if(!e0)return;
    const e=fxEntry(pid,ym,k);const n=e.p.length;e.p.filter(q=>q.i===i).forEach(q=>gone.push({pid:pid,q:q}));e.p=e.p.filter(q=>q.i!==i);
    if(e.p.length!==n){if(!e.p.length&&!e.x)delete F[pid][ym][k];fxSave(pid)}else if(!e.p.length&&!e.x){delete F[pid][ym][k]}});
  mirror();return gone;
}
/* change one payment in place (amount, date, note); moves it to another month if the date says so */
function fxUpdatePay(k,ym,i,d,amt,note){
  let done=false;
  ['p1','p2'].forEach(pid=>{
    const e0=((F[pid]||{})[ym]||{})[k];if(!e0)return;
    const e=fxEntry(pid,ym,k),q=e.p.find(x=>x.i===i);if(!q)return;
    q.d=d;q.a=r2(amt);if(note)q.n=String(note).slice(0,200);else delete q.n;
    const nym=ymOf(d);
    if(nym!==ym){e.p=e.p.filter(x=>x.i!==i);if(!e.p.length&&!e.x)delete F[pid][ym][k];const n=fxEntry(pid,nym,k);n.p.push(q);n.ts=Date.now()}
    else e.ts=Date.now();
    fxSave(pid);done=true;
  });
  mirror();return done;
}
/* put back payments that were just removed */
function fxRestore(k,ym,gone){
  (gone||[]).forEach(g=>{const e=fxEntry(g.pid,ym,k);if(!e.p.some(q=>q.i===g.q.i))e.p.push(g.q);e.ts=Date.now();fxSave(g.pid)});
  mirror();
}
function fxQuick(k,ym){
  const f=bud().fixed.find(x=>x.k===k);if(!f)return;
  const s=fxState(f,ym),amt=s.left>0?s.left:(s.exp-s.paid>0?s.exp-s.paid:s.exp);if(!(amt>0))return;
  const t=today(),end=dimOf(ym),d=ymOf(ds(t))===ym?ds(t):ym+'-'+String(end).padStart(2,'0');
  fxAdd(k,ym,d,amt,'');
  toast(T2('Paid ','تم دفع ')+nf(amt)+' '+fxCur(f)+' · '+fxName(f));
}
function fxSetClosed(k,ym,on){
  const wp=me();
  ['p1','p2'].forEach(pid=>{const e0=((F[pid]||{})[ym]||{})[k];if(pid!==wp&&e0&&e0.x){const e=fxEntry(pid,ym,k);delete e.x;if(!e.p.length)delete F[pid][ym][k];fxSave(pid)}});
  const e=fxEntry(wp,ym,k);if(on)e.x=1;else delete e.x;
  if(!e.p.length&&!e.x)delete F[wp][ym][k];
  e.ts=Date.now();fxSave(wp);
}
function fxUnmark(k,ym){
  ['p1','p2'].forEach(p=>{if(F[p]&&F[p][ym]&&F[p][ym][k]){F[p][ym]=Object.assign({},F[p][ym]);delete F[p][ym][k];if(mode!=='sample')saveFix(p)}});
  mirror();
}
/* state of one bill in a month: paid | closed | partial | overdue | soon | later | noday */
function fxState(f,ym){
  const exp=Number(fxAmt(f,ym))||0,pays=fxPays(ym,f.k),paid=fxSum(ym,f.k),closed=fxClosed(ym,f.k);
  const base={exp:exp,paid:paid,pays:pays,diff:r2(exp-paid)};
  if(closed)return Object.assign(base,{st:'closed'});
  if(paid>0&&exp>0&&paid>=exp*0.995)return Object.assign(base,{st:'paid'});
  if(paid>0&&exp<=0)return Object.assign(base,{st:'paid'});
  if(paid>0)return Object.assign(base,{st:'partial',left:r2(exp-paid)});
  const day=Number(f.day)||0;if(!day)return Object.assign(base,{st:'noday'});
  const t=today(),nowYm=ymOf(ds(t));
  const dd=Math.min(day,dimOf(ym));
  if(ym<nowYm)return Object.assign(base,{st:'overdue',n:0,day:dd});
  if(ym>nowYm)return Object.assign(base,{st:'later',day:dd});
  const diff=dd-t.getDate();
  if(diff<0)return Object.assign(base,{st:'overdue',n:-diff,day:dd});
  if(diff<=7)return Object.assign(base,{st:'soon',n:diff,day:dd});
  return Object.assign(base,{st:'later',n:diff,day:dd});
}
function fxSummary(ym){
  const items=bud().fixed.filter(f=>fxActive(f,ym));
  let paid=0,part=0,soon=0,over=0;
  items.forEach(f=>{const s=fxState(f,ym).st;if(s==='paid'||s==='closed')paid++;else if(s==='partial')part++;else if(s==='soon')soon++;else if(s==='overdue')over++});
  return {n:items.length,paid:paid,part:part,soon:soon,over:over};
}
/* saved / over: counted only for bills that are settled (paid in full, or closed). A bill still open is not "saved". */
function fxBalance(ym){
  const out={saved:0,over:0,g:{eg:{s:0,o:0,se:0,oe:0},uae:{s:0,o:0,se:0,oe:0},loan:{s:0,o:0,se:0,oe:0}}};
  bud().fixed.filter(f=>fxActive(f,ym)).forEach(f=>{
    const s=fxState(f,ym);if(s.st!=='paid'&&s.st!=='closed')return;
    const d=s.diff;if(Math.abs(d)<0.5)return;
    const c=fxCur(f),e=toEgp(Math.abs(d),c,ym),g=out.g[f.g]||(out.g[f.g]={s:0,o:0,se:0,oe:0});
    if(d>0){out.saved+=e;g.s+=Math.abs(d);g.se+=e}else{out.over+=e;g.o+=Math.abs(d);g.oe+=e}
  });
  out.saved=r2(out.saved);out.over=r2(out.over);return out;
}
function fxBalTxt(b,cur){
  const parts=[];
  if(b.s>0.5)parts.push('<b class="fx-good">'+T2('saved ','وفّرتم ')+nf(b.s)+' '+cur+'</b>');
  if(b.o>0.5)parts.push('<b class="fx-bad">'+T2('over ','زادت ')+nf(b.o)+' '+cur+'</b>');
  return parts.join(' · ');
}
function fxRes(v,cur){
  if(v>0.5)return '<b class="num fx-good">'+T2('Saved ','وفّرتم ')+nf(v)+' <small>'+cur+'</small></b>';
  if(v<-0.5)return '<b class="num fx-bad">'+T2('Over ','زادت ')+nf(-v)+' <small>'+cur+'</small></b>';
  return '<span class="num fx-zero">'+T2('On plan','حسب الخطة')+'</span>';
}
function fxBalBox(ym){
  const b=fxBalance(ym),G=b.g,net=r2(b.saved-b.over);
  const nowYm=ymOf(ds(today()));let ts=0,to=0;
  for(let i=0;i<6;i++){const m=prevYm(nowYm,i),x=fxBalance(m);ts+=x.saved;to+=x.over}
  const row=(g,name,v,cur)=>'<div class="fx-trow fx-g-'+g+'"><span class="fx-tn"><i class="fx-gdot"></i>'+name+'</span>'+fxRes(v,cur)+'</div>';
  return '<div class="fx-bal"><div class="fx-bh">'+T2('Result this month','النتيجة هذا الشهر')+'</div>'
    +row('eg',T2('Egypt','مصر'),G.eg.s-G.eg.o,'EGP')
    +row('uae',T2('UAE house','بيت الإمارات'),G.uae.s-G.uae.o,'AED')
    +row('loan',T2('Loans','القروض'),G.loan.se-G.loan.oe,'EGP')
    +'<div class="fx-trow fx-tt"><span class="fx-tn">'+T2('All together','المجموع')+'</span>'+fxRes(net,'EGP')+'</div>'
    +'<div class="fx-net">'+T2('Last 6 months: ','آخر 6 شهور: ')+fxRes(r2(ts-to),'EGP')+'</div>'
    +'<div class="note">'+T2('Each section shows saved or over, not both. Counted only when a bill is paid in full or marked "No more to pay". Other currencies are converted to EGP at your rates.','كل قسم يُظهر توفيرًا أو زيادة وليس الاثنين. يُحسب فقط عند سداد الفاتورة كاملة أو الضغط على "لا دفع آخر". العملات الأخرى تُحوَّل إلى الجنيه حسب أسعارك.')+'</div></div>';
}
/* ---------- budgets: what was spent against each budget line in a month ---------- */
function monthAct(ym){
  const out={};const get=k=>out[k]||(out[k]={net:0,oo:0,fp:0});
  ['p1','p2'].forEach(pid=>{
    const m=E[pid]||{};
    Object.keys(m).forEach(d=>{
      if(d.slice(0,7)!==ym)return;
      const day=m[d];
      Object.keys(day).forEach(id=>{
        const x=day[id]||{};if(eSkip(x))return;
        const o=get(blOf(x.c)),v=eNet(x);o.net+=v;
        const c=catOf(x.c);if(c&&c.oo)o.oo+=v;
      });
    });
  });
  bud().fixed.forEach(f=>{if(!f.bl)return;const p=fxPaid(ym,f.k);if(p)get(f.bl).fp+=Number(p.a)||0});
  return out;
}
/* >5% over = warn, >20% over = high, >5% under = good. A line that is logged day by day is compared with the pace of the month so far. */
function lineStatus(l,ym,act){
  const a=(act||monthAct(ym))[l.k]||{net:0,oo:0,fp:0};
  const oo=bud().ooin?0:a.oo;
  const counted=r2(a.net+a.fp-oo);
  const t=today(),cur=ym===ymOf(ds(t));
  const budget=lineAmt(l,ym);
  let base=budget;
  if(l.kd==='d'&&cur)base=budget*t.getDate()/dimOf(ym);
  const has=(a.net!==0||a.fp>0);
  let st='none',ratio=null;
  if(budget>0){
    if(l.kd==='f'&&!has)st='due';
    else{ratio=base>0?counted/base:(counted>0?9:0);st=ratio>1.2?'high':ratio>1.05?'warn':ratio<0.95?'good':'ok'}
  }
  return {l:l,counted:counted,oo:r2(a.oo),budget:budget,rem:r2(budget-counted),st:st,ratio:ratio,pace:r2(base),cur:cur,paid:a.fp>0};
}
const ST_TXT={good:['Under budget','أقل من الميزانية'],ok:['On budget','ضمن الميزانية'],warn:['Over budget','أعلى من الميزانية'],high:['Well over budget','أعلى بكثير من الميزانية'],due:['Not paid yet','لم يُدفع بعد'],none:['','']};
function bsBadge(st){
  if(!st||st==='none')return '';
  const ic=st==='good'||st==='ok'?'check':st==='due'?'flat':'warn';
  return '<span class="st bs-'+st+'">'+svgi(ic,'',3)+T2(ST_TXT[st][0],ST_TXT[st][1])+'</span>';
}
const ST_COL={good:'var(--z3)',ok:'var(--ink3)',warn:'var(--z2)',high:'var(--z1)',due:'var(--ink3)',none:'var(--ink3)'};
function budBar(s){
  const mx=Math.max(1,s.budget,s.counted);
  const w=Math.max(0,Math.min(100,Math.round(s.counted/mx*100)));
  const pace=(s.l.kd==='d'&&s.cur&&s.budget>0)?'<b class="bs-pace" style="left:'+Math.round(s.pace/mx*100)+'%" title="'+esc(T2('Where you should be by today','أين يجب أن تكون اليوم'))+'"></b>':'';
  return '<span class="bs-bar" role="img" aria-label="'+esc(nf(s.counted)+' / '+nf(s.budget))+'"><i class="bs-'+s.st+'" style="width:'+w+'%"></i>'+pace+'</span>';
}
/* ---------- month data for reports ---------- */
/* loans: money I lent and money that came back, grouped by who the loan is with */
function loanList(){
  const m={};
  eachEntry((x,d)=>{
    if(x.ty!=='l'&&x.ty!=='p')return;
    const nm=String(x.ln||'').trim();if(!nm)return;
    const k=nm.toLowerCase(),r=m[k]||(m[k]={key:k,name:nm,lent:0,back:0,last:'',n:0});
    const a=Number(x.a)||0;if(x.ty==='l')r.lent+=a;else r.back+=a;r.n++;if(d>r.last)r.last=d;
  });
  return Object.keys(m).map(k=>{const r=m[k];r.out=r2(r.lent-r.back);r.lent=r2(r.lent);r.back=r2(r.back);return r}).sort((a,b)=>((b.out>0)-(a.out>0))||(b.last<a.last?-1:b.last>a.last?1:0));
}
function loansCard(){
  const ls=loanList();if(!ls.length)return '';
  const open=ls.filter(l=>l.out>0),tot=r2(open.reduce((t,l)=>t+l.out,0));
  const rows=ls.map(l=>{
    const pct=l.lent>0?Math.round(Math.min(1,l.back/l.lent)*100):0,done=l.out<=0;
    return '<li class="loan-row"><div class="loan-top"><b data-notr="1">'+esc(l.name)+'</b><span class="st '+(done?'ok':'bad')+'">'+(done?T2('Paid back','تم السداد'):T2('Still owed ','متبقي ')+nf(l.out)+' EGP')+'</span></div>'
      +'<div class="exp-bar" aria-hidden="true"><i style="width:'+pct+'%"></i></div>'
      +'<small class="muted num">'+T2('Lent ','أعطيت ')+nf(l.lent)+' · '+T2('back ','رجع ')+nf(l.back)+'</small></li>';
  }).join('');
  return '<section class="card span2 loans-card"><div class="card-h"><h2>'+T2('Loans','السلف')+'</h2></div>'
    +(open.length?'<div class="note">'+T2('Still owed to you: ','المتبقي لك: ')+'<b class="num">'+nf(tot)+'</b> EGP</div>':'<div class="note">'+T2('Everything has been paid back.','كل السلف رجعت.')+'</div>')
    +'<ul class="loan-list">'+rows+'</ul></section>';
}
function eachEntry(fn){['p1','p2'].forEach(pid=>{const m=E[pid]||{};Object.keys(m).forEach(d=>Object.keys(m[d]).forEach(id=>fn(m[d][id]||{},d,pid,id)))})}
function periodRange(per){
  const t=today(),nowYm=ymOf(ds(t));
  if(per==='last'){const lm=P.mo(-1);return {a:ds(lm[0]),b:ds(lm[1]),ym:ymOf(ds(lm[0])),label:fmtMonLong.format(lm[0])}}
  if(per==='week'){const w=P.wk(0);return {a:ds(w[0]),b:ds(w[1]),ym:null,week:1,label:fmtShort.format(w[0])+' – '+fmtShort.format(w[1])}}
  if(per==='all')return {a:'0000-00-00',b:'9999-99-99',ym:null,label:T2('All time','كل الفترة')};
  const mo=P.mo(0);return {a:ds(mo[0]),b:ds(mo[1]),ym:nowYm,label:fmtMonLong.format(mo[0])};
}
function prevYm(ym,n){const a=ym.split('-');const d=new Date(+a[0],+a[1]-1-n,1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}
function monthTotals(ym,upTo){
  const r={tot:0,inc:0,ref:0,oo:0,n:0,cats:{},merch:{},days:{}};
  eachEntry((x,d)=>{
    if(d.slice(0,7)!==ym)return;if(upTo&&d>upTo)return;
    if(eMove(x))return;
    if(x.ty==='i'){r.inc+=Number(x.a)||0;return}
    const v=eNet(x);r.tot+=v;r.n++;
    if(x.ty==='r')r.ref+=Number(x.a)||0;
    const k=(x.c&&catName(x.c))?x.c:'_none';r.cats[k]=(r.cats[k]||0)+v;
    const c=catOf(x.c);if(c&&c.oo)r.oo+=v;
    r.days[d]=(r.days[d]||0)+v;
  });
  return r;
}
function rangeTotals(a,b){
  const r={tot:0,inc:0,ref:0,oo:0,n:0};
  eachEntry((x,d)=>{
    if(d<a||d>b)return;
    if(eMove(x))return;
    if(x.ty==='i'){r.inc+=Number(x.a)||0;return}
    const v=eNet(x);r.tot+=v;r.n++;
    if(x.ty==='r')r.ref+=Number(x.a)||0;
    const c=catOf(x.c);if(c&&c.oo)r.oo+=v;
  });
  return r;
}
/* ---------- CSV for the CFO ledger: same columns as the September import file ---------- */
function ledgerCsv(per){
  const R=periodRange(per);
  const cols=['date','type','amount','currency','account','merchant','budget_line','category','subcategory','one_off','module','note','amount_egp','amount_aed','amount_sar'];
  const rows=[cols.join(',')];
  const q=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"';
  const conv=(egp,ym)=>{const aed=rateOf('AED',ym),sar=rateOf('SAR',ym);return [r2(egp),aed?r2(egp/aed):'',sar?r2(egp/sar):'']};
  const out=[];
  eachEntry((x,d)=>{
    if(d<R.a||d>R.b)return;
    const c=catOf(x.c),l=lineOf(blOf(x.c));
    const sub=(x.sc&&c)?((c.sub||[]).find(s=>s.k===x.sc)||{}).en||'':'';
    const ty=x.ty==='r'?'refund':x.ty==='i'?'income':x.ty==='w'?'withdrawal':x.ty==='l'?'loan given':x.ty==='p'?'loan repaid':'expense';
    const cur=x.cur||'EGP',amt=x.cur?(Number(x.oa)||0):(Number(x.a)||0);
    const cv=conv(Number(x.a)||0,ymOf(d));
    out.push([d,[d,ty,amt,cur,acctName0(x.ac),x.n==='Earlier total'?'':((x.ln?x.ln+(x.n?' · ':''):'')+x.n),eSkip(x)?'':(l?(l.x||l.en):''),eSkip(x)?'':(c?(c.x||c.en):''),sub,(c&&c.oo)?'yes':'no','main','',cv[0],cv[1],cv[2]]]);
  });
  bud().fixed.forEach(f=>{
    const yms={};['p1','p2'].forEach(p=>Object.keys(F[p]||{}).forEach(y=>{yms[y]=1}));
    Object.keys(yms).forEach(ym=>{
      fxPays(ym,f.k).forEach(q=>{
        const d=q.d||ym+'-01';if(d<R.a||d>R.b)return;
        const cur=fxCur(f),egp=toEgp(Number(q.a)||0,cur,ym);const cv=conv(egp,ym);
        const l=f.bl?lineOf(f.bl):null;
        out.push([d,[d,'expense',q.a,cur,'',f.bl?(l.x||l.en):f.en,f.bl?(l.x||l.en):f.en,f.bl?(l.x||l.en):f.en,'','no',f.g==='uae'?'uae_house':f.g==='loan'?'loans':'main','Bill payment'+(q.n?' · '+q.n:''),cv[0],cv[1],cv[2]]]);
      });
    });
  });
  out.sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0).forEach(r=>rows.push(r[1].map(q).join(',')));
  return rows.join('\n');
}
function acctName0(k){const a=bud().accts.find(x=>x.k===k);return a?a.n:''}
async function exportLedger(per){
  const csv=ledgerCsv(per);
  try{
    const blob=new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='expenses-'+(per==='all'?'all':per==='last'?prevYm(ymOf(ds(today())),1):ymOf(ds(today())))+'.csv';
    document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);
  }catch(e){toast(T2('Could not save the file.','تعذّر حفظ الملف.'))}
}
/* ---------- Full money export for the CFO chat: every money record, all time, one JSON file ---------- */
function moneyExportData(){
  {
    const b=bud(),pn=id=>(person(id)&&person(id).name)||id;
    const fe=s=>String(s||'').replace(/\{p1\}/g,pn('p1')).replace(/\{p2\}/g,pn('p2'));
    const TY={x:'expense',r:'refund',i:'income',w:'withdrawal_or_transfer',l:'loan_given',p:'loan_repaid_to_me'};
    const acc=k=>{const a=b.accts.find(x=>x.k===k);return a?a.n:''};
    const tx=[];
    eachEntry((x,d,pid,id)=>{
      const c=catOf(x.c),l=c?lineOf(c.bl):null,cur=x.cur||'EGP',a=r2(Number(x.a)||0);
      const sub=(x.sc&&c)?((c.sub||[]).find(s=>s.k===x.sc)||{}).en||'':'';
      tx.push({id:id,date:d,logged_by:pn(pid),type:TY[x.ty||'x']||'expense',
        amount_egp:a,original_amount:x.cur?r2(Number(x.oa)||0):a,currency:cur,
        account:acc(x.ac),merchant_or_note:x.n==='Earlier total'?'':(x.n||''),is_earlier_total:x.n==='Earlier total',
        category:c?fe(c.en):'',subcategory:sub,budget_line:l?fe(l.en):'',one_off:!!(c&&c.oo),
        counts_as_spending:!eSkip(x),spending_effect_egp:r2(eNet(x)),
        loan_person:x.ln||'',refund_of_entry_id:x.lk||'',refund_of_entry_date:x.ld||'',
        logged_at:x.t?new Date(Number(x.t)).toISOString():''});
    });
    tx.sort((p,q)=>p.date<q.date?-1:p.date>q.date?1:(p.logged_at<q.logged_at?-1:1));
    const yms={};['p1','p2'].forEach(p=>Object.keys(F[p]||{}).forEach(y=>{yms[y]=1}));
    const ymList=Object.keys(yms).sort(),bills=[],pays=[],months=[];
    b.fixed.forEach(f=>{
      const l=f.bl?lineOf(f.bl):null,cur=fxCur(f),name=f.bl?fe(l.en):fe(f.en);
      bills.push({key:f.k,name:name,group:(GRP[f.g]||[f.g])[0],planned_amount:Number(fxAmt(f))||0,currency:cur,due_day:Number(f.day)||null,budget_line:l?fe(l.en):'',starts_from:(l&&l.from)||'',note:f.note||''});
      ymList.forEach(ym=>{
        const list=fxPays(ym,f.k),closed=fxClosed(ym,f.k);
        if(!list.length&&!closed)return;
        const s=fxState(f,ym);
        months.push({bill:name,month:ym,currency:cur,planned:s.exp,paid:s.paid,difference_planned_minus_paid:s.diff,status:s.st,closed_by_user:closed});
        list.forEach(q=>pays.push({bill:name,month:ym,date:q.d,paid_by:pn(q.pid),amount:q.a,currency:cur,amount_egp:toEgp(q.a,cur,ym),note:q.n}));
      });
    });
    pays.sort((p,q)=>p.date<q.date?-1:p.date>q.date?1:0);
    const byType={};tx.forEach(t=>{const o=byType[t.type]||(byType[t.type]={count:0,total_egp:0});o.count++;o.total_egp=r2(o.total_egp+t.amount_egp)});
    const out={
      about:'Money export from the Habits, Together app (two people, one household). Base currency is EGP. Every record is listed, all time.',
      how_to_read:[
        'transactions: every logged entry. amount_egp is the value in EGP; original_amount and currency show what was really paid when it was not EGP.',
        'type: expense, refund (reduces spending), income (never counted as spending), withdrawal_or_transfer (money moved between accounts, not spending), loan_given and loan_repaid_to_me (money moving, not spending or income).',
        'counts_as_spending and spending_effect_egp show exactly how each entry is counted. Refunds are negative.',
        'fixed_bill_payments: every payment made against a fixed bill (rent, phones, internet, school, UAE house, loans). A bill can be paid in several parts.',
        'fixed_bill_months: planned vs paid per bill and month (status: paid, partial, closed, overdue, soon, later, noday).',
        'budget: monthly budget lines, categories, accounts and the exchange rates used (rate = EGP per 1 unit of currency).',
        'is_earlier_total marks an opening total entered for the days before detailed logging started.'],
      exported_on:ds(today()),data_mode:mode,
      control_totals:{transactions:tx.length,first_date:tx.length?tx[0].date:'',last_date:tx.length?tx[tx.length-1].date:'',by_type:byType,bill_payments:pays.length,bill_payments_total_egp:r2(pays.reduce((t,q)=>t+q.amount_egp,0))},
      transactions:tx,fixed_bills:bills,fixed_bill_months:months,fixed_bill_payments:pays,
      budget:{
        lines:b.lines.map(l=>({key:l.k,name:fe(l.en),monthly_amount_egp_this_month:lineAmt(l),monthly_amount_sar:(l.sar!=null&&l.sar!==''?Number(l.sar):null),kind:l.kd==='f'?'fixed monthly':'logged day by day',counts_toward_daily_limit:!!l.dl,starts_from:l.from||''})),
        categories:b.cats.map(c=>({key:c.k,name:fe(c.en),budget_line:(lineOf(c.bl)||{}).en?fe(lineOf(c.bl).en):c.bl,active:c.on!==false,one_off:!!c.oo,subcategories:(c.sub||[]).map(s=>s.en)})),
        accounts:b.accts.map(a=>a.n),
        exchange_rates_to_egp:b.rates,exchange_rates_by_month:b.ratesM||{},daily_spending_limit_egp:Number(b.dlim)||0,one_offs_count_in_daily_limit:!!b.ooin,uae_house_fund_aed:Number((b.uae||{}).fund)||0}
    };
    return out;
  }
}
/* ---- file builders: CSV, and a real .xlsx written by hand (zip without compression), so no library is needed ---- */
const csvCell=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"';
function moneyCsvText(out){
  const cols=['record','date','month','logged_by','type','bill_or_category','subcategory','budget_line','amount','currency','amount_egp','account','merchant_or_note','one_off','counts_as_spending','spending_effect_egp','loan_person','refund_of_entry_id','entry_id','logged_at'];
  const rows=[cols.join(',')];
  out.transactions.forEach(t=>rows.push([ 'transaction',t.date,t.date.slice(0,7),t.logged_by,t.type,t.category,t.subcategory,t.budget_line,t.original_amount,t.currency,t.amount_egp,t.account,t.merchant_or_note,t.one_off?'yes':'no',t.counts_as_spending?'yes':'no',t.spending_effect_egp,t.loan_person,t.refund_of_entry_id,t.id,t.logged_at].map(csvCell).join(',')));
  out.fixed_bill_payments.forEach(q=>rows.push(['bill_payment',q.date,q.month,q.paid_by,'bill payment',q.bill,'','',q.amount,q.currency,q.amount_egp,'',q.note,'no','no','','','','',''].map(csvCell).join(',')));
  return '\ufeff'+rows.join('\r\n');
}
const xlsxEsc=v=>String(v==null?'':v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const xlsxCol=n=>{let r='';n++;while(n>0){const m=(n-1)%26;r=String.fromCharCode(65+m)+r;n=Math.floor((n-1)/26)}return r};
function xlsxSheet(rows,widths){
  const data=rows.map((r,i)=>'<row r="'+(i+1)+'">'+r.map((v,c)=>{
    const ref=xlsxCol(c)+(i+1),st=i===0?' s="1"':'';
    if(typeof v==='number'&&isFinite(v))return '<c r="'+ref+'"'+st+'><v>'+v+'</v></c>';
    if(typeof v==='boolean')v=v?'yes':'no';
    return '<c r="'+ref+'" t="inlineStr"'+st+'><is><t xml:space="preserve">'+xlsxEsc(v)+'</t></is></c>'}).join('')+'</row>').join('');
  const cols='<cols>'+(widths||[]).map((w,i)=>'<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+w+'" customWidth="1"/>').join('')+'</cols>';
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/>'+(widths&&widths.length?cols:'')+'<sheetData>'+data+'</sheetData></worksheet>';
}
let CRC_T=null;
function crc32(u8){
  if(!CRC_T){CRC_T=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);CRC_T[n]=c>>>0}}
  let c=0xFFFFFFFF;for(let i=0;i<u8.length;i++)c=CRC_T[(c^u8[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;
}
function zipStore(files){
  const enc=new TextEncoder(),parts=[],cen=[];let off=0;
  files.forEach(f=>{
    const nm=enc.encode(f.name),d=enc.encode(f.text),crc=crc32(d);
    const lh=new DataView(new ArrayBuffer(30));
    lh.setUint32(0,0x04034b50,true);lh.setUint16(4,20,true);lh.setUint16(6,0x0800,true);lh.setUint16(8,0,true);lh.setUint16(10,0,true);lh.setUint16(12,0x21,true);
    lh.setUint32(14,crc,true);lh.setUint32(18,d.length,true);lh.setUint32(22,d.length,true);lh.setUint16(26,nm.length,true);lh.setUint16(28,0,true);
    parts.push(new Uint8Array(lh.buffer),nm,d);
    const ch=new DataView(new ArrayBuffer(46));
    ch.setUint32(0,0x02014b50,true);ch.setUint16(4,20,true);ch.setUint16(6,20,true);ch.setUint16(8,0x0800,true);ch.setUint16(10,0,true);ch.setUint16(12,0,true);ch.setUint16(14,0x21,true);
    ch.setUint32(16,crc,true);ch.setUint32(20,d.length,true);ch.setUint32(24,d.length,true);ch.setUint16(28,nm.length,true);ch.setUint32(42,off,true);
    cen.push(new Uint8Array(ch.buffer),nm);
    off+=30+nm.length+d.length;
  });
  let cs=0;cen.forEach(x=>{cs+=x.length});
  const e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cs,true);e.setUint32(16,off,true);
  return new Blob(parts.concat(cen,[new Uint8Array(e.buffer)]),{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
function exportXlsx(out){
  const tbl=(arr,keys)=>{const k=keys||(arr.length?Object.keys(arr[0]):['(empty)']);return [k].concat(arr.map(o=>k.map(c=>o[c])))};
  const wd=t=>t[0].map((_,c)=>Math.min(48,Math.max(10,...t.slice(0,60).map(r=>String(r[c]==null?'':r[c]).length+2))));
  const rateRows=[['month','AED','SAR','USD']].concat(Object.keys(out.budget.exchange_rates_by_month||{}).sort().map(m=>{const r=out.budget.exchange_rates_by_month[m];return [m,r.AED,r.SAR,r.USD]}));
  const r0=out.budget.exchange_rates_to_egp||{};rateRows.push(['starting rates (used when a month has none)',r0.AED,r0.SAR,r0.USD]);
  const readme=[['Money export'],[out.about],['Exported on',out.exported_on],['']].concat(out.how_to_read.map(x=>[x])).concat([[''],['Control totals'],['transactions',out.control_totals.transactions],['first date',out.control_totals.first_date],['last date',out.control_totals.last_date],['bill payments',out.control_totals.bill_payments],['bill payments total (EGP)',out.control_totals.bill_payments_total_egp]]).concat(Object.keys(out.control_totals.by_type).map(k=>['total '+k+' (EGP)',out.control_totals.by_type[k].total_egp]));
  const sheets=[
    ['Read me',readme,[110,20]],
    ['Transactions',tbl(out.transactions)],
    ['Bill payments',tbl(out.fixed_bill_payments)],
    ['Bill months',tbl(out.fixed_bill_months)],
    ['Bills',tbl(out.fixed_bills)],
    ['Budget lines',tbl(out.budget.lines)],
    ['Categories',tbl(out.budget.categories.map(c=>Object.assign({},c,{subcategories:c.subcategories.join('; ')})))],
    ['Accounts',[['account']].concat(out.budget.accounts.map(a=>[a]))],
    ['Rates',rateRows,[44,10,10,10]]
  ];
  const files=[
    {name:'[Content_Types].xml',text:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+sheets.map((x,i)=>'<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('')+'</Types>'},
    {name:'_rels/.rels',text:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'},
    {name:'xl/workbook.xml',text:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+sheets.map((x,i)=>'<sheet name="'+xlsxEsc(x[0])+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>').join('')+'</sheets></workbook>'},
    {name:'xl/_rels/workbook.xml.rels',text:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+sheets.map((x,i)=>'<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>').join('')+'<Relationship Id="rId'+(sheets.length+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'},
    {name:'xl/styles.xml',text:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'}
  ].concat(sheets.map((x,i)=>({name:'xl/worksheets/sheet'+(i+1)+'.xml',text:xlsxSheet(x[1],x[2]||wd(x[1]))})));
  return zipStore(files);
}
function fullMoneyExport(fmt){
  try{
    const out=moneyExportData(),day=ds(today());let blob,name;
    if(fmt==='xlsx'){blob=exportXlsx(out);name='money-full-export-'+day+'.xlsx'}
    else if(fmt==='csv'){blob=new Blob([moneyCsvText(out)],{type:'text/csv;charset=utf-8'});name='money-full-export-'+day+'.csv'}
    else{blob=new Blob([JSON.stringify(out,null,1)],{type:'application/json;charset=utf-8'});name='money-full-export-'+day+'.json'}
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;
    document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);
    toast(T2('Saved. Send this file to your CFO chat.','تم الحفظ. أرسل الملف إلى المدير المالي.'));
  }catch(e){toast(T2('Could not save the file.','تعذّر حفظ الملف.'))}
}
function weekDone(h,pid,d){
  if(h.per!=='week'||+h.target!==1||h.type==='cap'||h.type==='count'||h.kind==='underlimit')return false;
  const a=wkStart(d);for(let i=0;i<7;i++){const x=addDays(a,i);if(x>d)break;if(isTicked(h,pid,ds(x)))return true}return false;
}
function isTicked(h,pid,dstr){return (((L[repOf(h,pid)]||{})[dstr])||[]).indexOf(h.id)>=0}
function capSum(pid,h,from,to){
  let n=0;for(let d=from;d<=to;d=addDays(d,1))n+=Number(getVal(repOf(h,pid),ds(d),h.id))||0;return n;
}
function applyNum(h,pid,dstr,val){
  const tg=hTargets(h,pid);
  if(val==null||isNaN(val)){valSet(tg,dstr,h.id);tickSet(tg,dstr,h.id,false);return}
  if(h.type==='cap'){valSet(tg,dstr,h.id,val>0?val:undefined);return}
  if(h.type==='count'&&h.lim){valSet(tg,dstr,h.id,val);tickSet(tg,dstr,h.id,val<=(Number(h.goal)||0));return}
  if(h.type==='count'){valSet(tg,dstr,h.id,val>0?val:undefined);tickSet(tg,dstr,h.id,val>=(h.goal||1));return}
  valSet(tg,dstr,h.id,val);tickSet(tg,dstr,h.id,true);
}
function prevVal(pid,h,dstr,maxBack){
  const rp=repOf(h,pid);
  for(let i=1;i<=maxBack;i++){const d=ds(addDays(pd(dstr),-i));const v=getVal(rp,d,h.id);if(v!=null&&typeof v!=='object')return {v:Number(v),d:d}}
  return null;
}
const BY_AR=[["The Prophet ﷺ", "النبي ﷺ"], ["Sahih al-Bukhari", "صحيح البخاري"], ["Sahih Muslim", "صحيح مسلم"], ["Sunan at-Tirmidhi", "سنن الترمذي"], ["Sunan Abi Dawud", "سنن أبي داود"], ["Qur’an", "القرآن"], ["reported by al-Hakim", "رواه الحاكم"], ["Shu‘ab al-Iman, al-Bayhaqi", "شعب الإيمان للبيهقي"], ["Attributed to Umar ibn al-Khattab, quoted by at-Tirmidhi", "يُنسب إلى عمر بن الخطاب، نقله الترمذي"], ["Will Durant, summing up Aristotle", "ويل ديورانت، يلخّص أرسطو"], ["The Story of Philosophy", "قصة الفلسفة"], ["Marcus Aurelius", "ماركوس أوريليوس"], ["Meditations", "التأملات"], ["Seneca", "سينيكا"], ["On the Shortness of Life", "عن قصر الحياة"], ["Lao Tzu", "لاو تزو"], ["Tao Te Ching, ch. 64", "الداو دي جينغ، الفصل 64"], ["Thomas Edison", "توماس إديسون"], ["Maya Angelou", "مايا أنجيلو"], ["Benjamin Franklin", "بنجامين فرانكلين"], ["Poor Richard’s Almanack", "تقويم ريتشارد الفقير"], ["Ralph Waldo Emerson", "رالف والدو إمرسون"], ["Circles", "الدوائر"], ["Samuel Johnson", "صموئيل جونسون"], ["Rasselas", "راسيلاس"], ["Theodore Roosevelt", "ثيودور روزفلت"], ["Citizenship in a Republic, 1910", "المواطنة في جمهورية، 1910"], ["Warren Buffett", "وارن بافيت"], ["Y Combinator’s motto, Paul Graham", "شعار واي كومبيناتور، بول غراهام"], ["Steve Blank", "ستيف بلانك"], ["customer development", "تطوير العملاء"], ["Reid Hoffman", "ريد هوفمان"], ["Ray Dalio", "راي داليو"], ["Principles", "المبادئ"], ["Viktor Frankl", "فيكتور فرانكل"], ["Man’s Search for Meaning (idea)", "الإنسان يبحث عن المعنى (فكرة)"], ["Jim Rohn", "جيم رون"], ["Attributed to Arthur Ashe", "يُنسب إلى آرثر آش"], ["Atomic Habits", "العادات الذرية"], ["James Clear", "جيمس كلير"], ["habit stacking", "ربط العادات"], ["The Power of Habit", "قوة العادات"], ["Charles Duhigg", "تشارلز دويج"], ["The Subtle Art of Not Giving a F*ck", "فن اللامبالاة"], ["Mark Manson", "مارك مانسون"], ["Deep Work", "العمل العميق"], ["Cal Newport", "كال نيوبورت"], ["The 7 Habits of Highly Effective People", "العادات السبع للناس الأكثر فعالية"], ["Stephen Covey", "ستيفن كوفي"], ["The Psychology of Money", "سيكولوجية المال"], ["Morgan Housel", "مورغان هاوسل"], ["The Richest Man in Babylon", "أغنى رجل في بابل"], ["The Five Love Languages", "لغات الحب الخمس"], ["Gary Chapman", "غاري تشابمان"], ["Ihya’ Ulum al-Din", "إحياء علوم الدين"], ["al-Ghazali", "الغزالي"], ["Al-Hikam al-‘Ata’iyya", "الحكم العطائية"], ["Ibn ‘Ata’illah al-Iskandari", "ابن عطاء الله السكندري"], ["The Seven Principles for Making Marriage Work", "المبادئ السبعة لإنجاح الزواج"], ["John Gottman", "جون غوتمان"], ["Self-monitoring research", "أبحاث المتابعة الذاتية"], ["Prophetic teaching on a smile as charity", "حديث الابتسامة صدقة"], ["Simple arithmetic", "حساب بسيط"]].sort((a,b)=>b[0].length-a[0].length);
const byTxt=t=>{if(ui.lang!=='ar'||!t)return t;let o=String(t);BY_AR.forEach(p=>{o=o.split(p[0]).join(p[1])});return o};
/* ---------- one thought per page, changing every day ---------- */
const PAGE_KIND={
  today:{en:'Thought of the day',ar:'فكرة اليوم',off:0},
  week:{en:'Did you know?',ar:'هل تعلم؟',off:7},
  dash:{en:'A great achievement',ar:'إنجاز عظيم',off:13},
  impact:{en:'From the bookshelf',ar:'من رفّ الكتب',off:19},
  money:{en:'Money wisdom',ar:'حكمة المال',off:3}
};
const CATS={faith:{en:'Faith',ar:'إيمان'},science:{en:'Science',ar:'علم'},life:{en:'Life',ar:'حياة'},business:{en:'Business',ar:'أعمال'},book:{en:'Book idea',ar:'فكرة من كتاب'},history:{en:'History',ar:'تاريخ'},health:{en:'Health',ar:'صحة'},family:{en:'Family',ar:'أسرة'},money:{en:'Money',ar:'المال'}};
function dailyItem(page){
  const a=(CONTENT.pools||{})[page];if(!a||!a.length)return null;
  return a[(dayNum()+(PAGE_KIND[page]||{off:0}).off)%a.length];
}
const REL_RX=/Qur’an|Qur'an|Prophet|Sahih|Sunan|Hadith|Bukhari|Muslim|Ghazali|Umar ibn|Shu‘ab/;
const isRel=it=>!!(it&&(it.orig||REL_RX.test(it.by||'')));
const byForceAr=t=>{if(!t)return t;let o=String(t);BY_AR.forEach(p=>{o=o.split(p[0]).join(p[1])});return o};
function quoteBanner(page){
  const it=dailyItem(page);if(!it)return '';
  const ar=ui.lang==='ar',k=PAGE_KIND[page],rel=isRel(it);
  const cat=CATS[it.c];
  const head='<section class="daily" id="daily"><div class="dk">'+esc(ar?k.ar:k.en)+(cat?' <span class="dcat">'+esc(ar?cat.ar:cat.en)+'</span>':'')+'</div>';
  if(rel){
    /* Qur’an, hadith and religious teaching are always shown in Arabic, in both languages */
    const txt=it.orig||it.ar,more=ar?it.moreAr:(it.moreEn||it.moreAr);
    return head+'<p class="dq drel" lang="ar" dir="rtl">'+esc(txt)+'</p>'
      +(ar?'':'<p class="dtr" lang="en" dir="ltr">'+esc(it.en)+'</p>')
      +'<div class="da" lang="ar" dir="rtl">'+esc(it.byAr||byForceAr(it.by||''))+'</div>'
      +(more?'<details><summary>'+(ar?'اقرأ أكثر':'Read more')+'</summary><p class="ds" lang="'+LG()+'" dir="'+DIR()+'">'+esc(more)+'</p></details>':'')+'</section>';
  }
  const main=ar?it.ar:it.en,more=ar?it.moreAr:it.moreEn;
  return head+'<p class="dq" lang="'+LG()+'" dir="'+DIR()+'">'+esc(main)+'</p><div class="da" lang="'+LG()+'" dir="'+DIR()+'">'+esc((ar&&it.byAr)||byTxt(it.by||''))+'</div>'
    +(more?'<details><summary>'+(ar?'اقرأ أكثر':'Read more')+'</summary><p class="ds" lang="'+LG()+'" dir="'+DIR()+'">'+esc(more)+'</p></details>':'')+'</section>';
}
/* ---------- trophies that grow: every family has levels ---------- */
const TIER_NAMES=[{en:'',ar:''},{en:'Bronze',ar:'برونزية'},{en:'Silver',ar:'فضية'},{en:'Gold',ar:'ذهبية'},{en:'Platinum',ar:'بلاتينية'},{en:'Diamond',ar:'ماسية'},{en:'Legend',ar:'أسطورية'}];
function achApplies(pid,r){
  const has=f=>S.habits.some(h=>f(h)&&h.who.indexOf(pid)>=0);
  switch(r.t){
    case 'days':return has(h=>h.id===r.h);
    case 'tag':case 'tagall':return has(h=>h.type==='tag');
    case 'underspend':case 'logweeks':return has(h=>h.kind==='spend'&&h.type==='num');
    case 'cap_weeks':return has(h=>h.type==='cap');
    case 'pages':return has(h=>h.kind===(r.k==='tafsir'?'tafsir':'quran'));
    case 'minutes':return has(h=>h.kind===r.k);
  }
  return true;
}
function achProgress(pid,r){
  const s=pd(S.start),t=today();
  switch(r.t){
    case 'checkins':return checkIns(pid,s,t);
    case 'fulldays':return fullDays(pid,s,t);
    case 'streak':return streaks(pid).best;
    case 'pages':{const o=impact(pid,s,t);return r.k==='tafsir'?o.tafsirPages:o.pages}
    case 'minutes':{const o=impact(pid,s,t);return r.k==='study'?o.studyMin:o.exMin}
    case 'days':{let n=0;const log=L[pid]||{};Object.keys(log).forEach(k=>{if(log[k].indexOf(r.h)>=0)n++});return n}
    case 'tagall':{let n=0;const v=V[pid]||{};Object.keys(v).forEach(k=>{S.habits.forEach(h=>{if(h.type==='tag'){const x=v[k][h.id];if(x&&x.t)n++}})});return n}
    case 'tag':{let n=0;const v=V[pid]||{};Object.keys(v).forEach(k=>{S.habits.forEach(h=>{if(h.type==='tag'){const x=v[k][h.id];if(x&&x.t===r.v)n++}})});return n}
    case 'underspend':{
      const h=S.habits.find(x=>x.kind==='spend'&&x.type==='num');if(!h)return 0;
      let best=0,run=0;for(let d=s;d<=t;d=addDays(d,1)){const v=getVal(repOf(h,pid),ds(d),h.id);if(v!=null&&Number(v)<=spLim(ds(d))){run++;if(run>best)best=run}else run=0}
      return best;
    }
    case 'logweeks':{
      const h=S.habits.find(x=>x.kind==='spend'&&x.type==='num');if(!h)return 0;
      let n=0;
      for(let a=wkStart(s);addDays(a,6)<=t;a=addDays(a,7)){
        let all=true;
        for(let d=a;d<=addDays(a,6);d=addDays(d,1)){if(d<s||!isTicked(h,pid,ds(d))){all=false;break}}
        if(all)n++;
      }
      return n;
    }
    case 'cap_weeks':{
      const h=S.habits.find(x=>x.type==='cap');if(!h)return 0;
      let n=0;
      for(let a=wkStart(s);addDays(a,6)<t;a=addDays(a,7)){
        let active=false;
        for(let d=a;d<=addDays(a,6);d=addDays(d,1)){if(d>=s&&(((L[pid]||{})[ds(d)])||[]).length)active=true}
        if(active&&capSum(pid,h,a,addDays(a,6))<=h.goal)n++;
      }
      return n;
    }
  }
  return 0;
}
function trophyList(pid){
  return (CONTENT.trophies||[]).filter(a=>achApplies(pid,a.rule)).map(a=>{
    const cur=achProgress(pid,a.rule),tiers=a.tiers||[1];
    let tier=0;while(tier<tiers.length&&cur>=tiers[tier])tier++;
    return {a:a,cur:cur,tiers:tiers,tier:tier,next:tier<tiers.length?tiers[tier]:null,max:tier>=tiers.length};
  });
}
function checkTrophies(){
  if(mode==='sample')return;
  let seen;try{seen=JSON.parse(localStorage.getItem('istiqama.trophies2')||'null')}catch(e){seen=null}
  const first=!seen;seen=seen||{};
  let msg=null;
  S.people.forEach(p=>{
    const sp=seen[p.id]||(seen[p.id]={});
    trophyList(p.id).forEach(x=>{
      const prev=sp[x.a.id]||0;
      if(x.tier>prev){sp[x.a.id]=x.tier;if(!first)msg=pname(p.id)+(ui.lang==='ar'?' نال الجائزة ':' earned ')+(ui.lang==='ar'?x.a.ar:x.a.en)+' · '+(ui.lang==='ar'?TIER_NAMES[Math.min(6,x.tier)].ar:TIER_NAMES[Math.min(6,x.tier)].en)}
    });
  });
  try{localStorage.setItem('istiqama.trophies2',JSON.stringify(seen))}catch(e){}
  if(msg)toast((ui.lang==='ar'?'جائزة جديدة! ':'New trophy! ')+msg);
}
let COACHNOTE=null;
try{const x=JSON.parse(localStorage.getItem('istiqama.coach')||'null');if(x)COACHNOTE=x}catch(e){}
/* The coach notes in the public repo are encrypted. The key comes from the family code in your link, so only your phones can read them. */
async function coachDecrypt(e){
  try{
    if(!FAM||!(window.crypto&&crypto.subtle))return null;
    const b=x=>Uint8Array.from(atob(x),c=>c.charCodeAt(0));
    const km=await crypto.subtle.importKey('raw',new TextEncoder().encode(FAM),'PBKDF2',false,['deriveKey']);
    const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:b(e.salt),iterations:e.iter||100000,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,['decrypt']);
    const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:b(e.iv)},key,b(e.ct));
    return JSON.parse(new TextDecoder().decode(pt));
  }catch(x){return null}
}
async function loadCoachNote(){
  try{
    const r=await fetch('coach.json?t='+Date.now(),{cache:'no-store'});
    if(!r.ok)return;
    let c=await r.json();
    if(c&&c.enc){c=await coachDecrypt(c.enc);if(!c)return}
    if(c&&((c.notes&&typeof c.notes==='object')||c.deep)){
      const changed=JSON.stringify(c)!==JSON.stringify(COACHNOTE);
      COACHNOTE=c;try{localStorage.setItem('istiqama.coach',JSON.stringify(c))}catch(e){}
      if(changed&&ui.tab==='impact'&&!(ui.tab==='setup'&&draftDirty))render();
    }
  }catch(e){}
}
function claudeNote(pids){
  if(mode==='sample'||!COACHNOTE||!COACHNOTE.notes)return '';
  const ar=ui.lang==='ar',N=COACHNOTE.notes;
  const keys=(pids.length>1?['together']:[]).concat(pids).filter(k=>N[k]&&(ar?N[k].ar:N[k].en));
  if(!keys.length)return '';
  let when='';try{when=fmtShort.format(pd(COACHNOTE.week))}catch(e){}
  const blocks=keys.map(k=>{
    const t=String((ar?N[k].ar:N[k].en)||'').split(/\n+/).filter(Boolean).map(x=>'<p>'+esc(x)+'</p>').join('');
    const nm=k==='together'?(ar?'معًا':'Together'):pname(k);
    const AR_=N[k].areas||{};
    const ar2=AREAS.filter(a=>AR_[a.id]&&String((ar?AR_[a.id].ar:AR_[a.id].en)||'').trim()).map(a=>
      '<div class="cn-area area-'+esc(a.id)+'"><div class="agh area-'+esc(a.id)+'">'+svgi(a.id)+'<span>'+esc(areaName(a.id))+'</span></div><p>'+esc(ar?AR_[a.id].ar:AR_[a.id].en)+'</p></div>').join('');
    return '<details class="cn-person" data-key="'+esc(k)+'"'+((ui.cnOpen&&ui.cnOpen[k]!==undefined?ui.cnOpen[k]:k===keys[0])?' open':'')+'><summary><span class="pname cn-name"><span class="dot cn-dot" style="background:'+(k==='together'?'var(--brand)':pcol(k))+'"></span>'+esc(nm)+'</span><span class="cn-chevron" aria-hidden="true"></span></summary><div class="cn-inner"><div class="cn-prose">'+t+'</div>'+(ar2?'<div class="cn-areas">'+ar2+'</div>':'')+'</div></details>';
  }).join('');
  return '<section class="card coach claude-note span2" data-notr="1" lang="'+LG()+'" dir="'+DIR()+'"><div class="areahead cn-head"><span class="areaico cn-seal"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M8 11.5c4-4 10-2 11 1 1-3 7-5 11-1 6 6-4 16-11 20-7-4-17-14-11-20z"/><path d="M12 19c3 0 5 3 7 4 3-2 5-4 9-4"/></svg></span><div class="cn-heading"><h2>'+(ar?'رسالة من Claude':'A note from Claude')+'</h2>'
    +(when?'<small class="note cn-sub">'+(ar?'عن الأسبوع الذي بدأ في ':'For the week starting ')+esc(when)+'</small>':'')+'</div></div><div class="cn-persons">'+blocks+'</div><svg class="cn-flourish" viewBox="0 0 92 18" aria-hidden="true"><path d="M2 13c16-16 20 10 36 0 10-8 20-12 26-6 5 5 10 8 25-1"/></svg></section>';
}
async function loadContent(){
  try{
    const r=await fetch('content.json?t='+Date.now(),{cache:'no-store'});
    if(!r.ok)return;
    const c=await r.json();
    if(c&&c.pools&&c.impact&&c.trophies&&c.v>=CONTENT.v){
      const changed=JSON.stringify(c)!==JSON.stringify(CONTENT);
      CONTENT=c;try{localStorage.setItem('istiqama.content',JSON.stringify(c))}catch(e){}
      if(changed&&!(ui.tab==='setup'&&draftDirty))render();
    }
  }catch(e){}
}

/* ---------- sample data ---------- */
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function makeSample(){
  const cfg=defaults();cfg.setup=true;cfg.smp=1;
  const t=today();const k=(t.getDay()-cfg.weekStart+7)%7;const start=addDays(addDays(t,-k),-70);
  cfg.start=ds(start);
  cfg.people[0].height=175;cfg.people[0].weight=78;cfg.people[0].year=1988;
  cfg.people[1].height=163;cfg.people[1].weight=64;cfg.people[1].year=1990;
  const logs={p1:{},p2:{}},vals={p1:{},p2:{}};const R=rng(11);
  const q={p1:[.62,.9],p2:[.42,.86]};
  const diff={workout:-.07,couple:-.05,learn:-.04,tafsir:-.03,quran:.04,bizfocus:-.05,give:-.06};
  const w0={p1:78,p2:64};
  let n=0;for(let d=start;d<=t;d=addDays(d,1))n++;
  const noteList=['One-page plan','Supplier quote','Price test','Sample ready','Call with a shop owner'];
  const tagSeq=['idea','idea','talk','talk','sample','talk','sample','sale'];
  ['p1','p2'].forEach(pid=>{
    let i=0,tagI=0;
    for(let d=start;d<=t;d=addDays(d,1),i++){
      const dst=ds(d);
      const fr=n>1?i/(n-1):1;const base=q[pid][0]+(q[pid][1]-q[pid][0])*fr;const arr=[];
      cfg.habits.forEach(h=>{
        if(h.who.indexOf(pid)<0)return;
        if(h.joint&&pid!==h.who[0])return;
        const setV=v=>{(vals[pid][dst]||(vals[pid][dst]={}))[h.id]=v};
        if(h.type==='cap'){
          if(R()<.28&&!sameDay(d,t))setV(1+(R()<.2?1:0));
          return;
        }
        const perDay=h.per==='month'?h.target/30.4:h.target/7;
        let pr=clamp((base+(diff[h.id]||0))*perDay*(h.per==='month'?1:1)+0.04*(h.per==='month'?0:1),0,.97);
        if(sameDay(d,t))pr*=.5;
        const hit=R()<pr;
        if(h.type==='count'){
          const g=h.goal||1;
          if(hit){arr.push(h.id);setV(g)}
          else if(R()<.5&&!sameDay(d,t))setV(Math.floor(R()*g));
          return;
        }
        if(!hit)return;
        arr.push(h.id);
        if(h.type==='num'){
          if(h.kind==='spend')setV(Math.round(620+R()*(h.goal*0.62)));
          else if(h.kind==='weight')setV(Math.round((w0[pid]-i*(pid==='p1'?0.045:0.03)+(R()-.5)*.6)*10)/10);
          else setV(Math.round(4000+R()*6000));
        }else if(h.type==='tag'){
          setV({t:tagSeq[Math.min(tagI,tagSeq.length-1)],n:noteList[tagI%noteList.length]});tagI++;
        }
      });
      if(arr.length)logs[pid][dst]=arr;
    }
  });
  /* shared habits: the same record for both people */
  cfg.habits.filter(h=>h.joint).forEach(h=>{
    const src=h.who[0];
    h.who.forEach(pid=>{
      if(pid===src)return;
      Object.keys(logs[src]).forEach(dst=>{
        const has=logs[src][dst].indexOf(h.id)>=0;
        if(has)(logs[pid][dst]||(logs[pid][dst]=[])).push(h.id);
      });
      Object.keys(vals[src]).forEach(dst=>{
        if(vals[src][dst][h.id]!==undefined)(vals[pid][dst]||(vals[pid][dst]={}))[h.id]=vals[src][dst][h.id];
      });
    });
  });

  /* sample expenses (same day totals as the demo numbers), refunds, income and fixed payments */
  const exp={p1:{},p2:{}},fix={p1:{},p2:{}};
  (function(){
    const sp=cfg.habits.find(h=>h.kind==='spend'&&h.type==='num');if(!sp)return;
    const src=sp.who[0];
    const CK=['groc','groc','food','food','trans','care','med','fun','subs','cloth'];
    const NT={groc:['Spinneys','Carrefour','Seoudi'],food:['Talabat','Breadfast','Lunch'],trans:['Uber','InDrive'],care:['Barber'],med:['Pharmacy'],fun:['Cinema'],subs:['Spotify'],cloth:['Zara kids']};
    const AC=['c3619','cash','instapay','adib'];
    let seq=0;
    const put=(dst,pid,e)=>{const day=exp[pid][dst]||(exp[pid][dst]={});day['s'+(seq++)]=e;sp.who.forEach(p=>{const a=logs[p][dst]||(logs[p][dst]=[]);if(a.indexOf(sp.id)<0)a.push(sp.id)})};
    Object.keys(vals[src]).forEach(dst=>{
      const v=vals[src][dst][sp.id];if(v==null||typeof v==='object')return;
      const n=2+Math.floor(R()*3);let left=Math.round(v);
      for(let j=0;j<n;j++){
        const part=j===n-1?left:Math.max(20,Math.round(left*(.2+R()*.4)));
        left-=part;if(part<=0)continue;
        const ck=CK[Math.floor(R()*CK.length)],nl=NT[ck];
        const e={a:part,n:nl[Math.floor(R()*nl.length)],c:ck,t:pd(dst).getTime()+(9+j*3)*36e5,ac:AC[Math.floor(R()*AC.length)]};
        if(e.n==='Talabat')e.sc='online';
        put(dst,R()<.65?'p1':'p2',e);
      }
      sp.who.forEach(p=>{if(vals[p][dst]){delete vals[p][dst][sp.id];if(!Object.keys(vals[p][dst]).length)delete vals[p][dst]}});
    });
    const dayK=k=>ds(addDays(t,-k));
    const T0=k=>pd(dayK(k)).getTime()+14*36e5;
    put(dayK(1),'p1',{a:350,n:'Amazon',c:'cloth',ty:'r',t:T0(1),ac:'c3619'});
    put(dayK(6),'p2',{a:640,n:'Swimming class',c:'kenz',t:T0(6),ac:'cash'});
    put(dayK(12),'p1',{a:4200,n:'Curtains',c:'house',sc:'furn',t:T0(12),ac:'c3619'});
    put(dayK(3),'p2',{a:792,n:'Dubai Mall',c:'gift',cur:'AED',oa:60,t:T0(3),ac:'c3619'});
    exp.p1[dayK(4)]=Object.assign({},exp.p1[dayK(4)]||{},{si1:{a:12000,n:'Client payment',ty:'i',t:T0(4),ac:'adib'}});
    const ym=ymOf(ds(t));
    const PAID=[['f_ph1',1320,3],['f_ph2',1320,3],['f_net',3300,5],['f_util',3960,6]];
    PAID.forEach(x=>{if(t.getDate()>=x[2])(fix.p1[ym]||(fix.p1[ym]={}))[x[0]]={d:ym+'-'+String(x[2]).padStart(2,'0'),a:x[1],ts:1}});
    if(t.getDate()>=2){(fix.p1[ym]||(fix.p1[ym]={})).u_rent={d:ym+'-02',a:4585,ts:1}}
    /* "Stay within the daily limit" follows the expenses */
    const un=cfg.habits.find(h=>h.kind==='underlimit');
    if(un){
      const net={};
      ['p1','p2'].forEach(p=>Object.keys(exp[p]).forEach(d=>Object.keys(exp[p][d]).forEach(id=>{const x=exp[p][d][id];if(eDaily(x))net[d]=(net[d]||0)+eNet(x)})));
      un.who.forEach(p=>{
        Object.keys(logs[p]).forEach(d=>{logs[p][d]=logs[p][d].filter(id=>id!==un.id);if(!logs[p][d].length)delete logs[p][d]});
        Object.keys(logs[src]).forEach(d=>{
          const logged=logs[src][d].indexOf(sp.id)>=0&&(exp.p1[d]||exp.p2[d]);
          if(logged&&(net[d]||0)<=spLim(d))(logs[p][d]||(logs[p][d]=[])).push(un.id);
        });
      });
    }
  })();
  return {cfg:cfg,logs:logs,vals:vals,exp:exp,fix:fix};
}

/* ---------- scoring ---------- */
function daysIn(from,to){
  const s=pd(S.start),t=today();const a=from<s?s:from;const b=to>t?t:to;const out=[];
  for(let d=a;d<=b;d=addDays(d,1))out.push(d);return out;
}
function stats(pid,from,to,areaFilter,full){
  const days=daysIn(from,to),nd=days.length,log=L[pid]||{};
  /* Default = on pace: what was due on the days that are finished (today is left out until it is over, unless it is the only day). full=true = the whole week or month is the goal. */
  const t0=today(),s0=pd(S.start),a0=from<s0?s0:from;
  const ed=(full&&to>t0)?Math.max(0,Math.round((to-a0)/864e5)+1):((nd>1&&ds(days[nd-1])===ds(t0))?nd-1:nd);
  let exp=0,cred=0;const byHabit={},byArea={};
  habitsFor(pid).forEach(h=>{
    if(areaFilter&&h.area!==areaFilter)return;
    let done=0;(full?days:days.slice(0,ed)).forEach(d=>{if((log[ds(d)]||[]).indexOf(h.id)>=0)done++});
    const e=(h.per==='month'?h.target*ed/30.4:h.target*ed/7),c=Math.min(done,e);
    byHabit[h.id]={done:done,exp:e,cred:c};exp+=e;cred+=c;
    const a=byArea[h.area]||(byArea[h.area]={exp:0,cred:0,done:0,sr:0,n:0});a.exp+=e;a.cred+=c;a.done+=done;if(e>0){a.sr+=Math.min(1,done/e);a.n++}
  });
  /* every habit counts the same: an area is the plain average of its habits (each = done / due, at most 100%), the overall score is the plain average of the areas */
  const av=[];Object.keys(byArea).forEach(k=>{const a=byArea[k];a.eq=a.n>0?a.sr/a.n:null;if(a.eq!=null)av.push(a.eq)});
  return {nd:nd,exp:exp,cred:cred,pct:av.length?av.reduce((x,y)=>x+y,0)/av.length:null,ptick:exp>0?cred/exp:null,byHabit:byHabit,byArea:byArea};
}
function statsMulti(pids,from,to){
  let exp=0,cred=0,nd=0;const ps=[];
  pids.forEach(p=>{const s=stats(p,from,to);exp+=s.exp;cred+=s.cred;nd=Math.max(nd,s.nd);if(s.pct!=null)ps.push(s.pct)});
  return {exp:exp,cred:cred,nd:nd,pct:ps.length?ps.reduce((x,y)=>x+y,0)/ps.length:null};
}
function dayPct(pid,d){
  let hs=habitsFor(pid);if(!hs.length)return null;
  const dl=hs.filter(isDaily);if(dl.length)hs=dl;
  const a=(L[pid]||{})[ds(d)]||[];let n=0;hs.forEach(h=>{if(a.indexOf(h.id)>=0)n++});return n/hs.length;
}
function streaks(pid){
  const t=today(),s=pd(S.start),arr=[];
  for(let d=s;d<=t;d=addDays(d,1)){const v=dayPct(pid,d);arr.push(v!=null&&v>=0.6)}
  const runEnd=a=>{let n=0;for(let i=a.length-1;i>=0&&a[i];i--)n++;return n};
  let best=0,run=0;arr.forEach(v=>{run=v?run+1:0;if(run>best)best=run});
  const cur=arr.length&&arr[arr.length-1]?runEnd(arr):runEnd(arr.slice(0,-1));
  return {cur:cur,best:best};
}
function fullDays(pid,from,to){let n=0;daysIn(from,to).forEach(d=>{if(dayPct(pid,d)===1)n++});return n}
function checkIns(pid,from,to){
  let n=0;const log=L[pid]||{};const ids=habitsFor(pid).map(h=>h.id);
  daysIn(from,to).forEach(d=>{(log[ds(d)]||[]).forEach(x=>{if(ids.indexOf(x)>=0)n++})});return n;
}
function weekSeries(pids,n){const o=[];for(let i=n-1;i>=0;i--){const r=P.wk(-i);const s=statsMulti(pids,r[0],r[1]);o.push({a:r[0],pct:s.pct})}return o}
function monthSeries(pids,n){const o=[];for(let i=n-1;i>=0;i--){const r=P.mo(-i);const s=statsMulti(pids,r[0],r[1]);o.push({a:r[0],pct:s.pct})}return o}
function zone(p){if(p==null)return 'No data yet';if(p<.5)return 'Building momentum';if(p<.8)return 'Steady';return 'Thriving'}
function improvement(pids){
  const s=pd(S.start),t=today();let n=0;for(let d=s;d<=t;d=addDays(d,1))n++;
  if(n<56)return null;
  const a=statsMulti(pids,s,addDays(s,27)),b=statsMulti(pids,addDays(t,-27),t);
  return (a.pct==null||b.pct==null)?null:{from:a.pct,to:b.pct};
}
function impact(pid,from,to,area){
  const days=daysIn(from,to),nd=days.length,log=L[pid]||{};
  const o={nd:nd,exMin:0,pages:0,tafsirPages:0,studyMin:0,readPages:0,connMin:0,connDays:0,saved:0,practice:0,checks:0,
    glasses:0,waterDays:0,underDays:0,spendTotal:0,spendDays:0,spendUnder:0,spendLimit:0,wFirst:null,wLast:null,wN:0,steps:0,
    sweetN:0,sweetFree:0,sweetOver:0,sweetLogged:0,
    jobMin:0,jobDays:0,bizMin:0,bizDays:0,orders:0,capGoal:0,outputs:0,tags:{}};
  ALLH(pid).forEach(h=>{
    if(area&&h.area!==area)return;
    const rp=repOf(h,pid);
    if(h.type==='cap'){days.forEach(d=>{o.orders+=Number(getVal(rp,ds(d),h.id))||0});o.capGoal=h.goal;return}
    let done=0;days.forEach(d=>{if((log[ds(d)]||[]).indexOf(h.id)>=0)done++});
    const amt=Number(h.amount)||0;
    switch(h.kind){
      case 'exercise':o.exMin+=done*amt;break;
      case 'quran':o.pages+=done*amt;break;
      case 'tafsir':o.tafsirPages+=done*amt;break;
      case 'study':o.studyMin+=done*amt;break;
      case 'reading':o.readPages+=done*amt;break;
      case 'connection':o.connMin+=done*amt;o.connDays+=done;break;
      case 'savings':o.saved+=done*amt;break;
      case 'practice':o.practice+=done;break;
      case 'jobhunt':o.jobMin+=done*amt;o.jobDays+=done;break;
      case 'bizfocus':o.bizMin+=done*amt;o.bizDays+=done;break;
      case 'water':days.forEach(d=>{const v=Number(getVal(rp,ds(d),h.id))||0;o.glasses+=v;if(h.goal>0&&v>=h.goal)o.waterDays++});break;
      case 'sweets':days.forEach(d=>{const v=getVal(rp,ds(d),h.id);if(v!=null&&typeof v!=='object'){const n=Number(v)||0;o.sweetLogged++;o.sweetN+=n;if(n===0)o.sweetFree++;if(n>(Number(h.goal)||0))o.sweetOver++}});break;
      case 'spend':{o.spendLimit=spLim(ds(to));const arr=[];days.forEach(d=>{const v=getVal(rp,ds(d),h.id);if(v!=null&&typeof v!=='object')arr.push({k:ds(d),v:Number(v)})});
        /* today is still running: leave it out of the average while there are finished days */
        if(arr.length>1&&arr[arr.length-1].k===ds(today()))arr.pop();
        arr.forEach(x=>{o.spendTotal+=x.v;o.spendDays++;if(x.v<=spLim(x.k))o.spendUnder++});break}
      case 'underlimit':o.underDays+=done;break;
      case 'weight':days.forEach(d=>{const v=getVal(rp,ds(d),h.id);if(v!=null&&typeof v!=='object'){if(o.wFirst==null)o.wFirst=Number(v);o.wLast=Number(v);o.wN++}});break;
      case 'steps':days.forEach(d=>{o.steps+=Number(getVal(rp,ds(d),h.id))||0});break;
      default:o.checks+=done;
    }
    if(h.type==='tag'){o.outputs+=done;days.forEach(d=>{const v=getVal(rp,ds(d),h.id);if(v&&typeof v==='object'&&v.t)o.tags[v.t]=(o.tags[v.t]||0)+1})}
  });
  const weeks=nd/7;
  o.exWeek=weeks>0?o.exMin/weeks:0;
  o.connWeek=weeks>0?o.connMin/60/weeks:0;
  o.ordersWeek=weeks>0?o.orders/weeks:0;
  return o;
}
function kindsIn(pids,area){
  const set={};
  S.habits.forEach(h=>{
    if(h.area===area&&pids.some(p=>h.who.indexOf(p)>=0)){
      set[h.kind]=1;
      if(h.type==='cap')set._cap=1;
      if(h.type==='tag')set._tag=1;
    }
  });
  return set;
}
function metricRows(pids,kinds,area){
  const RGM=perRange().r,per=pids.map(p=>({pid:p,all:impact(p,RGM[0],RGM[1],area),life:impact(p,pd(S.start),today(),area)}));
  const rows=[];
  const R=(label,fn,note)=>rows.push({label:label,note:note||'',vals:per.map(x=>fn(x))});
  const useMonth=perRange().k!=='life';
  const pick=x=>useMonth?x.all:x.life;
  const per_lbl={lweek:'last week',week:'this week',month:'this month',lmonth:'last month'}[perRange().k]||'since you started';
  const cur=esc(S.currency);
  if(kinds.exercise){
    R('Exercise ('+per_lbl+')',x=>nf(pick(x).exMin)+'<small>min</small>');
    R('Average per week',x=>nf(pick(x).exWeek)+'<small>of 150 min</small>','WHO minimum for adults');
    R('Energy used (estimate)',x=>{const w=Number(person(x.pid).weight);return w?nf(5*w*pick(x).exMin/60)+'<small>kcal</small>':'<small>add weight in Setup</small>'},'5 METs × body weight × hours');
    R('Research band at this pace',x=>{
      const m=pick(x).exWeek,r=m/150;
      if(m<=0)return '<small>no activity yet</small>';
      return r<1?'~20%<small>lower risk, below minimum</small>':r<2?'~31%<small>lower risk, 1–2× minimum</small>':r<3?'~37%<small>lower risk, 2–3× minimum</small>':'~39%<small>lower risk, 3×+ minimum</small>';
    },'Group-level association from the study below, assuming moderate effort');
  }
  if(kinds.water){
    R('Water ('+per_lbl+')',x=>nf(pick(x).glasses)+'<small>glasses</small>');
    R('Days at the daily goal',x=>nf(pick(x).waterDays)+'<small>days</small>');
    R('Roughly in litres',x=>nf1(pick(x).glasses*0.25)+'<small>litres</small>','A glass is taken as 250 ml');
  }
  if(kinds.sweets){
    R('Sweet portions ('+per_lbl+')',x=>nf(pick(x).sweetN)+'<small>portions</small>');
    R('Average on logged days',x=>{const p=pick(x);return p.sweetLogged?nf1(p.sweetN/p.sweetLogged)+'<small>a day</small>':'<small>nothing logged yet</small>'});
    R('Sweet-free days',x=>nf(pick(x).sweetFree)+'<small>days</small>');
    R('Days with sweets',x=>nf(pick(x).sweetOver)+'<small>days</small>');
  }
  if(kinds.weight){
    R('Latest weight',x=>pick(x).wLast==null?'–':nf1(pick(x).wLast)+'<small>kg</small>');
    R('Change in the period',x=>{const p=pick(x);if(p.wN<2)return '<small>needs two weigh-ins</small>';const d=Math.round((p.wLast-p.wFirst)*10)/10;return (d>0?'+':'')+d+'<small>kg</small>'});
    R('Weigh-ins logged',x=>nf(pick(x).wN)+'<small>times</small>');
  }
  if(kinds.steps)R('Steps ('+per_lbl+')',x=>nf(pick(x).steps)+'<small>steps</small>');
  if(kinds.quran){
    R('Qur’an pages ('+per_lbl+')',x=>nf(pick(x).pages)+'<small>pages</small>');
    R('Full recitations completed',x=>Math.floor(x.life.pages/604)+'<small>of 604 pages each</small>','Standard Madinah mushaf, all time');
    R('Progress to next completion',x=>Math.round((x.life.pages%604)/604*100)+'%');
    R('Days to finish at 28-day pace',x=>{
      const r=impact(x.pid,addDays(today(),-27),today(),area),ppd=r.nd>0?r.pages/r.nd:0;
      return ppd>0?nf(Math.ceil((604-(x.life.pages%604))/ppd))+'<small>days</small>':'–';
    });
  }
  if(kinds.tafsir)R('Tafsir pages ('+per_lbl+')',x=>nf(pick(x).tafsirPages)+'<small>pages</small>');
  if(kinds.study)R('Study time ('+per_lbl+')',x=>nf1(pick(x).studyMin/60)+'<small>hours</small>');
  if(kinds.practice)R('Days of daily practice ('+per_lbl+')',x=>nf(pick(x).practice)+'<small>check-ins</small>');
  if(kinds.reading){
    R('Pages read ('+per_lbl+')',x=>nf(pick(x).readPages)+'<small>pages</small>');
    R('Books at 300 pages each',x=>nf1(pick(x).readPages/300)+'<small>books</small>');
    R('Books per year at this pace',x=>{const p=pick(x);return p.nd>0?nf1(p.readPages/p.nd*365/300)+'<small>books</small>':'–'});
  }
  if(kinds.connection){
    R('Days together ('+per_lbl+')',x=>nf(pick(x).connDays)+'<small>days</small>');
    if(per.some(x=>pick(x).connMin>0)){
      R('Time together ('+per_lbl+')',x=>nf1(pick(x).connMin/60)+'<small>hours</small>');
      R('Average per week',x=>nf1(pick(x).connWeek)+'<small>hours</small>');
    }
  }
  if(kinds.jobhunt){
    R('Job and income hunt ('+per_lbl+')',x=>nf1(pick(x).jobMin/60)+'<small>hours</small>');
    R('Days done',x=>nf(pick(x).jobDays)+'<small>days</small>');
  }
  if(kinds.bizfocus){
    R('Business focus ('+per_lbl+')',x=>nf1(pick(x).bizMin/60)+'<small>hours</small>');
    R('Days done',x=>nf(pick(x).bizDays)+'<small>days</small>');
  }
  if(kinds._tag){
    R('Weekly outputs ('+per_lbl+')',x=>nf(pick(x).outputs)+'<small>outputs</small>');
    Object.keys(TAGS).forEach(k=>{if(per.some(x=>(pick(x).tags[k]||0)>0))R(tagName(k),x=>nf(pick(x).tags[k]||0)+'<small>logged</small>')});
  }
  if(kinds.spend){
    R('Spent ('+per_lbl+')',x=>nf(pick(x).spendTotal)+'<small>'+cur+'</small>');
    R('Average a day',x=>{const q=spendStat(perRange().r[0],perRange().r[1]);return q&&q.avg!=null?nf(q.avg)+'<small>'+cur+'</small>':'–'},'Daily limit: '+nf(spLim(ds(today())))+' '+S.currency);
    R('Days not recorded',x=>{const q=spendStat(perRange().r[0],perRange().r[1]);return q?(q.miss>0?'<b style="color:#9A5B00">'+q.miss+'</b>':'0')+'<small>left out of the average</small>':'–'});
    R('Days within the limit',x=>{const p=pick(x);return nf(p.spendUnder)+'<small>of '+p.spendDays+' logged days</small>'});
  }
  if(kinds._cap){
    R('Delivery orders ('+per_lbl+')',x=>nf(pick(x).orders)+'<small>orders</small>');
    R('Average per week',x=>nf1(pick(x).ordersWeek)+'<small>cap '+pick(x).capGoal+'</small>');
  }
  if(kinds.savings){
    const rate=Number(S.rate)||0,i=rate/100/12;
    R('Set aside ('+per_lbl+')',x=>nf(pick(x).saved)+'<small>'+cur+'</small>');
    R('Set aside since you started',x=>nf(x.life.saved)+'<small>'+cur+'</small>');
    R('Value in 12 months at this pace',x=>{
      const nd=x.life.nd,perMonth=nd>0?x.life.saved/(nd/30.4):0;
      const fv=i>0?perMonth*((Math.pow(1+i,12)-1)/i):perMonth*12;
      return nf(fv)+'<small>'+cur+'</small>';
    },'Monthly pace since start, '+rate+'% a year (your assumption)');
  }
  if(kinds.general)R('Simple checks ('+per_lbl+')',x=>nf(pick(x).checks)+'<small>done</small>');
  return {rows:rows,pids:pids};
}
function adviceBlock(areaId){
  const ic=CONTENT.impact&&CONTENT.impact[areaId];if(!ic)return '';
  const c=ic[LG()]||ic.en,ar=ui.lang==='ar';
  const parts=[['Where to improve','أين تتحسن','improve'],['Guidance','إرشاد','guidance'],['What consistency changes','ماذا يغيّر الالتزام','consistency']];
  return '<div class="advice">'+parts.map(x=>'<div class="adv"><h3>'+(ar?x[1]:x[0])+'</h3><p lang="'+LG()+'" dir="'+DIR()+'">'+esc(fillNames(c[x[2]]))+'</p></div>').join('')
    +(ic.sources&&ic.sources.length?'<div class="src">Sources: '+esc(ic.sources.join(' · '))+'</div>':'')+'</div>';
}


/* ---------- deep profile ---------- */
const PROFILE_Q=[{"id":"ab","title":"About you","intro":"Start here. Tap what fits. Under any question you can add a note in your own words, but you never have to.","qs":[{"id":"ab1","t":"C","q":"Your age range.","o":["18 to 24","25 to 29","30 to 34","35 to 39","40 to 44","45 to 49","50 to 59","60 or more"]},{"id":"ab2","t":"C","q":"Where do you live now?","o":["Big city","Smaller city or town","Suburb","Village or countryside"]},{"id":"ab3","t":"C","q":"How long have you lived in your current city?","o":["Less than a year","1 to 3 years","3 to 10 years","More than 10 years","All my life"]},{"id":"ab4","t":"M","q":"Which languages do you use every day?","o":["Arabic","English","French","Spanish","German","Turkish","Urdu","Hindi","Other"]},{"id":"ab5","t":"C","q":"Your highest education so far.","o":["School","Diploma or trade","Bachelor’s","Master’s","Doctorate","Self-taught"]},{"id":"ab6","t":"C","q":"Who do you live with?","o":["Spouse only","Spouse and children","Spouse, children and extended family","My parents or family","Alone or with flatmates"]},{"id":"ab7","t":"C","q":"Where do you stand among your siblings?","o":["Eldest","Middle","Youngest","Only child"]},{"id":"ab8","t":"C","q":"Which describes your life stage best?","o":["Building my career","Raising young children","Raising teenagers","Settled and established","Rebuilding","In a big transition or move"]},{"id":"ab9","t":"M","q":"Pick the words a close friend would use for you (up to 5).","o":["Responsible","Calm","Funny","Ambitious","Loyal","Curious","Stubborn","Generous","Reserved","Creative","Disciplined","Sensitive","Practical","Adventurous","Patient","Impulsive","Perfectionist","Easygoing"]},{"id":"ab10","t":"M","q":"What shaped you most growing up?","o":["A strict home","A warm, close family","Financial hardship","A comfortable life","Moving around","A religious home","Losing a parent early","A big family","Becoming independent early"]},{"id":"ab11","t":"M","q":"What are you most proud of so far?","o":["My faith","My family","My career","My education","My health","Helping others","My character","Overcoming hardship","A business I built","Raising my children"]},{"id":"ab12","t":"M","q":"What do the people closest to you say you should work on?","o":["Patience","Time management","Listening","Health","Spending","Phone use","Prayer consistency","Being present","Anger","Procrastination","Organisation","Communication","Nothing much"]},{"id":"ab13","t":"M","q":"What do you want to be remembered for?","o":["Faith and character","A loving spouse and parent","Generosity","Knowledge","Achievement","Kindness","A lasting legacy","Strength in hard times"]},{"id":"ab14","t":"R","q":"Overall, how is life going right now?","o":["Struggling","Thriving"]},{"id":"ab15","t":"C","q":"What do you do for work, in one word?","o":["Employee","Manager or leader","Professional (doctor, engineer, etc.)","Business owner","Freelancer","Student","At home","Between jobs","Retired"]}]},{"id":"vl","title":"Values and character","intro":"What you stand for. The coach uses this to give advice that fits who you are, not who it assumes you are.","qs":[{"id":"vl1","t":"M","q":"Your top values (up to 5).","o":["Faith","Family","Honesty","Health","Freedom","Security","Growth","Service","Excellence","Respect","Loyalty","Peace","Adventure","Wealth","Knowledge","Justice","Humility","Creativity","Reputation"]},{"id":"vl2","t":"M","q":"What will you not compromise on?","o":["Prayer","Family time","Honesty","Health","Halal income","Dignity","Sleep","My children’s education","Privacy","Integrity at work"]},{"id":"vl3","t":"M","q":"What does success mean to you?","o":["Pleasing Allah","A happy family","Financial security","Impact on others","Achievement","Peace of mind","Knowledge"]},{"id":"vl4","t":"C","q":"When honesty and kindness pull apart, I…","o":["Say the truth even if it hurts","Say it gently","Depends on the person","Avoid the topic"]},{"id":"vl5","t":"C","q":"On rules and flexibility, I…","o":["Follow rules closely","Mostly follow rules","Mostly stay flexible","Judge each situation"]},{"id":"vl6","t":"C","q":"When I decide something important, I trust most…","o":["My gut","Facts and numbers","People I trust","Religious guidance","A list of pros and cons","Time and sleeping on it"]},{"id":"vl7","t":"C","q":"If I could have more of one thing…","o":["More money","More time","More energy","More peace of mind"]},{"id":"vl8","t":"C","q":"About risk, I prefer…","o":["Safe and stable","Calculated risks","Big bets for big rewards"]},{"id":"vl9","t":"R","q":"How much do other people’s opinions affect you?","o":["Not at all","Very much"]},{"id":"vl10","t":"R","q":"I keep my promises even when it costs me.","o":["Rarely","Always"]},{"id":"vl11","t":"R","q":"I forgive easily.","o":["Hard for me","Easy for me"]},{"id":"vl12","t":"M","q":"Which qualities do you admire most in others?","o":["Sincerity","Patience","Courage","Generosity","Humility","Discipline","Wisdom","Kindness","Hard work","Calm under pressure"]}]},{"id":"ms","title":"Your mission and your why","intro":"This is the heart of it. The coach uses these answers to connect every habit to what matters to you.","qs":[{"id":"ms1","t":"M","q":"What best describes your mission in life?","o":["Serve Allah and live by my faith","Raise righteous children","Build a strong family","Build a career or business with impact","Spread knowledge","Serve my community","Be free enough to give","Be healthy and strong","I am still searching"]},{"id":"ms2","t":"M","q":"Your most important goals for the next 12 months (up to 3).","o":["Strengthen my prayers","Read or memorise the Qur’an","Improve my fitness","Lose weight","Build muscle","Save money","Clear debt","Increase income","Start a business","Learn a skill","Improve my marriage","Be a better parent","More family time","Use my phone less","Sleep better","Give more","Buy a home","Hajj or Umrah","Travel","Reduce stress"]},{"id":"ms3","t":"M","q":"Where do you most want things to change in 5 years?","o":["Faith","Health","Family","Work","Money","Home","Knowledge","Community"]},{"id":"ms4","t":"M","q":"In 10 years you are proud of how you lived. What did you do consistently?","o":["Prayed on time","Stayed close to the Qur’an","Kept my body strong","Was present with my family","Saved and gave","Kept learning","Built something lasting","Served others","Stayed honest","Stayed patient"]},{"id":"ms5","t":"M","q":"Why did you start this habit tracker?","o":["Build consistency","Get closer to Allah","Improve my health","Hold each other accountable","Manage money","Be a better parent","Use my time better","Curiosity"]},{"id":"ms6","t":"C","q":"If you fixed one thing, everything else would get easier. Which?","o":["Sleep","Money","Time management","Consistency","Stress","Health","Phone habits","Tension at home","Work","Clarity about direction"]},{"id":"ms7","t":"M","q":"What are you afraid will happen if nothing changes?","o":["My health declines","Money trouble","Drifting from Allah","Losing closeness with my spouse","My children growing up without me","Wasting my years","Staying stuck","Regret"]},{"id":"ms8","t":"M","q":"What do you want to stop doing or being?","o":["Procrastinating","Wasting time on my phone","Overspending","Eating junk and sweets","Staying up late","Getting angry","Complaining","Comparing myself","People-pleasing","Missing prayers","Overthinking"]},{"id":"ms9","t":"R","q":"How clear is your direction in life right now?","o":["Unclear","Very clear"]},{"id":"ms10","t":"R","q":"How ready are you to change things now?","o":["Not very","Fully ready"]},{"id":"ms11","t":"C","q":"When do you expect to feel a real difference?","o":["In 1 month","In 3 months","In 6 months","In a year"]},{"id":"ms12","t":"C","q":"How do you plan?","o":["Detailed plans","A rough direction","Day by day","I do not plan"]}]},{"id":"fu","title":"Future and legacy","intro":"Bigger plans, so the coach can think beyond this month.","qs":[{"id":"fu1","t":"M","q":"Big projects for the next 3 years.","o":["Buy a home","Start a business","Hajj","Further study","Move city or country","Build savings","A fitness transformation","Memorise Qur’an","Write something","Change career","Grow the family"]},{"id":"fu2","t":"M","q":"Where might you live in the future?","o":["Same city","Another city","Another country","Near family","Not sure"]},{"id":"fu3","t":"M","q":"What legacy do you want to leave?","o":["Well-raised children","Ongoing charity","Shared knowledge","A business","A good name","A strong family bond","Something I wrote or built"]},{"id":"fu4","t":"M","q":"Who depends on you financially?","o":["My spouse","My children","My parents","My siblings","Other relatives","Nobody"]},{"id":"fu5","t":"C","q":"Do you have a plan for later in life?","o":["Clear plan","Rough idea","Not yet"]},{"id":"fu6","t":"C","q":"Is a big decision waiting for you?","o":["Yes, about work","Yes, about home or moving","Yes, about family","Yes, about health","No"]}]},{"id":"ps","title":"Personality and psychology","intro":"So the coach talks to the real you: what drives you, what shuts you down, and how you bounce back.","qs":[{"id":"ps1","t":"R","q":"After a long day with people, I feel…","o":["Drained, I need to be alone","Energised"]},{"id":"ps2","t":"C","q":"Under pressure I usually…","o":["Take charge and push harder","Withdraw and go quiet","Get anxious and overthink","Get irritable or angry","Freeze and delay","Distract myself (phone, food, sleep)"]},{"id":"ps3","t":"M","q":"What motivates you most?","o":["Pleasing Allah","Providing for my family","Proving myself","Being useful to others","Recognition and respect","Freedom and independence","Learning and growth","Seeing progress","Competition","Helping my spouse"]},{"id":"ps4","t":"M","q":"What discourages or shuts you down?","o":["Being criticised","Feeling behind other people","A streak breaking","Boring routine","Long overwhelming lists","Feeling unseen","Conflict at home","Money pressure","Tiredness","Feeling guilty"]},{"id":"ps5","t":"C","q":"I respond best to a coach who is…","o":["Warmly encouraging","Firm and direct","Logical, with numbers and evidence","Full of stories and examples","Faith-based, with Qur’an and hadith","A mix, depending on the day"]},{"id":"ps6","t":"C","q":"When I miss a day or two of a habit, I usually…","o":["Pick it up the next day","Feel guilty and avoid the app","Think “I have ruined it” and quit","Do not notice for a while","Get frustrated with myself"]},{"id":"ps7","t":"R","q":"I am a perfectionist.","o":["Not at all","Very much"]},{"id":"ps8","t":"R","q":"I put things off until the last minute.","o":["Never","Always"]},{"id":"ps9","t":"R","q":"I finish what I start.","o":["Rarely","Almost always"]},{"id":"ps10","t":"M","q":"When I fail or fall behind, I tell myself…","o":["“I will try again tomorrow”","“I am useless”","“I always do this”","“It is not that important”","“Next time I will do better”","“Allah knows my effort”","“Everyone else is doing better”","“I need to be stricter”"]},{"id":"ps11","t":"M","q":"Your strengths (up to 4).","o":["Reliable","Hard-working","Patient","Creative","A good listener","A natural leader","A problem-solver","Generous","Calm in a crisis","Organised","Disciplined","Learns fast","Funny","Gives wise advice","Persistent","Empathetic"]},{"id":"ps12","t":"M","q":"Your weak spots, honestly (up to 4).","o":["Procrastination","Impatience","Overthinking","Temper","Disorganisation","Inconsistency","Overspending","Perfectionism","Avoiding conflict","Phone habits","Sweet tooth","Laziness when tired","Saying yes too much","Pride","Not listening","Self-doubt"]},{"id":"ps13","t":"M","q":"Think of a habit you kept for months. What made it possible?","o":["A clear time of day","My spouse doing it too","It was small and simple","Seeing my streak","Someone holding me accountable","A deep meaning behind it","A reward","Tracking it","A group","A reminder"]},{"id":"ps14","t":"M","q":"Think of one you dropped. What happened?","o":["It was too big","Life got busy","Travel or illness","Nobody checked on me","I lost interest","I missed days and quit","Stress","It was not important enough","My phone took over","My routine fell apart"]},{"id":"ps15","t":"C","q":"When is your willpower strongest?","o":["Early morning","Late morning","Afternoon","Evening","Late night"]},{"id":"ps16","t":"C","q":"When is your willpower weakest?","o":["Early morning","Late morning","Afternoon","Evening","Late night"]},{"id":"ps17","t":"M","q":"Which of these show up often? Optional, skip if you prefer.","o":["Worry or anxiety","Anger or irritability","Low mood or sadness","Loneliness","Shame or guilt","Restlessness","Feeling numb or unmotivated","Overwhelm","None of these"]},{"id":"ps18","t":"C","q":"Should the coach be extra gentle about mood and stress?","o":["Yes, please","Fine either way","No, be direct"]},{"id":"ps19","t":"C","q":"I do better when I work…","o":["Alone","With my spouse","In a group","It depends"]},{"id":"ps20","t":"M","q":"What rewards work for you?","o":["Praise","A small treat","Seeing my progress","Quiet satisfaction","Spiritual reward","Time off","Sharing the win with someone"]},{"id":"ps21","t":"C","q":"Deadlines…","o":["Help me","Stress me","I like both flexibility and deadlines"]},{"id":"ps22","t":"R","q":"I like routine and sameness.","o":["I need variety","I love routine"]},{"id":"ps23","t":"C","q":"When someone criticises me, I…","o":["Take it on board","Get defensive, then reflect","Feel hurt","Brush it off","Argue back"]},{"id":"ps24","t":"C","q":"I like feedback…","o":["Every day, in small doses","Once a week","Only when I am off track"]}]},{"id":"em","title":"Emotions and stress","intro":"How you feel and cope, so the coach gives support that actually helps.","qs":[{"id":"em1","t":"M","q":"When I am upset I…","o":["Talk it out","Pray","Go quiet","Walk or exercise","Eat","Scroll my phone","Sleep","Work harder"]},{"id":"em2","t":"R","q":"How stressed have you been this past month?","o":["Calm","Very stressed"]},{"id":"em3","t":"M","q":"Main sources of stress.","o":["Money","Work","Marriage","Children","Health","Family duties","Time pressure","The future","Loneliness","Housing","Faith struggles"]},{"id":"em4","t":"M","q":"What calms you?","o":["Prayer and dhikr","Qur’an","A walk outdoors","Quiet time alone","Time with family","Exercise","Nasheeds or music","Reading","Cooking","Sleep","Tea or coffee","Talking to a friend"]},{"id":"em5","t":"C","q":"When I struggle, I turn first to…","o":["My spouse","A parent","A sibling","A friend","A teacher or imam","A counsellor","Nobody"]},{"id":"em6","t":"R","q":"I ask for help easily.","o":["Hard","Easy"]},{"id":"em7","t":"R","q":"I lose my temper.","o":["Rarely","Often"]},{"id":"em8","t":"R","q":"I worry about things I cannot control.","o":["Rarely","Often"]},{"id":"em9","t":"R","q":"I feel good about myself.","o":["Rarely","Mostly"]},{"id":"em10","t":"R","q":"I recover quickly from setbacks.","o":["Slowly","Quickly"]},{"id":"em11","t":"C","q":"How often do you feel overwhelmed?","o":["Rarely","Once a month","Weekly","Most days"]}]},{"id":"cm","title":"Communication and decisions","intro":"How you like to be spoken to and how you decide.","qs":[{"id":"cm1","t":"C","q":"Hard feedback works best…","o":["Private and direct","Gentle, with context","In writing","With examples","With a little humour","After I have time to think"]},{"id":"cm2","t":"C","q":"In a conflict I…","o":["Talk right away","Cool down first","Avoid it","Look for a compromise","Write it out"]},{"id":"cm3","t":"C","q":"I prefer to communicate…","o":["In person","By voice note or call","By text","With short messages","With longer messages"]},{"id":"cm4","t":"R","q":"I express my feelings easily.","o":["Hard","Easy"]},{"id":"cm5","t":"C","q":"When I need space I…","o":["Say so","Withdraw silently","Get irritable","Distract myself"]},{"id":"cm6","t":"C","q":"I make decisions…","o":["Quickly","After a few days","Slowly and with advice","I tend to avoid them"]},{"id":"cm7","t":"R","q":"I think in…","o":["The big picture","Details and numbers"]},{"id":"cm8","t":"C","q":"How should reminders reach you?","o":["App notifications","A morning message","A weekly summary","A reminder from my spouse","No reminders"]}]},{"id":"fa","title":"Faith and spirit","intro":"The coach will connect your habits to your faith the way you want it to.","qs":[{"id":"fa1","t":"C","q":"Your relationship with Allah right now.","o":["Close and steady","Close but inconsistent","Growing","Distant","Searching","Rebuilding after a gap"]},{"id":"fa2","t":"R","q":"How close do you feel to Allah these days?","o":["Distant","Very close"]},{"id":"fa3","t":"M","q":"Which of these do you do consistently today?","o":["Five daily prayers on time","Fajr on time","Sunnah prayers","Night prayer","Daily Qur’an","Morning and evening azkar","Dua","Voluntary fasts","Charity"]},{"id":"fa4","t":"M","q":"What is hardest to keep consistent?","o":["Fajr","Praying all five on time","Daily Qur’an","Sunnah prayers","Night prayer","Azkar","Voluntary fasting","Charity","Focus in prayer","Dua"]},{"id":"fa5","t":"M","q":"What brings you closest to Allah?","o":["The mosque","Quiet nights alone","Qur’an recitation","Dhikr","Praying in congregation","Nature","Beneficial knowledge","Charity","Worship with family","Friends who remind me","Umrah or Hajj"]},{"id":"fa6","t":"M","q":"Your goals with the Qur’an.","o":["Read daily","Finish a full reading","Memorise","Understand the meaning","Reflect deeply","Improve my recitation","Learn Arabic","Teach my family"]},{"id":"fa7","t":"C","q":"By when would you like to reach it?","o":["This Ramadan","In 3 months","In 6 months","In a year","In 2 years or more","No fixed date"]},{"id":"fa8","t":"C","q":"How much Qur’an do you read on a normal day?","o":["None","A few verses","About a page","2 to 5 pages","About a juz","More"]},{"id":"fa9","t":"M","q":"What pulls you away from worship?","o":["Tiredness","Phone and social media","Work","Children","Laziness","Late nights","Bad company","Doubt","A busy schedule","Feeling unworthy"]},{"id":"fa10","t":"C","q":"How much should faith appear in your coaching?","o":["A lot: Qur’an and hadith with most advice","Some, now and then","Little, mostly practical","Only when I ask"]},{"id":"fa11","t":"M","q":"Is there a habit you want help turning away from? Optional.","o":["Wasting time on my phone","Harmful content online","Backbiting","Anger","Missing prayers","Smoking","Lying","Other","Prefer not to say"]},{"id":"fa12","t":"M","q":"What inspires you most?","o":["Qur’an and tafsir","Hadith","Lectures by scholars","Islamic books","Podcasts","The life of the Prophet ﷺ","Stories of the companions","Duas"]},{"id":"fa13","t":"C","q":"What kind of faith reminder helps most?","o":["Verses and hadith","Short duas","Stories","Practical tips","Scholars’ words"]},{"id":"fa14","t":"C","q":"How often do you pray at the mosque?","o":["Every day","Fridays only","Sometimes","Rarely","There is none close"]},{"id":"fa15","t":"C","q":"Do you worship together as a family?","o":["Daily","Sometimes","Rarely","Not yet"]},{"id":"fa16","t":"M","q":"What do you want your children to see in your relationship with Allah?","o":["Praying on time","Reading Qur’an","Honesty","Giving charity","Patience","Gratitude","Good character with people","Love for the mosque"]},{"id":"fa17","t":"C","q":"Hajj and Umrah.","o":["Done Hajj","Done Umrah","Planning","A dream for now","Not yet"]},{"id":"fa18","t":"C","q":"Morning and evening azkar.","o":["Both, daily","One of them","Sometimes","Not yet"]},{"id":"fa19","t":"C","q":"Voluntary fasting.","o":["Mondays and Thursdays","White days","Ramadan only","Occasionally","Not yet"]},{"id":"fa20","t":"R","q":"I feel peace when I pray.","o":["Rarely","Always"]},{"id":"fa21","t":"R","q":"How satisfied are you with your religious knowledge?","o":["Not satisfied","Very satisfied"]}]},{"id":"bo","title":"Body and health","intro":"So the coach can talk about your body the way a good trainer and a good friend would.","qs":[{"id":"bo1","t":"M","q":"What do you want for your body in the next year?","o":["Lose weight","Build muscle","More energy","Better sleep","Less pain","More stamina","More flexibility","Eat better","Cut sugar","Feel confident"]},{"id":"bo2","t":"C","q":"How many hours do you usually sleep?","o":["Under 5","5 to 6","6 to 7","7 to 8","More than 8"]},{"id":"bo3","t":"R","q":"Sleep quality.","o":["Poor","Great"]},{"id":"bo4","t":"R","q":"Energy through a normal day.","o":["Low","High"]},{"id":"bo5","t":"C","q":"When is your energy best?","o":["Early morning","Late morning","Afternoon","Evening","Late night"]},{"id":"bo6","t":"M","q":"What have you tried for fitness before?","o":["Gym","Running","Home workouts","Sports","A diet plan","Intermittent fasting","A trainer","Tracking apps","Daily walking","Nothing consistent"]},{"id":"bo7","t":"C","q":"What usually happened?","o":["It worked, then I stopped","I stayed consistent for months","Injuries","I got bored","No time","I never really started"]},{"id":"bo8","t":"M","q":"Which kinds of movement do you enjoy?","o":["Walking","Running","Weights","Swimming","Cycling","Sports with others","Home workouts","Jump rope","Yoga or stretching","Martial arts","None really"]},{"id":"bo9","t":"M","q":"What do you have access to?","o":["A gym","Weights at home","A pool","A park","A jump rope","Stairs","Safe walking paths","Nothing much"]},{"id":"bo10","t":"C","q":"How much time can you give to movement on a normal day?","o":["None","About 10 minutes","About 20 minutes","30 to 45 minutes","An hour or more"]},{"id":"bo11","t":"C","q":"I prefer to exercise…","o":["Alone","With my spouse","In a group","With a trainer"]},{"id":"bo12","t":"C","q":"How many meals do you eat a day?","o":["One","Two","Three","Three plus snacks","Irregular"]},{"id":"bo13","t":"M","q":"How do you eat in a normal week?","o":["Mostly home-cooked","Takeaway often","Skip breakfast","Late dinners","Lots of bread and rice","Sweets daily","Sugary drinks","Fast food","A lot of tea or coffee","Mostly healthy"]},{"id":"bo14","t":"R","q":"I eat for comfort or stress.","o":["Never","Often"]},{"id":"bo15","t":"C","q":"Water per day.","o":["Under 1 litre","1 to 2 litres","2 to 3 litres","More than 3 litres"]},{"id":"bo16","t":"C","q":"Caffeine per day.","o":["None","1 cup","2 to 3 cups","4 or more"]},{"id":"bo17","t":"C","q":"Sweets and sugary snacks.","o":["Rarely","A few times a week","Daily","Several times a day"]},{"id":"bo18","t":"M","q":"Any limits the coach should know about? Optional.","o":["Back pain","Knee or joint pain","Heart","Blood pressure","Diabetes","Asthma","A past injury","None","Prefer not to say"]},{"id":"bo19","t":"C","q":"When was your last health check-up?","o":["Within 6 months","6 to 12 months ago","1 to 2 years ago","More than 2 years ago","Never"]},{"id":"bo20","t":"M","q":"What do you want your body to let you do at 60?","o":["Play with grandchildren","Walk long distances","Stay independent","Travel","Pray standing comfortably","Lift and carry","Stay sharp","Stay free of chronic illness"]},{"id":"bo21","t":"C","q":"How do you feel about weighing yourself?","o":["Motivating","Neutral","Stressful","I avoid it"]},{"id":"bo22","t":"C","q":"How much time do you sit on a normal day?","o":["Under 4 hours","4 to 6 hours","6 to 8 hours","More than 8 hours"]},{"id":"bo23","t":"R","q":"How would you rate your fitness today?","o":["Poor","Excellent"]},{"id":"bo24","t":"C","q":"Smoking or vaping. Optional.","o":["No","Quit","Sometimes","Daily","Prefer not to say"]}]},{"id":"mi","title":"Mind and learning","intro":"","qs":[{"id":"mi1","t":"M","q":"What do you want to learn or master in the next year?","o":["Arabic","Qur’an and tafsir","Islamic knowledge","English","Coding or tech","Business","Money and investing","Writing","Public speaking","Parenting","Health and nutrition","A trade","Design","Another language"]},{"id":"mi2","t":"M","q":"How do you learn best?","o":["Reading","Listening","Watching videos","Doing it myself","Teaching others","Discussion","Taking notes","Structured courses"]},{"id":"mi3","t":"C","q":"How many books do you finish in a year?","o":["None","1 to 3","4 to 12","More than 12"]},{"id":"mi4","t":"M","q":"What do you read or listen to?","o":["Books","Audiobooks","Podcasts","YouTube lectures","Online courses","Articles","The news","Social media"]},{"id":"mi5","t":"C","q":"Hours of phone or screen time a day, roughly.","o":["Under 1","1 to 2","2 to 4","4 to 6","More than 6"]},{"id":"mi6","t":"M","q":"What steals your focus most?","o":["Social media","WhatsApp","News","YouTube","Games","Notifications","Email","Interruptions at home","My own thoughts","Tiredness","Multitasking"]},{"id":"mi7","t":"C","q":"When do you do your deepest thinking or best work?","o":["Early morning","Morning","Midday","Afternoon","Evening","Night"]},{"id":"mi8","t":"R","q":"I read books regularly.","o":["Never","Always"]},{"id":"mi9","t":"M","q":"Which skills would change your income or your work the most?","o":["Sales","Communication","Management","Technical skills","Languages","Finance","Marketing","Negotiation","Writing","Leadership"]},{"id":"mi10","t":"C","q":"How much time can you give to learning each week?","o":["Under 1 hour","1 to 3 hours","3 to 7 hours","More than 7 hours"]},{"id":"mi11","t":"C","q":"What learning format suits you?","o":["Short daily sessions","Weekly blocks","Courses with deadlines","Self-paced"]},{"id":"mi12","t":"R","q":"I enjoy learning new things.","o":["Not much","A lot"]}]},{"id":"wk","title":"Work, money and ambition","intro":"Honest answers here let the coach give advice that fits your real situation. Skip anything you prefer to keep private.","qs":[{"id":"wk1","t":"C","q":"Your work situation right now.","o":["Employed full-time","Employed part-time","Self-employed","Business owner","Between jobs","Student","At home","Retired"]},{"id":"wk2","t":"R","q":"How do you feel about your work?","o":["Unhappy","Fulfilled"]},{"id":"wk3","t":"C","q":"Hours you work per week.","o":["Under 20","20 to 40","40 to 50","50 to 60","More than 60"]},{"id":"wk4","t":"C","q":"Where do you work?","o":["On site","From home","A mix","It varies"]},{"id":"wk5","t":"C","q":"Income stability.","o":["Stable","Varies a lot","Uncertain","Growing"]},{"id":"wk6","t":"M","q":"Your plan for the next 3 months.","o":["Ask for a raise","Find a new job","Add side income","Grow my business","Cut costs","Build skills","Save","Clear debt","No change needed"]},{"id":"wk7","t":"R","q":"How anxious do you feel about money?","o":["Calm","Very anxious"]},{"id":"wk8","t":"C","q":"What does “enough” look like for your family?","o":["Covering needs","Living comfortably","Saving and investing","Financial independence","Wealth to give away"]},{"id":"wk9","t":"M","q":"Where does money leak most?","o":["Delivery and eating out","Shopping","Impulse buys","Subscriptions","Groceries","Transport","Gifts and family","The children","Entertainment","Coffee","Online orders","Bills"]},{"id":"wk10","t":"M","q":"What triggers you to spend or order food in?","o":["Stress","Boredom","Tiredness","Sales","Ads on social media","Hunger","Social pressure","Rewarding myself","Convenience","The children’s requests"]},{"id":"wk11","t":"M","q":"Your money goals.","o":["An emergency fund","Clearing debt","Saving for a home","Investing","Giving charity","Hajj","The children’s education","Business capital","Retirement","Supporting family"]},{"id":"wk12","t":"C","q":"How do you feel looking at your spending?","o":["Calm","Guilty","Anxious","I avoid it","Curious"]},{"id":"wk13","t":"M","q":"Which business, job or income ideas excite you?","o":["An online business","Freelancing","A promotion","Real estate","Teaching or content","Opening a shop","Consulting","Tech","A family business"]},{"id":"wk14","t":"M","q":"What is stopping you from acting on them?","o":["Fear of failing","Lack of capital","Lack of time","Lack of skills","Not knowing where to start","Family responsibilities","Perfectionism","Waiting for the right time","Lack of support"]},{"id":"wk15","t":"M","q":"What do you want money to do for your family and your faith?","o":["Charity","Helping parents","Hajj","A home","The children’s education","Travel","Security","A business"]},{"id":"wk16","t":"C","q":"How do you budget?","o":["Detailed","Roughly","I do not","My spouse handles it","We do it together"]},{"id":"wk17","t":"C","q":"How often do you look at your spending?","o":["Daily","Weekly","Monthly","Rarely"]},{"id":"wk18","t":"C","q":"Debts. Optional.","o":["None","Small and manageable","Significant","Prefer not to say"]},{"id":"wk19","t":"C","q":"Saving habit.","o":["Automatic every month","When I can","Rarely","Not yet"]},{"id":"wk20","t":"C","q":"Who handles money in the home?","o":["Me","My spouse","Both of us","Mixed"]},{"id":"wk21","t":"R","q":"Work-life balance.","o":["Poor","Great"]}]},{"id":"mr","title":"Marriage and love","intro":"Be as honest as you like. The app shows only your own answers on your page.","qs":[{"id":"mr1","t":"C","q":"Your marriage today.","o":["Strong and warm","Good but busy","Okay, with some distance","Tense at times","Needs repair"]},{"id":"mr2","t":"R","q":"How connected do you feel to {o} right now?","o":["Distant","Very close"]},{"id":"mr3","t":"M","q":"What makes you feel loved?","o":["Words of affirmation","Quality time","Acts of service","Gifts","Touch and affection","Being listened to","Being trusted","Shared worship"]},{"id":"mr4","t":"M","q":"What does {o} do that you love and want more of?","o":["Listens to me","Encourages me","Prays with me","Helps at home","Shows affection","Makes me laugh","Supports my goals","Takes care of me","Plans for us","Is patient with me"]},{"id":"mr5","t":"M","q":"What do you wish were different, said gently?","o":["More time together","More listening","Less phone","More help at home","More affection","More appreciation","Calmer disagreements","More shared worship","Better money talks","More fun","More private time"]},{"id":"mr6","t":"C","q":"How do disagreements usually go?","o":["A calm talk","Heated, then repair","One of us goes silent","We avoid it","They escalate"]},{"id":"mr7","t":"C","q":"How would you like disagreements to go?","o":["Talk calmly right away","Talk after cooling down","With a trusted mediator","In writing"]},{"id":"mr8","t":"M","q":"What would a great week together look like?","o":["A date night","A family outing","Praying together","Walks","Cooking together","Early nights","Phone-free dinners","A deep talk","A weekend away","Quiet time at home"]},{"id":"mr9","t":"M","q":"What do you want to be better at as a spouse?","o":["Listening","Patience","Affection","Helping at home","Gratitude","Planning time together","Apologising","Using my phone less","Supporting {o}’s goals","Managing anger"]},{"id":"mr10","t":"C","q":"Should the coach remind you about time with {o}?","o":["Yes, often","Sometimes","Rarely"]},{"id":"mr11","t":"M","q":"Which dreams do you share with {o}?","o":["Hajj together","Our own home","Raising our children","A business","Travel","Moving","Learning together","A charity project"]},{"id":"mr12","t":"C","q":"How often do you two go out together?","o":["Weekly","Monthly","Rarely","Almost never"]},{"id":"mr13","t":"C","q":"Time alone together on a normal day.","o":["Under 10 minutes","10 to 30 minutes","30 to 60 minutes","More than an hour"]},{"id":"mr14","t":"R","q":"I feel appreciated by {o}.","o":["Rarely","Often"]},{"id":"mr15","t":"R","q":"I feel heard by {o}.","o":["Rarely","Often"]},{"id":"mr16","t":"C","q":"How often do you tell {o} what you appreciate?","o":["Daily","Weekly","Rarely"]},{"id":"mr17","t":"R","q":"I am satisfied with the affection and closeness between us.","o":["Not satisfied","Very satisfied"]},{"id":"mr18","t":"C","q":"Who usually plans things for the two of you?","o":["Me","{o}","Both of us"]},{"id":"mr19","t":"M","q":"What do you do together for worship?","o":["Pray together","Read Qur’an together","Make dua together","Go to the mosque","Give charity together","Nothing yet"]},{"id":"mr20","t":"C","q":"How do you split the housework?","o":["Fairly","I do more","{o} does more","It needs rebalancing"]}]},{"id":"ch","title":"Children and parenting","intro":"If you have no children yet, you can skip this section.","qs":[{"id":"ch1","t":"C","q":"Do you have children?","o":["Yes","Expecting","Not yet"]},{"id":"ch2","t":"C","q":"How many?","o":["1","2","3","4 or more"]},{"id":"ch3","t":"M","q":"Their ages.","o":["Baby","Toddler","3 to 5","6 to 12","Teenager","Adult"]},{"id":"ch4","t":"S","q":"Names and ages, if you would like to share."},{"id":"ch5","t":"M","q":"What do you most want for them when they grow up?","o":["To be close to Allah","Good character","A good education","Independence","Happiness","To stay close to the family","Health","Useful skills","Kindness"]},{"id":"ch6","t":"C","q":"Time with the children on a normal day.","o":["Under 30 minutes","30 to 60 minutes","1 to 2 hours","2 to 4 hours","More than 4 hours"]},{"id":"ch7","t":"C","q":"How do you feel about that?","o":["It is enough","I want more","I feel guilty","I feel stretched"]},{"id":"ch8","t":"M","q":"What is hardest about parenting right now?","o":["Screen time","Discipline","Fighting between siblings","Tiredness","Sleep","School","Food","Time","Teaching them the deen","Teenage emotions","Agreeing with {o}","Patience"]},{"id":"ch9","t":"M","q":"What values and habits do you want them to see you living?","o":["Honesty","Prayer","Patience","Hard work","Respect","Generosity","Reading","Health","Gratitude","Good manners"]},{"id":"ch10","t":"M","q":"What from your own parents do you want to keep?","o":["Faith","Work ethic","Warmth","Discipline","Generosity","Respect"]},{"id":"ch11","t":"M","q":"What do you want to do differently?","o":["Be less harsh","Show more affection","Talk more openly","Put less pressure","Listen more","Spend more time","Be less strict","Handle money better"]},{"id":"ch12","t":"M","q":"Where could you plug into the children’s routine?","o":["Getting ready in the morning","The school run","Homework","Dinner","Bath and bedtime","Bedtime story and dua","Weekend outings","Prayer time"]},{"id":"ch13","t":"M","q":"Which moments with them do you want more of?","o":["Bedtime stories","Playing","Meals together","Reading","Praying together","Outings","One-on-one time","Learning together"]},{"id":"ch14","t":"C","q":"The children’s screen time.","o":["Low","Moderate","High","A daily struggle"]},{"id":"ch15","t":"C","q":"Your parenting style.","o":["Gentle","Firm","Balanced","Inconsistent","Still finding it"]},{"id":"ch16","t":"R","q":"{o} and I agree on how to raise them.","o":["Rarely","Almost always"]},{"id":"ch17","t":"C","q":"Teaching them Qur’an and the deen.","o":["Daily","Weekly","Sometimes","Mostly at school","Not yet"]}]},{"id":"fm","title":"Family, friends and community","intro":"","qs":[{"id":"fm1","t":"R","q":"How close are you to your parents?","o":["Distant","Very close"]},{"id":"fm2","t":"R","q":"How close are you to your siblings?","o":["Distant","Very close"]},{"id":"fm3","t":"M","q":"Is there anyone you wish you were closer to?","o":["My parents","My siblings","My in-laws","Extended family","Friends","Neighbours","No one in particular"]},{"id":"fm4","t":"C","q":"How many real friends do you have?","o":["None","1 or 2","3 to 5","Many"]},{"id":"fm5","t":"C","q":"How often do you see friends?","o":["Weekly","Monthly","A few times a year","Rarely"]},{"id":"fm6","t":"M","q":"Which responsibilities toward extended family weigh on you?","o":["Money","Caring for parents","Visits","Family events","Mediating disputes","Relatives’ children","None"]},{"id":"fm7","t":"R","q":"How heavy do those responsibilities feel?","o":["Light","Heavy"]},{"id":"fm8","t":"C","q":"How is settling into your new home and city going?","o":["Great","Good","Mixed","Hard","Very hard"]},{"id":"fm9","t":"M","q":"What is hard about it?","o":["Missing family","Missing friends","Work","Language","Cost of living","Loneliness","Weather","Paperwork","Children’s school","Prayer spaces","Food"]},{"id":"fm10","t":"M","q":"What is good about it?","o":["Opportunities","Safety","A fresh start","Services","Community","Weather","Schools","Savings"]},{"id":"fm11","t":"C","q":"Do you give to charity?","o":["Monthly, regularly","Sometimes","Mostly in Ramadan","Rarely"]},{"id":"fm12","t":"M","q":"How would you like to serve others?","o":["With money","Volunteering","Teaching","Feeding people","Visiting the sick","Mentoring","Helping at the mosque","Helping neighbours"]},{"id":"fm13","t":"M","q":"Who inspires you?","o":["The Prophets and companions","Scholars","A parent","A teacher","A successful person","A friend","Historical figures","Athletes","Entrepreneurs"]},{"id":"fm14","t":"C","q":"How involved are you in your community?","o":["Very","Somewhat","A little","Not at all"]}]},{"id":"ht","title":"Heart and inner life","intro":"","qs":[{"id":"ht1","t":"M","q":"What makes you genuinely happy?","o":["Time with family","Prayer","Nature","Achieving something","Helping people","Learning","Good food","Travel","Friends","Quiet","Sports","Laughter"]},{"id":"ht2","t":"M","q":"What drains you?","o":["Conflict","Crowds","Noise","Mess","Long hours","Social media","The news","Unplanned changes","Complaining people","Traffic","Money talk","Too many commitments"]},{"id":"ht3","t":"M","q":"What do you do to rest?","o":["Sleep","Walk","Pray","Time with family","Watch shows","Read","Play games","Scroll","Nap","A hobby","See friends","Nothing really"]},{"id":"ht4","t":"C","q":"Does that rest actually restore you?","o":["Fully","Somewhat","Not really"]},{"id":"ht5","t":"M","q":"What are you grateful for this week?","o":["Health","Family","Faith","Provision","Safety","My spouse","My children","Friends","Opportunities","Knowledge"]},{"id":"ht6","t":"R","q":"How lonely or alone do you feel?","o":["Not at all","Very"]},{"id":"ht7","t":"M","q":"A fear you rarely talk about. Optional.","o":["Failing my family","Losing someone","Illness","Money","Death","Not being good enough","Losing my faith","Being judged","My children’s future","Regret"]},{"id":"ht8","t":"C","q":"Is there someone you need to forgive, or ask forgiveness from?","o":["Yes","Maybe","No"]},{"id":"ht9","t":"M","q":"What do you need to hear right now?","o":["You are doing enough","Keep going","Slow down","Be honest with yourself","Allah is with you","You are not alone","Rest is okay","Start small"]},{"id":"ht10","t":"M","q":"Which hobbies or joys did you drop that you miss?","o":["Sports","Reading","Writing","Drawing","Music or nasheeds","Cooking","Travel","Gaming","Photography","Gardening","Crafts","Seeing friends","None"]},{"id":"ht11","t":"R","q":"I feel joy in ordinary days.","o":["Rarely","Often"]},{"id":"ht12","t":"C","q":"Do you practise gratitude on purpose?","o":["Daily","Weekly","Rarely"]}]},{"id":"dr","title":"Daily rhythm and surroundings","intro":"","qs":[{"id":"dr1","t":"C","q":"Usual wake time.","o":["Before 4:30","4:30 to 5:30","5:30 to 6:30","6:30 to 7:30","7:30 to 9:00","After 9:00"]},{"id":"dr2","t":"C","q":"Usual bedtime.","o":["Before 9:30 pm","9:30 to 10:30","10:30 to 11:30","11:30 to 1:00","After 1:00"]},{"id":"dr3","t":"C","q":"Are you a morning or evening person?","o":["Clearly morning","Somewhat morning","Neither","Somewhat evening","Clearly evening"]},{"id":"dr4","t":"M","q":"When are you free for 20 minutes without interruption?","o":["Early morning","After Fajr","Mid-morning","Lunch break","After Dhuhr","Afternoon","After Asr","After Maghrib","After Isha","Late night"]},{"id":"dr5","t":"M","q":"Which parts of the day are fixed?","o":["Prayers","Work","The school run","Commute","Meals","Children’s bedtime","Classes","Family visits"]},{"id":"dr6","t":"C","q":"Where does your phone sleep?","o":["Next to the bed","In the bedroom","In another room"]},{"id":"dr7","t":"C","q":"What do you do with your phone first thing?","o":["Check it straight away","Within an hour","After prayer","I delay it on purpose"]},{"id":"dr8","t":"C","q":"Screens at night.","o":["Until I fall asleep","Off an hour before bed","Off earlier"]},{"id":"dr9","t":"C","q":"Do you have a wind-down routine?","o":["Yes, consistently","Sometimes","No"]},{"id":"dr10","t":"M","q":"Your ideal morning.","o":["Fajr on time","Qur’an","Exercise","A quiet breakfast","Time with family","No phone for the first hour","Planning my day","Azkar","A walk"]},{"id":"dr11","t":"M","q":"Your ideal evening.","o":["Family dinner","Prayers","Time with the children","A walk","Learning","Quiet with my spouse","An early night","No screens","Reading","Planning tomorrow"]},{"id":"dr12","t":"M","q":"Who or what helps you stay on track?","o":["My spouse","Reminders","A routine","Friends","My faith","A quiet home","Tracking","Clear goals"]},{"id":"dr13","t":"M","q":"Who or what gets in the way?","o":["My phone","Late nights","The children","Work","My mood","A messy home","Social obligations","Travel"]},{"id":"dr14","t":"C","q":"Your weekends.","o":["Planned","Loose","Chaotic"]}]},{"id":"lf","title":"Lifestyle and interests","intro":"Everyday details that help the coach, and any future project, fit your real life.","qs":[{"id":"lf1","t":"M","q":"Hobbies and interests.","o":["Reading","Sports","Cooking","Travel","Gaming","Photography","Writing","Crafts","Gardening","Cars","Tech","Art","Music","The outdoors","Volunteering"]},{"id":"lf2","t":"M","q":"Foods you love.","o":["Egyptian","Levantine","Gulf","Italian","Asian","Indian","Mexican","Grilled","Seafood","Desserts","Salads","Street food"]},{"id":"lf3","t":"C","q":"How do you feel about travel?","o":["I love it","Sometimes","Rarely","I prefer to stay home"]},{"id":"lf4","t":"M","q":"Where would you love to go?","o":["Makkah and Madinah","Europe","Asia","Africa","The Americas","My home country","Nature trips","Road trips"]},{"id":"lf5","t":"C","q":"How comfortable are you with technology?","o":["Very","Comfortable","Basic","I prefer things simple"]},{"id":"lf6","t":"M","q":"Which devices do you use?","o":["iPhone","Android phone","Laptop","Desktop","Tablet","Smartwatch"]},{"id":"lf7","t":"M","q":"Which apps do you use every day?","o":["WhatsApp","YouTube","Instagram","TikTok","X","Facebook","Telegram","LinkedIn","News apps","Games","A Qur’an app","Banking apps"]},{"id":"lf8","t":"C","q":"Notifications on your phone.","o":["On for everything","Essential only","Mostly off"]},{"id":"lf9","t":"C","q":"How do you usually get around?","o":["Own car","Public transport","Walking or cycling","Ride-hailing"]},{"id":"lf10","t":"C","q":"Your home.","o":["I own it","I rent","With family"]},{"id":"lf11","t":"C","q":"Hosting guests.","o":["Often","Sometimes","Rarely"]},{"id":"lf12","t":"C","q":"Pets.","o":["None","I have one","I would like one"]},{"id":"lf13","t":"C","q":"How do you shop?","o":["I plan ahead","On impulse","Mostly online","Mostly in stores","I wait for deals"]},{"id":"lf14","t":"C","q":"A perfect weekend day.","o":["At home","Outings","Visiting family","In nature","Learning or at the mosque","Working on a project"]},{"id":"lf15","t":"C","q":"Do you use a fitness watch or app?","o":["Yes","Phone only","No"]}]},{"id":"hb","title":"Your habits","intro":"Your coach can suggest adding, changing or removing habits. This tells it where to start.","qs":[{"id":"hb1","t":"C","q":"How do you feel about your current habit list?","o":["I love it","Mostly fine","Too long","Too short","Not really me","It needs changes"]},{"id":"hb2","t":"M","q":"Which areas do you enjoy most?","o":["Faith","Body","Mind","Family","Money","Heart"]},{"id":"hb3","t":"M","q":"Which areas do you dread?","o":["Faith","Body","Mind","Family","Money","Heart","None"]},{"id":"hb4","t":"M","q":"Which habits do you wish were on the list?","o":["Sleep","Water","Walking","Gratitude","Dhikr","Reading","Date night","Time with the children","Budget check","Daily planning","Phone limit","Sunnah prayers","Fasting","Charity","Stretching","Skill practice","Journaling"]},{"id":"hb5","t":"M","q":"What should change?","o":["Remove some","Make some easier","Make some harder","Change the times","Add more","Keep as it is"]},{"id":"hb6","t":"C","q":"How many habits can you realistically keep at once?","o":["3 to 5","6 to 10","11 to 15","16 or more"]},{"id":"hb7","t":"M","q":"If you could keep only three habits for a month, which?","o":["Prayer on time","Qur’an","Exercise","Sleep","Water","Reading","Family time","Budget check","Charity","Phone limit"]},{"id":"hb8","t":"C","q":"How big should habits be?","o":["Tiny","Moderate","Challenging"]},{"id":"hb9","t":"C","q":"Streaks make me feel…","o":["Motivated","Pressured","Neutral"]},{"id":"hb10","t":"C","q":"When I fall behind, I would rather…","o":["Lower the target","Start fresh","Catch up","Skip and move on"]},{"id":"hb11","t":"C","q":"When do you prefer to check in?","o":["Morning","Midday","Evening","Before bed"]}]},{"id":"cs","title":"How you want to be coached","intro":"","qs":[{"id":"cs1","t":"C","q":"How should your coach talk to you?","o":["Warm and gentle","Warm but honest","Direct and firm","Tough love","Depends on the situation"]},{"id":"cs2","t":"R","q":"How blunt should warnings be?","o":["Gentle","Very blunt"]},{"id":"cs3","t":"M","q":"What do you want from your coach?","o":["Motivation","Discipline and accountability","Warnings when I slip","Insight into my patterns","Faith reminders","Practical plans","Celebration of wins"]},{"id":"cs4","t":"M","q":"What should the coach never do?","o":["Shame me","Compare me to others","Preach for too long","Lecture me about faith","Use guilt","Be sarcastic","Mention my weight","Nag every day","Ignore my effort","Give medical advice"]},{"id":"cs5","t":"C","q":"How often do you want to hear from your coach?","o":["Daily","A few times a week","Weekly","Only when I ask"]},{"id":"cs6","t":"C","q":"Which language for your coach notes?","o":["English","Arabic","Both"]},{"id":"cs7","t":"C","q":"Should the coach question the habits themselves and suggest big changes?","o":["Yes, boldly","Yes, gently","Only when I ask","No"]},{"id":"cs8","t":"C","q":"How long should coach notes be?","o":["Short","Medium","Detailed"]},{"id":"cs9","t":"C","q":"Numbers or stories?","o":["Numbers","Stories","A balance"]},{"id":"cs10","t":"C","q":"Humour from the coach.","o":["Yes","A little","No"]},{"id":"cs11","t":"M","q":"Which topics should the coach cover?","o":["Faith","Body","Mind","Family","Money","Heart","Marriage","Parenting","Work"]},{"id":"cs12","t":"C","q":"How open do you want to be with {o} about your progress?","o":["Fully open","Summary only","Mostly private"]}]},{"id":"ex","title":"Anything else","intro":"The only open questions. Write as much or as little as you like.","qs":[{"id":"ex1","t":"M","q":"What would success with this app look like in 90 days?","o":["Consistent prayer","A stronger body","Calmer money","A closer marriage","More time with the children","Less phone","Better sleep","Clear direction","Regular Qur’an","Tracking every day"]},{"id":"ex2","t":"R","q":"How open were you in this profile?","o":["Guarded","Completely honest"]},{"id":"ex3","t":"C","q":"If my answers and my behaviour disagree, the coach should…","o":["Point it out gently","Point it out directly","Trust my answers","Ask me about it"]},{"id":"ex4","t":"L","q":"What else should your coach know about you that I have not asked?"},{"id":"ex5","t":"L","q":"What question should I have asked?"}]}];
const pfHas=v=>v!=null&&String(Array.isArray(v)?v.join(''):v).trim()!=='';
/* a question counts as answered when it has a choice/answer OR a note; the optional note for question X is stored under the key X_note */
const pfDone=(A,q)=>pfHas(A[q.id])||pfHas(A[q.id+'_note']);
function pfCount(pid){let n=0,tot=0;const A=PR[pid]||{};PROFILE_Q.forEach(sc=>sc.qs.forEach(q=>{tot++;if(pfDone(A,q))n++}));return {n:n,tot:tot}}
function pfTxt(pid,t){const o=pid==='p1'?'p2':'p1';return String(t).replace(/\{o\}/g,pname(o))}
const pfOther=v=>Array.isArray(v)?v.indexOf('Other')>=0:v==='Other';
function pfNote(pid,q,A){
  const nm='pf-'+pid+'-'+q.id+'-x',v=A[q.id+'_note']||'',oth=pfOther(A[q.id]);
  return '<div class="pfx'+(oth&&!pfHas(v)?' need':'')+'"><textarea class="in" id="'+nm+'" rows="'+(pfHas(v)?2:1)+'" placeholder="'+(oth?'You chose Other. Tell us what you mean':'Add more detail in your own words (optional)')+'" aria-label="More detail" data-f="pf" data-x="1" data-p="'+pid+'" data-q="'+q.id+'">'+esc(v)+'</textarea></div>';
}
const pfOpts=q=>q.o.indexOf('Other')>=0?q.o:q.o.concat(['Other']);
function pfQ(pid,q,v,A){
  const nm='pf-'+pid+'-'+q.id,d='data-f="pf" data-p="'+pid+'" data-q="'+q.id+'"',tx=pfTxt(pid,q.q),lab='<label class="pfl" for="'+nm+'">'+esc(tx)+'</label>',nt=pfNote(pid,q,A||{});
  if(q.t==='L')return '<div class="pfq" data-qid="'+q.id+'">'+lab+'<textarea class="in" id="'+nm+'" rows="3" '+d+'>'+esc(v||'')+'</textarea></div>';
  if(q.t==='S')return '<div class="pfq" data-qid="'+q.id+'">'+lab+'<input class="in" id="'+nm+'" '+d+' value="'+esc(v||'')+'"></div>';
  if(q.t==='R')return '<div class="pfq" data-qid="'+q.id+'"><div class="pfl">'+esc(tx)+'</div><div class="pfscale"><span>'+esc(q.o[0])+'</span><span class="pfr">'+[1,2,3,4,5].map(n=>'<label><input type="radio" name="'+nm+'" value="'+n+'" '+d+(String(v)===String(n)?' checked':'')+'><i>'+n+'</i></label>').join('')+'</span><span>'+esc(q.o[1])+'</span></div>'+nt+'</div>';
  if(q.t==='C')return '<div class="pfq" data-qid="'+q.id+'"><div class="pfl">'+esc(tx)+'</div><div class="pfopts">'+pfOpts(q).map(o=>{const ov=pfTxt(pid,o);return '<label class="pfo"><input type="radio" name="'+nm+'" value="'+esc(ov)+'" '+d+(v===ov?' checked':'')+'><span>'+esc(ov)+'</span></label>'}).join('')+'</div>'+nt+'</div>';
  const sel=Array.isArray(v)?v:[];
  return '<div class="pfq" data-qid="'+q.id+'"><div class="pfl">'+esc(tx)+' <span class="pfh">Choose all that apply</span></div><div class="pfopts">'+pfOpts(q).map(o=>{const ov=pfTxt(pid,o);return '<label class="pfo"><input type="checkbox" name="'+nm+'" value="'+esc(ov)+'" '+d+(sel.indexOf(ov)>=0?' checked':'')+'><span>'+esc(ov)+'</span></label>'}).join('')+'</div>'+nt+'</div>';
}
const PFOPEN='istiqama.pfopen';
function pfIsOpen(id){
  if(ui.pfOpen==null){try{ui.pfOpen=JSON.parse(localStorage.getItem(PFOPEN)||'{}')||{}}catch(e){ui.pfOpen={}}}
  return ui.pfOpen===id||(typeof ui.pfOpen==='object'&&!!ui.pfOpen[id]);
}
function pfSetOpen(id,on){
  if(typeof ui.pfOpen!=='object'||!ui.pfOpen)ui.pfOpen=(typeof ui.pfOpen==='string'?{[ui.pfOpen]:true}:{});
  if(on)ui.pfOpen[id]=true;else delete ui.pfOpen[id];
  try{localStorage.setItem(PFOPEN,JSON.stringify(ui.pfOpen))}catch(e){}
}
function pfFirstTodo(pid){
  const A=PR[pid]||{};for(const sc of PROFILE_Q){const q=sc.qs.find(q=>!pfDone(A,q));if(q)return {sec:sc.id,q:q.id}}return null;
}
function viewProfile(){
  const pid=ui.pf==='p2'?'p2':'p1',A=PR[pid]||{},c=pfCount(pid);
  const who='<div class="pill-seg" role="group" aria-label="Whose profile">'+S.people.map(p=>'<button data-act="pfwho" data-p="'+p.id+'" aria-pressed="'+(pid===p.id)+'">'+esc(pname(p.id))+'</button>').join('')+'</div>';
  const secs=PROFILE_Q.map(sc=>{
    const dn=sc.qs.filter(q=>pfDone(A,q)).length;
    return '<details class="pfsec" data-sec="'+sc.id+'"'+(pfIsOpen(sc.id)?' open':'')+'><summary><b>'+esc(sc.title)+'</b><span class="pfc" data-pfc="'+sc.id+'">'+dn+'/'+sc.qs.length+'</span></summary><div class="pfbody">'+(sc.intro?'<p class="note">'+esc(sc.intro)+'</p>':'')+sc.qs.map(q=>pfQ(pid,q,A[q.id],A)).join('')+'</div></details>';
  }).join('');
  return '<div data-notr="1" class="pfview"><div class="datenav"><button class="iconbtn" data-act="tab" data-t="setup" aria-label="Back">'+svgi('chl')+'</button><div style="flex:1;min-width:0"><h2>Deep profile</h2><small>So your coach really knows you</small></div>'+who+'</div>'
    +'<section class="card"><p>Mostly tap-to-answer: pick what fits, and under any question add a note in your own words if you want to. Answer as much as you like, in any order. It saves by itself. The more you share, the more personal and useful your coach becomes: your mission, your strengths and weak spots, what motivates you, how you want to be coached.</p>'
    +'<p class="note" style="margin-top:8px">Privacy: answers are stored with your family link, one document per person. The app shows only your own answers on your page, but anyone who has the full family link could read them from the database. Skip anything you would rather not store. You can change or clear any answer at any time.</p>'
    +'<div class="pfprog"><div class="bar"><i id="pfbar" style="width:'+Math.round(c.n/c.tot*100)+'%"></i></div><b id="pftxt">'+c.n+' of '+c.tot+' answered</b></div>'
    +'<p class="note pfsave" id="pfsave" role="status" aria-live="polite">Your draft saves automatically on this device and syncs as you go. You can stop any time and come back.</p>'
    +'<div class="chips"><button class="btn" data-act="pfnext">'+(c.n?'Continue where I left off':'Start')+'</button><button class="btn alt" data-act="pfcopy">Copy my answers</button></div></section>'+secs+'</div>';
}
document.addEventListener('toggle',e=>{const d=e.target;if(d&&d.classList&&d.classList.contains('pfsec'))pfSetOpen(d.dataset.sec,d.open)},true);
function onPfInput(el){
  const pid=el.dataset.p,qid=el.dataset.q;if(!pid||!qid)return;
  const A=PR[pid]||(PR[pid]={});let v,key=qid;
  if(el.dataset.x){key=qid+'_note';v=el.value;const sm=el.parentNode&&el.parentNode.querySelector('summary');if(sm)sm.textContent=pfHas(v)?'Your note':'Add a note'}
  else if(el.type==='checkbox'){v=[...document.querySelectorAll('input[type=checkbox][data-f="pf"][data-p="'+pid+'"][data-q="'+qid+'"]')].filter(x=>x.checked).map(x=>x.value)}
  else if(el.type==='radio'){v=el.value}
  else v=el.value;
  if(!pfHas(v))delete A[key];else A[key]=v;
  saveProfile(pid);
  const sv=document.getElementById('pfsave');if(sv){const d=new Date();sv.textContent='Draft saved at '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')+'. Keep going, or come back later.'}
  if(el.dataset.x){el.rows=pfHas(el.value)?Math.min(6,Math.max(2,el.value.split('\n').length+Math.floor(el.value.length/48))):1;const bx=el.parentNode;if(bx)bx.classList.toggle('need',pfOther(A[qid])&&!pfHas(el.value))}
  else{const nt=document.getElementById('pf-'+pid+'-'+qid+'-x');if(nt){const o=pfOther(A[qid]);nt.placeholder=o?'You chose Other. Tell us what you mean':'Add more detail in your own words (optional)';nt.parentNode.classList.toggle('need',o&&!pfHas(nt.value));if(o&&(el.type==='radio'||el.checked)&&el.value==='Other')nt.focus({preventScroll:false})}}
  const c=pfCount(pid),bar=document.getElementById('pfbar'),tx=document.getElementById('pftxt');
  if(bar)bar.style.width=Math.round(c.n/c.tot*100)+'%';if(tx)tx.textContent=c.n+' of '+c.tot+' answered';
  PROFILE_Q.forEach(sc=>{if(sc.qs.some(q=>q.id===qid)){const e=document.querySelector('[data-pfc="'+sc.id+'"]');if(e)e.textContent=sc.qs.filter(q=>pfDone(A,q)).length+'/'+sc.qs.length}});
}
function pfText(pid){
  const A=PR[pid]||{};let out='Deep profile of '+pname(pid)+'\n';
  PROFILE_Q.forEach(sc=>{const rows=sc.qs.filter(q=>pfDone(A,q));if(!rows.length)return;out+='\n## '+sc.title+'\n';rows.forEach(q=>{const v=A[q.id],nt=A[q.id+'_note'];out+='Q: '+pfTxt(pid,q.q)+'\n';if(pfHas(v))out+='A: '+(Array.isArray(v)?v.join(', '):v)+(q.t==='R'&&q.o?' (1 = '+q.o[0]+', 5 = '+q.o[1]+')':'')+'\n';if(pfHas(nt))out+='Note: '+nt+'\n'})});
  return out;
}

/* ---------- persistence ---------- */
const MIRROR='istiqama.v1';
const pending={},timers={},busy={};
function mirror(){try{localStorage.setItem(MIRROR,JSON.stringify({S:S,L:L,V:V,E:E,B:B,F:F,PR:PR}))}catch(e){}}
function loadMirror(){try{const r=localStorage.getItem(MIRROR);if(!r)return null;const j=JSON.parse(r);return j&&j.S&&j.S.setup?j:null}catch(e){return null}}
function setSync(v){sync=v;renderStatus()}
function queue(id,data){
  if(!DB||(S&&S.smp))return;pending[id]=data;clearTimeout(timers[id]);timers[id]=setTimeout(()=>flush(id),350);
}
async function flush(id){
  timers[id]=0;
  if(busy[id]){timers[id]=setTimeout(()=>flush(id),300);return}
  const data=pending[id];if(!data)return;delete pending[id];busy[id]=true;
  try{await DB.doc('habit/'+id).set(data);lastWrite=Date.now();setSync('synced')}
  catch(e){
    setSync('local');
    if(!pending[id])pending[id]=data;clearTimeout(timers[id]);timers[id]=setTimeout(()=>flush(id),8000);
    if(!flush.warned){flush.warned=true;toast("No internet right now. Your ticks are kept on this phone and will upload when it is back.")}
  }
  finally{busy[id]=false;if(pending[id]&&!timers[id])timers[id]=setTimeout(()=>flush(id),50)}
}
function saveConfig(){mirror();queue('config',{cfg:S})}
function saveLog(pid){mirror();queue('log-'+pid,{days:L[pid]||{}})}
function saveVal(pid){mirror();queue('val-'+pid,{vals:V[pid]||{}})}
/* Data tidy-up. Nothing legitimate is dated before the tracking start (recording on an earlier day moves the start back), so older rows are leftovers (for example demo data) and are ignored. */
function sweepMaps(start,nl,nv,ne){
  const hit={log:{},val:{},exp:{}};let any=false;
  if(!start)return {any:false,hit:hit};
  [[nl,'log'],[nv,'val'],[ne,'exp']].forEach(a=>{const o=a[0];Object.keys(o).forEach(pid=>{const m=o[pid]||{};Object.keys(m).forEach(d=>{if(d<start){delete m[d];hit[a[1]][pid]=1;any=true}})})});
  return {any:any,hit:hit};
}
/* An old single daily spend number with no expense rows becomes one visible "Earlier total" row, so the day, the month, the chart and the budgets all read the same source. */
function legacySpend(){
  const h=spendHabit();if(!h||mode==='sample'||!S.start)return;
  const rp=repOf(h,h.who[0]),wp=h.who[0],vm=V[rp]||{};
  Object.keys(vm).forEach(d=>{
    if(d<S.start)return;
    const raw=(vm[d]||{})[h.id];
    if(raw==null||typeof raw==='object'||!(Number(raw)>0))return;
    if(expList(d,h,null).some(x=>!eSkip(x)))return;
    const m=E[wp]||(E[wp]={});const day=Object.assign({},m[d]||{});
    day['leg'+d.replace(/-/g,'')]={a:Number(raw),n:'Earlier total',c:'other',t:1};
    m[d]=day;saveExp(wp);
    const tg=hTargets(h,wp);valSet(tg,d,h.id);tickSet(tg,d,h.id,true);
  });
}
let tidied=false;
function tidyOnce(hit){
  if(tidied)return;tidied=true;
  if(hit){['p1','p2'].forEach(pid=>{if(hit.log[pid])saveLog(pid);if(hit.val[pid])saveVal(pid);if(hit.exp[pid])saveExp(pid)})}
  legacySpend();resyncUnder(60);
}
function applyRemote(docs){
  let c=docs.config&&docs.config.cfg;
  if(!c||!c.setup)return 0;
  c.people.forEach(p=>{p.focus=p.focus||[];p.g=p.g||(p.id==='p2'?'f':'m')});
  c.habits=(c.habits||[]).map(h=>Object.assign({type:'tick',per:'week',goal:0,joint:false,ar:''},h,{who:h.who&&h.who.length?h.who:['p1','p2']}));
  let migrated=false;
  if(!(c.v>=2)){c=migrate(c);migrated=true}
  if(ensureUnder(c))migrated=true;
  const nl={},nv={},ne={},nF={},nP={};
  const nB=(pending.budgets||busy.budgets)?B:budNorm(docs.budgets&&docs.budgets.b);
  c.people.forEach(p=>{
    const pfid='profile-'+p.id;nP[p.id]=(pending[pfid]||busy[pfid])?(PR[p.id]||{}):((docs[pfid]&&docs[pfid].a)||{});
    const fid='fixed-'+p.id;nF[p.id]=(pending[fid]||busy[fid])?(F[p.id]||{}):((docs[fid]&&docs[fid].items)||{});
    const id='log-'+p.id,vid='val-'+p.id;
    nl[p.id]=(pending[id]||busy[id])?(L[p.id]||{}):((docs[id]&&docs[id].days)||{});
    nv[p.id]=(pending[vid]||busy[vid])?(V[p.id]||{}):((docs[vid]&&docs[vid].vals)||{});
    const eid='exp-'+p.id;ne[p.id]=(pending[eid]||busy[eid])?(E[p.id]||{}):((docs[eid]&&docs[eid].items)||{});
  });
  const sw=sweepMaps(c.start,nl,nv,ne);
  const changed=JSON.stringify(S)!==JSON.stringify(c)||JSON.stringify(L)!==JSON.stringify(nl)||JSON.stringify(V)!==JSON.stringify(nv)||JSON.stringify(E)!==JSON.stringify(ne)||JSON.stringify(B)!==JSON.stringify(nB)||JSON.stringify(F)!==JSON.stringify(nF)||JSON.stringify(PR)!==JSON.stringify(nP)||mode!=='db';
  S=c;L=nl;V=nv;E=ne;B=nB;F=nF;PR=nP;mode='db';mirror();utilRestoreOnce();
  if(migrated)saveConfig();
  const firstTidy=!tidied;tidyOnce(sw.any?sw.hit:null);
  return (changed||firstTidy)?2:1;
}
/* one-time repair: puts back the Utilities payment (1,700 on 17 Oct, with its note) that was removed by mistake on 23 Oct 2026.
   It only runs when Utilities has no payment at all this month, and only once per device. */
function utilRestoreOnce(){
  try{
    if(localStorage.getItem('istiqama.fix1'))return;
    const ym='2026-10',k='f_util';
    const has=['p1','p2'].some(pid=>{const e=((F[pid]||{})[ym]||{})[k];return e&&(Array.isArray(e.p)?e.p.length:e.a!=null)});
    localStorage.setItem('istiqama.fix1','1');
    if(has||!bud().fixed.some(f=>f.k===k))return;
    fxRestore(k,ym,[{pid:'p1',q:{i:'mvc3hkd9li',d:'2026-10-17',a:1700,n:'1200 electricty and 500 water'}}]);
  }catch(e){}
}
let firstSnap=true;
function onDocs(snap){
  if(snap.metadata&&snap.metadata.hasPendingWrites)return;
  const docs={};snap.docs.forEach(d=>{docs[d.id]=d.data()});
  if(firstSnap){
    firstSnap=false;
    if(docs.config&&docs.config.cfg&&docs.config.cfg.setup){
      applyRemote(docs);setSync('synced');
    }else if(S.setup&&mode==='local'){
      mode='db';setSync('synced');saveConfig();S.people.forEach(p=>{saveLog(p.id);saveVal(p.id);if(Object.keys(E[p.id]||{}).length)saveExp(p.id);if(Object.keys(F[p.id]||{}).length)saveFix(p.id);if(Object.keys(PR[p.id]||{}).length)saveProfile(p.id)});if(B)budSave();
    }
    softRender();return;
  }
  const r=applyRemote(docs);
  if(r){setSync('synced');if(r===2)softRender()}
}
function softRender(){
  if(ui.tab==='profile'){renderStatus();renderTop();return}
  if(ui.tab==='setup'&&draftDirty){renderStatus();renderTop();return}
  render();
}
/* ---------- online sync (Firebase Realtime Database over plain HTTPS) ---------- */
const FB_URL='https://habits-d86b0-default-rtdb.firebaseio.com';
let FAM='',api=null,lastWrite=0,pollT=null,lastJson=null;
function randomCode(){
  const A='abcdefghjkmnpqrstuvwxyz23456789',a=new Uint8Array(20);
  (window.crypto||window.msCrypto).getRandomValues(a);
  return Array.prototype.map.call(a,x=>A[x%A.length]).join('');
}
function famCode(){
  let c=null;
  const m=/[#&]f=([A-Za-z0-9_-]{12,64})/.exec(location.hash||'');
  if(m)c=m[1];
  try{if(!c)c=localStorage.getItem('istiqama.fam')}catch(e){}
  if(!c)c=randomCode();
  try{localStorage.setItem('istiqama.fam',c)}catch(e){}
  try{history.replaceState(null,'','#f='+c)}catch(e){}
  return c;
}
function shareLink(){return location.href.split('#')[0]+'#f='+FAM}
function makeApi(base){
  const u=id=>base+'/'+id+'.json';
  return {
    async set(id,data){const r=await fetch(u(id),{method:'PUT',body:JSON.stringify(data)});if(!r.ok)throw new Error('http '+r.status)},
    async del(id){const r=await fetch(u(id),{method:'DELETE'});if(!r.ok)throw new Error('http '+r.status)},
    async all(){const r=await fetch(base+'.json',{cache:'no-store'});if(!r.ok)throw new Error('http '+r.status);return (await r.json())||{}}
  };
}
async function poll(){
  clearTimeout(pollT);
  const t0=Date.now();
  try{
    const o=await api.all();
    const busyNow=Object.keys(pending).length||Object.keys(busy).some(k=>busy[k]);
    if(!(t0<lastWrite||busyNow)){
      const js=JSON.stringify(o);
      if(firstSnap||js!==lastJson){
        lastJson=js;
        onDocs({metadata:{},docs:Object.keys(o).map(k=>({id:k,data:()=>o[k]}))});
      }
      if(S.setup)setSync('synced');
    }
  }catch(e){if(S.setup)setSync('local')}
  pollT=setTimeout(poll,document.hidden?20000:5000);
}
function attachDb(){
  if(!FB_URL||FB_URL.indexOf('__')===0||!window.fetch)return;
  FAM=famCode();
  api=makeApi(FB_URL.replace(/\/+$/,'')+'/families/'+FAM);
  DB={doc:function(path){const id=path.split('/').pop();return {set:d=>api.set(id,d),delete:()=>api.del(id)}}};
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)poll()});
  poll();
}

/* ---------- toast + tooltip ---------- */
let toastT;
function toast(msg){const t=$('#toast');t.textContent=ui.lang==='ar'?trs(msg):msg;t.classList.toggle('trophy-celebration',/^New trophy! |^جائزة جديدة! /.test(msg));t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),3600)}
function showTip(html,x,y){
  const t=$('#tip');t.innerHTML=html;t.classList.add('show');
  const w=t.offsetWidth,h=t.offsetHeight;
  let left=x+14,top=y-h-12;
  if(left+w>window.innerWidth-8)left=x-w-14;
  if(left<8)left=8;
  if(top<8)top=y+18;
  t.style.left=left+'px';t.style.top=top+'px';
}
function hideTip(){$('#tip').classList.remove('show')}

/* ---------- small components ---------- */
function ring(p,color,size){
  const r=size/2-5,c=2*Math.PI*r,v=p==null?0:clamp(p,0,1);
  return '<span class="ringwrap" style="width:'+size+'px;height:'+size+'px"><svg width="'+size+'" height="'+size+'" viewBox="0 0 '+size+' '+size+'" aria-hidden="true"><circle cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" stroke="var(--surface2)" stroke-width="6"/><circle cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" stroke="'+color+'" stroke-width="6" stroke-linecap="round" stroke-dasharray="'+(c*v)+' '+c+'" transform="rotate(-90 '+size/2+' '+size/2+')"/></svg><b>'+pct(p)+'</b></span>';
}
function gaugePt(cx,cy,r,f){const th=Math.PI-f*Math.PI;return [cx+r*Math.cos(th),cy-r*Math.sin(th)]}
function arc(cx,cy,r,f1,f2){
  const a=gaugePt(cx,cy,r,f1),b=gaugePt(cx,cy,r,f2);
  return 'M'+a[0].toFixed(2)+' '+a[1].toFixed(2)+' A'+r+' '+r+' 0 0 1 '+b[0].toFixed(2)+' '+b[1].toFixed(2);
}
function gauge(p,color,label,labelColor){
  const v=p==null?0:clamp(p,0,1),ang=-90+v*180;
  const prog=v>0.004?'<path d="'+arc(110,112,80,0,v)+'" fill="none" stroke="'+color+'" stroke-width="15" stroke-linecap="round"/>':'';
  return '<div class="gz"><svg class="gauge" viewBox="0 0 220 150" role="img" aria-label="'+esc(label)+' '+pct(p)+'">'
    +'<path d="'+arc(110,112,98,0.004,0.496)+'" fill="none" stroke="var(--z1)" stroke-width="5"/>'
    +'<path d="'+arc(110,112,98,0.504,0.796)+'" fill="none" stroke="var(--z2)" stroke-width="5"/>'
    +'<path d="'+arc(110,112,98,0.804,0.996)+'" fill="none" stroke="var(--z3)" stroke-width="5"/>'
    +'<path d="'+arc(110,112,80,0,1)+'" fill="none" stroke="var(--surface2)" stroke-width="15" stroke-linecap="round"/>'+prog
    +'<g class="needle" data-ang="'+ang+'" style="transform-origin:110px 112px;transform:rotate(-90deg)"><line x1="110" y1="112" x2="110" y2="48" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/><circle cx="110" cy="112" r="7.5" fill="var(--ink)"/><circle cx="110" cy="112" r="3" fill="var(--surface)"/></g>'
    +'<text x="110" y="144" text-anchor="middle" class="num" font-size="30" font-weight="800" fill="var(--ink)">'+pct(p)+'</text>'
    +'<text x="14" y="132" text-anchor="middle" class="axis">0</text><text x="206" y="132" text-anchor="middle" class="axis">100</text></svg>'
    +'<div class="lab" style="color:'+(labelColor||'var(--ink)')+'">'+esc(label)+'</div><div class="zone">'+zone(p)+'</div></div>';
}
function banner(){
  if(mode!=='sample')return '';
  return '<div class="banner"><span class="sample-jewel">'+svgi('other')+'</span><p><b>You are looking at sample data.</b> Nothing here is yours yet: the check-ins, water, spending and orders are all made up so you can see how the app works. Set up your profiles and habits to start your own.</p><button class="btn" data-act="tab" data-t="setup">Set up our profiles</button></div>';
}
function noHabits(){
  return '<div class="card empty-jewel"><span class="empty-art">'+svgi('other')+'</span><p>No habits set up yet.</p><p class="note" style="margin-top:6px">Open Setup to choose your habits.</p></div>';
}

/* ---------- views ---------- */
/* ---------- habit rows (Today) ---------- */
function periodNote(h,pid,d){
  const rp=repOf(h,pid),wr=(function(){const a=wkStart(d);return [a,addDays(a,6)]})();
  if(h.type==='cap'){
    const n=capSum(pid,h,wr[0],wr[1]);
    return '<span class="wk">'+n+'/'+h.goal+'<br><small style="font-weight:500">this week</small></span>';
  }
  if(h.per==='month'){
    const m=[new Date(d.getFullYear(),d.getMonth(),1),new Date(d.getFullYear(),d.getMonth()+1,0)];
    const x=stats(rp,m[0],m[1],null,true).byHabit[h.id]||{done:0};
    return '<span class="wk">'+x.done+'/'+h.target+'<br><small style="font-weight:500">this month</small></span>';
  }
  const x=stats(rp,wr[0],wr[1],null,true).byHabit[h.id]||{done:0};
  return '<span class="wk">'+x.done+'/'+h.target+'<br><small style="font-weight:500">this week</small></span>';
}
function stBadge(ok,okTxt,badTxt,noIc){
  return '<span class="st '+(ok?'ok':'bad')+'">'+(noIc?'':svgi(ok?'check':'warn','',3))+(ok?okTxt:badTxt)+'</span>';
}
function habitRow(h,pid,d,dstr){
  const rp=repOf(h,pid),on=isTicked(h,pid,dstr)||weekDone(h,pid,d);
  const hn=esc(hname(h));
  const u=unitOf(h.kind),du=(Number(h.amount)&&u&&h.type==='tick')?nf(h.amount)+' '+u:'';
  const tagA='<span class="tag">'+svgi(h.area)+esc(areaName(h.area))+(h.joint?' · Together':'')+'</span>';
  const data='data-p="'+pid+'" data-h="'+esc(h.id)+'" data-d="'+dstr+'"';
  const areaCls=' area-'+esc(h.area)+(h.joint?' joint-habit':'');
  const perTxt=h.per==='month'?'<span>'+h.target+' a month</span>':'';
  if(h.type==='count'&&h.lim){
    const raw=getVal(rp,dstr,h.id),has=raw!=null&&typeof raw!=='object',v=has?(Number(raw)||0):0,goal=Number(h.goal)||0,over=has&&v>goal;
    const gl=Array.from({length:v},()=>svgi('candy','sc',2)).join('');
    const st=has?'<span class="st '+(over?'bad':'ok')+'">'+(v===0?svgi('check','',3)+T2('Sugar-free day','يوم بلا سكر'):(goal?v+' / '+goal:v))+'</span>':'';
    return '<div class="row cntrow sweetrow'+areaCls+(on?' on':'')+(over?' over':'')+'"><span class="chk">'+svgi(over?'candy':'check','',over?2:3)+'</span>'
      +'<span style="min-width:0"><span class="nm">'+hn+'</span>'+(st?'<span class="meta">'+st+'</span>':'')+(gl?'<span class="glasses sweets-gl" aria-hidden="true">'+gl+'</span>':'')+'</span>'
      +'<span class="stepper"><button class="iconbtn" data-act="minus" '+data+' aria-label="One less">'+svgi('minus','',3)+'</button><button class="iconbtn" data-act="plus" '+data+' aria-label="One more">'+svgi('plus','',3)+'</button></span></div>';
  }
  if(h.type==='count'){
    const v=Number(getVal(rp,dstr,h.id))||0,goal=h.goal||1;
    const gl=Array.from({length:Math.max(goal,v)},(_,i)=>'<i class="gl'+(i<v?' f':'')+'"></i>').join('');
    return '<div class="row cntrow'+areaCls+(on?' on':'')+'"><span class="chk">'+svgi('check','',3)+'</span>'
      +'<span style="min-width:0"><span class="nm">'+hn+'</span><span class="meta">'+tagA+'<span>'+v+' of '+goal+' today</span></span><span class="glasses" aria-hidden="true">'+gl+'</span></span>'
      +'<span class="stepper"><button class="iconbtn" data-act="minus" '+data+' aria-label="One less">'+svgi('minus','',3)+'</button><button class="iconbtn" data-act="plus" '+data+' aria-label="One more">'+svgi('plus','',3)+'</button></span></div>';
  }
  if(h.type==='cap'){
    const n=Number(getVal(rp,dstr,h.id))||0,wr=(function(){const a=wkStart(d);return [a,addDays(a,6)]})();
    const w=capSum(pid,h,wr[0],wr[1]),over=w>h.goal;
    return '<div class="row caprow'+areaCls+' '+(over?'over':'ok')+'"><span class="chk capchk">'+svgi(over?'bang':'check','',3)+'</span>'
      +'<span style="min-width:0"><span class="nm">'+hn+'</span><span class="meta">'+tagA+'<span>today: '+n+'</span></span>'
      +'<span class="meta">'+stBadge(!over,w+' of max '+h.goal+' this week',w+' of max '+h.goal+' this week: over')+'</span></span>'
      +'<span class="stepper"><button class="iconbtn" data-act="minus" '+data+' aria-label="One less">'+svgi('minus','',3)+'</button><button class="iconbtn" data-act="plus" '+data+' aria-label="One more">'+svgi('plus','',3)+'</button></span></div>';
  }
  if(h.type==='num'){
    const v=getVal(rp,dstr,h.id),has=v!=null&&typeof v!=='object';
    let meta,right='';
    if(h.kind==='spend'){
      const ne=expList(dstr,h,h.joint?null:pid).filter(x=>!eMove(x)).length;
      const lim=spLim(dstr);
      if(has){const ok=Number(v)<=lim;meta=stBadge(ok,'Within the limit','Over the limit')+'<span>limit '+nf(lim)+' '+esc(S.currency)+'</span>'+(ne?'<span>'+ne+(ne===1?' expense':' expenses')+'</span>':'');right='<span class="wk">'+nf(v)+'<br><small style="font-weight:500">'+esc(S.currency)+'</small></span>'}
      else meta='<span>Tap to add what you spend. Limit '+nf(lim)+' '+esc(S.currency)+' a day</span>';
    }else if(h.kind==='weight'){
      if(has){const p=prevVal(pid,h,dstr,60);const dl=p?Math.round((Number(v)-p.v)*10)/10:null;
        meta='<span>'+(dl==null?'First weigh-in':(dl>0?'+':'')+dl+' kg since last time')+'</span>';right='<span class="wk">'+nf1(v)+'<br><small style="font-weight:500">kg</small></span>'}
      else meta='<span>Tap to enter your weight</span>';
    }else{
      if(has){const ok=!h.goal||Number(v)>=h.goal;meta=(h.goal?stBadge(ok,'Goal reached','Below goal '+nf(h.goal)):'');right='<span class="wk">'+nf(v)+'<br><small style="font-weight:500">'+esc(unitOf(h.kind))+'</small></span>'}
      else meta='<span>Tap to enter'+(h.goal?'. Goal '+nf(h.goal):'')+'</span>';
    }
    return '<button class="row'+areaCls+(on?' on':'')+'" data-act="'+(h.kind==='spend'?'exp':'num')+'" '+data+' aria-label="'+hn+'"><span class="chk">'+svgi('check','',3)+'</span>'
      +'<span style="min-width:0"><span class="nm">'+hn+'</span><span class="meta">'+tagA+perTxt+'</span><span class="meta">'+meta+'</span></span>'+(right||periodNote(h,pid,d))+'</button>';
  }
  if(h.type==='tag'){
    const v=getVal(rp,dstr,h.id),has=v&&typeof v==='object';
    const meta=has?'<span class="st ok">'+svgi('check','',3)+esc(tagName(v.t))+'</span>'+(v.n?'<span>'+esc(v.n)+'</span>':''):'<span>Tap to log what you produced</span>';
    return '<button class="row'+areaCls+(on?' on':'')+'" data-act="tag" '+data+' aria-label="'+hn+'"><span class="chk">'+svgi('check','',3)+'</span>'
      +'<span style="min-width:0"><span class="nm">'+hn+'</span><span class="meta">'+tagA+'</span><span class="meta">'+meta+'</span></span>'+periodNote(h,pid,d)+'</button>';
  }
  if(h.kind==='underlimit'){
    const sp=spendHabit(),v=sp?getVal(repOf(sp,sp.who[0]),dstr,sp.id):null,has=v!=null&&typeof v!=='object',lim=spLim(dstr);
    const okNow=has&&Number(v)<=lim;
    const meta=has?stBadge(okNow,T2('Within the limit','ضمن الحد'),T2('Over the limit','فوق الحد'))+'<span class="num">'+nf(v)+' / '+nf(lim)+'</span>':'<span>'+T2('Fills in by itself from your expenses. Limit ','يُملأ تلقائيًا من مصروفاتك. الحد ')+nf(lim)+'</span>';
    return '<div class="row autorow'+areaCls+(okNow||on?' on':'')+'" aria-label="'+hn+'"><span class="chk">'+svgi('check','',3)+'</span><span style="min-width:0"><span class="nm">'+hn+'</span><span class="meta">'+tagA+perTxt+'</span><span class="meta">'+meta+'</span></span>'+periodNote(h,pid,d)+'</div>';
  }
  return '<button class="row'+areaCls+(on?' on':'')+'" data-act="toggle" '+data+' aria-pressed="'+on+'" aria-label="'+hn+'"><span class="chk">'+svgi('check','',3)+'</span>'
    +'<span style="min-width:0"><span class="nm">'+hn+'</span><span class="meta">'+tagA+(du?'<span>'+du+'</span>':'')+perTxt+'</span></span>'+periodNote(h,pid,d)+'</button>';
}
function viewToday(){
  const t=today(),s=pd(S.start);
  const fl=floorDay();let d=addDays(t,ui.dayOff);if(d<fl)d=fl;
  const dstr=ds(d),isToday=sameDay(d,t);
  const nav='<div class="datenav"><button class="iconbtn" data-act="day" data-n="-1" aria-label="Previous day"'+(d<=fl?' disabled':'')+'>'+svgi('chl')+'</button><div style="flex:1;min-width:0;text-align:center"><h2>'+(isToday?'Today':fmtDay.format(d))+'</h2><small>'+fmtLong.format(d)+'</small></div><button class="iconbtn" data-act="day" data-n="1" aria-label="Next day"'+(isToday?' disabled':'')+'>'+svgi('chr')+'</button></div>';
  const both=ui.who==='both';
  const leftOf=(rows,pid)=>rows.filter(h=>h.type!=='cap'&&!isTicked(h,pid,dstr)&&!weekDone(h,pid,d)&&!(h.lim&&getVal(repOf(h,pid),dstr,h.id)!=null)).length;
  let blocks='';
  const joint=both?S.habits.filter(h=>h.joint):[];
  if(joint.length){
    const jt=joint.filter(h=>h.type!=='cap');
    const dn=jt.filter(h=>isTicked(h,h.who[0],dstr)).length;
    const jp=jt.length?dn/jt.length:null;
    const left=jt.length-dn;
    blocks+='<section class="card"><div class="ph">'+ring(jp,'var(--brand)',56)+'<h3>Together<small>'+(left===0?'Everything shared is done':left+' left '+(isToday?'today':'that day'))+'</small></h3></div>'
      +'<div class="rows">'+joint.map(h=>habitRow(h,h.who[0],d,dstr)).join('')+'</div></section>';
  }
  blocks+=activePids().map(pid=>{
    const all=ALLH(pid);
    if(!all.length)return '<section class="card"><div class="ph"><span class="dot" style="background:'+pcol(pid)+'"></span><h3>'+esc(pname(pid))+'</h3></div><p class="note">No habits assigned yet. Open Setup to add some.</p></section>';
    const rows=all.filter(h=>both?!h.joint:true);
    const dp=dayPct(pid,d);const left=leftOf(rows,pid);
    if(!rows.length)return '';
    return '<section class="card"><div class="ph">'+ring(dp,pcol(pid),56)+'<h3>'+esc(pname(pid))+'<small>'+(left===0?'Every habit done':left+' left '+(isToday?'today':'that day'))+'</small></h3></div>'
      +(left===0?'<div class="done-banner">'+svgi('check','',3)+'<span>Every habit done. Well done.</span></div>':'')
      +'<div class="rows">'+AREAS.map(a=>{
        const rs=rows.filter(h=>h.area===a.id);if(!rs.length)return '';
        return '<div class="agroup area-'+a.id+'"><div class="agh">'+svgi(a.id)+'<span>'+esc(areaName(a.id))+'</span></div>'+rs.map(h=>habitRow(h,pid,d,dstr)).join('')+'</div>';
      }).join('')+'</div></section>';
  }).join('');
  return nav+(isToday?meBanner()+moneyMini():'')+'<div class="grid'+(activePids().length>1?' two':'')+'">'+blocks+'</div>';
}

/* ---------- week ---------- */
function weekCell(h,pid,d,t,s){
  const rp=repOf(h,pid),dstr=ds(d);
  const dis=d>t||d<floorDay(),on=isTicked(h,pid,dstr),isT=sameDay(d,t);
  const base='data-p="'+pid+'" data-h="'+esc(h.id)+'" data-d="'+dstr+'"';
  const nm=esc(hname(h))+' '+fmtShort.format(d);
  if(h.type==='cap'||h.type==='count'){
    const n=Number(getVal(rp,dstr,h.id))||0;
    const rawW=getVal(rp,dstr,h.id),limOver=!!h.lim&&rawW!=null&&typeof rawW!=='object'&&n>(Number(h.goal)||0);
    return '<button class="cell numc'+(on?' on':'')+(limOver?' lim-over':'')+(isT?' today':'')+'" data-act="num" '+base+' aria-label="'+nm+'"'+(dis?' disabled':'')+'>'+(n?'<span class="cn">'+n+'</span>':svgi('check','',3))+'</button>';
  }
  if(h.type==='num')return '<button class="cell numc'+(on?' on':'')+(isT?' today':'')+'" data-act="num" '+base+' aria-label="'+nm+'"'+(dis?' disabled':'')+'>'+svgi('check','',3)+'</button>';
  if(h.type==='tag')return '<button class="cell'+(on?' on':'')+(isT?' today':'')+'" data-act="tag" '+base+' aria-label="'+nm+'"'+(dis?' disabled':'')+'>'+svgi('check','',3)+'</button>';
  if(h.kind==='underlimit')return '<button class="cell auto'+(on?' on':'')+(isT?' today':'')+'" aria-label="'+nm+'" disabled>'+svgi('check','',3)+'</button>';
  return '<button class="cell'+(on?' on':'')+(isT?' today':'')+'" data-act="toggle" '+base+' aria-pressed="'+on+'" aria-label="'+nm+'"'+(dis?' disabled':'')+'>'+svgi('check','',3)+'</button>';
}
function weekCard(pid,hs,title,pctVal,ringCol,days,r){
  const t=today(),s=pd(S.start);
  const head='<div class="wdays">'+days.map(d=>'<div class="hd'+(sameDay(d,t)?' today':'')+'">'+dowTxt(d.getDay(),3)+'<br>'+d.getDate()+'</div>').join('')+'</div>';
  const rows=AREAS.map(a=>{
    const rs=hs.filter(h=>h.area===a.id);if(!rs.length)return '';
    return '<div class="agh area-'+a.id+'">'+svgi(a.id)+'<span>'+esc(areaName(a.id))+'</span></div>'+rs.map(h=>{
      const rp=repOf(h,pid);
      let tot;
      if(h.type==='cap'){const n=capSum(pid,h,r[0],r[1]);tot='<div class="tot'+(n<=h.goal?' met':'')+'">'+n+' of max '+h.goal+'</div>'}
      else if(h.per==='month'){const m=[new Date(r[0].getFullYear(),r[0].getMonth(),1),new Date(r[0].getFullYear(),r[0].getMonth()+1,0)];const x=stats(rp,m[0],m[1],null,true).byHabit[h.id]||{done:0};tot='<div class="tot'+(x.done>=h.target?' met':'')+'">'+x.done+' of '+h.target+' this month</div>'}
      else{let full=0;days.forEach(d=>{if(d<=t&&d>=s){if(h.lim){const q=getVal(rp,ds(d),h.id);if(q!=null&&typeof q!=='object'&&Number(q)<=(Number(h.goal)||0))full++}else if(isTicked(h,pid,ds(d)))full++}});tot='<div class="tot'+(full>=h.target?' met':'')+'">'+full+' of '+h.target+'</div>'}
      return '<div class="week-jewel area-'+esc(h.area)+(h.lim?' sw':'')+'"><div class="wh"><div class="hn"><span class="week-jicon">'+svgi(h.lim?'candy':h.area,'',h.lim?2:2)+'</span>'+esc(hname(h))+'</div>'+tot+'</div><div class="wcells">'+days.map(d=>weekCell(h,pid,d,t,s)).join('')+'</div></div>';
    }).join('');
  }).join('');
  return '<section class="card"><div class="ph">'+ring(pctVal,ringCol,56)+'<h3>'+esc(title)+'<small>'+zone(pctVal)+'</small></h3></div>'+head+rows+'</section>';
}
function viewWeek(){
  const r=P.wk(ui.weekOff),a=r[0],t=today(),s=pd(S.start);
  const days=[];for(let i=0;i<7;i++)days.push(addDays(a,i));
  const title=ui.weekOff===0?'This week':ui.weekOff===-1?'Last week':fmtShort.format(a)+' – '+fmtShort.format(r[1]);
  const nav='<div class="datenav"><button class="iconbtn" data-act="week" data-n="-1" aria-label="Previous week"'+(addDays(r[0],-1)<floorDay()?' disabled':'')+'>'+svgi('chl')+'</button><div style="flex:1;text-align:center"><h2>'+title+'</h2><small>'+fmtShort.format(a)+' – '+fmtShort.format(r[1])+'</small></div><button class="iconbtn" data-act="week" data-n="1" aria-label="Next week"'+(ui.weekOff>=0?' disabled':'')+'>'+svgi('chr')+'</button></div>';
  const both=ui.who==='both';
  let blocks='';
  const joint=both?S.habits.filter(h=>h.joint):[];
  if(joint.length){
    const jp=joint.filter(h=>h.type!=='cap');
    let exp=0,cred=0;jp.forEach(h=>{const x=stats(h.who[0],r[0],r[1]).byHabit[h.id];if(x){exp+=x.exp;cred+=x.cred}});
    blocks+=weekCard('p1',joint,'Together',exp>0?cred/exp:null,'var(--brand)',days,r);
  }
  blocks+=activePids().map(pid=>{
    const all=ALLH(pid).filter(h=>both?!h.joint:true);
    if(!all.length)return '';
    return weekCard(pid,all,pname(pid),stats(pid,r[0],r[1]).pct,pcol(pid),days,r);
  }).join('');
  return nav+'<div class="grid'+(activePids().length>1?' two':'')+'">'+(blocks||noHabits())+'</div>';
}

/* ---------- entry sheet (numbers, glasses, type + note) ---------- */
function openSheet(type,pid,hid,dstr){
  const h=S.habits.find(x=>x.id===hid);if(!h)return;
  if(type==='exp'){ui.sheet={type:'exp',pid:pid,hid:hid,d:dstr,f:{},ty:'x',cat:'',sc:'',cur:'EGP'};const e0=$('#sheet');if(e0)e0.innerHTML='';renderSheet();return}
  const cur=getVal(repOf(h,pid),dstr,hid);
  ui.sheet={type:type,pid:pid,hid:hid,d:dstr,tag:(cur&&typeof cur==='object')?cur.t:null,note:(cur&&typeof cur==='object')?(cur.n||''):''};
  renderSheet();
}
function closeSheet(){ui.sheet=null;if(ui.tab==='money')render();else renderSheet()}
function renderSheet(){
  const el=$('#sheet');if(!el)return;
  if(!ui.sheet){el.hidden=true;el.innerHTML='';return}
  collectSf();
  if(ui.sheet.type==='fix'){renderFixSheet(el,ui.sheet);return}
  if(ui.sheet.type==='bud'){renderBudSheet(el,ui.sheet);return}
  if(ui.sheet.type==='txl'){renderTxlSheet(el,ui.sheet);return}
  if(ui.sheet.type==='rates'){renderRatesSheet(el,ui.sheet);return}
  const sh=ui.sheet,h=S.habits.find(x=>x.id===sh.hid);if(!h){ui.sheet=null;el.hidden=true;return}
  if(sh.type==='exp'){renderExpSheet(el,sh,h);return}
  const rp=repOf(h,sh.pid),cur=getVal(rp,sh.d,h.id);
  const when=sameDay(pd(sh.d),today())?'Today':fmtLong.format(pd(sh.d));
  let body='';
  if(sh.type==='num'){
    let hint='';
    if(h.kind==='spend')hint='Total spent on '+when.toLowerCase()+' ('+esc(S.currency)+'). Daily limit '+nf(h.goal)+' '+esc(S.currency)+'.';
    else if(h.kind==='weight')hint='Your weight in kg.';
    else if(h.type==='count')hint='Number of '+(unitOf(h.kind)||'units')+' so far. Goal '+h.goal+'.';
    else if(h.type==='cap')hint='Number on this day. Weekly maximum '+h.goal+'.';
    else hint=(unitOf(h.kind)?unitOf(h.kind)+'.':'')+(h.goal?' Goal '+nf(h.goal)+'.':'');
    body='<label class="f">'+esc(hint)+'<input class="in" id="sheet-num" type="number" inputmode="decimal" step="any" min="0" value="'+(cur!=null&&typeof cur!=='object'?esc(cur):'')+'"></label>';
  }else{
    body='<div class="note" style="font-weight:600;margin-bottom:6px">What did you produce?</div><div class="chips">'
      +(h.tags||Object.keys(TAGS)).map(k=>'<button class="chipbtn'+(sh.tag===k?' sel':'')+'" data-act="sheettag" data-v="'+k+'" aria-pressed="'+(sh.tag===k)+'">'+esc(tagName(k))+'</button>').join('')+'</div>'
      +'<label class="f" style="margin-top:12px">One line about it (optional)<textarea class="in" id="sheet-note" maxlength="140" placeholder="e.g. one-page plan, supplier quote">'+esc(sh.note)+'</textarea></label>';
  }
  el.innerHTML='<div class="sheet-bg" data-act="sheetclose"></div><div class="sheet-card" role="dialog" aria-modal="true" aria-label="'+esc(hname(h))+'"><h3>'+esc(hname(h))+'</h3><div class="note" style="margin:-2px 0 12px">'+esc(when)+(h.joint?' · shared by both of you':'')+'</div>'+body
    +'<div class="sticky-save" style="margin-top:14px"><button class="btn" data-act="sheetsave">Save</button>'+(cur!=null?'<button class="btn alt" data-act="sheetclear">Clear</button>':'')+'<button class="btn alt" data-act="sheetclose">Cancel</button></div></div>';
  el.hidden=false;
  trDom();
  const f=$('#sheet-num');if(f&&!f.value)setTimeout(()=>{try{f.focus()}catch(e){}},50);
}
/* ---------- money screens: expense sheet, fixed payments, budgets ---------- */
function collectSf(){
  const sh=ui.sheet;if(!sh)return;const el=$('#sheet');if(!el||el.hidden)return;
  const f=sh.f||(sh.f={});
  el.querySelectorAll('[data-sf]').forEach(n=>{f[n.dataset.sf]=n.type==='checkbox'?n.checked:n.value});
}
const sfv=(sh,k,d)=>(sh.f&&sh.f[k]!==undefined)?sh.f[k]:(d===undefined?'':d);
function sfSet(k,v){const sh=ui.sheet;if(!sh)return;(sh.f||(sh.f={}))[k]=v;const n=document.querySelector('#sheet [data-sf="'+k+'"]');if(n){if(n.type==='checkbox')n.checked=!!v;else n.value=v}}
function sheetShell(label,inner,cls){if(ui.sheet&&ui.sheet.page)return '<div class="sheet-card exp-sheet mpage-card '+(cls||'')+'">'+inner+'</div>';return '<div class="sheet-bg" data-act="sheetclose"></div><div class="sheet-card exp-sheet '+(cls||'')+'" role="dialog" aria-modal="true" aria-label="'+esc(label)+'">'+inner+'</div>'}
function tyTag(x){return x.ty==='r'?'<span class="tag-r">'+T2('Refund','مرتجع')+'</span>':x.ty==='i'?'<span class="tag-i">'+T2('Income','دخل')+'</span>':x.ty==='w'?'<span class="tag-w">'+T2('Cash out','سحب')+'</span>':(x.ty==='l'||x.ty==='p')?'<span class="tag-w">'+T2(tyTxt[x.ty][0],tyTxt[x.ty][1])+(x.ln?' · '+esc(x.ln):'')+'</span>':''}
const tyTxt={x:['Expense','مصروف'],r:['Refund','مرتجع'],i:['Income','دخل'],w:['Cash out','سحب'],l:['Lent','سلفة'],p:['Repaid','سداد'],b:['Bill','فاتورة']};
function lastAcSet(k){ui.lastAc=k;try{localStorage.setItem('istiqama.lastac',k||'')}catch(e){}}
/* bill payments made on one day, as list rows (read only: change them in Bills) */
function billDayRows(dstr){
  const out=[],ym0=ymOf(dstr);
  bud().fixed.forEach(f=>fxPays(ym0,f.k).forEach(q=>{if(q.d===dstr)out.push('<li class="exp-item exp-bill"><span class="dot" style="background:'+pcol(q.pid)+'" title="'+esc(pname(q.pid))+'"></span><span class="exp-main"><span class="exp-what"><span class="tag-w">'+T2('Bill','فاتورة')+'</span><span data-notr="1">'+esc(fxName(f))+'</span>'+(q.n?'<span data-notr="1">'+esc(q.n)+'</span>':'')+'</span></span><span class="exp-amt num">'+nf2(q.a)+' <small>'+fxCur(f)+'</small></span></li>')}));
  return out.join('');
}
const billNote=()=>'<div class="note">'+T2('Change or remove bill payments in Bills.','تعديل أو حذف دفعات الفواتير من صفحة الفواتير.')+'</div>';
function chipBtn(act,val,txt,sel,extra){return '<button type="button" class="chipbtn'+(sel?' sel':'')+(extra?' '+extra:'')+'" data-act="'+act+'" data-v="'+esc(val)+'" data-notr="1" aria-pressed="'+(!!sel)+'">'+esc(txt)+'</button>'}
function renderExpSheet(el,sh,h){
  const fid=document.activeElement&&document.activeElement.id;
  const sc0=window.scrollY,cardEl=el.querySelector('.sheet-card'),card0=cardEl?cardEl.scrollTop:0,first=!sh.shown;sh.shown=true;
  const f=k=>sfv(sh,k);
  sh.ty=sh.ty||'x';sh.cur=sh.cur||'EGP';
  if(sh.ac===undefined)sh.ac=ui.lastAc||'';
  const list=expList(sh.d,h,h.joint?null:sh.pid);
  const parts=dayParts(list),limit=spLim(sh.d),over=parts.day>limit,cur=esc(S.currency);
  const isToday=sameDay(pd(sh.d),today());
  const when=isToday?T2('Today','اليوم'):fmtLong.format(pd(sh.d));
  const pct=limit>0?clamp(parts.day/limit,0,1):0;
  const subs=(h.joint&&h.who.length>1)?h.who.map(pid=>{const s=r2(list.filter(x=>x.pid===pid&&eDaily(x)).reduce((t,x)=>t+eNet(x),0));return '<span class="exp-sub"><span class="dot" style="background:'+pcol(pid)+'"></span><span data-notr="1">'+esc(pname(pid))+'</span> <b class="num">'+nf2(s)+'</b></span>'}).join(''):'';
  const bar=limit>0?'<div class="exp-bar" aria-hidden="true"><i style="width:'+Math.round(pct*100)+'%"></i></div><div class="exp-total-foot">'+stBadge(!over,T2('Within the limit','ضمن الحد'),T2('Over the limit','فوق الحد'))+'<span>'+T2('limit ','الحد ')+nf(limit)+' '+cur+(over?T2(' · over by ',' · تجاوز ')+nf2(parts.day-limit):T2(' · left ',' · المتبقي ')+nf2(limit-parts.day))+'</span></div>':'';
  const head='<h3>'+esc(isToday?hname(h):T2('Log spend','سجّل المصروفات'))+'</h3><div class="note" style="margin:-2px 0 12px">'+esc(when)+(h.joint?' · '+T2('shared by both of you','مشترك بينكما'):'')+'</div>';
  const totalCard='<div class="exp-total'+(over?' over':'')+'"><div class="exp-total-top"><span class="exp-total-lbl">'+T2('Counts toward the daily limit','المحسوب ضمن الحد اليومي')+'</span><span class="exp-total-num num">'+nf2(parts.day)+' <small>'+cur+'</small></span></div>'
    +bar
    +(parts.other?'<div class="note exp-other">'+T2('Outside the daily limit (not counted): ','خارج الحد اليومي (غير محسوب): ')+'<b class="num">'+nf2(parts.other)+'</b> '+cur+'</div>':'')
    +(parts.inc?'<div class="note exp-other">'+T2('Income logged: ','دخل متسجّل: ')+'<b class="num">'+nf2(parts.inc)+'</b> '+cur+'</div>':'')
    +(isToday&&!list.length?'<div class="note exp-hint">'+T2('Add each expense when it happens. The total adds up by itself and a new day starts at midnight.','سجّل كل مصروف عند حدوثه. يُجمع الإجمالي تلقائيًا ويبدأ يوم جديد عند منتصف الليل.')+'</div>':'')
    +(subs?'<div class="exp-subs">'+subs+'</div>':'')+'</div>';
  let body;
  if(sh.edit){
    body=catEditorHtml(sh)+'<div class="sticky-save"><button type="button" class="btn alt" data-act="expcatsedit">'+T2('Back','رجوع')+'</button></div>';
  }else{
    const editing=!!sh.eid;
    const ty=sh.ty;
    const tySeg='<div class="pill-seg exp-ty" role="group" aria-label="'+esc(T2('Type','النوع'))+'">'+(editing?['x','r','i','w','l','p']:['x','r','i','w','l','p','b']).map(k=>'<button type="button" data-act="expty" data-v="'+k+'" aria-pressed="'+(ty===k)+'">'+T2(tyTxt[k][0],tyTxt[k][1])+'</button>').join('')+'</div>';
    const curSeg='<div class="chips exp-cur" role="group" aria-label="'+esc(T2('Paid in','العملة'))+'">'+['EGP','SAR','AED','USD'].map(c=>chipBtn('expcur',c,c,sh.cur===c)).join('')+'</div>';
    const amtN=parseFloat(f('amt'));
    const conv=(sh.cur!=='EGP'&&!isNaN(amtN)&&amtN>0)?'<div class="note exp-conv">= <b class="num">'+nf2(toEgp(amtN,sh.cur,shYm(sh)))+'</b> EGP · 1 '+sh.cur+' = '+nf2(rateOf(sh.cur,shYm(sh)))+' EGP'+(canEditBud()?'':'')+'</div>':(sh.cur!=='EGP'&&!rateOf(sh.cur)?'<div class="note exp-conv bad">'+T2('Set the '+sh.cur+' rate in Budgets first.','حدّد سعر '+sh.cur+' في الميزانيات أولًا.')+'</div>':'');
    let cats='',subRow='';
    if(!eSkip({ty:ty})&&ty!=='b'){
      const vis=expCats();const all=vis.slice();
      if(sh.cat&&!all.some(c=>c.k===sh.cat)&&catOf(sh.cat))all.push(catOf(sh.cat));
      cats='<div class="exp-lbl">'+T2('Category','الفئة')+'</div><div class="chips exp-cats" role="group" aria-label="'+esc(T2('Category','الفئة'))+'">'+all.map(c=>{const l=lineOf(c.bl);const out=!(l&&l.dl)||(c.oo&&!bud().ooin);return chipBtn('expcat',c.k,catName(c.k)+(c.oo?' · '+T2('one-off','لمرة واحدة'):''),sh.cat===c.k,out?'out':'')}).join('')+'<button type="button" class="chipbtn exp-editcats" data-act="expcatsedit">'+T2('Edit categories','عدّل الفئات')+'</button></div>';
      const c0=catOf(sh.cat);
      if(c0&&(c0.sub||[]).length>1)subRow='<div class="exp-lbl">'+T2('Sub-category','الفئة الفرعية')+'</div><div class="chips exp-subcats" role="group">'+c0.sub.map(s=>chipBtn('expsc',s.k,(ui.lang==='ar'&&s.ar)?s.ar:s.en,sh.sc===s.k)).join('')+'</div>';
    }
    let lk='';
    if(ty==='r'){
      const opts=[];
      for(let i=0;i<75;i++){
        const d=ds(addDays(pd(sh.d),-i));
        expList(d,h,null).forEach(x=>{if(x.ty==='x')opts.push({k:d+'|'+x.id,d:d,x:x})});
        if(opts.length>=60)break;
      }
      lk=!opts.length?'<div class="note exp-lknone">'+T2('No earlier expense to link yet. The refund will simply reduce its category.','لا يوجد مصروف سابق لربطه بعد. سيُخصم المرتجع من فئته مباشرة.')+'</div>':'<label class="f">'+T2('Refund of (optional)','مرتجع عن (اختياري)')+'<select class="in" id="exp-lk" data-sf="lk"><option value="">'+T2('Not linked (just reduce the category)','بدون ربط (يُخصم من الفئة فقط)')+'</option>'
        +opts.map(o=>'<option value="'+esc(o.k)+'"'+(f('lk')===o.k?' selected':'')+'>'+esc(fmtShort.format(pd(o.d))+' · '+(o.x.n||catName(o.x.c)||T2('Expense','مصروف'))+' · '+nf2(o.x.cur?o.x.oa:o.x.a)+' '+(o.x.cur||'EGP'))+'</option>').join('')+'</select></label>';
    }
    let loanF='';
    if(ty==='l'||ty==='p'){
      const ls=loanList(),cur0=String(f('loan')||'').trim().toLowerCase();
      loanF='<label class="f">'+T2('Who is the loan with?','السلفة مع مين؟')+'<input class="in" id="exp-loan" data-sf="loan" type="text" maxlength="40" value="'+esc(f('loan'))+'" placeholder="'+esc(T2('e.g. Ahmed, or Car loan','مثلًا: أحمد، أو سلفة السيارة'))+'"></label>'
        +(ls.length?'<div class="chips exp-loans" role="group" aria-label="'+esc(T2('Existing loans','السلف الحالية'))+'">'+ls.map(l=>chipBtn('exploan',l.name,l.name+(l.out>0?' · '+nf(l.out):''),cur0===l.key)).join('')+'</div>':'');
    }
    let billPick='',billCur='';
    if(ty==='b'){
      const bym=ymOf(sh.d),fl=bud().fixed.filter(f=>fxActive(f,bym)),gs={};
      fl.forEach(f=>{(gs[f.g]=gs[f.g]||[]).push(f)});
      const bf=fl.find(f=>f.k===sh.bill);if(bf)billCur=fxCur(bf);
      billPick='<div class="exp-lbl">'+T2('Which bill?','أي فاتورة؟')+'</div>'
        +Object.keys(gs).map(g=>'<div class="note exp-bgrp">'+esc((GRP[g]||[g,g])[ui.lang==='ar'?1:0])+'</div><div class="chips exp-bills" role="group">'+gs[g].map(f=>chipBtn('expbill',f.k,fxName(f)+(fxCur(f)!=='EGP'?' · '+fxCur(f):''),sh.bill===f.k)).join('')+'</div>').join('')
        +(bf?(()=>{const s0=fxState(bf,bym);return '<div class="note exp-conv">'+T2('Planned ','المخطط ')+'<b class="num">'+nf2(s0.exp)+'</b> '+billCur+' · '+T2('paid so far ','المدفوع حتى الآن ')+'<b class="num">'+nf2(s0.paid)+'</b>'+(s0.exp>0&&s0.diff>0?' · '+T2('left ','المتبقي ')+'<b class="num">'+nf2(s0.diff)+'</b>':'')+'</div>'})():'');
      const an=parseFloat(f('amt'));
      if(bf&&billCur!=='EGP'&&!isNaN(an)&&an>0)billPick+='<div class="note exp-conv">= <b class="num">'+nf2(toEgp(an,billCur,shYm(sh)))+'</b> EGP</div>';
    }
    const acs='<div class="exp-lbl">'+((ty==='w'||ty==='l')?T2('From account (optional)','من حساب (اختياري)'):ty==='p'?T2('Into account (optional)','إلى حساب (اختياري)'):T2('Paid with (optional)','طريقة الدفع (اختياري)'))+'</div><div class="chips exp-accts" role="group">'+bud().accts.map(a=>chipBtn('expac',a.k,acctName(a.k),sh.ac===a.k)).join('')+'</div>';
    const dv=sh.eid?String(sfv(sh,'ed',sh.d)):sh.d,atToday=dv>=ds(today());
    const ds0='<div class="f exp-dategrp"><label for="exp-date">'+T2('Date','التاريخ')+(sh.eid?'':' <small class="muted">'+T2('(use the arrows or the calendar to add for another day)','(استخدم الأسهم أو التقويم لإضافة مصروف ليوم آخر)')+'</small>')+'</label><div class="exp-datenav"><button type="button" class="iconbtn" data-act="expday" data-n="-1" aria-label="'+esc(T2('Previous day','اليوم السابق'))+'">'+svgi('chl')+'</button><input class="in" type="date" id="exp-date" data-sf="ed" value="'+esc(dv)+'" max="'+esc(ds(today()))+'"><button type="button" class="iconbtn" data-act="expday" data-n="1" aria-label="'+esc(T2('Next day','اليوم التالي'))+'"'+(atToday?' disabled':'')+'>'+svgi('chr')+'</button></div></div>';
    const lbl=ty==='i'?T2('Where from (optional)','المصدر (اختياري)'):(ty==='w'||ty==='l'||ty==='p'||ty==='b')?T2('Note (optional)','ملاحظة (اختياري)'):T2('Merchant or note (optional)','المحل أو ملاحظة (اختياري)');
    const addTxt=editing?T2('Save changes','احفظ التعديل'):(ty==='b'?T2('Add bill payment','أضف دفعة فاتورة'):ty==='r'?T2('Add refund','أضف مرتجع'):ty==='i'?T2('Add income','أضف دخل'):ty==='w'?T2('Add withdrawal / transfer','أضف سحبًا / تحويلًا'):ty==='l'?T2('Add loan','أضف سلفة'):ty==='p'?T2('Add repayment','أضف سداد'):T2('Add expense','أضف مصروف'));
    const rows=list.slice().reverse().map(x=>{
      const nm=(x.c&&catName(x.c))?'<b data-notr="1">'+esc(catName(x.c))+(x.sc?' · '+esc(subName(x.c,x.sc)):'')+'</b>':'';
      const note=x.n?'<span data-notr="1">'+esc(expNote(x.n))+'</span>':'';
      const tag=tyTag(x);
      const meta=[x.ac?acctName(x.ac):'',x.t>1?timeFmt.format(new Date(x.t)):'',x.cur?nf2(x.oa)+' '+x.cur:''].filter(Boolean).join(' · ');
      return '<li class="exp-item'+(sh.eid===x.id?' editing':'')+'"><span class="dot" style="background:'+pcol(x.pid)+'" title="'+esc(pname(x.pid))+'"></span>'
        +'<button type="button" class="exp-main exp-edit" data-act="expedit" data-p="'+x.pid+'" data-id="'+esc(x.id)+'" aria-label="'+esc(T2('Edit this entry','عدّل هذا المصروف'))+'"><span class="exp-what">'+tag+nm+note+(!nm&&!note&&!tag?'<span class="muted">'+T2('Expense','مصروف')+'</span>':'')+'</span><small class="muted exp-time" data-notr="1">'+esc(meta)+'</small></button>'
        +'<span class="exp-amt num'+(x.ty==='r'?' neg':(x.ty==='i'||x.ty==='p')?' pos':'')+'">'+(x.ty==='r'||x.ty==='l'?'−':(x.ty==='i'||x.ty==='p')?'+':'')+nf2(x.a)+'</span>'
        +'<button type="button" class="iconbtn exp-del" data-act="expdel" data-p="'+x.pid+'" data-id="'+esc(x.id)+'" aria-label="'+esc(T2('Delete this entry','احذف هذا المصروف'))+'">'+svgi('minus','',3)+'</button></li>';
    }).join('');
    const billRows=billDayRows(sh.d);
    const none=(isToday&&!list.some(x=>!eSkip(x)))?'<button type="button" class="btn alt exp-none" data-act="expnone">'+T2('Nothing spent today','لم أصرف شيئًا اليوم')+'</button>':'';
    body='<div class="exp-form">'+ds0+'<label class="f">'+T2('Amount','المبلغ')+(billCur?' ('+billCur+')':'')+'<input class="in" id="exp-amt" data-sf="amt" type="number" inputmode="decimal" step="any" min="0" value="'+esc(f('amt'))+'" placeholder="0"></label>'
      +tySeg+(ty==='b'?billPick:'<div class="exp-lbl">'+T2('Paid in','العملة')+'</div>'+curSeg+conv)
      +lk+loanF+cats+subRow+(ty==='b'?'':acs)
      +'<label class="f">'+lbl+'<input class="in" id="exp-note" data-sf="note" type="text" maxlength="200" value="'+esc(f('note'))+'" placeholder="'+esc(ty==='i'?T2('e.g. client payment','مثلًا دفعة عميل'):ty==='w'?T2('e.g. ATM, or transfer to savings','مثلًا: ماكينة صراف، أو تحويل إلى المدخرات'):T2('e.g. Spinneys, taxi','مثلًا: سوبرماركت، تاكسي'))+'" autocomplete="off"></label>'
      +'<div class="sticky-save"><button type="button" class="btn" data-act="expadd">'+addTxt+'</button>'+(editing?'<button type="button" class="btn alt" data-act="expcancel">'+T2('Cancel edit','إلغاء التعديل')+'</button>':'<button type="button" class="btn alt" data-act="sheetclose">'+T2('Done','تم')+'</button>')+'</div>'+none+'</div>'
      +((rows||billRows)?'<h4 class="exp-lh">'+(isToday?T2('Added today','أُضيف اليوم'):T2('Added on this day','أُضيف في هذا اليوم'))+' <small class="muted">'+T2('(tap one to edit)','(اضغط على أي واحد لتعديله)')+'</small></h4><ul class="exp-list">'+rows+billRows+'</ul>'+(billRows?billNote():''):'<div class="note exp-empty">'+T2('Nothing added yet.','لم يُضف شيء بعد.')+'</div>');
  }
  el.innerHTML=sheetShell(hname(h),head+totalCard+body);
  el.hidden=false;
  trDom();
  const c1=el.querySelector('.sheet-card');if(c1)c1.scrollTop=card0;
  window.scrollTo(0,sc0);
  const fo=fid&&document.getElementById(fid)||(first&&!sh.edit?$('#exp-amt'):null);
  if(fo)setTimeout(()=>{try{fo.focus({preventScroll:true})}catch(e){}},30);
}
/* values typed in the form, converted to EGP; null when something is missing */
function expFormValues(sh){
  const amtIn=parseFloat(sfv(sh,'amt'));
  if(isNaN(amtIn)||amtIn<=0){toast(T2('Enter an amount.','اكتب المبلغ.'));const a=$('#exp-amt');if(a)a.focus();return null}
  const cur=sh.cur||'EGP';
  if(cur!=='EGP'&&!rateOf(cur,shYm(sh))){toast(T2('Set the '+cur+' rate in Budgets first.','حدّد سعر '+cur+' في الميزانيات أولًا.'));return null}
  const note=String(sfv(sh,'note')||'').trim();
  if(noCard(note)){toast(T2('Please do not type card numbers here.','من فضلك لا تكتب أرقام البطاقات هنا.'));return null}
  const ty=sh.ty||'x';
  const o={a:cur==='EGP'?amtIn:toEgp(amtIn,cur,shYm(sh)),oa:amtIn,cur:cur,ty:ty,n:note,ac:sh.ac||''};
  if(!eSkip({ty:ty})){o.c=sh.cat||'';o.sc=sh.sc||''}else{o.c='';o.sc=''}
  if(ty==='l'||ty==='p'){const ln=String(sfv(sh,'loan')||'').trim();if(!ln){toast(T2('Write who the loan is with.','اكتب السلفة مع مين.'));const a=$('#exp-loan');if(a)a.focus();return null}o.ln=ln}
  const lk=ty==='r'?String(sfv(sh,'lk')||''):'';
  if(lk){const p=lk.split('|');o.ld=p[0];o.lk=p[1]}
  return o;
}
function expAddFromSheet(){
  const sh=ui.sheet;if(!sh||sh.type!=='exp'||sh.edit)return;
  const h=S.habits.find(x=>x.id===sh.hid);if(!h)return;
  collectSf();
  if(sh.ty==='b'&&!sh.eid){expAddBill(sh);return}
  const o=expFormValues(sh);if(!o)return;
  if(sh.eid){
    const nd=String(sfv(sh,'ed',sh.d))||sh.d;
    expUpdate(sh.epid,h,sh.d,sh.eid,o,nd);
    sh.eid=null;sh.epid=null;sh.d=nd;
  }else{
    const nd=String(sfv(sh,'ed',sh.d)||sh.d);
    const okd=/^\d{4}-\d{2}-\d{2}$/.test(nd)&&nd<=ds(today())?nd:sh.d;
    expAdd(sh.pid,h,okd,o);sh.d=okd;
    if(okd!==ds(today()))toast(T2('Added to ','أُضيف إلى ')+fmtLong.format(pd(okd)));
  }
  if(o.ac)lastAcSet(o.ac);
  /* the next entry starts clean (keeps type, account, currency) */
  sfSet('amt','');sfSet('note','');sfSet('lk','');sfSet('ed',sh.d);
  sh.cat='';sh.sc='';sh.cur='EGP';
  const sc=window.scrollY;render();window.scrollTo(0,sc);
  const fo=$('#exp-amt');if(fo)setTimeout(()=>{try{fo.focus()}catch(e){}},30);
}
/* a bill payment logged from the Log goes into the same bill records as the Bills page, so nothing is counted twice */
function expAddBill(sh){
  const f=bud().fixed.find(x=>x.k===sh.bill);
  if(!f){toast(T2('Pick the bill first.','اختر الفاتورة أولًا.'));return}
  const amt=parseFloat(sfv(sh,'amt'));
  if(isNaN(amt)||amt<=0){toast(T2('Enter an amount.','اكتب المبلغ.'));const a=$('#exp-amt');if(a)a.focus();return}
  const note=String(sfv(sh,'note')||'').trim();
  if(noCard(note)){toast(T2('Please do not type card numbers here.','من فضلك لا تكتب أرقام البطاقات هنا.'));return}
  const nd=String(sfv(sh,'ed',sh.d)||sh.d),okd=/^\d{4}-\d{2}-\d{2}$/.test(nd)&&nd<=ds(today())?nd:sh.d;
  fxAdd(f.k,ymOf(okd),okd,amt,note);sh.d=okd;
  toast(T2('Bill payment added: ','تمت إضافة دفعة: ')+fxName(f)+' · '+nf2(amt)+' '+fxCur(f));
  sfSet('amt','');sfSet('note','');sfSet('ed',sh.d);
  const sc=window.scrollY;render();window.scrollTo(0,sc);
  const fo=$('#exp-amt');if(fo)setTimeout(()=>{try{fo.focus()}catch(e){}},30);
}
function expPickDate(v){
  const sh=ui.sheet;if(!sh||sh.eid)return;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(v||'')||v>ds(today())){toast(T2('Pick a day up to today.','اختر يومًا حتى اليوم.'));renderSheet();return}
  collectSf();sh.d=v;sfSet('ed',v);renderSheet();
}
function expStartEdit(pid,id){
  const sh=ui.sheet;if(!sh)return;const h=S.habits.find(x=>x.id===sh.hid);if(!h)return;
  const x=expList(sh.d,h,null).find(y=>y.id===id&&y.pid===pid);if(!x)return;
  collectSf();
  sh.eid=id;sh.epid=pid;sh.ty=x.ty;sh.cat=x.c;sh.sc=x.sc;sh.ac=x.ac;sh.cur=x.cur||'EGP';
  sfSet('amt',String(x.cur?x.oa:x.a));sfSet('note',x.n==='Earlier total'?'':x.n);sfSet('ed',sh.d);sfSet('lk',x.lk?x.ld+'|'+x.lk:'');sfSet('loan',x.ln||'');
  renderSheet();
}
function expCancelEdit(){const sh=ui.sheet;if(!sh)return;sh.eid=null;sh.epid=null;sh.cat='';sh.sc='';sh.cur='EGP';sh.ty='x';sfSet('amt','');sfSet('note','');sfSet('loan','');renderSheet()}
/* when a refund is linked to an original entry, copy the useful fields */
function expLinkChosen(v){
  const sh=ui.sheet;if(!sh)return;const h=S.habits.find(x=>x.id===sh.hid);if(!h)return;
  sfSet('lk',v);if(!v){renderSheet();return}
  const p=v.split('|');const x=findEntry(p[0],h,p[1]);if(!x){renderSheet();return}
  sh.cat=x.c;sh.sc=x.sc;sh.ac=x.ac||sh.ac;sh.cur=x.cur||'EGP';
  if(!parseFloat(sfv(sh,'amt')))sfSet('amt',String(x.cur?x.oa:x.a));
  if(!sfv(sh,'note'))sfSet('note',x.n==='Earlier total'?'':x.n);
  renderSheet();
}
/* ---------- category editor (used inside the expense sheet and the budgets screen) ---------- */
function catEditorHtml(sh){
  const f=k=>sfv(sh,k);
  const can=canEditBud();
  const byLine=bud().lines.map(l=>{
    const cs=bud().cats.filter(c=>c.bl===l.k);if(!cs.length)return '';
    return '<div class="ce-line" data-notr="1">'+esc(lname(l))+'</div><div class="chips exp-cats" role="group">'+cs.map(c=>chipBtn(can?'expcattoggle':'noop',c.k,catName(c.k)+((c.sub||[]).length>1?' ('+c.sub.length+')':'')+(c.oo?' · '+T2('one-off','لمرة واحدة'):''),c.on!==false)).join('')+'</div>';
  }).join('');
  if(!can)return '<div class="exp-catedit"><div class="note">'+T2('Only Muhammed changes the categories.','محمد هو من يعدّل الفئات.')+'</div>'+byLine+'</div>';
  const lineOpts=bud().lines.map(l=>'<option value="'+esc(l.k)+'"'+(f('cl')===l.k||(!f('cl')&&l.k==='living')?' selected':'')+' data-notr="1">'+esc(lname(l))+'</option>').join('');
  const catOpts=bud().cats.map(c=>'<option value="'+esc(c.k)+'"'+(f('sc-c')===c.k?' selected':'')+' data-notr="1">'+esc(catName(c.k))+'</option>').join('');
  return '<div class="exp-catedit"><div class="note">'+T2('Tap a category to show or hide it. Past expenses keep their category.','اضغط على الفئة لإظهارها أو إخفائها. تبقى المصاريف القديمة في فئاتها.')+'</div>'+byLine
    +'<div class="exp-addcat"><h4 class="exp-lh">'+T2('Add a category','أضف فئة')+'</h4>'
    +'<label class="f">'+T2('Name','الاسم')+'<input class="in" id="cat-new" data-sf="cn" type="text" maxlength="30" value="'+esc(f('cn'))+'" placeholder="'+esc(T2('e.g. Pets','مثلًا حيوانات أليفة'))+'" autocomplete="off"></label>'
    +'<label class="f">'+T2('Arabic name (optional)','الاسم بالعربي (اختياري)')+'<input class="in" id="cat-new-ar" data-sf="can" type="text" maxlength="30" dir="rtl" value="'+esc(f('can'))+'" autocomplete="off"></label>'
    +'<label class="f">'+T2('Budget line','بند الميزانية')+'<select class="in" data-sf="cl">'+lineOpts+'</select></label>'
    +'<label class="chk-line"><input type="checkbox" data-sf="coo"'+(f('coo')===true?' checked':'')+'> '+T2('One-off (not part of the normal month)','لمرة واحدة (ليست من الشهر العادي)')+'</label>'
    +'<div class="sticky-save"><button type="button" class="btn" data-act="expcatadd">'+T2('Add category','أضف الفئة')+'</button></div>'
    +'<h4 class="exp-lh">'+T2('Add a sub-category','أضف فئة فرعية')+'</h4>'
    +'<label class="f">'+T2('Under','تحت')+'<select class="in" data-sf="sc-c">'+catOpts+'</select></label>'
    +'<label class="f">'+T2('Name','الاسم')+'<input class="in" data-sf="sn" type="text" maxlength="30" value="'+esc(f('sn'))+'" autocomplete="off"></label>'
    +'<label class="f">'+T2('Arabic name (optional)','الاسم بالعربي (اختياري)')+'<input class="in" data-sf="san" type="text" maxlength="30" dir="rtl" value="'+esc(f('san'))+'" autocomplete="off"></label>'
    +'<div class="sticky-save"><button type="button" class="btn" data-act="expsubadd">'+T2('Add sub-category','أضف الفئة الفرعية')+'</button></div></div></div>';
}
function catAdd(){
  const sh=ui.sheet;if(!sh)return;collectSf();
  const nm=String(sfv(sh,'cn')).trim(),ar=String(sfv(sh,'can')).trim();
  if(!nm&&!ar){toast(T2('Give the category a name first.','اكتب اسم الفئة أولًا.'));return}
  const low=(nm||ar).toLowerCase();
  if(bud().cats.some(c=>String(c.en||'').toLowerCase()===low||String(c.ar||'').toLowerCase()===low)){toast(T2('That category already exists.','هذه الفئة موجودة.'));return}
  budEnsure();
  B.cats.push({k:'c_'+Date.now().toString(36),en:nm||ar,ar:ar,bl:sfv(sh,'cl')||'living',on:true,sub:[],custom:true,oo:sfv(sh,'coo')===true?1:0});
  budSave();sfSet('cn','');sfSet('can','');sfSet('coo',false);toast(T2('Category added.','تمت إضافة الفئة.'));renderSheet();
}
function subAdd(){
  const sh=ui.sheet;if(!sh)return;collectSf();
  const ck=sfv(sh,'sc-c')||(bud().cats[0]||{}).k;const nm=String(sfv(sh,'sn')).trim(),ar=String(sfv(sh,'san')).trim();
  if(!ck||(!nm&&!ar)){toast(T2('Give the sub-category a name first.','اكتب اسم الفئة الفرعية أولًا.'));return}
  budEnsure();const c=B.cats.find(x=>x.k===ck);if(!c)return;c.sub=c.sub||[];
  const low=(nm||ar).toLowerCase();
  if(c.sub.some(s=>String(s.en||'').toLowerCase()===low)){toast(T2('That sub-category already exists.','هذه الفئة الفرعية موجودة.'));return}
  c.sub.push({k:'s_'+Date.now().toString(36),en:nm||ar,ar:ar});
  budSave();sfSet('sn','');sfSet('san','');toast(T2('Sub-category added.','تمت إضافة الفئة الفرعية.'));renderSheet();
}
/* ---------- fixed monthly payments ---------- */
function openFix(){ui.fxDel=null;ui.fxUndo=null;ui.sheet={type:'fix',f:{},ym:ymOf(ds(today())),mode:null,k:null};$('#sheet').innerHTML='';renderSheet()}
const TRI=['EGP','SAR','AED'];
function triOthers(amt,cur,ym){const egp=toEgp(Number(amt)||0,cur,ym);return TRI.filter(c=>c!==cur&&rateOf(c,ym)>0).map(c=>nf(egp/rateOf(c,ym))+' '+c).join(' · ')}
function renderFixSheet(el,sh){
  const ym=sh.ym,nowYm=ymOf(ds(today()));
  const a=ym.split('-'),md=new Date(+a[0],+a[1]-1,1);
  const can=canEditBud();
  const nav='<div class="datenav fx-nav"><button class="iconbtn" data-act="fxmo" data-n="-1" aria-label="'+esc(T2('Previous month','الشهر الماضي'))+'">'+svgi('chl')+'</button><div style="flex:1;min-width:0;text-align:center"><h2>'+esc(fmtMonLong.format(md))+'</h2></div><button class="iconbtn" data-act="fxmo" data-n="1" aria-label="'+esc(T2('Next month','الشهر القادم'))+'"'+(ym>=prevYm(nowYm,-6)?' disabled':'')+'>'+svgi('chr')+'</button></div>';
  const sm=fxSummary(ym);
  const summary='<div class="note fx-sum">'+T2(sm.paid+' of '+sm.n+' settled'+(sm.part?' · '+sm.part+' partly paid':'')+(sm.over?' · '+sm.over+' overdue':'')+(sm.soon?' · '+sm.soon+' due within a week':''),sm.paid+' من '+sm.n+' مسدّدة'+(sm.part?' · '+sm.part+' مدفوعة جزئيًا':'')+(sm.over?' · '+sm.over+' متأخرة':'')+(sm.soon?' · '+sm.soon+' مستحقة خلال أسبوع':''))+'</div>';
  const groups=['eg','uae','loan'].map(g=>{
    const items=bud().fixed.filter(f=>f.g===g&&fxActive(f,ym));if(!items.length)return '';
    const cur=GRP[g][2];
    let planned=0,paidSum=0,paidN=0;
    items.forEach(f=>{const s=fxState(f,ym);planned+=fxAmt(f,ym);paidSum+=s.paid;if(s.st==='paid'||s.st==='closed')paidN++});
    const gsum=g==='loan'?T2(paidN+' of '+items.length+' settled',paidN+' من '+items.length+' مسدّدة'):T2('paid ','المدفوع ')+'\u2066'+nf(paidSum)+' / '+nf(planned)+' '+cur+'\u2069';
    const GB=fxBalance(ym).g[g]||{s:0,o:0,se:0,oe:0},gcur=g==='loan'?'EGP':cur,gS=g==='loan'?GB.se:GB.s,gO=g==='loan'?GB.oe:GB.o;
    const gb=fxRes(gS-gO,gcur);
    const gpct=(g==='loan')?(items.length?Math.round(paidN/items.length*100):0):(planned>0?Math.min(100,Math.round(paidSum/planned*100)):0);
    let foot='';
    if(g==='uae'){
      const fund=Number((bud().uae||{}).fund)||0;
      let tot=0;items.forEach(f=>{const s=fxState(f,ym);tot+=(s.st==='paid'||s.st==='closed'||s.st==='partial')?Math.max(s.paid,s.st==='partial'?fxAmt(f):0):fxAmt(f)});
      foot='<div class="fx-foot">'+T2('Siblings fund '+nf(fund)+' AED a month. You cover the gap: ','يحوّل الإخوة '+nf(fund)+' درهمًا شهريًا. وأنت تغطي الفرق: ')+'<b class="num">'+nf(Math.max(0,tot-fund))+' AED</b></div>';
    }
    const rank={overdue:0,soon:1,partial:1,later:2,noday:3,paid:4,closed:4};
    const sorted=items.map((f,i)=>({f:f,i:i,r:rank[fxState(f,ym).st]})).sort((x,y)=>x.r-y.r||x.i-y.i).map(x=>x.f);
    const rows=sorted.map(f=>{
      const s=fxState(f,ym),c=fxCur(f),am=fxAmt(f,ym),stCls=s.st;
      let stTxt='',stX='';
      if(s.st==='paid'){stTxt=T2('Paid in full','مدفوعة بالكامل');if(s.diff<-0.5)stX=' · <b class="fx-bad">'+T2('over by ','أكثر بـ ')+nfc(-s.diff,c)+'</b>'}
      else if(s.st==='closed'){stTxt=T2('Closed','مغلقة');if(s.diff>0.5)stX=' · <b class="fx-good">'+T2('saved ','وفّرتم ')+nfc(s.diff,c)+'</b>';else if(s.diff<-0.5)stX=' · <b class="fx-bad">'+T2('over by ','زادت ')+nfc(-s.diff,c)+'</b>'}
      else if(s.st==='partial')stTxt=T2('Partly paid · left ','مدفوعة جزئيًا · المتبقي ')+nfc(s.left,c);
      else if(s.st==='overdue')stTxt=s.n?T2('Overdue by '+s.n+(s.n===1?' day':' days'),'متأخرة '+s.n+(s.n===1?' يوم':' أيام')):T2('Overdue','متأخرة');
      else if(s.st==='soon')stTxt=s.n===0?T2('Due today','مستحقة اليوم'):T2('Due in '+s.n+(s.n===1?' day':' days'),'مستحقة بعد '+s.n+(s.n===1?' يوم':' أيام'));
      else if(s.st==='later')stTxt=T2('Due on day '+s.day,'مستحقة يوم '+s.day);
      else stTxt=T2('Nothing paid yet','لم يُدفع شيء بعد');
      const note=fxNote(f);
      const open=sh.k===f.k;
      const pct=s.exp>0?Math.min(100,Math.round(s.paid/s.exp*100)):(s.paid>0?100:0);
      const bar=(s.paid>0&&s.exp>0)?'<span class="fx-bar'+(s.diff<-0.5?' over':(s.st==='closed'&&s.diff>0.5?' saved':''))+'" role="img" aria-label="'+esc(nf(s.paid)+' / '+nf(s.exp))+'"><i style="width:'+pct+'%"></i></span>':'';
      const cf=ui.fxDel&&ui.fxDel.k===f.k?ui.fxDel.i:null,un=ui.fxUndo&&ui.fxUndo.k===f.k&&ui.fxUndo.ym===sh.ym?ui.fxUndo:null;
      const payRows=s.pays.map(q=>'<li'+(cf===q.i?' class="fx-confirm"':(open&&sh.mode==='pay'&&sh.pi===q.i?' class="fx-editing"':''))+'><button type="button" class="fx-pedit" data-act="fxeditpay" data-k="'+esc(f.k)+'" data-i="'+esc(q.i)+'" title="'+esc(T2('Tap to edit this payment','اضغط لتعديل هذه الدفعة'))+'" data-notr="1"><span class="fx-pl"><i class="fx-pd">'+esc(fmtShort.format(pd(q.d)))+'</i>'+(q.n?'<em class="fx-pn" title="'+esc(q.n)+'">'+esc(q.n)+'</em>':'')+'</span><small>'+T2('Edit','تعديل')+'</small></button><b class="num">'+nfc(q.a,c)+'</b>'
        +(cf===q.i?'<span class="fx-conf"><button type="button" class="chipbtn fx-rm" data-act="fxdelok" data-k="'+esc(f.k)+'" data-i="'+esc(q.i)+'">'+T2('Remove it','احذفها')+'</button><button type="button" class="chipbtn" data-act="fxdelno">'+T2('Keep','أبقِها')+'</button></span>'
          :'<button type="button" class="fx-x" data-act="fxdelpay" data-k="'+esc(f.k)+'" data-i="'+esc(q.i)+'" aria-label="'+esc(T2('Remove this payment','احذف هذه الدفعة'))+'">×</button>')+'</li>');
      if(un)payRows.push('<li class="fx-undo"><span>'+T2('Removed ','تم حذف ')+un.list.map(g=>nfc(g.q.a,c)).join(' + ')+'</span><button type="button" class="chipbtn" data-act="fxundo" data-k="'+esc(f.k)+'">'+T2('Undo','تراجع')+'</button></li>');
      const pays=payRows.length?'<ul class="fx-pays">'+payRows.join('')+'</ul>':'';
      let form='';
      if(open&&sh.mode==='pay'){
        const dflt=s.left>0?s.left:(s.paid>0?'':am);
        form='<div class="fx-form">'+(sh.pi?'<div class="note fx-editnote">'+T2('Editing this payment. Change the amount, date or note, then save.','تعديل هذه الدفعة. غيّر المبلغ أو التاريخ أو الملاحظة ثم احفظ.')+'</div>':'')+'<label class="f">'+T2('Amount','المبلغ')+' ('+c+')<input class="in" type="number" inputmode="decimal" step="any" min="0" data-sf="fa" value="'+esc(sfv(sh,'fa',String(dflt)))+'"></label>'
          +'<label class="f">'+T2('Paid on','تاريخ الدفع')+'<input class="in" type="date" data-sf="fd" value="'+esc(sfv(sh,'fd',ds(today())))+'" max="'+esc(ds(today()))+'"></label>'
          +'<label class="f">'+T2('Note (optional), for example top-up','ملاحظة (اختياري)، مثل شحن إضافي')+'<input class="in" type="text" maxlength="200" data-sf="fn" value="'+esc(sfv(sh,'fn',''))+'" autocomplete="off"></label>'
          +'<div class="sticky-save"><button type="button" class="btn" data-act="fxsave" data-k="'+esc(f.k)+'">'+(sh.pi?T2('Save changes','احفظ التعديل'):T2('Save payment','احفظ الدفعة'))+'</button><button type="button" class="btn alt" data-act="fxclose">'+T2('Cancel','إلغاء')+'</button></div></div>';
      }else if(open&&sh.mode==='edit'){
        form='<div class="fx-form"><label class="f">'+T2('Due day of the month (0 = none)','يوم الاستحقاق في الشهر (0 = بلا يوم)')+'<input class="in" type="number" inputmode="numeric" min="0" max="31" data-sf="fday" value="'+esc(sfv(sh,'fday',String(f.day||0)))+'"></label>'
          +(f.bl?'<div class="note">'+T2('The planned amount comes from the budget line. Change it in Budgets.','المبلغ المخطط مأخوذ من بند الميزانية. غيّره من الميزانيات.')+'</div>':'<label class="f">'+T2('Planned monthly amount','المبلغ الشهري المخطط')+' ('+c+')<input class="in" type="number" inputmode="decimal" step="any" min="0" data-sf="famt" value="'+esc(sfv(sh,'famt',String(f.amt)))+'"></label>')
          +'<div class="sticky-save"><button type="button" class="btn" data-act="fxeditsave" data-k="'+esc(f.k)+'">'+T2('Save','احفظ')+'</button><button type="button" class="btn alt" data-act="fxclose">'+T2('Cancel','إلغاء')+'</button></div></div>';
      }
      const rem=s.left>0?s.left:am;
      let btns='';
      if(s.st==='paid'){btns=''}
      else if(s.st==='closed'){btns='<button type="button" class="chipbtn" data-act="fxreopen" data-k="'+esc(f.k)+'">'+T2('Reopen','أعد الفتح')+'</button>'}
      else{
        btns='<button type="button" class="chipbtn pay1" data-act="fxquick" data-k="'+esc(f.k)+'">'+svgi('check','',3)+' '+(s.st==='partial'?T2('Pay the rest ','ادفع المتبقي '):T2('Paid ','تم دفع '))+'<b class="num">'+nf(rem)+'</b> '+c+'</button>'
          +'<button type="button" class="chipbtn" data-act="fxopen" data-k="'+esc(f.k)+'">'+T2('Add payment','أضف دفعة')+'</button>'
          +(s.st==='partial'?'<button type="button" class="chipbtn" data-act="fxbillclose" data-k="'+esc(f.k)+'" title="'+esc(T2('Nothing more will be paid this month. The difference counts as saved.','لن يُدفع شيء آخر هذا الشهر. الفرق يُحسب توفيرًا.'))+'">'+T2('No more to pay','لا دفع آخر')+'</button>':'');
      }
      if(s.st==='paid'||s.st==='closed')btns+=(s.st==='paid'?'<button type="button" class="chipbtn pay1" data-act="fxopen" data-k="'+esc(f.k)+'">'+T2('Add another payment','أضف دفعة أخرى')+'</button>':'');
      if(can)btns+='<button type="button" class="chipbtn" data-act="fxedit" data-k="'+esc(f.k)+'" title="'+esc(T2('Change the due day or planned amount','غيّر يوم الاستحقاق أو المبلغ المخطط'))+'">'+T2('Edit','تعديل')+'</button>';
      const other=triOthers(am,c,ym);
      const lft=Math.max(0,s.exp-s.paid);
      const fig=function(lb,v,cls){return '<div class="fx-fg'+(cls?' '+cls:'')+'"><small>'+lb+'</small><b class="num" dir="ltr">'+v+'</b></div>'};
      return '<li class="fx-item fx-'+stCls+'"><div class="fx-row"><div class="fx-main"><b class="fx-name" data-notr="1">'+esc(fxName(f))+'</b>'
        +'<span class="fx-meta muted" data-notr="1">'+(other?'<bdi dir="ltr">'+other+'</bdi>':'')+(f.day?(other?' · ':'')+T2('day '+f.day,'يوم '+f.day):'')+'</span>'
        +(note?'<span class="fx-bnote" title="'+esc(note)+'" data-notr="1">'+esc(note)+'</span>':'')+'</div>'
        +'<span class="fx-st fx-st-'+stCls+'">'+(s.st==='paid'||s.st==='closed'?svgi('check','',3):s.st==='overdue'?svgi('warn','',3):'')+esc(stTxt)+stX+'</span></div>'
        +'<div class="fx-figs">'+fig(T2('Planned','المخطط'),nfc(am,c))+fig(T2('Paid','المدفوع'),nfc(s.paid,c),s.paid>0?'ok':'')+fig(T2('Left','المتبقي'),nfc(lft,c),lft>0&&s.st==='overdue'?'bad':'')+'</div>'+bar+pays
        +'<span class="fx-btns">'+btns+'</span>'+form+'</li>';
    }).join('');
    return '<section class="fx-group fx-g-'+g+'"><div class="fx-gh"><h4><i class="fx-gdot"></i>'+T2(GRP[g][0],GRP[g][1])+'</h4><span class="fx-gsum num">'+esc(gsum)+'</span></div><div class="fx-gbar" role="img" aria-label="'+gpct+'%"><i style="width:'+gpct+'%"></i></div><div class="fx-gbal">'+gb+'</div><ul class="fx-list">'+rows+'</ul>'+foot+'</section>';
  }).join('');
  const inner='<h3>'+T2('Bills','الفواتير')+'</h3><details class="fx-help"><summary>'+T2('How bills work','كيف تعمل الفواتير')+'</summary><div class="note">'+T2('Tap Paid when you pay a bill. If you pay in parts, or top up later, tap Add payment as many times as you need: each payment is kept and added up. Tap a payment to edit it, or × to remove it (it asks first, and you can undo). If you pay less than planned and nothing more is due, tap No more to pay and the difference counts as saved. Paying more shows as over.','اضغط "تم دفع" عند سداد الفاتورة. وإذا دفعت على أجزاء أو بمبلغ مختلف اضغط "أضف دفعة" بقدر ما تحتاج: تُحفظ كل دفعة وتُجمع. واضغط على أي دفعة لتعديلها، أو × لحذفها (يسألك أولًا ويمكنك التراجع). وإذا دفعت أقل من المخطط ولا يوجد شيء آخر، اضغط "لا دفع آخر" وسيُحسب الفرق توفيرًا. ودفع الأكثر يظهر زيادة.')+'</div></details>'
    +nav+summary+fxBalBox(ym)+groups;
  el.innerHTML=sheetShell(T2('Bills','الفواتير'),inner,'fx-sheet');
  el.hidden=false;trDom();
}
function fxSaveForm(k){
  const sh=ui.sheet;if(!sh)return;collectSf();
  const d=String(sfv(sh,'fd',ds(today())));const amt=parseFloat(sfv(sh,'fa'));
  if(isNaN(amt)||amt<=0){toast(T2('Enter the amount paid.','اكتب المبلغ المدفوع.'));return}
  if(!d){toast(T2('Pick the date.','اختر التاريخ.'));return}
  const nt=String(sfv(sh,'fn','')).trim();
  if(sh.pi){if(!fxUpdatePay(k,sh.ym,sh.pi,d,amt,nt)){toast(T2('That payment is no longer there.','هذه الدفعة لم تعد موجودة.'));}else toast(T2('Payment updated.','تم تعديل الدفعة.'))}
  else fxAdd(k,sh.ym,d,amt,nt);
  sh.k=null;sh.mode=null;sh.pi=null;sh.f={};renderSheet();render();
}
function fxEditSave(k){
  const sh=ui.sheet;if(!sh||!canEditBud())return;collectSf();
  const day=parseInt(sfv(sh,'fday'),10);
  if(isNaN(day)||day<0||day>31){toast(T2('Due day is between 1 and 31, or 0 for none.','يوم الاستحقاق بين 1 و31، أو 0 إن لم يوجد.'));return}
  budEnsure();const f=B.fixed.find(x=>x.k===k);if(!f)return;f.day=day;
  if(!f.bl){const am=parseFloat(sfv(sh,'famt'));if(!isNaN(am)&&am>=0)f.amt=am}
  budSave();sh.k=null;sh.mode=null;sh.f={};renderSheet();render();
}
/* ---------- budgets: monthly amount per budget line, rates, accounts ---------- */
function openBud(){ui.sheet={type:'bud',f:{}};$('#sheet').innerHTML='';renderSheet()}

function budTotalsHtml(egp){
  return '<span class="bd-totals num" dir="ltr">'+['EGP','SAR','AED'].map(c=>'<span><small>'+c+'</small><b data-btc="'+c+'">'+nf(c==='EGP'?egp:(rateOf(c)>0?egp/rateOf(c):0))+'</b></span>').join('')+'</span>';
}
function budTotalsLive(){
  let egp=0;document.querySelectorAll('input[data-cur="EGP"][data-sf^="la-"]').forEach(i=>{const v=parseFloat(i.value);if(!isNaN(v))egp+=v});
  document.querySelectorAll('[data-btc]').forEach(b=>{const c=b.dataset.btc;b.textContent=nf(c==='EGP'?egp:(budRate(c)>0?egp/budRate(c):0))});
}
function triInputs(sh,keyEgp,egp,bt){
  return '<div class="tri3">'+['EGP','SAR','AED'].map(c=>{
    const v=c==='EGP'?egp:(rateOf(c)>0?r2(egp/rateOf(c)):0);
    const key=c==='EGP'?keyEgp:keyEgp+'~'+c;
    return '<label><small>'+c+'</small><input class="in num" type="number" inputmode="decimal" min="0" step="any" data-sf="'+esc(key)+'" data-bt="'+esc(bt)+'" data-cur="'+c+'" value="'+esc(v?String(v):(c==='EGP'?String(egp||''):''))+'" aria-label="'+esc(c)+'"></label>'}).join('')+'</div>';
}
function budRate(c){const n=document.querySelector('[data-sf="rt-'+c+'"]');const v=n?parseFloat(n.value):NaN;return v>0?v:rateOf(c)}
function budTri(t){
  const root=t.closest('.tri3');if(!root)return;
  const c=t.dataset.cur,v=parseFloat(t.value);
  const egp=isNaN(v)?NaN:(c==='EGP'?v:v*budRate(c));
  root.querySelectorAll('input').forEach(i=>{if(i===t)return;const cc=i.dataset.cur;i.value=isNaN(egp)?'':String(cc==='EGP'?r2(egp):r2(egp/budRate(cc)))});
  budTotalsLive();
}
function budRatesChanged(){
  document.querySelectorAll('.tri3').forEach(root=>{
    const e=root.querySelector('input[data-cur="EGP"]');const egp=e?parseFloat(e.value):NaN;if(isNaN(egp))return;
    root.querySelectorAll('input').forEach(i=>{const cc=i.dataset.cur;if(cc!=='EGP')i.value=String(r2(egp/budRate(cc)))});
  });
  budTotalsLive();
}
function ratesHistory(){
  const m=bud().ratesM||{},ks=Object.keys(m).sort().reverse();
  if(!ks.length)return '';
  return '<details class="bd-rhist"><summary>'+T2('Rates of earlier months','أسعار الأشهر السابقة')+'</summary><ul class="rep-list">'+ks.map(k=>{const a=k.split('-');return '<li class="rep-row"><span>'+esc(fmtMonLong.format(new Date(+a[0],+a[1]-1,1)))+'</span><span class="num" dir="ltr">'+['AED','SAR','USD'].map(c=>c+' '+(m[k][c]||'–')).join(' · ')+'</span></li>'}).join('')+'</ul></details>';
}
/* the first time Money is opened in a new month, the rates for that month must be entered (Muhammed only; it blocks until saved) */
const dataReady=()=>mode!=='sample'&&(!DB||!firstSnap);
const ratesDue=()=>ui.tab==='money'&&dataReady()&&canEditBud()&&!ratesSet(curYm());
function renderRatesSheet(el,sh){
  const ym=curYm(),a=ym.split('-'),mname=fmtMonLong.format(new Date(+a[0],+a[1]-1,1)),prev=ratesFor(prevYm(ym,1))||{};
  const fld=c=>'<label class="f bd-rate">1 '+c+' =<span class="bd-rin"><input class="in num" type="number" inputmode="decimal" min="0" step="any" data-sf="nr-'+c+'" value="'+esc(sfv(sh,'nr-'+c,''))+'" placeholder="'+esc(String(prev[c]||rateOf(c)||''))+'"><small>EGP</small></span></label>';
  el.innerHTML='<div class="sheet-bg"></div><div class="sheet-card exp-sheet" role="dialog" aria-modal="true" aria-label="'+esc(T2('Exchange rates for ','أسعار الصرف لشهر ')+mname)+'">'
    +'<h3>'+T2('Exchange rates for ','أسعار الصرف لشهر ')+esc(mname)+'</h3>'
    +'<div class="note" style="margin:-2px 0 12px">'+T2('A new month has started. Enter this month\'s rates once. They apply to this month only, and your SAR budgets turn into EGP with them.','بدأ شهر جديد. اكتب أسعار هذا الشهر مرة واحدة. تُطبَّق على هذا الشهر فقط، وتتحول بها ميزانياتك بالريال إلى جنيه.')+'</div>'
    +'<div class="bd-rates">'+['SAR','AED','USD'].map(fld).join('')+'</div>'
    +'<div class="note">'+T2('Last month: ','الشهر الماضي: ')+'<span class="num" dir="ltr">'+['SAR','AED','USD'].map(c=>c+' '+(prev[c]||'–')).join(' · ')+'</span></div>'
    +'<div class="sticky-save"><button type="button" class="btn" data-act="ratessave">'+T2('Save rates for ','احفظ أسعار ')+esc(mname)+'</button></div></div>';
  el.hidden=false;trDom();
  const f=$('[data-sf="nr-SAR"]');if(f&&!f.value)setTimeout(()=>{try{f.focus()}catch(e){}},50);
}
function ratesSave(){
  const sh=ui.sheet;if(!sh||sh.type!=='rates')return;collectSf();
  const ym=curYm(),v={};let bad=false;
  ['AED','SAR','USD'].forEach(c=>{const n=parseFloat(sfv(sh,'nr-'+c,''));if(isNaN(n)||n<=0)bad=true;else v[c]=n});
  if(bad){toast(T2('Enter all three rates. Each must be more than zero.','اكتب الأسعار الثلاثة. ويجب أن يكون كل سعر أكبر من صفر.'));return}
  budEnsure();B.ratesM=B.ratesM||{};B.ratesM[ym]=v;B.rates=Object.assign({},B.rates,v);
  budSave();ui.sheet=null;toast(T2('Rates saved for this month.','تم حفظ أسعار هذا الشهر.'));render();
}
function renderBudSheet(el,sh){
  const can=canEditBud(),f=k=>sfv(sh,k);
  const t=ds(today());
  const lim=spLim(t);
  const lines=bud().lines.map(l=>{
    const tag=l.dl?'<span class="tag-dl">'+T2('counts toward the daily limit','يدخل في الحد اليومي')+'</span>':'';
    const sub=l.kd==='f'?T2('fixed monthly','ثابت كل شهر'):T2('logged day by day','يُسجَّل يومًا بيوم');
    return '<li class="bd-item"><div class="bd-main"><b data-notr="1">'+esc(lname(l))+'</b><small class="muted">'+sub+(l.from?' · '+T2('starts '+l.from,'يبدأ '+l.from):'')+'</small>'+tag+'</div>'
      +(can?triInputs(sh,'la-'+l.k,Number(sfv(sh,'la-'+l.k,String(lineAmt(l))))||0,l.k):'<span class="bd-val num">'+nf(lineAmt(l))+' <small>EGP</small></span><small class="muted">'+esc(triOthers(lineAmt(l),'EGP'))+'</small>')+'</li>';
  }).join('');
  const total=bud().lines.reduce((s,l)=>s+lineAmt(l),0);
  const rates=['AED','SAR','USD'].map(c=>'<label class="f bd-rate">1 '+c+' =<span class="bd-rin"><input class="in num" type="number" inputmode="decimal" min="0" step="any" data-sf="rt-'+c+'" value="'+esc(sfv(sh,'rt-'+c,String(rateOf(c))))+'"'+(can?'':' disabled')+'><small>EGP</small></span></label>').join('');
  const accts='<div class="chips bd-accts">'+bud().accts.map(a=>'<span class="chipbtn acct-chip" data-notr="1">'+esc(acctName(a.k))+(can?'<button type="button" class="acct-x" data-act="acdel" data-v="'+esc(a.k)+'" aria-label="'+esc(T2('Remove ','احذف ')+acctName(a.k))+'">×</button>':'')+'</span>').join('')+'</div>'
    +(can?'<div class="bd-add"><label class="f">'+T2('New account or card (name only, never the full number)','حساب أو بطاقة جديدة (الاسم فقط، ولا تكتب الرقم كاملًا أبدًا)')+'<input class="in" data-sf="acn" type="text" maxlength="30" value="'+esc(f('acn'))+'" autocomplete="off" placeholder="'+esc(T2('e.g. Visa 4821','مثلًا فيزا 4821'))+'"></label><button type="button" class="btn alt" data-act="acadd">'+T2('Add account','أضف حساب')+'</button></div>':'');
  const addLine=can?'<div class="bd-add"><label class="f">'+T2('Name','الاسم')+'<input class="in" data-sf="ln" type="text" maxlength="30" value="'+esc(f('ln'))+'" autocomplete="off"></label><div class="f">'+T2('Monthly amount: type it in any currency','المبلغ الشهري: اكتبه بأي عملة')+triInputs(sh,'lm',Number(f('lm'))||0,'_new')+'</div><button type="button" class="btn alt" data-act="lineadd">'+T2('Add line','أضف البند')+'</button></div>':'';
  const op=ui.bdopen||{};
  const acc=(k,title,summ,body)=>'<section class="bd-sec bd-acc'+(op[k]?' open':'')+'"><button type="button" class="bd-acc-h" data-act="bdtog" data-v="'+k+'" aria-expanded="'+(!!op[k])+'"><span><b>'+title+'</b>'+(op[k]?'':'<small class="muted" data-notr="1">'+summ+'</small>')+'</span><span class="bd-acc-i" aria-hidden="true">'+(op[k]?'−':'+')+'</span></button>'+(op[k]?'<div class="bd-acc-b">'+body+'</div>':'')+'</section>';
  const ratesSum=['AED','SAR','USD'].map(c=>c+' '+rateOf(c)).join(' · ');
  const nCats=(bud().cats||[]).length;
  const inner='<h3>'+T2('Budgets','الميزانيات')+'</h3><div class="note" style="margin:-2px 0 10px">'+(can?T2('Muhammed sets the monthly budgets. You both see them everywhere.','محمد هو من يحدد الميزانيات الشهرية، وكلاكما يراها.'):T2('Only Muhammed changes these. You can see them.','محمد هو من يغيّرها، ويمكنكِ الاطلاع عليها.'))+'</div>'
    +'<section class="bd-sec"><div class="bd-h"><h4>'+T2('Monthly budget per line','الميزانية الشهرية لكل بند')+'</h4>'+budTotalsHtml(total)+'</div><ul class="bd-list">'+lines+'</ul>'
    +(can?'<label class="f bd-dlim">'+T2('Daily spending limit (EGP). Put 0 to use the living budget ÷ days in the month.','حد المصروف اليومي (بالجنيه). اكتب 0 ليُحسب من ميزانية المعيشة ÷ عدد أيام الشهر.')+'<input class="in num" type="number" inputmode="decimal" min="0" step="any" data-sf="dlim" value="'+esc(sfv(sh,'dlim',String(Number(bud().dlim)||0)))+'"></label>':'')
    +'<div class="note">'+T2('Daily limit today: ','الحد اليومي اليوم: ')+'<b class="num">'+nf(lim)+' EGP</b>'+(Number(bud().dlim)>0?'':' '+T2('(living budget ÷ days in the month)','(ميزانية المعيشة ÷ عدد أيام الشهر)'))+'</div>'
    +(can?'<label class="chk-line"><input type="checkbox" data-sf="ooin"'+(sfv(sh,'ooin',!!bud().ooin)===true?' checked':'')+'> '+T2('Count one-offs (like home setup) in the budget and the daily limit','احسب المصاريف لمرة واحدة (مثل تجهيز البيت) ضمن الميزانية والحد اليومي')+'</label>':'')+'</section>'
    +acc('rates',T2('Exchange rates','أسعار الصرف'),ratesSum,'<div class="bd-rates">'+rates+'</div><div class="note">'+T2('These are the rates for '+fmtMonLong.format(today())+' only. You set new ones at the start of every month. An expense in another currency is converted once, at the rate of the month it belongs to. Budget amounts are kept in SAR, so each month they follow that month\'s SAR rate.','هذه أسعار '+fmtMonLong.format(today())+' فقط. تُدخل أسعارًا جديدة في بداية كل شهر. المصروف بعملة أخرى يُحوَّل مرة واحدة بسعر الشهر الذي يخصّه. الميزانيات تُحفظ بالريال، فتتبع كل شهر سعر الريال لذلك الشهر.')+'</div>'+ratesHistory())
    +acc('accts',T2('Accounts and cards','الحسابات والكروت'),bud().accts.length+' '+T2('accounts','حسابات'),accts)
    +acc('cats',T2('Categories','الفئات'),nCats+' '+T2('categories','فئة'),catEditorHtml(sh))
    +(can?acc('addline',T2('Add a budget line','أضف بند ميزانية'),T2('a new monthly line','بند شهري جديد'),addLine):'')
    +'<div class="sticky-save bd-savebar">'+(can?'<button type="button" class="btn" data-act="budsave">'+T2('Save budgets','احفظ الميزانيات')+'</button>':'')+((ui.sheet&&ui.sheet.page)?'':'<button type="button" class="btn alt" data-act="sheetclose">'+T2('Close','إغلاق')+'</button>')+'</div>';
  el.innerHTML=sheetShell(T2('Budgets','الميزانيات'),inner,'bd-sheet');
  el.hidden=false;trDom();
}
function budSaveForm(){
  const sh=ui.sheet;if(!sh||!canEditBud())return;collectSf();
  budEnsure();
  const nl=[];let bad=false;
  B.lines.forEach(l=>{const raw=sfv(sh,'la-'+l.k,String(lineAmt(l)));const v=parseFloat(raw);if(isNaN(v)||v<0)bad=true;else nl.push([l,v])});
  if(bad){toast(T2('Check the amounts: numbers only.','راجع المبالغ: أرقام فقط.'));return}
  /* this month's rates first, then the budgets (kept in SAR, so next month's rate moves their EGP value) */
  B.ratesM=B.ratesM||{};const rm=Object.assign({},ratesFor(curYm()));
  ['AED','SAR','USD'].forEach(c=>{const v=parseFloat(sfv(sh,'rt-'+c,String(rateOf(c))));if(!isNaN(v)&&v>0){B.rates[c]=v;rm[c]=v}});
  B.ratesM[curYm()]=rm;
  const sr=rateOf('SAR',curYm());
  nl.forEach(x=>{x[0].amt=x[1];if(sr>0)x[0].sar=Math.round(x[1]/sr*1e4)/1e4});
  B.ooin=sfv(sh,'ooin',!!B.ooin)===true?1:0;
  {const dv=parseFloat(sfv(sh,'dlim',String(Number(B.dlim)||0)));if(!isNaN(dv)&&dv>=0)B.dlim=dv}
  budSave();toast(T2('Budgets saved.','تم حفظ الميزانيات.'));sh.f={};renderSheet();render();
}
function acctAdd(){
  const sh=ui.sheet;if(!sh||!canEditBud())return;collectSf();
  const n=String(sfv(sh,'acn')).trim();if(!n)return;
  if(noCard(n)){toast(T2('Please do not type full card numbers. A name or the last 4 digits is enough.','من فضلك لا تكتب رقم البطاقة كاملًا. يكفي الاسم أو آخر 4 أرقام.'));return}
  if(bud().accts.some(a=>a.n.toLowerCase()===n.toLowerCase())){toast(T2('That account already exists.','هذا الحساب موجود.'));return}
  budEnsure();B.accts.push({k:'a_'+Date.now().toString(36),n:n,ar:''});budSave();sfSet('acn','');renderSheet();
}
function lineAdd(){
  const sh=ui.sheet;if(!sh||!canEditBud())return;collectSf();
  const n=String(sfv(sh,'ln')).trim(),v=parseFloat(sfv(sh,'lm'));
  if(!n||isNaN(v)||v<0){toast(T2('Give the line a name and an amount.','اكتب اسم البند والمبلغ.'));return}
  budEnsure();B.lines.push({k:'l_'+Date.now().toString(36),en:n,ar:'',x:n,amt:v,sar:(rateOf('SAR')>0?Math.round(v/rateOf('SAR')*1e4)/1e4:undefined),kd:'d'});budSave();sfSet('ln','');sfSet('lm','');renderSheet();
}
/* ---------- Today: money card ---------- */
function meBanner(){
  if(mode==='sample'||meKnown())return '';
  return '<div class="banner mebar"><p><b>'+T2('Whose phone is this?','لمن هذا الهاتف؟')+'</b> '+T2('The app opens on this person’s page.','يفتح التطبيق على صفحة هذا الشخص.')+'</p><div class="chips">'+S.people.map(p=>'<button type="button" class="chipbtn" data-act="setme" data-p="'+p.id+'" data-notr="1">'+esc(pname(p.id))+'</button>').join('')+'</div></div>';
}
function fxLine(ym){
  const sm=fxSummary(ym),fb=fxBalance(ym);
  return '<button type="button" class="mc-fx" data-act="mtab" data-v="fix"><span>'+svgi('t_week')+T2('Bills: '+sm.paid+' of '+sm.n+' settled','الفواتير: '+sm.paid+' من '+sm.n+' مسدّدة')+(sm.over?'<b class="fx-over"> · '+T2(sm.over+' overdue',sm.over+' متأخرة')+'</b>':'')+(sm.soon?'<b class="fx-soon"> · '+T2(sm.soon+' due soon',sm.soon+' مستحقة قريب')+'</b>':'')+(fb.saved>0.5?'<b class="fx-good"> · '+T2('saved ','وفّرتم ')+nf(fb.saved)+'</b>':'')+(fb.over>0.5?'<b class="fx-bad"> · '+T2('over ','زادت ')+nf(fb.over)+'</b>':'')+'</span></button>';
}
function moneyCard(){
  const sp=spendHabit();if(!sp)return '';
  const t=today(),ym=ymOf(ds(t)),act=monthAct(ym);
  const dl=bud().lines.filter(l=>l.dl);
  const rows=dl.map(l=>{
    const s=lineStatus(l,ym,act);
    return '<div class="mc-line"><div class="mc-top"><b data-notr="1">'+esc(lname(l))+'</b>'+bsBadge(s.st)+'</div>'+budBar(s)
      +'<div class="mc-nums"><span>'+T2('Spent ','المصروف ')+'<b class="num">'+nf(s.counted)+'</b> / <span class="num">'+nf(s.budget)+'</span> EGP</span><span>'+(s.rem>=0?T2('Left ','المتبقي '):T2('Over by ','تجاوز '))+'<b class="num">'+nf(Math.abs(s.rem))+'</b></span></div>'
      +'<div class="bv-cur num" dir="ltr">≈ '+triOthers(s.counted,'EGP')+' / '+triOthers(s.budget,'EGP')+'</div>'
      +(s.oo&&!bud().ooin?'<div class="note mc-oo">'+T2('One-offs not counted: ','مصاريف لمرة واحدة غير محسوبة: ')+'<b class="num">'+nf(s.oo)+'</b> EGP</div>':'')+'</div>';
  }).join('');
  const dstr=ds(t);
  const v=getVal(repOf(sp,sp.who[0]),dstr,sp.id),has=v!=null&&typeof v!=='object',lim=spLim(dstr);
  const todayRow='<div class="mc-today">'+T2('Today ','اليوم ')+(has?'<b class="num">'+nf(v)+'</b>':'<b class="num">0</b>')+' / <span class="num">'+nf(lim)+'</span> EGP '+(has?stBadge(Number(v)<=lim,T2('Within the limit','ضمن الحد'),T2('Over the limit','فوق الحد')):'')+'</div>';
  const sm=fxSummary(ym);
  const fx=fxLine(ym);
  return '<div class="grid"><section class="card moneycard"><div class="card-h"><h2>'+T2('Money this month','مالية هذا الشهر')+'</h2><span class="sub">'+esc(fmtMonLong.format(t))+'</span></div>'+rows+fx
    +'</section></div>';
}
/* ---------- Money tab: its own pages (Log, Dashboard, Fixed payments, Budgets) ---------- */
function moneyMini(){
  const sp=spendHabit();if(!sp)return '';
  const t=today(),ym=ymOf(ds(t)),act=monthAct(ym),dstr=ds(t);
  const l=bud().lines.find(x=>x.dl);
  const s=l?lineStatus(l,ym,act):null;
  const v=getVal(repOf(sp,sp.who[0]),dstr,sp.id),has=v!=null&&typeof v!=='object',lim=spLim(dstr);
  return '<div class="grid"><section class="card moneymini"><div class="card-h"><h2>'+T2('Money','المال')+'</h2>'+(s?bsBadge(s.st):'')+'</div>'
    +'<div class="mc-nums">'+(s?'<span>'+(s.rem>=0?T2('Left this month ','المتبقي هذا الشهر '):T2('Over this month by ','التجاوز هذا الشهر '))+'<b class="num">'+nf(Math.abs(s.rem))+'</b> EGP</span>':'')
    +'<span>'+T2('Today ','اليوم ')+'<b class="num">'+nf(has?v:0)+'</b> / <span class="num">'+nf(lim)+'</span></span></div>'
    +'<div class="mc-btns"><button type="button" class="chipbtn" data-act="mtab" data-v="log">'+T2('Open Money','افتح المال')+'</button></div>'+fxLine(ym)+'</section></div>';
}
function mtabInit(){
  const m=ui.mtab||'log';
  if(m==='fix'||m==='bud'){
    if(!ui.sheet||!ui.sheet.page||ui.sheet.type!==m)ui.sheet=(m==='fix')?{type:'fix',f:{},ym:ymOf(ds(today())),mode:null,k:null,page:true}:{type:'bud',f:{},page:true};
  }else if(ui.sheet&&ui.sheet.page)ui.sheet=null;
}
/* average daily spend this month: shown at the top of every Money page (same rule as before: recorded days only, unrecorded days skipped and shown) */
function moneyAvgStrip(){
  if(!spendHabit())return '';
  const t=today(),m=P.mo(0),q=spendStat(m[0],t);
  if(!q)return '';
  const lim=spLim(ds(t));
  return '<div class="mavg" role="status"><div class="mavg-main"><span class="mavg-l">'+T2('Average spend a day · ','متوسط المصروف في اليوم · ')+esc(fmtMonLong.format(t))+'</span>'
    +'<b class="num mavg-v">'+(q.avg!=null?nf(q.avg):'–')+'</b><small>EGP</small>'
    +(q.avg!=null?'<small class="mavg-o num" dir="ltr">'+esc(secTxt(q.avg))+'</small>':'')+'</div>'
    +'<div class="mavg-sub"><span>'+T2('Daily limit ','الحد اليومي ')+'<b class="num">'+nf(lim)+'</b></span>'
    +'<span>'+q.n+T2(' days recorded',' يوم مسجّل')+(q.miss>0?' · <b class="mavg-miss">'+q.miss+T2(' not recorded',' غير مسجّل')+'</b>':'')+'</span></div></div>';
}
function viewMoney(){
  mtabInit();
  const sub=ui.mtab||'log';
  const tabs=[['log',T2('Log','السجل')],['dash',T2('Dashboard','اللوحة')],['fix',T2('Bills','الفواتير')],['bud',T2('Budgets','الميزانيات')]];
  const nav='<div class="pill-seg mnav" role="group" aria-label="'+esc(T2('Money pages','صفحات المال'))+'">'+tabs.map(x=>'<button type="button" data-act="mtab" data-v="'+x[0]+'" aria-pressed="'+(sub===x[0])+'">'+x[1]+'</button>').join('')+'</div>';
  let body='';
  if(sub==='fix'||sub==='bud')body='<div id="mpage"></div>';
  else if(!spendHabit())body='<div class="card"><p class="note">'+T2('Turn on the daily spending habit in Setup to use the log and the dashboard.','فعّل عادة تسجيل المصروف اليومي من الإعدادات لاستخدام السجل واللوحة.')+'</p></div>';
  else if(sub==='dash')body=moneyDash();
  else body=moneyLog();
  return '<div class="mwrap">'+quoteBanner('money')+moneyAvgStrip()+nav+body+'</div>';
}
const mdPer=()=>ui.mdPer||'month';
function moneyDash(){
  const per=mdPer();
  const bar='<div class="mdbar"><div class="pill-seg mdper" role="group" aria-label="'+esc(T2('Period for the whole dashboard','الفترة لكل اللوحة'))+'">'+[['week',T2('This week','هذا الأسبوع')],['month',T2('This month','هذا الشهر')],['last',T2('Last month','الشهر الماضي')],['all',T2('All time','كل الفترة')]].map(x=>'<button type="button" data-act="mdper" data-v="'+x[0]+'" aria-pressed="'+(per===x[0])+'">'+x[1]+'</button>').join('')+'</div></div>';
  return moneyCard()+bar+'<div class="grid two">'+spendCard()+spendCatCard()+budgetCard()+reportCard()+'</div>';
}
function moneyLog(){
  const sp=spendHabit(),t=today(),off=Math.min(0,ui.mday||0),d=addDays(t,off),dstr=ds(d),isToday=off===0;
  const list=expList(dstr,sp,null),parts=dayParts(list),limit=spLim(dstr),over=parts.day>limit,cur=esc(S.currency);
  const pct=limit>0?clamp(parts.day/limit,0,1):0;
  const who=me();
  const when=isToday?T2('Today','اليوم'):(off===-1?T2('Yesterday','أمس'):fmtLong.format(d));
  const nav='<div class="mlog-nav"><button type="button" class="chipbtn" data-act="mday" data-v="-1" aria-label="'+esc(T2('Previous day','اليوم السابق'))+'">'+svgi(ui.lang==='ar'?'chr':'chl','',3)+'</button><b>'+esc(when)+(isToday?'':' <small class="muted">'+esc(fmtShort.format(d))+'</small>')+'</b>'
    +'<button type="button" class="chipbtn" data-act="mday" data-v="1"'+(isToday?' disabled':'')+' aria-label="'+esc(T2('Next day','اليوم التالي'))+'">'+svgi(ui.lang==='ar'?'chl':'chr','',3)+'</button>'+(isToday?'':'<button type="button" class="chipbtn" data-act="mday" data-v="0">'+T2('Today','اليوم')+'</button>')+'</div>';
  const bar=limit>0?'<div class="exp-bar" aria-hidden="true"><i style="width:'+Math.round(pct*100)+'%"></i></div><div class="exp-total-foot">'+stBadge(!over,T2('Within the limit','ضمن الحد'),T2('Over the limit','فوق الحد'))+'<span>'+T2('limit ','الحد ')+nf(limit)+' '+cur+(over?T2(' · over by ',' · تجاوز ')+nf(parts.day-limit):T2(' · left ',' · المتبقي ')+nf(limit-parts.day))+'</span></div>':'';
  const totalCard='<div class="exp-total'+(over?' over':'')+'"><div class="exp-total-top"><span class="exp-total-lbl">'+T2('Counts toward the daily limit','المحسوب ضمن الحد اليومي')+'</span><span class="exp-total-num num">'+nf2(parts.day)+' <small>'+cur+'</small></span></div>'+bar
    +(parts.other?'<div class="note exp-other">'+T2('Outside the daily limit (not counted): ','خارج الحد اليومي (غير محسوب): ')+'<b class="num">'+nf2(parts.other)+'</b> '+cur+'</div>':'')
    +(parts.inc?'<div class="note exp-other">'+T2('Income logged: ','الدخل المسجّل: ')+'<b class="num">'+nf2(parts.inc)+'</b> '+cur+'</div>':'')+'</div>';
  const rows=list.slice().sort((a,b)=>b.t-a.t).map(x=>{
    const nm=(x.c&&catName(x.c))?'<b data-notr="1">'+esc(catName(x.c))+(x.sc?' · '+esc(subName(x.c,x.sc)):'')+'</b>':'';
    const note=x.n?'<span data-notr="1">'+esc(expNote(x.n))+'</span>':'';
    const tag=tyTag(x);
    const meta=[x.ac?acctName(x.ac):'',x.t>1?timeFmt.format(new Date(x.t)):'',x.cur?nf2(x.oa)+' '+x.cur:''].filter(Boolean).join(' · ');
    return '<li class="exp-item"><span class="dot" style="background:'+pcol(x.pid)+'" title="'+esc(pname(x.pid))+'"></span>'
      +'<button type="button" class="exp-main exp-edit" data-act="mlogedit" data-p="'+x.pid+'" data-id="'+esc(x.id)+'" data-d="'+dstr+'" aria-label="'+esc(T2('Edit this entry','عدّل هذا المصروف'))+'"><span class="exp-what">'+tag+nm+note+(!nm&&!note&&!tag?'<span class="muted">'+T2('Expense','مصروف')+'</span>':'')+'</span><small class="muted exp-time" data-notr="1">'+esc(meta)+'</small></button>'
      +'<span class="exp-amt num'+(x.ty==='r'?' neg':(x.ty==='i'||x.ty==='p')?' pos':'')+'">'+(x.ty==='r'||x.ty==='l'?'−':(x.ty==='i'||x.ty==='p')?'+':'')+nf2(x.a)+'</span></li>';
  }).join('');
  const billRows=billDayRows(dstr);
  const addBtn='<button type="button" class="btn mlog-add" data-act="exp" data-p="'+who+'" data-h="'+esc(sp.id)+'" data-d="'+dstr+'">'+svgi('plus','',3)+' '+T2('Record transaction','سجّل عملية')+'</button>';
  const dayCard='<section class="card span2 mlog-day"><div class="card-h"><h2>'+T2('Log','السجل')+'</h2></div>'+nav+totalCard+addBtn
    +((rows||billRows)?'<h4 class="exp-lh">'+T2('Entries','المسجّل')+' <small class="muted">'+T2('(tap one to edit or delete)','(اضغط على أي واحد لتعديله أو حذفه)')+'</small></h4><ul class="exp-list">'+rows+billRows+'</ul>'+(billRows?billNote():''):'<div class="note exp-empty">'+T2('Nothing logged for this day yet.','لم يُسجَّل شيء لهذا اليوم بعد.')+'</div>')+'</section>';
  /* recent days */
  const days=[];for(let i=0;i<7;i++){const dd=addDays(t,-i),k=ds(dd);if(dd<pd(S.start))break;const l2=expList(k,sp,null);const p2=dayParts(l2);days.push({i:i,d:dd,k:k,n:l2.filter(x=>!eMove(x)).length,p:p2,lim:spLim(k)})}
  const emptyN=days.filter(x=>!x.n).length;
  const recDays=days.filter(x=>x.n>0);
  const rec=!recDays.length?'':'<section class="card span2 mlog-recent"><div class="card-h"><h2>'+T2('Last 7 days','آخر 7 أيام')+'</h2></div><ul class="rep-list">'+recDays.map(x=>{
    const ok=x.n>0&&x.p.day<=x.lim;
    return '<li class="rep-row"><button type="button" class="mlog-day-btn" data-act="mdayset" data-v="'+(-x.i)+'"'+(off===-x.i?' aria-current="true"':'')+'><span data-notr="1">'+esc(x.i===0?T2('Today','اليوم'):x.i===1?T2('Yesterday','أمس'):fmtLong.format(x.d))+'</span>'
      +'<b class="num">'+(x.n?nf(x.p.day):'–')+'</b><small class="muted num">'+(x.n?x.n+' '+T2(x.n===1?'entry':'entries',x.n===1?'مسجّل':'مسجّلة'):T2('nothing logged','لا شيء'))+'</small>'
      +(x.n?'<span class="st '+(ok?'ok':'bad')+'">'+(ok?T2('Within','ضمن'):T2('Over','فوق'))+'</span>':'')+'</button></li>';
  }).join('')+'</ul>'+(emptyN?'<div class="note">'+T2(emptyN+(emptyN===1?' day':' days')+' with nothing logged in the last 7.','لا مصاريف مسجّلة في '+emptyN+(emptyN===1?' يوم':' أيام')+' من آخر 7.')+'</div>':'')+'</section>';
  return meBanner()+'<div class="grid">'+dayCard+'</div>'+(loansCard()?'<div class="grid">'+loansCard()+'</div>':'')+(rec?'<div class="grid">'+rec+'</div>':'');
}
/* ---------- Dashboard: budget vs actual ---------- */
function budgetCard(){
  if(!spendHabit())return '';
  const t=today(),nowYm=ymOf(ds(t)),per=mdPer()==='last'?'last':'cur',ym=per==='last'?prevYm(nowYm,1):nowYm;
  const act=monthAct(ym);
  const ls=bud().lines.filter(l=>!(l.from&&ym<l.from)).slice().sort((a,b)=>(a.kd===b.kd?0:a.kd==='d'?-1:1)||(lineAmt(b,ym)-lineAmt(a,ym)));
  let totB=0,totC=0;
  const cur=[];
  const rows=ls.map(l=>{
    const s=lineStatus(l,ym,act);totB+=s.budget;totC+=s.counted;
    const diff=s.budget-s.counted,pct=s.budget>0?Math.round(s.counted/s.budget*100):0;
    const pace=(l.kd==='d'&&s.cur&&s.budget>0)?'<small class="bt-pace num">'+T2('should be ≈ ','المفروض ≈ ')+nf(s.pace)+' '+T2('by today','اليوم')+'</small>':'';
    cur.push('<li><b data-notr="1">'+esc(lname(l))+'</b><span class="num" dir="ltr">'+T2('Spent','المصروف')+' ≈ '+triOthers(s.counted,'EGP')+' · '+T2('Budget','الميزانية')+' ≈ '+triOthers(s.budget,'EGP')+'</span></li>');
    return '<tr class="bt-'+s.st+' bt-click" data-act="budrow" data-k="'+esc(l.k)+'" data-ym="'+ym+'" tabindex="0" role="button" aria-label="'+esc(T2('Show the records of ','اعرض سجلات ')+lname(l))+'"><th scope="row"><b data-notr="1">'+esc(lname(l))+'</b>'+bsBadge(s.st)+pace+'</th>'
      +'<td class="num">'+nf(s.budget)+'</td>'
      +'<td class="num"><b>'+nf(s.counted)+'</b><small>'+pct+'%</small></td>'
      +'<td class="num bt-d"><b>'+(s.st==='due'?'–':(diff>=0?'':'+')+nf(Math.abs(diff)))+'</b><small>'+(s.st==='due'?T2('not paid','لم يُدفع'):diff>=0?T2('left','متبقي'):T2('over','زيادة'))+'</small></td></tr>';
  }).join('');
  const a=ym.split('-');
  const tst=totC>totB*1.2?'high':totC>totB*1.05?'warn':totC<totB*0.95?'good':'ok';
  const left=totB-totC;
  return '<section class="card span2 budgetcard"><div class="card-h"><div><h2>'+T2('Budget vs actual','الميزانية والفعلي')+'</h2><span class="sub">'+esc(fmtMonLong.format(new Date(+a[0],+a[1]-1,1)))+' · EGP'+((mdPer()==='week'||mdPer()==='all')?' · '+T2('budgets are monthly','الميزانيات شهرية'):'')+'</span></div></div>'
    +'<div class="bt-sum"><div class="bt-box"><span>'+T2('Budget','الميزانية')+'</span><b class="num">'+nf(totB)+'</b></div><div class="bt-box bt-'+tst+'"><span>'+T2('Spent','المصروف')+'</span><b class="num">'+nf(totC)+'</b></div><div class="bt-box '+(left>=0?'bt-good':'bt-high')+'"><span>'+(left>=0?T2('Left','المتبقي'):T2('Over','الزيادة'))+'</span><b class="num">'+nf(Math.abs(left))+'</b></div></div>'
    +'<div class="note">'+secTxt(totC)+'</div>'
    +'<div class="bt-wrap"><table class="bt"><thead><tr><th scope="col">'+T2('Line','البند')+'</th><th scope="col">'+T2('Budget','الميزانية')+'</th><th scope="col">'+T2('Spent','المصروف')+'</th><th scope="col">'+T2('Left / over','الفرق')+'</th></tr></thead><tbody>'+rows+'</tbody></table></div>'
    +'<div class="bt-key"><span class="bt-good">'+T2('More than 5% under','أقل من الميزانية بأكثر من 5%')+'</span><span class="bt-ok">'+T2('Within 5%','ضمن 5%')+'</span><span class="bt-warn">'+T2('Over by 5% or more','أعلى بأكثر من 5%')+'</span><span class="bt-high">'+T2('Over by 20% or more','أعلى بأكثر من 20%')+'</span></div>'
    +'<div class="note bv-key">'+T2('Day-by-day lines are compared with the pace of the month so far, not the full month.','تُقارن البنود اليومية بوتيرة الصرف في الشهر حتى الآن وليس بالشهر كاملًا.')+'</div>'
    +'<details class="bt-cur"><summary>'+T2('Other currencies','عملات أخرى')+'</summary><ul>'+cur.join('')+'</ul></details>'
    +'</section>';
}
/* ---------- Dashboard: where the money goes (net of refunds, income left out) ---------- */
/* ---------- read-only list of money records (opened from the 6-month table and from Budget vs actual) ---------- */
function txlRecords(sh){
  const out=[],ooin=!!bud().ooin;
  eachEntry((x,d,pid)=>{
    if(d<sh.A||d>sh.B||eSkip(x))return;
    const ck=(x.c&&catName(x.c))?x.c:'_none';
    if(sh.cat!=null){if(ck!==sh.cat)return}
    else if(blOf(x.c)!==sh.line)return;
    const c=catOf(x.c),oo=!!(c&&c.oo),v=eNet(x);
    out.push({d:d,pid:pid,t:Number(x.t)||0,what:(x.c&&catName(x.c))?catName(x.c)+(x.sc?' · '+subName(x.c,x.sc):''):'',note:x.n==='Earlier total'?T2('Earlier total','إجمالي سابق'):(x.n||''),
      ac:x.ac?acctName(x.ac):'',v:v,orig:x.cur?nf2(x.oa)+' '+x.cur:'',ref:x.ty==='r',skip:(sh.line&&oo&&!ooin)});
  });
  if(sh.line){
    const ym=sh.ym;
    bud().fixed.forEach(f=>{if(f.bl!==sh.line)return;
      fxPays(ym,f.k).forEach(q=>out.push({d:q.d,pid:q.pid,t:0,bill:true,what:fxName(f),note:q.n||'',ac:'',v:toEgp(q.a,fxCur(f),ym),orig:'',ref:false,skip:false}))});
  }
  out.sort((a,b)=>a.d<b.d?1:a.d>b.d?-1:(b.t-a.t));
  return out;
}
function renderTxlSheet(el,sh){
  const recs=txlRecords(sh),tot=r2(recs.filter(r=>!r.skip).reduce((t,r)=>t+r.v,0));
  const rows=recs.map(r=>'<li class="exp-item txl-item'+(r.skip?' txl-skip':'')+'"><span class="dot" style="background:'+pcol(r.pid)+'" title="'+esc(pname(r.pid))+'"></span>'
    +'<span class="exp-main"><span class="exp-what">'+(r.bill?'<span class="tag-w">'+T2('Bill','فاتورة')+'</span>':'')+(r.what?'<b data-notr="1">'+esc(r.what)+'</b>':'')+(r.note?'<span data-notr="1">'+esc(r.note)+'</span>':'')+(!r.what&&!r.note&&!r.bill?'<span class="muted">'+T2('Expense','مصروف')+'</span>':'')+'</span>'
    +'<small class="muted">'+esc([fmtShort.format(pd(r.d)),r.ac,r.orig,r.skip?T2('one-off, not counted','لمرة واحدة، غير محسوب'):''].filter(Boolean).join(' · '))+'</small></span>'
    +'<span class="exp-amt num'+(r.ref?' neg':'')+'">'+(r.v<0?'−':'')+nf2(Math.abs(r.v))+'</span></li>').join('');
  el.innerHTML=sheetShell(sh.title,'<h3 data-notr="1">'+esc(sh.title)+'</h3><div class="note" style="margin:-2px 0 12px">'+esc(sh.sub||'')+'</div>'
    +'<div class="exp-total"><div class="exp-total-top"><span class="exp-total-lbl">'+recs.length+T2(recs.length===1?' record':' records',' سجل')+'</span><span class="exp-total-num num">'+nf2(tot)+' <small>EGP</small></span></div></div>'
    +(rows?'<ul class="exp-list">'+rows+'</ul>':'<div class="note exp-empty">'+T2('Nothing here yet.','لا يوجد شيء هنا بعد.')+'</div>')
    +'<div class="sticky-save"><button type="button" class="btn" data-act="sheetclose">'+T2('Close','إغلاق')+'</button></div>');
  el.hidden=false;trDom();
}
const monthEnd=ym=>ym+'-'+String(dimOf(ym)).padStart(2,'0');
function txlOpenLine(k,ym){
  const l=lineOf(k),a=ym.split('-'),d0=new Date(+a[0],+a[1]-1,1);
  ui.sheet={type:'txl',cat:null,line:k,A:ym+'-01',B:monthEnd(ym),ym:ym,title:l?lname(l):k,sub:fmtMonLong.format(d0)+' · '+T2('what is counted in this budget line','ما يُحسب في هذا البند')};
  renderSheet();
}
function txlOpenCat(k,ym){
  const a=ym.split('-'),d0=new Date(+a[0],+a[1]-1,1);
  ui.sheet={type:'txl',cat:k,A:ym+'-01',B:monthEnd(ym),ym:ym,title:(k==='_none'?T2('Not categorised','بدون فئة'):catName(k)),sub:fmtMonLong.format(d0)};
  renderSheet();
}
/* Where the money goes: every category by month for the last 6 months (current month last), then the average. Tap a number to list the expenses. */
function catMonthTable(){
  const nowYm=ymOf(ds(today())),yms=[];for(let i=5;i>=0;i--)yms.push(prevYm(nowYm,i));
  const m={},tot={};yms.forEach(y=>{tot[y]=0});
  eachEntry((x,d)=>{
    const y=ymOf(d);if(yms.indexOf(y)<0||eSkip(x))return;
    const k=(x.c&&catName(x.c))?x.c:'_none',v=eNet(x);
    m[k]=m[k]||{};m[k][y]=(m[k][y]||0)+v;tot[y]+=v;
  });
  const done=yms.slice(0,-1).filter(y=>tot[y]!==0);
  const avgOf=k=>done.length?done.reduce((s,y)=>s+((m[k]||{})[y]||0),0)/done.length:((m[k]||{})[nowYm]||0);
  const keys=Object.keys(m).filter(k=>yms.some(y=>(m[k][y]||0)>0)).sort((a,b)=>((m[b][nowYm]||0)-(m[a][nowYm]||0))||(avgOf(b)-avgOf(a)));
  if(!keys.length)return '';
  const hd=yms.map(y=>{const a=y.split('-');return '<th scope="col" class="num'+(y===nowYm?' cur':'')+'">'+esc(fmtMonShortY.format(new Date(+a[0],+a[1]-1,1)))+'</th>'}).join('');
  const rows=keys.map(k=>'<tr><th scope="row" data-notr="1">'+(k==='_none'?T2('Not categorised','بدون فئة'):esc(catName(k)))+'</th>'
    +yms.map(y=>{const v=m[k][y]||0;return '<td class="num'+(y===nowYm?' cur':'')+'">'+(v>0?'<button type="button" class="cat-cell" data-act="catcell" data-k="'+esc(k)+'" data-ym="'+y+'">'+nf(v)+'</button>':'<span class="muted">–</span>')+'</td>'}).join('')
    +'<td class="num avg"><b>'+(avgOf(k)>0?nf(avgOf(k)):'–')+'</b></td></tr>').join('');
  const foot='<tr class="cat-tot"><th scope="row">'+T2('Total','الإجمالي')+'</th>'+yms.map(y=>'<td class="num'+(y===nowYm?' cur':'')+'">'+(tot[y]?nf(tot[y]):'–')+'</td>').join('')
    +'<td class="num avg"><b>'+nf(done.length?done.reduce((s,y)=>s+tot[y],0)/done.length:tot[nowYm])+'</b></td></tr>';
  return '<div class="cat-wrap"><table class="cat-tbl"><thead><tr><th scope="col">'+T2('Category','الفئة')+'</th>'+hd+'<th scope="col" class="num avg">'+T2('Average','المتوسط')+'</th></tr></thead><tbody>'+rows+'</tbody><tfoot>'+foot+'</tfoot></table></div>'
    +'<div class="note cat-tnote">'+T2('Last 6 months, this month last. Sorted by this month. Tap a number to see the expenses behind it. The average is a month, over the finished months that have spending.','آخر 6 أشهر، وهذا الشهر في الآخر. مرتّبة حسب هذا الشهر. اضغط على أي رقم لعرض المصاريف. المتوسط للشهر الواحد، من الأشهر المنتهية التي فيها مصاريف.')+'</div>';
}
function spendCatCard(){
  if(!spendHabit())return '';
  const t=today(),pr=mdPer();
  let r,lbl;
  if(pr==='all'){r=[pd(S.start),t];lbl=T2('All time','كل الفترة')}
  else if(pr==='week'){r=P.wk(0);lbl=fmtShort.format(r[0])+' – '+fmtShort.format(r[1])}
  else if(pr==='last'){r=P.mo(-1);lbl=fmtMonLong.format(r[0])}
  else{r=P.mo(0);lbl=fmtMonLong.format(r[0])}
  const A=ds(r[0]),Bd=ds(r[1]);
  const bycat={},bypid={};let total=0,n=0,big=null,oo=0;
  eachEntry((x,d,pid)=>{
    if(d<A||d>Bd||eSkip(x))return;
    const v=eNet(x);
    const k=(x.c&&catName(x.c))?x.c:'_none';
    bycat[k]=(bycat[k]||0)+v;bypid[pid]=(bypid[pid]||0)+v;total+=v;n++;
    const c=catOf(x.c);if(c&&c.oo)oo+=v;
    if(x.ty!=='r'&&(!big||v>big.v))big={v:v,d:d,c:k,n:x.n||''};
  });
  const head='<div class="card-h"><div><h2>'+T2('Where the money goes','أين يذهب المال')+'</h2><span class="sub">'+esc(lbl)+' · '+esc(S.currency)+'</span></div></div>';
  if(!n)return '<section class="card span2 spendcat">'+head+catMonthTable()+'<div class="note" style="margin-top:12px">'+T2('No expenses logged in this period yet. Add them from Today and this fills in by itself.','لم تُسجَّل مصاريف في هذه الفترة بعد. سجّلها من "اليوم" وسيمتلئ هذا تلقائيًا.')+'</div></section>';
  /* average = everything spent on the days that were recorded, divided by the number of recorded days. Days nobody recorded are not counted, but their number is shown. */
  const sph=S.habits.find(x=>x.type==='num'&&x.kind==='spend');
  const tk=ds(t),from0=r[0]<pd(S.start)?pd(S.start):r[0],to0=r[1]<t?r[1]:t;
  const recDay={},byday={};
  eachEntry((x,d)=>{if(d<A||d>Bd||eSkip(x))return;byday[d]=(byday[d]||0)+eNet(x);recDay[d]=1});
  let miss=0;
  if(from0<=to0)daysIn(from0,to0).forEach(d=>{const k=ds(d);let has=!!recDay[k];if(!has&&sph){const v=getVal(sph.who[0],k,sph.id);has=v!=null&&typeof v!=='object'}if(has)recDay[k]=1;else if(k!==tk)miss++});
  let rk=Object.keys(recDay).filter(k=>k!==tk);if(!rk.length&&recDay[tk])rk=[tk];
  const recTot=rk.reduce((s,k)=>s+(byday[k]||0),0),nRec=rk.length,avg=nRec?recTot/nRec:null;
  const stats='<div class="stats"><div class="stat"><b class="num">'+nf(total)+'</b><span>'+T2('spent','المصروف')+'<br>'+(pr==='week'?T2('this week','هذا الأسبوع'):pr==='last'?T2('last month','الشهر الماضي'):pr==='all'?T2('all time','كل الفترة'):T2('this month','هذا الشهر'))+'</span></div>'
    +'<div class="stat"><b class="num">'+(avg==null?'–':nf(avg))+'</b><span>'+T2('average a day','المتوسط في اليوم')+'<br>'+T2('over '+nRec+(nRec===1?' recorded day':' recorded days'),'على '+nRec+(nRec===1?' يوم مسجّل':' أيام مسجّلة'))+'</span></div>'
    +'<div class="stat'+(miss>0?' warn':'')+'"><b class="num">'+miss+'</b><span>'+T2('days not recorded','أيام بلا تسجيل')+'<br>'+T2('left out of the average','خارج المتوسط')+'</span></div></div>'
    +'<div class="note">'+T2('This card counts everything you spent, including medical and one-off items. The Daily spending card counts only what counts toward the daily limit, so its average can be lower.','هذه البطاقة تحسب كل ما صرفتموه، ومنه الطبي والمصاريف لمرة واحدة. أما بطاقة المصروف اليومي فتحسب ما يدخل في الحد اليومي فقط، لذلك قد يكون متوسطها أقل.')+' '+secTxt(total)+'</div>';
  const who=(S.people.length>1)?'<div class="exp-subs cat-who">'+S.people.map(p=>'<span class="exp-sub"><span class="dot" style="background:'+pcol(p.id)+'"></span><span data-notr="1">'+esc(pname(p.id))+'</span> <b class="num">'+nf(bypid[p.id]||0)+'</b></span>').join('')+'</div>':'';
  const bigTxt=big?'<div class="note cat-big">'+T2('Biggest expense: ','أكبر مصروف: ')+'<b class="num">'+nf2(big.v)+' '+esc(S.currency)+'</b> · <span data-notr="1">'+(big.n?esc(expNote(big.n)):(big.c==='_none'?'':esc(catName(big.c))))+'</span> · '+fmtShort.format(pd(big.d))+'</div>':'';
  return '<section class="card span2 spendcat">'+head+stats+catMonthTable()+bigTxt+'</section>';
}
/* ---------- Dashboard: money report (summary, category trend, weekdays, merchants, CSV) ---------- */
function reportCard(){
  if(!spendHabit())return '';
  const per=({week:'week',month:'cur',last:'last',all:'all'})[mdPer()]||'cur',sec=ui.repSec||'sum',R=periodRange(per),t=today(),nowYm=ymOf(ds(t));
  const segP='';
  const segS='<div class="pill-seg rep-secs" role="group" aria-label="'+esc(T2('Report','التقرير'))+'">'+[['sum',T2('Summary','ملخص')],['trend',T2('Trend','الاتجاه')],['dow',T2('Weekdays','الأيام')],['mer',T2('Merchants','المحلات')]].map(x=>'<button data-act="repsec" data-v="'+x[0]+'" aria-pressed="'+(sec===x[0])+'">'+x[1]+'</button>').join('')+'</div>';
  let body='';
  const pctTxt=(a,b)=>b>0?((a-b)/b>=0?'+':'−')+Math.abs(Math.round((a-b)/b*100))+'%':'–';
  if(sec==='sum'){
    if(per==='week'){
      const w0=P.wk(0),w1=P.wk(-1),TT=rangeTotals(ds(w0[0]),ds(w0[1])),PP=rangeTotals(ds(w1[0]),ds(w1[1]));
      const cap=ds(addDays(w1[0],Math.max(0,Math.round((today()-w0[0])/864e5))));
      const P2=rangeTotals(ds(w1[0]),cap<ds(w1[1])?cap:ds(w1[1]));
      const mine=TT.tot-TT.oo,prev=P2.tot-P2.oo;
      body='<div class="stats"><div class="stat"><b class="num">'+nf(TT.tot)+'</b><span>'+T2('spent','المصروف')+'<br>'+T2('net of refunds','بعد المرتجعات')+'</span></div><div class="stat"><b class="num">'+nf(TT.ref)+'</b><span>'+T2('refunds','المرتجعات')+'</span></div><div class="stat"><b class="num">'+nf(TT.inc)+'</b><span>'+T2('income','الدخل')+'<br>'+T2('logged','المتسجّل')+'</span></div></div>'
        +'<ul class="rep-list">'+(TT.oo?'<li class="rep-row"><span>'+T2('One-offs (inside the spent figure)','مصاريف لمرة واحدة (داخل المصروف)')+'</span><b class="num">'+nf(TT.oo)+'</b></li>':'')
        +'<li class="rep-row"><span>'+T2('vs last week (same days)','مقارنة بالأسبوع الماضي (نفس الأيام)')+'</span><b class="num'+(prev>0?(mine>prev?' neg':mine<prev?' pos':''):'')+'">'+pctTxt(mine,prev)+'</b><small class="muted num">'+nf(mine)+' / '+nf(prev)+'</small></li></ul>'
        +'<div class="note">'+secTxt(TT.tot)+'</div>';
    }else if(per==='all'){
      const yms={};eachEntry((x,d)=>{yms[d.slice(0,7)]=1});
      const list=Object.keys(yms).sort().reverse().slice(0,12);
      body=list.length?'<ul class="rep-list">'+list.map(ym=>{const m=monthTotals(ym);const a=ym.split('-');return '<li class="rep-row"><span data-notr="1">'+esc(fmtMonLong.format(new Date(+a[0],+a[1]-1,1)))+'</span><b class="num">'+nf(m.tot)+'</b><small class="muted num">'+T2('refunds ','مرتجعات ')+nf(m.ref)+'</small></li>'}).join('')+'</ul>':'<div class="note">'+T2('Nothing logged yet.','لم يُسجَّل شيء بعد.')+'</div>';
    }else{
      const ym=R.ym,upTo=per==='cur'?ds(t):null;
      const T=monthTotals(ym,upTo);
      const pym=prevYm(ym,1);
      const pcap=per==='cur'?pym+'-'+String(Math.min(t.getDate(),dimOf(pym))).padStart(2,'0'):null;
      const Pm=monthTotals(pym,pcap);
      const hist=[];for(let i=1;i<=3;i++){const m=monthTotals(prevYm(ym,i));if(m.n)hist.push(m.tot-m.oo)}
      const avg3=hist.length?hist.reduce((a,b)=>a+b,0)/hist.length:null;
      let fixedPaid=0;bud().fixed.forEach(f=>{if(f.bl){const p=fxPaid(ym,f.k);if(p)fixedPaid+=Number(p.a)||0}});
      const mine=T.tot-T.oo,prev=Pm.tot-Pm.oo;
      body='<div class="stats"><div class="stat"><b class="num">'+nf(T.tot)+'</b><span>'+T2('spent','المصروف')+'<br>'+T2('net of refunds','بعد المرتجعات')+'</span></div><div class="stat"><b class="num">'+nf(T.ref)+'</b><span>'+T2('refunds','المرتجعات')+'</span></div><div class="stat"><b class="num">'+nf(T.inc)+'</b><span>'+T2('income','الدخل')+'<br>'+T2('logged','المتسجّل')+'</span></div></div>'
        +'<ul class="rep-list">'
        +'<li class="rep-row"><span>'+T2('Bills paid (Egypt)','الفواتير المدفوعة (مصر)')+'</span><b class="num">'+nf(fixedPaid)+'</b></li>'
        +(T.oo?'<li class="rep-row"><span>'+T2('One-offs (inside the spent figure)','مصاريف لمرة واحدة (داخل المصروف)')+'</span><b class="num">'+nf(T.oo)+'</b></li>':'')
        +'<li class="rep-row"><span>'+T2('vs last month'+(per==='cur'?' (same days)':''),'مقارنة بالشهر الماضي'+(per==='cur'?' (نفس الأيام)':''))+'</span><b class="num'+(prev>0?(mine>prev?' neg':mine<prev?' pos':''):'')+'">'+pctTxt(mine,prev)+'</b><small class="muted num">'+nf(mine)+' / '+nf(prev)+'</small></li>'
        +'<li class="rep-row"><span>'+(hist.length?T2('vs the average of the last '+hist.length+(hist.length===1?' month':' months'),'مقارنة بمتوسط آخر '+hist.length+(hist.length===1?' شهر':' شهور')):T2('vs the average of earlier months','مقارنة بمتوسط الشهور السابقة'))+'</span><b class="num">'+(avg3==null?'–':nf(avg3))+'</b><small class="muted">'+T2('a month','في الشهر')+'</small></li>'
        +'</ul><div class="note">'+(mine!==T.tot?T2('Comparisons leave out one-offs.','المقارنات بدون المصاريف لمرة واحدة.')+' ':'')+secTxt(T.tot)+'</div>';
    }
  }else if(sec==='trend'){
    const yms=[];for(let i=5;i>=0;i--)yms.push(prevYm(nowYm,i));
    const ms=yms.map(y=>monthTotals(y));
    const tot={};ms.forEach(m=>Object.keys(m.cats).forEach(k=>{tot[k]=(tot[k]||0)+m.cats[k]}));
    const keys=Object.keys(tot).filter(k=>tot[k]>0).sort((a,b)=>tot[b]-tot[a]).slice(0,7);
    if(!keys.length)body='<div class="note">'+T2('Nothing logged yet.','لم يُسجَّل شيء بعد.')+'</div>';
    else body='<div class="note rep-axis">'+yms.map(y=>'<span>'+esc(fmtMon.format(new Date(+y.split('-')[0],+y.split('-')[1]-1,1)))+'</span>').join('')+'</div><ul class="rep-list">'+keys.map(k=>{
      const vals=ms.map(m=>Math.max(0,m.cats[k]||0)),mx=Math.max.apply(null,vals)||1;
      const cur=vals[5],prv=vals[4];
      return '<li class="rep-trend"><span class="rt-name" data-notr="1">'+(k==='_none'?T2('Not categorised','بدون فئة'):esc(catName(k)))+'</span><span class="spk" role="img" aria-label="'+esc(vals.map(nf).join(', '))+'">'+vals.map(v=>'<i style="height:'+Math.max(3,Math.round(v/mx*100))+'%"></i>').join('')+'</span><b class="num">'+nf(cur)+'</b><small class="muted num">'+pctTxt(cur,prv)+'</small></li>';
    }).join('')+'</ul>';
  }else if(sec==='dow'){
    let first=null;eachEntry((x,d)=>{if(!eSkip(x)&&(!first||d<first))first=d});
    if(!first)body='<div class="note">'+T2('Nothing logged yet.','لم يُسجَّل شيء بعد.')+'</div>';
    else{
      let from=addDays(t,-89);if(pd(first)>from)from=pd(first);
      const sums=[0,0,0,0,0,0,0],cnt=[0,0,0,0,0,0,0],byd={};
      eachEntry((x,d)=>{if(eSkip(x))return;byd[d]=(byd[d]||0)+eNet(x)});
      for(let d=from;d<=t;d=addDays(d,1)){const w=d.getDay();cnt[w]++;sums[w]+=byd[ds(d)]||0}
      const avgs=sums.map((s,i)=>cnt[i]?s/cnt[i]:0),mx=Math.max.apply(null,avgs)||1;
      const order=[];for(let i=0;i<7;i++)order.push((S.weekStart+i)%7);
      body='<ul class="rep-list rep-dow">'+order.map(w=>'<li class="rep-dr'+(avgs[w]===mx&&mx>0?' top':'')+'"><span>'+esc(dowTxt(w,3))+'</span><span class="cat-bar"><i style="width:'+Math.max(2,Math.round(avgs[w]/mx*100))+'%"></i></span><b class="num">'+nf(avgs[w])+'</b></li>').join('')+'</ul><div class="note">'+T2('Average spent per day, from '+fmtShort.format(from)+' to today.','متوسط المصروف في اليوم، من '+fmtShort.format(from)+' حتى اليوم.')+'</div>';
    }
  }else{
    const mer={};
    eachEntry((x,d)=>{
      if(d<R.a||d>R.b||eSkip(x))return;
      const n=String(x.n||'').trim();if(!n||n==='Earlier total')return;
      const k=n.toLowerCase().replace(/\s+/g,' ');
      const o=mer[k]||(mer[k]={n:n,v:0,c:0});o.v+=eNet(x);o.c++;
    });
    const list=Object.keys(mer).map(k=>mer[k]).filter(o=>o.v>0).sort((a,b)=>b.v-a.v).slice(0,8);
    body=list.length?'<ul class="rep-list">'+list.map(o=>'<li class="rep-row"><span data-notr="1">'+esc(o.n)+'</span><b class="num">'+nf(o.v)+'</b><small class="muted num">'+o.c+'×</small></li>').join('')+'</ul>':'<div class="note">'+T2('Add a merchant or note to your expenses and the top ones show here.','اكتب اسم المحل أو ملاحظة مع المصاريف وسيظهر هنا الأعلى.')+'</div>';
  }
  return '<section class="card span2 reportcard"><div class="card-h"><div><h2>'+T2('Money report','تقرير المال')+'</h2><span class="sub">'+esc(R.label)+' · EGP</span></div>'+segP+'</div>'+segS+'<div class="rep-body">'+body+'</div>'
    +'<div class="mc-btns"><button type="button" class="chipbtn" data-act="ledger" data-v="'+per+'">'+T2('Export CSV for the ledger','صدّر ملف CSV للدفتر')+'</button></div><div class="mc-btns mc-exp"><span class="muted">'+T2('Everything, for the CFO:','كل البيانات، للمدير المالي:')+'</span><button type="button" class="chipbtn" data-act="fullexp" data-v="xlsx">Excel</button><button type="button" class="chipbtn" data-act="fullexp" data-v="csv">CSV</button><button type="button" class="chipbtn" data-act="fullexp" data-v="json">JSON</button></div></section>';
}
function sheetSave(){
  const sh=ui.sheet;if(!sh)return;const h=S.habits.find(x=>x.id===sh.hid);if(!h)return;
  if(sh.type==='num'){
    const raw=($('#sheet-num').value||'').trim();
    if(raw===''){applyNum(h,sh.pid,sh.d,null)}
    else{const v=parseFloat(raw);if(isNaN(v)||v<0){toast('Enter a number.');return}applyNum(h,sh.pid,sh.d,v)}
  }else{
    const note=($('#sheet-note')?$('#sheet-note').value:sh.note||'').trim();
    if(!sh.tag){toast('Pick what you produced.');return}
    const tg=hTargets(h,sh.pid);valSet(tg,sh.d,h.id,{t:sh.tag,n:note});tickSet(tg,sh.d,h.id,true);
  }
  closeSheet();rerender();
}
function sheetClear(){
  const sh=ui.sheet;if(!sh)return;const h=S.habits.find(x=>x.id===sh.hid);if(!h)return;
  const tg=hTargets(h,sh.pid);valSet(tg,sh.d,h.id);tickSet(tg,sh.d,h.id,false);closeSheet();rerender();
}
function stepVal(pid,hid,dstr,delta){
  const h=S.habits.find(x=>x.id===hid);if(!h)return;
  const cur=Number(getVal(repOf(h,pid),dstr,hid))||0;
  const max=h.type==='count'?Math.max(20,(h.goal||1)*3):20;
  if(h.lim){
    const raw=getVal(repOf(h,pid),dstr,hid),has=raw!=null&&typeof raw!=='object';
    const nv=has?Math.max(0,Math.min(max,cur+delta)):(delta<0?0:1);
    if(has&&nv===cur)return;
    applyNum(h,pid,dstr,nv);rerender();return;
  }
  const nv=Math.max(0,Math.min(max,cur+delta));
  if(nv===cur)return;
  applyNum(h,pid,dstr,nv);rerender();
}
function rerender(){const sc=window.scrollY;render();window.scrollTo(0,sc)}

/* charts */
const charts={};
function lineChart(id,series,labels){
  const W=640,H=250,ml=40,mr=18,mt=18,mb=32,iw=W-ml-mr,ih=H-mt-mb,n=labels.length;
  const x=i=>ml+(n>1?iw*i/(n-1):iw/2),y=v=>mt+ih*(1-v);
  let g='';
  [0,.5,1].forEach(v=>{g+='<line x1="'+ml+'" x2="'+(W-mr)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="var(--line)" stroke-width="1"/><text class="axis" x="'+(ml-8)+'" y="'+(y(v)+4)+'" text-anchor="end">'+Math.round(v*100)+'%</text>'});
  const every=n>8?2:1;
  labels.forEach((l,i)=>{if((n-1-i)%every===0)g+='<text class="axis" x="'+x(i)+'" y="'+(H-10)+'" text-anchor="middle">'+esc(l)+'</text>'});
  series.forEach((s,si)=>{
    let d='',open=false,last=-1;
    s.vals.forEach((v,i)=>{if(v==null){open=false;return}d+=(open?'L':'M')+x(i).toFixed(1)+' '+y(v).toFixed(1);open=true;last=i});
    if(series.length===1&&d){
      const pts=s.vals.map((v,i)=>v==null?null:[x(i),y(v)]).filter(Boolean);
      if(pts.length>1)g+='<path d="M'+pts[0][0]+' '+(mt+ih)+' L'+pts.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' L')+' L'+pts[pts.length-1][0]+' '+(mt+ih)+' Z" fill="'+s.color+'" opacity=".12"/>';
    }
    g+='<path d="'+d+'" fill="none" stroke="'+s.color+'" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
    s.vals.forEach((v,i)=>{if(v!=null)g+='<circle cx="'+x(i).toFixed(1)+'" cy="'+y(v).toFixed(1)+'" r="4.5" fill="'+s.color+'" stroke="var(--surface)" stroke-width="2"/>'});
    if(last>=0){const lv=s.vals[last];g+='<text x="'+(x(last)-2)+'" y="'+(y(lv)+(si===0?-11:19))+'" text-anchor="end" class="num" font-size="13" font-weight="700" fill="'+s.txt+'">'+Math.round(lv*100)+'%</text>'}
  });
  g+='<line id="'+id+'-x" x1="0" x2="0" y1="'+mt+'" y2="'+(mt+ih)+'" stroke="var(--ink3)" stroke-width="1" stroke-dasharray="3 3" opacity="0"/>';
  charts[id]={W:W,x:x,n:n,labels:labels,series:series};
  return '<div class="chartbox"><svg viewBox="0 0 '+W+' '+H+'" data-chart="'+id+'" role="img" aria-label="Completion trend">'+g+'</svg></div>';
}
function barPath(x,y,w,h,r){r=Math.min(r,h,w/2);const f=v=>v.toFixed(1);return 'M'+f(x)+' '+f(y+h)+' L'+f(x)+' '+f(y+r)+' Q'+f(x)+' '+f(y)+' '+f(x+r)+' '+f(y)+' L'+f(x+w-r)+' '+f(y)+' Q'+f(x+w)+' '+f(y)+' '+f(x+w)+' '+f(y+r)+' L'+f(x+w)+' '+f(y+h)+' Z'}
function barChart(series,labels){
  const W=640,H=250,ml=40,mr=18,mt=18,mb=32,iw=W-ml-mr,ih=H-mt-mb,n=labels.length,gw=iw/n,k=series.length;
  const bw=Math.min(34,(gw-14)/k-2),y=v=>mt+ih*(1-v);
  let g='';
  [0,.5,1].forEach(v=>{g+='<line x1="'+ml+'" x2="'+(W-mr)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="var(--line)"/><text class="axis" x="'+(ml-8)+'" y="'+(y(v)+4)+'" text-anchor="end">'+Math.round(v*100)+'%</text>'});
  labels.forEach((l,i)=>{
    const cx=ml+gw*(i+.5);
    g+='<text class="axis" x="'+cx+'" y="'+(H-10)+'" text-anchor="middle">'+esc(l)+'</text>';
    series.forEach((s,j)=>{
      const v=s.vals[i];if(v==null)return;
      const bx=cx-(k*bw+(k-1)*2)/2+j*(bw+2),h=Math.max(2,ih*v);
      g+='<path d="'+barPath(bx,mt+ih-h,bw,h,4)+'" fill="'+s.color+'" data-tip="'+esc('<b>'+l+'</b><br>'+s.name+': '+Math.round(v*100)+'%')+'"/>';
    });
  });
  return '<div class="chartbox"><svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Monthly completion">'+g+'</svg></div>';
}
function weeklyBarStrip(pid){
  const data=weekSeries([pid],12), W=620,H=252, left=36,right=14,top=30,base=207;
  const plotW=W-left-right,step=plotW/data.length,bw=Math.min(33,step-11),maxV=Math.max.apply(null,data.map(x=>x.pct==null?0:x.pct));
  let g='';
  [0,.25,.5,.75,1].forEach(v=>{const y=base-v*(base-top);g+='<line x1="'+left+'" x2="'+(W-right)+'" y1="'+y+'" y2="'+y+'" stroke="var(--line)" stroke-width="1"/><text x="'+(left-7)+'" y="'+(y+4)+'" text-anchor="end" class="axis">'+Math.round(v*100)+'%</text>'});
  data.forEach((r,i)=>{
    const x=left+step*(i+.5),v=r.pct, lab=fmtShort.format(r.a);
    if(v!=null){
      const h=Math.max(3,v*(base-top)),best=v===maxV&&v>0;
      g+='<path d="'+barPath(x-bw/2,base-h,bw,h,6)+'" fill="'+(best?'var(--brand)':'var(--pbar)')+'" data-tip="'+esc('<b>'+lab+'</b><br>'+Math.round(v*100)+'%')+'"/>';
      g+='<text x="'+x+'" y="'+Math.max(19,base-h-7)+'" text-anchor="middle" fill="var(--ink)" font-size="11" font-weight="800">'+Math.round(v*100)+'%</text>';
      if(best)g+='<path d="M'+(x-5)+' 10 l5 -5 5 5 -5 5z" fill="var(--best)"/>';
    }else{
      g+='<path d="'+barPath(x-bw/2,base-3,bw,3,2)+'" fill="var(--line)"/>';
    }
    g+='<text class="axis" x="'+x+'" y="229" text-anchor="middle">'+(i+1)+'</text>';
  });
  return '<div class="weekly-strip" style="--pbar:'+pcol(pid)+'" role="group" aria-label="Last 12 weeks"><div class="chartbox"><svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Weekly completion over twelve weeks">'+g+'</svg></div></div>';
}

function heatmap(pid){
  const t=today(),s=pd(S.start),ws=wkStart(t),first=addDays(ws,-77);
  let cells='';
  for(let c=0;c<12;c++)for(let r=0;r<7;r++){
    const d=addDays(first,c*7+r);
    if(d>t||d<s){cells+='<span class="hc fut"></span>';continue}
    const v=dayPct(pid,d);
    let bg='var(--surface2)';
    if(v>0){const lv=v>=1?100:v>.66?72:v>.33?48:26;bg='color-mix(in srgb, '+pcol(pid)+' '+lv+'%, var(--surface2))'}
    cells+='<span class="hc'+(sameDay(d,t)?' td':'')+'" style="background:'+bg+'" data-tip="'+esc('<b>'+fmtLong.format(d)+'</b><br>'+(v==null?'No habits':Math.round(v*100)+'% of habits done'))+'"></span>';
  }
  const wl=[];for(let i=0;i<7;i++)wl.push(i%2===0?dowTxt((S.weekStart+i)%7,1):'');
  const keys=[0,26,48,72,100].map(l=>'<i style="background:'+(l?'color-mix(in srgb, '+pcol(pid)+' '+l+'%, var(--surface2))':'var(--surface2)')+'"></i>').join('');
  return '<div class="heat"><div class="wl">'+wl.map(x=>'<span>'+x+'</span>').join('')+'</div><div class="cells">'+cells+'</div></div><div class="heatkey">Fewer '+keys+' All habits</div>';
}
function radar(pids){
  const cx=150,cy=150,R=100,n=AREAS.length;
  const RG=perRange(),cur=RG.r,prev=RG.p;
  const vals=(pid,r)=>{const st=stats(pid,r[0],r[1]);return AREAS.map(a=>{const x=st.byArea[a.id];return x&&x.exp>0?x.eq:0})};
  /* the chart zooms itself: the outer ring is the next step (25/50/75/100%) above the highest score, so the shape always fills the chart */
  const all=pids.map(pid=>vals(pid,cur));if(pids.length===1&&prev)all.push(vals(pids[0],prev));
  const mx=Math.max.apply(null,[0].concat.apply([],all));
  const top=[.25,.5,.75,1].find(t=>mx*1.08<=t)||1;
  const rad=v=>R*(0.05+0.95*Math.min(v/top,1));
  const ang=k=>-Math.PI/2+k*2*Math.PI/n;
  const pt=(k,r)=>[cx+r*Math.cos(ang(k)),cy+r*Math.sin(ang(k))];
  let g='';
  [.25,.5,.75,1].forEach(f=>{g+='<polygon points="'+AREAS.map((a,k)=>pt(k,rad(f*top)).map(v=>v.toFixed(1)).join(',')).join(' ')+'" fill="none" stroke="var(--line)"/>'
    +(f===1?'<text x="'+(cx+4)+'" y="'+(cy-rad(f*top)+10).toFixed(1)+'" font-size="9.5" fill="var(--ink3)" font-family="Figtree,system-ui,sans-serif">'+Math.round(f*top*100)+'%</text>':'')});
  AREAS.forEach((a,k)=>{const p=pt(k,R);g+='<line x1="'+cx+'" y1="'+cy+'" x2="'+p[0].toFixed(1)+'" y2="'+p[1].toFixed(1)+'" stroke="var(--line)"/>'});
  if(pids.length===1&&prev){
    const pv=vals(pids[0],prev);
    g+='<polygon points="'+pv.map((v,k)=>pt(k,rad(v)).map(z=>z.toFixed(1)).join(',')).join(' ')+'" fill="none" stroke="var(--ink3)" stroke-width="1.8" stroke-dasharray="5 4"/>';
  }
  pids.forEach(pid=>{
    const v=vals(pid,cur);
    g+='<polygon points="'+v.map((x,k)=>pt(k,rad(x)).map(z=>z.toFixed(1)).join(',')).join(' ')+'" fill="'+pcol(pid)+'" fill-opacity=".16" stroke="'+pcol(pid)+'" stroke-width="2.5" stroke-linejoin="round"/>';
    v.forEach((x,k)=>{const p=pt(k,rad(x));g+='<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="5.5" fill="'+pcol(pid)+'" stroke="var(--surface)" stroke-width="2" data-tip="'+esc('<b>'+AREAS[k].name+'</b><br>'+pname(pid)+': '+Math.round(x*100)+'%')+'"/>'});
  });
  AREAS.forEach((a,k)=>{
    const p=pt(k,R+20),dx=p[0]-cx,anchor=Math.abs(dx)<6?'middle':dx<0?'end':'start';
    g+='<text x="'+p[0].toFixed(1)+'" y="'+(p[1]+4).toFixed(1)+'" text-anchor="'+anchor+'" font-size="12.5" font-weight="600" fill="var(--ink2)" font-family="Figtree,system-ui,sans-serif">'+a.name+'</text>';
  });
  return '<svg viewBox="-40 0 380 300" style="width:100%;max-width:400px;margin-inline:auto;display:block" role="img" aria-label="Balance across life areas">'+g+'</svg>';
}

function scoreHow(pid,st){
  const rows=habitsFor(pid).map(h=>{const b=st.byHabit[h.id];if(!b||!(b.exp>0))return null;return {h:h,done:b.done,exp:b.exp,r:Math.min(1,b.done/b.exp)}}).filter(Boolean);
  if(!rows.length)return '';
  const sc=pct(st.pct);
  const R=x=>Math.round(x*10)/10;
  return '<details class="how"><summary>'+T2('How is '+sc+' made?','كيف جاءت '+sc+'؟')+'</summary><p class="note">'+T2('Each habit gets its own score: days done ÷ days it was due so far, at most 100%. A category is the average of its habits and the score is the average of the categories. Only finished days count; today is added when it ends.','لكل عادة نتيجتها: الأيام المنجزة ÷ الأيام التي كانت مستحقة حتى الآن، بحد أقصى 100%. والمجال هو متوسط عاداته، والنتيجة هي متوسط المجالات. تُحتسب الأيام المنتهية فقط، ويُضاف اليوم عند انتهائه.')+'</p><ul class="how-l">'
    +rows.map(x=>'<li><span data-notr="1">'+esc(hname(x.h))+'</span><b class="num">'+R(Math.min(x.done,x.exp))+' / '+R(x.exp)+'</b><i class="num">'+Math.round(x.r*100)+'%</i></li>').join('')+'</ul></details>';
}
function viewDash(){
  const pids=activePids();
  if(!pids.some(p=>habitsFor(p).length))return noHabits();
  const wk=P.wk(0),lw=P.wk(-1),mo=P.mo(0),lm=P.mo(-1);
  const wkLabel=fmtShort.format(wk[0])+' – '+fmtShort.format(wk[1]);
  /* hero: the score for the chosen period, with a plain explanation of how it is made */
  const RGH=perRange();
  const hero=pids.map(pid=>{
    const st=stats(pid,RGH.r[0],RGH.r[1]),sk=streaks(pid);
    return '<div>'+gauge(st.pct,pcol(pid),pname(pid),ptxt(pid))+scoreHow(pid,st)
      +'<div class="stats"><div class="stat"><b>'+svgi('flame')+sk.cur+'</b><span>'+T2('day streak','أيام متتالية')+'<br>'+T2('best ','الأفضل ')+sk.best+'</span></div></div></div>';
  }).join('');
  let tog='';
  if(pids.length>1){const m=statsMulti(pids,RGH.r[0],RGH.r[1]);tog='<div class="together"><b style="min-width:auto;font-size:14px;font-family:var(--f-b)">'+T2('Together','معًا')+'</b><div class="bar" role="img" aria-label="Together '+pct(m.pct)+'"><i style="width:'+(m.pct==null?0:Math.round(m.pct*100))+'%"></i></div><b>'+pct(m.pct)+'</b></div>'}
  const heroCard='<section class="card hero span2"><div class="datenav"><div style="flex:1;min-width:0"><h2>'+T2('Score','النتيجة')+'</h2><small>'+RGH.lbl+'</small></div>'+perSeg()+'</div><div class="herogrid">'+hero+'</div>'+tog+'</section>';
  /* improvement */
  const imp=pids.map(pid=>{
    const a=stats(pid,wk[0],wk[1]).pct,b=stats(pid,lw[0],lw[1]).pct,c=stats(pid,mo[0],mo[1]).pct,d=stats(pid,lm[0],lm[1]).pct;
    const ov=improvement([pid]);
    const tile=(label,cur,prev,note)=>{
      if(cur==null||prev==null)return '<div class="delta"><small>'+label+'</small><b>–</b><div class="from">'+(note||'Not enough data yet')+'</div></div>';
      const dl=Math.round((cur-prev)*100),cls=dl>0?'up':dl<0?'down':'',ic=dl>0?'up':dl<0?'down':'flat';
      return '<div class="delta '+cls+'"><small>'+label+'</small><b>'+svgi(ic,'',2.6)+(dl>0?'+':'')+dl+' pts</b><div class="from">'+pct(prev)+' → '+pct(cur)+'</div></div>';
    };
    return (pids.length>1?'<div class="pname"><span class="dot" style="background:'+pcol(pid)+'"></span>'+esc(pname(pid))+'</div>':'')
      +'<div class="dgrid">'+tile('This week vs last week',a,b)+tile('This month vs last month',c,d)
      +(ov?tile('Latest 4 weeks vs first 4 weeks',ov.to,ov.from):tile('Latest 4 weeks vs first 4 weeks',null,null,'Needs 8 weeks of check-ins'))+'</div>';
  }).join('<div style="height:14px"></div>');
  const impCard='<section class="card span2"><div class="card-h"><h2>How each of you is improving</h2><span class="sub">percentage points</span></div>'+imp+'<p class="note" style="margin-top:12px">'+T2('Score = the average of your habits. Each habit is days done ÷ days due so far, at most 100%.','النتيجة = متوسط عاداتك. كل عادة = الأيام المنجزة ÷ الأيام المستحقة حتى الآن، بحد أقصى 100%.')+'</p></section>';
  /* trend */
  let trendBody,legend;
  const cols=pids.map(p=>({name:pname(p),color:pcol(p),txt:ptxt(p),pid:p}));
  if(ui.trend==='week'){
    const n=10,labs=weekSeries(pids,n).map(x=>fmtShort.format(x.a));
    const ser=cols.map(c=>({name:c.name,color:c.color,txt:c.txt,vals:weekSeries([c.pid],n).map(x=>x.pct)}));
    trendBody=lineChart('trend',ser,labs);
  }else{
    const n=6,labs=monthSeries(pids,n).map(x=>fmtMon.format(x.a));
    const ser=cols.map(c=>({name:c.name,color:c.color,vals:monthSeries([c.pid],n).map(x=>x.pct)}));
    trendBody=barChart(ser,labs);
  }
  legend='<div class="legend">'+cols.map(c=>'<span><i style="background:'+c.color+'"></i>'+esc(c.name)+'</span>').join('')+'</div>';
  const trendCard='<section class="card"><div class="card-h"><h2>Progress over time</h2><div class="pill-seg" role="group" aria-label="Range"><button data-act="trend" data-v="week" aria-pressed="'+(ui.trend==='week')+'">Weeks</button><button data-act="trend" data-v="month" aria-pressed="'+(ui.trend==='month')+'">Months</button></div></div>'+trendBody+legend+'</section>';
  /* heatmaps */
  const heats=pids.map(pid=>'<section class="card"><div class="card-h"><h2>'+(pids.length>1?esc(pname(pid))+': ':'')+'Last 12 weeks</h2></div>'+weeklyBarStrip(pid)+'</section>').join('');
  /* balance */
  const arows=AREAS.map(a=>{
    const have=pids.some(p=>habitsFor(p).some(h=>h.area===a.id));
    if(!have)return '';
    const cnt='';
    const bars=pids.map(pid=>{
      if(!habitsFor(pid).some(h=>h.area===a.id))return '';
      const RG=perRange(),cm=stats(pid,RG.r[0],RG.r[1]).byArea[a.id],pm=RG.p?stats(pid,RG.p[0],RG.p[1]).byArea[a.id]:null;
      const v=cm&&cm.exp>0?cm.eq:null,pv=pm&&pm.exp>0?pm.eq:null;
      const dl=(v!=null&&pv!=null)?Math.round((v-pv)*100):null;
      return '<div class="hb" data-tip="'+esc('<b>'+a.name+'</b><br>'+pname(pid)+': '+pct(v)+(dl==null?'':' ('+(dl>0?'+':'')+dl+T2(' pts vs ',' نقطة مقابل ')+RG.pl+')'))+'"><i style="width:'+(v==null?0:Math.round(v*100))+'%;background:'+pcol(pid)+'"></i><b>'+pct(v)+(dl==null?'':' · '+(dl>0?'+':'')+dl)+'</b></div>';
    }).join('');
    return '<div class="arow">'+svgi(a.id)+'<div><div class="t"><span>'+a.name+'</span><em>'+perRange().lbl.toLowerCase()+(pd(S.start)>perRange().r[0]&&perRange().k!=='life'?' · '+T2('since ','منذ ')+fmtShort.format(pd(S.start)):'')+'</em></div>'+bars+cnt+'</div></div>';
  }).join('');
  const balCard='<section class="card span2"><div class="card-h"><h2>Balance across life areas</h2>'+perSeg()+'</div><p class="note" style="margin:-4px 0 8px">'+T2('Every habit counts the same. ','كل عادة لها الوزن نفسه. ')+(pids.length===1&&perRange().p?T2('Dashed = ','المتقطع = ')+perRange().pl:'')+'</p><div class="balance">'+radar(pids)+'<div class="arows">'+arows+'</div></div></section>';
  return '<div class="grid two">'+heroCard+impCard+trendCard+weightCard(pids)+heats+balCard+habitsMonthCard(pids,perRange().r)+trophyCard(pids)+'</div>';
}

/* ---------- dashboard blocks added for the new habit types ---------- */
function habitsMonthCard(pids,mo){
  const groups=AREAS.map(a=>{
    const hs=[],seen={};
    pids.forEach(pid=>ALLH(pid).forEach(h=>{if(h.area===a.id&&!seen[h.id]){seen[h.id]=1;hs.push(h)}}));
    if(!hs.length)return '';
    const chips=pids.map(pid=>{const x=stats(pid,mo[0],mo[1]).byArea[a.id];return x&&x.exp>0?'<span class="chip" style="gap:6px"><span class="dot" style="background:'+pcol(pid)+'"></span>'+pct(x.eq)+'</span>':''}).join(' ');
    const rows=hs.map(h=>{
      const bars=pids.map(pid=>{
        if(h.who.indexOf(pid)<0)return '';
        if(h.joint&&pid!==h.who[0])return '';
        const col=(h.joint&&pids.length>1)?'var(--brand)':pcol(pid);
        if(h.type==='cap'){
          const n=capSum(pid,h,mo[0],mo[1]),weeks=Math.max(1,Math.ceil(Math.min(daysIn(mo[0],mo[1]).length,31)/7));
          const ok=n<=h.goal*weeks;
          return '<div class="capline">'+stBadge(ok,n+' orders '+perWord()+', within '+h.goal+' a week',n+' orders '+perWord()+', over '+h.goal+' a week')+'</div>';
        }
        const x=stats(pid,mo[0],mo[1]).byHabit[h.id];if(!x)return '';
        const v=x.exp>0?x.cred/x.exp:null;
        return '<div class="hb thin" style="height:20px" data-tip="'+esc('<b>'+hname(h)+'</b><br>'+(h.joint?'Together':pname(pid))+': '+x.done+' done '+perWord())+'"><i style="width:'+(v==null?0:Math.round(v*100))+'%;background:'+col+'"></i><b>'+pct(v)+'</b></div>';
      }).join('');
      const freq=h.type==='cap'?'max '+h.goal+' a week':h.per==='month'?h.target+' a month':h.target+' days a week';
      return '<div class="hrow"><div class="hn2">'+esc(hname(h))+'<small>'+freq+(h.joint?' · together':'')+'</small></div>'+bars+'</div>';
    }).join('');
    return '<div class="agroup2 area-'+a.id+'"><div class="areahead" style="margin-bottom:8px"><span class="areaico" style="width:34px;height:34px">'+svgi(a.id)+'</span><h3 style="flex:1;min-width:0">'+esc(areaName(a.id))+'</h3><span style="display:flex;gap:6px">'+chips+'</span></div>'+rows+'</div>';
  }).join('');
  return '<section class="card span2"><div class="card-h"><h2>'+T2('Each habit','كل عادة')+' · '+perRange().lbl.toLowerCase()+'</h2><span class="sub">grouped by category</span></div><div class="agroups">'+groups+'</div></section>';
}
function spendStat(from,to){
  const h=S.habits.find(x=>x.type==='num'&&x.kind==='spend');if(!h)return null;
  const pid=h.who[0],tk=ds(today());let rec=[],miss=0,td=null;
  daysIn(from,to).forEach(d=>{const k=ds(d),v=getVal(pid,k,h.id),has=v!=null&&typeof v!=='object';
    if(k===tk){if(has)td=Number(v);return}
    if(has)rec.push(Number(v));else miss++});
  let n=rec.length,tot=rec.reduce((a,x)=>a+x,0);
  if(!n&&td!=null){n=1;tot=td}
  return {avg:n?tot/n:null,n:n,miss:miss,total:tot+((td!=null&&rec.length)?td:0)};
}
function spendCard(){
  const h=S.habits.find(x=>x.type==='num'&&x.kind==='spend');if(!h)return '';
  const pid=h.who[0],t=today(),sdt=pd(S.start),per=mdPer()==='week'?'week':'month',lastMo=mdPer()==='last';
  const gl=spLim(ds(t));
  let days;
  if(per==='week'){const w0=wkStart(t);days=[0,1,2,3,4,5,6].map(i=>addDays(w0,i))}
  else{const mo=P.mo(lastMo?-1:0);days=daysIn(mo[0],mo[1])}
  if(!days.length)return '<section class="card span2"><div class="card-h"><h2>'+T2('Daily spending','المصروف اليومي')+'</h2></div><div class="note">'+T2('Nothing to show: tracking started on '+fmtShort.format(sdt)+'.','لا شيء للعرض: بدأت المتابعة في '+fmtShort.format(sdt)+'.')+'</div></section>';
  const info=days.map(d=>{const k=ds(d),fut=d>t,pre=d<sdt;const v=(fut||pre)?null:getVal(pid,k,h.id);const has=v!=null&&typeof v!=='object';return {d:d,k:k,fut:fut,pre:pre,v:has?Number(v):null,ok:has&&Number(v)<=spLim(k)}});
  const logged=info.filter(x=>x.v!=null);
  const total=logged.reduce((a,x)=>a+x.v,0);
  const fin=(logged.length>1&&logged[logged.length-1].k===ds(t))?logged.slice(0,-1):logged;
  const avg=fin.length?fin.reduce((a,x)=>a+x.v,0)/fin.length:null;
  const under=logged.filter(x=>x.ok).length;
  const bestRun=achProgress(pid,{t:'underspend'});
  const seg='';
  let sub;
  if(per==='week')sub=fmtShort.format(days[0])+' – '+fmtShort.format(days[6]);
  else sub=fmtMonLong.format(days[0]);
  let chart;
  if(per==='week'){
    const W=340,Hh=170,pl=6,pb=34,pt=22,n=7,bw=(W-pl*2)/n,ch=Hh-pb-pt;
    const mx=Math.max.apply(null,[gl*1.25].concat(logged.map(x=>x.v)));
    const y=v=>pt+ch*(1-v/mx);
    let g='<line x1="'+pl+'" x2="'+(W-pl)+'" y1="'+y(gl).toFixed(1)+'" y2="'+y(gl).toFixed(1)+'" stroke="var(--ink3)" stroke-dasharray="5 4"/>';
    info.forEach((x,i)=>{
      const bx=pl+i*bw+bw*0.14,w=bw*0.72,cx=(bx+w/2).toFixed(1);
      if(x.v!=null){
        const hh=Math.max(2,ch*x.v/mx);
        g+='<path d="'+barPath(bx,y(x.v),w,hh,4)+'" fill="'+(x.ok?'var(--z3)':'#C62828')+'"/>';
        g+='<text x="'+cx+'" y="'+(y(x.v)-5).toFixed(1)+'" text-anchor="middle" class="axis spnum" font-weight="700">'+nf(x.v)+'</text>';
      }else{
        g+='<rect x="'+bx.toFixed(1)+'" y="'+(pt+ch-2)+'" width="'+w.toFixed(1)+'" height="2" fill="var(--line)"/>';
        g+='<text x="'+cx+'" y="'+(pt+ch-8)+'" text-anchor="middle" class="axis spnum" opacity=".6">'+((x.fut||x.pre)?'':'–')+'</text>';
      }
      g+='<text x="'+cx+'" y="'+(Hh-18)+'" text-anchor="middle" class="axis" font-weight="700">'+dowTxt(x.d.getDay(),3)+'</text><text x="'+cx+'" y="'+(Hh-5)+'" text-anchor="middle" class="axis">'+x.d.getDate()+'</text>';
    });
    chart='<div class="chartbox" style="margin-top:12px"><svg viewBox="0 0 '+W+' '+Hh+'" role="img" aria-label="'+esc(T2('Daily spending this week','المصروف اليومي هذا الأسبوع'))+'">'+g+'</svg></div>';
  }else{
    const off=(days[0].getDay()-S.weekStart+7)%7;
    const head=[0,1,2,3,4,5,6].map(i=>'<span class="spc-h">'+dowTxt((S.weekStart+i)%7,ui.lang==='ar'?3:1)+'</span>').join('');
    let cells='';for(let i=0;i<off;i++)cells+='<span class="spc-x"></span>';
    info.forEach(x=>{
      const cls=x.v!=null?(x.ok?' ok':' bad'):((x.fut||x.pre)?' off':' none');
      const inner='<i>'+x.d.getDate()+'</i><b class="num">'+(x.v!=null?nf(x.v):((x.fut||x.pre)?'':'–'))+'</b>';
      const isT=x.k===ds(t);
      cells+=(x.fut||x.pre)?'<span class="spc'+cls+'">'+inner+'</span>':'<button type="button" class="spc'+cls+(isT?' today':'')+'" data-act="spday" data-v="'+Math.round((x.d-t)/86400000)+'" aria-label="'+esc(fmtShort.format(x.d)+(x.v!=null?' · '+nf(x.v):''))+'">'+inner+'</button>';
    });
    chart='<div class="spcal" style="margin-top:12px">'+head+cells+'</div>';
  }
  return '<section class="card span2 spendcard"><div class="card-h"><div><h2>'+T2('Daily spending','المصروف اليومي')+'</h2><span class="sub">'+esc(sub)+' · '+esc(S.currency)+'</span></div>'+seg+'</div>'
    +(function(){const sm=spendStat(new Date(t.getFullYear(),t.getMonth(),1),new Date(t.getFullYear(),t.getMonth()+1,0)),sa=spendStat(pd(S.start),t);
      const stat=(b,l,cls)=>'<div class="stat'+(cls?' '+cls:'')+'"><b>'+b+'</b><span>'+l+'</span></div>';
      return '<div class="stats">'+stat(sm.avg==null?'–':nf(sm.avg),T2('average a day<br>this month','المتوسط في اليوم<br>هذا الشهر')+' · '+sm.n+' '+T2('days','أيام'))
        +stat(sa.avg==null?'–':nf(sa.avg),T2('average a day<br>all time','المتوسط في اليوم<br>كل الفترة')+' · '+sa.n+' '+T2('days','أيام'))
        +stat(sm.miss,T2('days not recorded<br>this month','أيام بلا تسجيل<br>هذا الشهر')+' · '+sa.miss+' '+T2('in all','في الكل'),sm.miss>0?'warn':'okk')+'</div>'
        +'<div class="note" style="margin-top:6px">'+T2('Average = total spent ÷ days that were recorded. Days with nothing recorded, and today until it is over, are left out. ','المتوسط = إجمالي المصروف ÷ الأيام المسجّلة. الأيام غير المسجّلة واليوم الحالي لا تُحسب. ')
        +(per==='week'?T2('This week: ','هذا الأسبوع: '):T2('This month: ','هذا الشهر: '))+'<b class="num">'+nf(total)+'</b> '+esc(S.currency)+' · '+under+'/'+logged.length+' '+T2('days within the limit','أيام ضمن الحد')+'</div>'})()
    +chart
    +'<div class="legend"><span><i style="background:transparent;border-top:2px dashed var(--ink3);height:0;border-radius:0"></i>'+T2('limit ','الحد ')+nf(gl)+'</span><span><i style="background:var(--z3)"></i>'+T2('within the limit','ضمن الحد')+'</span><span><i style="background:#C62828"></i>'+T2('over the limit','فوق الحد')+'</span></div>'
    +(per==='month'?'<div class="note" style="margin-top:6px">'+T2('Tap a day to open its log. Best run of days within the limit: ','اضغط على أي يوم لفتح سجله. أطول سلسلة أيام ضمن الحد: ')+'<b class="num">'+bestRun+'</b></div>':'')+'</section>';
}
function weightCard(pids){
  const items=[];
  pids.forEach(pid=>{
    const h=ALLH(pid).find(x=>x.kind==='weight'&&x.type==='num');if(!h)return;
    const pts=[];
    daysIn(pd(S.start),today()).forEach(d=>{const v=getVal(pid,ds(d),h.id);if(v!=null)pts.push({d:d,v:Number(v)})});
    items.push({pid:pid,pts:pts.slice(-12)});
  });
  if(!items.length)return '';
  const body=items.map(it=>{
    const p=it.pts;
    if(p.length<2)return '<div style="margin-bottom:10px">'+(pids.length>1?'<div class="pname"><span class="dot" style="background:'+pcol(it.pid)+'"></span>'+esc(pname(it.pid))+'</div>':'')+'<p class="note">'+(p.length?'First weigh-in: '+nf1(p[0].v)+' kg. A second one will draw the trend.':'No weigh-ins yet. Log your weight once a week.')+'</p></div>';
    const W=520,Hh=240,pl=44,pr=18,pt=30,pb=50,col=pcol(it.pid);
    const lo=Math.min.apply(null,p.map(x=>x.v)),hi=Math.max.apply(null,p.map(x=>x.v));
    const mn=Math.floor(lo-0.5),mx=Math.ceil(hi+0.5),step=Math.max(1,Math.ceil((mx-mn)/4)),top=mn+step*Math.ceil((mx-mn)/step);
    const t0=p[0].d.getTime(),span=Math.max(1,p[p.length-1].d.getTime()-t0);
    const X=i=>pl+(W-pl-pr)*(p[i].d.getTime()-t0)/span,Y=v=>pt+(Hh-pt-pb)*(1-(v-mn)/(top-mn));
    const dl=Math.round((p[p.length-1].v-p[0].v)*10)/10;
    let g='';
    for(let v=mn;v<=top+0.001;v+=step){g+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+Y(v).toFixed(1)+'" y2="'+Y(v).toFixed(1)+'" stroke="var(--line)" stroke-width="1"/><text x="'+(pl-6)+'" y="'+(Y(v)+4).toFixed(1)+'" text-anchor="end" class="axis wt-ax">'+nf1(v)+'</text>'}
    g+='<text x="'+(pl-6)+'" y="'+(pt-14)+'" text-anchor="end" class="axis wt-ax">kg</text>';
    /* area under the line, then the line; gaps of more than 9 days are dashed and say how many days */
    let area='M'+X(0).toFixed(1)+' '+(Hh-pb);
    p.forEach((x,i)=>{area+='L'+X(i).toFixed(1)+' '+Y(x.v).toFixed(1)});
    area+='L'+X(p.length-1).toFixed(1)+' '+(Hh-pb)+'Z';
    g+='<path d="'+area+'" fill="'+col+'" opacity=".12"/>';
    for(let i=1;i<p.length;i++){
      const days=Math.round((p[i].d-p[i-1].d)/864e5),gap=days>9;
      g+='<path d="M'+X(i-1).toFixed(1)+' '+Y(p[i-1].v).toFixed(1)+'L'+X(i).toFixed(1)+' '+Y(p[i].v).toFixed(1)+'" fill="none" stroke="'+col+'" stroke-width="3" stroke-linecap="round"'+(gap?' stroke-dasharray="3 6" opacity=".75"':'')+'/>';
      if(gap)g+='<text x="'+((X(i-1)+X(i))/2).toFixed(1)+'" y="'+(Math.min(Y(p[i].v),Y(p[i-1].v))-9).toFixed(1)+'" text-anchor="middle" class="axis wt-gap">'+days+' '+T2('days','يوم')+'</text>';
    }
    p.forEach((x,i)=>{
      const cx=X(i).toFixed(1),cy=Y(x.v).toFixed(1),row=i%2?14:0,pv=i?p[i-1].v:null,nx=i<p.length-1?p[i+1].v:null,below=pv!=null?x.v<pv:(nx!=null&&x.v<nx);
      g+='<line x1="'+cx+'" x2="'+cx+'" y1="'+(Hh-pb)+'" y2="'+(Hh-pb+4)+'" stroke="var(--ink3)"/>'
        +'<circle cx="'+cx+'" cy="'+cy+'" r="5.5" fill="'+col+'" stroke="var(--surface)" stroke-width="2.5" data-tip="'+esc('<b>'+fmtShort.format(x.d)+'</b><br>'+nf1(x.v)+' kg')+'"/>'
        +'<text x="'+(+cx+(i===0?-3:i===p.length-1?3:0))+'" y="'+(+cy+(below?21:-11))+'" text-anchor="'+(i===0?'start':i===p.length-1?'end':'middle')+'" class="wt-val" fill="'+col+'">'+nf1(x.v)+'</text>'
        +'<text x="'+cx+'" y="'+(Hh-pb+17+row)+'" text-anchor="middle" class="axis wt-ax">'+fmtShort.format(x.d)+'</text>';
    });
    return '<div style="margin-bottom:12px">'+(pids.length>1?'<div class="pname"><span class="dot" style="background:'+col+'"></span>'+esc(pname(it.pid))+'</div>':'')
      +'<div class="note" style="margin-bottom:4px">'+T2('Latest ','الأخير ')+nf1(p[p.length-1].v)+' kg · '+(dl>0?'+':'')+dl+' kg '+T2('since ','منذ ')+fmtShort.format(p[0].d)+' · '+T2('lowest ','الأدنى ')+nf1(lo)+' · '+p.length+' '+T2('weigh-ins','قياسات')+'</div><div class="chartbox wt-box" dir="ltr"><svg viewBox="0 0 '+W+' '+Hh+'" style="min-width:460px" role="img" aria-label="Weight trend">'+g+'</svg></div></div>';
}).join('');
  return '<section class="card"><div class="card-h"><h2>Weight trend</h2><span class="sub">weekly weigh-ins</span></div>'+body+'</section>';
}
const ACH_ICON={spark:'other',sun:'t_today',flame:'flame',check:'check',book:'mind',run:'body',drop:'body',scale:'body',wallet:'money',pot:'money',brief:'money',idea:'other',talk:'family',star:'other',heart:'heart',couple:'family'};
const tierIdx=(t,n)=>t<=0?0:(n<=1?3:Math.floor(1+(t-1)*5/(n-1)));
function trophyCard(pids){
  const ar=ui.lang==='ar';
  const trophyPiece=(x,featured)=>{
    const ic=ACH_ICON[x.a.icon]||'other', nm=ar?x.a.ar:x.a.en;
    const ti=tierIdx(x.tier,x.tiers.length),tn=ar?TIER_NAMES[ti].ar:TIER_NAMES[ti].en;
    const prog=x.max?(ar?'وصلت للقمة':'Top level'):(Math.min(Math.round(x.cur),x.next)+' / '+x.next);
    const pctNext=x.max?100:Math.round(Math.min(1,x.cur/x.next)*100);
    const pips=x.tiers.map((_,i)=>'<i class="pip'+(i<x.tier?' on':'')+'"></i>').join('');
    const desc=String(ar?x.a.dAr:x.a.dEn).replace('{n}',x.next==null?'':nf(x.next));
    return '<div class="trophy '+(featured?'featured-trophy ':'')+'tr'+ti+(x.tier>0?' got':'')+'" data-tip="'+esc('<b>'+nm+(tn?' · '+tn:'')+'</b><br>'+desc+'<br>'+(x.max?(ar?'وصلت للقمة':'Top level reached'):(nf(x.cur)+' / '+nf(x.next))))+'">'
      +'<span class="tico">'+svgi(ic)+'</span><span class="tt">'+esc(nm)+'</span><span class="tl">'+esc(tn||(ar?'لم تبدأ بعد':'Not yet'))+'</span>'
      +'<span class="pips">'+pips+'</span><span class="tbar"><i style="width:'+pctNext+'%"></i></span><span class="tp">'+prog+'</span></div>';
  };
  const body=pids.map(pid=>{
    const list=trophyList(pid);
    const lv=list.reduce((s,x)=>s+x.tier,0),total=list.reduce((s,x)=>s+x.tiers.length,0);
    const featured=list.find(x=>x.a.id==='k_streak')||list.find(x=>x.tier>0)||list[0];
    const remaining=list.filter(x=>x!==featured);
    const heading=(pids.length>1?'<div class="pname"><span class="dot" style="background:'+pcol(pid)+'"></span>'+esc(pname(pid))+' · ':'<div class="note" style="margin-bottom:8px">')+lv+' / '+total+' '+(ar?'مستوى':'levels')+'</div>';
    return '<div class="trophy-cabinet">'+heading+(featured?'<div class="feature-stage">'+trophyPiece(featured,true)+'</div>':'')+'<div class="shelf">'+remaining.map(x=>trophyPiece(x,false)).join('')+'</div></div>';
  }).join('<div style="height:14px"></div>');
  return '<section class="card span2 trophy-cabinet-card"><div class="card-h"><h2>Trophies</h2><span class="sub">'+(ar?'تنمو معك: لكل جائزة مستويات':'they grow with you: every trophy has levels')+'</span></div>'+body+'</section>';
}

/* impact */
const EVID={
  exercise:{title:'Physical activity and living longer',badge:'Observational research',
    body:'The World Health Organization recommends at least 150 minutes of moderate activity a week. A pooled analysis of six US studies (661,137 adults, median 14.2 years of follow-up) found mortality risk about 20% lower below that minimum, 31% lower at 1 to 2 times it, 37% lower at 2 to 3 times it and 39% lower at 3 to 5 times it, compared with no leisure-time activity.',
    src:'WHO physical activity fact sheet; Arem et al., JAMA Internal Medicine, 2015.'},
  spiritual:{title:'Regular religious practice and mortality',badge:'Observational research',
    body:'In the Nurses’ Health Study (74,534 women, 16 years), women who attended religious services more than once a week had about 33% lower mortality risk than women who never attended. Weekly attenders had 26% lower risk and less-than-weekly attenders 13% lower. The authors point to social support and lower depression as part of the explanation.',
    src:'VanderWeele et al., JAMA Internal Medicine, 2016. The study measured service attendance, not Qur’an recitation, and its sample was mostly US Christian women.'},
  reading:{title:'Reading and survival',badge:'Observational research',
    body:'Over 12 years in 3,635 adults, book readers had a lower risk of dying than non-readers: 17% lower for up to 3.5 hours of reading a week and 23% lower above that, about 23 months longer on average. The authors note that this shows association, not proof that reading causes longer life.',
    src:'Bavishi et al., Social Science & Medicine, 2016.'},
  connection:{title:'Close relationships and survival',badge:'Meta-analysis',
    body:'Across 148 studies and 308,849 people followed for 7.5 years on average, those with stronger social relationships had a 50% greater likelihood of survival (odds ratio 1.50). The studies measured social relationships broadly, not couple or family time specifically.',
    src:'Holt-Lunstad, Smith & Layton, PLoS Medicine, 2010.'},
  savings:{title:'Compound growth of what you set aside',badge:'Calculated, not a study',
    body:'Future value = P × ((1 + i)^n − 1) ÷ i, where P is your monthly amount, i the monthly rate and n the number of months. The yearly return is an assumption you can change in Setup. It is an illustration, not a forecast.',
    src:'Standard future-value-of-an-annuity formula.'}
};
const EVID_AR={
  exercise:{title:'النشاط البدني وطول العمر',badge:'بحث رصدي',body:'توصي منظمة الصحة العالمية بما لا يقل عن 150 دقيقة من النشاط المعتدل أسبوعيًا. تحليل مجمّع لست دراسات أمريكية (661,137 بالغًا، متابعة وسيطها 14.2 سنة) وجد أن خطر الوفاة أقل بنحو 20% تحت هذا الحد الأدنى، و31% عند 1 إلى 2 أضعافه، و37% عند 2 إلى 3 أضعافه، و39% عند 3 إلى 5 أضعافه، مقارنة بعدم ممارسة أي نشاط في وقت الفراغ.',src:'WHO physical activity fact sheet; Arem et al., JAMA Internal Medicine, 2015.'},
  spiritual:{title:'الممارسة الدينية المنتظمة والوفيات',badge:'بحث رصدي',body:'في دراسة صحة الممرضات (74,534 امرأة، 16 سنة)، كان خطر الوفاة أقل بنحو 33% عند النساء اللواتي يحضرن الشعائر الدينية أكثر من مرة في الأسبوع مقارنة بمن لا يحضرن أبدًا. ومن يحضرن أسبوعيًا كان الخطر عندهن أقل بنسبة 26%، ومن يحضرن أقل من أسبوعيًا 13%. ويشير الباحثون إلى الدعم الاجتماعي وقلة الاكتئاب كجزء من التفسير.',src:'VanderWeele et al., JAMA Internal Medicine, 2016. الدراسة قاست حضور الشعائر وليس تلاوة القرآن، وأغلب العينة نساء مسيحيات أمريكيات.'},
  reading:{title:'القراءة والبقاء',badge:'بحث رصدي',body:'خلال 12 سنة على 3,635 بالغًا، كان خطر الوفاة عند قراء الكتب أقل من غير القراء: 17% أقل لمن يقرؤون حتى 3.5 ساعات أسبوعيًا، و23% أقل لمن يقرؤون أكثر، أي حوالي 23 شهرًا أطول في المتوسط. ينبّه الباحثون أن هذا ارتباط وليس دليلًا على أن القراءة تطيل العمر.',src:'Bavishi et al., Social Science & Medicine, 2016.'},
  connection:{title:'العلاقات القريبة والبقاء',badge:'تحليل تجميعي',body:'عبر 148 دراسة و308,849 شخصًا تمت متابعتهم 7.5 سنة في المتوسط، كان من لديهم علاقات اجتماعية أقوى أكثر احتمالًا للبقاء على قيد الحياة بنسبة 50% (نسبة الأرجحية 1.50). قاست الدراسات العلاقات الاجتماعية بشكل عام وليس وقت الأزواج أو الأسرة تحديدًا.',src:'Holt-Lunstad, Smith & Layton, PLoS Medicine, 2010.'},
  savings:{title:'النمو المركّب لما تدّخره',badge:'حساب وليس دراسة',body:'القيمة المستقبلية = P × ((1 + i)^n − 1) ÷ i، حيث P مبلغك الشهري وi العائد الشهري وn عدد الشهور. العائد السنوي افتراض يمكنك تغييره في الإعدادات. هذا توضيح وليس توقعًا.',src:'صيغة القيمة المستقبلية للدفعات المنتظمة.'}
};
const LALLY_EN='In a study of 96 volunteers who each practised one daily behaviour, the median time to reach a plateau of automaticity was 66 days among the 39 people whose data could be modelled. The range ran from 18 to 254 days, and exercise took longer than eating or drinking habits (median 91 days, a small and statistically uncertain difference).';
const LALLY_AR='في دراسة على 96 متطوعًا مارس كل منهم سلوكًا يوميًا واحدًا، كان الوسيط للوصول إلى هضبة التلقائية 66 يومًا بين 39 شخصًا أمكن نمذجة بياناتهم. تراوح المدى من 18 إلى 254 يومًا، واستغرق التمرين وقتًا أطول من عادات الأكل والشرب (وسيط 91 يومًا، وهو فرق صغير وغير مؤكد إحصائيًا).';

/* ---------- Impact: numbers on top, coach, deeper chapters ---------- */
function impactTop(pids,rg){
  const sc=(pid,aid)=>{const x=stats(pid,rg[0],rg[1]).byArea[aid];return x&&x.exp>0?x.eq:null};
  const tile=(label,vals,cls,ic,aid)=>'<div class="itile'+(cls?' '+cls:'')+(aid?' area-'+aid:'')+'"><div class="ith"><span class="ti">'+svgi(ic,'',2.2)+'</span><span class="n">'+label+'</span></div><div class="iv">'+vals.map(v=>'<b class="num" style="--vc:'+v.c+'">'+(v.v==null?'–':Math.round(v.v*100)+'<small>%</small>')+'</b>').join('')+'</div>'+vals.map(v=>'<div class="it"><i style="--vc:'+v.c+';width:'+(v.v==null?0:Math.round(v.v*100))+'%"></i></div>').join('')+'</div>';
  let h=tile(T2('Overall','المجموع'),pids.map(p=>({v:stats(p,rg[0],rg[1]).pct,c:pcol(p)})),'dark','flame');
  AREAS.forEach(a=>{
    if(!pids.some(p=>habitsFor(p).some(x=>x.area===a.id)))return;
    h+=tile(esc(areaName(a.id)),pids.map(p=>({v:sc(p,a.id),c:pcol(p)})),'',a.id,a.id);
  });
  const sm=spendStat(rg[0],rg[1]);
  let money='';
  if(sm&&(sm.n||sm.miss)){
    money='<div class="itile wide dark"><div class="ith"><span class="ti">'+svgi('wealth','',2.2)+'</span><span class="n">'+T2('Spending, average a day','المصروف، المتوسط في اليوم')+'</span></div><div class="iv"><b class="num">'+(sm.avg==null?'–':nf(sm.avg))+' <small>'+esc(S.currency)+'</small></b></div><span class="small">'+sm.n+' '+T2('recorded days','أيام مسجّلة')+(sm.miss>0?' · <b class="amber">'+sm.miss+' '+T2('not recorded','بلا تسجيل')+'</b>':' · '+T2('none missing','لا نقص'))+'</span></div>';
  }
  return '<section class="itiles" aria-label="'+esc(T2('Scores for every area','نتائج كل المجالات'))+'">'+h+money+'</section>';
}
const cpick=o=>o?((ui.lang==='ar')?o.ar:o.en)||null:null;
const cx=t=>esc(t).replace(/«([^»]+)»/g,'<q class="ayah" lang="ar" dir="rtl">$1</q>');
const cUl=(a,cls)=>(a&&a.length)?'<ul class="cdl'+(cls?' '+cls:'')+'">'+a.map(x=>'<li>'+cx(x)+'</li>').join('')+'</ul>':'';
const cPair=(a,b)=>(a||b)?'<div class="cdpair">'+a+b+'</div>':'';
const cSec=(l,body)=>body?'<div class="cds"><div class="lbl">'+l+'</div>'+body+'</div>':'';
function cName(k){return k==='together'?T2('Together','معًا'):pname(k)}
function cLifeCard(k,L,kind,when){
  const kt=T2('Monthly review','المراجعة الشهرية');
  const P=t=>t?'<p>'+cx(t)+'</p>':'';
  const pc=k==='together'?'var(--brand)':pcol(k);
  const ini=(cName(k)||'?').trim().charAt(0).toUpperCase();
  return '<section class="card cdeep cdlife span2" style="--pc:'+pc+'" lang="'+LG()+'" dir="'+DIR()+'" data-notr="1"><div class="cdhero"><div class="cdh"><span class="cav">'+esc(ini)+'</span><span class="cdn"><b>'+esc(cName(k))+'</b><small>'+kt+(when?' · '+esc(when):'')+'</small></span></div>'
    +(L.headline?'<h3 class="cdt">'+cx(L.headline)+'</h3>':'')+'</div>'
    +'<div class="cdbody">'
    +cSec(T2('Your mission','مهمتك'),L.mission?'<p class="lead">'+cx(L.mission)+'</p>':'')
    +cSec(T2('What I see in you','ما أراه فيك'),P(L.psych))
    +cPair(cSec(T2('Your strengths','نقاط قوتك'),cUl(L.strengths)),cSec(T2('Watch out','انتبه'),cUl(L.watch)))
    +cPair(cSec(T2('Discipline','الانضباط'),cUl(L.discipline)),(L.changes&&L.changes.length?cSec(T2('Habits to change','عادات للتغيير'),cUl(L.changes)):''))
    +cSec(T2('Next month','الشهر القادم'),cUl(L.steps))
    +(L.message?'<div class="cdq">'+cx(L.message)+'</div>':'')
    +'</div></section>';
}
function deepCoach(pids){
  const D=COACHNOTE&&COACHNOTE.deep;if(mode==='sample'||!D)return '';
  const keys=(pids.length>1?['together']:[]).concat(pids);
  let h='';
  if(D.daily){
    const rows=keys.filter(k=>D.daily[k]&&cpick(D.daily[k]));
    if(rows.length)h+='<section class="card cdeep cdday span2" lang="'+LG()+'" dir="'+DIR()+'" data-notr="1"><div class="cdh cdhd"><span class="cic big">'+svgi('sun','',2.2)+'</span><span class="cdn"><b>'+T2('Today','اليوم')+'</b><small>'+T2('Daily note','ملاحظة اليوم')+(D.daily.date?' · '+esc(D.daily.date):'')+'</small></span></div>'
      +rows.map(k=>'<div class="cds cdperson" style="--pc:'+(k==='together'?'var(--brand)':pcol(k))+'">'+(rows.length>1?'<div class="lbl"><span class="dot" style="background:var(--pc)"></span><span>'+esc(cName(k))+'</span></div>':'')+String(cpick(D.daily[k])).split(/\n+/).filter(Boolean).map(x=>'<p>'+cx(x)+'</p>').join('')+'</div>').join('')+'</section>';
  }
  if(D.monthly)keys.forEach(k=>{const n=D.monthly[k],L=n&&cpick(n.life);if(L)h+=cLifeCard(k,L,'monthly',D.monthly.month||'')});
  return h;
}
function pfNudge(pids){
  const low=pids.filter(p=>pfCount(p).n<20);if(mode==='sample'||!low.length)return '';
  return '<section class="card pfnudge span2" data-notr="1"><div><b>'+T2('Make your coach personal','اجعل مدرّبك شخصيًّا')+'</b><p class="note">'+T2('A long, optional, tap-to-answer questionnaire about your mission, strengths, faith, health and family. The more you share, the more your coach can speak to you.','استبيان طويل واختياري بخيارات جاهزة عن مهمتك ونقاط قوتك وإيمانك وصحتك وأسرتك. كلما شاركت أكثر خاطبك مدرّبك بصورة أدق.')+'</p></div><div class="chips">'+low.map(p=>'<button type="button" class="btn" data-act="pfopen" data-p="'+p+'">'+esc(pname(p))+' · '+pfCount(p).n+'/'+pfCount(p).tot+'</button>').join('')+'</div></section>';
}
function viewImpact(){
  const pids=activePids();
  if(!pids.some(p=>habitsFor(p).length))return noHabits();
  const RGI=perRange(),mo=RGI.r;
  const head='<div class="datenav" style="flex-wrap:wrap;gap:10px"><div style="flex:1 1 220px;min-width:0"><h2>Impact on our lives</h2><small>'+RGI.lbl+(RGI.k==='month'||RGI.k==='week'?T2(' so far · as of ',' حتى الآن · بتاريخ ')+fmtShort.format(today()):'')+' · '+T2('every habit counts the same','كل عادة لها الوزن نفسه')+'</small></div><div style="flex:1 1 100%">'+perSeg()+'</div></div>';
  const intro='<p class="disc">'+T2('Your numbers come from your own check-ins. Coaching is guidance, not medical or financial advice.','أرقامك من تسجيلك أنت. التوجيه إرشاد وليس نصيحة طبية أو مالية.')+'</p>';
  const hasDeep=!!(COACHNOTE&&COACHNOTE.deep&&mode!=='sample');
  const coaches='<div class="grid two">'+impactTop(pids,mo).replace('<section class="itiles"','<section class="itiles span2"')+(hasDeep?deepCoach(pids):claudeNote(pids))+pfNudge(pids)+(hasDeep?'':(pids.length>1&&coachJointCard()?coachJointCard().replace('class="card coach"','class="card coach span2"'):'')+pids.map(coachCard).join(''))+'</div>';
  return head+intro+coaches;
}

/* setup */
function ensureDraft(){
  if(draft)return;
  const base=mode==='sample'?defaults():JSON.parse(JSON.stringify(S));
  const habits=[];
  LIB.forEach(l=>{
    const ex=base.habits.find(h=>h.id===l.key);
    habits.push(ex?Object.assign({type:'tick',per:'week',goal:0,joint:false,ar:'',on:true},ex):Object.assign(mkHabit(l),{on:l.on&&mode==='sample'}));
  });
  base.habits.forEach(h=>{if(!LIB.some(l=>l.key===h.id))habits.push(Object.assign({on:true},h))});
  base.habits=habits;draft=base;
}
const whoVal=h=>h.who.length>1?'both':h.who[0]||'both';
function whoVal2(h){return h.joint?'joint':(h.who.length>1?'both':(h.who[0]||'both'))}
function settingRow(h,D){
  const u=KINDS[h.kind]?KINDS[h.kind].unit:'';
  const custom=!LIB.some(l=>l.key===h.id);
  const id=esc(h.id),monthly=h.per==='month',maxT=monthly?31:7;
  const needsAmt=h.type==='tick'&&!!u;
  const needsGoal=h.type==='count'||h.type==='num'||h.type==='cap';
  const goalLbl=h.type==='cap'?'Maximum a week':(h.type==='count'&&h.lim)?'Maximum per day':h.type==='count'?'Goal per day':'Daily limit or goal';
  const rng=[];for(let n=1;n<=maxT;n++)rng.push(n);
  return '<div class="hset area-'+esc(h.area)+(h.on?'':' off')+'" data-row="'+id+'"><div class="top2"><input type="checkbox" id="on-'+id+'" data-f="habit" data-h="'+id+'" data-k="on"'+(h.on?' checked':'')+' aria-label="Track '+esc(hname(h))+'">'
    +(custom?'<input class="in" id="hn-'+id+'" data-f="habit" data-h="'+id+'" data-k="name" value="'+esc(h.name)+'">':'<label for="on-'+id+'" style="flex:1;min-width:0;overflow-wrap:anywhere">'+esc(hname(h))+'</label>')+'</div>'
    +'<div class="fgrid">'
    +'<label class="f">Life area<select class="in" id="ar-'+id+'" data-f="habit" data-h="'+id+'" data-k="area">'+AREAS.map(a=>opt(a.id,a.name,a.id===h.area)).join('')+'</select></label>'
    +'<label class="f">How often<select class="in" id="pe-'+id+'" data-f="habit" data-h="'+id+'" data-k="per">'+opt('week','Per week',!monthly)+opt('month','Per month',monthly)+'</select></label>'
    +'<label class="f">Times<select class="in" id="tg-'+id+'" data-f="habit" data-h="'+id+'" data-k="target">'+rng.map(n=>opt(n,n,n===+h.target)).join('')+'</select></label>'
    +'<label class="f">Type<select class="in" id="ty-'+id+'" data-f="habit" data-h="'+id+'" data-k="type">'+Object.keys(TYPES).map(k=>opt(k,TYPES[k],k===h.type)).join('')+'</select></label>'
    +'<label class="f">Counts as<select class="in" id="kd-'+id+'" data-f="habit" data-h="'+id+'" data-k="kind">'+Object.keys(KINDS).map(k=>opt(k,KINDS[k].label,k===h.kind)).join('')+'</select></label>'
    +'<label class="f">Amount each time'+(u?' ('+(u==='cur'?esc(D.currency):u)+')':'')+'<input class="in" id="am-'+id+'" inputmode="decimal" data-f="habit" data-h="'+id+'" data-k="amount" value="'+esc(h.amount||'')+'"'+(needsAmt?'':' disabled placeholder="not needed"')+'></label>'
    +(needsGoal&&h.kind!=='spend'?'<label class="f">'+goalLbl+'<input class="in" id="gl-'+id+'" inputmode="decimal" data-f="habit" data-h="'+id+'" data-k="goal" value="'+esc(h.goal||'')+'"></label>':'')+(h.kind==='spend'?'<div class="note" style="grid-column:1/-1">'+T2('The daily limit is the Living budget divided by the days in the month. Change the budget from Budgets on Today.','الحد اليومي هو ميزانية المعيشة ÷ عدد أيام الشهر. غيّر الميزانية من "الميزانيات" في صفحة اليوم.')+'</div>':'')
    +'<label class="f">Who<select class="in" id="wh-'+id+'" data-f="habit" data-h="'+id+'" data-k="who">'+opt('both','Both of us, separate ticks',whoVal2(h)==='both')+opt('joint','Together, one tick for both',whoVal2(h)==='joint')+opt('p1',D.people[0].name||'Person one',whoVal2(h)==='p1')+opt('p2',D.people[1].name||'Person two',whoVal2(h)==='p2')+'</select></label>'
    +'</div></div>';
}

function opt(v,l,sel){return '<option value="'+esc(v)+'"'+(sel?' selected':'')+'>'+esc(l)+'</option>'}
const FOLD_DEF=['share','set','pf'];
function isShut(k){return ui.fold&&k in ui.fold?!!ui.fold[k]:(FOLD_DEF.indexOf(k)>=0||k.slice(0,2)==='a-')}
function foldAttr(k){return ' data-fold="'+k+'"'+(isShut(k)?' data-shut="1"':'')}
function foldCls(k){return isShut(k)?' fold-shut':''}
function foldBtn(k){return '<button type="button" class="foldbtn" data-act="setfold" data-v="'+k+'" aria-expanded="'+(!isShut(k))+'" aria-label="'+T2('Show or hide this section','إظهار هذا القسم أو إخفاؤه')+'">'+svgi('chr')+'</button>'}
function pfCard(){
  if(mode==='sample')return '';
  return '<section class="card form'+foldCls('pf')+'" data-fold="pf"><div class="card-h" style="margin:0"><h2>Deep profile</h2><span class="sub">A coach that really knows you</span>'+foldBtn('pf')+'</div><p class="note">A long, optional, tap-to-answer questionnaire about your mission, strengths, faith, health, family, money and how you want to be coached. Your coach uses it to talk to you personally. Each of you fills in your own.</p><div class="chips" style="margin-top:8px">'+S.people.map(p=>{const c=pfCount(p.id);return '<button type="button" class="btn alt" data-act="pfopen" data-p="'+p.id+'" data-notr="1">'+esc(pname(p.id))+' · '+c.n+' of '+c.tot+'</button>'}).join('')+'</div></section>';
}
function viewSetup(){
  ensureDraft();
  const D=draft;
  const people=D.people.map(p=>{
    const f=AREAS.map(a=>'<label><input type="checkbox" data-f="focus" data-p="'+p.id+'" data-a="'+a.id+'"'+(p.focus.indexOf(a.id)>=0?' checked':'')+'>'+a.name+'</label>').join('');
    return '<section class="card form jewel-profile person-'+p.id+foldCls('prof-'+p.id)+'" data-fold="prof-'+p.id+'"><div class="ph"><span class="dot" style="background:'+pcol(p.id)+'"></span><h3 style="flex:1">'+esc(p.name||('Profile'+(p.id==='p1'?' one':' two')))+'</h3>'+foldBtn('prof-'+p.id)+'</div>'
      +'<div class="fgrid"><label class="f">Name<input class="in" id="nm-'+p.id+'" data-f="person" data-p="'+p.id+'" data-k="name" value="'+esc(p.name)+'" autocomplete="off"></label>'
      +'<label class="f">Birth year<input class="in" id="yr-'+p.id+'" inputmode="numeric" data-f="person" data-p="'+p.id+'" data-k="year" value="'+esc(p.year)+'" placeholder="e.g. 1988"></label>'
      +'<label class="f">Height (cm)<input class="in" id="ht-'+p.id+'" inputmode="decimal" data-f="person" data-p="'+p.id+'" data-k="height" value="'+esc(p.height)+'"></label>'
      +'<label class="f">Weight (kg)<input class="in" id="wt-'+p.id+'" inputmode="decimal" data-f="person" data-p="'+p.id+'" data-k="weight" value="'+esc(p.weight)+'"></label>'
      +'<label class="f">Arabic wording<select class="in" id="gd-'+p.id+'" data-f="person" data-p="'+p.id+'" data-k="g">'+opt('m','Masculine',(p.g||(p.id==='p2'?'f':'m'))==='m')+opt('f','Feminine',(p.g||(p.id==='p2'?'f':'m'))==='f')+'</select></label></div>'
      +'<label class="f">Why these habits matter to you<textarea class="in" id="why-'+p.id+'" data-f="person" data-p="'+p.id+'" data-k="why" placeholder="Optional. One or two lines.">'+esc(p.why)+'</textarea></label>'
      +'<div><div class="note" style="margin-bottom:6px;font-weight:600">Areas you most want to grow</div><div class="focus">'+f+'</div></div></section>';
  }).join('');
  const habHtml=AREAS.map(a=>{
    const hs=D.habits.filter(h=>h.area===a.id);if(!hs.length)return '';
    return '<div class="agwrap'+foldCls('a-'+a.id)+'" data-fold="a-'+a.id+'"><div class="agh area-'+a.id+'">'+svgi(a.id)+'<span style="flex:1">'+esc(a.name)+' <small style="opacity:.7;text-transform:none;letter-spacing:0">('+hs.length+')</small></span>'+foldBtn('a-'+a.id)+'</div><div class="agbody">'+hs.map(h=>settingRow(h,D)).join('')+'</div></div>';
  }).join('');
  const add='<div class="hset" style="border-style:dashed"><div class="top2">Add your own habit</div><div class="fgrid"><label class="f">Habit<input class="in" id="new-name" placeholder="e.g. Walk after dinner"></label><label class="f">Life area<select class="in" id="new-area">'+AREAS.map(a=>opt(a.id,a.name,false)).join('')+'</select></label><label class="f">Counts as<select class="in" id="new-kind">'+Object.keys(KINDS).map(k=>opt(k,KINDS[k].label,k==='general')).join('')+'</select></label></div><div><button class="btn alt" data-act="addhabit">Add habit</button></div></div>';
  const settings='<section class="card form'+foldCls('set')+'" data-fold="set"><div class="card-h" style="margin:0"><h2>Settings</h2>'+foldBtn('set')+'</div><div class="fgrid">'
    +'<label class="f">Currency<select class="in" id="cur" data-f="set" data-k="currency">'+['AED','SAR','EGP','USD','EUR','GBP'].map(c=>opt(c,c,c===D.currency)).join('')+'</select></label>'
    +'<label class="f">Savings return assumed (% a year)<input class="in" id="rate" inputmode="decimal" data-f="set" data-k="rate" value="'+esc(D.rate)+'"></label>'
    +'<label class="f">Week starts on<select class="in" id="wks" data-f="set" data-k="weekStart">'+[[6,'Saturday'],[0,'Sunday'],[1,'Monday']].map(x=>opt(x[0],x[1],x[0]===+D.weekStart)).join('')+'</select></label></div></section>';
  const share=DB?'<section class="card form'+foldCls('share')+'" data-fold="share"><div class="card-h" style="margin:0"><h2>Share with your partner</h2><span class="sub">One link for both phones</span>'+foldBtn('share')+'</div>'
    +'<p class="note">Send this link to your partner. When she opens it, she sees the same profiles and check-ins, and her ticks show on your phone too. Anyone who has the link can see and edit, so share it only with her.</p>'
    +'<input class="in" id="sharelink" readonly value="'+esc(shareLink())+'" onfocus="this.select()">'
    +'<div class="sticky-save"><button class="btn" data-act="copylink">Copy link</button>'+(navigator.share?'<button class="btn alt" data-act="sharelink">Send...</button>':'')+'</div></section>'
    :'';
  const reset=ui.confirmReset
    ?'<div class="card form" style="border-color:#C62828"><p><b>Erase all check-ins and settings?</b> This removes your profiles, habits and history from this page and cannot be undone.</p><div class="sticky-save"><button class="btn danger" data-act="reset2">Yes, erase everything</button><button class="btn alt" data-act="reset0">Cancel</button></div></div>'
    :(mode!=='sample'?'<div class="sticky-save"><button class="btn alt" data-act="csv">Download check-ins (CSV)</button><button class="btn alt" data-act="reset1">Start over</button></div>':'');
  return '<div><h2>'+(mode==='sample'?'Set up your profiles and habits':'Profiles, habits and settings')+'</h2><p class="note" style="margin-top:6px">'+(mode==='sample'?'Names are filled in for you. Choose the habits you want and who each one is for, then save.':'Changes apply from now on. Past check-ins stay as they are.')+'</p></div>'
    +'<div class="foldbar"><button type="button" class="btn alt" data-act="setfoldall" data-v="open">'+T2('Expand all','فتح الكل')+'</button><button type="button" class="btn alt" data-act="setfoldall" data-v="shut">'+T2('Collapse all','طي الكل')+'</button></div>'
    +'<div class="grid two">'+people+'</div>'
    +'<section class="card form'+foldCls('habits')+'" data-fold="habits"><div class="card-h" style="margin:0"><h2>Habits</h2><span class="sub">Tick the ones you will track</span>'+foldBtn('habits')+'</div>'+habHtml+add+'</section>'
    +pfCard()+share+settings+'<p class="note">Quotes, advice and trophies version '+CONTENT.v+' · '+esc(CONTENT.updated||'')+'</p><p class="note" style="opacity:.75">App build '+BUILD+' · today '+ds(today())+' · quote '+esc((dailyItem('today')||{}).id||'-')+' · money quote '+esc((dailyItem('money')||{}).id||'-')+' · background '+esc(String((document.querySelector('.top')||{dataset:{}}).dataset.scene||'-'))+'</p>'
    +'<div class="sticky-save"><button class="btn" data-act="savesetup">'+(mode==='sample'?'Save and start tracking':'Save changes')+'</button></div>'+reset;
}
function onSetupInput(el){
  if(el.dataset.f==='pf'){onPfInput(el);return}
  if(!draft)return;draftDirty=true;
  const f=el.dataset.f,k=el.dataset.k;
  if(f==='person'){const p=draft.people.find(x=>x.id===el.dataset.p);if(p)p[k]=el.value}
  else if(f==='focus'){
    const p=draft.people.find(x=>x.id===el.dataset.p),a=el.dataset.a;if(!p)return;
    const i=p.focus.indexOf(a);if(el.checked&&i<0)p.focus.push(a);if(!el.checked&&i>=0)p.focus.splice(i,1);
  }else if(f==='set'){draft[k]=(k==='weekStart')?+el.value:el.value}
  else if(f==='habit'){
    const h=draft.habits.find(x=>x.id===el.dataset.h);if(!h)return;
    if(k==='on'){h.on=el.checked;const row=el.closest('.hset');if(row)row.classList.toggle('off',!h.on)}
    else if(k==='who'){h.joint=el.value==='joint';h.who=(el.value==='both'||el.value==='joint')?['p1','p2']:[el.value]}
    else if(k==='per'){h.per=el.value;if(h.per==='week'&&h.target>7)h.target=7;render()}
    else if(k==='type'){h.type=el.value;if(h.type==='cap'&&!h.goal)h.goal=h.target||1;render()}
    else if(k==='goal'){h.goal=Number(el.value)||0}
    else if(k==='target'){h.target=+el.value}
    else if(k==='kind'){
      h.kind=el.value;
      const u=KINDS[h.kind].unit,am=$('#am-'+h.id);
      if(am){am.disabled=!u;am.placeholder=u?'':'not needed';if(!u){am.value='';h.amount=0}}
    }
    else h[k]=el.value;
  }
}
function saveSetup(){
  const D=draft;
  if(!D.people.every(p=>String(p.name).trim())){toast('Please enter both names.');return}
  const habits=D.habits.filter(h=>h.on&&String(h.name).trim()).map(h=>({id:h.id,name:String(h.name).trim(),ar:h.ar||'',area:h.area,kind:h.kind,type:h.type||'tick',target:+h.target||1,per:h.per||'week',amount:Number(h.amount)||0,goal:Number(h.goal)||0,who:h.who.length?h.who:['p1','p2'],joint:!!h.joint,tags:h.tags||null,lim:h.lim?1:0}));
  if(!habits.length){toast('Choose at least one habit.');return}
  const first=mode==='sample';
  const cfg={v:2,setup:true,underDone:true,currency:D.currency,rate:Number(D.rate)||0,weekStart:+D.weekStart,start:first?ds(today()):S.start,
    people:D.people.map(p=>({id:p.id,name:String(p.name).trim(),g:p.g||(p.id==='p2'?'f':'m'),year:p.year,height:p.height,weight:p.weight,why:p.why,focus:p.focus})),habits:habits};
  S=cfg;
  if(first){L={p1:{},p2:{}};V={p1:{},p2:{}};E={p1:{},p2:{}};F={p1:{},p2:{}};PR={p1:{},p2:{}};B=null;mode=DB?'db':'local';ui.dayOff=0;ui.weekOff=0}
  draft=null;draftDirty=false;
  saveConfig();S.people.forEach(p=>{saveLog(p.id);saveVal(p.id);if(Object.keys(E[p.id]||{}).length)saveExp(p.id);if(Object.keys(F[p.id]||{}).length)saveFix(p.id)});
  if(!DB)setSync('local');
  toast(first?'Saved. Tracking starts today.':'Changes saved.');
  ui.tab=first?'today':'setup';render();
}
function addHabit(){
  const n=($('#new-name').value||'').trim();if(!n){toast('Give the habit a name first.');return}
  const kind=$('#new-kind').value;
  draft.habits.push({id:'c_'+Date.now().toString(36),name:n,ar:'',area:$('#new-area').value,kind:kind,type:'tick',target:7,per:'week',amount:KINDS[kind].unit?10:0,goal:0,who:['p1','p2'],joint:false,tags:null,on:true});
  draftDirty=true;render();
}
async function resetAll(){
  ui.confirmReset=false;
  try{localStorage.removeItem(MIRROR)}catch(e){}
  if(DB){try{await Promise.all(['config','log-p1','log-p2','val-p1','val-p2','exp-p1','exp-p2'].map(id=>DB.doc('habit/'+id).delete()))}catch(e){}}
  const s=makeSample();S=s.cfg;L=s.logs;V=s.vals;E=s.exp;F=s.fix;B=null;mode='sample';draft=null;draftDirty=false;ui.tab='today';ui.dayOff=0;ui.weekOff=0;setSync('sample');render();
}
async function exportCsv(){
  let rows=['date,person,habit,life_area,value'];
  S.people.forEach(p=>{
    const log=L[p.id]||{};
    Object.keys(log).sort().forEach(d=>log[d].forEach(hid=>{
      const h=S.habits.find(x=>x.id===hid);if(!h)return;
      rows.push([d,p.name,h.name,areaName(h.area),(function(){const v=getVal(p.id,d,hid);return v==null?'':(typeof v==='object'?tagName(v.t)+(v.n?': '+v.n:''):v)})()].map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(','));
    }));
  });
  try{
    const blob=new Blob(['\ufeff'+rows.join('\n')],{type:'text/csv;charset=utf-8'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='habit-checkins.csv';
    document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);
  }catch(e){toast('Could not save the file.')}
}

/* ---------- render + events ---------- */
function renderStatus(){
  const c=$('#status');if(!c)return;
  const m={sample:['Sample data',''],local:['Saved on this device','warn'],synced:['Shared and synced','ok']}[sync]||['Not synced','warn'];
  c.className='chip '+m[1];c.querySelector('span').textContent=sync==='local'&&mode==='db'?'Not synced':m[0];trDom();
}
function renderTop(){
  const w=$('#who');if(!w)return;
  const items=[['p1',pname('p1'),'var(--p1)'],['p2',pname('p2'),'var(--p2)'],['both','Together','var(--brand)']];
  w.innerHTML=items.map(i=>'<button data-act="who" data-w="'+i[0]+'" aria-pressed="'+(ui.who===i[0])+'"><span class="dot" style="background:'+i[2]+'"></span><span style="overflow:hidden;text-overflow:ellipsis">'+esc(i[1])+'</span></button>').join('');
  w.hidden=ui.tab==='setup'||ui.tab==='profile';
  const lb=$('#lang');if(lb)lb.textContent=ui.lang==='ar'?'English':'عربي';
  const tabs=[['today','Today','t_today'],['week','Week','t_week'],['money','Money','t_money'],['dash','Dashboard','t_dash'],['impact','Impact','t_impact'],['setup','Setup','t_setup']];
  $('#tabs').innerHTML=tabs.map(t=>'<button data-act="tab" data-t="'+t[0]+'"'+(ui.tab===t[0]?' aria-current="page"':'')+'>'+svgi(t[2])+t[1]+'</button>').join('');
}
function render(){
  applyScene();
  document.body.classList.toggle('is-sample',mode==='sample');document.body.style.setProperty('--sample-lbl','"'+T2('Sample data','بيانات تجريبية')+'"');
  renderStatus();renderTop();
  if(ui.tab!=='money'&&ui.sheet&&ui.sheet.page)ui.sheet=null;
  const fn={today:viewToday,week:viewWeek,money:viewMoney,dash:viewDash,impact:viewImpact,setup:viewSetup,profile:viewProfile}[ui.tab];
  const y0=window.scrollY,sEl=$('#sheet');
  if(sEl&&sEl.parentNode!==document.body)document.body.appendChild(sEl);
  $('#view').innerHTML=(ui.tab==='setup'&&mode!=='sample'?'':banner())+(['today','week','dash','impact'].indexOf(ui.tab)>=0?quoteBanner(ui.tab):'')+fn();
  if(ratesDue()){if(!(ui.sheet&&ui.sheet.type==='rates'))ui.sheet={type:'rates',f:{}}}else if(ui.sheet&&ui.sheet.type==='rates')ui.sheet=null;
  const mp=$('#mpage');
  if(sEl){if(mp&&ui.sheet&&ui.sheet.page){mp.appendChild(sEl);sEl.classList.add('as-page')}else sEl.classList.remove('as-page')}
  post();renderSheet();checkTrophies();trDom();
  /* wide tables open at the current month (last column) */
  document.querySelectorAll('.wt-box').forEach(w=>{w.scrollLeft=w.scrollWidth});
  document.querySelectorAll('.cat-wrap').forEach(w=>{w.scrollLeft=(document.documentElement.dir==='rtl'?-1:1)*w.scrollWidth});
  if(window.scrollY!==y0)window.scrollTo(0,y0);
}
function post(){
  const nds=document.querySelectorAll('.needle');
  nds.forEach(n=>{requestAnimationFrame(()=>requestAnimationFrame(()=>{n.style.transform='rotate('+n.dataset.ang+'deg)'}))});
}
function toggle(pid,hid,dstr,el){
  const h=S.habits.find(x=>x.id===hid);if(!h||h.kind==='underlimit')return;
  const was=isTicked(h,pid,dstr);
  tickSet(hTargets(h,pid),dstr,hid,!was);
  const sc=window.scrollY;
  render();
  window.scrollTo(0,sc);
  const sel='[data-act="toggle"][data-p="'+pid+'"][data-h="'+hid+'"][data-d="'+dstr+'"]';
  const b=document.querySelector(sel);
  if(b&&!was){const c=b.querySelector('.chk');if(c)c.classList.add('pop')}
}
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-act]');if(!t)return;
  const a=t.dataset.act;
  if(a==='toggle'){toggle(t.dataset.p,t.dataset.h,t.dataset.d,t)}
  else if(a==='plus'||a==='minus'){stepVal(t.dataset.p,t.dataset.h,t.dataset.d,a==='plus'?1:-1)}
  else if(a==='num'){openSheet('num',t.dataset.p,t.dataset.h,t.dataset.d)}
  else if(a==='tag'){openSheet('tag',t.dataset.p,t.dataset.h,t.dataset.d)}
  else if(a==='exp'){openSheet('exp',t.dataset.p,t.dataset.h,t.dataset.d)}
  else if(a==='expadd')expAddFromSheet();
  else if(a==='expday'){const sh=ui.sheet;if(sh&&sh.type==='exp'&&!sh.edit){collectSf();const cur=sh.eid?String(sfv(sh,'ed',sh.d)):sh.d,dt=pd(cur);dt.setDate(dt.getDate()+(+t.dataset.n||0));const nd=ds(dt);if(nd>ds(today()))return;if(sh.eid){sfSet('ed',nd);renderSheet()}else expPickDate(nd)}}
  else if(a==='expty'){const sh=ui.sheet;if(sh){collectSf();sh.ty=t.dataset.v;if(eSkip({ty:sh.ty})){sh.cat='';sh.sc=''}renderSheet()}}
  else if(a==='exploan'){const sh=ui.sheet;if(sh){collectSf();sfSet('loan',t.dataset.v);renderSheet()}}
  else if(a==='expbill'){const sh=ui.sheet;if(sh){collectSf();sh.bill=t.dataset.v;renderSheet()}}
  else if(a==='ratessave')ratesSave();
  else if(a==='catcell')txlOpenCat(t.dataset.k,t.dataset.ym);
  else if(a==='budrow')txlOpenLine(t.dataset.k,t.dataset.ym);
  else if(a==='expcur'){const sh=ui.sheet;if(sh){collectSf();sh.cur=t.dataset.v;renderSheet()}}
  else if(a==='expcat'){const sh=ui.sheet;if(sh){collectSf();sh.cat=sh.cat===t.dataset.v?'':t.dataset.v;sh.sc='';renderSheet()}}
  else if(a==='expsc'){const sh=ui.sheet;if(sh){collectSf();sh.sc=sh.sc===t.dataset.v?'':t.dataset.v;renderSheet()}}
  else if(a==='expac'){const sh=ui.sheet;if(sh){collectSf();sh.ac=sh.ac===t.dataset.v?'':t.dataset.v;renderSheet()}}
  else if(a==='expedit')expStartEdit(t.dataset.p,t.dataset.id);
  else if(a==='expcancel')expCancelEdit();
  else if(a==='expnone'){const sh=ui.sheet;const h=sh&&S.habits.find(x=>x.id===sh.hid);if(h){const tg=hTargets(h,wPid(h,sh.pid));valSet(tg,sh.d,h.id,0);tickSet(tg,sh.d,h.id,true);syncUnder(sh.d);const sc=window.scrollY;render();window.scrollTo(0,sc)}}
  else if(a==='expcatsedit'){if(ui.sheet){collectSf();ui.sheet.edit=!ui.sheet.edit;renderSheet()}}
  else if(a==='expcattoggle'){if(canEditBud()){budEnsure();const c=B.cats.find(x=>x.k===t.dataset.v);if(c){c.on=(c.on===false);if(ui.sheet&&ui.sheet.cat===c.k&&c.on===false)ui.sheet.cat='';budSave();collectSf();renderSheet()}}}
  else if(a==='expcatadd')catAdd();
  else if(a==='expsubadd')subAdd();
  else if(a==='noop'){}
  else if(a==='mdper'){ui.mdPer=t.dataset.v;render()}
  else if(a==='spendper'){ui.spendPer=t.dataset.v;render()}
  else if(a==='budper'){ui.budPer=t.dataset.v;render()}
  else if(a==='spper'){ui.spPer=t.dataset.v==='month'?'month':'week';render()}
  else if(a==='spday'){ui.mday=Math.max(-90,Math.min(0,Number(t.dataset.v)||0));ui.tab='money';ui.mtab='log';ui.sheet=null;render();window.scrollTo(0,0)}
  else if(a==='repper'){ui.repPer=t.dataset.v;render()}
  else if(a==='repsec'){ui.repSec=t.dataset.v;render()}
  else if(a==='ledger')exportLedger(t.dataset.v);
  else if(a==='fullexp')fullMoneyExport(t.dataset.v);
  else if(a==='setme'){meSet(t.dataset.p);render()}
  else if(a==='pfopen'){ui.pf=t.dataset.p;ui.tab='profile';render();window.scrollTo(0,0)}
  else if(a==='pfnext'){const pid=ui.pf==='p2'?'p2':'p1',n=pfFirstTodo(pid);if(!n){toast('Everything is answered. Thank you.');return}
    pfSetOpen(n.sec,true);const d=document.querySelector('details.pfsec[data-sec="'+n.sec+'"]');if(d)d.open=true;const q=document.querySelector('[data-qid="'+n.q+'"]');if(q)q.scrollIntoView({behavior:'smooth',block:'center'})}
  else if(a==='pfwho'){ui.pf=t.dataset.p;render()}
  else if(a==='pfcopy'){const tx=pfText(ui.pf==='p2'?'p2':'p1');(navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(tx):Promise.reject()).then(()=>toast('Your answers are copied.'),()=>toast('Could not copy. Select the answers and copy by hand.'))}
  else if(a==='openfix'){ui.tab='money';ui.mtab='fix';ui.sheet=null;render();window.scrollTo(0,0)}
  else if(a==='openbud'){ui.tab='money';ui.mtab='bud';ui.sheet=null;render();window.scrollTo(0,0)}
  else if(a==='bdtog'){collectSf();ui.bdopen=ui.bdopen||{};ui.bdopen[t.dataset.v]=!ui.bdopen[t.dataset.v];renderSheet()}
  else if(a==='mtab'){ui.tab='money';ui.mtab=t.dataset.v;ui.sheet=null;ui.confirmReset=false;render();window.scrollTo(0,0)}
  else if(a==='mday'){ui.mday=Math.max(-90,Math.min(0,(t.dataset.v==='0'?0:(ui.mday||0)+Number(t.dataset.v))));render()}
  else if(a==='mdayset'){ui.mday=Math.max(-90,Math.min(0,Number(t.dataset.v)||0));render();window.scrollTo(0,0)}
  else if(a==='mlogedit'){const sp=spendHabit();if(sp){openSheet('exp',t.dataset.p,sp.id,t.dataset.d);expStartEdit(t.dataset.p,t.dataset.id)}}
  else if(a==='fxmo'){const sh=ui.sheet;if(sh){const n=+t.dataset.n;sh.ym=prevYm(sh.ym,-n);sh.k=null;sh.mode=null;renderSheet()}}
  else if(a==='fxopen'){const sh=ui.sheet;if(sh){collectSf();sh.k=t.dataset.k;sh.mode='pay';sh.pi=null;sh.f={};ui.fxDel=null;ui.fxUndo=null;renderSheet()}}
  else if(a==='fxedit'){const sh=ui.sheet;if(sh){collectSf();sh.k=t.dataset.k;sh.mode='edit';sh.f={};renderSheet()}}
  else if(a==='fxclose'){const sh=ui.sheet;if(sh){sh.k=null;sh.mode=null;sh.pi=null;sh.f={};renderSheet()}}
  else if(a==='fxeditpay'){const sh=ui.sheet;if(sh){collectSf();let q=null;['p1','p2'].forEach(pid=>{const e=((F[pid]||{})[sh.ym]||{})[t.dataset.k];if(e){const pl=Array.isArray(e.p)?e.p:(e.a!=null?[{i:'L',d:e.d,a:e.a,n:''}]:[]);const x=pl.find(y=>y.i===t.dataset.i);if(x)q=x}});
    if(q){ui.fxDel=null;ui.fxUndo=null;sh.k=t.dataset.k;sh.mode='pay';sh.pi=q.i;sh.f={fa:String(q.a),fd:q.d,fn:q.n||''};renderSheet()}}}
  else if(a==='fxsave')fxSaveForm(t.dataset.k);
  else if(a==='fxeditsave')fxEditSave(t.dataset.k);
  else if(a==='fxdelpay'){const sh=ui.sheet;if(sh){ui.fxDel={k:t.dataset.k,i:t.dataset.i};ui.fxUndo=null;renderSheet()}}
  else if(a==='fxdelno'){ui.fxDel=null;renderSheet()}
  else if(a==='fxdelok'){const sh=ui.sheet;if(sh){const gone=fxDelPay(t.dataset.k,sh.ym,t.dataset.i);ui.fxDel=null;ui.fxUndo=gone.length?{k:t.dataset.k,ym:sh.ym,list:gone}:null;renderSheet();render()}}
  else if(a==='fxundo'){const sh=ui.sheet,u=ui.fxUndo;if(sh&&u){fxRestore(u.k,u.ym,u.list);ui.fxUndo=null;toast(T2('Payment restored.','تمت استعادة الدفعة.'));renderSheet();render()}}
  else if(a==='fxquick'){const sh=ui.sheet;if(sh){fxQuick(t.dataset.k,sh.ym);renderSheet();render()}}
  else if(a==='fxbillclose'){const sh=ui.sheet;if(sh){fxSetClosed(t.dataset.k,sh.ym,true);renderSheet();render()}}
  else if(a==='fxreopen'){const sh=ui.sheet;if(sh){fxSetClosed(t.dataset.k,sh.ym,false);renderSheet();render()}}
  else if(a==='budsave')budSaveForm();
  else if(a==='acadd')acctAdd();
  else if(a==='acdel'){if(canEditBud()){budEnsure();B.accts=B.accts.filter(x=>x.k!==t.dataset.v);budSave();collectSf();renderSheet()}}
  else if(a==='lineadd')lineAdd();
  else if(a==='expdel'){const sh=ui.sheet;if(sh){const h=S.habits.find(x=>x.id===sh.hid);if(h){if(sh.eid===t.dataset.id){sh.eid=null;sh.epid=null}expDel(t.dataset.p,h,sh.d,t.dataset.id);const sc=window.scrollY;render();window.scrollTo(0,sc)}}}
  else if(a==='sheettag'){if(ui.sheet){const n=$('#sheet-note');if(n)ui.sheet.note=n.value;ui.sheet.tag=t.dataset.v;renderSheet()}}
  else if(a==='sheetsave')sheetSave();
  else if(a==='sheetclear')sheetClear();
  else if(a==='sheetclose')closeSheet();
  else if(a==='lang'){ui.lang=ui.lang==='ar'?'en':'ar';try{localStorage.setItem('istiqama.lang',ui.lang)}catch(e){}render()}
  else if(a==='tab'){ui.tab=t.dataset.t;ui.confirmReset=false;render();window.scrollTo(0,0)}
  else if(a==='who'){ui.who=t.dataset.w;if((ui.who==='p1'||ui.who==='p2')&&!meKnown())meSet(ui.who);render()}
  else if(a==='day'){ui.dayOff=Math.min(0,ui.dayOff+(+t.dataset.n));render()}
  else if(a==='week'){ui.weekOff=Math.min(0,ui.weekOff+(+t.dataset.n));render()}
  else if(a==='trend'){ui.trend=t.dataset.v;render()}
  else if(a==='period'){ui.period=t.dataset.v;render()}
  else if(a==='setfold'||a==='setfoldall'){
    ui.fold=ui.fold||{};
    document.querySelectorAll('[data-fold]').forEach(el=>{
      const k=el.dataset.fold;
      if(a==='setfold'&&k!==t.dataset.v)return;
      const shut=a==='setfold'?!isShut(k):t.dataset.v==='shut';
      ui.fold[k]=shut;el.classList.toggle('fold-shut',shut);
      const b=el.querySelector(':scope > .card-h .foldbtn,:scope > .ph .foldbtn,:scope > .agh .foldbtn');if(b)b.setAttribute('aria-expanded',String(!shut));
    });
  }
  else if(a==='savesetup')saveSetup();
  else if(a==='addhabit')addHabit();
  else if(a==='csv')exportCsv();
  else if(a==='copylink'){
    const link=shareLink();
    const ok=()=>toast('Link copied. Send it to your partner.');
    const fb=()=>{const i=document.getElementById('sharelink');if(i){i.focus();i.select();try{document.execCommand('copy');ok()}catch(e){toast('Press and hold the link to copy it.')}}};
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(link).then(ok,fb);else fb();
  }
  else if(a==='sharelink'){try{navigator.share({title:'Our habit tracker',url:shareLink()})}catch(e){}}
  else if(a==='reset1'){ui.confirmReset=true;render()}
  else if(a==='reset0'){ui.confirmReset=false;render()}
  else if(a==='reset2')resetAll();
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&ui.sheet)closeSheet();
  else if(e.key==='Enter'&&ui.sheet&&ui.sheet.type==='exp'&&e.target&&(e.target.id==='exp-amt'||e.target.id==='exp-note')){e.preventDefault();expAddFromSheet()}
});
document.addEventListener('toggle',e=>{const d=e.target;if(d&&d.classList&&d.classList.contains('cn-person')){(ui.cnOpen||(ui.cnOpen={}))[d.dataset.key]=d.open}},true);
document.addEventListener('input',e=>{const t=e.target;if(t.dataset&&t.dataset.f)onSetupInput(t);if(t.dataset&&t.dataset.bt)budTri(t);else if(t.dataset&&t.dataset.sf&&/^rt-/.test(t.dataset.sf))budRatesChanged()});
document.addEventListener('change',e=>{if(e.target.id==='exp-lk'){expLinkChosen(e.target.value);return}if(e.target.id==='exp-date'&&ui.sheet&&ui.sheet.type==='exp'&&!ui.sheet.eid){expPickDate(e.target.value);return}if(e.target.dataset&&e.target.dataset.f)onSetupInput(e.target)});
let tipHide;
document.addEventListener('pointerover',e=>{
  const t=e.target.closest&&e.target.closest('[data-tip]');
  if(t){showTip(t.getAttribute('data-tip'),e.clientX,e.clientY);if(e.pointerType==='touch'){clearTimeout(tipHide);tipHide=setTimeout(hideTip,2200)}}
});
document.addEventListener('pointermove',e=>{
  const svg=e.target.closest&&e.target.closest('svg[data-chart]');
  if(svg){
    const c=charts[svg.dataset.chart];if(!c)return;
    const r=svg.getBoundingClientRect(),vx=(e.clientX-r.left)/r.width*c.W;
    let bi=0,bd=1e9;for(let i=0;i<c.n;i++){const d=Math.abs(c.x(i)-vx);if(d<bd){bd=d;bi=i}}
    const ln=document.getElementById(svg.dataset.chart+'-x');
    if(ln){ln.setAttribute('x1',c.x(bi));ln.setAttribute('x2',c.x(bi));ln.setAttribute('opacity','1')}
    showTip('<b>Week of '+esc(c.labels[bi])+'</b>'+c.series.map(s=>'<br>'+esc(s.name)+': '+(s.vals[bi]==null?'no data':Math.round(s.vals[bi]*100)+'%')).join(''),e.clientX,e.clientY);
    if(e.pointerType==='touch'){clearTimeout(tipHide);tipHide=setTimeout(hideTip,2200)}
    return;
  }
  const t=e.target.closest&&e.target.closest('[data-tip]');
  if(t&&$('#tip').classList.contains('show'))showTip(t.getAttribute('data-tip'),e.clientX,e.clientY);
});
document.addEventListener('pointerout',e=>{
  const rel=e.relatedTarget;
  if(!rel||!(rel.closest&&rel.closest('[data-tip],svg[data-chart]'))){
    hideTip();document.querySelectorAll('line[id$="-x"]').forEach(l=>l.setAttribute('opacity','0'));
  }
});

/* Presentation only: Cairo-day hybrid photo / lightweight SVG scene (no stored state). */
const SCENE_PHOTOS=[
 'photo-1500534623283-312aade485b7',
 'photo-1441974231531-c6227db76b6e',
 'photo-1519501025264-65ba15a82390',
 'photo-1500534314209-a25ddb2bd429',
 'photo-1548013146-72479768bada',
 'photo-1509316975850-ff9c5deb0cd9'
];
const SCENE_VECTOR=[
 '<path d="M0 100L50 78 88 98 152 49 216 100 272 62 340 111 400 88V160H0Z" fill="#B481E5" opacity=".8"/><path d="M0 145L82 100 141 133 207 90 284 138 400 100V160H0Z" fill="#553077"/>',
 '<path d="M0 150 Q70 115 142 130 T285 120 T400 129V160H0Z" fill="#2C755E"/><path d="M21 131V68m0 2-15 22m15-13 14 13M76 136V43m0 11-19 27m19-13 25 24M151 136V53m0 9-19 27m19-10 19 16M326 141V58m0 6-20 32m20-19 18 27" fill="none" stroke="#184C42" stroke-width="12" stroke-linecap="round"/>',
 '<path d="M0 150V105h25V90h17v60h13V63h36v87h11V95h31v55h19V70h34v80h18v-56h36v56h13V46h31v104h25V83h25v67h13V101h38v49H400V160H0Z" fill="#30244E"/>',
 '<path d="M0 135Q90 70 170 121T400 112V160H0Z" fill="#9251C3"/><path d="M0 153Q85 116 175 143T400 131V160H0Z" fill="#4B296D"/>',
 '<path d="M0 160V93Q0 56 40 56T80 93V160M106 160V80Q106 37 158 37T210 80V160M243 160V95Q243 59 287 59T331 95V160" fill="none" stroke="#C58BCE" stroke-width="19"/><path d="M0 153H400" stroke="#573666" stroke-width="20"/>',
 '<path d="M0 144Q65 100 121 129T246 121T400 105V160H0Z" fill="#B86B87"/><path d="M0 157Q90 130 170 148T325 133T400 145V160H0Z" fill="#65446B"/>'
];
function applyScene(){
  const header=document.querySelector('.top');if(!header)return;
  let key;
  try{key=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Cairo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}catch(e){key=ds(today())}
  if(header.dataset.sceneDay===key)return;
  const kp=key.split('-').map(Number);
  const n=Math.floor(Date.UTC(kp[0],kp[1]-1,kp[2])/86400000)%SCENE_PHOTOS.length;
  header.dataset.sceneDay=key;header.dataset.scene=String(n);
  const photo='https://images.unsplash.com/'+SCENE_PHOTOS[n]+'?auto=format&fit=crop&w=1600&q=78';
  header.style.setProperty('--scene-photo','url("'+photo+'")');
  const sun=n===2?'#FFCEBA':'#FFE3B0';
  const art='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 160" preserveAspectRatio="xMidYMid slice"><circle cx="327" cy="74" r="24" fill="'+sun+'" opacity=".7"/>'+SCENE_VECTOR[n]+'</svg>';
  header.style.setProperty('--scene-art','url("data:image/svg+xml,'+encodeURIComponent(art)+'")');
  document.body.dataset.scene=String(n);
}

/* ---------- boot ---------- */
/* a copy of the built-in demo data that an older build left on this device must never be treated as real */
function isDemoMirror(m){
  try{if(m.S&&m.S.smp)return true;return ['p1','p2'].some(p=>Object.keys((m.E||{})[p]||{}).some(d=>Object.keys(m.E[p][d]).some(id=>/^s\d+$/.test(id))))}catch(e){return false}
}
function boot(){
  let m=loadMirror();
  if(m&&isDemoMirror(m))m=null;
  if(m){S=migrate(m.S);ensureUnder(S);L=m.L;V=m.V||{p1:{},p2:{}};E=m.E||{p1:{},p2:{}};F=m.F||{p1:{},p2:{}};PR=m.PR||{p1:{},p2:{}};B=budNorm(m.B);mode='local';sync='local';sweepMaps(S.start,L,V,E);legacySpend();resyncUnder(60)}
  else{const s=makeSample();S=s.cfg;L=s.logs;V=s.vals;E=s.exp;F=s.fix;B=null;mode='sample';sync='sample';resyncUnder(120)}
  render();
  attachDb();
  loadContent();loadCoachNote();
}
boot();
/* Keep the shared Cairo-day background current when a tab remains open overnight. */
setInterval(applyScene,60000);
/* A new day starts at midnight: if the app is left open overnight, move Today to the new date. */
let lastDay=ds(today());
setInterval(()=>{const d=ds(today());if(d!==lastDay){lastDay=d;if(ui.dayOff===0&&!(ui.sheet&&ui.sheet.type==='exp'&&(($('#exp-amt')||{}).value||''))){ui.sheet=ui.sheet&&ui.sheet.type==='exp'?null:ui.sheet;render()}}},30000);
window.__istiqama={utilRestoreOnce:utilRestoreOnce,render:render,ui:ui,get S(){return S},get L(){return L},get mode(){return mode},get E(){return E},get B(){return B},get F(){return F},calc:{monthAct:monthAct,lineStatus:lineStatus,ledgerCsv:ledgerCsv,spLim:spLim,monthTotals:monthTotals,fxState:fxState,fxSummary:fxSummary,bud:bud,expSum:expSum}};
})();
